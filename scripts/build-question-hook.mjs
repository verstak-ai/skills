// The Claude Code plugin's refusal of AskUserQuestion, from its readable source
// (js/delivery/question-hook.mjs) into the one `node -e` command of hooks/hooks.json
// (graph @nks/nks-dev, node #10397). The command defines DENY — the deny answer with
// QUESTIONS.claude, in sight, where the sibling's rituals check reads permissionDecision:'deny' —
// then evaluates one single-quoted string: the cover's names and patterns from COVER, then the
// source without its line comments and globals line, every character a shell or the string would
// read escaped as \xNN. The command so holds no double quote, dollar or backtick, and the
// generator refuses one. `make build` and the pre-commit hook write it;
// js/tests/question-refusal.test.mjs fails when the committed command differs.
// `--check`: exit 1 on a difference, nothing written.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { COVER } from "../js/delivery/patterns/cover.ts";
import { QUESTIONS } from "../js/delivery/words/questions.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const SOURCE = join(ROOT, "js/delivery/question-hook.mjs");
export const HOOKS = join(ROOT, "hooks/hooks.json");
export const MATCHER = "AskUserQuestion";

/** The globals the source names, from the delivery: JS text each. */
function globals() {
  const forms = Object.values(COVER.forms);
  return {
    COVER_FILE: JSON.stringify(COVER.file),
    COVER_ROOT: JSON.stringify(COVER.root),
    FLAT_KEYS: JSON.stringify(forms.flatMap((f) => [f.graph, f.role])),
    OWN_STAMPS: `[${forms.map((f) => String(f.stamp)).join(",")}]`,
    OTHER_STAMP: String(COVER.stampShape),
  };
}

/** A JS single-quoted string's body: printable ASCII but the shell's and the string's own. */
const escaped = (text) =>
  [...text]
    .map((c) => {
      const n = c.codePointAt(0);
      if (n >= 0x20 && n <= 0x7e && !`"$\`'\\`.includes(c)) return c;
      if (n <= 0xff) return `\\x${n.toString(16).padStart(2, "0")}`;
      if (n <= 0xffff) return `\\u${n.toString(16).padStart(4, "0")}`;
      return `\\u{${n.toString(16)}}`;
    })
    .join("");

/** The command the source makes. */
export function questionHookCommand(source = readFileSync(SOURCE, "utf8")) {
  const code = source
    .split("\n")
    .filter((l) => !/^\s*(\/\/|\/\* global )/.test(l))
    .join("\n");
  const prelude = Object.entries(globals())
    .map(([name, value]) => `const ${name}=${value};`)
    .join("");
  const reason = QUESTIONS.en.claude();
  if (/[^\x20-\x7e]|['"$`\\]/.test(reason))
    throw new Error("the reason must be printable ASCII without quotes, dollar or backslash");
  const deny = `{hookSpecificOutput:{hookEventName:'PreToolUse',permissionDecision:'deny',permissionDecisionReason:'${reason}'}}`;
  const command = `node -e "const DENY=${deny};eval('${escaped(prelude + "\n" + code)}')"`;
  if (/["$`]/.test(command.slice('node -e "'.length, -1)))
    throw new Error("the command must hold no double quote, dollar or backtick");
  return command;
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
