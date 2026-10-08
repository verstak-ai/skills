// Handing over the satellite of a child moved alone to another folder (graph @nks/nks-dev, node #6695).
// Its satellite goes to that folder's instance, as a root on a move and as on a reload
// (children.ts): the bridge pauses, a marker with the new folder's tag (key, root seat, case,
// turn), the bridge here goes down. The lead does not end — no "ended", no seat release: the
// new folder's instance returns the seat by key as the same satellite.
import { method } from "../delivery/index.ts";
import { authDir } from "./bridge-io.ts";
import { PAUSE_MS } from "./children.ts";
import type { Leads } from "./leaddoors.ts";
import { writeLostMarker } from "./marker.ts";
import type { Home } from "./records.ts";
import type { Slot } from "./slot.ts";
import { adoptIn, handOver } from "./twins.ts";

export interface HandoffDoors {
  slots: Map<string, Slot>;
  leads: Leads;
  /** The session's bridge goes down here; the seat is not released (the child moved to another folder). */
  forget(session: string): void;
}

/** A satellite child moved from home to to — hand it over; not this case — false. */
export const createHandoff =
  (d: HandoffDoors) =>
  (session: string, to: Home | null, home: Home | null): boolean => {
    const s = d.slots.get(session);
    if (!s?.child || !s.satelliteOf || !s.holding) return false;
    if (!home || !to?.directory || to.directory === home.directory) return false;
    const was = d.leads.handoff(session);
    [s.room, s.noted, s.last] = [was.room, was.noted, was.last];
    // The child's calls in the new folder wait for the marker (children.ts, settled), not stand a second satellite.
    handOver(
      session,
      s.bridge
        .request(method("suspend"), {}, { timeoutMs: PAUSE_MS, service: true })
        .catch(() => {})
        .then(() => {
          writeLostMarker(authDir(), [s], to);
          d.forget(session);
          adoptIn(to); // a live instance of the new folder takes the marker at once (twins.ts)
        }),
    );
    return true;
  };
