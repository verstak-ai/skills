#!/usr/bin/env node
// Build the shipped JS from the single source in js/.
//
//   node js/build.mjs          dev build into dist/dev/ (outside the index) — for tests and live runs
//   VERSTAK_BUILD_CHANNEL=release node js/build.mjs
//                              release build onto the committed paths — the release job only
//   node js/build.mjs --check  the committed outputs are a release build; otherwise exit 1
//
// The outputs are derived artifacts, like the .skill zips: edit js/, not them.
// Determinism: esbuild is pinned by the lockfile, paths in the output are relative
// to absWorkingDir, no source maps, no minification — a consumer opens the file by
// eye, and the hash of its bytes tells builds apart between releases.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import * as esbuild from "esbuild";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CHECK = process.argv.includes("--check");

// The paths follow js/delivery/product.ts: BRIDGE_SKILL/scripts/{BRIDGE_FILE,PLUGIN_FILE}
// and extensions/<PRODUCT>.js, where pi loads extensions from.
const BRIDGE = "skills/verstak/scripts/verstak-bridge.mjs";
const PLUGIN = "skills/verstak/scripts/opencode-plugin.js";
const EXTENSION = "extensions/verstak.js";
/** Build outputs — paths from the repo root (committed) and from dist/dev (dev). */
const OUTPUTS = [BRIDGE, EXTENSION, PLUGIN];

const common = {
  bundle: true,
  write: false,
  absWorkingDir: ROOT,
  legalComments: "none",
  sourcemap: false,
  minify: false,
  charset: "utf8",
  logLevel: "silent",
};

async function bundleNode(entry, banner) {
  const r = await esbuild.build({
    ...common,
    entryPoints: [entry],
    platform: "node",
    format: "esm",
    target: "node22",
    banner: banner ? { js: banner } : undefined,
    external: ["@earendil-works/pi-coding-agent"],
    outfile: "out.mjs",
  });
  return r.outputFiles[0].text;
}

async function produce() {
  const outputs = new Map();
  // One executable for the bridge, the daemon, both watchdogs and doctor: the bridge
  // prints its own path in the connect answer, and nobody names a second copy.
  outputs.set(BRIDGE, await bundleNode("js/cli/main.ts", "#!/usr/bin/env node"));
  // The pi extension — an ESM module with a default export; pi loads .js from extensions/.
  outputs.set(EXTENSION, await bundleNode("js/extension/main.ts"));
  // The OpenCode plugin — an OpenCode 2 ESM module with no imports at all: the
  // @opencode/plugin types are erased by the build. It ships beside the bridge,
  // installed by the same step.
  outputs.set(PLUGIN, await bundleNode("js/opencode/plugin.ts"));
  return outputs;
}

// Build channel: every install channel takes main, so the committed outputs are always
// a release build, written only by the release job (VERSTAK_BUILD_CHANNEL=release). A
// working copy builds dev into DEV_DIR outside the index — tests and live runs take it,
// and such a bridge never refreshes the machine's home copy. The mark has one source,
// the delivery layer.
const MARK_SOURCE = "js/delivery/version.ts";
const markDev = /^export const CHANNEL_MARK: string = "([^"]+:dev)";$/m.exec(
  readFileSync(join(ROOT, MARK_SOURCE), "utf8"),
)?.[1];
if (!markDev) throw new Error(`${MARK_SOURCE}: no CHANNEL_MARK line with the :dev mark`);
const DEV_MARK = `"${markDev}"`;
const RELEASE_MARK = `"${markDev.replace(/:dev$/, ":release")}"`;
const RELEASE = process.env.VERSTAK_BUILD_CHANNEL === "release";
const DEV_DIR = process.env.VERSTAK_BUILT_DIR || join(ROOT, "dist", "dev");

if (CHECK) {
  let bad = 0;
  for (const rel of OUTPUTS) {
    const path = join(ROOT, rel);
    const have = existsSync(path) ? readFileSync(path, "utf8") : null;
    const why =
      have === null
        ? "missing"
        : have.includes(DEV_MARK)
          ? "carries the dev mark"
          : rel === BRIDGE && !have.includes(RELEASE_MARK)
            ? "has no release mark"
            : null;
    if (why) {
      bad++;
      console.error(`✗ ${rel}: ${why} — it is written by make build-release (the release job)`);
    }
  }
  if (bad) process.exit(1);
  process.stdout.write(
    `✓ ${OUTPUTS.length} committed JS outputs are a release build, no dev mark\n`,
  );
} else {
  const outputs = await produce();
  if ([...outputs.keys()].join() !== OUTPUTS.join())
    throw new Error(`build outputs diverged from OUTPUTS: ${[...outputs.keys()].join(", ")}`);
  if (!outputs.get(BRIDGE).includes(DEV_MARK))
    throw new Error(`${BRIDGE}: no channel mark ${DEV_MARK} (${MARK_SOURCE})`);
  const base = RELEASE ? ROOT : DEV_DIR;
  for (const [rel, built] of outputs) {
    const path = join(base, rel);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, RELEASE ? built.replaceAll(DEV_MARK, RELEASE_MARK) : built);
  }
  process.stdout.write(
    `Built (${RELEASE ? "release, committed paths" : `dev, ${base}`}): ${[...outputs.keys()].join(" ")}\n`,
  );
}
