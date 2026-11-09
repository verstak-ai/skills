// Stale batch text (graph @nks/nks-dev, nodes #4881, #5033) — composed by whoever hands
// it out, at that moment (seen.ts): the bridge notifying pi and OpenCode, the watchdog
// printing or threading it. An event already in the turn is not repeated (eventIn).
import { STALE } from "../delivery/index.ts";
import { type Frame } from "./channel.ts";
import { caseKey, textShown, underCounts } from "./frame-text.ts";
import { words } from "./lang.ts";
import { deliveryKeys, eventIn, type Marks, splitBatch } from "./seen.ts";

const STALE_BURST_KEEP = 20;
const BODY_CAP = 800;

/** A batch's parts as given: its head, the shown as indexes into its frames, whether all are shown. */
export interface BatchBody {
  head: string;
  shown: number[];
  incomplete: boolean;
}

const shownOf = (frames: readonly Frame[], body: BatchBody): Frame[] =>
  body.shown.map((i) => frames[i]).filter((f): f is Frame => !!f);

/**
 * Batch text from its parts (stale and wake-up batches): addressed to the seat as text,
 * other case records by count per case (#6574). `riding` — the seat's waiting counts, counted
 * in their case's count of this batch, so the case is named once (#9654).
 */
export function batchBodyText(
  frames: readonly Frame[],
  body: BatchBody,
  riding: Frame[] = [],
): string {
  const shown = shownOf(frames, body);
  const bodies = underCounts([...riding, ...shown], textShown(shown, BODY_CAP), body.incomplete);
  return `${body.head}\n\n${bodies.join("\n\n")}`;
}

/** The waiting counts ride in a batch only when one of them is of a case the batch shows. */
export function ridesIn(riding: Frame[], frames: readonly Frame[], body: BatchBody): boolean {
  const cases = new Set(shownOf(frames, body).map(caseKey).filter(Boolean));
  return riding.some((f) => cases.has(caseKey(f)));
}

/**
 * Stale batch by the giver's memory `has`: the text ("" — all already in the turn), its
 * parts and its delivery marks, written by the giver once the text is out (#5831). Rule
 * #6574: addressed to the seat as text, other case records by count; an event once.
 */
export function staleBatch(
  all: readonly Frame[],
  has: Marks,
  riding: Frame[] = [],
): { text: string; keys: string[]; body?: BatchBody } {
  const { shown: frames, kept, keys } = splitBatch(all, STALE_BURST_KEEP, has);
  const count = kept.length;
  if (!count) return { text: "", keys };
  const body = {
    head: words(STALE).head(count, frames.length),
    shown: frames.map((f) => all.indexOf(f)),
    incomplete: count > frames.length,
  };
  return { text: batchBodyText(all, body, ridingOf(riding, frames, has)), keys, body };
}

/** Waiting counts not yet in the turn and not copies of an event the batch brings (seen.ts eventIn). */
function ridingOf(riding: Frame[], frames: readonly Frame[], has: Marks): Frame[] {
  const own = new Set(frames.flatMap((f) => deliveryKeys(f)));
  return riding.filter((f) => !frames.includes(f) && !eventIn(f, (k) => has(k) || own.has(k)));
}
