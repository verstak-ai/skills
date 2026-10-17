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
// and extensions/<PRODUCT>.js, where pi loads extensions from; hooks/ at the plugin root,
// beside the hooks/hooks.json Claude Code reads.
const BRIDGE = "skills/verstak/scripts/verstak-bridge.mjs";
const PLUGIN = "skills/verstak/scripts/opencode-plugin.js";
const EXTENSION = "extensions/verstak.js";
const ONBOARD_HOOK = "hooks/onboard.mjs";
/** Build outputs — paths from the repo root (committed) and from dist/dev (dev). */
const OUTPUTS = [BRIDGE, EXTENSION, PLUGIN, ONBOARD_HOOK];
/**
 * An output no release has carried yet: until the release of this version (by the committed
 * bridge's VERSION) it is absent from its committed path — the release job writes it first,
 * not a branch.
 */
const PENDING = new Map([[ONBOARD_HOOK, [3, 10, 0]]]);

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
  // The Claude Code plugin's SessionStart hook (hooks/hooks.json): the onboarding invitation
  // by the repository's signs — a small file of its own, not the bridge: session start waits on it.
  outputs.set(ONBOARD_HOOK, await bundleNode("js/cli/onboard-hook.ts"));
  return outputs;
}

// Build channel: every install channel takes main, so the committed outputs are always
// a release build, written only by the release job (VERSTAK_BUILD_CHANNEL=release). A
// working copy builds dev into DEV_DIR outside the index — tests and live runs take it,
// and such a bridge never refreshes the machine's home copy. The mark has one source,
// the delivery layer.
const MARK_SOURCE = "js/delivery/version.ts";
const markSource = readFileSync(join(ROOT, MARK_SOURCE), "utf8");
const version = /^export const VERSION = "([^"]+)"; \/\/ x-release-please-version$/m.exec(
  markSource,
)?.[1];
if (!version) throw new Error(`${MARK_SOURCE}: no stamped VERSION line`);
const markDev = /^export const CHANNEL_MARK: string = "([^"]+:dev)";$/m.exec(markSource)?.[1];
if (!markDev) throw new Error(`${MARK_SOURCE}: no CHANNEL_MARK line with the :dev mark`);
const DEV_MARK = `"${markDev}"`;
const RELEASE_MARK = `"${markDev.replace(/:dev$/, ":release")}"`;
const RELEASE = process.env.VERSTAK_BUILD_CHANNEL === "release";
const DEV_DIR = process.env.VERSTAK_BUILT_DIR || join(ROOT, "dist", "dev");

/** The outputs that embed the delivery's VERSION; the onboarding hook imports only its words. */
const VERSIONED = new Set([BRIDGE, EXTENSION, PLUGIN]);
const VERSION_DECL = /^var VERSION = "([^"]+)";$/gm;
const versionOf = (text) =>
  /^var VERSION = "(\d+)\.(\d+)\.(\d+)";$/m
    .exec(text ?? "")
    ?.slice(1)
    .map(Number);
const below = (v, w) => !!v && (v[0] - w[0] || v[1] - w[1] || v[2] - w[2]) < 0;

if (CHECK) {
  let bad = 0;
  let pending = 0;
  const bridge = existsSync(join(ROOT, BRIDGE)) ? readFileSync(join(ROOT, BRIDGE), "utf8") : null;
  for (const rel of OUTPUTS) {
    const path = join(ROOT, rel);
    const have = existsSync(path) ? readFileSync(path, "utf8") : null;
    if (have === null && PENDING.has(rel) && below(versionOf(bridge), PENDING.get(rel))) {
      pending++;
      console.log(`· ${rel}: first ships with ${PENDING.get(rel).join(".")} — absent until then`);
      continue;
    }
    // esbuild preserves this delivery-layer declaration in the versioned outputs.
    // Match the declaration, not a version string elsewhere in the bundle.
    const versions = [...(have ?? "").matchAll(VERSION_DECL)];
    const why =
      have === null
        ? "missing"
        : have.includes(DEV_MARK)
          ? "carries the dev mark"
          : rel === BRIDGE && !have.includes(RELEASE_MARK)
            ? "has no release mark"
            : !VERSIONED.has(rel)
              ? null
              : versions.length !== 1
                ? "must carry exactly one embedded VERSION declaration"
                : versions[0][1] !== version
                  ? `version ${versions[0][1]} differs from stamped version ${version} in ${MARK_SOURCE}`
                  : null;
    if (why) {
      bad++;
      console.error(`✗ ${rel}: ${why} — it is written by make build-release (the release job)`);
    }
  }
  if (bad) process.exit(1);
  process.stdout.write(
    `✓ ${OUTPUTS.length - pending} committed JS outputs are a release build, no dev mark, version ${version}\n`,
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
