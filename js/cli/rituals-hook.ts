// The plugin's ritual hooks in Claude Code (hooks/hooks.json; graph @nks/nks-dev, node #9319,
// section RITUALS): one entry for every event it is wired to. SessionStart — the start word with
// the cover's addresses, or the early word while it names only the graph (#8018); PostToolUse of Bash — the push and merge words by outcome
// (shared/ritualjudge.ts); Stop — the turn's end on a watch (shared/turnend.ts, #9342). Switched on by the cover of the session's repository
// (shared/ritualcover.ts), each kind its rituals field leaves out silent; a kind the repository's own settings hold on this event's source or
// tool (hookkinds.ts, by matcher) keeps it silent there — no word twice, none lost. The memory guard stays the repository's hook: a plugin hook's blocking
// exit was not observed on the carrier. After a compaction the onboarding hook speaks, not this.
// Local reads only; always exit 0.
import { readFileSync } from "node:fs";

import { RITES, TURN } from "../delivery/index.ts";
import { wordsIn } from "../shared/lang.ts";
import { ritualCover, startWord } from "../shared/ritualcover.ts";
import { merged, pushed } from "../shared/ritualjudge.ts";
import { lostWord, TURN_RITE } from "../shared/turnend.ts";
import { standingRites } from "./hookkinds.ts";
import { lastTurn } from "./turnread.ts";

interface HookInput {
  hook_event_name?: unknown;
  source?: unknown;
  cwd?: unknown;
  tool_name?: unknown;
  tool_input?: { command?: unknown };
  tool_response?: unknown;
  transcript_path?: unknown;
  stop_hook_active?: unknown;
}

function hookInput(): HookInput {
  try {
    if (!process.stdin.isTTY) return (JSON.parse(readFileSync(0, "utf8")) as HookInput) ?? {};
  } catch {
    /* no input or not JSON */
  }
  return {};
}

/** What the call printed: stdout and stderr of the harness's answer, or its text. */
function printed(r: unknown): { output: string; exit: number | null } {
  if (!r || typeof r !== "object") return { output: String(r ?? ""), exit: null };
  const o = r as { stdout?: unknown; stderr?: unknown; exit_code?: unknown };
  const exit = typeof o.exit_code === "number" ? o.exit_code : null;
  return { output: `${String(o.stdout ?? "")}\n${String(o.stderr ?? "")}`, exit };
}

/** The words this event calls for in the session's repository. */
function riteWords(input: HookInput, dir: string): string[] {
  const cover = ritualCover(dir);
  if (!cover) return [];
  const event = input.hook_event_name;
  if (event === "SessionStart") {
    const source = typeof input.source === "string" ? input.source : "startup";
    if (source === "compact" || !cover.on.has("start")) return [];
    if (standingRites(cover.root, source).has("hook.start")) return [];
    return [startWord(cover)];
  }
  if (event !== "PostToolUse" || input.tool_name !== "Bash") return [];
  const own = standingRites(cover.root, "Bash");
  const call = {
    command: String(input.tool_input?.command ?? ""),
    ...printed(input.tool_response),
  };
  const said: string[] = [];
  const W = wordsIn(RITES, cover.lang);
  if (cover.on.has("push") && !own.has("hook.push") && pushed(call, dir)) said.push(W.push());
  if (cover.on.has("merge") && !own.has("hook.merge") && merged(call))
    said.push(W.merge(cover.holon));
  return said;
}

/**
 * Stop: the wake word when a frame's turn ended with text nobody reads (turnread.ts) — with or
 * without a cover, a frame proves the seat; a cover whose rituals leave it out keeps it silent;
 * never in the turn the word itself woke.
 */
function turnWord(input: HookInput, dir: string): string | null {
  if (input.stop_hook_active === true || typeof input.transcript_path !== "string") return null;
  const cover = ritualCover(dir);
  if (cover && !cover.on.has(TURN_RITE)) return null;
  const turn = lastTurn(input.transcript_path);
  return turn && lostWord(turn) ? wordsIn(TURN, cover?.lang).wake() : null;
}

try {
  const input = hookInput();
  const dir =
    typeof input.cwd === "string" && input.cwd
      ? input.cwd
      : process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const reason = input.hook_event_name === "Stop" ? turnWord(input, dir) : null;
  if (reason) process.stdout.write(`${JSON.stringify({ decision: "block", reason })}\n`);
  const said = riteWords(input, dir);
  if (said.length) {
    const hookEventName = String(input.hook_event_name);
    const additionalContext = said.join("\n\n");
    process.stdout.write(
      `${JSON.stringify({ hookSpecificOutput: { hookEventName, additionalContext } })}\n`,
    );
  }
} catch {
  /* a hook never fails the session */
}
process.exitCode = 0;
