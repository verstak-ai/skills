// Execute the shipped hook and its repository projection, without writing memory.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root =
  process.env.MEMORY_GUARD_ROOT || join(dirname(fileURLToPath(import.meta.url)), "../..");
const text = readFileSync(join(root, "skills/verstak/references/align-hooks.md"), "utf8");
const source = JSON.parse(text.split("## Memory guard")[1].match(/```json\n([\s\S]*?)\n```/)[1]);
const settings = JSON.parse(readFileSync(join(root, ".claude/settings.json"), "utf8"));
const commands = {
  source: source.hooks[0].command,
  repository: settings.hooks.PreToolUse.flatMap((entry) => entry.hooks).find((hook) =>
    hook.command.includes("mem()"),
  ).command,
};
const cases = [
  [String.raw`C:\Users\review\.claude\projects\review\memory\MEMORY.md`, 2],
  [String.raw`C:\Users\review\.CLAUDE\Projects\review\MeMoRy\note.md`, 2],
  [String.raw`\\server\users\review\.claude\projects\review\memory\note.md`, 2],
  [String.raw`C:\Users\review\.claude\projects\review\other\..\memory\note.md`, 2],
  ["C:/Users/review/.claude/projects/review/memory/MEMORY.md", 2],
  ["/nonexistent/.claude/projects/review/memory/note.md", 2],
  [String.raw`C:\work\repo\docs\ordinary.md`, 0],
  [String.raw`C:\work\repo\memory\ordinary.md`, 0],
  ["docs/ordinary.md", 0],
];
for (const [carrier, command] of Object.entries(commands)) {
  for (const field of ["file_path", "notebook_path"]) {
    for (const [path, expected] of cases) {
      test(`${carrier}: ${field} ${path} exits ${expected}`, () => {
        const run = spawnSync("/bin/sh", ["-c", command], {
          cwd: root,
          input: JSON.stringify({ tool_input: { [field]: path } }),
          encoding: "utf8",
        });
        assert.equal(run.status, expected, run.stderr);
        if (expected === 2) assert.match(run.stderr, /minding/);
        else assert.equal(run.stderr, "");
      });
    }
  }
}
