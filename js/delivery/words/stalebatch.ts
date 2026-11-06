// Header of a stale frame batch (STALE).
import type { Lang } from "../lang.ts";
import { FRAME_TEXT } from "./frame-text.ts";

export interface StaleWords {
  /** legacy — the old full protocol sentence: never rendered now, kept so frames still queued under it read as quiet (shared/quietframe.ts; js/tests/quiet-frames.test.mjs). */
  head: (count: number, shown: number, legacy?: boolean) => string;
}

export const STALE: Readonly<Record<Lang, StaleWords>> = {
  en: {
    head: (count, shown, legacy = false) =>
      `Stale frames: ${count}` +
      (count > shown ? `, the first ${shown} here, ${count - shown} left out` : "") +
      (legacy
        ? " — taken while the seat was not listening, or the service repeating after a session rebuild; " +
          "those addressed to the seat as text, the rest by count; " +
          `in full — by the case lines below, the rest — ${FRAME_TEXT.en.myCases()}.`
        : "."),
  },
};
