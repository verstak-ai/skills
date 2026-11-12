// The Claude Code plugin's refusal of AskUserQuestion, from its readable source
// (js/delivery/question-hook.mjs) into the one `node -e` command of hooks/hooks.json
// (graph @nks/nks-dev, node #10397). The source's full-line comments go, its lines are joined,
// DENY becomes the deny answer with QUESTIONS.claude, and the whole is escaped for a
// double-quoted shell word. `make build` writes it; js/tests/question-refusal.test.mjs fails
// when the committed command differs. `--check`: exit 1 on a difference, nothing written.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { QUESTIONS } from "../js/delivery/words/questions.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const SOURCE = join(ROOT, "js/delivery/question-hook.mjs");
export const HOOKS = join(ROOT, "hooks/hooks.json");
export const MATCHER = "AskUserQuestion";

/** The command the source makes. */
export function questionHookCommand(source = readFileSync(SOURCE, "utf8")) {
  const body = source
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("//"))
    .join(" ");
  const reason = QUESTIONS.en.claude();
  if (/['\\\n]/.test(reason)) throw new Error("the reason must sit in a single-quoted JS string");
  // The rituals check of the sibling delivery reads the denial by permissionDecision:'deny'.
  const deny = `{hookSpecificOutput:{hookEventName:'PreToolUse',permissionDecision:'deny',permissionDecisionReason:'${reason}'}}`;
  const parts = body.split(/\bDENY\b/);
  if (parts.length !== 2) throw new Error("the source must name DENY exactly once");
  const js = parts.join(deny);
  if (/[^\x20-\x7e]/.test(js)) throw new Error("the command must be printable ASCII");
  return `node -e "${js.replace(/[\\"$`]/g, (m) => `\\${m}`)}"`;
}

/** The PreToolUse entry on AskUserQuestion in the parsed hooks.json. */
export const entryOf = (hooks) =>
  (hooks.hooks.PreToolUse ?? []).find((e) => e.matcher === MATCHER)?.hooks[0];

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const hooks = JSON.parse(readFileSync(HOOKS, "utf8"));
  const entry = entryOf(hooks);
  if (!entry) throw new Error(`no PreToolUse entry on ${MATCHER} in ${HOOKS}`);
  const command = questionHookCommand();
  if (entry.command !== command) {
    if (process.argv.includes("--check")) {
      console.error(`${HOOKS}: the ${MATCHER} command differs from ${SOURCE}; run make build`);
      process.exit(1);
    }
    entry.command = command;
    writeFileSync(HOOKS, `${JSON.stringify(hooks, null, 2)}\n`);
  }
}
