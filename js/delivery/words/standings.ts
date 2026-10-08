// Refusals of the private socket directory check (STANDINGS).
import type { Lang } from "../lang.ts";

export interface StandingsWords {
  notDir: (dir: string) => string;
  otherUser: (dir: string) => string;
  openToOthers: (dir: string) => string;
}

export const STANDINGS: Readonly<Record<Lang, StandingsWords>> = {
  en: {
    notDir: (dir) => `${dir} is not a directory`,
    otherUser: (dir) => `${dir} belongs to another user`,
    openToOthers: (dir) => `${dir} is open to group or others`,
  },
};
