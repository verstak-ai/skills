// What a run's own dsh process says and whether it lives (graph @nks/nks-dev, node #10777):
// its NDJSON event file, its exit, its end by its own process group — never another's pid.
// A pid alone proves nothing after a restart: the process is ours only as a child this daemon
// started, or by its command line carrying this run's model overlay, unique per run.
import { execFile } from "node:child_process";
import { readFileSync } from "node:fs";

import type { Run } from "./orchestra-runs.ts";

/** Exits this process saw, by pid: a restarted daemon finds the pid gone instead. */
export const exits = new Map<number, string>();
/** Children this process started and has not yet seen exit. */
export const children = new Set<number>();

const commandOf = (pid: number): Promise<string | null> =>
  new Promise((done) =>
    execFile(
      "ps",
      ["-o", "command=", "-p", String(pid)],
      { windowsHide: true, timeout: 5_000 },
      (e, out) => done(e ? null : String(out)),
    ),
  );

/** Proven ours and alive; no ps, another command, an error — not ours. */
async function ours(r: Run): Promise<boolean> {
  const d = r.dsh;
  if (!d || exits.has(d.pid)) return false;
  if (children.has(d.pid)) return true;
  if (!d.model) return false;
  return (await commandOf(d.pid))?.includes(d.model) ?? false;
}

/** What the event file said so far: the first session id and the final reason. */
export function dshEvents(path: string): { session?: string; final?: string } {
  let text: string;
  try {
    text = readFileSync(path, "utf8");
  } catch {
    return {};
  }
  const out: { session?: string; final?: string } = {};
  for (const line of text.split("\n")) {
    let e: { type?: unknown; sessionId?: unknown; reason?: { kind?: unknown } };
    try {
      e = JSON.parse(line) as typeof e;
    } catch {
      continue;
    }
    const id = typeof e.sessionId === "string" && e.sessionId ? e.sessionId.slice(0, 128) : "";
    if (e.type === "session" && id && !out.session) out.session = id;
    if (e.type === "final")
      out.final = typeof e.reason?.kind === "string" ? e.reason.kind.slice(0, 64) : "unknown";
  }
  return out;
}

/** The exit of the run's own process, or undefined while it is proven ours and alive; a process
 * not proven ours is an unknown exit. */
export async function dshExit(r: Run): Promise<string | undefined> {
  if (!r.dsh) return undefined;
  const seen = exits.get(r.dsh.pid);
  if (seen) return seen;
  return (await ours(r)) ? undefined : "unknown";
}

/** End the run's own process group — only while it is proven ours and alive. */
export async function dshTerminate(r: Run, why: string): Promise<void> {
  if (!r.dsh || r.dsh.terminated || !(await ours(r))) return;
  try {
    process.kill(-r.dsh.pid, "SIGTERM");
    r.dsh.terminated = why;
  } catch {
    /* gone meanwhile — the exit decides */
  }
}

/** One observation of a live dsh run: events read, a confirmed stop ends its own process; true
 * when its exit is newly seen — the caller records it as the client's exit. */
export async function observeDsh(r: Run): Promise<boolean> {
  if (!r.dsh || r.dsh.exit) return false;
  const seen = dshEvents(r.dsh.events);
  if (seen.session && !r.dsh.session) r.dsh.session = seen.session;
  if (seen.final) r.dsh.final = seen.final;
  if (r.stop_outcome === "stopped") await dshTerminate(r, "stopped");
  const exit = await dshExit(r);
  if (!exit) return false;
  r.dsh.exit = exit;
  return true;
}

/** A run gone wrong after its session: its final not completed, or a non-zero exit — never
 * our own termination nor an unknown exit. */
export function dshFailure(r: Run): string | undefined {
  const d = r.dsh;
  if (!d?.session || !d.exit || d.terminated) return undefined;
  if (d.final && d.final !== "completed") return `dsh_final_${d.final}`;
  return d.exit === "0" || d.exit === "unknown" ? undefined : `dsh_exit_${d.exit}`;
}

/** Our dsh process exited and the tape, read after it, shows no seat: the run ends, nothing
 * to stop (#10777). True — ended here. */
export function endDshUnseated(r: Run, live: boolean): boolean {
  if (!r.dsh?.exit || !r.tree?.exit || r.standing_id || !live) return false;
  r.state = "ended";
  r.why = dshFailure(r) ?? `dsh_ended_${r.dsh.final ?? "no_final"}`;
  return true;
}
