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
  if (offer.dsh)
    return [
      offer.dsh.bin ?? "dsh",
      ...dshArgv(offer.dsh.patch ?? "<dsh-profile.yml>", `<patch: model ${model}>`, w.planBrief()),
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
