// The agent's last work — the point for the seat's heartbeat (graph @nks/nks-dev,
// node #6510): the moment of the agent's last tools/call from the harness; service
// moves of the plugin and the bridge (check, usage, the replayed handshake) do not count.
// Per session (shared/scope.ts): the daemon keeps one per session, published per seat.
import { scoped } from "../shared/scope.ts";

const W = scoped(() => ({ at: 0 }));
let heard: (() => void) | null = null;

/** The agent called a tool (session.ts, on the harness's tools/call). */
export function noteAgentWork(at = Date.now()): void {
  W.at = at;
  heard?.();
}

/** Who hears each agent call: the seat's pulse (pulse.ts); one per process, called in the session's scope. */
export function onAgentWork(fn: () => void): void {
  heard = fn;
}

/** This session's last agent work (epoch ms); 0 — the harness has not spoken yet. */
export const lastAgentWork = (): number => W.at;
