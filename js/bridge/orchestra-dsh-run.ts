// The dsh process of one run (graph @nks/nks-dev, node #10777): started detached in the run's
// own tree, its NDJSON events into a private file. The session id is the first `session`
// event's; the end is `final` and the exit (orchestra-dsh-proc.ts). A non-zero exit before
// `session` is a refused launch, never retried (#7523). The pair rides the spawned-for
// environment variable, never the brief.
import { spawn } from "node:child_process";
import { closeSync, openSync } from "node:fs";

import { envName, SPAWNED_FOR_ENV } from "../delivery/index.ts";
import {
  dshArgv,
  dshFiles,
  dshReady,
  type DshSpec,
  modelPatch,
  writeModelPatch,
} from "./orchestra-dsh.ts";
import { children, dshEvents, dshExit, dshTerminate, exits } from "./orchestra-dsh-proc.ts";
import { type Run, writeRuns } from "./orchestra-runs.ts";
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
  const fail = (why: string, state: Run["state"] = "refused"): string => {
    run.state = state;
    run.why = why;
    writeRuns(authDir, runs);
    return why;
  };
  // Nothing started: the tree and the row go, a later tact raises the call again (#10598).
  const unstarted = async (why: string): Promise<string> => {
    const kept = await dropUnlaunched(authDir, runs, key);
    return kept ? fail(`${why}, ${kept}`, "ambiguity") : `${why}, retry`;
  };
  const ready = dshReady(spec);
  if ("code" in ready) return unstarted(ready.code);
  const model = modelPatch(run.model);
  if (!model || !run.tree) return unstarted(model ? "tree_unverified" : "dsh_model_invalid");
  const files = dshFiles(authDir, run.tree.operation);
  writeModelPatch(files.model, files.dir, model);
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    [SPAWNED_FOR_ENV]: JSON.stringify({ invite: run.invite, room: run.room }),
  };
  delete env[envName("ORCHESTRA")]; // the raised agent's bridge gets no raising consent
  const out = openSync(files.events, "a", 0o600),
    err = openSync(files.stderr, "a", 0o600);
  let child;
  try {
    child = spawn(ready.bin, dshArgv(ready.patch, files.model, brief), {
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
  run.dsh = { pid: started, events: files.events, model: files.model };
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
      run.dsh.exit = exit;
      run.closed = "client_exited";
      run.tree.exit = new Date().toISOString();
      return fail(`dsh_exit_${exit}`);
    }
    await new Promise((done) => setTimeout(done, 100));
  }
  // No session within the window: the process is ours and ends; its exit frees the slot.
  await dshTerminate(run, "no_session");
  return fail("dsh_no_session", "launched");
}
