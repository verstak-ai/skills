// The kit of the delivery's ritual probes in our words (rituals-hook.test.mjs,
// rituals-turn.test.mjs): temporary repositories with a verstak: cover and the Claude Code
// plugin's declared rituals command run as the harness runs it. No network, no model. The
// OpenCode side of the same rituals is the core's (shared/ritualcover.ts and the words are
// common to both); its probes are the sibling's suite.
//
// VERSTAK_RITUALS_HOOK points the probes at any copy (a past release).
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after } from "node:test";

import { envName } from "../delivery/index.ts";
import { BUILT_RITUALS_HOOK, REPO } from "./built.mjs";

const HOOK = process.env.VERSTAK_RITUALS_HOOK || BUILT_RITUALS_HOOK;
const scratch = mkdtempSync(join(tmpdir(), "verstak-rites-"));
after(() => rmSync(scratch, { recursive: true, force: true }));

export const COVER =
  "---\nverstak:\n  graph: r7\n  holon: 12\n  agent_role: 34\n  contract: 11\n  stamp: 2026-11-03\n---\n# x\n";
export const PUSHED = "To github.com:o/r.git\n   a1b2c3d..e4f5a6b  feat/x -> feat/x";
let n = 0;
export function repo({ agents = COVER, settings } = {}) {
  const dir = join(scratch, `r${n++}`);
  mkdirSync(join(dir, ".git"), { recursive: true });
  if (agents) writeFileSync(join(dir, "AGENTS.md"), agents);
  if (settings) {
    mkdirSync(join(dir, ".claude"));
    writeFileSync(join(dir, ".claude", "settings.json"), JSON.stringify(settings));
  }
  return dir;
}

const declared = JSON.parse(readFileSync(join(REPO, "hooks", "hooks.json"), "utf8")).hooks;
export const ritesOf = (event) =>
  (declared[event] ?? []).filter((e) => e.hooks.some((h) => h.command.includes("'rituals.mjs'")));

const root = join(scratch, "plugin");
mkdirSync(join(root, "hooks"), { recursive: true });
if (existsSync(HOOK)) copyFileSync(HOOK, join(root, "hooks", "rituals.mjs"));

/** The hook's whole answer: the parsed JSON it printed, or null for none. */
export function claudeRaw(dir, input) {
  const command = ritesOf(input.hook_event_name)[0]?.hooks[0].command ?? "true";
  const env = { ...process.env, CLAUDE_PLUGIN_ROOT: root, [envName("BRIDGE_NO_UPDATE")]: "1" };
  const r = spawnSync(command, {
    shell: true,
    cwd: dir,
    env,
    encoding: "utf8",
    input: JSON.stringify({ cwd: dir, ...input }),
  });
  assert.equal(r.status, 0, r.stderr);
  return r.stdout.trim() ? JSON.parse(r.stdout) : null;
}
export const claude = (dir, input) => claudeRaw(dir, input)?.hookSpecificOutput ?? null;
export const start = (dir, source = "startup") =>
  claude(dir, { hook_event_name: "SessionStart", source });
export const bash = (dir, command, stdout = "", exit_code) =>
  claude(dir, {
    hook_event_name: "PostToolUse",
    tool_name: "Bash",
    tool_input: { command },
    tool_response: { stdout, stderr: "", ...(exit_code === undefined ? {} : { exit_code }) },
  });
