// Exercise repository hook commands without a live harness or a real git push.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const settings = JSON.parse(readFileSync(join(root, ".claude/settings.json"), "utf8"));
const commands = Object.entries(settings.hooks).flatMap(([event, entries]) =>
  entries.flatMap((entry) =>
    entry.hooks
      .filter((hook) => hook.type === "command")
      .map((hook) => ({ event, command: hook.command })),
  ),
);

for (const [index, { event, command }] of commands.entries()) {
  test(`${event} hook ${index}: projected command parses as shell`, () => {
    const run = spawnSync("/bin/sh", ["-n"], { input: command, encoding: "utf8" });
    assert.equal(run.status, 0, run.stderr);
  });
}

test("source push envelope: shell quoting preserves the published JSON", () => {
  const source = readFileSync(join(root, "skills/verstak/references/align-hooks.md"), "utf8");
  const block = source.split("## Push reminder envelope")[1]?.match(/```json\n([\s\S]*?)\n```/);
  assert.ok(block, "the source must provide its shell-safe push envelope");
  const envelope = JSON.parse(block[1]);
  const run = spawnSync("/bin/sh", ["-c", `echo '${JSON.stringify(envelope)}'`], {
    encoding: "utf8",
  });
  assert.equal(run.status, 0, run.stderr);
  assert.deepEqual(JSON.parse(run.stdout), envelope);
  assert.equal(envelope.hookSpecificOutput.hookEventName, "PostToolUse");
  assert.match(envelope.hookSpecificOutput.additionalContext, /review tier/);
});

const push = commands.find(({ command }) => command.includes("A push shipped nothing"));

for (const [command, stdout, expected] of [
  [
    "git push origin fix/probe",
    "To git@github.com:verstak-ai/skills.git\n * [new branch]      fix/probe -> fix/probe\n",
    true,
  ],
  ["git push --help", "usage: git push [options]\n", false],
]) {
  test(`push reminder: ${command}`, () => {
    assert.ok(push, "the repository must carry its push reminder");
    const run = spawnSync("/bin/sh", ["-c", push.command], {
      cwd: root,
      input: JSON.stringify({ tool_input: { command }, tool_response: { stdout, stderr: "" } }),
      encoding: "utf8",
    });
    assert.equal(run.status, 0, run.stderr);
    assert.equal(run.stderr, "");
    if (expected) {
      const context = JSON.parse(run.stdout).hookSpecificOutput;
      assert.equal(context.hookEventName, "PostToolUse");
      assert.match(context.additionalContext, /review tier/);
      assert.match(context.additionalContext, /methods\/code-work\.md/);
    } else assert.equal(run.stdout, "");
  });
}
