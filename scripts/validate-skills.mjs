#!/usr/bin/env node
// Validate the format contract of every skill in skills/<name>/SKILL.md.
//
// Why this exists: a SKILL.md frontmatter that is malformed YAML (e.g. an
// unescaped " inside a double-quoted description) installs silently and
// degrades every agent that loads it — there is no crash, only drift. This
// script is the loud gate the repo otherwise lacks. Run via `make validate`
// or in CI (.github/workflows/ci.yml).
//
// Self-contained: pure Node, no dependencies, no node_modules, no lockfile —
// matching the repo's "prose, no deps" nature. It deliberately does NOT pull a
// full YAML parser; instead it enforces the *narrow* frontmatter contract these
// skills actually use (two flat, single-line keys), which both catches malformed
// YAML and keeps the frontmatter simple.

import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const skillsDir = join(root, "skills");
const ALLOWED_KEYS = new Set(["name", "description"]);
const REQUIRED_KEYS = ["name", "description"];

const errors = [];
const fail = (where, msg) => errors.push(`${where}: ${msg}`);

// Validate a single-line YAML flow scalar (the part after "key: ").
// Returns null if ok, or an error string. This is where the unescaped-quote
// bug is caught: a double-quoted scalar must close at end-of-line, with nothing
// after the closing quote.
function scalarError(value) {
  if (value.length === 0) return "empty value";
  const q = value[0];
  if (q !== '"' && q !== "'") return null; // plain scalar — accepted as-is

  for (let i = 1; i < value.length; i++) {
    const ch = value[i];
    if (q === '"' && ch === "\\") {
      i++; // escaped char — skip it
      continue;
    }
    if (ch === q) {
      // single-quoted YAML escapes a quote by doubling it ('')
      if (q === "'" && value[i + 1] === "'") {
        i++;
        continue;
      }
      const rest = value.slice(i + 1).trim();
      if (rest !== "" && !rest.startsWith("#")) {
        return `unexpected content after closing ${q}: ${JSON.stringify(
          rest.slice(0, 50)
        )} — likely an unescaped ${q} inside the value`;
      }
      return null; // properly closed
    }
  }
  return `unterminated ${q === '"' ? "double" : "single"}-quoted value`;
}

function validateSkill(name) {
  const where = `skills/${name}/SKILL.md`;
  const path = join(skillsDir, name, "SKILL.md");
  if (!existsSync(path)) {
    fail(where, "missing SKILL.md");
    return;
  }
  const text = readFileSync(path, "utf8");
  const lines = text.split("\n");

  if (lines[0] !== "---") {
    fail(where, "must start with a `---` frontmatter delimiter on line 1");
    return;
  }
  const closeIdx = lines.indexOf("---", 1);
  if (closeIdx === -1) {
    fail(where, "frontmatter is not closed with a second `---`");
    return;
  }

  const fm = lines.slice(1, closeIdx);
  const seen = new Set();
  for (let i = 0; i < fm.length; i++) {
    const line = fm[i];
    if (line.trim() === "" || line.trimStart().startsWith("#")) continue;
    if (/^\s/.test(line)) {
      fail(where, `frontmatter line ${i + 2} is indented — only flat, single-line keys are allowed: ${JSON.stringify(line)}`);
      continue;
    }
    const m = line.match(/^([A-Za-z][\w-]*):(?:\s+(.*))?$/);
    if (!m) {
      fail(where, `frontmatter line ${i + 2} is not a \`key: value\` pair: ${JSON.stringify(line)}`);
      continue;
    }
    const key = m[1];
    const value = (m[2] ?? "").trimEnd();
    if (!ALLOWED_KEYS.has(key)) {
      fail(where, `unexpected frontmatter key \`${key}\` (allowed: ${[...ALLOWED_KEYS].join(", ")})`);
      continue;
    }
    if (seen.has(key)) fail(where, `duplicate frontmatter key \`${key}\``);
    seen.add(key);

    const err = scalarError(value);
    if (err) {
      fail(where, `\`${key}\` — ${err}`);
      continue;
    }

    if (key === "name") {
      const unquoted = value.replace(/^["']|["']$/g, "");
      if (!/^[a-z][a-z0-9-]*$/.test(unquoted)) {
        fail(where, `\`name\` must be kebab-case (^[a-z][a-z0-9-]*$), got ${JSON.stringify(unquoted)}`);
      } else if (unquoted !== name) {
        fail(where, `\`name\` (${JSON.stringify(unquoted)}) must match the directory name (${JSON.stringify(name)})`);
      }
    }
    if (key === "description") {
      const unquoted = value.replace(/^"([\s\S]*)"$/, "$1").replace(/^'([\s\S]*)'$/, "$1");
      if (unquoted.trim().length === 0) fail(where, "`description` must be non-empty");
    }
  }

  for (const k of REQUIRED_KEYS) {
    if (!seen.has(k)) fail(where, `missing required frontmatter key \`${k}\``);
  }
}

// 1. Validate every skill directory.
const skillNames = readdirSync(skillsDir).filter((n) =>
  statSync(join(skillsDir, n)).isDirectory()
);
if (skillNames.length === 0) fail("skills/", "no skill directories found");
for (const name of skillNames.sort()) validateSkill(name);

// 2. Cross-check the plugin marketplace manifest against the skill dirs.
const manifestPath = join(root, ".claude-plugin", "marketplace.json");
try {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const listed = new Set();
  for (const plugin of manifest.plugins ?? []) {
    for (const ref of plugin.skills ?? []) {
      const rel = ref.replace(/^\.\//, "").replace(/^skills\//, "");
      listed.add(rel);
      if (!skillNames.includes(rel)) {
        fail("marketplace.json", `lists skill \`${ref}\` but skills/${rel}/ does not exist`);
      }
    }
  }
  for (const name of skillNames) {
    if (!listed.has(name)) {
      fail("marketplace.json", `skills/${name}/ exists but is not listed in any plugin's \`skills\``);
    }
  }
} catch (e) {
  fail(".claude-plugin/marketplace.json", `could not read/parse: ${e.message}`);
}

// Report.
if (errors.length > 0) {
  console.error(`✗ skill validation failed (${errors.length} problem${errors.length === 1 ? "" : "s"}):\n`);
  for (const e of errors) console.error(`  • ${e}`);
  console.error("");
  process.exit(1);
}
console.log(`✓ ${skillNames.length} skills valid: ${skillNames.sort().join(", ")}`);
