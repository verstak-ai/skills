// Thin bridge fallback: the machine daemon is down, so the session runs a full bridge
// in-process (thin.ts, goLocal) and leaves a mark in the grant dir for its lifetime so
// that doctor can name it (graph @nks/nks-dev, node #6489).
import { mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

export interface Fallback {
  pid: number;
  build: string;
  since: string;
  cwd: string;
  why: string;
}

export const fallbackDir = (authDir: string): string => join(resolve(authDir), "fallback");

const alive = (pid: number): boolean => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return (e as NodeJS.ErrnoException).code === "EPERM";
  }
};

/**
 * Remove marks of killed processes, so a reused pid is not read as a session. Called by
 * the next bridge running past the daemon and by the daemon at start.
 */
export function pruneFallbacks(authDir: string): void {
  let names: string[] = [];
  try {
    names = readdirSync(fallbackDir(authDir));
  } catch {}
  for (const n of names) {
    const pid = parseInt(n, 10);
    if (Number.isInteger(pid) && !alive(pid))
      try {
        unlinkSync(join(fallbackDir(authDir), n));
      } catch {}
  }
}

/** Mark this session as running past the daemon; the mark leaves with the process. A write failure does not stop the bridge. */
export function markFallback(authDir: string, f: Omit<Fallback, "pid" | "since">): void {
  const file = join(fallbackDir(authDir), `${process.pid}.json`);
  try {
    mkdirSync(fallbackDir(authDir), { recursive: true, mode: 0o700 });
    pruneFallbacks(authDir);
    const rec: Fallback = { pid: process.pid, since: new Date().toISOString(), ...f };
    writeFileSync(file, JSON.stringify(rec), { mode: 0o600 });
    process.once("exit", () => {
      try {
        unlinkSync(file);
      } catch {}
    });
  } catch {}
}

/** Live fallback sessions of the grant dir; dead marks are skipped, not removed (doctor does not write). */
export function readFallbacks(authDir: string): Fallback[] {
  let names: string[];
  try {
    names = readdirSync(fallbackDir(authDir));
  } catch {
    return [];
  }
  const out: Fallback[] = [];
  for (const n of names) {
    try {
      const f = JSON.parse(readFileSync(join(fallbackDir(authDir), n), "utf8")) as Fallback;
      if (Number.isInteger(f.pid) && alive(f.pid)) out.push(f);
    } catch {}
  }
  return out;
}
