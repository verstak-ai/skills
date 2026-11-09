// The first word in a repository not yet aligned for the agent: no cover, no start hook,
// no align stamp (the core's shared/reposigns.ts). Empty: a repository the person did not
// choose gets no invitation unasked (graph @nks/nks-dev, node #10020); the core's Claude Code
// SessionStart hook and OpenCode root skip an empty word, so the start stays silent.
import type { Lang } from "../lang.ts";

export interface OnboardStartWords {
  /** No sign of alignment: silence — align and onboarding wait for the person's word. */
  start: () => string;
}

export const ONBOARD_START: Readonly<Record<Lang, OnboardStartWords>> = {
  en: {
    start: () => "",
  },
};
