// The Codex delivery — .codex-plugin/plugin.json and the repo marketplace at
// .agents/plugins/marketplace.json. Both are read by a consumer outside this repo,
// so a manifest that drifts is found by a person whose install failed, not by us.
//
// Codex ships its own ingestion validator on disk
// (plugin-creator/scripts/validate_plugin.py). Running it beats restating its
// rules here: it is the actual acceptance contract, it moves when Codex moves,
// and it reads skills/<name>/SKILL.md frontmatter through Codex's own YAML — a
// second reader beside `make validate`, which holds Claude Code's contract.
//
// So this file adds only what that validator does not do: the marketplace (a
// plugin-root validator never sees it) and the on-disk existence of what the
// manifest promises. Version mirroring is not here — `make validate` holds it.
//
// VERSTAK_PLUGIN_ROOT points the probe at any copy, so a defect can be shown red.
// Offline; reads ~/.codex only to run the validator and writes nothing there.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { test } from "node:test";

import { REPO } from "./built.mjs";

const ROOT = process.env.VERSTAK_PLUGIN_ROOT || REPO;
const VALIDATOR = join(
  homedir(),
  ".codex",
  "skills",
  ".system",
  "plugin-creator",
  "scripts",
  "validate_plugin.py",
);

const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));

// Codex's own name rules, copied from identifier_validation.py because the rules
// are what is held — a marketplace whose name Codex rejects never loads.
const PLUGIN_NAME = /^[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*$/;
const MARKETPLACE_NAME = /^[A-Za-z0-9_-]+$/;

test("Codex's own ingestion validator accepts the plugin root", (t) => {
  if (!existsSync(VALIDATOR)) return t.skip(`no Codex validator on this machine: ${VALIDATOR}`);
  const py = spawnSync("python3", ["-c", "import yaml"], { encoding: "utf8" });
  if (py.error || py.status !== 0)
    return t.skip("python3 with the yaml module is unavailable — cannot run Codex's validator");

  const run = spawnSync("python3", [VALIDATOR, ROOT], { encoding: "utf8" });
  // The validator prints every error it found; a bare exit code would hide which.
  assert.equal(run.status, 0, `${run.stdout}${run.stderr}`);
  assert.match(run.stdout, /Plugin validation passed/);
});

// The marketplace is what Codex reads first, and the validator never looks at it.
// Its one job is to point at a plugin — an entry naming something not on disk, or
// naming it differently from the manifest, installs nothing and says little.
test("the marketplace names a plugin that is really here", () => {
  const marketplace = readJson(join(ROOT, ".agents", "plugins", "marketplace.json"));

  assert.match(marketplace.name, MARKETPLACE_NAME, "Codex would reject the marketplace name");
  assert.equal(typeof marketplace.interface, "object");
  assert.ok(marketplace.interface, "the marketplace has no interface");
  assert.ok(
    Array.isArray(marketplace.plugins) && marketplace.plugins.length,
    "the marketplace names no plugin",
  );

  for (const entry of marketplace.plugins) {
    assert.match(entry.name, PLUGIN_NAME, `Codex would reject the plugin name: ${entry.name}`);
    assert.equal(entry.source?.source, "local");
    assert.equal(typeof entry.source?.path, "string");
    assert.equal(typeof entry.policy?.installation, "string");
    assert.equal(typeof entry.policy?.authentication, "string");

    // source.path is relative to the marketplace root — the directory handed to
    // `codex plugin marketplace add`, which for a repo marketplace is the repo
    // itself, not the .agents/plugins/ directory the file sits in.
    const pluginRoot = resolve(ROOT, entry.source.path);
    const manifestPath = join(pluginRoot, ".codex-plugin", "plugin.json");
    assert.ok(
      existsSync(manifestPath),
      `entry "${entry.name}" points where there is no plugin: ${manifestPath}`,
    );
    assert.equal(
      readJson(manifestPath).name,
      entry.name,
      "the marketplace entry and the manifest name different plugins",
    );
  }
});

// What the validator checks in shape but not on disk: it requires `skills` to be
// spelled `skills`, then skips the tree if it is absent. A manifest promising a
// skills directory that is not shipped passes it in silence.
test("what the manifest promises is on disk", () => {
  const manifest = readJson(join(ROOT, ".codex-plugin", "plugin.json"));

  const skillsDir = resolve(ROOT, manifest.skills);
  assert.ok(existsSync(skillsDir), `the manifest promises ${manifest.skills}, and it is missing`);
  assert.ok(statSync(skillsDir).isDirectory(), `${manifest.skills} is not a directory`);
  const skills = readdirSync(skillsDir, { withFileTypes: true }).filter(
    (d) => d.isDirectory() && !d.name.startsWith("."),
  );
  assert.ok(skills.length, "the promised skills directory is empty");
  for (const s of skills) {
    assert.ok(existsSync(join(skillsDir, s.name, "SKILL.md")), `skill ${s.name} has no SKILL.md`);
  }

  // The bridge rides inline as a stdio server relative to the plugin root: the
  // Codex validator takes either an object here or a file named exactly
  // .mcp.json at the plugin root, and that name is taken by the Claude Code
  // record, whose ${CLAUDE_PLUGIN_ROOT} Codex does not resolve.
  assert.equal(
    typeof manifest.mcpServers,
    "object",
    "the MCP server record must stand as an object in the manifest",
  );
  const rec = manifest.mcpServers.verstak;
  assert.equal(rec?.command, "node", "the Codex record must raise the bridge, not a remote server");
  assert.equal(rec?.cwd, ".", "cwd is the root of the installed plugin copy");
  assert.ok(
    existsSync(resolve(ROOT, rec?.args?.[0] ?? "")),
    `the manifest calls ${rec?.args?.[0]}, and the file is missing`,
  );
});

// The Claude Code plugin record. Claude Code substitutes the exact token
// `${CLAUDE_PLUGIN_ROOT}` in a plugin's .mcp.json; a shell-style default
// (`${CLAUDE_PLUGIN_ROOT:-.}`) is not that token and falls through to generic
// expansion, which resolves to "." — witnessed: such a record read
// `node ./skills/…` and never connected, while the exact token connected at once
// (graph @nks/nks-dev, node #4280).
test("the Claude Code plugin record names the bridge through the exact ${CLAUDE_PLUGIN_ROOT} token", () => {
  const rec = readJson(resolve(ROOT, ".mcp.json")).mcpServers.verstak;
  assert.equal(rec.command, "node");
  assert.equal(rec.args.length, 1);
  assert.ok(
    rec.args[0].startsWith("${CLAUDE_PLUGIN_ROOT}/"),
    `the path must start with the exact token, got ${rec.args[0]}`,
  );
  assert.ok(
    existsSync(resolve(ROOT, rec.args[0].slice("${CLAUDE_PLUGIN_ROOT}/".length))),
    "the file must ship",
  );
});
