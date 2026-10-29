// The seat's pulse (graph @nks/nks-dev, nodes #7529, #7493): the bridge tells the service how
// the agent lives by a socket frame {type: "pulse", state, pending, turn_at?, read_at?, act_at?,
// cycle_at?}. One per socket: the service keeps it on the channel and prints it at every seat of
// it, a seat beside included; a satellite has its own socket. cycle_at (the agent's last tool call)
// and pending (frames held, not given to the agent) are the bridge's own; state, turn_at, read_at
// and act_at (the turn's last movement) come from the harness by method("pulse") — the OpenCode
// plugin and the pi extension; where the harness says nothing (Claude Code, Codex) state is
// unknown and act_at absent — never made of cycle_at. Sent on a change — on a plain
// socket at most once per GAP_MS, on the dispatcher's shared line paced by its batch tact
// (#8743) — at once on hello (a new socket knows nothing), and the last one before it goes.
import { envName, method } from "../delivery/index.ts";
import { type Holder } from "../shared/channel.ts";
import { HOSTED_CLIENTS } from "../shared/clients.ts";
import { bindScope, scoped } from "../shared/scope.ts";
import { harnessName } from "./client.ts";
import { H, whenPulsed } from "./holdstate.ts";
import { onDispatcher } from "./muxhold.ts";
import { pendingFrames } from "./pending.ts";
import { log } from "./streams.ts";
import { type JsonRpcMessage } from "./types.ts";
import { lastAgentWork, onAgentWork } from "./work.ts";

/** The least pause between two pulses of a socket; the variable is a probe seam. */
const GAP_MS = Number(process.env[envName("PULSE_GAP_MS")]) || 30_000;

const STATES = new Set(["idle", "busy", "interrupted", "failed", "unknown"]);

export interface Pulse {
  type: "pulse";
  state: string;
  pending: number;
  turn_at?: string;
  read_at?: string;
  act_at?: string;
  cycle_at?: string;
}

/** The moments the harness tells; each only moves forward. */
const MOMENTS = ["turn_at", "read_at", "act_at"] as const;

const P = scoped(() => ({
  /** The harness's word: state and the moments it knows. */
  said: {} as { state?: string; turn_at?: string; read_at?: string; act_at?: string },
  sent: null as Pulse | null,
  offered: null as Pulse | null,
  sentAt: 0,
  timer: null as ReturnType<typeof setTimeout> | null,
  tick: null as ReturnType<typeof setInterval> | null,
}));

const iso = (v: unknown): string | undefined =>
  typeof v === "string" && !Number.isNaN(Date.parse(v)) ? new Date(v).toISOString() : undefined;

function current(): Pulse {
  const { state, turn_at, read_at, act_at } = P.said;
  const work = lastAgentWork();
  return {
    type: "pulse",
    state: state ?? "unknown",
    pending: pendingFrames(),
    ...(turn_at ? { turn_at } : {}),
    ...(read_at ? { read_at } : {}),
    ...(act_at ? { act_at } : {}),
    ...(work ? { cycle_at: new Date(work).toISOString() } : {}),
  };
}

const same = (a: Pulse | null, b: Pulse): boolean => JSON.stringify(a) === JSON.stringify(b);

function send(p: Pulse, holder: Holder | null = H.holder): void {
  if (P.timer) clearTimeout(P.timer);
  P.timer = null;
  const sent = bindScope((at: number) => {
    P.sent = p;
    P.sentAt = at;
  });
  if (holder?.send(JSON.stringify(p), sent)) P.offered = p;
}

/** A change goes now, or when the gap since the last one has passed. */
function consider(now = false): void {
  if (!H.holder?.alive || H.unheard) return;
  const p = current();
  const mux = onDispatcher(H.currentUrl);
  if (!now && same(mux ? P.offered : P.sent, p)) return;
  // The dispatcher paces the wire: keep its waiting snapshot current (#8743).
  const wait = now || mux ? 0 : P.sentAt + GAP_MS - Date.now();
  if (wait <= 0) return send(p);
  if (!P.timer) {
    P.timer = setTimeout(
      bindScope(() => {
        P.timer = null;
        consider();
      }),
      wait,
    );
    P.timer.unref?.();
  }
}

/** pending moves without the bridge's notice (a watchdog marks what it gave): looked at each gap. */
function watch(): void {
  if (P.tick) return;
  P.tick = setInterval(
    bindScope(() => {
      if (H.holder?.alive) return consider();
      if (H.door) return; // parked or reopening: the seat is still the session's
      clearInterval(P.tick ?? undefined);
      P.tick = null;
    }),
    GAP_MS,
  );
  P.tick.unref?.();
}

whenPulsed((why, holder) => {
  if (why === "hello") {
    P.offered = null; // a new socket needs the current snapshot, even if sent before
    watch();
    return consider(true);
  }
  if (why === "frame") return consider();
  // The last one, past the gap: the socket is about to close.
  const p = current();
  if (!same(onDispatcher(H.currentUrl) ? P.offered : P.sent, p)) send(p, holder);
  if (P.timer) clearTimeout(P.timer);
  P.timer = null;
});
onAgentWork(() => consider());

/** The last pulse this session's socket carried; null — none yet (status.ts). */
export const sentPulse = (): (Pulse & { sent_at: string }) | null =>
  P.sent ? { ...P.sent, sent_at: new Date(P.sentAt).toISOString() } : null;

export const isPulseCall = (msg: JsonRpcMessage): boolean => msg?.method === method("pulse");

/** `method("pulse") {state?, turn_at?, read_at?, act_at?}` — the harness's word on its turn. */
export function runPulse(msg: JsonRpcMessage): JsonRpcMessage {
  const answer = (result: Record<string, unknown>): JsonRpcMessage => ({
    jsonrpc: "2.0",
    id: msg.id,
    result,
  });
  if (!HOSTED_CLIENTS.has(harnessName())) return answer({ taken: false, pulse: null });
  const p = (msg.params ?? {}) as Record<string, unknown>;
  const said = { ...P.said };
  if (typeof p.state === "string" && STATES.has(p.state)) said.state = p.state;
  for (const k of MOMENTS) {
    const v = iso(p[k]);
    if (v && (!said[k] || v > said[k])) said[k] = v;
  }
  P.said = said;
  try {
    consider();
  } catch (e) {
    log(`pulse: not considered — ${(e as Error).message}`);
  }
  return answer({ taken: true, pulse: current() });
}
