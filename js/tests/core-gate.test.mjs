// The core boundary gate (scripts/check-core.mjs): each case lays a scratch tree with
// one violation in the core — the gate must fail naming the file; in the delivery
// layer and the tests the same text is lawful. The trees are written at run time:
// the repository's own text ban would refuse them as tracked fixtures.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, test } from "node:test";

import { PRODUCT } from "../delivery/product.ts";
import { REPO } from "./built.mjs";

const GATE = join(REPO, "scripts", "check-core.mjs");
const TMP = mkdtempSync(join(tmpdir(), "core-gate-"));
after(() => rmSync(TMP, { recursive: true, force: true }));

const Upper = PRODUCT[0].toUpperCase() + PRODUCT.slice(1);
// Cyrillic letters by code point, so this file stays in the repository's alphabet.
const CYR = String.fromCodePoint(0x0434, 0x0435, 0x043b, 0x043e);
const PRODUCT_TS = `export const PRODUCT = "${PRODUCT}";\n`;

/** A tree: the delivery's product file plus the given files; returns its root. */
function tree(name, files) {
  const root = join(TMP, name);
  for (const [rel, text] of Object.entries({ "js/delivery/product.ts": PRODUCT_TS, ...files })) {
    mkdirSync(dirname(join(root, rel)), { recursive: true });
    writeFileSync(join(root, rel), text);
  }
  return root;
}

const gate = (root) =>
  spawnSync(process.execPath, [GATE, ...(root ? ["--root", root] : [])], { encoding: "utf8" });

const RED = {
  string: [
    { "js/bridge/a.ts": `export const a = "${PRODUCT}-bridge";\n` },
    "js/bridge/a.ts:1: product name",
  ],
  template: [
    { "js/bridge/a.ts": "const x = 1;\nexport const a = `" + Upper + ": ${x}`;\n" },
    "js/bridge/a.ts:2: product name",
  ],
  identifier: [
    { "js/opencode/a.ts": `export const ${PRODUCT}Name = 1;\n` },
    "js/opencode/a.ts:1: product name",
  ],
  "cyrillic-regex": [
    { "js/watchdog/a.ts": `export const re = /${CYR}/;\n` },
    "js/watchdog/a.ts:1: Cyrillic letter",
  ],
  "cyrillic-comment": [
    { "js/extension/a.ts": `// ${CYR}\nexport {};\n` },
    "js/extension/a.ts:1: Cyrillic letter",
  ],
  "l-call": [
    { "js/shared/a.ts": 'const L = (a: string) => a;\nexport const w = L("x");\n' },
    "js/shared/a.ts:2: call L(",
  ],
  filename: [{ [`js/cli/${PRODUCT}.ts`]: "export {};\n" }, `js/cli/${PRODUCT}.ts:0: product name`],
  nested: [
    { "js/shared/deep/inner/x.ts": `export const a = "${PRODUCT}";\n` },
    "js/shared/deep/inner/x.ts:1: product name",
  ],
  "new-dir": [
    { "js/daemon/a.ts": "export {};\n" },
    "js/daemon/:0: a directory neither core nor known outside it",
  ],
};

for (const [name, [files, line]] of Object.entries(RED)) {
  test(`core gate refuses: ${name}`, () => {
    const r = gate(tree(name, files));
    assert.equal(r.status, 1, r.stdout + r.stderr);
    assert.ok(r.stderr.includes(line), `expected "${line}" in:\n${r.stderr}`);
  });
}

test("core gate passes the same strings in js/delivery and js/tests", () => {
  const r = gate(
    tree("outside-core", {
      "js/delivery/words/a.ts": `export const a = "${Upper} ${CYR}";\n`,
      "js/tests/a.test.mjs": `export const a = "${PRODUCT}";\n`,
      "js/bridge/ok.ts": "export const ok = 1;\n",
    }),
  );
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /^✓ check-core/);
});

test("core gate passes the real repo", () => {
  const r = gate();
  assert.equal(r.status, 0, r.stdout + r.stderr);
});

test("the core lock matches the copied core", () => {
  const r = spawnSync(process.execPath, [join(REPO, "scripts", "check-core-lock.mjs")], {
    encoding: "utf8",
  });
  assert.equal(r.status, 0, r.stdout + r.stderr);
});

test("the core lock refuses a core file edited in place", () => {
  const root = tree("lock-edit", { "js/bridge/a.ts": "export const a = 1;\n" });
  const lock = (args) =>
    spawnSync(
      process.execPath,
      [join(REPO, "scripts", "check-core-lock.mjs"), "--root", root, ...args],
      {
        encoding: "utf8",
      },
    );
  assert.equal(lock(["--write", "0".repeat(40)]).status, 0);
  assert.equal(lock([]).status, 0);
  writeFileSync(join(root, "js/bridge/a.ts"), "export const a = 2;\n");
  const edited = lock([]);
  assert.equal(edited.status, 1);
  assert.match(edited.stderr, /js\/bridge\/a\.ts: differs from the pinned copy/);
  writeFileSync(join(root, "js/bridge/b.ts"), "export {};\n");
  assert.match(lock([]).stderr, /js\/bridge\/b\.ts: not in the pinned core/);
});
