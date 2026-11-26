// The dsh process of one run (graph @nks/nks-dev, node #10777): started detached in the run's
// own tree, its NDJSON events into a private file. The session id is the first `session`
// event's; the end is `final` and the exit (orchestra-dsh-proc.ts). A non-zero exit before
// `session` is a refused launch, never retried (#7523). The pair rides the spawned-for
// environment variable, never the brief.
import { spawn } from "node:child_process";
import { closeSync, openSync, writeFileSync } from "node:fs";

import { envName, SPAWNED_FOR_ENV } from "../delivery/index.ts";
import {
  dshArgv,
  dshFiles,
  dshReady,
  type DshSpec,
  modelPatch,
  sharedGitDir,
  writeModelPatch,
} from "./orchestra-dsh.ts";
import { children, dshEvents, dshExit, dshTerminate, exits } from "./orchestra-dsh-proc.ts";
import { type Run, writeRuns } from "./orchestra-runs.ts";
import { rememberRuns } from "./orchestra-runs-delta.ts";
import { dropUnlaunched } from "./orchestra-tree-drop.ts";

export { dshTerminate, observeDsh } from "./orchestra-dsh-proc.ts";

const SESSION_MS = Number(process.env[envName("DSH_SESSION_MS")]) || 60_000;

export async function launchDsh(
  authDir: string,
  runs: Record<string, Run>,
  key: string,
  spec: DshSpec,
  brief: string,
): Promise<string> {
  const run = runs[key];
  // A continuation (#10995) carries the slept run's session id into the same session again.
  // Its failure is not a launch failure: the sleep stands and the waking word waits for the
  // next tact. The snapshot takes EVERY field the continuation clears, so the rollback
  // returns the slept life whole — exit proofs and stop outcomes included (#10995 review 4).
  const sleptDsh = run.dsh;
  const session = sleptDsh?.session;
  const slept =
    sleptDsh?.session !== undefined
      ? {
          dormant: run.dormant,
          dsh: { ...sleptDsh },
          at: run.at,
          stop_outcome: run.stop_outcome,
          order_id: run.order_id,
          stopping_at: run.stopping_at,
          restop: run.restop,
          sat: run.sat,
          rooms: run.rooms,
          n: run.n,
          idle_due: run.idle_due,
          treeExit: run.tree?.exit,
          closed: run.closed,
        }
      : undefined;
  const fail = (why: string, state: Run["state"] = "refused", snapshot = true): string => {
    if (slept) {
      if (snapshot) rememberRuns(authDir, runs);
      run.state = "dormant";
      run.why = `dormant_wake_${why}`;
      run.dormant = slept.dormant;
      run.dsh = slept.dsh;
      run.at = slept.at;
      run.stop_outcome = slept.stop_outcome;
      run.order_id = slept.order_id;
      run.stopping_at = slept.stopping_at;
      run.restop = slept.restop;
      run.sat = slept.sat;
      run.rooms = slept.rooms;
      run.n = slept.n;
      run.idle_due = slept.idle_due;
      run.closed = slept.closed ?? run.closed;
      if (run.tree) run.tree.exit = slept.treeExit ?? run.tree.exit;
      writeRuns(authDir, runs);
      return why;
    }
    run.state = state;
    run.why = why;
    writeRuns(authDir, runs);
    return why;
  };
  // Nothing started: the tree and the row go, a later tact raises the call again (#10598).
  const unstarted = async (why: string): Promise<string> => {
    if (slept) return fail(why);
    const kept = await dropUnlaunched(authDir, runs, key);
    return kept ? fail(`${why}, ${kept}`, "ambiguity") : `${why}, retry`;
  };
  const ready = dshReady(spec);
  if ("code" in ready) return unstarted(ready.code);
  const model = modelPatch(run.model);
  if (!model || !run.tree) return unstarted(model ? "tree_unverified" : "dsh_model_invalid");
  const files = dshFiles(authDir, run.tree.operation);
  writeModelPatch(files.model, files.dir, model);
  if (session) {
    run.wakes = (run.wakes ?? 0) + 1;
    writeRuns(authDir, runs);
    // The continuation's own client life (#10995): the slept life's exit marks must not end
    // the new process at once, and its event file starts over — the wait below observes THIS
    // process, not the slept one's leftovers. It is a new launch for every raise window too:
    // at moves to now, and the first life's composition marks (sat/rooms/n, idle_due) reset,
    // so expireLaunches and the no-join stop judge the continuation by its own age.
    if (run.tree) run.tree.exit = undefined;
    delete run.closed;
    run.at = new Date().toISOString();
    delete run.stop_outcome;
    delete run.order_id;
    delete run.stopping_at;
    delete run.restop;
    delete run.why;
    delete run.sat;
    delete run.rooms;
    delete run.n;
    delete run.idle_due;
    writeFileSync(files.events, "", { mode: 0o600 });
  }
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    [SPAWNED_FOR_ENV]: JSON.stringify({ invite: run.pair ?? run.invite, room: run.room }),
  };
  delete env[envName("ORCHESTRA")]; // the raised agent's bridge gets no raising consent
  const out = openSync(files.events, "a", 0o600),
    err = openSync(files.stderr, "a", 0o600);
  let child;
  try {
    const argv = dshArgv(
      ready.patch,
      files.model,
      brief,
      session,
      sharedGitDir(run.tree.commonDir),
    );
    child = spawn(ready.bin, argv, {
      cwd: run.worktree,
      env,
      detached: true,
      windowsHide: true,
      stdio: ["ignore", out, err],
    });
  } finally {
    closeSync(out);
    closeSync(err);
  }
  const started = await new Promise<number | null>((resolve) => {
    child.once("spawn", () => resolve(child.pid ?? null));
    child.once("error", () => resolve(null));
  });
  if (!started) return unstarted("dsh_spawn_failed");
  children.add(started);
  child.once("exit", (code, signal) => {
    children.delete(started);
    exits.set(started, code !== null ? String(code) : `${signal}`);
  });
  child.unref();
  run.dsh = {
    pid: started,
    events: files.events,
    model: files.model,
    ...(session ? { session } : {}),
  };
  run.state = "launched";
  writeRuns(authDir, runs);
  for (const until = Date.now() + SESSION_MS; Date.now() < until;) {
    const seen = dshEvents(files.events);
    if (seen.session) {
      run.dsh.session = seen.session;
      writeRuns(authDir, runs);
      return "launched";
    }
    const exit = await dshExit(run);
    if (exit) {
      rememberRuns(authDir, runs);
      run.dsh.exit = exit;
      run.closed = "client_exited";
      run.tree.exit = new Date().toISOString();
      return fail(`dsh_exit_${exit}`, "refused", false);
    }
    await new Promise((done) => setTimeout(done, 100));
  }
  // No session within the window: the process is ours and ends; its exit frees the slot.
  await dshTerminate(run, "no_session");
  if (slept && !exits.has(run.dsh.pid)) {
    // SIGTERM proves no exit, and the attempt's process may still live: restoring the sleep
    // here would orphan it and free its slot. The row stays live with the new pid and holds
    // the slot; the ordinary observer leads it, and the exit path decides again — a clean
    // exit with the case open re-arms the sleep, anything else ends as usual (#10995 rev 4).
    run.state = "launched";
    run.why = "dsh_no_session";
    writeRuns(authDir, runs);
    return "dsh_no_session";
  }
  return fail("dsh_no_session", "launched");
}
