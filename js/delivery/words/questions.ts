// The refusal of the harness's blocking question tool (QUESTIONS; graph @nks/nks-dev, node #10397)
// and the words of the checks of its layers.
// `claude` is the reason the Claude Code plugin's PreToolUse entry gives for denying AskUserQuestion
// under our cover (none outside it, graph @nks/nks-dev, node #10020). The entry in hooks/hooks.json
// carries this text inline, a self-standing command; a test holds the two equal. No quote, backtick,
// dollar or backslash in it: it sits inside a shell word and a JS string.
// The rest the core reads: `guard` — the OpenCode plugin's denial message; `permissions`,
// `denyArray`, `manual` — prepare's refusals of a project layer it will not rewrite; the others —
// the rows of check-rituals' question audit.
import type { Lang } from "../lang.ts";

export interface QuestionWords {
  claude: () => string;
  guard: () => string;
  permissions: () => string;
  denyArray: () => string;
  manual: (file: string, reason: "both" | "parse" | "shape" | "missing") => string;
  fileBasis: () => string;
  pluginBasis: () => string;
  instructions: () => string;
  claudeProject: () => string;
  claudePlugin: () => string;
  claudeFile: () => string;
  opencodeFile: () => string;
  opencodeMissing: () => string;
  opencodeGuard: () => string;
}

export const QUESTIONS: Readonly<Record<Lang, QuestionWords>> = {
  en: {
    claude: () =>
      "AskUserQuestion is refused by the verstak delivery: a blocking question stalls the session. Ask in words someone answering now; a question that outlives the turn goes into the case as an ask card (verstak_case, action ask).",
    guard: () =>
      "question is refused by the verstak delivery: a blocking question stalls the session. Ask in words someone answering now; a question that outlives the turn goes into the case as an ask card (verstak_case, action ask).",
    permissions: () => ".claude/settings.json: permissions must be an object — repair it by hand",
    denyArray: () =>
      ".claude/settings.json: permissions.deny must be an array of strings — repair it by hand",
    manual: (file, reason) =>
      `${file}: ${
        {
          both: "both opencode.json and opencode.jsonc exist — keep one, by hand",
          parse: "does not parse — repair it by hand",
          shape: "unsupported shape (an object with a policies array expected) — repair it by hand",
          missing:
            'no policy { "action": "tool.use", "resource": "question:*", "effect": "deny" } — add it by hand (a .jsonc is never rewritten)',
        }[reason]
      }`,
    fileBasis: () => "file contents, not a live harness",
    pluginBasis: () => "manifest or stand-in context, not a live harness",
    instructions: () =>
      "AGENTS.md names no refusal of question / AskUserQuestion with the way through an ask card in the case (contents checked only)",
    claudeProject: () => ".claude/settings.json has no permissions.deny entry AskUserQuestion",
    claudePlugin: () =>
      "the Claude Code plugin's PreToolUse refusal of AskUserQuestion is missing (manifest checked, not live enforcement)",
    claudeFile: () => "the Claude Code plugin's hooks/hooks.json",
    opencodeFile: () => "the OpenCode plugin",
    opencodeMissing: () => "the OpenCode plugin is not installed",
    opencodeGuard: () =>
      "the OpenCode plugin did not remove and refuse question, or refused an unrelated action as well (stand-in context)",
  },
};
