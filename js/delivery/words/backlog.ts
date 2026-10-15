// Header of a wake-up batch (BACKLOG): count of frames, waiting, not entered, and direct
// words.
import type { Lang } from "../lang.ts";
import { FRAME_TEXT } from "./frame-text.ts";

export interface BacklogWords {
  head: (count: number, expected: number, shown: number, direct: number) => string;
}

export const BACKLOG: Readonly<Record<Lang, BacklogWords>> = {
  en: {
    head: (count, expected, shown, direct) =>
      `Wake-up: ${count} frames` +
      (expected ? ` (waiting in the queue: ${expected})` : "") +
      (count > shown ? `, the first ${shown} here, ${count - shown} left out` : "") +
      " — those addressed to the seat as text, the rest by count; " +
      `in full — by the case lines below, the rest — ${FRAME_TEXT.en.myCases()}.` +
      (direct ? ` ${direct} direct messages are not here: each came on its own and whole.` : ""),
  },
};
