// What a tool call's own reply tells the bridge about its place: a satellite remembers the
// cases it joins (graph @nks/nks-dev, node #6573); a write through a provisional seat makes
// it the session's own (node #8033).
import { resolveAgainstLed } from "./call.ts";
import { noteCaseEntry } from "./caseexit.ts";
import { adopts, mainProvisional, noteWork } from "./provisional.ts";
import type { JsonRpcMessage } from "./types.ts";

export async function noteReply(msg: JsonRpcMessage, reply: JsonRpcMessage): Promise<void> {
  noteCaseEntry(msg.params?.name, msg.params?.arguments, reply);
  // A graph named by another alias than the seat's (r5 for @owner/slug) is resolved first,
  // or the write would miss the seat it went through (#8592).
  const realm = msg.params?.arguments?.realm;
  if (realm != null && adopts(msg, reply) && mainProvisional())
    await resolveAgainstLed(realm).catch(() => {});
  noteWork(msg, reply);
}
