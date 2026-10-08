// The standing name rule (NAMES): how an explicit name breaks the server's rule.
import type { Lang } from "../lang.ts";

export interface NameWords {
  overLimit: (length: number) => string;
  capitals: () => string;
  badSigns: () => string;
}

export const NAMES: Readonly<Record<Lang, NameWords>> = {
  en: {
    overLimit: (length) => `over the limit: ${length} signs`,
    capitals: () => "capital letters are not allowed",
    badSigns: () => "signs not allowed, or the first sign is neither a letter nor a digit",
  },
};
