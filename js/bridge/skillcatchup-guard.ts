// Conservative writable subset of the flat channel (#10122, @nks/nks-dev).
import { createHash } from "node:crypto";
import { existsSync, lstatSync, readdirSync, readFileSync, realpathSync } from "node:fs";
import { homedir } from "node:os";
import { isAbsolute, join, relative, resolve, sep } from "node:path";

import { BRIDGE_SKILL, SKILL_SET } from "../delivery/index.ts";
import { envOf } from "../shared/scope.ts";
import { type SkillLock, skillLock } from "../shared/skilllock.ts";
import { type SkillManifest } from "./skillcatchup-manifest.ts";

export function conflictingSkillSource(value: unknown): boolean {
  if (value === undefined) return false;
  if (!value || typeof value !== "object" || Array.isArray(value)) return true;
  const item = value as { source?: unknown; sourceUrl?: unknown; sourceType?: unknown };
  return (
    (item.source !== undefined && item.source !== SKILL_SET) ||
    (item.sourceType !== undefined && item.sourceType !== "github") ||
    (item.sourceUrl !== undefined &&
      item.sourceUrl !== `https://github.com/${SKILL_SET}` &&
      item.sourceUrl !== `https://github.com/${SKILL_SET}.git`)
  );
}

/** Every existing component below HOME is real; dangling symlinks count too. */
function realHomePath(path: string): void {
  const home = homedir(),
    rel = relative(home, resolve(path));
  if (isAbsolute(rel) || rel === ".." || rel.startsWith(`..${sep}`))
    throw new Error("path_outside_home");
  let at = home;
  for (const part of rel.split(sep).filter(Boolean)) {
    at = join(at, part);
    try {
      if (lstatSync(at).isSymbolicLink()) throw new Error("destination_symlink");
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") return;
      throw e;
    }
  }
}
function noLinks(path: string, budget: { left: number }): void {
  if (--budget.left < 0) throw new Error("destination_too_large");
  const stat = lstatSync(path);
  if (stat.isSymbolicLink()) throw new Error("destination_symlink");
  if (stat.isFile() && stat.nlink !== 1) throw new Error("destination_hardlink");
  if (stat.isDirectory()) for (const name of readdirSync(path)) noLinks(join(path, name), budget);
  else if (!stat.isFile()) throw new Error("destination_special_file");
}
export function flatScope(root: string): SkillLock {
  // Observed skills 1.7.6 --agent opencode writes this canonical global root only.
  if (resolve(root) !== join(homedir(), ".agents", "skills"))
    throw new Error("unsupported_flat_scope");
  realHomePath(root);
  if (realpathSync(root) !== join(realpathSync(homedir()), ".agents", "skills"))
    throw new Error("destination_not_canonical");
  const state = envOf("XDG_STATE_HOME")?.trim();
  const lockPath = state
    ? join(state, "skills", ".skill-lock.json")
    : join(root, "..", ".skill-lock.json");
  realHomePath(lockPath);
  if (!existsSync(lockPath)) throw new Error("active_lock_missing");
  const lockStat = lstatSync(lockPath);
  if (!lockStat.isFile() || lockStat.nlink !== 1) throw new Error("unsafe_active_lock");
  const lock = skillLock(root, state);
  if (!lock || typeof lock !== "object" || Array.isArray(lock)) throw new Error("invalid_lock");
  if (lock[BRIDGE_SKILL]?.source !== SKILL_SET || conflictingSkillSource(lock[BRIDGE_SKILL]))
    throw new Error("unowned_bridge_source");
  return lock;
}
export function flatOwnership(
  root: string,
  manifest: SkillManifest,
): { lock: SkillLock; removed: string[] } {
  const lock = flatScope(root);
  for (const name of manifest.names) {
    const dest = join(root, name);
    realHomePath(dest);
    if (lock[name] && lock[name]?.source !== SKILL_SET) throw new Error("foreign_skill_name");
    const source = lock[name] as
      { sourceUrl?: unknown; sourceType?: unknown; skillPath?: unknown } | undefined;
    if (conflictingSkillSource(source)) throw new Error("conflicting_skill_source");
    if (source?.skillPath !== undefined && source.skillPath !== `skills/${name}/SKILL.md`)
      throw new Error("conflicting_source_path");
    if (existsSync(dest)) {
      if (lock[name]?.source !== SKILL_SET) throw new Error("unowned_skill_name");
      if (!lstatSync(dest).isDirectory()) throw new Error("destination_not_directory");
      noLinks(dest, { left: 10000 });
    }
  }
  return {
    lock,
    removed: Object.keys(lock)
      .filter((n) => lock[n]?.source === SKILL_SET && !manifest.names.includes(n))
      .sort(),
  };
}
export function confirmFlat(root: string, manifest: SkillManifest): string[] {
  const { lock, removed } = flatOwnership(root, manifest);
  for (const name of manifest.names) {
    const entry = lock[name] as
      | { source?: unknown; ref?: unknown; skillPath?: unknown; skillFolderHash?: unknown }
      | undefined;
    if (
      !entry ||
      entry.ref !== manifest.sha ||
      entry.skillPath !== `skills/${name}/SKILL.md` ||
      entry.skillFolderHash !== manifest.hashes[name] ||
      !existsSync(join(root, name, "SKILL.md"))
    )
      throw new Error("post_read_not_pinned");
    const expected = Object.keys(manifest.files)
      .filter((p) => p.startsWith(`${name}/`))
      .sort();
    const actual = readdirSync(join(root, name), { recursive: true, encoding: "utf8" })
      .filter((p) => lstatSync(join(root, name, p)).isFile())
      .map((p) => `${name}/${p.split(sep).join("/")}`)
      .sort();
    if (JSON.stringify(actual) !== JSON.stringify(expected))
      throw new Error("post_read_file_inventory");
    for (const path of expected) {
      const bytes = readFileSync(join(root, path));
      const hash = createHash("sha1").update(`blob ${bytes.length}\0`).update(bytes).digest("hex");
      if (hash !== manifest.files[path]) throw new Error("post_read_file_bytes");
    }
  }
  return removed;
}
