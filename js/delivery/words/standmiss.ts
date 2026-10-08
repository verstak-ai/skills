// Why a status call without karta did not become a busy line (STAND_MISS); the argument
// list as a ready string.
import type { Lang } from "../lang.ts";

export interface StandMissWords {
  none: () => string;
  args: (args: string) => string;
  name: (asked: string, held: string) => string;
  satellite: (of: string) => string;
  cwd: (cwd: string) => string;
  parked: () => string;
  elsewhere: () => string;
}

const ONLY_EN = "Without karta the call only sets the busy line of the seat this bridge leads";

export const STAND_MISS: Readonly<Record<Lang, StandMissWords>> = {
  en: {
    none: () => `${ONLY_EN} in this graph — there is none.`,
    args: (args) =>
      `${ONLY_EN}, and the call carries ${args} — that is taking a seat; for the busy line alone — only realm and status.`,
    name: (asked, held) =>
      `${ONLY_EN}: the call names ${asked}, and the bridge holds ${held} here — name it or leave name out.`,
    satellite: (of) => `${ONLY_EN}: the bridge's seat is not a satellite of ${of}.`,
    cwd: (cwd) => `${ONLY_EN}: the directory ${cwd} does not exist or is not absolute.`,
    parked: () =>
      `${ONLY_EN}, and this bridge left its seat by word (leave): return by verstak_stand with karta under the same name.`,
    elsewhere: () =>
      `${ONLY_EN}, and the bridge has neither the socket nor the status address of this seat — the seat's socket is not with this bridge: the seat waits for its return from disk, or the socket was released (dead token, revoke); take the seat by verstak_stand with karta.`,
  },
};
