#!/usr/bin/env node
// Cut a release: bump the verstak plugin version.
//
// Why this exists: the plugin version lives in .claude-plugin/plugin.json and is
// Claude Code's highest-precedence version source. It drives update detection —
// users only receive an update when this string CHANGES. Push new skills without
// bumping it and existing installs keep the cached copy, silently. So releasing
// must be one reliable step, not a hand-edited JSON field you can forget.
//
// It keeps two numbers in lockstep so there is a single "verstak version":
//   • .claude-plugin/plugin.json        → `version`          (the plugin version)
//   • .claude-plugin/marketplace.json   → `metadata.version` (the catalog mirror)
// `make validate` fails if they drift, so always bump via this script.
//
// Usage:
//   node scripts/bump-version.mjs            # patch bump (default)
//   node scripts/bump-version.mjs patch|minor|major
//   node scripts/bump-version.mjs 2.1.0      # set an explicit version
//   node scripts/bump-version.mjs --print    # print the current version, no change
//
// Self-contained: pure Node, no deps — matching validate-skills.mjs.

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pluginPath = join(root, ".claude-plugin", "plugin.json");
const marketplacePath = join(root, ".claude-plugin", "marketplace.json");

const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/;
// Match a `"version": "X.Y.Z"` field and capture the prefix so we can swap only
// the value, leaving the rest of the file byte-for-byte unchanged (no reformat churn).
const VERSION_FIELD = /("version"\s*:\s*")(\d+\.\d+\.\d+)(")/;

const die = (msg) => {
  console.error(`✗ ${msg}`);
  process.exit(1);
};

const pluginText = readFileSync(pluginPath, "utf8");
const currentMatch = pluginText.match(VERSION_FIELD);
if (!currentMatch) die(`could not find a "version": "X.Y.Z" field in ${pluginPath}`);
const current = currentMatch[2];

const arg = (process.argv[2] ?? "patch").trim();

if (arg === "--print") {
  console.log(current);
  process.exit(0);
}

function nextVersion(from, spec) {
  if (SEMVER.test(spec)) return spec; // explicit target
  const m = from.match(SEMVER);
  if (!m) die(`current version ${JSON.stringify(from)} is not semver X.Y.Z`);
  let [, major, minor, patch] = m.map(Number);
  if (spec === "major") return `${major + 1}.0.0`;
  if (spec === "minor") return `${major}.${minor + 1}.0`;
  if (spec === "patch") return `${major}.${minor}.${patch + 1}`;
  die(`unknown bump ${JSON.stringify(spec)} — expected patch | minor | major | X.Y.Z`);
}

const next = nextVersion(current, arg);
if (next === current) die(`version is already ${current} — nothing to bump`);

// Swap the value in both files, surgically (only the version literal changes).
writeFileSync(pluginPath, pluginText.replace(VERSION_FIELD, `$1${next}$3`));

const marketplaceText = readFileSync(marketplacePath, "utf8");
if (!VERSION_FIELD.test(marketplaceText)) {
  die(`could not find a "version": "X.Y.Z" field in ${marketplacePath} (expected metadata.version)`);
}
writeFileSync(marketplacePath, marketplaceText.replace(VERSION_FIELD, `$1${next}$3`));

console.log(`verstak ${current} → ${next}`);
console.log("");
console.log("Next:");
console.log(`  1. make check                       # validate the bump`);
console.log(`  2. git commit -am "chore: release v${next}"`);
console.log(`  3. open the PR; after it merges to main, tag it:`);
console.log(`       git tag v${next} && git push origin v${next}`);
console.log("");
console.log("Users pick it up via: /plugin marketplace update verstak-ai  →  /reload-plugins");
