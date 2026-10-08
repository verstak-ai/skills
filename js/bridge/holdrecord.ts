// The hold record on disk (graph @nks/nks-dev, node #5061): a restarted bridge returns the
// place by name instead of rotating it with connect, so address, hooks and queue stay the
// same. The secret lies 0600 beside the standing key, like the grant; revoke and a dead
// token erase it (hold.ts).
import { mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { scoped } from "../shared/scope.ts";
import { baseFilePathOf, holdFilePathOf } from "../shared/standings.ts";
import { CFG } from "./config.ts";
import { log } from "./streams.ts";

const holdFilePathFor = (key: string): string => holdFilePathOf(CFG.authDir, key);

/** Standing key from its three names, in the same form as keyFor in hold.ts. */
export function keyOf(realm: string, karta: string | number, name: string): string {
  return `${name || "_"}--${karta}--${realm}`.replace(/[^A-Za-z0-9._-]+/g, "_").slice(0, 120);
}

export interface HoldRecord {
  realm: string;
  karta: string | number;
  name: string;
  url: string;
  statusUrl: string | null;
  /** busy text published from this place; returns with it */
  status?: string;
  /** harness session dir the place was taken from (stand cwd): a restarted bridge finds its place by it (#5140) */
  cwd?: string;
  /** harness whose bridge took the place (handshake clientInfo.name): a cwd resume does not cross harnesses */
  client?: string;
  /** standing key as printed in the bridge block; resume by key is more precise than by cwd */
  key?: string;
  /** harness session that stood on the place (OpenCode plugin session id): a cwd resume returns it only to that session (#6017) */
  session?: string;
  /** released by the holder's leave: neither watchdog nor cwd/key resume raise it, only stand by name */
  left?: boolean;
  /** written at (epoch ms), rewritten also when a session leaves with a live socket (#6649); a socketless place lives six hours at the platform */
  at?: number;
  /** cases a satellite entered; written only by its pause for a plugin reload (suspend.ts) */
  cases?: { realm?: string; room: string }[];
  /** place base: the name the bridge derived this beside place from (`name.N`); the primary's own name (#6706) */
  base?: string;
}

/** Record lifetime: the idle time the platform grants a socketless place. */
export const HOLD_RECORD_MAX_AGE_MS = 6 * 60 * 60 * 1000;

/** The harness session of this bridge, named by the plugin in its resume and check methods (resume.ts). */
const H = scoped(() => ({ session: null as string | null }));
export function noteHarnessSession(id: string | undefined): void {
  if (id) H.session = id;
}
export const sessionOfBridge = (): string | null => H.session;

function onDisk(key: string): HoldRecord | null {
  try {
    return JSON.parse(readFileSync(holdFilePathFor(key), "utf8")) as HoldRecord;
  } catch {
    return null;
  }
}

/**
 * Only the bridge that chose the place knows its base; names carry dots (`glm-5.3`), so it
 * cannot be guessed (#6706). It also lives in a separate file beside the hold record, which
 * eviction and a dead token erase; the base does not age, so a new take of the place (or a
 * restarted bridge) reads it from there.
 */
const B = scoped(() => new Map<string, string>());
export function noteSeatBase(key: string, base: string): void {
  B.set(key, base);
  if (CFG.satellite) return;
  try {
    const path = baseFilePathOf(CFG.authDir, key);
    mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
    writeFileSync(path, base + "\n", { mode: 0o600 });
  } catch (e) {
    log(`seat base not written: ${(e as Error).message}`);
  }
}
const baseOnDisk = (key: string): string | null => {
  try {
    return readFileSync(baseFilePathOf(CFG.authDir, key), "utf8").trim() || null;
  } catch {
    return null;
  }
};
/**
 * Place base: remembered by this bridge, else written by whoever chose the place before
 * (hold record of any age, then the base file) and remembered; null if unknown.
 */
export function seatBaseOf(key: string): string | null {
  const known = B.get(key);
  if (known) return known;
  const base = readHoldRecord(key, true)?.base ?? baseOnDisk(key);
  if (base) B.set(key, base);
  return base ?? null;
}

/**
 * The session in the record is one named to THIS bridge process (or passed explicitly):
 * a bridge without a named session does not inherit one from disk (#6017) — except a record
 * of the same url: the seat goes on (return from disk, busyness, mark) and the session that
 * stood on it is not erased (#6702).
 * `left` persists from disk until a new hold says `left: false`.
 */
export function writeHoldRecord(
  key: string,
  rec: HoldRecord,
  paused = false,
  at = Date.now(),
): void {
  // A satellite's place lives for the run (satellite.ts); only a plugin-reload pause restores it from disk (suspend.ts).
  if (CFG.satellite && !paused) return;
  try {
    const was = onDisk(key);
    const session = H.session ?? rec.session ?? (was?.url === rec.url ? was.session : undefined);
    const left = rec.left ?? was?.left === true;
    writeFileSync(
      holdFilePathFor(key),
      JSON.stringify({
        ...rec,
        session: session ?? undefined,
        left: left || undefined,
        base: B.get(key) ?? rec.base ?? was?.base ?? baseOnDisk(key) ?? undefined,
        at,
      }) + "\n",
      { mode: 0o600 },
    );
  } catch (e) {
    log(`hold record not written: ${(e as Error).message}`);
  }
}
/**
 * Restore the record as it was before a failed resume, old timestamp included: an attempt
 * without hello does not rejuvenate the place (#6137).
 */
export function restoreHoldRecord(key: string, rec: HoldRecord): void {
  if (CFG.satellite) return;
  try {
    writeFileSync(holdFilePathFor(key), JSON.stringify(rec) + "\n", { mode: 0o600 });
  } catch (e) {
    log(`hold record not restored: ${(e as Error).message}`);
  }
}
/** Mark the place record left by the holder (leave) or clear the mark (return). */
export function markLeft(key: string, on: boolean): void {
  const r = readHoldRecord(key);
  if (r && (r.left === true) !== on) writeHoldRecord(key, { ...r, left: on });
}
/** The place record; an expired one is erased and not read, except by an `anyAge` read of its holder (holdkeep.ts). */
export function readHoldRecord(key: string, anyAge = false): HoldRecord | null {
  try {
    const r = JSON.parse(readFileSync(holdFilePathFor(key), "utf8")) as HoldRecord;
    if (!r || typeof r.url !== "string" || !r.realm || r.karta == null) return null;
    if (anyAge) return r;
    // No timestamp means unknown age: expired, as the sweep treats it.
    if (typeof r.at !== "number" || Date.now() - r.at > HOLD_RECORD_MAX_AGE_MS) {
      dropHoldRecord(key);
      return null;
    }
    return r;
  } catch {
    return null;
  }
}
/** Hold records under this name for any role; the caller judges the graph. */
export function holdRecordsNamed(name: string): HoldRecord[] {
  const dir = dirname(holdFilePathFor("_"));
  try {
    return readdirSync(dir)
      .filter((f) => f.endsWith(".hold"))
      .map((f) => {
        try {
          return JSON.parse(readFileSync(join(dir, f), "utf8")) as HoldRecord;
        } catch {
          return null;
        }
      })
      .filter((r): r is HoldRecord => !!r && r.name === name && r.karta != null);
  } catch {
    return [];
  }
}
/** Erase the record only if it is this holder's (same address); an evicting holder's record stays. */
export function dropOwnHoldRecord(key: string, url: string | null): void {
  const r = readHoldRecord(key, true);
  if (!r || !url || r.url === url) dropHoldRecord(key);
}
export function dropHoldRecord(key: string): void {
  try {
    unlinkSync(holdFilePathFor(key));
  } catch {}
}
