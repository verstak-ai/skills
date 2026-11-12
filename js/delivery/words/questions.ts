// The refusal of the harness's blocking question tool (QUESTIONS; graph @nks/nks-dev, node #10397):
// the reason the Claude Code plugin's PreToolUse entry gives for denying AskUserQuestion. The entry
// in hooks/hooks.json carries this text inline, a self-standing command; a test holds the two equal.
// No quote, backtick, dollar or backslash: it sits inside a shell word and a JS string.
import type { Lang } from "../lang.ts";

export interface QuestionWords {
  claude: () => string;
}

export const QUESTIONS: Readonly<Record<Lang, QuestionWords>> = {
  en: {
    claude: () =>
      "AskUserQuestion is refused by the verstak delivery: a blocking question stalls the session. Ask in words someone answering now; a question that outlives the turn goes into the case as an ask card (verstak_case, action ask).",
  },
};
