// The turn's end word (graph @nks/nks-dev, nodes #9345, #9342): a turn begun by a channel or case
// frame, with no word of the person in it, ended in console text without an ask, say or send — the
// delivery wakes the session once with this word (the OpenCode plugin on session.idle, the Claude
// Code plugin's Stop hook).
import type { Lang } from "../lang.ts";
import { FRAME_MARK, tool } from "../protocol.ts";

export interface TurnWords {
  /** The waking word: nobody reads the turn's text — where a question and a report go. */
  wake: () => string;
  /** To the plugin's service stderr: the word did not enter the session. */
  notLaid: (session: string, why: string) => string;
}

export const TURN: Readonly<Record<Lang, TurnWords>> = {
  en: {
    wake: () =>
      `${FRAME_MARK} No human at the console: a question — an ask card in the case; a report — the case or the channel to their seat (${tool("case")} ask/say, ${tool("channel")} send). Nothing to say — the turn ends, no text.`,
    notLaid: (session, why) => `the turn's end word did not enter session ${session}: ${why}`,
  },
};
