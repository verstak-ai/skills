// The thin bridge (THIN): a seat of another graph beside that did not come back with the main one.
import type { Lang } from "../lang.ts";

export interface ThinWords {
  /** Why a seat beside in another graph is lost: the main one's return did not bring it back (#7602). */
  besideNotBack: () => string;
}

export const THIN: Readonly<Record<Lang, ThinWords>> = {
  en: {
    besideNotBack: () => "the seat beside did not come back with the main one",
  },
};
