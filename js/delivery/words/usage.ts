// Why usage did not land in the seat's attrs (USAGE).
import type { Lang } from "../lang.ts";

export interface UsageWords {
  notHosted: () => string;
  noNumbers: () => string;
  /** max — the limit of the usage object in a tact record, bytes. */
  tooLarge: (max: number) => string;
}

export const USAGE: Readonly<Record<Lang, UsageWords>> = {
  en: {
    notHosted: () => "only OpenCode and pi report usage",
    noNumbers: () => "the snapshot has no numbers",
    tooLarge: (max) => `the snapshot is over ${max} bytes, the tact record's limit; not sent`,
  },
};
