// A session and the plugin instance's location (graph @nks/nks-dev: #6550, rule 3; #6626).
// OpenCode loads the plugin once per location, and a session's tools go through its location's
// instance. A session moved away (session.moved, data.location) — the previous instance lays a
// marker tagged with the NEW location (marker.ts) and puts the root's bridge down, the holding
// record intact. The new folder's instance takes the marker at setup, a live one on the event
// after the previous lays it. The seat returns patiently (keep.ts); satellite children travel by
// marker, and their writes in the new folder are refused (adopt.ts). A child moved alone
// (#6695): a satellite goes as itself (handoff.ts); one not standing — the new folder's instance
// finds the root in the parent's folder instance (farRoot) and stands a satellite of its seat.
/* eslint-disable @typescript-eslint/no-explicit-any -- SDK answers without a schema */
import { envName, OPENCODE_KEEP } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import { authDir } from "./bridge-io.ts";
import { homeOf, sessionDirectory } from "./host.ts";
import { writeLostMarker } from "./marker.ts";
import type { Context } from "./plugin.ts";
import type { Home } from "./records.ts";
import type { Slot } from "./slot.ts";
import type { Say } from "./tools.ts";
import { heldInProcess } from "./twins.ts";

/** How long a live new folder's instance waits for the previous one's move marker. */
const ADOPT_MS = Number(process.env[envName("MOVE_ADOPT_MS")]) || 1_000;

export interface MoveDoors {
  say: Say;
  slots: Map<string, Slot>;
  rootOf(session: string): Promise<string>;
  /** The session's bridge goes down with its socket's standing; the root's holding record stays. */
  forget(session: string): void;
  /** The root's slot: a new one returns the seat itself (keep.ts). */
  slotFor(session: string, touch: boolean): Promise<Slot>;
  /** This location's marker — take it and return its seats (adopt.ts). */
  adopt(): void;
  /** A moved root's child ends here (leads.ts). */
  away(child: string): Promise<void>;
}

export function createMoves(ctx: Context) {
  const W = words(OPENCODE_KEEP);
  const home = homeOf(ctx);
  const directoryOf = (sessionID: string) => sessionDirectory(ctx, sessionID);
  const exists = (sessionID: string): Promise<boolean> =>
    Promise.resolve()
      .then(() => ctx.session.get({ sessionID } as any))
      .then(
        () => true,
        () => false,
      );
  /** The session is readable and in this instance's location: this instance returns its seat. */
  const ours = async (sessionID: string): Promise<boolean> => {
    if (!(await exists(sessionID))) return false;
    const dir = home ? await directoryOf(sessionID) : null;
    return !home || !dir || dir === home.directory;
  };
  const left = new Set<string>(); // roots moved from here to another folder
  /** The session moved to location to. */
  function moved(d: MoveDoors, s: string, to: Home | null): void {
    if (!home || !to?.directory || d.slots.get(s)?.child) return;
    // The spelling as it came: /tmp/A ↔ /private/tmp/A is a move between instances (#5048).
    if (to.directory !== home.directory) {
      const root = d.slots.get(s);
      if (!root) return;
      const of = root.place?.name;
      const kids = [...d.slots.values()].filter((k) => k.child && of && k.satelliteOf?.name === of);
      const away = [{ ...root, dir: to.directory }, ...kids].map((x) => ({ ...x, moved: true }));
      writeLostMarker(authDir(), away, to);
      d.say(W.movedAway(s, to.directory), "info");
      // Children do not move with the parent (OpenCode, observed): the move ends their errand here.
      left.add(s);
      for (const k of kids) if (k.session) void d.away(k.session);
      return d.forget(s);
    }
    left.delete(s);
    void d.rootOf(s).then((root) => (root === s ? d.slotFor(s, false) : null));
    setTimeout(() => d.adopt(), ADOPT_MS).unref?.();
  }
  /**
   * A bridge word into the session; "seat taken" is not for a session moved away: its own new
   * instance's bridge took it, and the word would be foreign.
   */
  function relay(on: (s: string | null, p: any, child?: boolean) => void, say: Say) {
    return (s: string | null, params: any, child: boolean): void => {
      if (params?.data?.kind !== "evicted" || !home || !s || child) return on(s, params, child);
      void ours(s).then((mine) => (mine ? on(s, params, child) : say(W.takenFromNew(s), "info")));
    };
  }
  /** A child's call whose root moved away: the root's bridge is not raised here (#6626), a refusal aloud. */
  function guard(root: string, session: string): void {
    if (root === session || !left.has(root)) return;
    throw new Error(W.parentMoved());
  }
  /**
   * The root of a child moved alone into this directory (#6695): the parent's seat is held by
   * its directory's instance, found in this process by the shared registry (twins.ts). Not found
   * and the root elsewhere — "foreign": the root's bridge does not return its seat here (#6626).
   */
  async function farRoot(root: string): Promise<Slot | "foreign" | null> {
    const held = heldInProcess(root);
    if (held) return held;
    const dir = home ? await directoryOf(root) : null;
    return home && dir && dir !== home.directory ? "foreign" : null;
  }
  /** A refusal to stand as a satellite of a root in another directory the process does not hold — for now. */
  const farRefusal = async (root: string | null): Promise<string | null> =>
    root && (await farRoot(root)) === "foreign" ? W.farRefusal() : null;
  return { home, directoryOf, exists, ours, moved, relay, guard, farRoot, farRefusal };
}

/* eslint-enable @typescript-eslint/no-explicit-any */
