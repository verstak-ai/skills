// The context recovery gate (the core's bridge/context-gate.ts): after an observed fill collapse
// a write is refused until the door and the role's skills are loaded again, or the reread is
// confirmed on the seat. Kept apart from words/: the core reads two of its words as strings.
import type { Lang } from "./lang.ts";
import { BRIDGE_SKILL } from "./product.ts";
import { tool } from "./protocol.ts";

/** The door skill: recovery after a context collapse needs it loaded beside the role's skills. */
export const CONTEXT_DOOR = BRIDGE_SKILL;
/**
 * The attributes section of a node read (`  ATTRS:` to the end, as mcp.verstak.ai prints it),
 * so a `skills:` line in the role's motivation or description is never taken for the list.
 */
export const ROLE_SKILLS = /(?:^|\n) {2}ATTRS:\r?\n([\s\S]*)$/;

export interface ContextGateWords {
  /** A write refused while the recovery mark stands. */
  refused: string;
  /** The explicit confirmation accepted. */
  confirmed: string;
  /** The description of verstak_stand's context_restored parameter. */
  field: string;
  /** The mark could not be saved or read: a write stays refused. */
  storage: (why: string) => string;
}

export const CONTEXT_GATE: Readonly<Record<Lang, ContextGateWords>> = {
  en: {
    refused:
      "Context may have been compacted (the context fill dropped by half or more). The write was not sent; reads stay available. " +
      "Reread the verstak skill and the role's methods, then confirm the reread explicitly: " +
      `${tool("stand")}(realm=<your graph>, context_restored=true). Then repeat the write.`,
    confirmed:
      "The reread is confirmed for this seat and this recovery generation; writes are allowed again.",
    field:
      "Confirm explicitly that the verstak skill and every skill of the role were reread after a context collapse. " +
      "Only on the seat you already hold; local to the bridge — no register, no new seat.",
    storage: (why) =>
      `The context recovery mark could not be saved or read: ${why}. The write was not sent; reads stay available. A storage failure does not confirm the reread.`,
  },
};
