// Both adapters consume the same admitted row and brief; only explicit exec selects the new one.
import { ORCHESTRA, SPAWN_LINE } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import { launchExec } from "./exec-launch.ts";
import type { Launcher } from "./orchestra-launchers.ts";
import { launchArgv, orcaLaunch, run as orcaRun } from "./orchestra-orca.ts";
import { orcaSeesTree } from "./orchestra-orca-seen.ts";
import { coverRefusal, homeOf } from "./orchestra-raise-gates.ts";
import { type Run, writeRuns } from "./orchestra-runs.ts";
import { prepareTree } from "./orchestra-tree.ts";
import { dropUnlaunched } from "./orchestra-tree-drop.ts";

/** Observed on OpenCode 2.2.7 under Orca: a 439-character line was pasted unsent, ~230 were
 * sent (#9966) — the ordinary launch refuses a longer line rather than paste it. */
export const BRIEF_MAX = 220;

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
  // One line (#9969 v12): the pair opens the line and the brief follows through a space — a
  // multi-line or long --prompt the terminal turns into a paste that is never sent (#9966 v18).
  // A role raised in its home by the description names itself: the seat takes it, not the
  // cover's role (#10598).
  const home = !!homeOf(own, run.realm, run.karta);
  const pair = { invite: run.invite, room: run.room, ...(home ? { karta: run.karta } : {}) };
  const prompt =
    `${SPAWN_LINE} ${JSON.stringify(pair)} ` +
    words(ORCHESTRA).brief(run.realm, run.karta, run.room, run.invite);
  const exec = own.harnesses[run.harness].exec;
  if (!exec && prompt.length > BRIEF_MAX) return "brief_too_long";
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
  const uncovered = await coverRefusal(run.worktree, run.realm, run.karta, canon, home);
  if (uncovered || gone?.gone) {
    run.state = "ambiguity";
    run.why = uncovered ?? "caller_gone_before_launch";
    writeRuns(authDir, runs);
    return run.why;
  }
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
  const unseen = await orcaSeesTree(run.worktree);
  if (unseen || gone?.gone) {
    const why = unseen ?? "caller_gone_before_launch";
    // Nothing was launched: the tree and the row go, and a later tact raises the call again.
    const kept = await dropUnlaunched(authDir, runs, key);
    if (!kept) return `${why}, retry`;
    run.state = "ambiguity";
    run.why = kept;
    writeRuns(authDir, runs);
    return `${why}, ${kept}`;
  }
  const got = await orcaLaunch(launchArgv(run.harness, run.worktree, run.model, prompt));
  if (got.handle) run.terminal = got.handle;
  if (got.runtime) run.runtime = got.runtime;
  if (got.prompt) run.prompt = got.prompt;
  if (got.receipt) run.receipt = got.receipt;
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
