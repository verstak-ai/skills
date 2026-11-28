// A record is given once per seat by its contract key (room.id, entry_id — seen.ts
// recordKeyOf); a copy under a new frame id is a re-issued queue row — the server's to fix
// (graph @nks/nks-dev, nodes #11359, #6574). A frame with event_id goes by its event. Nothing
// is inferred from the order of entries: a record never given is offered, however old.
import { addressedToMine } from "../shared/addressed.ts";
import { type Frame, isDirectWord } from "../shared/channel.ts";
import { isGraphInbox } from "../shared/graph-inbox.ts";
import { isLifeCheck, noteSeen, recordKeyOf } from "../shared/seen.ts";
import { markAddressed } from "./addressmark.ts";
import { frameRef } from "./batchlog.ts";
import { givenIds } from "./fanout.ts";
import { log } from "./streams.ts";

/**
 * True — this count copies a record already given to the seat (its contract key is marked).
 * Only a count (not addressed to the seat): a text copy wakes by its own rules.
 */
export function givenRecord(frame: Frame | null, seen: Set<string>, seenPath: string): boolean {
  if (!frame || frame.type !== "message" || addressedToMine(frame)) return false;
  if (isDirectWord(frame) || isLifeCheck(frame) || isGraphInbox(frame)) return false;
  const rec = recordKeyOf(frame);
  return !!rec && (seen.has(rec) || givenIds(seenPath).has(rec));
}

/**
 * The frame's addressing marked (addressmark.ts), then a copy of a given record not offered
 * (givenRecord): its id is marked given and the drop logged; true — dropped.
 */
export function countedBefore(
  frame: Frame | null,
  d: { seen: Set<string>; seenPath: string; key: string },
): boolean {
  const { seen, seenPath } = d;
  if (frame?.type === "message") markAddressed(frame, seenPath, seen);
  if (!frame || !givenRecord(frame, seen, seenPath)) return false;
  const id = typeof frame.id === "string" ? frame.id : "";
  if (id) noteSeen(seenPath, id, seen);
  log(`dropped as given to ${d.key || "?"}: ${frameRef(frame)} — counts a record not raised`);
  return true;
}
