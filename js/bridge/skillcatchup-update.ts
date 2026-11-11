// Flat/OpenCode catch-up: pinned inventory, all-name guard, existing CLI, post-read.
// Graph @nks/nks-dev, #10122. Other channels remain notification-only.
import { mkdirSync, rmdirSync } from "node:fs";
import { join } from "node:path";

import { envName, SKILL_CATCHUP, SKILL_SET, tool } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import { VERSION } from "../shared/version.ts";
import { stoppedDuring, stopsNow } from "./holdstate.ts";
import { confirmFlat, flatOwnership, flatScope } from "./skillcatchup-guard.ts";
import { pinnedSkillManifest } from "./skillcatchup-manifest.ts";
import { runSkillUpdater } from "./skillcatchup-run.ts";
import { refreshSkills } from "./skillrefresh.ts";
import { skillsAttr } from "./skillset.ts";
import { installedSkills } from "./skillwatch.ts";
import { state } from "./transport.ts";

export async function updateFlatSkills(root: string, before: string): Promise<string> {
  const stops = stopsNow();
  const allowed = (): boolean => !stoppedDuring(stops);
  const assertAllowed = (): void => {
    if (!allowed()) throw new Error("updater_stopped");
  };
  const place = state.standing;
  const command = place
    ? `${tool("stand")}(${JSON.stringify({ realm: place.realm, karta: place.karta, name: place.name })})`
    : `npx skills add https://github.com/${SKILL_SET}/tree/v${VERSION} --list`;
  let uncertainGate: string | null = null;
  try {
    assertAllowed();
    flatScope(root);
    const lock = join(root, "..", ".skill-catchup.lock");
    let mayHaveWritten = false;
    let confirmed = false;
    try {
      mkdirSync(lock, { mode: 0o700 });
      uncertainGate = lock;
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "EEXIST")
        return words(SKILL_CATCHUP).gate(root, before, VERSION, lock);
      throw e;
    }
    try {
      const manifest = await pinnedSkillManifest();
      assertAllowed();
      flatOwnership(root, manifest); // recheck after taking the writer gate
      const args = [
        "--yes",
        "skills",
        "add",
        `https://github.com/${SKILL_SET}/tree/${manifest.sha}`,
        "--skill",
        ...manifest.names,
        "--agent",
        "opencode",
        "--global",
        "--yes",
        "--json",
      ];
      assertAllowed();
      const surface = await runSkillUpdater(["--yes", "skills", "--version"], 5000, allowed);
      if (surface !== "1.7.6") throw new Error("unobserved_updater_surface");
      assertAllowed();
      flatOwnership(root, manifest);
      const timeout = Math.min(
        20000,
        Math.max(100, Number(process.env[envName("SKILLS_UPDATE_TIMEOUT_MS")]) || 20000),
      );
      mayHaveWritten = true;
      await runSkillUpdater(args, timeout, allowed);
      assertAllowed();
      const removed = confirmFlat(root, manifest);
      const after = skillsAttr();
      if (after.name !== SKILL_SET || after.version !== VERSION || !after.stamp)
        throw new Error("post_read_version_or_stamp");
      confirmed = true;
      installedSkills({}, true); // queue the existing metadata refresh, not a second register path
      // stand/resume own the serialization queue: enqueue, do not await it from inside itself.
      void refreshSkills();
      return words(SKILL_CATCHUP).updated(
        root,
        before,
        VERSION,
        manifest.sha,
        after.stamp,
        removed,
      );
    } finally {
      if (!mayHaveWritten || confirmed) {
        rmdirSync(lock);
        uncertainGate = null;
      }
    }
  } catch (e) {
    if (uncertainGate)
      return words(SKILL_CATCHUP).gate(root, before, VERSION, uncertainGate, (e as Error).message);
    return words(SKILL_CATCHUP).failed(root, before, VERSION, (e as Error).message, command);
  }
}
