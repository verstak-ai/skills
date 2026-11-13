// Safe first step of #10122 (@nks/nks-dev). Missing pinned manifest/ownership proof
// is a refusal, never permission to run an unrestricted updater in a shared root.
import { existsSync, lstatSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

import { BRIDGE_SKILL, envName, SKILL_CATCHUP, SKILL_SET } from "../delivery/index.ts";
import { OPENCODE_CLIENT, PI_CLIENT, SKILLS_ROOT_ENV } from "../shared/clients.ts";
import { words } from "../shared/lang.ts";
import { currentScope, envOf } from "../shared/scope.ts";
import { compareVersions, parseVersion } from "../shared/semver.ts";
import { skillLock } from "../shared/skilllock.ts";
import { releaseBuild, VERSION } from "../shared/version.ts";
import { harnessName } from "./client.ts";
import { CFG, isProductionServer } from "./config.ts";
import { ownPiGitSource } from "./pi-source.ts";
import { conflictingSkillSource } from "./skillcatchup-guard.ts";
import { updateFlatSkills } from "./skillcatchup-update.ts";
import { skillsAttr, skillsRoot } from "./skillset.ts";
import { skillMoves, updatesDisabled } from "./update.ts";

export async function skillCatchupNotice(): Promise<string | null> {
  const root = skillsRoot();
  const installed = skillsAttr();
  const candidate = root || envOf(SKILLS_ROOT_ENV)?.trim();
  const globalRoot = join(homedir(), ".agents", "skills");
  const gate = join(globalRoot, "..", ".skill-catchup.lock");
  // A fresh bridge file alone says nothing about completion of the other skill files.
  if (candidate && resolve(candidate) === globalRoot) {
    try {
      lstatSync(gate);
      return words(SKILL_CATCHUP).gate(globalRoot, installed.version, VERSION, gate);
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "ENOENT")
        return words(SKILL_CATCHUP).gate(
          globalRoot,
          installed.version,
          VERSION,
          gate,
          "gate_state_unreadable",
        );
    }
  }
  const before = parseVersion(installed.version);
  const target = parseVersion(VERSION);
  if (!root || !before || !target || compareVersions(installed.version, VERSION) >= 0) return null;
  const client = harnessName();
  const moves = skillMoves();
  const plugin =
    client !== PI_CLIENT &&
    (!!envOf("CLAUDE_PLUGIN_ROOT") ||
      existsSync(join(root, "..", ".claude-plugin", "plugin.json")) ||
      existsSync(join(root, "..", ".codex-plugin", "plugin.json")));
  const item = skillLock(root, envOf("XDG_STATE_HOME"))?.[BRIDGE_SKILL];
  const source = item?.source;
  const conflict = installed.name !== SKILL_SET || conflictingSkillSource(item);
  const own = !conflict && source === SKILL_SET;
  // pi git installs do not use the flat installer's lock. This proof affects the
  // warning only; `own` and the flat auto-write admission below stay unchanged.
  const pi = client === PI_CLIENT && !conflict && ownPiGitSource(root);
  const patchOnly = before[0] === target[0] && before[1] === target[1];
  const probe = !!process.env[envName("BRIDGE_RELEASES_URL")]?.trim();
  if (
    own &&
    !plugin &&
    !patchOnly &&
    client === OPENCODE_CLIENT &&
    process.platform !== "win32" &&
    !updatesDisabled() &&
    (releaseBuild() || probe) &&
    (isProductionServer(CFG.serverUrl) || probe)
  )
    return updateFlatSkills(root, installed.version);
  const diagnostic = conflict || (!own && !plugin && !pi);
  const command = diagnostic
    ? `node ${JSON.stringify(currentScope().origin?.path || process.argv[1])} doctor`
    : plugin
      ? client.includes("codex")
        ? moves.codex
        : moves.claude
      : client === PI_CLIENT
        ? moves.pi
        : client === OPENCODE_CLIENT
          ? `npx skills add https://github.com/${SKILL_SET}/tree/v${VERSION} --skill '*' --agent opencode --global`
          : moves.flat;
  const reason = diagnostic ? "ownership" : plugin ? "plugin" : patchOnly ? "patch" : "manifest";
  return words(SKILL_CATCHUP).notice(
    root,
    installed.name,
    installed.version,
    VERSION,
    reason,
    command,
  );
}
