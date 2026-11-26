// The machine's down window (graph @nks/nks-dev, nodes #7700, #8144). The api restarts, and
// every bridge on the machine used to hand its own «retry freely — the server side needs
// attention» to its agent and knock again at its own 1-2-4 s, so dozens of sessions hit a
// server that was already past its memory — the retries were the storm. Now the first
// failure in the down family opens ONE window per server, beside the grant: while it stands
// no bridge knocks; the first knock after it is the machine's one probe (a file lock keeps
// it single); a probe that fails steps a full-jitter ladder capped at a minute, or takes the
// server's own Retry-After where that is longer; any answer under 500 closes the window.
//
// The down family: a connection that was never established (transport.ts — a refused port,
// an unknown host, DNS; not a certificate refusal, which is this machine's to mend) and a
// 502, 503 or 504 of the front line. A connection shut under the request or a timeout says
// nothing about the server — an idle keep-alive the server closed fails the same way
// (#6630), and the call's own repeat serves it; they open no window. A 500 is the server
// judging and failing one call; a 429 is the server's pacing (ratelimit.ts).
//
// Machine-wide means every bridge on the grant directory (`--auth-dir`): the record is keyed
// by server like the grant itself (store.ts). Knocks consult the window through transport.ts
// `post`, and the orchestrator's own short MCP session through windowfetch.ts; any other
// caller with its own HTTP request does not. Nothing stands guard
// between calls: the next knock after the window is the probe, so a machine that calls
// nobody knocks nobody.
import { envName } from "../delivery/index.ts";
import { takeFileLock } from "../shared/seam-entrance.ts";
import { CFG } from "./config.ts";
import { DownError, UpstreamError } from "./errors.ts";
import { clearDown, downProbeLockPath, loadDown, saveDown } from "./store.ts";
import { log } from "./streams.ts";

// Network blips are retried with backoff: unsent calls always, answer-lost ones only when
// they are reads (graph @nks/nks-dev, node #4664): a write has no version fence and would
// land twice. The window's first steps are drawn under the same figures, so a call's own
// retry pause is never shorter than the jitter before it — one blip is still served by that
// retry alone, and the window closes on it.
export const NET_BACKOFF_MS = (process.env[envName("BRIDGE_NET_BACKOFF_MS")] || "1000,2000,4000")
  .split(",")
  .map(Number)
  .filter((n) => Number.isFinite(n) && n >= 0);

/** No pause before a probe is longer than this, however far the ladder has gone. */
export const DOWN_CAP_MS = 60_000;

/** The ceiling of the full-jitter pause before the probe that follows `failures` failures. */
export function downStepMs(failures: number): number {
  const last = NET_BACKOFF_MS.length - 1;
  if (last < 0) return DOWN_CAP_MS;
  const doubling = 2 ** Math.min(600, Math.max(0, failures - last));
  return Math.min(DOWN_CAP_MS, NET_BACKOFF_MS[Math.min(failures, last)] * doubling);
}

/** What a bridge is told to wait while another's probe is out: a nominal figure — the real one is the probe's answer. */
export const PROBE_WAIT_MS = 2000;

/** A knock the window let out. */
export interface Knock {
  /** It went out as the machine's one probe: the lock is held until the knock is answered or fails. */
  probe: boolean;
  release(): void;
}
export type Gate = { refused: false; knock: Knock } | { refused: true; waitMs: number };

const FREE: Knock = {
  probe: false,
  release: () => {},
};

/** Whether a knock may go out now; the probe's lock is taken for whoever may. */
export function admit(): Gate {
  const rec = loadDown();
  if (!rec) return { refused: false, knock: FREE };
  const left = rec.notBefore - Date.now();
  if (left > 0) return { refused: true, waitMs: left };
  // The window's time is up: one knock, the machine's probe — the lock says whose. A lock
  // whose owner died is carried away by the next taker; one older than two knocks is stale.
  const lock = takeFileLock(downProbeLockPath(), 2 * CFG.timeoutMs + 5000);
  if (!lock.held) {
    if (lock.fault === null) return { refused: true, waitMs: PROBE_WAIT_MS };
    // A filesystem refusal is not the server's word: knock, and mind nothing.
    log(`down window: the probe lock is out of reach (${lock.fault}) — knocking anyway`);
  } else log("down window: its time is up — this knock is the machine's one probe");
  return {
    refused: false,
    knock: { probe: true, release: lock.held ? lock.release : FREE.release },
  };
}

// Who goes after an answered knock: the closes the window held (sessionclose.ts) — behind the
// probe, never as it.
const afterAnswer: (() => void)[] = [];
export const onAnswered = (f: () => void): void => void afterAnswer.push(f);

/** The server answered this knock with anything under 500: the window, if this was its probe, is over. */
export function answered(knock: Knock): void {
  try {
    if (knock.probe && loadDown()) {
      log("the server answers again — the down window is closed");
      clearDown();
    }
  } finally {
    knock.release();
  }
  for (const f of afterAnswer) f();
}

/**
 * This knock failed in the down family: open the window or step its ladder. How long before
 * the next probe.
 */
export function failed(knock: Knock, retryAfterMs: number): number {
  try {
    const now = Date.now();
    const rec = loadDown();
    if (rec && !knock.probe) {
      // Another bridge opened the window while this knock was out: the same outage, not a
      // second failure — the ladder keeps its step, the longer wait wins.
      const notBefore = Math.max(rec.notBefore, now + retryAfterMs);
      if (notBefore > rec.notBefore) saveDown({ ...rec, notBefore });
      return Math.max(0, notBefore - now);
    }
    const pause = Math.max(Math.random() * downStepMs(rec?.step ?? 0), retryAfterMs);
    saveDown({ step: (rec?.step ?? 0) + 1, notBefore: now + pause, since: rec?.since ?? now });
    log(`the server is down for the machine — no bridge knocks for ${Math.round(pause)}ms`);
    return pause;
  } finally {
    knock.release();
  }
}

/** The front line's own statuses for a server that is down behind it. */
export const DOWN_HTTP = new Set([502, 503, 504]);

/**
 * A connection that was never established: the server never saw the call (Bun, which OpenCode
 * runs the bridge on, names both a refused port and an unknown host ConnectionRefused).
 */
export const NEVER_LEFT = new Set([
  "ECONNREFUSED",
  "ENOTFOUND",
  "EAI_AGAIN",
  "ERR_SOCKET_BAD_PORT",
  "ConnectionRefused",
]);

/**
 * The server's Retry-After: delay-seconds, an HTTP-date, or the refusal view's own
 * `retry_after_secs` (ratelimit.ts); 0 — none.
 */
export function retryAfterMs(header: string | null, body: string): number {
  const h = (header ?? "").trim();
  const fromHeader = /^\d+(?:\.\d+)?$/.test(h)
    ? Number(h) * 1000
    : (Date.parse(h) || 0) - Date.now();
  let inner = 0;
  try {
    const view = JSON.parse(body) as {
      errors?: { data?: { retry_after_secs?: unknown } }[];
    } | null;
    const secs = Number(view?.errors?.[0]?.data?.retry_after_secs);
    inner = Number.isFinite(secs) ? secs * 1000 : 0;
  } catch {}
  return Math.max(0, fromHeader, inner);
}

/** A 502, 503 or 504: the front line saw the server fall — the call's outcome is not known, and the window opens. */
export function downHttp(
  knock: Knock,
  status: number,
  body: string,
  retryAfter: number,
): DownError {
  return new DownError(
    `upstream HTTP ${status}: ${body}`,
    UpstreamError.UNKNOWN,
    false,
    failed(knock, retryAfter),
  );
}
