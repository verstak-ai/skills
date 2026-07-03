#!/usr/bin/env node
// Bump the plugin version from a Conventional Commit subject (the merge commit
// that just landed on main): feat → minor, feat!/BREAKING CHANGE → major,
// everything else → patch. Writes .claude-plugin/plugin.json and its mirror
// marketplace.json metadata.version together, prints the new version to stdout.
// Claude Code re-delivers a plugin only when plugin.json's version string
// changes — the bump IS the delivery.
import { readFileSync, writeFileSync } from "node:fs";

const msg = process.argv[2] ?? "";
const pluginPath = ".claude-plugin/plugin.json";
const marketPath = ".claude-plugin/marketplace.json";

const plugin = JSON.parse(readFileSync(pluginPath, "utf8"));
let [maj, min, pat] = plugin.version.split(".").map(Number);
if (/^[a-z]+(\([^)]*\))?!:/.test(msg) || /BREAKING CHANGE/.test(msg)) {
  maj += 1; min = 0; pat = 0;
} else if (/^feat(\([^)]*\))?:/.test(msg)) {
  min += 1; pat = 0;
} else {
  pat += 1;
}
plugin.version = `${maj}.${min}.${pat}`;

const market = JSON.parse(readFileSync(marketPath, "utf8"));
market.metadata = { ...(market.metadata ?? {}), version: plugin.version };

writeFileSync(pluginPath, JSON.stringify(plugin, null, 2) + "\n");
writeFileSync(marketPath, JSON.stringify(market, null, 2) + "\n");
process.stdout.write(plugin.version);
