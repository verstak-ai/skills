// An OpenCode session's hearing outlives idleness, a plugin restart and a directory
// eviction (graph @nks/nks-dev, node #5140). Three moves of the "tools" half:
//   • the seat's return — a new instance's bridge finds ITS holding record by the resume
//     method {key?, cwd, session}: the key when known, else the session's directory, and then
//     only a record this same session stood on (#6017); the backlog comes as a wake-up batch;
//   • the loss marker (marker.ts) — a plugin stopped with holding bridges writes whom it held;
//     the next instance of the location tells the holding session and returns the seat without
//     its move — a standing session waiting for frames calls no tools (#6137);
//   • the hearing watchdog — every N minutes the sessions that stood ask the bridge (the check
//     method): a dead bridge is raised and returns the seat, a deaf one reopens its socket; a
//     bridge holding no seat leaves the watch and the reaper counts its idleness again.
import { envName, method, OPENCODE_KEEP } from "../delivery/index.ts";
import type { Bridge } from "../shared/bridge-client.ts";
import { words } from "../shared/lang.ts";
import { sleep } from "./bridge-io.ts";
import type { LostEntry } from "./records.ts";
import type { Say } from "./tools.ts";

/** The watchdog's tact; the variable is a probe seam. Invariant: shorter than the reaper's idle (tools.ts). */
export const WATCH_MS = Number(process.env[envName("BRIDGE_WATCH_MS")] || 5 * 60_000);
/** How long a return waits for the previous bridge's socket to go (a thin bridge's bye — up to 5 s); for probes. */
const PATIENCE_MS = Number(process.env[envName("RESUME_PATIENCE_MS")] || 10_000);
const STEP_MS = 500;

/** A return's outcome: the seat is taken; a live foreign bridge holds its socket; did not return otherwise. */
export type Resumed = "held" | "elsewhere" | "none";

export interface KeptSlot {
  bridge: Bridge;
  session: string | null;
  /** The bridge holds a standing — such a bridge is not released for idleness. */
  holding: boolean;
  /** The session stood at least once — the hearing watchdog watches it. */
  stood: boolean;
  /** The session's directory — the return's key when the standing's key is unknown. */
  dir: string | null;
  /** The key of the standing the bridge held (from `held` or a return) — the record's exact address. */
  key: string | null;
  /** A return in flight: a tool call waits for it so as not to take the seat twice. */
  resume: Promise<unknown> | null;
  /** A child session's bridge (its own standing, #5154): its record is no hint for the root. */
  child?: boolean;
  /** The root's seat the child stood as a satellite of — the new instance's bridge stands the same (#6625). */
  satelliteOf?: { realm: string; karta: string; name: string } | null;
  /** The child's errand case — a lead's outcome (leads.ts) survives a reload. */
  room?: string | null;
  /** The child's first turn was already told to the parent — a new instance does not repeat it. */
  noted?: boolean;
  /** The child's last text — the "ended" outcome survives a reload. */
  last?: string;
}

/**
 * A word to the agent about a seat the bridge returned itself. The session's first call
 * waits for the return and goes before the word: the word asks to check that write's author.
 */
export function resumedWord(key: string, own = false): string {
  // Other seats of the same directory are not named: their key would call the session to a foreign seat.
  // A seat the bridge proved own is not suspected foreign.
  return own ? words(OPENCODE_KEEP).resumedOwn(key) : words(OPENCODE_KEEP).resumed(key);
}

/** A word to a session whose seat is held by another bridge: the return failed, and how to get it back. */
const elsewhereWord = (keys: string[]): string => words(OPENCODE_KEEP).elsewhere(keys.join(", "));

export interface KeeperDoors<S extends KeptSlot> {
  say: Say;
  /** A word into the session as the agent's move, not a log line (#5366); child — only its own child session. */
  tell: (root: string, text: string, child?: boolean) => void;
  /** A loud word about lost hearing into the session (#5140). */
  lost: (root: string, text: string) => void;
  /** The root session's slot: live or raised again; touch=false — do not refresh idleness (a watch is not a call). */
  slotFor: (root: string, touch: boolean) => Promise<S>;
  ready: (slot: S) => Promise<void>;
  directoryOf: (root: string) => Promise<string | null>;
  /** The session still exists and its tools go through this instance. */
  exists: (root: string) => Promise<boolean>;
}

export interface Keeper<S extends KeptSlot> {
  /** Loss marker records by the session that held them: a key is a more exact return than a directory. */
  hint(entries: LostEntry[]): void;
  /**
   * Seats from the loss marker — back at once, without the agent's move (#6137). The word
   * about the loss and the outcome go into the holding session, each only about its own seats.
   * Child seats return by their own bridge by key; a session that is gone gets no bridge.
   */
  resumeLost(entries: LostEntry[], wordFor: (session: string) => string | null): Promise<void>;
  /** A new session got a bridge: return its seat from disk if the previous instance held it. */
  resume(slot: S, root: string, quiet?: boolean, patience?: number): Promise<Resumed>;
  /** A successful stand/connect/register — the session stands: not reaped, watched. */
  stood(slot: S): void;
  /** The session was deleted — the watchdog stops watching it. */
  forget(root: string): void;
  stop(): void;
}

/* eslint-disable @typescript-eslint/no-explicit-any -- bridge answers come without a schema */

export function createKeeper<S extends KeptSlot>(doors: KeeperDoors<S>): Keeper<S> {
  const W = words(OPENCODE_KEEP);
  const roots = new Set<string>(); // root sessions that stood
  // Session → key from the loss marker, keyed by session: another session of the same directory inherits no seat (#6017).
  const hints = new Map<string, string>();
  // Session → its marker record until its first return passed: that return's outcome is a word to it (#6137).
  const marked = new Map<string, LostEntry>();
  // Session → a marker seat whose return failed and waits for the watchdog's retry.
  const retrying = new Map<string, string>();
  let stopped = false;

  /** A marker seat did not return: a word into that session, and the session goes under the watch. */
  function notBack(root: string, mark: LostEntry, why: string): void {
    const place = mark.key ?? mark.dir ?? root;
    roots.add(root);
    retrying.set(root, place);
    doors.tell(root, W.notBack(place, why));
  }

  function selector(slot: S): { key?: string; cwd?: string; session?: string } {
    const session = slot.session ? { session: slot.session } : {};
    // A child bridge returns only by key: by directory it would raise the root's record.
    if (slot.child) return slot.key ? { key: slot.key, ...session } : session;
    const key = slot.key ?? (slot.session ? hints.get(slot.session) : undefined);
    return { ...(key ? { key } : {}), ...(slot.dir ? { cwd: slot.dir } : {}), ...session };
  }

  /**
   * A return with patience: a live bridge still holds the seat's socket (reload, move), and the
   * return repeats until its socket goes or the term runs out; the outcome is said on the last try.
   */
  async function resume(
    slot: S,
    root: string,
    quiet = false,
    patience = PATIENCE_MS,
  ): Promise<Resumed> {
    const until = Date.now() + patience;
    for (;;) {
      const final = Date.now() + STEP_MS > until;
      const r = await once(slot, root, quiet, final);
      if (r !== "elsewhere" || final || stopped) return r;
      await sleep(STEP_MS);
    }
  }

  async function once(slot: S, root: string, quiet: boolean, final: boolean): Promise<Resumed> {
    const mark = slot.child ? undefined : marked.get(root);
    try {
      await doors.ready(slot);
      slot.dir ??= mark?.dir ?? (await doors.directoryOf(root));
      if (stopped) return "none";
      if ((!slot.dir && !slot.key) || (slot.child && !slot.key)) {
        marked.delete(root);
        if (mark) notBack(root, mark, W.noKeyNoDir());
        return "none";
      }
      const r: any = await slot.bridge.request(method("resume"), selector(slot), {
        timeoutMs: 30_000,
      });
      const elsewhere = Array.isArray(r?.elsewhere) && r.elsewhere.length ? r.elsewhere : null;
      if (!r?.resumed && elsewhere && !final) return "elsewhere"; // wait silently for its socket to go
      marked.delete(root);
      if (!r?.resumed) {
        if (mark) notBack(root, mark, typeof r?.word === "string" ? r.word : W.noAnswer());
        // Another session's live bridge holds this session's seat: say so (#6626); a paused child — silently.
        else if (elsewhere) {
          if (!quiet) doors.tell(root, elsewhereWord(elsewhere), slot.child);
        }
        // An older build's seat without a session is not returned by directory, but named (#6017).
        else if (Array.isArray(r?.legacy) && r.legacy.length && typeof r.word === "string")
          doors.tell(root, W.legacy(r.word), slot.child);
        return elsewhere ? "elsewhere" : "none";
      }
      slot.holding = true;
      slot.stood = true;
      if (typeof r.key === "string") slot.key = r.key;
      roots.add(root);
      doors.say(W.sessionResumed(root, r.word), "info");
      // The name was taken from the directory's record, which does not tell standings of one role apart (#5366);
      // a child whose seat returned by its own key after a reload — silently: it waits (#6625).
      if (typeof r.key === "string" && !quiet)
        doors.tell(root, resumedWord(r.key, r.own === true), slot.child);
      return "held";
    } catch (e) {
      marked.delete(root);
      doors.say(W.resumeFailed(root, (e as Error).message), "warning");
      if (mark && !stopped) notBack(root, mark, (e as Error).message);
      return "none";
    }
  }

  async function check(root: string): Promise<void> {
    const slot = await doors.slotFor(root, false); // a dead bridge is replaced here; idleness is not refreshed
    if (slot.resume) await slot.resume;
    if (!slot.dir) slot.dir = await doors.directoryOf(root);
    await doors.ready(slot);
    const r: any = await slot.bridge.request(method("check"), selector(slot), {
      timeoutMs: 30_000,
    });
    if (typeof r?.key === "string") slot.key = r.key;
    if (r?.holding) slot.holding = true;
    else if (r?.holding === false) {
      // The bridge leads no seat and has nothing to return: the watch ends, the reaper counts again.
      slot.holding = false;
      roots.delete(root);
      const place = retrying.get(root);
      if (place && !r?.resumed)
        doors.tell(root, W.retryFailed(place, r?.word ?? W.noWhy()), slot.child);
    }
    retrying.delete(root);
    if (r?.resumed) {
      doors.say(W.watchResumed(root, r.word), "info");
      // The same return without the agent's move (#5366).
      if (typeof r.key === "string")
        doors.tell(root, resumedWord(r.key, r.own === true), slot.child);
    } else if (r?.reopened) doors.say(W.watchReopened(root, r.word), "warning");
    else if (r?.stuck) doors.say(r.word, "error"); // the bridge sends the word into the session itself (kind=lost), once
  }

  const timer = setInterval(() => {
    if (stopped) return;
    for (const root of roots)
      void check(root).catch((e: Error) => doors.say(W.watchFailed(root, e.message), "warning"));
  }, WATCH_MS);
  timer.unref?.();

  return {
    hint(entries) {
      // A child's record is no hint for the root — the child returns by its own bridge by key.
      for (const e of entries) {
        if (!e.session || e.child) continue;
        if (e.key) hints.set(e.session, e.key);
        marked.set(e.session, e);
      }
    },
    async resumeLost(entries, wordFor) {
      const seen = new Set<string>();
      for (const e of entries) {
        if (stopped) break;
        if (e.child || !e.session || seen.has(e.session)) continue;
        seen.add(e.session);
        if (!(await doors.exists(e.session))) continue;
        const word = wordFor(e.session); // its own seats only
        if (word) doors.lost(e.session, word);
        await doors.slotFor(e.session, false); // a new slot calls resume itself; a live one already returned
      }
    },
    resume,
    stood(slot) {
      slot.holding = true;
      slot.stood = true;
      if (slot.session) roots.add(slot.session);
    },
    forget(root) {
      roots.delete(root);
      retrying.delete(root);
    },
    stop() {
      stopped = true;
      clearInterval(timer);
    },
  };
}

/* eslint-enable @typescript-eslint/no-explicit-any */
