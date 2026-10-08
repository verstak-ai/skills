#!/usr/bin/env node
// The core is the sibling delivery's, copied as is: js/core.lock pins the commit it
// came from and a sha256 per file, so "copied byte for byte" is checkable offline.
// Fails on a core file edited, added or removed without scripts/sync-core.sh.
//
//   node scripts/check-core-lock.mjs [--root <dir>]       verify
//   node scripts/check-core-lock.mjs --write <sha>        re-pin (sync-core.sh calls it)
//
// Pure Node, no deps, offline.
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const CORE_DIRS = ["bridge", "shared", "opencode", "extension", "watchdog", "cli"];

const args = process.argv.slice(2);
const at = args.indexOf("--root");
const root = at >= 0 ? args[at + 1] : join(dirname(fileURLToPath(import.meta.url)), "..");
const wr = args.indexOf("--write");
const lockPath = join(root, "js", "core.lock");

function walk(dir) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries.flatMap((e) => {
    const p = join(dir, e.name);
    return e.isDirectory() ? walk(p) : e.isFile() ? [p] : [];
  });
}

const actual = new Map();
for (const d of CORE_DIRS)
  for (const file of walk(join(root, "js", d)))
    actual.set(
      relative(root, file).split(sep).join("/"),
      createHash("sha256").update(readFileSync(file)).digest("hex"),
    );
const sorted = [...actual].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));

if (wr >= 0) {
  const sha = args[wr + 1];
  if (!/^[0-9a-f]{40}$/.test(sha ?? "")) {
    console.error("check-core-lock: --write needs a full commit sha");
    process.exit(2);
  }
  const head = [
    "# The bridge core, copied from the sibling delivery; refresh with scripts/sync-core.sh.",
    `commit ${sha}`,
  ];
  writeFileSync(lockPath, [...head, ...sorted.map(([p, h]) => `${h}  ${p}`)].join("\n") + "\n");
  console.log(`✓ js/core.lock: ${sorted.length} core files pinned at ${sha.slice(0, 8)}`);
  process.exit(0);
}

let text;
try {
  text = readFileSync(lockPath, "utf8");
} catch (e) {
  console.error(`check-core-lock: cannot read ${lockPath}: ${e.message}`);
  process.exit(2);
}
const commit = /^commit ([0-9a-f]{40})$/m.exec(text)?.[1];
const pinned = new Map(
  [...text.matchAll(/^([0-9a-f]{64}) {2}(\S+)$/gm)].map((m) => [m[2], m[1]]),
);
const problems = [];
if (!commit) problems.push("js/core.lock: no `commit <sha>` line");
for (const [p, h] of pinned)
  if (!actual.has(p)) problems.push(`${p}: pinned but missing`);
  else if (actual.get(p) !== h) problems.push(`${p}: differs from the pinned copy`);
for (const p of actual.keys()) if (!pinned.has(p)) problems.push(`${p}: not in the pinned core`);

if (problems.length) {
  for (const p of problems) console.error(p);
  console.error(
    `✗ check-core-lock: ${problems.length} problem(s) — the core is changed upstream and synced with scripts/sync-core.sh, never edited here`,
  );
  process.exit(1);
}
console.log(`✓ check-core-lock: ${pinned.size} core files match the copy of ${commit.slice(0, 8)}`);
