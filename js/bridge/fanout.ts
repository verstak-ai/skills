// Fan-out of one graph event over a role's seats (graph @nks/nks-dev, node #5829).
import { statSync } from "node:fs";

import { type Frame } from "../shared/channel.ts";
import { eventIn, eventKeyOf, type Marks, sameCopy, seenIds } from "../shared/seen.ts";
import { type Door } from "./door.ts";
import { log } from "./streams.ts";

/** Last read of each .seen file keyed by its stamp (inode, size, mtime); reread only when the stamp changes. */
const lastRead = new Map<string, { stamp: string; ids: Set<string> }>();

function givenIds(seenPath: string): Set<string> {
  let stamp: string;
  try {
    const st = statSync(seenPath);
    stamp = `${st.ino}:${st.size}:${st.mtimeMs}`;
  } catch {
    lastRead.delete(seenPath);
    return new Set();
  }
  const hit = lastRead.get(seenPath);
  if (hit?.stamp === stamp) return hit.ids;
  const ids = seenIds(seenPath);
  lastRead.set(seenPath, { stamp, ids });
  return ids;
}

/** Whether any key is marked delivered — in bridge memory or in the clients' .seen file. */
export function isDelivered(keys: string[], seen: Set<string>, seenPath: string): boolean {
  if (!keys.length) return false;
  if (keys.some((k) => seen.has(k))) return true;
  const given = givenIds(seenPath);
  return keys.some((k) => given.has(k));
}

export const marksOf =
  (seen: Set<string>, seenPath: string): Marks =>
  (k) =>
    isDelivered([k], seen, seenPath);

/**
 * The event key if this copy need not be offered: the event is already in the turn,
 * or a copy of the same kind is offered no later than this one.
 */
function redundantEvent(
  frame: Frame | null,
  d: Pick<Door, "ring" | "seen" | "seenPath" | "stale">,
): string {
  const ev = frame?.type === "message" ? eventKeyOf(frame) : "";
  if (!ev || !frame) return "";
  if (eventIn(frame, marksOf(d.seen, d.seenPath))) return ev;
  // An older undelivered copy in the ring is offered first and evicted first.
  if (d.ring.some((r) => sameCopy(r.frame, frame))) return ev;
  // A live copy carries the event itself and pulls stale copies of its kind out of the batch (graph @nks/nks-dev, node #5842).
  if (frame.stale === true) return d.stale.holdsCopy(frame) ? ev : "";
  d.stale.dropCopies(frame);
  return "";
}

export function redundantCopy(
  frame: Frame | null,
  d: Pick<Door, "ring" | "seen" | "seenPath" | "stale">,
): boolean {
  const ev = redundantEvent(frame, d);
  const id = frame?.id;
  if (ev)
    log(`frame ${typeof id === "string" ? id : "?"} carries ${ev} already offered — not raised`);
  return !!ev;
}
