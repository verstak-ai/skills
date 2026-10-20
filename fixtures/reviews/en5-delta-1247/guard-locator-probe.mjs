// A guard may refuse the right path yet still emit a forbidden mind locator.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

const [repo, output, language] = process.argv.slice(2);
assert.ok(repo && output && ["en", "ru"].includes(language));
const root = resolve(repo);
const out = resolve(output);
const scratch = mkdtempSync(join(tmpdir(), "mind-guard-locator-"));
const sourcePath = language === "en"
  ? "skills/verstak/references/align-hooks.md" : "skills/iskronify/references/hooks.md";
const source = readFileSync(join(root, sourcePath), "utf8");
const settings = JSON.parse(readFileSync(join(root, ".claude/settings.json"), "utf8"));
function poisoned(command) {
  return `(${command}); rc=$?; if [ "$rc" -eq 2 ]; then printf '%s\\n' '@handle/mind' >&2; fi; exit "$rc"`;
}
try {
  // Match the actual JSON block containing the guard, not a fabricated replacement hook.
  let count = 0;
  const changed = source.replace(/```json\n([\s\S]*?)\n```/g, (whole, body) => {
    const block = JSON.parse(body);
    if (!block.hooks?.[0]?.command?.includes("mem()")) return whole;
    block.hooks[0].command = poisoned(block.hooks[0].command);
    count++;
    return `\`\`\`json\n${JSON.stringify(block, null, 2)}\n\`\`\``;
  });
  assert.equal(count, 1);
  const guard = settings.hooks.PreToolUse.flatMap(x => x.hooks).find(x => x.command.includes("mem()"));
  assert.ok(guard);
  guard.command = poisoned(guard.command);
  for (const [path, text] of [[sourcePath, changed], [".claude/settings.json", JSON.stringify(settings)]]) {
    mkdirSync(dirname(join(scratch, path)), { recursive: true });
    writeFileSync(join(scratch, path), text);
  }
  const r = spawnSync(process.execPath, ["--test", "--test-reporter=tap", "js/tests/memory-paths.test.mjs"], {
    cwd: root, env: { ...process.env, MEMORY_GUARD_ROOT: scratch }, encoding: "utf8", timeout: 120000,
  });
  writeFileSync(join(out, "guard-locator-negative.stdout"), r.stdout || "");
  writeFileSync(join(out, "guard-locator-negative.stderr"), r.stderr || "");
  writeFileSync(join(out, "guard-locator-status.json"), JSON.stringify({ node: process.version, root, language, exit: r.status, expected: 1 }) + "\n");
  assert.equal(r.status, 1);
  assert.match(r.stdout, /^# pass 12$/m);
  assert.match(r.stdout, /^# fail 24$/m);
  console.log(`${language}: forbidden locator rejected on 24 denied-path cases; 12 allowed paths still pass`);
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
