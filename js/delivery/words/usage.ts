// Why usage did not land in the seat's attrs (USAGE).
import type { Lang } from "../lang.ts";

export interface UsageWords {
  notHosted: () => string;
  noNumbers: () => string;
}

export const USAGE: Readonly<Record<Lang, UsageWords>> = {
  en: {
    notHosted: () => "only OpenCode and pi report usage",
    noNumbers: () => "the snapshot has no numbers",
  },
};
