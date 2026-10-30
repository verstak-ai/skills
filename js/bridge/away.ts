// Announced absence (graph @nks/nks-dev, node #7493): before a planned restart (a plugin
// reload, a move to another folder) the plugin says `away` — the session's end then keeps
// the seat and its hold record for the return of the same harness session. Without the
// mark the end is the agent's death: the daemon closes the seat after the window (runend.ts).
import { method } from "../delivery/index.ts";
import { scoped } from "../shared/scope.ts";
import { type JsonRpcMessage } from "./types.ts";

const A = scoped(() => ({ away: false }));

export const awayAnnounced = (): boolean => A.away;

/** The plugin's `away` request: the mark lies until the session ends. */
export function localAway(msg: JsonRpcMessage): Promise<JsonRpcMessage> | null {
  if (msg?.method !== method("away")) return null;
  A.away = true;
  return Promise.resolve({ jsonrpc: "2.0", id: msg.id, result: { away: true } });
}
