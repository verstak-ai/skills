#!/usr/bin/env node
// The boundary gate of the bridge core (graph @nks/nks-dev, nodes #6806, #6809):
// a neighbouring delivery copies js/{bridge,shared,opencode,extension,watchdog,cli}
// byte for byte and writes its own js/delivery, so nothing in the core may name
// this delivery. Every file under the core directories, at any depth and of any
// extension, is read as raw text — code, comments, strings, regexes alike — and
// fails on:
//   (a) a Cyrillic letter (words live in js/delivery/words, prose forms in patterns);
//   (b) the product name, case-insensitive (PRODUCT of js/delivery/product.ts);
//   (c) a call `L(` (the retired two-language helper);
//   (d) the product name in any segment of the file's path.
// README.md files are exempt: they are this repo's component docs and the
// neighbouring delivery does not copy them.
//
//   node scripts/check-core.mjs [--root <dir>]   (default: the repo root)
//
// Pure Node, no deps, offline — CI-safe.
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const CORE_DIRS = ["bridge", "shared", "opencode", "extension", "watchdog", "cli"];
// A new directory under js/ must be named here or in CORE_DIRS, so a new core
// directory cannot slip past the gate unchecked.
const NOT_CORE = new Set(["delivery", "roadmap", "tests", "node_modules"]);
const EXEMPT = new Set(["README.md"]);

const args = process.argv.slice(2);
const at = args.indexOf("--root");
const root =
  at >= 0 ? args[at + 1] : join(dirname(fileURLToPath(import.meta.url)), "..");
if (!root) {
  console.error("check-core: --root needs a directory");
  process.exit(2);
}

const productFile = join(root, "js", "delivery", "product.ts");
let product;
try {
  product = /export const PRODUCT\s*(?::\s*string\s*)?=\s*(["'`])([^"'`]+)\1/.exec(
    readFileSync(productFile, "utf8"),
  )?.[2];
} catch (e) {
  console.error(`check-core: cannot read ${productFile}: ${e.message}`);
  process.exit(2);
}
if (!product) {
  console.error(`check-core: no PRODUCT string literal in ${productFile}`);
  process.exit(2);
}

const escaped = product.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const RULES = [
  [/[\u0400-\u04FF]/, "Cyrillic letter"],
  [new RegExp(escaped, "i"), `product name "${product}"`],
  [/\bL\(/, "call L("],
];
const nameRe = new RegExp(escaped, "i");

function walk(dir) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries.flatMap((e) => {
    const p = join(dir, e.name);
    if (e.isDirectory()) return walk(p);
    return e.isFile() && !EXEMPT.has(e.name) ? [p] : [];
  });
}

const violations = [];
let count = 0;
for (const e of readdirSync(join(root, "js"), { withFileTypes: true }))
  if (e.isDirectory() && !CORE_DIRS.includes(e.name) && !NOT_CORE.has(e.name))
    violations.push(`js/${e.name}/:0: a directory neither core nor known outside it`);
for (const d of CORE_DIRS) {
  for (const file of walk(join(root, "js", d))) {
    count++;
    const rel = relative(root, file).split(sep).join("/");
    if (rel.split("/").some((seg) => nameRe.test(seg)))
      violations.push(`${rel}:0: product name "${product}" in the path`);
    readFileSync(file, "utf8")
      .split("\n")
      .forEach((line, i) => {
        for (const [re, what] of RULES) if (re.test(line)) violations.push(`${rel}:${i + 1}: ${what}`);
      });
  }
}

if (violations.length) {
  for (const v of violations) console.error(v);
  console.error(`✗ check-core: ${violations.length} violation(s) in the core`);
  process.exit(1);
}
console.log(`✓ check-core: ${count} core files name no delivery (product "${product}")`);
