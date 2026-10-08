// Live channel protocol on the socket holder's side — once for every holder (both
// watchdogs and the pi extension). Field notes: skills/standing/references/channel.md.
//
// Rules, each a line of code below:
//   an attempt counts FROM CONSTRUCTION, never from onopen: a token the service forgot
//     is refused at the upgrade and onopen never comes;
//   dead-token codes pass any fence and cancel a scheduled reopen: the real code comes
//     with close and may be late behind the 1006 guess from error;
//   three fast drops ask /version before blaming the token: service up — a word to the
//     doer and slower reopening; service silent — a rollout, keep the token;
//   a connection silent for more than three hello ping intervals is reopened at the
//     same address, aloud (graph @nks/nks-dev, node #5397); no ping seen — no timer.

// Namespace import: the module links where these exports are absent. Bun does not
// fill the channel — its pings come as a socket event (below).
import * as diagnostics from "node:diagnostics_channel";

import { CHANNEL, envName } from "../delivery/index.ts";
import { words } from "./lang.ts";

/** The channel where undici (Node's WebSocket) publishes every incoming protocol ping. */
const PING_CHANNEL = "undici:websocket:ping";
/** How many ping intervals a connection may stay silent before it counts as hung. */
const SILENT_INTERVALS = 3;
/**
 * Own silence floor: with a 5 s ping three intervals are shorter than a harness's
 * event-loop pause (graph @nks/nks-dev, node #5380).
 */
const SILENT_FLOOR_MS = Number(process.env[envName("CHANNEL_SILENT_FLOOR_MS")]) || 60_000;

/** Closes after which the same token never reopens. */
export const DEAD_TOKEN_CODES = [4001, 4002];
/**
 * Eviction: another holder owns the channel. Not a dead token and no reason to reopen —
 * the same address would evict the new holder and it us (observed ping-pong). The
 * holder yields aloud at once; retaking only on the human's word (graph @nks/nks-dev,
 * nodes #5033, #6550).
 */
export const EVICTED_CODE = 4000;
/** Rollout: the instance goes away, a longer breath. */
export const ROLLOUT_CODE = 4003;

const FAST_DROP_MS = 5000;
const ERROR_GUESS_DELAY_MS = 500;
/**
 * Reopen pauses while the service is up and the socket is cut: grow to the ceiling,
 * reset by a socket living past a fast drop (graph @nks/nks-dev, node #4664).
 */
const FLAP_PAUSES_MS = (process.env[envName("CHANNEL_FLAP_MS")] || "5000,10000,20000,40000,60000")
  .split(",")
  .map(Number)
  .filter((n) => Number.isFinite(n) && n > 0);

/** Both schemes: with `wss:` alone a ws address never reached the service. */
function httpOrigin(socketUrl: string): string {
  return new URL(socketUrl).origin.replace(/^wss:/, "https:").replace(/^ws:/, "http:");
}

export function versionUrl(socketUrl: string): string {
  return httpOrigin(socketUrl) + "/api/version";
}

/**
 * The status address is derived, not stored as a second secret. A fallback: a string
 * issued beside the socket is always right.
 */
export function statusUrl(socketUrl: string): string {
  return socketUrl
    .replace(/^wss:/, "https:")
    .replace(/^ws:/, "http:")
    .replace("/channel/ws/", "/channel/status/");
}

export async function serviceUp(socketUrl: string): Promise<{ version?: string } | null> {
  return fetch(versionUrl(socketUrl), { signal: AbortSignal.timeout(5000) })
    .then((r) => (r.ok ? (r.json() as Promise<{ version?: string }>) : null))
    .catch(() => null);
}

/**
 * Advice to the doer on a dead token — one for every holder and code: connect opens
 * even what is gone, while mint on a recreated channel gives 409 (graph @nks/nks-dev,
 * node #5189).
 */
export function deadTokenAdvice(code: number): string {
  return words(CHANNEL).deadTokenAdvice(code);
}

export type FrameOrigin = "platform" | "human" | "sibling" | "peer";

/**
 * Who speaks — by provenance as the platform observed it. A person speaks from their
 * own role or as themselves; a sibling is another standing of the reader's role; the
 * rest is a doer of another role. myKarta — the reader's role. The stable platform
 * sign is the ABSENCE OF AN AUTHOR; an auth literal (none, platform) is the second.
 */
export function classifyOrigin(frame: Frame, myKarta?: string | number | null): FrameOrigin {
  const p = frame.provenance ?? {};
  // Only in a room is a missing author the platform's word; elsewhere a missing
  // from_standing is honest silence, not a claim (graph @nks/nks-dev, node #2287).
  const noAuthor = p.via === "room" && p.from_karta_seq == null && !p.from_standing;
  if (p.via === "platform" || p.auth === "none" || p.auth === "platform" || noAuthor)
    return "platform";
  if (p.as_person === true) return "human";
  if (p.from_karta_seq != null && p.user_karta_seq != null && p.from_karta_seq === p.user_karta_seq)
    return "human";
  if (myKarta != null && p.from_karta_seq != null && String(p.from_karta_seq) === String(myKarta))
    return "sibling";
  return "peer";
}

/**
 * A direct word — not a case frame, graph event or platform: a word of a person or a
 * doer with an author. It never joins a batch: it comes separately and whole.
 */
export function isDirectWord(frame: Frame | null | undefined): boolean {
  if (frame?.type !== "message") return false;
  const f = frame as Record<string, unknown>;
  if (f.room || (typeof f.event_kind === "string" && f.event_kind.startsWith("room.")))
    return false;
  const p = frame.provenance ?? {};
  if (p.via === "graph" || p.via === "room") return false;
  const origin = frame.origin ?? classifyOrigin(frame);
  if (origin === "platform") return false;
  return origin === "human" || !!p.from_standing || p.from_karta_seq != null;
}

/** A channel seat in hello (observed on the live server, bridge 6.11.0). */
export interface HelloStanding {
  karta_seq?: number;
  pending?: number;
  realm?: string;
  standing?: string;
  standing_id?: string;
}

export interface Frame {
  type?: string;
  body?: unknown;
  id?: string;
  received_at?: string;
  stale?: boolean;
  content_type?: string;
  body_chars?: number;
  /** How the body was read: "history" — the bridge read a cut frame in full; "truncated: …" — it could not. */
  body_read?: string;
  /** The frame's address — the channel seat it is for (#5838): seat id, full address, graph, role. */
  to_standing_id?: string;
  to_standing?: string;
  realm?: string;
  karta_seq?: number;
  /** hello: all seats of the channel — one per graph. */
  standings?: HelloStanding[];
  /** Who speaks, by provenance. Set by the bridge. */
  origin?: FrameOrigin;
  /** Body of a two-phase word addressed to the seat (#6574). Set by the bridge that saw its word in flight. */
  addressed?: boolean;
  provenance?: {
    from_standing?: string;
    from_karta_seq?: number;
    auth?: string;
    via?: string;
    user?: string;
    user_karta_seq?: number;
    in_reply_to?: string;
    as_person?: boolean;
    [k: string]: unknown;
  };
  [k: string]: unknown;
}

export interface HoldOptions {
  url: string;
  /** Every frame: raw text and parsed JSON, if it parsed. */
  onFrame: (raw: string, frame: Frame | null) => void;
  /** Dead token: holding is over, no return with the same token. Called once. */
  onDeadToken: (code: number) => void;
  /** Eviction: another holder listens on the seat, holding is over, the binding intact. Called once; absent — as a dead token. */
  onEvicted?: (code: number) => void;
  /** Drops while the service is up: holding goes slower, the token question to the doer. Once per run of drops. */
  onServiceAlive: (version: string) => void;
  /** Service notes that must not wake. */
  onNote?: (text: string) => void;
  /** The connection hung and reopens: frames may be lost — louder than a note. Absent — as onNote. */
  onHung?: (text: string) => void;
  /** The socket dropped and reopens at the same address: no hearing until the new hello (the address may have been turned). */
  onDropped?: () => void;
}

export interface Holder {
  /** Let the socket go: no more reopens or frames. Idempotent. */
  close(reason?: string): void;
  /**
   * Hold the socket until evicted (daemon change, graph @nks/nks-dev, node #6586):
   * frames to onFrame, holder words silent, any close ends holding with its code,
   * no reopen. No socket — onGone at once.
   */
  handOff(onFrame: (raw: string) => void, onGone: (code: number) => void): void;
  /** Whether the socket is alive (open or opening). */
  readonly alive: boolean;
  /** Last sign of the service (ping or frame), epoch ms; 0 — none. An open attempt is not a sign. */
  readonly heardAt: number;
}

/**
 * Keep the socket open, reopening on drops, and deliver frames. What to do with a
 * frame and how loudly to leave is the caller's choice.
 */
export function holdSocket(o: HoldOptions): Holder {
  let fastDrops = 0;
  let slowdown = 0; // pauses in a row with the service up and the socket cut
  let rolloutTold = false; // rollout note once per outage; hello ends it (#6726)
  let dead = false;
  let stopped = false;
  let retry: ReturnType<typeof setTimeout> | null = null;
  let ws: WebSocket | null = null;
  let handing: { onFrame: (raw: string) => void; onGone: (code: number) => void } | null = null;
  // Liveness: last sign of the service, interval from hello; the first ping arms the timer.
  let lastLife = 0;
  let heardAt = 0; // like lastLife but without the open mark: last life for the hold record
  let pingMs = 0;
  // Holder-wide: a connection hung before its own first ping would never be caught otherwise.
  let runtimeSeesPings = false;
  let lastTick = 0;
  let watch: ReturnType<typeof setInterval> | null = null;
  // Node 22 does not name the ping's socket, Node 26 does: a foreign ping may only
  // extend life, never declare the living dead — the bridge has one socket.
  const onPing = (m: unknown): void => {
    const from = (m as { websocket?: unknown } | null)?.websocket;
    if (!ws || (from !== undefined && from !== ws)) return;
    lastLife = heardAt = Date.now();
    runtimeSeesPings = true;
  };
  diagnostics.subscribe?.(PING_CHANNEL, onPing);
  const unsubscribePing = (): void => {
    diagnostics.unsubscribe?.(PING_CHANNEL, onPing);
  };
  const stopWatch = (): void => {
    if (watch) clearInterval(watch);
    watch = null;
  };

  function open(): void {
    if (stopped) return;
    const startedAt = Date.now(); // from construction, NOT in onopen — see channel.md
    const sock = new WebSocket(o.url);
    ws = sock;
    stopWatch();
    lastLife = startedAt;
    let gone = false; // a drop is handled once, however it came
    // Bun does not fill the diagnostics channel but sends a nonstandard socket ping event.
    sock.addEventListener("ping", () => {
      if (ws !== sock) return;
      lastLife = heardAt = Date.now();
      runtimeSeesPings = true;
    });

    sock.addEventListener("message", (e: MessageEvent) => {
      if (stopped || ws !== sock) return;
      lastLife = heardAt = Date.now();
      const raw = typeof e.data === "string" ? e.data : words(CHANNEL).binaryFrame();
      if (handing) return handing.onFrame(raw);
      let frame: Frame | null = null;
      if (typeof e.data === "string") {
        try {
          frame = JSON.parse(raw) as Frame;
        } catch {
          /* not JSON — delivered as is */
        }
      }
      if (frame?.type === "hello") {
        rolloutTold = false;
        watchLife(Number(frame.ping_interval_seconds) * 1000);
      }
      o.onFrame(raw, frame && typeof frame === "object" ? frame : null);
    });
    // A drop at the upgrade gives ONLY error on some runtimes, no close (measured on
    // Node 22): a holder waiting for close alone dies with the empty event loop.
    // The delay leaves close a chance to name its code — dead-token codes come by it.
    sock.addEventListener("error", () =>
      setTimeout(() => void dropped(1006), ERROR_GUESS_DELAY_MS),
    );
    sock.addEventListener("close", (e) => void dropped((e as unknown as { code: number }).code));

    function watchLife(interval: number): void {
      stopWatch();
      if (!(interval > 0)) return;
      pingMs = interval;
      const every = Math.max(pingMs, 250);
      lastTick = Date.now();
      watch = setInterval(() => {
        const now = Date.now();
        // The timer is late by intervals — the process slept, not the service: restart the measure.
        if (now - lastTick > 2 * every + 1000) lastLife = now;
        lastTick = now;
        if (stopped || ws !== sock || !runtimeSeesPings) return;
        const silent = now - lastLife;
        if (silent <= Math.max(SILENT_INTERVALS * pingMs + 1000, SILENT_FLOOR_MS)) return;
        stopWatch();
        // "Read" on the server means "written to the socket" (#5380): frames sent into
        // a hung connection will not come back in hello.
        (o.onHung ?? o.onNote)?.(words(CHANNEL).hung(Math.round(silent / 1000), pingMs / 1000));
        try {
          sock.close();
        } catch {
          /* nothing to close */
        }
        void dropped(1006);
      }, every);
      watch.unref?.();
    }

    function yieldTo(cb: (code: number) => void, code: number): void {
      if (dead) return;
      dead = true;
      stopped = true;
      if (retry) clearTimeout(retry);
      stopWatch();
      unsubscribePing();
      cb(code);
    }

    async function dropped(code: number): Promise<void> {
      if (stopped || ws !== sock) return;
      stopWatch();
      if (handing) {
        const h = handing;
        handing = null;
        stopped = true;
        ws = null;
        unsubscribePing();
        return h.onGone(code);
      }
      // A dead token beats any drop guess and eviction: it always passes the `gone`
      // fence and cancels a scheduled reopen.
      if (DEAD_TOKEN_CODES.includes(code)) return yieldTo(o.onDeadToken, code);
      // Eviction — yield aloud at once, never reopening; passes the fence likewise.
      if (code === EVICTED_CODE) return yieldTo(o.onEvicted ?? o.onDeadToken, code);
      if (gone) return;
      gone = true;
      o.onDropped?.();
      const fast = Date.now() - startedAt < FAST_DROP_MS;
      fastDrops = fast ? fastDrops + 1 : 0;
      if (!fast) slowdown = 0; // the socket lived — the run of drops is over
      if (fastDrops >= 3) {
        const up = await serviceUp(o.url);
        if (stopped || ws !== sock) return;
        if (up) {
          // Service up, yet we are cut: the grant is alive, so keep the seat, but say
          // it once per run of drops and reopen less and less often.
          if (slowdown === 0) o.onServiceAlive(String(up.version ?? ""));
          const wait = FLAP_PAUSES_MS[Math.min(slowdown, FLAP_PAUSES_MS.length - 1)] ?? 60_000;
          slowdown++;
          fastDrops = 2; // the next fast drop asks the service again, not the doer
          retry = setTimeout(open, wait);
          return;
        }
        if (!rolloutTold) o.onNote?.(words(CHANNEL).rollout());
        rolloutTold = true;
        fastDrops = 1; // an outage must not grow into a token question
      }
      retry = setTimeout(open, code === ROLLOUT_CODE ? 3000 : 2000);
    }
  }

  open();
  return {
    close(reason = "held no more") {
      stopped = true;
      handing = null;
      stopWatch();
      unsubscribePing();
      if (retry) clearTimeout(retry);
      retry = null;
      const sock = ws;
      ws = null;
      try {
        sock?.close(1000, reason);
      } catch {
        /* nothing to close */
      }
    },
    handOff(onFrame, onGone) {
      // Already dropped and waiting to reopen, or still opening: close — an opening
      // socket would evict the successor's with 4000.
      if (stopped || !ws || ws.readyState !== 1) {
        this.close("handed off without a socket");
        return onGone(0);
      }
      if (retry) clearTimeout(retry);
      retry = null;
      stopWatch();
      handing = { onFrame, onGone };
    },
    get alive() {
      return !stopped && !!ws && (ws.readyState === 0 || ws.readyState === 1);
    },
    get heardAt() {
      return heardAt;
    },
  };
}
