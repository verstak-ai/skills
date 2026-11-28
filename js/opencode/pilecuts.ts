// A stale or wake-up batch of counts only goes to the case pile, no turn (graph @nks/nks-dev,
// nodes #6574, #11359). One the bridge cut — the first 20 shown, the rest marked given —
// keeps the server's whole count and the «not included» line (the batch's head): it waits
// with its frames and rides into the next prompt with them, else the rest is lost unsaid.
import { type ChannelEvent } from "../bridge/hold.ts";
import { addressedToMine } from "../shared/addressed.ts";
import { type Frame, isDirectWord } from "../shared/channel.ts";
import { caseKey } from "../shared/frame-text.ts";
import { isLifeCheck, isTact } from "../shared/seen.ts";

/** A pile's cut heads: `held` wait with the held frames, `cuts` ride with the riders. */
export interface Cuts {
  heldCuts?: string[];
  cuts?: string[];
}

/** A batch of case records none of which is to the seat. */
const countsOnly = (frames: readonly Frame[] | null | undefined): boolean =>
  !!frames?.length &&
  frames.every(
    (f) =>
      f?.type === "message" &&
      !!caseKey(f) &&
      !addressedToMine(f) &&
      !isDirectWord(f) &&
      !isTact(f) &&
      !isLifeCheck(f),
  );

/**
 * A batch of counts only: its frames to the case pile (`put`), the head of a cut batch to the
 * pile's held cuts (`own`, after the frames are put); true — taken.
 */
export function pileCounts(
  ev: ChannelEvent,
  put: (f: Frame) => void,
  own: () => Cuts | undefined,
): boolean {
  if (!countsOnly(ev.frames)) return false;
  for (const f of ev.frames ?? []) put(f);
  // A stale batch carries all its frames (the pile counts them whole); a wake-up only the shown.
  const cut = ev.body?.incomplete && ev.body.shown.length >= (ev.frames?.length ?? 0);
  const p = own();
  if (p && cut && ev.body?.head) (p.heldCuts ??= []).push(ev.body.head);
  return true;
}

/** The pile flushed: the held cuts join the riding ones. */
export function settleCuts(p: Cuts): void {
  if (p.heldCuts?.length) (p.cuts ??= []).push(...p.heldCuts.splice(0));
}

/** The cut heads above the text they ride with. */
export const withCut = (cut: readonly string[], text: string): string =>
  [...cut, text].filter(Boolean).join("\n\n");
