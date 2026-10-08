// The lock of a flat install (`npx skills add`): which source each skill of a root came
// from (graph nks-dev: #6226). A root is shared by every set installed so — the lock is
// what tells them apart. Its places as npx skills 1.7.1 lays them (getSkillLockPath,
// getLocalLockPath): the global root ~/.agents/skills — $XDG_STATE_HOME/skills/.skill-lock.json
// when that is set, else beside the root; a project's <dir>/.agents/skills — <dir>/skills-lock.json.
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";

export type SkillLock = Record<string, { source?: unknown; skillFolderHash?: unknown } | undefined>;

const canon = (p: string): string => {
  try {
    return realpathSync(p);
  } catch {
    return resolve(p);
  }
};

/** Where a lock of root may lie, the first that exists speaking for it. */
function lockPlaces(root: string, stateHome = process.env.XDG_STATE_HOME): string[] {
  const places: string[] = [];
  if (stateHome && canon(root) === canon(join(homedir(), ".agents", "skills")))
    places.push(join(stateHome, "skills", ".skill-lock.json"));
  places.push(join(dirname(root), ".skill-lock.json"));
  if (basename(root) === "skills" && basename(dirname(root)) === ".agents")
    places.push(join(dirname(dirname(root)), "skills-lock.json"));
  return places;
}

/** Whether root has a lock at all — parsing or not. */
export const hasSkillLock = (root: string, stateHome = process.env.XDG_STATE_HOME): boolean =>
  lockPlaces(root, stateHome).some((p) => existsSync(p));

/** The lock's skills for root; no lock, or one that does not parse — null. */
export function skillLock(root: string, stateHome = process.env.XDG_STATE_HOME): SkillLock | null {
  const place = lockPlaces(root, stateHome).find((p) => existsSync(p));
  if (!place) return null;
  try {
    const lock = JSON.parse(readFileSync(place, "utf8")) as { skills?: SkillLock };
    return lock.skills ?? {};
  } catch {
    return null;
  }
}
