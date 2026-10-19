#!/usr/bin/env node
// Lint the skills corpus against fixtures/surface.json — the committed snapshot
// of the verstak tool surface at a named server version (refresh: make surface-asset
// V=X.Y.Z from the tagged nks-mcp asset; make surface from the live server).
//
// Three drift classes are caught offline, before merge:
//   1. A tool name written in a skill that the surface does not carry
//      (rename/drop on the server side — the loud half of skill↔tool sync).
//   2. An enum value assigned in a skill (genre=..., given_as=..., modes,
//      arrow_type, node_type) that the surface vocabulary does not contain.
//   3. An argument name in a one-line call form verstak_TOOL(name=…, …) that
//      the tool's input schema does not carry (surface.params).
// Not caught: which action of a tool takes which argument, and value shapes.
//
// Pure Node, no deps, offline — CI-safe.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const surface = JSON.parse(readFileSync(join(root, "fixtures/surface.json"), "utf8"));
const tools = new Set(surface.tools);
// Tools the delivery itself registers, not the server: the OpenCode plugin's
// status tool. They never appear in a server snapshot.
for (const t of ["verstak_bridge"]) tools.add(t);
// Top-level argument names per tool, as the bridge lists them to a harness:
// the server's schema plus the bridge's own tool (verstak_stand) and minus the
// channel fields the bridge narrows away (the export applies the bridge's own layer).
// The plugin's verstak_bridge takes none.
const params = { verstak_bridge: [], ...surface.params };

// verstak_-prefixed tokens that are NOT tool names (credential/hook prefixes shown
// in examples). Extend deliberately; every entry is a claim that the token is
// not meant to resolve as a tool.
const NON_TOOL_TOKENS = new Set(["verstak_pat", "verstak_chh"]);

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
})(join(root, "skills/verstak"));
// home/ ships the same methods to the conversation home, pointers rewritten.
(function walk(dir) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p);
    else if (e.endsWith(".md")) mdFiles.push(p);
  }
})(join(root, "home"));

// The argument names of a call whose parentheses close on the same line:
// `name=` at the head of a top-level argument, outside quotes, `<placeholders>`
// and nested brackets. A call that does not close on its line (prose, an
// unbalanced quote, a call spread over a code block) yields nothing — a missed
// check costs less than a false alarm on every build.
function argNames(line, open) {
  const names = [];
  let depth = 0, quote = null, head = "";
  for (let i = open; i < line.length; i++) {
    const c = line[i];
    if (quote) { if (c === "\\") i++; else if (c === quote) quote = null; continue; }
    if (c === '"' || c === "'" || c === "`") { quote = c; head = null; continue; }
    if (c === "<") { quote = ">"; head = null; continue; }
    if ("([{".includes(c)) { depth++; if (depth === 1) head = ""; else head = null; continue; }
    if (")]}".includes(c)) {
      depth--;
      if (depth === 0) return names;
      continue;
    }
    if (depth !== 1 || head === null) { if (depth === 1 && c === ",") head = ""; continue; }
    if (c === ",") { head = ""; continue; }
    if (c === "=") {
      const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*$/.exec(head);
      if (m) names.push(m[1]);
      head = null;
      continue;
    }
    head += c;
  }
  return null;
}

for (const file of mdFiles) {
  const rel = file.slice(root.length + 1);
  const text = readFileSync(file, "utf8");

  // 1. Tool names. A trailing "_" (from verstak_add_* globs) makes it a family
  //    prefix: valid if at least one real tool starts with it.
  for (const m of text.matchAll(/\bverstak_[a-z_]+/g)) {
    const tok = m[0];
    const bare = tok.replace(/_+$/, "");
    if (tools.has(bare)) continue;
    if ([...tools].some((t) => t.startsWith(tok.endsWith("_") ? tok : tok + "_"))) continue; // family shorthand (verstak_add, verstak_add_*)
    if (NON_TOOL_TOKENS.has(bare)) continue;
    errors.push(`${rel}:${text.slice(0, m.index).split("\n").length}: tool name "${tok}" not in the surface snapshot`);
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
        errors.push(`${rel}:${text.slice(0, m.index).split("\n").length}: ${key}="${v}" not in the surface vocabulary [${vocab.join(", ")}]`);
      }
    }
  }

  // 3. Argument names in one-line call forms.
  text.split("\n").forEach((line, n) => {
    for (const m of line.matchAll(/\b(verstak_[a-z_]+)\(/g)) {
      const known = params[m[1]];
      if (!known) continue;
      for (const name of argNames(line, m.index + m[0].length - 1) || []) {
        if (!known.includes(name)) {
          errors.push(`${rel}:${n + 1}: ${m[1]}(${name}=…) — "${name}" is not an argument of ${m[1]} in the surface snapshot`);
        }
      }
    }
  });
}

if (errors.length) {
  console.error(`check-surface: ${errors.length} problem(s):`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}
console.log(`✓ corpus consistent with the surface snapshot (${tools.size} tools, ${Object.keys(surface.enums).length} vocabularies, ${Object.keys(params).length} argument lists)`);
