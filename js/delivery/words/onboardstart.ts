// The first word to a root session whose account has no working graph (the core's
// opencode/onboardstart.ts): one line before the first request; unknown says nothing.
import type { Lang } from "../lang.ts";

export interface OnboardStartWords {
  /** No working graph: point the model at the onboarding method. */
  start: () => string;
}

export const ONBOARD_START: Readonly<Record<Lang, OnboardStartWords>> = {
  en: {
    start: () =>
      "Verstak: you have no working graph yet — load the verstak skill and run its onboarding method before anything else; it creates nothing without the person's word.",
  },
};
