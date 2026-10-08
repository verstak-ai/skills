// The agent's last work — the point for the seat's heartbeat (graph @nks/nks-dev,
// node #6510): the moment of the agent's last tools/call from the harness; service
// moves of the plugin and the bridge do not count. Per session (shared/scope.ts).
import { scoped } from "../shared/scope.ts";

const W = scoped(() => ({ at: 0 }));

/** The agent called a tool (session.ts, on the harness's tools/call). */
export function noteAgentWork(at = Date.now()): void {
  W.at = at;
}

/** This session's last agent work (epoch ms); 0 — the harness has not spoken yet. */
export const lastAgentWork = (): number => W.at;
