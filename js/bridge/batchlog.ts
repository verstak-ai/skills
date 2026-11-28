// Which frames a batch handed and which copies were dropped as given, by frame id and record
// key (room.id/entry_id), with the journal's time — no bodies (graph @nks/nks-dev, node
// #11359): without it a wake-up of many items could not be taken apart after the fact.
import { type Frame } from "../shared/channel.ts";
import { log } from "./streams.ts";

/** At most this many ids in a line; the rest by count. */
const IDS_KEPT = 50;

type Rec = Record<string, unknown>;
const rec = (v: unknown): Rec => (v && typeof v === "object" ? (v as Rec) : {});
const str = (v: unknown): string =>
  typeof v === "number" || (typeof v === "string" && v) ? String(v) : "";

/** `id→room/entry` for a case record, the bare id otherwise. */
export function frameRef(f: Frame): string {
  const id = str(f.id) || "?";
  const room = str(rec((f as Rec).room).id);
  const entry = str((f as Rec).entry_id ?? rec((f as Rec).line).entry_id);
  return room && entry ? `${id}→${room}/${entry}` : id;
}

/** The refs of the frames, the first IDS_KEPT and the count of the rest. */
export function refsOf(frames: readonly Frame[]): string {
  const shown = frames.slice(0, IDS_KEPT).map(frameRef).join(", ");
  return frames.length > IDS_KEPT ? `${shown} … +${frames.length - IDS_KEPT}` : shown;
}

/** One journal line for a batch handed to the seat `seat`. */
export function logBatch(kind: string, seat: string, frames: readonly Frame[]): void {
  log(`${kind} batch to ${seat || "?"}: ${frames.length} frame(s): ${refsOf(frames)}`);
}
