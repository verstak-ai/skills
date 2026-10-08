// The skill set INSTALLED at the holder when it takes a seat — attrs.skills (graph
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
import { currentScope, envOf } from "../shared/scope.ts";
import { skillLock } from "../shared/skilllock.ts";
import { versionIn } from "../shared/version.ts";

/** The set root by env: the home copy lies outside the set and learns it only this way. */
export { SKILLS_ROOT_ENV };
const SET = SKILL_SET;
const BRIDGE_IN_SET = join(BRIDGE_SKILL, "scripts", BRIDGE_FILE);

// Env and file of the harness's bridge (shared/scope.ts): a daemon session learns the set
// from the thin bridge the harness started, not from the daemon.
const env = (k: string): string => envOf(k)?.trim() ?? "";

/**
 * The directory holding the set's skills (`<root>/<skill>/SKILL.md`), or null.
 * Order: env; own file layout (…/<bridge skill>/scripts/); the Claude Code plugin root;
 * the flat install ~/.agents/skills.
 */
export function skillsRoot(
  self = currentScope().origin?.path || fileURLToPath(import.meta.url),
): string | null {
  const plugin = env("CLAUDE_PLUGIN_ROOT");
  const candidates = [
    env(SKILLS_ROOT_ENV),
    resolve(dirname(self), "..", ".."),
    plugin ? join(plugin, "skills") : "",
    join(homedir(), ".agents", "skills"),
  ];
  for (const c of candidates) if (c && existsSync(join(c, BRIDGE_IN_SET))) return resolve(c);
  return null;
}

const sha8 = (h: ReturnType<typeof createHash>): string => h.digest("hex").slice(0, 8);

/**
 * Flat install: the set source is the source of the bridge skill's entry in the lock where
 * npx skills puts it (shared/skilllock.ts; graph @nks/nks-dev, node #6226), else SET;
 * stamp folds skillFolderHash of that source's entries.
 */
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

/** attrs.skills — read anew at every seat taking: an updated set shows on the next one. */
export function skillsAttr(): { name: string; version: string; stamp?: string } {
  const root = skillsRoot();
  if (!root) return { name: SET, version: "unknown" };
  let version = "unknown";
  try {
    version = versionIn(readFileSync(join(root, BRIDGE_IN_SET), "utf8")) ?? "unknown";
  } catch {
    /* the bridge file vanished between search and read — version unknown */
  }
  const lock = lockSet(root);
  const stamp = lock.stamp ?? treeStamp(root);
  return { name: lock.name, version, ...(stamp ? { stamp } : {}) };
}
