// Both adapters consume the same admitted row and brief; only explicit exec selects the new one.
import { ORCHESTRA } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import { launchExec } from "./exec-launch.ts";
import type { Launcher } from "./orchestra-launchers.ts";
import { launchArgv, orcaLaunch } from "./orchestra-orca.ts";
import { type Run, writeRuns } from "./orchestra-runs.ts";

export async function startRun(
  authDir: string,
  row: Record<string, unknown>,
  own: Launcher,
  repository: string,
  worktree: string,
  runs: Record<string, Run>,
  key: string,
  gone?: { gone: boolean },
): Promise<string> {
  const run: Run = {
    realm: String(row.realm),
    room: String(row.room),
    invite: Number(row.invite),
    karta: Number(row.karta),
    launcher: own.launcher,
    harness: String(row.harness).trim(),
    model: String(row.model).trim(),
    repository,
    worktree,
    state: "launched",
    at: new Date().toISOString(),
  };
  const prompt =
    `spawned_for: ${JSON.stringify({ invite: run.invite, room: run.room })}\n` +
    words(ORCHESTRA).brief(run.realm, run.karta, run.room, run.invite);
  const exec = own.harnesses[run.harness].exec;
  runs[key] = run;
  if (exec) {
    let outcome: string;
    try {
      outcome = await launchExec(authDir, runs, key, own.host, exec, prompt, undefined, gone);
    } catch {
      outcome = "exec_preflight_or_prepare_failed";
      if (run.exec) {
        run.state = "ambiguity";
        writeRuns(authDir, runs);
      }
    }
    if (!run.exec) delete runs[key];
    return outcome;
  }
  writeRuns(authDir, runs);
  const got = await orcaLaunch(launchArgv(run.harness, run.worktree, run.model, prompt));
  if (got.handle) run.terminal = got.handle;
  if (got.runtime) run.runtime = got.runtime;
  if (got.outcome === "failed") {
    run.state = "refused";
    run.why = got.why;
  } else if (got.why) run.why = got.why;
  writeRuns(authDir, runs);
  return got.outcome === "failed" ? got.why! : `launched${got.why ? ` (${got.why})` : ""}`;
}
