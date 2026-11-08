// Why a status call without karta did not become a busy line (STAND_MISS); the argument
// list as a ready string.
import type { Lang } from "../lang.ts";
import { tool } from "../protocol.ts";

export interface StandMissWords {
  none: () => string;
  args: (args: string) => string;
  name: (asked: string, held: string) => string;
  satellite: (of: string) => string;
  cwd: (cwd: string) => string;
  parked: () => string;
  elsewhere: () => string;
}

const ONLY_EN = "Without karta the call only sets the busy line of this bridge's seat";

export const STAND_MISS: Readonly<Record<Lang, StandMissWords>> = {
  en: {
    none: () => `${ONLY_EN} in this graph — there is none.`,
    args: (args) =>
      `${ONLY_EN}, yet it carries ${args}, which take a seat; for the busy line alone pass only realm and status.`,
    name: (asked, held) =>
      `${ONLY_EN}: it names ${asked}, the bridge holds ${held} — name it or leave name out.`,
    satellite: (of) => `${ONLY_EN}: the bridge's seat is not a satellite of ${of}.`,
    cwd: (cwd) => `${ONLY_EN}: the directory ${cwd} does not exist or is not absolute.`,
    parked: () =>
      `${ONLY_EN}, and this bridge left its seat (leave): return by ${tool("stand")} with karta and the same name.`,
    elsewhere: () =>
      `${ONLY_EN}, and this seat's socket is not with this bridge (awaiting its return from disk, or released: dead token, revoke); take the seat by ${tool("stand")} with karta.`,
  },
};
