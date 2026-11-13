#!/usr/bin/env node
// Pack the OpenCode plugin as an npm archive: package.json, index.js — the release-built
// skills/verstak/scripts/opencode-plugin.js — and verstak-bridge.mjs — the release-built
// bridge beside it, both byte for byte. No dependencies, no lifecycle scripts: everything
// ready is in the archive. The release job attaches it to the GitHub release and publishes
// it to npm. Pure Node and npm.
//
//   node scripts/pack-opencode.mjs [--out DIR]   (default dist/pack)
//
// Prints the archive's path; DIR/package/ is the packed directory.
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..");
const NAME = "@verstak/opencode";
const SOURCES = {
  "index.js": "skills/verstak/scripts/opencode-plugin.js",
  "verstak-bridge.mjs": "skills/verstak/scripts/verstak-bridge.mjs",
};

const args = process.argv.slice(2);
const at = args.indexOf("--out");
const out = resolve(at >= 0 && args[at + 1] ? args[at + 1] : join(REPO, "dist", "pack"));

const version = /^export const VERSION = "([^"]+)";/m.exec(
  readFileSync(join(REPO, "js/delivery/version.ts"), "utf8"),
)?.[1];
if (!version) {
  console.error("pack-opencode: no VERSION in js/delivery/version.ts");
  process.exit(1);
}

const pkg = join(out, "package");
rmSync(pkg, { recursive: true, force: true });
mkdirSync(pkg, { recursive: true });
const manifest = {
  name: NAME,
  version,
  type: "module",
  main: "./index.js",
  exports: { ".": "./index.js" },
  files: Object.keys(SOURCES),
  // npm's trusted publishing matches the provenance against this URL exactly.
  repository: { type: "git", url: "git+https://github.com/verstak-ai/skills.git" },
};
writeFileSync(join(pkg, "package.json"), JSON.stringify(manifest, null, 2) + "\n");
for (const [file, src] of Object.entries(SOURCES)) copyFileSync(join(REPO, src), join(pkg, file));

const r = spawnSync("npm", ["pack", "--ignore-scripts", "--pack-destination", out], {
  cwd: pkg,
  encoding: "utf8",
  shell: process.platform === "win32",
});
if (r.status !== 0) {
  process.stderr.write(r.stderr || r.error?.message || "npm pack failed\n");
  process.exit(r.status || 1);
}
const tgz = join(out, `verstak-opencode-${version}.tgz`);
if (!existsSync(tgz)) {
  console.error(`pack-opencode: npm pack wrote ${r.stdout.trim()}, not ${tgz}`);
  process.exit(1);
}
console.log(tgz);
