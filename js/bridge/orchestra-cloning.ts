// The clone's run (graph @nks/nks-dev, node #10078, its retry-and-time paragraph; case №4206): the tact
// starts it in the daemon's background with a registry row `cloning` and goes on — quenching
// and expiry never wait for git; a later tact finds the outcome and raises. A failed clone is
// kept by repository and not tried again until the launcher description changes; a timeout
// is such a failure — no second clone into the same folder. git runs in Orca's runtime, not
// under the orca client (seen live, case №4221): the timeout ends the client only, Orca may
// still finish the clone, and a later tact then finds the checkout. The client's own pairing
// wait is a minute (case №4221, #10137): its runtime_timeout is no failure — the row stays
// cloning in Orca's runtime until the checkout is found or the clone's window ends
// (clone_timeout). Of the output only the answer's error code is read, never said.
// A checkout found lifts the repository's row, a remembered failure included. A cloning row
// without this daemon's clone (off, restart, update) and not in Orca's runtime is
// clone_interrupted, kept as a failure.
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, realpathSync } from "node:fs";

import { envName } from "../delivery/index.ts";
import { cloneArgv, cloneDeclared, type ClonePolicy, cloneTarget } from "./orchestra-clone.ts";
import { type CloneRow, readClones, writeClone } from "./orchestra-runs.ts";

/** A clone takes longer than a launch: a large repository over a slow line. */
const CLONE_MS = Number(process.env[envName("ORCHESTRA_CLONE_MS")]) || 600_000;

/** The launcher description a clone ran under: its failure stands until this changes. */
export const specOf = (launcher: unknown): string =>
  createHash("sha256").update(JSON.stringify(launcher)).digest("hex").slice(0, 16);

/** The tail of the client's output kept: a refusal is far shorter. */
const TAIL = 64 * 1024;

/** After the client's exit its output is awaited this long — a child of it may hold the pipe. */
const DRAIN_MS = 2_000;

/** The error code of the client's answer, or null; nothing else of it is kept. The answer is
 * the whole stdout, indented over many lines (#9966); a line before it that is no JSON is
 * passed over — the answer is the last object opened at a line's start that parses to the end. */
function answerCode(out: string): string | null {
  for (let at = out.length; at > 0;) {
    at = out.lastIndexOf("\n{", at - 1);
    const from = at < 0 ? 0 : at + 1;
    try {
      const code = (JSON.parse(out.slice(from)) as { error?: { code?: unknown } }).error?.code;
      return typeof code === "string" ? code : null;
    } catch {
      if (from === 0) return null;
    }
  }
  return null;
}

/** The orca client; a timeout ends the client, not Orca's git. */
function cloneRun(argv: string[], ms: number): Promise<number | string> {
  return new Promise((resolve) => {
    const child = spawn("orca", argv, {
      stdio: ["ignore", "pipe", "ignore"],
      windowsHide: true,
    });
    let out = "";
    const keep = (c: Buffer): void => {
      out = (out + c.toString("utf8")).slice(-TAIL);
    };
    child.stdout.on("data", keep);
    let timedOut = false;
    let drain: NodeJS.Timeout | undefined;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, ms);
    let ended = false;
    const done = (code: number | string): void => {
      if (ended) return;
      ended = true;
      clearTimeout(timer);
      clearTimeout(drain);
      // Read on and drop: a child that still holds the pipe neither blocks on it nor meets EPIPE.
      child.stdout.off("data", keep).resume();
      if (timedOut) return resolve("timeout");
      resolve(code !== 0 && answerCode(out) === "runtime_timeout" ? "runtime_timeout" : code);
    };
    child.once("error", (e: NodeJS.ErrnoException) => done(e.code ?? 1));
    // close reads the answer to its end; exit bounds the wait — a child of the client that
    // inherited stdout never closes it, and the clone would stay in flight for good.
    child.once("close", (code, signal) => done(code ?? signal ?? 1));
    child.once("exit", (code, signal) => {
      if (timedOut) return done(code ?? signal ?? 1);
      // The client answered within the window: the drain after it is no timeout.
      clearTimeout(timer);
      drain = setTimeout(() => done(code ?? signal ?? 1), DRAIN_MS);
    });
  });
}

/** A row left to Orca's runtime (runtime_timeout) whose clone's window has run out. */
export const runtimeOver = (row: CloneRow): boolean =>
  row.state === "cloning" && row.runtime === true && Date.now() - Date.parse(row.at) >= CLONE_MS;

/** Clones this daemon runs now: a cloning row without one here is a former daemon's. */
const inflight = new Set<string>();

/**
 * One tact's turn of the clone: "cloned" — look for the checkout again; "gone" — the caller
 * left before the start (#8202); any other word is said for the row: cloning (started now or
 * still running), a refusal, a failure — once as clone_failed, then clone_failed_before.
 */
export async function cloneTurn(
  authDir: string,
  policy: ClonePolicy,
  spec: string,
  repository: string,
  gone?: { gone: boolean },
): Promise<string> {
  let row = readClones(authDir)[repository];
  if (inflight.has(repository)) return "cloning";
  if (row?.state === "cloning" && row.runtime) {
    if (!runtimeOver(row)) return "cloning";
    row = { state: "failed", at: new Date().toISOString(), spec: row.spec, why: "clone_timeout" };
    writeClone(authDir, repository, row);
  }
  if (row?.state === "cloning") {
    row = { ...row, state: "failed", why: "clone_interrupted" };
    writeClone(authDir, repository, row);
  }
  if (row?.state === "cloned") return "cloned";
  if (row?.state === "failed" && row.spec === spec) {
    if (row.told) return `clone_failed_before (${row.why})`;
    writeClone(authDir, repository, { ...row, told: true });
    return `clone_failed (${row.why})`;
  }
  if (row) writeClone(authDir, repository, null);
  const target = cloneTarget(policy, repository);
  if ("code" in target) return target.code;
  if (!(await cloneDeclared())) return "clone_failed (orca_schema_unverified)";
  let parent: string;
  try {
    mkdirSync(target.parent, { recursive: true });
    // Canonical, case included: Orca keeps the path as given, its worktrees go by git's.
    parent = realpathSync.native(target.parent);
  } catch {
    return "clone_failed (clone_root_unwritable)";
  }
  if (gone?.gone) return "gone";
  inflight.add(repository);
  const started = new Date().toISOString();
  writeClone(authDir, repository, { state: "cloning", at: started, spec });
  void cloneRun(cloneArgv(target.project, target.url, parent), CLONE_MS).then((code) => {
    inflight.delete(repository);
    const why =
      code === 0 ? undefined : code === "timeout" ? "clone_timeout" : `clone_exit_${code}`;
    const at = new Date().toISOString();
    // The row may be gone already — a tact found the checkout while the client still waited.
    if (!readClones(authDir)[repository]) return;
    try {
      writeClone(
        authDir,
        repository,
        code === "runtime_timeout"
          ? { state: "cloning", at: started, spec, runtime: true }
          : why
            ? { state: "failed", at, spec, why }
            : { state: "cloned", at, spec },
      );
    } catch {
      /* the registry unwritable: the row stays cloning with no clone in flight — interrupted */
    }
  });
  return "cloning";
}

/** A checkout of the repository found: its clone row, whatever it says, is lifted (#10137). */
export function cloneFound(authDir: string, repository: string): void {
  if (readClones(authDir)[repository]) writeClone(authDir, repository, null);
}

/** The cloned repository found as Orca's checkout — its row is done; not found — kept failed. */
export function cloneTaken(
  authDir: string,
  repository: string,
  spec: string,
  found: boolean,
): string | null {
  if (found) {
    writeClone(authDir, repository, null);
    return null;
  }
  const at = new Date().toISOString();
  const why = "clone_unregistered";
  writeClone(authDir, repository, { state: "failed", at, spec, why, told: true });
  return `clone_failed (${why})`;
}
