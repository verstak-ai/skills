// The daemon's registry of its launches (graph @nks/nks-dev, nodes #7517, #7518, #5042): one
// row per invite it raised, keyed graph|case|invite, beside the flag. The orchestrator's right
// ends at its own launches — only a row here is ever extinguished. A key once written is never
// raised again: a new raising takes a new invite.
import { randomUUID } from "node:crypto";
import {
  closeSync,
  fsyncSync,
  mkdirSync,
  openSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

import { seamRunDir } from "../shared/seam-entrance.ts";
import type { Run, RunState } from "./orchestra-run-types.ts";
import { mergeRuns, rememberRuns, runIdentity } from "./orchestra-runs-delta.ts";

export type { Run, RunState } from "./orchestra-run-types.ts";
export { runIdentity } from "./orchestra-runs-delta.ts";

export const LIVE: readonly RunState[] = [
  "preparing",
  "ambiguity",
  "launched",
  "raised",
  "stopping",
];
export const runKey = (realm: string, room: string, invite: number): string =>
  `${realm}|${room}|${invite}`;

/** A clone of a repository Orca did not know (#10078), one row per repository: a failure
 * stands until the launcher description it ran under changes. */
export interface CloneRow {
  state: "cloning" | "cloned" | "failed";
  at: string;
  /** The description's fingerprint (orchestra-clone.ts specOf). */
  spec: string;
  why?: string;
  /** The failure was said once by a tact; later tacts say clone_failed_before. */
  told?: boolean;
  /** cloning: the client gave up (runtime_timeout), git goes on in Orca's runtime — no clone
   * of any daemon's, so no clone_interrupted; it is awaited until at + the clone's window. */
  runtime?: boolean;
}

const file = (authDir: string): string => join(seamRunDir(authDir), "orchestra-runs.json");

function readFile(authDir: string): {
  runs: Record<string, Run>;
  clones: Record<string, CloneRow>;
} {
  try {
    const f = JSON.parse(readFileSync(file(authDir), "utf8")) as {
      runs?: unknown;
      clones?: unknown;
    };
    if (
      !f ||
      !f.runs ||
      typeof f.runs !== "object" ||
      Array.isArray(f.runs) ||
      (f.clones !== undefined &&
        (!f.clones || typeof f.clones !== "object" || Array.isArray(f.clones)))
    )
      throw new Error("registry_schema_invalid");
    const obj = <T>(v: unknown): Record<string, T> =>
      v && typeof v === "object" ? (v as Record<string, T>) : {};
    return { runs: obj<Run>(f.runs), clones: obj<CloneRow>(f.clones) };
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return { runs: {}, clones: {} };
    throw new Error("orchestra_registry_unreadable", { cause: e });
  }
}

function writeFile(
  authDir: string,
  f: { runs: Record<string, Run>; clones: Record<string, CloneRow> },
): void {
  mkdirSync(seamRunDir(authDir), { recursive: true, mode: 0o700 });
  const tmp = `${file(authDir)}.${randomUUID()}.tmp`;
  const fd = openSync(tmp, "wx", 0o600);
  try {
    writeFileSync(fd, JSON.stringify(f) + "\n");
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
  try {
    renameSync(tmp, file(authDir));
  } catch (e) {
    unlinkSync(tmp);
    throw e;
  }
  if (process.platform !== "win32") {
    const directory = openSync(seamRunDir(authDir), "r");
    try {
      fsyncSync(directory);
    } finally {
      closeSync(directory);
    }
  }
}

export const readRuns = (authDir: string): Record<string, Run> =>
  rememberRuns(authDir, readFile(authDir).runs);

/** The local stop may finish while a tact awaits the API: its observed close is monotonic. */
export function syncClosed(runs: Record<string, Run>, latest: Record<string, Run>): void {
  for (const [key, r] of Object.entries(runs)) {
    const stored = latest[key];
    if (stored?.closed && runIdentity(stored) === runIdentity(r)) r.closed = stored.closed;
  }
}

/** Patch only this still-current Run, synchronously against the latest registry, before ack. */
export function recordRunClosed(authDir: string, key: string, expected: Run): boolean {
  const f = readFile(authDir);
  const r = f.runs[key];
  if (!r || !LIVE.includes(r.state) || runIdentity(r) !== runIdentity(expected)) return false;
  r.closed = "client_exited";
  if (r.exec) r.exec.exit = new Date().toISOString();
  if (r.tree) r.tree.exit = new Date().toISOString();
  writeFile(authDir, f);
  return true;
}

export function writeRuns(authDir: string, runs: Record<string, Run>): void {
  const f = readFile(authDir);
  syncClosed(runs, f.runs);
  writeFile(authDir, { runs: mergeRuns(authDir, runs, f.runs), clones: f.clones });
  rememberRuns(authDir, runs, true);
}

export const readClones = (authDir: string): Record<string, CloneRow> => readFile(authDir).clones;

/** One clone row set, or dropped with null; the runs on disk stay as they lie. */
export function writeClone(authDir: string, repository: string, row: CloneRow | null): void {
  const f = readFile(authDir);
  if (row) f.clones[repository] = row;
  else delete f.clones[repository];
  writeFile(authDir, f);
}
