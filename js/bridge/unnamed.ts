// A role seat without a name (graph @nks/nks-dev, node #6748): the server takes
// connect, mint and register with an empty name and seats it as "@handle" — the
// human's own address, with nothing to revoke it. The bridge sends no such call on
// any path (agent move or its own: stand, resume, satellite pause, re-register); the check
// sits at the exit to the server (transport.ts). The only exception is the human's own
// seat on their word, karta "me" or "realm-owner"; a numbered owner-role karta without a
// name is refused even then (the check is synchronous and cannot ask the server its kind).
import { envName, tool, UNNAMED } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import { envOf } from "../shared/scope.ts";
import { normKarta, normName } from "./names.ts";
import { type JsonRpcMessage } from "./types.ts";

const SEAT_MOVES = new Set(["connect", "mint", "register"]);
const HUMAN = new Set(["me", "realm-owner"]);

/** A call taking a seat without a name — a refusal aloud instead of sending; otherwise null. */
export function unnamedSeatRefusal(msg: JsonRpcMessage): JsonRpcMessage | null {
  if (msg?.method !== "tools/call" || msg.params?.name !== tool("channel")) return null;
  const a = msg.params.arguments ?? {};
  const action = String(a.action);
  if (!SEAT_MOVES.has(action) || normName(a.name)) return null;
  // The human's own seat (#6053) only on the human's word (owner.ts; importing it would close a cycle through transport.ts).
  if (envOf(envName("BRIDGE_OWNER_ROLE"))?.trim() === "1" && HUMAN.has(normKarta(a.karta)))
    return null;
  return {
    jsonrpc: "2.0",
    id: msg.id,
    result: { isError: true, content: [{ type: "text", text: words(UNNAMED).refused(action) }] },
  };
}
