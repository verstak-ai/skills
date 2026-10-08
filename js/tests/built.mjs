// The outputs under test are this working copy's dev build: make build-js puts it in
// dist/dev (outside the index). The committed outputs are the release build, written
// only by the release job; tests run what js/ builds right now.
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** The working copy's root. */
export const REPO = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const BUILT = process.env.VERSTAK_BUILT_DIR || join(REPO, "dist", "dev");
export const BUILT_BRIDGE = join(BUILT, "skills", "establish-mcp", "scripts", "verstak-bridge.mjs");
export const BUILT_PLUGIN = join(BUILT, "skills", "establish-mcp", "scripts", "opencode-plugin.js");
export const BUILT_EXTENSION = join(BUILT, "extensions", "verstak.js");
