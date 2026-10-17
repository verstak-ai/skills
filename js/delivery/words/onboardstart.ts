// The first word in a repository not yet aligned for the agent: no cover, no start hook,
// no align stamp (the core's shared/reposigns.ts) — one line, from the Claude Code plugin's
// SessionStart hook and before an OpenCode root's first request.
import type { Lang } from "../lang.ts";

export interface OnboardStartWords {
  /** No sign of alignment: point the model at the onboarding method. */
  start: () => string;
}

export const ONBOARD_START: Readonly<Record<Lang, OnboardStartWords>> = {
  en: {
    start: () =>
      "Verstak: this repository is not yet aligned for the agent — load the verstak skill and run its onboarding method before anything else; it creates nothing without the person's word.",
  },
};
