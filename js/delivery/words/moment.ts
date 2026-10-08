// Bridge lines on the call surface (MOMENT): the writing moment on writing tools, status
// and leave on the channel tool.
import type { Lang } from "../lang.ts";

export interface MomentWords {
  moment: () => string;
  status: () => string;
  leave: () => string;
}

export const MOMENT: Readonly<Record<Lang, MomentWords>> = {
  en: {
    moment: () =>
      "[bridge] " +
      "The writing skill's moment: before each node, name the reader, what will change retrieval and what is new here; type and given_as, the three modes as claims, a thesis name, arrows with sense; the body is present knowledge, never provenance: who said it, when, by whose hand — lives in the node's history and in the case, a node is rewritten, not appended with a section; hint is a transformation's seed: only what matters after the session, not a log; a question to a neighbour and a wait are a vimarsha with `posed_to`, not a case line; the CHECKS lines in the reply are this beat's work.",
    status: () =>
      '[bridge] Busyness is set by verstak_stand(realm, status) on a seat the bridge already holds — the main move; action="status" (realm, text up to 64 characters) is the former one, kept for compatibility: the bridge, the socket holder, executes it, the call does not go to the server; an empty text clears; a surface refusal comes whole.',
    leave: () =>
      '[bridge] action="leave" (realm) — leave the seat: the bridge executes it — the socket is closed, busyness cleared, address, queue and hooks intact; mail piles up and arrives on return (the watchdog or verstak_stand). For a subagent\'s satellite seat the leave is total: the seat is released whole, mail does not pile up, there is no return — standing again is only verstak_stand with satellite_of. The bridge itself leaves only where a frame reaches only through a watchdog (Claude Code, Codex) and the watchdog has not been armed for 15 minutes; in pi and OpenCode a frame comes as a notification, and the bridge does not abandon the seat. Busyness clears at the end of the session.',
  },
};
