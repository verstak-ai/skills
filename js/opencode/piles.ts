// Frame routing to the case pile (graph @nks/nks-dev, nodes #4957, #7334).
import { addressedToMine } from "../shared/addressed.ts";
import { askFromPerson } from "../shared/asks.ts";
import { classifyOrigin, type Frame, isDirectWord } from "../shared/channel.ts";
import { batchHead, batchLines } from "../shared/frame-text.ts";
import { isGraphInbox } from "../shared/graph-inbox.ts";
import { receiptGraph } from "../shared/graph-receipt.ts";
import { roomKind, stackOf } from "../shared/room-kinds.ts";
import { eventKeyOf, splitBatch } from "../shared/seen.ts";

/** Addressing precedes stack; graph inbox text waits for next-turn context. */
export function toPile(frame: Frame | null): boolean {
  if (isGraphInbox(frame)) return true;
  if (!frame || frame.type !== "message" || isDirectWord(frame)) return false;
  const rk = roomKind(frame);
  if (
    (frame.origin ?? classifyOrigin(frame)) === "human" &&
    !rk?.phase &&
    !rk?.aside &&
    !askFromPerson(frame)
  )
    return false;
  return !addressedToMine(frame) || stackOf(frame) === "batch";
}

interface Riders {
  riders: Frame[];
  held: Frame[];
  marks: Set<string>;
}

/** Pending graph text suppresses its counted case copy before either is handed out. */
export function freshRiders(p: Riders, frames: Frame[]): Frame[] {
  const unit = [...new Set([...p.riders.filter(isGraphInbox), ...frames])];
  const kept = new Set(splitBatch(unit, Infinity, (k) => p.marks.has(k)).kept);
  return frames.filter((f) => kept.has(f));
}

/** Context takes soft text; a live interrupt may take counts, but never graph text. */
export function takeRiders(p: Riders, graph: boolean) {
  const all = p.riders.splice(0);
  if (!graph) p.riders.push(...all.filter(isGraphInbox));
  const events = new Set(all.filter(isGraphInbox).map(eventKeyOf));
  const copies = graph ? p.held.filter((f) => events.has(eventKeyOf(f))) : [];
  if (copies.length) p.held = p.held.filter((f) => !copies.includes(f));
  const unit = graph ? [...all, ...copies] : all.filter((f) => !isGraphInbox(f));
  const out = splitBatch([...p.riders.filter(isGraphInbox), ...unit], Infinity, (k) =>
    p.marks.has(k),
  );
  return { ...out, kept: graph ? out.kept : out.kept.filter((f) => !isGraphInbox(f)) };
}

/** Selection is reversible until the actual host context accepts its text and receipt. */
export function handRiders<T extends Riders>(
  ps: T[],
  put: (text: string) => void,
  note: (p: T, keys: string[]) => void,
): void {
  const batches = ps.map((p) => {
    const preview = { ...p, riders: [...p.riders], held: [...p.held] };
    return { p, preview, out: takeRiders(preview, true) };
  });
  const got = batches.flatMap((b) => b.out.kept);
  if (!got.length) return;
  put([batchHead(got), ...batchLines(got)].join("\n"));
  receiptGraph(got);
  for (const { p, preview, out } of batches) {
    p.riders = preview.riders;
    p.held = preview.held;
    note(p, out.keys);
  }
}
