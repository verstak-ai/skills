// Exercise the shipped-output gate in an isolated tree, never rewriting repo outputs.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";

import { REPO } from "./built.mjs";

const OUTPUTS = [
  "skills/verstak/scripts/verstak-bridge.mjs",
  "skills/verstak/scripts/opencode-plugin.js",
  "extensions/verstak.js",
];
const VERSION_LINE = /^var VERSION = "[^"]+";$/m;

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), "verstak-build-check-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, "js/delivery"), { recursive: true });
  copyFileSync(join(REPO, "js/build.mjs"), join(root, "js/build.mjs"));
  copyFileSync(join(REPO, "js/delivery/version.ts"), join(root, "js/delivery/version.ts"));
  symlinkSync(join(REPO, "js/node_modules"), join(root, "js/node_modules"), "dir");
  const source = readFileSync(join(root, "js/delivery/version.ts"), "utf8");
  const version = /^export const VERSION = "([^"]+)";/m.exec(source)[1];
  for (const rel of OUTPUTS) {
    const text = readFileSync(join(REPO, rel), "utf8");
    assert.match(text, VERSION_LINE, `${rel} must carry the esbuild VERSION declaration`);
    const path = join(root, rel);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, text.replace(VERSION_LINE, `var VERSION = "${version}";`));
  }
  return root;
}

function check(root) {
  return spawnSync(process.execPath, [join(root, "js/build.mjs"), "--check"], {
    encoding: "utf8",
  });
}

test("check-js accepts release outputs carrying exactly the source stamp", (t) => {
  const result = check(fixture(t));
  assert.equal(result.status, 0, result.stderr);
});

test("check-js rejects outputs left behind by a release-please version bump", (t) => {
  const root = fixture(t);
  const path = join(root, "js/delivery/version.ts");
  writeFileSync(
    path,
    readFileSync(path, "utf8").replace(
      /^export const VERSION = "[^"]+";/m,
      'export const VERSION = "99.0.0";',
    ),
  );
  const result = check(root);
  assert.equal(result.status, 1, result.stdout + result.stderr);
  for (const rel of OUTPUTS) assert.ok(result.stderr.includes(rel), result.stderr);
  assert.match(result.stderr, /stamped version 99\.0\.0/);
});

test("bundle-sync checks the release build before committing it", () => {
  const workflow = readFileSync(join(REPO, ".github/workflows/release-please.yml"), "utf8");
  const build = workflow.indexOf("run: make build-release");
  const check = workflow.indexOf("run: make check-js", build);
  const commit = workflow.indexOf("git commit", build);
  assert.ok(build >= 0 && check > build && commit > check);
});

for (const rel of OUTPUTS) {
  test(`check-js rejects a wrong embedded version in ${rel}`, (t) => {
    const root = fixture(t);
    const path = join(root, rel);
    const text = readFileSync(path, "utf8");
    // Leave the expected version elsewhere: substring presence is not equality.
    writeFileSync(
      path,
      `${text.replace(VERSION_LINE, 'var VERSION = "0.0.0-wrong";')}\n// ${text.match(VERSION_LINE)[0]}\n`,
    );
    const result = check(root);
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.ok(result.stderr.includes(rel), result.stderr);
    assert.match(result.stderr, /version/);
  });
}

for (const kind of ["missing", "duplicate"]) {
  test(`check-js rejects a ${kind} embedded VERSION declaration`, (t) => {
    const root = fixture(t);
    const path = join(root, OUTPUTS[0]);
    const text = readFileSync(path, "utf8");
    writeFileSync(
      path,
      kind === "missing"
        ? text.replace(VERSION_LINE, "")
        : `${text}\n${text.match(VERSION_LINE)[0]}\n`,
    );
    const result = check(root);
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.match(result.stderr, /exactly one embedded VERSION/);
  });
}
