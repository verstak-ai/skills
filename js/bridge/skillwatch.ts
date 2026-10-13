// Last successfully answered sends and cheap disk checks (#6501, graph @nks/nks-dev).
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { BRIDGE_FILE, BRIDGE_SKILL, envName } from "../delivery/index.ts";
import { envOf, scoped } from "../shared/scope.ts";
import { lockPlaces } from "../shared/skilllock.ts";
import { safeSkills } from "../shared/snapshot.ts";
import { normKarta, normName } from "./names.ts";
import { skillsAttr, skillsRefreshAllowed, skillsRoot, skillsUnavailable } from "./skillset.ts";
import { type Standing } from "./transport.ts";

type Skills = NonNullable<ReturnType<typeof safeSkills>>;
type Place = { realm?: unknown; karta?: unknown; name?: unknown };
const W = scoped(() => ({
  announced: new Map<string, Skills>(),
  checkedAt: 0,
  disk: "",
  installed: undefined as Skills | undefined,
  pending: false,
  missingSince: null as number | null,
  unsettled: false,
}));
const key = (p: Place): string => `${p.realm ?? ""}|${normKarta(p.karta)}|${normName(p.name)}`;
export const announcedSkills = (p: Place): Skills | undefined => W.announced.get(key(p));
/** Seat writes share the absence guard; explicit moves bypass the background window. */
export function installedSkills(p: Place, fresh = false): Skills {
  if (!skillsRefreshAllowed()) return skillsAttr();
  checkInstalled(fresh);
  return W.installed ?? announcedSkills(p) ?? skillsAttr();
}
/** One decision for tool refresh and usage publication, against successfully answered sends. */
export function skillsNeedRegister(p: Partial<Standing>): boolean {
  if (!skillsRefreshAllowed()) return false;
  checkInstalled();
  if (W.unsettled) return false;
  return JSON.stringify(announcedSkills(p)) !== JSON.stringify(W.installed);
}
export function noteSkills(p: Partial<Standing>, skills: unknown): void {
  const s = safeSkills(skills);
  if (s) W.announced.set(key(p), s);
}
const modified = (path: string): string => {
  try {
    const s = statSync(path);
    return `${path}:${s.mtimeMs}:${s.size}`;
  } catch {
    return `${path}:missing`;
  }
};
function diskVersion(): string {
  const root = skillsRoot();
  if (!root) return "missing";
  const locks = lockPlaces(root, envOf("XDG_STATE_HOME"));
  let names: string[] = [];
  try {
    names = readdirSync(root).sort();
  } catch {
    /* removed during update */
  }
  // Locks cover flat installs; file mtimes cover in-place plugin edits too.
  return [
    root,
    ...locks,
    ...names.flatMap((n) => [join(root, n), join(root, n, "SKILL.md")]),
    join(root, BRIDGE_SKILL, "scripts", BRIDGE_FILE),
  ]
    .map(modified)
    .join("|");
}
/** Background checks are once a minute; explicit moves check now. Hash after mtime changes. */
function checkInstalled(fresh = false): void {
  if (!skillsRefreshAllowed()) return;
  const gap = Number(process.env[envName("SKILLS_GAP_MS")]) || 60_000;
  const now = Date.now();
  if (!fresh && W.checkedAt && now - W.checkedAt < gap) return;
  W.checkedAt = now;
  const disk = diskVersion();
  const missing = skillsUnavailable();
  W.missingSince = missing ? (W.missingSince ?? now) : null;
  W.unsettled = W.missingSince !== null && now - W.missingSince < gap;
  if (W.unsettled) return;
  if (disk === W.disk) return;
  W.disk = disk;
  W.installed = skillsAttr();
  W.pending = true;
}
export function skillsCheckDue(): boolean {
  checkInstalled();
  const due = W.pending;
  W.pending = false;
  return due;
}
export function retrySkillsCheck(): void {
  W.disk = "";
}
