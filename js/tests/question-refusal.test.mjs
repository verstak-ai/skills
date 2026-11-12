// The harness's blocking question tool refused by the delivery and alignment (graph @nks/nks-dev,
// node #10397): the Claude Code plugin's PreToolUse entry denies AskUserQuestion by itself — no
// cover, no rituals: field, no release build behind it — in the delivery's words, which send the
// question to a case's ask card; the template's AGENTS.md line names both harnesses' tools and the
// card, in the form the rituals check reads; align targets the contract that carries it.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { CONTRACT_SUPPORT, QUESTIONS } from "../delivery/index.ts";
import { REPO } from "./built.mjs";

const FOREIGN = new RegExp("\\p{Script=Cyrillic}|is" + "kron", "iu");
const hooks = JSON.parse(readFileSync(join(REPO, "hooks/hooks.json"), "utf8")).hooks;
const refusals = (hooks.PreToolUse ?? []).filter((e) => e.matcher === "AskUserQuestion");

function run(command, input) {
  const cwd = mkdtempSync(join(tmpdir(), "verstak-question-"));
  try {
    // No CLAUDE_PLUGIN_ROOT: the refusal stands on its own command.
    const env = { ...process.env };
    delete env.CLAUDE_PLUGIN_ROOT;
    return spawnSync(command, { shell: true, cwd, env, encoding: "utf8", input });
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
}

test("hooks.json: one PreToolUse entry on the exact name AskUserQuestion", () => {
  assert.equal(refusals.length, 1);
  assert.equal(refusals[0].hooks.length, 1);
  // The rituals check reads the plugin's denial by this mark in the command.
  assert.match(refusals[0].hooks[0].command, /permissionDecision:'deny'/);
});

test("the plugin's refusal denies the call in the delivery's words, with no cover around it", () => {
  const input = JSON.stringify({
    hook_event_name: "PreToolUse",
    tool_name: "AskUserQuestion",
    tool_input: { questions: [] },
  });
  const r = run(refusals[0].hooks[0].command, input);
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(JSON.parse(r.stdout), {
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: QUESTIONS.en.claude(),
    },
  });
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
});

test("align targets contract 16, which carries the refusal; 11 stays the lowest", () => {
  assert.deepEqual(CONTRACT_SUPPORT, { minimum: 11, target: 16 });
});
