// The delivery's ritual words (graph @nks/nks-dev, node #9341): the push and merge reminders the
// Claude Code plugin's hooks and the OpenCode plugin's rituals module add to a call's outcome, and
// the early start word of an unfinished onboarding. Each is the text of its sample in
// skills/verstak/references/align-hooks.md and align-harness-surfaces.md, held equal by
// js/tests/rites-words.test.mjs. The start word and the memory guard's refusal are PREPARE's (one
// text for the repository's hook and the delivery).
import type { Lang } from "../lang.ts";
import { FRAME_MARK } from "../protocol.ts";

export interface RiteWords {
  /** The heading of the AGENTS.md section the words lean on: it tells the body's language. */
  lifecycle: () => string;
  /** A push opened or updated a PR. */
  push: () => string;
  /** A forge merge merged a PR or the trunk was pulled; the holon is not named (one text). */
  merge: (holon?: string) => string;
  /** The start while the cover names only the graph: no holon or role yet, onboarding unfinished. */
  early: (graph: string) => string;
}

export const RITES: Readonly<Record<Lang, RiteWords>> = {
  en: {
    lifecycle: () => "Persistence",
    push: () =>
      `${FRAME_MARK} A push ships nothing: self-review the diff, run the vocabulary pass over the PR text; choose the review tier for the finished batch (verstak skill, methods/code-work.md, Cold review).`,
    merge: () =>
      `${FRAME_MARK} Merged: run the after-merge acts (verstak skill, methods/code-work.md, After merge): weave, advance the map, modes on evidence not on merge, end by axis, reconcile, feedback, vocabulary; work tasked by another agent: only the seed and delivery modes.`,
    early: (graph) =>
      `Load the verstak skill first (/verstak) and read its Start section before any other action. Onboarding in progress: graph ${graph}; no holon or roles yet. Continue the onboarding method from the first missing sign.`,
  },
};
