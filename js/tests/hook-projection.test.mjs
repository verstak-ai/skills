// Exercise repository hook commands without a live harness or a real git push.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const settings = JSON.parse(readFileSync(join(root, ".claude/settings.json"), "utf8"));
const source = readFileSync(join(root, "skills/verstak/references/align-hooks.md"), "utf8");
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

function publishedCommands(value) {
  if (!value || typeof value !== "object") return [];
  return [
    ...(typeof value.command === "string" ? [value.command] : []),
    ...Object.values(value).flatMap(publishedCommands),
  ];
}

test("every published JSON hook command parses as shell", () => {
  const published = [...source.matchAll(/```json\n([\s\S]*?)\n```/g)].flatMap((block) =>
    publishedCommands(JSON.parse(block[1])),
  );
  assert.ok(published.length, "the source must publish its hook commands");
  for (const command of published) {
    const run = spawnSync("/bin/sh", ["-n"], { input: command, encoding: "utf8" });
    assert.equal(run.status, 0, run.stderr);
  }
});

test("published SessionStart command emits its declared JSON envelope", () => {
  const block = source.match(/```json\n([\s\S]*?)\n```/);
  const command = JSON.parse(block[1]).hooks.SessionStart[0].hooks[0].command;
  const payload = command.match(/^echo '([\s\S]*)'$/);
  assert.ok(payload, "the source must declare its echo envelope");
  const expected = JSON.parse(payload[1]);
  const cwd = mkdtempSync(join(tmpdir(), "verstak-hook-envelope-"));
  try {
    const run = spawnSync("/bin/sh", ["-c", command], { cwd, encoding: "utf8" });
    assert.equal(run.status, 0, run.stderr);
    assert.deepEqual(JSON.parse(run.stdout), expected);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("source push envelope: shell quoting preserves the published JSON", () => {
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
