// Warning-only source proof for pi's observed git installation (#10316, @nks/nks-dev).
// This does not grant flat ownership or permission to update any files.
import { spawnSync } from "node:child_process";
import { realpathSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

import { SKILL_SET } from "../delivery/index.ts";

export function ownPiGitSource(root: string): boolean {
  try {
    const checkout = join(realpathSync(homedir()), ".pi", "agent", "git", "github.com", SKILL_SET);
    if (realpathSync(root) !== join(checkout, "skills")) return false;
    // Read this checkout's origin only; no network, inherited git directory, or updater.
    const origin = spawnSync(
      "git",
      ["config", "--file", join(checkout, ".git", "config"), "--get-all", "remote.origin.url"],
      {
        encoding: "utf8",
        timeout: 1000,
        maxBuffer: 4096,
        windowsHide: true,
        stdio: ["ignore", "pipe", "ignore"],
      },
    );
    return origin.status === 0 && origin.stdout.trim() === `https://github.com/${SKILL_SET}`;
  } catch {
    return false;
  }
}
