// Bridge lines on the call surface (MOMENT): status and leave on the channel tool. The bridge
// prefixes no writing-moment line to the write tools — the server's own line carries it; the
// line former bridges prefixed is named so a cached list loses it.
import type { Lang } from "../lang.ts";
import { tool } from "../protocol.ts";

export interface MomentWords {
  status: () => string;
  leave: () => string;
  /**
   * The moment line bridges up to 3.3.0 put first in a write tool's description (before #7557):
   * a list from the shared cache written by such a bridge still carries it — it is taken off.
   */
  formerMoment: () => string;
}

export const MOMENT: Readonly<Record<Lang, MomentWords>> = {
  en: {
    status: () =>
      `[bridge] Busyness is set by ${tool("stand")}(realm, status) on a seat the bridge already holds — the main move; action="status" (realm, text up to 64 characters) is the former one, kept for compatibility: the bridge, the socket holder, executes it, the call does not go to the server; an empty text clears; a surface refusal comes whole.`,
    leave: () =>
      `[bridge] action="leave" (realm) — leave the seat: the bridge executes it — the socket is closed, busyness cleared, address, queue and hooks intact; mail piles up and arrives on return (the watchdog or ${tool("stand")}). For a subagent's satellite seat the leave is total: the seat is released whole, mail does not pile up, there is no return — standing again is only ${tool("stand")} with satellite_of. The bridge itself leaves only where a frame reaches only through a watchdog (Claude Code, Codex) and the watchdog has not been armed for 15 minutes; in pi and OpenCode a frame comes as a notification, and the bridge does not abandon the seat. Busyness clears at the end of the session.`,
    formerMoment: () =>
      "[bridge] " +
      "The writing skill's moment: before each node, name the reader, what will change retrieval and what is new here; type and given_as, the three modes as claims, a thesis name, arrows with sense; the body is present knowledge, never provenance: who said it, when, by whose hand — lives in the node's history and in the case, a node is rewritten, not appended with a section; hint is a transformation's seed: only what matters after the session, not a log; a question to a neighbour and a wait are a vimarsha with `posed_to`, not a case line; the CHECKS lines in the reply are this beat's work.",
  },
};
