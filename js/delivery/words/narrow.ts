// Narrowing the tool list (NARROW): refusal of a call outside the --tools set; the set
// comes as a ready string.
import type { Lang } from "../lang.ts";

export interface NarrowWords {
  outsideSet: (name: string, list: string) => string;
}

export const NARROW: Readonly<Record<Lang, NarrowWords>> = {
  en: {
    outsideSet: (name, list) =>
      `Refused (bridge): the tool ${name} is not in this bridge's set (${list}) — the set comes from --tools in the bridge entry.`,
  },
};
