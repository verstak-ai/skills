// The harness's blocking question tool refused by the delivery and alignment (graph @nks/nks-dev,
// node #10397): the Claude Code plugin's PreToolUse entry denies AskUserQuestion by itself — no
// rituals: field, no release build behind it — in the delivery's words, which send the question to
// a case's ask card, and only in a repository that is ours as the door counts it — the core's
// repoSigns verdict aligned or partial: our cover block, the older flat keys, our stamp lines, our
// start hook; another delivery's cover excluded. Elsewhere it says nothing (quiet by default,
// #10020, #10397). Every fixture is held against that core function. The template's AGENTS.md line names each harness's carriers,
// in the form the rituals check reads; align targets the contract that carries it.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { CONTRACT_SUPPORT, QUESTIONS } from "../delivery/index.ts";
import { repoSigns } from "../shared/reposigns.ts";
import { REPO } from "./built.mjs";

const FOREIGN = new RegExp("\\p{Script=Cyrillic}|is" + "kron", "iu");
const hooks = JSON.parse(readFileSync(join(REPO, "hooks/hooks.json"), "utf8")).hooks;
const refusals = (hooks.PreToolUse ?? []).filter((e) => e.matcher === "AskUserQuestion");

const COVER =
  "---\nverstak:\n  graph: r7\n  holon: 12\n  agent_role: 34\n  contract: 16\n  stamp: 2026-11-12\n---\n# x\n";
const DENY = () => ({
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    permissionDecision: "deny",
    permissionDecisionReason: QUESTIONS.en.claude(),
  },
});

/**
 * The declared command over a scratch tree, and whether the core counts the tree ours: `git` makes
 * it a repository, `agents` its AGENTS.md, `settings` its .claude/settings.json, `plugin` the
 * OpenCode rituals plugin align once wrote.
 */
function run({ git = true, agents, settings, plugin = false, sub = "", inputCwd = true } = {}) {
  const root = mkdtempSync(join(tmpdir(), "verstak-question-"));
  try {
    if (git) mkdirSync(join(root, ".git"));
    if (agents !== undefined) writeFileSync(join(root, "AGENTS.md"), agents);
    if (settings !== undefined) {
      mkdirSync(join(root, ".claude"));
      writeFileSync(join(root, ".claude/settings.json"), JSON.stringify(settings));
    }
    if (plugin) {
      mkdirSync(join(root, ".opencode/plugins"), { recursive: true });
      writeFileSync(join(root, ".opencode/plugins/verstak-rituals.js"), "export default {};\n");
    }
    const cwd = join(root, sub);
    mkdirSync(cwd, { recursive: true });
    const input = JSON.stringify({
      hook_event_name: "PreToolUse",
      tool_name: "AskUserQuestion",
      tool_input: { questions: [] },
      ...(inputCwd ? { cwd } : {}),
    });
    // No CLAUDE_PLUGIN_ROOT: the refusal stands on its own command.
    const env = { ...process.env };
    delete env.CLAUDE_PLUGIN_ROOT;
    const command = refusals[0]?.hooks[0].command ?? "true";
    const r = spawnSync(command, { shell: true, cwd, env, encoding: "utf8", input });
    const ours = ["aligned", "partial"].includes(repoSigns(cwd, "claude-code").verdict);
    return { ...r, ours };
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

const startHook = (command) => ({
  hooks: { SessionStart: [{ hooks: [{ type: "command", command }] }] },
});
const START = startHook("echo Load the verstak skill (/verstak) and run its Start section first.");
const FLAT = '---\nGraph: r7\nAgent role: #34 "dev"\n---\n# x\n';
const OUR_STAMP = "# x\n\n*(verstak align: contract `9`, stamped `2026-10-30` — re-run when …)*\n";
const OLD_STAMP = "# x\n\n*(verstakify: contract `5` — re-run when …)*\n";
const THEIR_STAMP = "# x\n\n*(other suite: contract `41`, stamped `2026-10-30`)*\n";
const THEIR_BLOCK = COVER.replace("verstak:", "neighbour:");

/** Ours as the door counts it: the hook refuses. */
const OURS = [
  { agents: COVER },
  { agents: COVER, sub: "src/deep" },
  { agents: COVER, sub: "src", inputCwd: false },
  {
    agents: COVER.replace("  graph: r7", '  graph: "r7" # the project graph').replace(
      /\n/g,
      "\r\n",
    ),
  },
  { agents: COVER.replace("  graph: r7\n", "") },
  { agents: FLAT },
  { agents: OUR_STAMP },
  { agents: OLD_STAMP },
  { agents: THEIR_STAMP + OUR_STAMP },
  { agents: THEIR_STAMP.replace("# x", FLAT.trimEnd()), settings: START },
  { settings: START },
  { plugin: true },
  { agents: THEIR_BLOCK, settings: START },
];
/** Not ours: no refusal, no verstak word. */
const NOT_OURS = [
  { agents: undefined },
  { agents: "# a repository of someone else's\n" },
  { agents: "---\nverstak: x\n---\n# x\n" },
  { agents: `# x\n\n${COVER}` },
  { agents: THEIR_BLOCK },
  { agents: THEIR_STAMP },
  { agents: THEIR_STAMP.replace("# x", FLAT.trimEnd()) },
  { agents: THEIR_BLOCK.replace("---\n# x", "Graph: r7\n---\n# x") },
  { settings: startHook("echo call verstak_orient first") },
  { git: false, agents: COVER },
];

test("hooks.json: one PreToolUse entry on the exact name AskUserQuestion", () => {
  assert.equal(refusals.length, 1);
  assert.equal(refusals[0].hooks.length, 1);
  // The rituals check reads the plugin's denial by this mark in the command.
  assert.match(refusals[0].hooks[0].command, /permissionDecision:'deny'/);
});

test("the hook refuses exactly where the core counts the repository ours", () => {
  for (const [fixtures, ours] of [
    [OURS, true],
    [NOT_OURS, false],
  ])
    for (const opts of fixtures) {
      const r = run(opts);
      const what = JSON.stringify(opts);
      assert.equal(r.ours, ours, `core: ${what}`);
      assert.equal(r.status, 0, r.stderr);
      assert.equal(r.stderr, "", what);
      if (ours) assert.deepEqual(JSON.parse(r.stdout || "null"), DENY(), what);
      else assert.equal(r.stdout, "", what);
    }
});

test("the refusal's words send the question to a case's ask card, in English", () => {
  const w = QUESTIONS.en.claude();
  assert.match(w, /AskUserQuestion/);
  assert.match(w, /\bask card\b/);
  assert.match(w, /verstak_case/);
  assert.doesNotMatch(w, FOREIGN);
  // Carried inside a double-quoted shell word and a single-quoted JS string.
  assert.doesNotMatch(w, /["'`$\\]/);
});

test("the template's AGENTS.md line names both tools and the case ask card", () => {
  const t = readFileSync(join(REPO, "skills/verstak/templates/agents-template.md"), "utf8");
  const line = t.split("\n").find((l) => l.includes("AskUserQuestion"));
  assert.ok(line, "no line names AskUserQuestion");
  assert.match(line, /`question` \(OpenCode\)/);
  assert.match(line, /`AskUserQuestion` \(Claude Code\)/);
  assert.match(line, /`ask` card/);
  assert.match(line, /permissions\.deny/);
  assert.match(line, /\.opencode\/opencode\.json/);
  assert.match(line, /plugin/);
});

test("align targets contract 16, which carries the refusal; 11 stays the lowest", () => {
  assert.deepEqual(CONTRACT_SUPPORT, { minimum: 11, target: 16 });
});
