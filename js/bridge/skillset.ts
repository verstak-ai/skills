// The skill set INSTALLED at the holder, read by the disk watcher and snapshots (graph
// @nks/nks-dev, nodes #6226, #6211 for the shape), not the texts loaded into the session.
// version — the bridge file's version inside the set, not the running bridge: build and
// skills differ exactly when the bridge updated and the set did not. stamp — 8 hex,
// tells sets apart within a version.
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { BRIDGE_FILE, BRIDGE_SKILL, SKILL_SET, SKILL_STAMP_MASK } from "../delivery/index.ts";
import { SKILLS_ROOT_ENV } from "../shared/clients.ts";
import { currentScope, envOf, scoped } from "../shared/scope.ts";
import { skillLock } from "../shared/skilllock.ts";
import { versionIn } from "../shared/version.ts";
import { log } from "./streams.ts";

/** The set root by env: the home copy lies outside the set and learns it only this way. */
export { SKILLS_ROOT_ENV };
const SET = SKILL_SET;
const BRIDGE_IN_SET = join(BRIDGE_SKILL, "scripts", BRIDGE_FILE);

// Env and file of the harness's bridge (shared/scope.ts): a daemon session learns the set
// from the thin bridge the harness started, not from the daemon.
const env = (k: string): string => envOf(k)?.trim() ?? "";

const R = scoped(() => ({ identity: "", root: null as string | null, missing: "" }));

/** Skills directory: explicit root, own layout, loaded plugin, then flat installation. */
export function skillsRoot(
  self = currentScope().origin?.path || fileURLToPath(import.meta.url),
): string | null {
  const plugin = env("CLAUDE_PLUGIN_ROOT");
  const explicit = env(SKILLS_ROOT_ENV);
  const identity = JSON.stringify([explicit, self, plugin]);
  if (identity !== R.identity) {
    R.identity = identity;
    R.root = null;
  }
  const exists = (root: string): boolean => existsSync(join(root, BRIDGE_IN_SET));
  // Keep the identified installation when it disappears; never borrow another set.
  if (!R.root) {
    const candidates = [
      explicit && resolve(explicit),
      resolve(dirname(self), "..", ".."),
      plugin && resolve(plugin, "skills"),
      join(homedir(), ".agents", "skills"),
    ];
    R.root = candidates.find((c) => c && exists(c)) || null;
  }
  return R.root && exists(R.root) ? R.root : null;
}

/** Distinguish an incomplete replacement from disappearance of the identified root. */
export function skillsUnavailable(): "bridge" | "root" | null {
  if (skillsRoot() || !R.root) return null;
  return existsSync(R.root) ? "bridge" : "root";
}

/** Versioned plugin updates do not identify the set loaded by a live harness session. */
export function skillsRefreshAllowed(): boolean {
  const self = currentScope().origin?.path || fileURLToPath(import.meta.url);
  const root = skillsRoot(self);
  return (
    !env("CLAUDE_PLUGIN_ROOT") &&
    !self.includes("/plugins/cache/") &&
    !(root && existsSync(join(root, "..", ".claude-plugin", "plugin.json")))
  );
}

const sha8 = (h: ReturnType<typeof createHash>): string => h.digest("hex").slice(0, 8);

/** Flat source and fingerprint from the install lock (graph @nks/nks-dev, node #6226). */
function lockSet(root: string): { name: string; stamp: string | null } {
  const skills = skillLock(root, env("XDG_STATE_HOME"));
  if (!skills) return { name: SET, stamp: null };
  const own = skills[BRIDGE_SKILL]?.source;
  const name = typeof own === "string" && own.trim() ? own.trim() : SET;
  const lines = Object.entries(skills)
    .filter(([, s]) => s?.source === name && typeof s.skillFolderHash === "string")
    .map(([n, s]) => `${n}:${String(s?.skillFolderHash)}\n`)
    .sort();
  return { name, stamp: lines.length ? sha8(createHash("sha256").update(lines.join(""))) : null };
}

const isFileAt = (p: string): boolean => {
  try {
    return statSync(p).isFile();
  } catch {
    return false;
  }
};

/** Every file under dir, relative to it with "/" separators, sorted. */
function allFiles(dir: string, at = ""): string[] {
  let entries;
  try {
    entries = readdirSync(join(dir, at), { withFileTypes: true });
  } catch {
    return [];
  }
  return entries
    .flatMap((e) => {
      const rel = at ? `${at}/${e.name}` : e.name;
      if (e.isDirectory()) return allFiles(dir, rel);
      // A file symlink is read through, as the one-file mask reads it; a directory link is not walked.
      return e.isFile() || (e.isSymbolicLink() && isFileAt(join(dir, rel))) ? [rel] : [];
    })
    .sort();
}

/**
 * The set's fingerprint by the layer's mask `*\/<path>` or `*\/**`: per skill directory
 * (sorted), the named file — or every file, each under its relative path. The `*\/<file>`
 * form hashes exactly as the earlier one-file stamp did.
 */
export function treeStamp(root: string, mask: string = SKILL_STAMP_MASK): string | null {
  const [head, ...restParts] = mask.split("/");
  const rest = restParts.join("/");
  if (head !== "*" || !rest || (rest.includes("*") && rest !== "**"))
    throw new Error(`unsupported skill stamp mask: ${mask}`);
  const h = createHash("sha256");
  let n = 0;
  let names: string[];
  try {
    names = readdirSync(root).sort();
  } catch {
    return null;
  }
  for (const name of names) {
    const files = rest === "**" ? allFiles(join(root, name)) : [rest];
    const bodies: [string, Buffer][] = [];
    for (const rel of files) {
      try {
        bodies.push([rel, readFileSync(join(root, name, rel))]);
      } catch {
        /* no such file in this skill */
      }
    }
    if (!bodies.length) continue;
    h.update(`${name}\0`);
    for (const [rel, body] of bodies) {
      if (rest === "**") h.update(`${rel}\0`);
      h.update(body);
    }
    h.update("\0");
    n++;
  }
  return n ? sha8(h) : null;
}

/** Raw installed set; seat writes use the watcher's settled value (skillwatch.ts). */
export function skillsAttr(): { name: string; version: string; stamp?: string } {
  const root = skillsRoot();
  const missing = !root ? R.root || "unidentified" : "";
  if (missing !== R.missing) {
    R.missing = missing;
    if (missing) log(`installed skills root is missing: ${missing}; not selecting another set`);
  }
  if (!root) return { name: SET, version: "unknown" };
  let version = "unknown";
  try {
    version = versionIn(readFileSync(join(root, BRIDGE_IN_SET), "utf8")) ?? "unknown";
  } catch {
    log(`installed skills root is missing or unreadable: ${root}; not selecting another set`);
  }
  const lock = lockSet(root);
  const stamp = lock.stamp ?? treeStamp(root);
  return { name: lock.name, version, ...(stamp ? { stamp } : {}) };
}
