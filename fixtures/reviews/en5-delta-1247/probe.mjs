// Run against the release worktree passed as argv[2]; evidence stays on this branch.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

assert.ok(process.argv[2], "pass the candidate worktree path");
const root = resolve(process.argv[2]);
const out = dirname(fileURLToPath(import.meta.url));
const scratch = mkdtempSync(join(tmpdir(), "en5-delta-"));
const file = "js/tests/personal-entry.test.mjs";
const records = [];
function git(...args) {
  const r = spawnSync("git", args, { cwd: root, encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
  return r.stdout;
}
function run(name, args, env, expected, failures) {
  const r = spawnSync(process.execPath, ["--test", "--test-reporter=tap", ...args], {
    cwd: root, env: { ...process.env, ...env }, encoding: "utf8", timeout: 120000,
  });
  writeFileSync(join(out, `${name}.stdout`), r.stdout || "");
  writeFileSync(join(out, `${name}.stderr`), r.stderr || "");
  records.push({ name, node: process.version, args, env, status: r.status, expected, failures });
  assert.equal(r.status, expected, name);
  assert.equal(Number(r.stdout.match(/^# fail (\d+)$/m)?.[1]), failures, name);
}
function replaceOnce(source, before, after) {
  assert.equal(source.split(before).length, 2, `one mutation site: ${before}`);
  return source.replace(before, after);
}
function mutant(name, source) {
  const path = join(scratch, `${name}.test.mjs`);
  writeFileSync(path, replaceOnce(source, 'import { REPO } from "./built.mjs";', `const REPO = ${JSON.stringify(root)};`));
  return path;
}
try {
  const source = readFileSync(join(root, file), "utf8");
  const previous = git("show", `d1e2a052:${file}`);
  run("targeted", [file, "js/tests/minding-contract.test.mjs", "js/tests/memory-paths.test.mjs"], {}, 0, 0);
  const oldDisabled = replaceOnce(previous,
    'assert.ok(texts[key].includes(clause), `${files[key]}: ${clause}`);', "void 0;");
  run("old-checker-disabled", [mutant("old-disabled", oldDisabled)], {}, 0, 0);
  const disabled = replaceOnce(source,
    'assert.ok(text.includes(clause), `${files[key]}: ${clause}`);', "void 0;");
  run("checker-disabled", [mutant("disabled", disabled)], {}, 1, 14);
  const recipeDisabled = replaceOnce(source, "assert.doesNotMatch(text, stale, key);", "void 0;");
  run("recipe-checker-disabled", [mutant("recipe-disabled", recipeDisabled)], {}, 1, 1);
  const base = join(scratch, "base");
  for (const path of ["skills/verstak/methods/minding.md", "skills/verstak/references/minding-personal-realm.md", "skills/verstak/methods/onboarding.md", "home/minding/SKILL.md"]) {
    mkdirSync(dirname(join(base, path)), { recursive: true });
    writeFileSync(join(base, path), git("show", `e515191a:${path}`));
  }
  run("base-negative", [file], { VERSTAK_MINDING_ROOT: base }, 1, 30);
  console.log("PASS: current text checks; old disabled checker escapes; new disabled checkers and old corpus rejected.");
} finally {
  writeFileSync(join(out, "commands.json"), `${JSON.stringify(records, null, 2)}\n`);
  rmSync(scratch, { recursive: true, force: true });
}
