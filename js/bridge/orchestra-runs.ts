// The daemon's registry of its launches (graph @nks/nks-dev, nodes #7517, #7518, #5042): one
// row per invite it raised, keyed graph|case|invite, beside the flag. The orchestrator's right
// ends at its own launches — only a row here is ever extinguished. A key once written is never
// raised again: a new raising takes a new invite.
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { seamRunDir } from "../shared/seam-entrance.ts";

export type RunState =
  | "launched" // the adapter ran; no seat seen yet
  | "raised" // a raised signal carries our spawned_for: the seat is ours
  | "stopping" // a stop order went out for the empty composition
  | "ended" // the seat is gone (stop answered 410, or the order closed)
  | "refused" // the launch itself failed — nothing was raised
  | "no_seat"; // no seat within the window: the claim went elsewhere or never came

export interface Run {
  realm: string;
  room: string;
  invite: number;
  karta: number;
  launcher: string;
  harness: string;
  model: string;
  repository: string;
  worktree: string;
  /** Orca's handle of the terminal the launch opened — closed on no_seat and on ended. */
  terminal?: string;
  /** The Orca runtime that issued the handle; none (a launch before it was kept) — never closed. */
  runtime?: string;
  /** The outcome of closing that terminal: it is closed once. */
  closed?: string;
  state: RunState;
  at: string;
  why?: string;
  standing_id?: string;
  /** The seat's composition at its greatest n (#6010). */
  n?: number;
  rooms?: number;
  /** The seat sat in a case once — an empty composition before that is not the moment. */
  sat?: boolean;
  order_id?: string;
  /** When the run became stopping — its window to end runs from here (#7522). */
  stopping_at?: string;
  /** The closed stop order's state as the account's orders read it: only `stopped` ends it. */
  stop_outcome?: string;
}

export const LIVE: readonly RunState[] = ["launched", "raised", "stopping"];
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
    const obj = <T>(v: unknown): Record<string, T> =>
      v && typeof v === "object" ? (v as Record<string, T>) : {};
    return { runs: obj<Run>(f.runs), clones: obj<CloneRow>(f.clones) };
  } catch {
    return { runs: {}, clones: {} };
  }
}

function writeFile(
  authDir: string,
  f: { runs: Record<string, Run>; clones: Record<string, CloneRow> },
): void {
  mkdirSync(seamRunDir(authDir), { recursive: true, mode: 0o700 });
  const tmp = `${file(authDir)}.${process.pid}.tmp`;
  writeFileSync(tmp, JSON.stringify(f) + "\n", { mode: 0o600 });
  renameSync(tmp, file(authDir));
}

export const readRuns = (authDir: string): Record<string, Run> => readFile(authDir).runs;

export function writeRuns(authDir: string, runs: Record<string, Run>): void {
  writeFile(authDir, { runs, clones: readFile(authDir).clones });
}

export const readClones = (authDir: string): Record<string, CloneRow> => readFile(authDir).clones;

/** One clone row set, or dropped with null; the runs on disk stay as they lie. */
export function writeClone(authDir: string, repository: string, row: CloneRow | null): void {
  const f = readFile(authDir);
  if (row) f.clones[repository] = row;
  else delete f.clones[repository];
  writeFile(authDir, f);
}
