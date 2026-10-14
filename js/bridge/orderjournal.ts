// The stop orders' journal on the daemon's disk (graph @nks/nks-dev, node #7510): one file per
// order beside the grant, written before any act — accepted before the stop, the outcome before
// its answer — so a repeated order gives the same outcome and an unanswered outcome is
// answered again, by this process or the next daemon.
import {
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

import { CFG } from "./config.ts";

export type OrderState = "accepted" | "stopped" | "failed" | "unknown" | "refused";

export interface OrderEntry {
  id: string;
  standing: string;
  state: OrderState;
  reason?: string;
  /** the api the answer goes to: the channel's origin under /api */
  base: string;
  /** the api took the answer of `state` (or said the order is closed) */
  acked: boolean;
  at: number;
  /** the process executing it while accepted */
  pid?: number;
  /** the end of the order's answer window (issued_at + ack_window); absent — `at` + ANSWER_WINDOW_MS */
  until?: number;
}

export const ANSWER_WINDOW_MS = 60_000;

/** The bridge that took the order ended before its outcome: the stop was not seen through. */
export const RESTARTED = "bridge_restarted";

const alive = (pid: number | undefined): boolean => {
  if (pid === process.pid) return true;
  if (typeof pid !== "number") return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return (e as NodeJS.ErrnoException).code === "EPERM";
  }
};

/** A journal entry outlives any window the api keeps an order open in. */
const KEEP_MS = 24 * 3600_000;

const dir = (): string => join(CFG.authDir, "orders");
const SAFE = /^[A-Za-z0-9_-]{1,80}$/;
const fileOf = (id: string): string | null => (SAFE.test(id) ? join(dir(), `${id}.json`) : null);

export function readOrder(id: string): OrderEntry | null {
  const f = fileOf(id);
  if (!f) return null;
  try {
    return JSON.parse(readFileSync(f, "utf8")) as OrderEntry;
  } catch {
    return null;
  }
}

/** Written whole and renamed: a reader never meets half an entry. false — the disk refused. */
export function writeOrder(e: OrderEntry): boolean {
  const f = fileOf(e.id);
  if (!f) return false;
  try {
    mkdirSync(dir(), { recursive: true, mode: 0o700 });
    const tmp = `${f}.tmp-${process.pid}`;
    writeFileSync(tmp, JSON.stringify(e), { mode: 0o600 });
    renameSync(tmp, f);
    return true;
  } catch {
    return false;
  }
}

export const isTerminal = (s: OrderState): boolean => s !== "accepted";

/** The order has an outcome on this home's disk: no bridge of the home needs to read it again. */
export const settled = (id: string): boolean => {
  const e = readOrder(id);
  return !!e && isTerminal(e.state);
};

const sincePath = (): string => join(dir(), "since"); // not *.json: unanswered() skips it

/**
 * The open orders read starts past this seq (api: since). It moves only over orders settled on
 * this disk, so every bridge of the home that writes it writes a floor true for all of them.
 */
export function readSince(base: string): number {
  try {
    const n = (JSON.parse(readFileSync(sincePath(), "utf8")) as Record<string, unknown>)[base];
    return typeof n === "number" && Number.isInteger(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

export function writeSince(base: string, seq: number): void {
  let all: Record<string, unknown> = {};
  try {
    all = JSON.parse(readFileSync(sincePath(), "utf8")) as Record<string, unknown>;
  } catch {}
  try {
    mkdirSync(dir(), { recursive: true, mode: 0o700 });
    const tmp = `${sincePath()}.tmp-${process.pid}`;
    writeFileSync(tmp, JSON.stringify({ ...all, [base]: seq }), { mode: 0o600 });
    renameSync(tmp, sincePath());
  } catch {}
}

/**
 * Outcomes the api has not taken yet; taken entries past their term go. An accepted whose process is
 * gone (the daemon fell between the stop and its outcome) gets the outcome unknown once, on disk
 * — the harness is not asked again; from there it is repeated as any outcome. watching — an
 * accepted of another process still alive within the order's answer window (a predecessor daemon
 * not yet ended): it may end without its outcome, so the journal is to be read again.
 */
export function unanswered(now = Date.now()): { left: OrderEntry[]; watching: boolean } {
  let names: string[];
  try {
    names = readdirSync(dir()).filter((n) => n.endsWith(".json"));
  } catch {
    return { left: [], watching: false };
  }
  const out: OrderEntry[] = [];
  let watching = false;
  for (const n of names) {
    const e = readOrder(n.slice(0, -".json".length));
    if (!e) continue;
    // Only an answer the api took (or a closed order) goes: an untaken one waits for the api (#7510).
    if (e.acked && now - e.at > KEEP_MS) {
      try {
        unlinkSync(join(dir(), n));
      } catch {}
      continue;
    }
    if (!isTerminal(e.state) && !alive(e.pid)) {
      const end: OrderEntry = { ...e, state: "unknown", reason: RESTARTED, acked: false };
      if (writeOrder(end)) out.push(end);
      continue;
    }
    if (!isTerminal(e.state) && e.pid !== process.pid)
      watching ||= now < (e.until ?? e.at + ANSWER_WINDOW_MS);
    if (isTerminal(e.state) && !e.acked) out.push(e);
  }
  return { left: out, watching };
}
