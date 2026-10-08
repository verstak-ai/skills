// The launch line with a case in OpenCode (parsing and entry — shared/launch.ts): the child
// session stands as a satellite of the root's seat in the named role (satellite.ts) — or on its
// own seat when the root holds none. The "from <seat>" tail is not needed here: the plugin
// knows the parent.
import { enterCase, parseLaunch } from "../shared/launch.ts";
import { type Place } from "./satellite.ts";

export interface LaunchDoors<S extends { place?: Place | null }> {
  rootOf(sessionID: string): Promise<string>;
  /** The child session's bridge for its own standing — a satellite of the root's seat, if any. */
  childSlot(sessionID: string, root: string): S;
  /** A tool call by the slot's bridge on the session's behalf; a refusal is a throw with its words. */
  call(slot: S, name: string, args: Record<string, unknown>, sessionID: string): Promise<string>;
}

export interface Launcher {
  /** A session's first prompt: a word into the session, or null — not this case. */
  launch(sessionID: string, text: string): Promise<string | null>;
  forget(sessionID: string): void;
}

export function createLauncher<S extends { place?: Place | null }>(d: LaunchDoors<S>): Launcher {
  /** Sessions whose first prompt has passed — the launch line runs only in the first. */
  const prompted = new Set<string>();
  return {
    forget: (id) => void prompted.delete(id),
    async launch(sessionID, text) {
      if (prompted.has(sessionID)) return null;
      prompted.add(sessionID);
      const l = parseLaunch(text);
      if (!l) return null;
      const root = await d.rootOf(sessionID);
      if (root === sessionID) return null; // a root enters the case by the door skill
      // The child's bridge comes at the first call: an unknown root seat makes childSlot throw
      // the same refusal as the child's stand (#6550 item 2), and the launch line says it.
      let slot: S | null = null;
      // satellite_of is set by the call itself (asSatellite in tools.ts) from the root's seat.
      return enterCase(
        l,
        (name, args) => d.call((slot ??= d.childSlot(sessionID, root)), name, args, sessionID),
        null,
        () => slot?.place?.name,
      );
    },
  };
}
