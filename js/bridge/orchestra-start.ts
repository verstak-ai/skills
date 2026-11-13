// Both adapters consume the same admitted row and brief; only explicit exec selects the new one.
import { ORCHESTRA } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import { launchExec } from "./exec-launch.ts";
import type { Launcher } from "./orchestra-launchers.ts";
import { launchArgv, orcaLaunch, run as orcaRun } from "./orchestra-orca.ts";
import { coverRefusal } from "./orchestra-raise-gates.ts";
import { type Run, writeRuns } from "./orchestra-runs.ts";
import { prepareTree } from "./orchestra-tree.ts";

export async function startRun(
  authDir: string,
  row: Record<string, unknown>,
  own: Launcher,
  repository: string,
  worktree: string,
  runs: Record<string, Run>,
  key: string,
  canon: (name: string) => Promise<string | null>,
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
    state: "preparing",
    at: new Date().toISOString(),
  };
  runs[key] = run;
  let treeWhy: string | null;
  try {
    treeWhy = await prepareTree(authDir, runs, key, worktree);
  } catch {
    treeWhy = "tree_prepare_unverified";
  }
  if (treeWhy) {
    if (!run.tree) delete runs[key];
    else {
      run.state = "ambiguity";
      run.why = treeWhy;
      writeRuns(authDir, runs);
    }
    return treeWhy;
  }
  const uncovered = await coverRefusal(run.worktree, run.realm, run.karta, canon);
  if (uncovered || gone?.gone) {
    run.state = "ambiguity";
    run.why = uncovered ?? "caller_gone_before_launch";
    writeRuns(authDir, runs);
    return run.why;
  }
  const prompt =
    `spawned_for: ${JSON.stringify({ invite: run.invite, room: run.room })}\n` +
    words(ORCHESTRA).brief(run.realm, run.karta, run.room, run.invite);
  const exec = own.harnesses[run.harness].exec;
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
    if (!run.exec) {
      run.state = "ambiguity";
      run.why = outcome;
      writeRuns(authDir, runs);
    }
    return outcome;
  }
  writeRuns(authDir, runs);
  const got = await orcaLaunch(launchArgv(run.harness, run.worktree, run.model, prompt));
  if (got.handle) run.terminal = got.handle;
  if (got.runtime) run.runtime = got.runtime;
  run.state = got.outcome === "ok" ? "launched" : "ambiguity";
  if (got.outcome === "failed") {
    run.why = got.why;
  } else if (got.why) run.why = got.why;
  if (got.handle && got.runtime) {
    const shown = await orcaRun(["terminal", "show", "--terminal", got.handle, "--json"], 5_000);
    try {
      const reply = JSON.parse(shown.out) as {
        ok?: boolean;
        _meta?: { runtimeId?: string };
        result?: {
          terminal?: {
            handle?: string;
            incarnationId?: string;
            worktreePath?: string;
            executionHostId?: string;
          };
        };
      };
      const t = reply.result?.terminal;
      if (
        shown.code === 0 &&
        reply.ok &&
        reply._meta?.runtimeId === got.runtime &&
        t?.handle === got.handle &&
        t.executionHostId === "local" &&
        t.worktreePath === run.worktree &&
        t.incarnationId
      ) {
        if (run.tree) run.tree.incarnation = t.incarnationId;
      } else run.why = "tree_client_binding_unverified";
    } catch {
      run.why = "tree_client_binding_unverified";
    }
  } else run.why ??= "tree_client_binding_unverified";
  if (!run.tree?.incarnation) run.state = "ambiguity";
  writeRuns(authDir, runs);
  if (run.state === "ambiguity") return run.why ?? "launch_unverified";
  return got.outcome === "failed"
    ? (got.why ?? "launch_failed")
    : `launched${got.why ? ` (${got.why})` : ""}`;
}
