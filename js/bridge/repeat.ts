// Which MCP requests the bridge repeats itself when the connection closed under them
// before the reply (graph @nks/nks-dev, node #6630): only where a second delivery
// applies nothing. Harness writes are not repeated: their outcome stays "unknown"
// (deliver.ts). Nor is connect: a read one already turned the seat address.
import { ID_PREFIX, tool } from "../delivery/index.ts";
import { type JsonRpcMessage } from "./types.ts";

/** ids of the bridge's own calls (call.ts), not the harness's. */
export const OWN_CALL_PREFIX = `${ID_PREFIX}bridge-call-`;

export const READ_TOOLS = new Set(["look", "orient", "search", "semantic_search"].map(tool));

/**
 * Actions whose repeat is harmless: reading the board and the graph list. Not
 * register: the bridge cannot show a double one is harmless, and ensureStanding
 * catches up a skipped one before the next call.
 */
const SAFE_ACTIONS: Record<string, Set<string>> = {
  [tool("channel")]: new Set(["list"]),
  [tool("realm")]: new Set(["list"]),
};

export function repeatable(msg: JsonRpcMessage): boolean {
  if (msg?.id === undefined || msg?.id === null) return true; // a notification: no reply awaited
  if (msg.method === "initialize" || msg.method === "tools/list") return true;
  if (msg.method !== "tools/call") return false;
  const name = String(msg.params?.name ?? "");
  if (READ_TOOLS.has(name)) return true;
  const action = String(msg.params?.arguments?.action ?? "");
  if (ownPlaceEnd(msg, name, action)) return true;
  return !!SAFE_ACTIONS[name]?.has(action);
}

/**
 * revoke and close of the bridge's own seat at the end of a run (caseexit.ts): a repeat
 * on a seat already gone answers "closed" and applies nothing twice, while without it
 * the seat hung on the board until the channel's ttl. The harness's revoke stays "unknown".
 */
function ownPlaceEnd(msg: JsonRpcMessage, name: string, action: string): boolean {
  return (
    name === tool("channel") &&
    (action === "revoke" || action === "close") &&
    String(msg.id ?? "").startsWith(OWN_CALL_PREFIX)
  );
}
