// The occupied-seat takeover rule (TAKE): evicting a holder only on the user's word. A seat
// on the board is no evidence its holder is alive: a dead agent's seat is closed after a window
// by a machine bridge with a daemon, otherwise it goes by the platform's term. Shared by all advice.
import type { Lang } from "../lang.ts";

export interface TakeWords {
  rule: () => string;
}

export const TAKE: Readonly<Record<Lang, TakeWords>> = {
  en: {
    rule: () =>
      "only on the user's word; a seat on the board is no evidence its holder is alive: a dead agent's seat closes in about a minute when it held the seat through a machine bridge with a daemon, otherwise by the platform's term",
  },
};
