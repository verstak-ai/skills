// The words that return the role after an OpenCode session's context is compacted (the core's
// opencode/compaction.ts): the order to the compaction summary and one word in the system of the
// first request after it; the Claude Code plugin's compaction hook (the core's cli/onboard-hook.ts)
// says `back`, or `bare` in an aligned repository whose directory names no seat.
import type { Lang } from "../lang.ts";

export interface CompactionWords {
  /** In the compaction request's system: what the summary must keep. */
  keep: (karta: string, name: string, realm: string) => string;
  /** One word in the system of the session's first request after the compaction. */
  back: (karta: string, name: string, realm: string) => string;
  /** The same word without a role and seat: none is known for the session's directory. */
  bare: () => string;
  returned: (sessionID: string) => string;
}

const role = (karta: string, none: string): string => {
  const seq = karta.replace(/^#/, "");
  return seq && seq !== "undefined" ? `#${seq}` : none;
};

export const COMPACTION: Readonly<Record<Lang, CompactionWords>> = {
  en: {
    keep: (karta, name, realm) =>
      `Verstak: the summary of this compaction must keep the agent's role ${role(karta, "<role>")} ` +
      `in graph ${realm}, its seat ${name} (the bridge holds it), the live cases — by number and ` +
      `what each waits for — and the instruction to reload the verstak skill and the role's methods as the first move after the compaction.`,
    back: (karta, name, realm) =>
      `Verstak: the context was compacted. You are role ${role(karta, "<role>")} in graph ${realm}; ` +
      `the bridge holds seat ${name}. Before the first substantive move, load the verstak skill and ` +
      `the methods its door names for the role — only those, not all the earlier ones. The summary is a ` +
      `pointer, not the record: a decision, ground or fact from it you lean on — read it in the graph again ` +
      `(the door's entry method, "Recalling").`,
    bare: () =>
      `Verstak: the context was compacted. Before the first substantive move, load the verstak skill and ` +
      `the methods its door names for the role — only those, not all the earlier ones. The summary is a ` +
      `pointer, not the record: a decision, ground or fact from it you lean on — read it in the graph again ` +
      `(the door's entry method, "Recalling").`,
    returned: (sessionID) =>
      `Verstak: the role word after the compaction went into the first request of session ${sessionID}`,
  },
};
