#!/usr/bin/env node
// Lint the skills corpus against fixtures/surface.json — the committed snapshot
// of the live nks-mcp tool surface (refresh: node scripts/export-surface.mjs).
//
// Two drift classes are caught offline, before merge:
//   1. A tool name written in a skill that the surface does not carry
//      (rename/drop on the server side — the loud half of skill↔tool sync).
//   2. An enum value assigned in a skill (genre=..., given_as=..., modes,
//      arrow_type, node_type) that the surface vocabulary does not contain.
//
// Pure Node, no deps, offline — CI-safe.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const surface = JSON.parse(readFileSync(join(root, "fixtures/surface.json"), "utf8"));
const tools = new Set(surface.tools);

// nks_-prefixed tokens that are NOT tool names (credential/hook prefixes shown
// in examples). Extend deliberately; every entry is a claim that the token is
// not meant to resolve as a tool.
const NON_TOOL_TOKENS = new Set(["nks_pat", "nks_chh"]);

const ENUM_KEYS = new Set([
  "epistemic_mode", "ontic_mode", "volitive_mode",
  "genre", "given_as", "manifested_as", "arrow_type", "node_type",
]);

const errors = [];
const mdFiles = [];
(function walk(dir) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p);
    else if (e.endsWith(".md")) mdFiles.push(p);
  }
})(join(root, "skills"));

for (const file of mdFiles) {
  const rel = file.slice(root.length + 1);
  const text = readFileSync(file, "utf8");

  // 1. Tool names. A trailing "_" (from nks_add_* globs) makes it a family
  //    prefix: valid if at least one real tool starts with it.
  for (const m of text.matchAll(/\bnks_[a-z_]+/g)) {
    const tok = m[0];
    const bare = tok.replace(/_+$/, "");
    if (tools.has(bare)) continue;
    if ([...tools].some((t) => t.startsWith(tok.endsWith("_") ? tok : tok + "_"))) continue; // family shorthand (nks_add, nks_add_*)
    if (NON_TOOL_TOKENS.has(bare)) continue;
    errors.push(`${rel}: tool name "${tok}" not in the surface snapshot`);
  }

  // 2. Enum assignments in code-ish spans: key="value" / key=value / key: value.
  for (const m of text.matchAll(/\b(epistemic_mode|ontic_mode|volitive_mode|genre|given_as|manifested_as|arrow_type|node_type)\s*[=:]\s*["']?([a-z][a-z_,\- ]*)/g)) {
    const [, key, raw] = m;
    if (!ENUM_KEYS.has(key)) continue;
    const vocab = surface.enums[key];
    if (!vocab) continue;
    for (const v of raw.split(",").map((x) => x.trim()).filter(Boolean)) {
      if (!/^[a-z][a-z_-]*$/.test(v)) continue; // placeholder / prose, not a value
      if (!vocab.includes(v)) {
        errors.push(`${rel}: ${key}="${v}" not in the surface vocabulary [${vocab.join(", ")}]`);
      }
    }
  }
}

if (errors.length) {
  console.error(`check-surface: ${errors.length} problem(s):`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}
console.log(`✓ corpus consistent with the surface snapshot (${tools.size} tools, ${Object.keys(surface.enums).length} vocabularies)`);
