// The command a dry tact says it would run, per adapter (#8202, #9969, #10777).
import type { OrchestraWords } from "../delivery/index.ts";
import { dshArgv } from "./orchestra-dsh.ts";
import type { Launcher } from "./orchestra-launchers.ts";
import { launchArgv } from "./orchestra-orca.ts";

export function planLine(
  w: OrchestraWords,
  own: Launcher,
  harness: string,
  worktree: string,
  model: string,
): string {
  const offer = own.harnesses[harness];
  // The dry tact runs no git: the run's shared git-dir is named, as the run passes it (#10777).
  if (offer.dsh)
    return [
      offer.dsh.bin ?? "dsh",
      ...dshArgv(
        offer.dsh.patch ?? "<dsh-profile.yml>",
        `<patch: model ${model}>`,
        w.planBrief(),
        undefined,
        "<shared git-dir of the tree>",
      ),
      `(cwd ${worktree}, env spawned_for)`,
    ].join(" ");
  if (offer.exec)
    return [
      "orca",
      "terminal",
      "create",
      "--worktree",
      `path:${worktree}`,
      "--command",
      "<runtime-local prepare; API create/prompt; exec opencode --server --session>",
      "(exec_preflight_required)",
    ].join(" ");
  return ["orca", ...launchArgv(harness, worktree, model, w.planBrief())].join(" ");
}
