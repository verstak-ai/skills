// The words that return the role after an OpenCode session's context is compacted (the core's
// opencode/compaction.ts): the order to the compaction summary and one word in the system of the
// first request after it; the Claude Code plugin's compaction hook (the core's cli/onboard-hook.ts)
// says `back`, or `bare` in an aligned repository whose directory names no seat.
import type { Lang } from "../lang.ts";
import { tool } from "../protocol.ts";

export interface CompactionWords {
  /** In the compaction request's system: what the summary must keep. */
  keep: (karta: string, name: string, realm: string) => string;
  /** One word in the system of the session's first request after the compaction. */
  back: (karta: string, name: string, realm: string) => string;
  /** The same word without a role and seat: none is known for the session's directory. */
  bare: () => string;
  /** The tail of `back` in Claude Code: the hook stays offline — the verstak_stand answer carries the human's rules (#9817). */
  restand: (karta: string, name: string, realm: string) => string;
  returned: (sessionID: string) => string;
}

const role = (karta: string, none: string): string => {
  const seq = karta.replace(/^#/, "");
  return seq && seq !== "undefined" ? `#${seq}` : none;
};

export const COMPACTION: Readonly<Record<Lang, CompactionWords>> = {
  en: {
    keep: (karta, name, realm) =>
      `Verstak: this summary keeps role ${role(karta, "<role>")} in ${realm}, seat ${name}, the live cases ` +
      `(number, what each waits for), the user's standing words on how agents work verbatim, and the instruction ` +
      `to reload the verstak skill and the role's methods first.`,
    back: (karta, name, realm) =>
      `Verstak: context compacted. Role ${role(karta, "<role>")} in ${realm}, seat ${name} (the bridge holds it). ` +
      `First load the verstak skill, the methods its door names for the role (only those) and writing. The user's personal slice comes back with the seat's answer (the door's Start) before your next word to them; a standing word of theirs on how agents work that only the summary holds goes to their mind from where they said it, else confirmed where they alone read — never from the summary alone (minding, Write). The summary points, it isn't the record: re-read in the graph what you lean on (entry, Recalling).`,
    bare: () =>
      `Verstak: context compacted. ` +
      `First load the verstak skill, the methods its door names for the role (only those) and writing. The user's personal slice comes back with the seat's answer (the door's Start) before your next word to them; a standing word of theirs on how agents work that only the summary holds goes to their mind from where they said it, else confirmed where they alone read — never from the summary alone (minding, Write). The summary points, it isn't the record: re-read in the graph what you lean on (entry, Recalling).`,
    restand: (karta, name, realm) =>
      ` As the first move call ${tool("stand")}(realm="${realm}", karta="${role(karta, "<role>")}", name="${name}") without take: the seat stays, and its answer carries the human's rules.`,
    returned: (sessionID) =>
      `Verstak: the role word after the compaction went into the first request of session ${sessionID}`,
  },
};
