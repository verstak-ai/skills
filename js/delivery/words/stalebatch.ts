// Header of a stale frame batch (STALE).
import type { Lang } from "../lang.ts";
import { tool } from "../protocol.ts";

export interface StaleWords {
  head: (count: number, shown: number) => string;
}

export const STALE: Readonly<Record<Lang, StaleWords>> = {
  en: {
    head: (count, shown) =>
      `Stale frames: ${count}` +
      (count > shown ? `, the first ${shown} here, ${count - shown} left out` : "") +
      " — taken while the seat was not listening, or the service repeating after a session rebuild; " +
      "those addressed to the seat as text, the rest by count; " +
      `in full and the rest — ${tool("channel")}(action="history").`,
  },
};
