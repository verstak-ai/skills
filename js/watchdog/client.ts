// The client of the local standing socket the bridge holds (graph @nks/nks-dev, node #4234).
// A watchdog holds and reopens nothing: it reads the bridge's events and turns them into
// what the harness understands — a line under Monitor or a process exit.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { connect } from "node:net";
import { join } from "node:path";

import { type ChannelEvent } from "../bridge/hold.ts";
import { envName } from "../delivery/index.ts";
import { type Frame } from "../shared/channel.ts";
import { batchHead } from "../shared/frame-text.ts";
import { setLang } from "../shared/lang.ts";
import { deliveryKeys, eventIn, type Marks, seenIds } from "../shared/seen.ts";
import { staleBatch } from "../shared/stalebatch.ts";
import { authDirFromEnv, socketPathOf, standingsDirOf } from "../shared/standings.ts";
import { wd } from "./words.ts";

// The bridge may come up a little after the watchdog, a seat may return after a daemon
// change. The variable is a probe seam, not a human knob.
const ATTACH_WINDOW_MS = Number(process.env[envName("WATCHDOG_ATTACH_MS")]) || 60_000;
const RETRY_MS = 1000;

export interface Resolved {
  key: string;
  path: string;
  authDir: string;
}

export interface WatchdogArgs {
  key?: string;
  authDir: string;
}

/** `[key] [--auth-dir <dir>] [--lang en|ru]`: the bridge's directory, else the watchdog looks elsewhere; the bridge names the language. */
export function parseWatchdogArgs(argv: string[]): WatchdogArgs {
  const out: WatchdogArgs = { authDir: authDirFromEnv() };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--auth-dir") out.authDir = argv[++i] ?? out.authDir;
    else if (a === "--lang") setLang(argv[++i]);
    else if (!a.startsWith("--") && !out.key) out.key = a;
  }
  return out;
}

/** Which standing to listen to: the named one, or the only one the bridge holds. */
export function resolveStanding(argv: string[]): Resolved | { error: string } {
  const { key, authDir } = parseWatchdogArgs(argv);
  const dir = standingsDirOf(authDir);
  const pathFor = (k: string) => socketPathOf(authDir, k);
  if (key) return { key, path: pathFor(key), authDir };
  // Readable keys lie next to the sockets as <hash>.key files.
  const held = existsSync(dir)
    ? readdirSync(dir)
        .filter((f) => f.endsWith(".key"))
        .map((f) => {
          try {
            return readFileSync(join(dir, f), "utf8").trim();
          } catch {
            return "";
          }
        })
        .filter(Boolean)
    : [];
  if (held.length === 1) return { key: held[0], path: pathFor(held[0]), authDir };
  if (held.length === 0) {
    return {
      error: wd().noHeld(),
    };
  }
  return {
    error: wd().severalHeld(held.join(", ")),
  };
}

/**
 * The delivered-memory file the bridge named in `attached` (the seat's memory is per
 * server, unknown to the watchdog); without one the derived path stays. Re-read from it.
 */
export function adoptSeenPath(
  named: string | undefined,
  current: string,
  seen: Set<string>,
): string {
  if (!named || named === current) return current;
  seen.clear();
  for (const x of seenIds(named)) seen.add(x);
  return named;
}

/**
 * A stale batch at delivery time, by the watchdog's memory `has` (shared/stalebatch.ts).
 * An older bridge's event carries only the shown frames and the marks beyond them
 * (unshown): then its text and marks are used, shown ones as delivery keys (#5831);
 * events beyond the shown went in only as a count: `ev:`/`evs:` become `cev:`/`cevs:` (seen.ts).
 */
export function staleOf(ev: ChannelEvent, has: Marks): { text: string; keys: string[] } {
  if (!ev.unshown) return staleBatch(ev.frames ?? [], has);
  const shown = (ev.frames ?? []).flatMap((f) => deliveryKeys(f));
  const named = ev.unshown.map((k) => (/^evs?:/.test(k) ? `c${k}` : k));
  return { text: ev.text ?? "", keys: [...shown, ...named] };
}

/**
 * Batch heads as lines at print time (#6574): a copy whose event is already in the turn
 * by the watchdog's memory, or goes as text in this same output (`carriers`), is not
 * counted (seen.ts eventIn). The carriers themselves stay in their own head.
 */
export function heldHeads(groups: Frame[][], marks: Marks, carriers: Frame[] = []): string[] {
  const own = new Set(carriers.flatMap((f) => deliveryKeys(f)));
  const has: Marks = (k) => marks(k) || own.has(k);
  return groups
    .map((g) => g.filter((f) => carriers.includes(f) || !eventIn(f, has)))
    .filter((g) => g.length)
    .map(batchHead);
}

export interface AttachOptions {
  onEvent: (ev: ChannelEvent) => void;
  /** The bridge left (or never came up within the window): the socket is gone. */
  onGone: (why: string) => void;
}

/**
 * Attach to the local socket and read NDJSON events while the bridge lives. On a
 * `handover` event (the machine daemon passes the seat to a successor) the door closes
 * and reopens at the same path, and the watchdog re-attaches within the start window.
 */
export function attach(path: string, o: AttachOptions): void {
  let startedAt = Date.now();
  let attached = false;
  let handover = false;
  let waitingBack = false; // the seat was handed over and waits to return
  let ownRelease = false; // the bridge released the seat by the session's own close/revoke

  function tryOnce(): void {
    const sock = connect(path);
    let buf = "";
    sock.setEncoding("utf8");
    sock.on("connect", () => {
      attached = true;
      waitingBack = false;
    });
    sock.on("data", (chunk: string) => {
      buf += chunk;
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.trim()) continue;
        let ev: ChannelEvent;
        try {
          ev = JSON.parse(line) as ChannelEvent;
        } catch {
          continue; // not our line
        }
        // A frame given only as raw is parsed here: the client judges by its type.
        if (ev.kind === "frame" && ev.frame === undefined && typeof ev.raw === "string") {
          try {
            ev.frame = JSON.parse(ev.raw) as ChannelEvent["frame"];
          } catch {
            ev.frame = null;
          }
        }
        if (ev.kind === "handover") {
          handover = true; // the close that follows is not the bridge leaving
          continue;
        }
        if (ev.kind === "released" && ev.own) ownRelease = true; // own close/revoke: the watchdog leaves itself
        o.onEvent(ev);
      }
    });
    sock.on("error", () => {
      /* the close event speaks for it */
    });
    sock.on("close", () => {
      if (attached && handover) {
        // The seat goes to the daemon's successor: the same door reopens, wait with the start window.
        attached = false;
        handover = false;
        waitingBack = true;
        startedAt = Date.now();
        return void setTimeout(tryOnce, RETRY_MS);
      }
      if (ownRelease) return; // an own release was said by the released event (#6638)
      if (attached) return o.onGone(wd().bridgeLetGo());
      if (Date.now() - startedAt > ATTACH_WINDOW_MS) {
        const s = ATTACH_WINDOW_MS / 1000;
        return o.onGone(waitingBack ? wd().seatNotBack(s, path) : wd().noSocket(path, s));
      }
      setTimeout(tryOnce, RETRY_MS);
    });
  }
  tryOnce();
}
