// The seat handover spool (graph @nks/nks-dev, node #6586): the outgoing daemon holds
// the seat's socket until the successor evicts it (handoff.ts) and writes frames that
// arrive after the door closed here, a JSON line each, beside the seat key (0600).
// Entries: {open} — handover began, {frame} — a frame as it came, {done} — the socket
// went (evicted or closed at the limit). The successor replays them after hello through hold.ts; .seen drops repeats.
import { appendFileSync, mkdirSync, readFileSync, unlinkSync } from "node:fs";
import { dirname } from "node:path";

import { envName } from "../delivery/index.ts";
import { type Frame } from "../shared/channel.ts";
import { bindScope } from "../shared/scope.ts";
import { log } from "./streams.ts";

/** How long the outgoing daemon holds the seat's socket awaiting the successor's eviction. */
export const HANDOFF_MS = Number(process.env[envName("BRIDGE_DAEMON_HANDOFF_MS")]) || 12_000;
/** How long the successor waits for the spool's end: the outgoing one's limit plus its exit. */
const DRAIN_MS = HANDOFF_MS + 5_000;
const DRAIN_TICK_MS = 200;
/** Older spooled frames (the seat was gone for long) are replayed marked stale, not live. */
const SPOOL_LIVE_MS = DRAIN_MS;

interface Entry {
  open?: number;
  frame?: string;
  /** When the frame was spooled. */
  at?: number;
  done?: number;
}

function append(path: string, entry: Entry): void {
  try {
    appendFileSync(path, JSON.stringify(entry) + "\n", { mode: 0o600 });
  } catch (e) {
    const id =
      entry.frame === undefined ? "" : `, frame ${String(parseFrame(entry.frame)?.id ?? "?")}`;
    log(`handover spool not written (${path}${id}): ${(e as Error).message}`);
  }
}

/** Open the spool before the successor reads hello: an open spool is waited for, not skipped. */
export function openSpool(path: string): void {
  try {
    mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  } catch {}
  append(path, { open: Date.now() });
}

export const spoolFrame = (path: string, raw: string): void =>
  append(path, { frame: raw, at: Date.now() });
export const closeSpool = (path: string): void => append(path, { done: Date.now() });

const draining = new Set<string>();

function parseFrame(raw: string): Frame | null {
  try {
    const f = JSON.parse(raw) as unknown;
    return f && typeof f === "object" ? (f as Frame) : null;
  } catch {
    return null; // not JSON: delivered as is, as the socket would
  }
}

/** Whole entries only (ending in a newline); a partial one is read on the next pass. */
function entries(path: string): Entry[] | null {
  let text: string;
  try {
    text = readFileSync(path, "utf8");
  } catch {
    return null;
  }
  return text
    .slice(0, text.lastIndexOf("\n") + 1)
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line) as Entry;
      } catch {
        return {};
      }
    });
}

/** A frame older than the live limit gets stale; its time, else the handover's start. */
function aged(raw: string, at: number): [string, Frame | null] {
  const frame = parseFrame(raw);
  if (Date.now() - at <= SPOOL_LIVE_MS || frame?.type !== "message") return [raw, frame];
  const stale = { ...frame, stale: true };
  return [JSON.stringify(stale), stale];
}

/**
 * Replay the seat's spool (the successor, on hello): frames to feed in order until every
 * begun handover writes its end or the limit passes, then the file goes. Spooled frames
 * may land after newer live ones.
 */
export function drainSpool(path: string, feed: (raw: string, frame: Frame | null) => void): void {
  if (draining.has(path)) return;
  const give = bindScope((raw: string, at: number) => feed(...aged(raw, at)));
  const until = Date.now() + DRAIN_MS;
  let taken = 0;
  let openedAt = 0;
  const tick = (): void => {
    const all = entries(path);
    if (!all) return void draining.delete(path);
    const fresh: [string, number][] = [];
    for (const e of all.slice(taken)) {
      if (e.open) openedAt = e.open;
      if (typeof e.frame === "string") fresh.push([e.frame, e.at ?? openedAt]);
    }
    if (fresh.length) log(`handover spool: ${fresh.length} frame(s) of the outgoing daemon`);
    for (const [raw, at] of fresh) give(raw, at);
    taken = all.length;
    const opened = all.filter((e) => e.open).length;
    const done = all.filter((e) => e.done).length;
    if (done < opened && Date.now() < until) {
      setTimeout(tick, DRAIN_TICK_MS).unref?.();
      return;
    }
    draining.delete(path);
    try {
      unlinkSync(path);
    } catch {}
  };
  draining.add(path);
  tick();
}
