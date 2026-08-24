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
const ALLOWED_KEYS = new Set(["name", "description", "slash"]);
const REQUIRED_KEYS = ["name", "description"];

const errors = [];
const fail = (where, msg) => errors.push(`${where}: ${msg}`);
const warnings = [];
const warn = (where, msg) => warnings.push(`${where}: ${msg}`);

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
    if (key === "slash") {
      // OpenCode decodes frontmatter `slash` as a boolean; a quoted "true"
      // arrives as a string and fails the decode, taking the skill with it.
      if (value !== "true" && value !== "false") {
        fail(where, `\`slash\` must be a plain \`true\` or \`false\`, got ${JSON.stringify(value)}`);
      }
    }
    if (key === "description") {
      const unquoted = value.replace(/^"([\s\S]*)"$/, "$1").replace(/^'([\s\S]*)'$/, "$1");
      if (unquoted.trim().length === 0) fail(where, "`description` must be non-empty");
      // The agentskills spec caps description at 1024 — "characters" per the
      // docs, but byte-counting implementations (OpenCode) truncate or reject
      // at 1024 UTF-8 BYTES, and our descriptions are part-Cyrillic (2
      // bytes/char). Gate on the RENDERED value's bytes (what a YAML parser
      // hands the harness); warn from 900 so there is headroom before the
      // cliff instead of a surprise at it.
      let rendered = unquoted;
      if (value[0] === '"') rendered = unquoted.replace(/\\(["\\])/g, "$1");
      else if (value[0] === "'") rendered = unquoted.replace(/''/g, "'");
      const bytes = Buffer.byteLength(rendered, "utf8");
      if (bytes > 1024) {
        fail(where, `\`description\` is ${bytes} UTF-8 bytes — over the 1024-byte cliff (byte-counting harnesses truncate or reject it)`);
      } else if (bytes > 900) {
        warn(where, `\`description\` is ${bytes} UTF-8 bytes — inside the 1024-byte cliff's blast radius; keep ≤900 for headroom`);
      }
      // The claude.ai plugin loader refuses a description with XML-tag-shaped
      // content ("SKILL.md description cannot contain XML tags") — and the
      // refusal takes down the whole plugin install, not just the one skill.
      // Its exact matcher is unknown (behaviour over prose), and no
      // description needs angle brackets, so ban them outright: write
      // placeholders as @handle/mind, not @<handle>/mind.
      if (/[<>]/.test(rendered)) {
        fail(where, "`description` contains `<` or `>` — the claude.ai plugin loader rejects XML-tag-shaped descriptions and the whole plugin install fails with it; write placeholders without angle brackets (@handle/mind, not @<handle>/mind)");
      }
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

// 2. Component-list guard: the skill set ships by plugin auto-discovery from
//    skills/ — the tree is the single source of truth. A `skills` (or any
//    component) list in a manifest re-introduces a second copy of that truth:
//    it drifts (a forgotten entry or typo'd path breaks install for every
//    plugin user) and, next to plugin.json, is exactly the "conflicting
//    manifests" plugin error. Fail loudly if a list creeps back in.
const COMPONENT_KEYS = ["skills", "commands", "agents", "hooks", "mcpServers"];
const manifestPath = join(root, ".claude-plugin", "marketplace.json");
try {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  for (const plugin of manifest.plugins ?? []) {
    for (const key of COMPONENT_KEYS) {
      if (key in plugin) {
        fail("marketplace.json", `plugin \`${plugin.name}\` carries a \`${key}\` list — components ship by auto-discovery from skills/; remove it (a second copy of the truth drifts)`);
      }
    }
  }
} catch (e) {
  fail(".claude-plugin/marketplace.json", `could not read/parse: ${e.message}`);
}

// 3. Version contract: .claude-plugin/plugin.json is Claude Code's
//    highest-precedence version source — an install refreshes only when this
//    string changes. It must be valid semver, and mirrored in both marketplace
//    copies — `metadata.version` and the plugin entry's own `version` (what a
//    marketplace listing shows before install) — so there is one "verstak
//    version". release-please writes all three from the same release; this gate
//    fails loudly if they ever diverge.
const pluginPath = join(root, ".claude-plugin", "plugin.json");
try {
  const plugin = JSON.parse(readFileSync(pluginPath, "utf8"));
  if (!/^\d+\.\d+\.\d+$/.test(plugin.version ?? "")) {
    fail("plugin.json", `\`version\` must be semver X.Y.Z, got ${JSON.stringify(plugin.version)}`);
  }
  for (const key of COMPONENT_KEYS) {
    if (key in plugin) {
      fail("plugin.json", `carries a \`${key}\` list — components ship by auto-discovery from skills/; keep plugin.json metadata-only`);
    }
  }
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  if (!(manifest.plugins ?? []).some((p) => p.name === plugin.name)) {
    fail("plugin.json", `\`name\` (${JSON.stringify(plugin.name)}) matches no plugin in marketplace.json`);
  }
  for (const p of manifest.plugins ?? []) {
    if (p.name !== plugin.name) continue;
    if (p.version !== plugin.version) {
      fail("marketplace.json", `plugin \`${p.name}\` has \`version\` ${JSON.stringify(p.version)} — must mirror plugin.json (${plugin.version}); release-please writes both`);
    }
  }
  if (manifest.metadata?.version !== plugin.version) {
    fail("marketplace.json", `metadata.version (${JSON.stringify(manifest.metadata?.version)}) must mirror plugin.json (${plugin.version})`);
  }
} catch (e) {
  fail(".claude-plugin/plugin.json", `could not read/parse: ${e.message}`);
}

// Manifest lists must match the tree. Hand-edited inventories beside automation
// drift silently (witnessed: the AGENTS.md structure line knew 16 skills while
// the tree held 18) — so the lists are linted against readdir, not trusted.
try {
  const agents = readFileSync(join(root, "AGENTS.md"), "utf8");
  const m = /one dir per skill \(([^)]*)\)/.exec(agents);
  if (!m) {
    fail("AGENTS.md", "inventory line not found (\"one dir per skill (…)\" in Project structure)");
  } else {
    const listed = new Set([...m[1].matchAll(/`([a-z-]+)`/g)].map((x) => x[1]));
    const onDisk = new Set(skillNames);
    for (const name of onDisk) if (!listed.has(name)) {
      fail("AGENTS.md", `skill \`${name}\` exists in skills/ but is missing from the inventory line`);
    }
    for (const name of listed) if (!onDisk.has(name)) {
      fail("AGENTS.md", `inventory line names \`${name}\` but skills/${name}/ does not exist`);
    }
  }
} catch (e) {
  fail("AGENTS.md", `could not read: ${e.message}`);
}
try {
  const readme = readFileSync(join(root, "README.md"), "utf8");
  const rows = new Set([...readme.matchAll(/^\| \*\*([a-z-]+)\*\* \|/gm)].map((x) => x[1]));
  for (const name of skillNames) if (!rows.has(name)) {
    fail("README.md", `skill \`${name}\` has no row in the skill table`);
  }
  for (const name of rows) if (!skillNames.includes(name)) {
    fail("README.md", `table row \`${name}\` matches no directory in skills/`);
  }
} catch (e) {
  fail("README.md", `could not read: ${e.message}`);
}

// Report.
if (warnings.length > 0) {
  console.warn(`⚠ ${warnings.length} warning${warnings.length === 1 ? "" : "s"} (non-fatal):`);
  for (const w of warnings) console.warn(`  • ${w}`);
  console.warn("");
}
if (errors.length > 0) {
  console.error(`✗ skill validation failed (${errors.length} problem${errors.length === 1 ? "" : "s"}):\n`);
  for (const e of errors) console.error(`  • ${e}`);
  console.error("");
  process.exit(1);
}
console.log(`✓ ${skillNames.length} skills valid: ${skillNames.sort().join(", ")}`);
