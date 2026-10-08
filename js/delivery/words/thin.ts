// The thin bridge (THIN): seats of other graphs beside do not return on a daemon change.
import type { Lang } from "../lang.ts";

export interface ThinWords {
  besideNotBack: () => string;
}

export const THIN: Readonly<Record<Lang, ThinWords>> = {
  en: {
    besideNotBack: () => "beside seats do not come back",
  },
};
