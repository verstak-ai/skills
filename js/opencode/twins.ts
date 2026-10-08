// Twins of a directory (graph @nks/nks-dev: #5048, case №147). OpenCode 2.0.24 keeps a plugin
// instance per spelling of a directory (/tmp/A and /private/tmp/A); a session's hooks and tools
// go only to its spelling's instance, and that one leads its seat. Unloaded with a seat, it lays
// a marker, and a live instance of another spelling wakes it: ctx.session.move of the session
// into its own directory is the only plugin call found that raises an unloaded spelling.
// Cost (observed on 2.0.24): no model turn, but location-switched lands in the session's history
// and the next turn tells the model the working directory changed — so wake only if the
// spelling did not come up itself and the marker still lies. The registry is on globalThis:
// shared by the process's instances; a child moved to another directory finds its root by it.
/* eslint-disable @typescript-eslint/no-explicit-any -- an SDK call without a type in @opencode/plugin 2.0.4 */
import { envName, GLOBAL_PREFIX, OPENCODE_KEEP } from "../delivery/index.ts";
import { canonDir } from "../shared/canon.ts";
import { words } from "../shared/lang.ts";
import { authDir } from "./bridge-io.ts";
import { markerWaits } from "./marker.ts";
import type { Context } from "./plugin.ts";
import type { Home, LostEntry } from "./records.ts";
import type { Slot } from "./slot.ts";

/** How long to wait for the raised instance to take the marker. */
const WAKE_MS = Number(process.env[envName("WAKE_MS")]) || 15_000;
/** A pause before waking: a plugin reload stops the twins right after — nothing to wake. */
const PAUSE_MS = Math.min(1_000, WAKE_MS / 5);

interface Twin {
  home: Home | null;
  wake(home: Home, entries: LostEntry[]): void;
  /** A root's slot holding a seat in this instance; none — null. */
  holds(root: string): Slot | null;
  /** Take this location's marker now (adopt.ts). */
  adopt(): void;
}

const registry = (): Set<Twin> =>
  ((globalThis as any)[`${GLOBAL_PREFIX}Twins`] ??= new Set<Twin>());
/** Satellites of children moved to another folder whose marker has not landed yet (children.ts, #6695). */
const handing = (): Map<string, Promise<unknown>> =>
  ((globalThis as any)[`${GLOBAL_PREFIX}Handing`] ??= new Map<string, Promise<unknown>>());

/** A session's satellite is being handed to the new folder's instance — its calls there wait for the marker. */
export function handOver(session: string, p: Promise<unknown>): void {
  handing().set(session, p);
  void p.finally(() => handing().get(session) === p && handing().delete(session));
}
export const handedOver = (session: string): Promise<unknown> | undefined => handing().get(session);

/** A marker landed tagged to: a live instance of that spelling takes it now. */
export function adoptIn(to: Home): void {
  for (const t of registry()) if (t.home && sameSpelling(t.home, to)) t.adopt();
}

/** A slot holding the root's seat in any instance of this process (moves.ts, #6695). */
export function heldInProcess(root: string): Slot | null {
  for (const t of registry()) {
    const s = t.holds(root);
    if (s) return s;
  }
  return null;
}

const folderOf = (h: Home): string => `${canonDir(h.directory)}\0${h.workspace ?? ""}`;
const sameSpelling = (a: Home, b: Home): boolean =>
  a.directory === b.directory && (a.workspace ?? null) === (b.workspace ?? null);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface TwinDoors {
  say(text: string, level: "info" | "warning" | "error"): void;
  /** A loud word into the session (channel.ts, kind=lost). */
  lost(session: string, text: string): void;
  /** A root's slot holding a seat in this instance (tools.ts). */
  holds(root: string): Slot | null;
  /** Take this location's marker now (adopt.ts). */
  adopt(): void;
}

export function createTwins(ctx: Context, home: Home | null, d: TwinDoors) {
  const W = words(OPENCODE_KEEP);
  let gone = false;
  const me: Twin = {
    home,
    wake: (h, e) => void wake(h, e),
    holds: (r) => d.holds(r),
    adopt: () => d.adopt(),
  };
  registry().add(me);

  /** Raise the instance of spelling h, unloaded with seats entries. */
  async function wake(h: Home, entries: LostEntry[]): Promise<void> {
    const roots = entries.filter((e) => !e.child && !e.moved && e.session);
    await sleep(PAUSE_MS);
    if (gone || !roots.length) return;
    // The spelling already came up itself or the marker is already taken — do not wake.
    const up = [...registry()].some((t) => t.home && sameSpelling(t.home, h));
    if (up || !markerWaits(authDir(), h)) return;
    let why = "";
    for (const e of roots) {
      try {
        // Into its own directory: OpenCode raises the destination; no turn, location-switched in the history.
        const args = { sessionID: e.session, directory: h.directory, delivery: "queue" };
        await (ctx.session as any).move(args);
        why = "";
        break;
      } catch (err) {
        why = (err as Error).message;
      }
    }
    if (!why) {
      await sleep(WAKE_MS);
      if (!markerWaits(authDir(), h)) {
        d.say(W.twinUp(h.directory), "info");
        return;
      }
      why = W.markerUntaken(Math.round(WAKE_MS / 1000));
    }
    if (gone) return;
    const named = roots.map((e) => e.key ?? e.session).join(", ");
    d.say(W.unloaded(h.directory, named, why), "error");
    for (const e of roots)
      d.lost(e.session as string, W.seatLost(e.key ?? W.thisSession(), h.directory, why));
  }

  return {
    /** The instance stops — out of the registry, nobody to wake it and no need. */
    leave(): void {
      gone = true;
      registry().delete(me);
    },
    /** A stop with seats entries (the marker landed): a live twin wakes this spelling. */
    left(entries: LostEntry[]): void {
      if (!home || !entries.length) return;
      const live = [...registry()].filter((t) => t.home);
      // The same spelling is alive (a plugin reload) — the marker is its own, nothing to wake.
      if (live.some((t) => sameSpelling(t.home as Home, home))) return;
      live.find((t) => folderOf(t.home as Home) === folderOf(home))?.wake(home, entries);
    },
  };
}

/* eslint-enable @typescript-eslint/no-explicit-any */
