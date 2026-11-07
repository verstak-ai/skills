// The first word in a repository not yet aligned for the agent: no cover, no start hook,
// no align stamp (the core's shared/reposigns.ts) — one line, from the Claude Code plugin's
// SessionStart hook and before an OpenCode root's first request.
import type { Lang } from "../lang.ts";

export interface OnboardStartWords {
  /** No sign of alignment: the onboarding method is offered, never a condition of the request. */
  start: () => string;
}

export const ONBOARD_START: Readonly<Record<Lang, OnboardStartWords>> = {
  en: {
    start: () =>
      "Verstak: this repository is not aligned yet — load the verstak skill and offer the person its onboarding method; it does not hold up their request and writes nothing without their word.",
  },
};
