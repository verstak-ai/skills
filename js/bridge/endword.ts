// The agent's end on the harness's word (graph @nks/nks-dev, nodes #7493, #9232): its seats go
// at once, by the same stop as after the death window — its own socket's token (deadstop.ts),
// so a bridge of another machine that took the name while the end awaited its exits keeps its
// seat. Only an api without the stop, or a run whose main seat is not among its own, revokes by
// name (caseexit.ts).
import { type SeatKey } from "../shared/seat.ts";
import { revokeOwnPlaces, type Revokes } from "./caseexit.ts";
import { dropConfirmed, seatKeyOf } from "./deadseat.ts";
import { settleMoved, settleStopped, stopBySocket } from "./deadstop.ts";
import { normKarta } from "./names.ts";
import { canonRealm } from "./realms.ts";
import { log } from "./streams.ts";
import { type Standing } from "./transport.ts";

const keyOf = (s: Standing): SeatKey => ({
  realm: canonRealm(s.realm),
  karta: normKarta(s.karta),
  name: s.name ?? "",
});

/**
 * Ends the run's own seats, main first; `socket` — the main seat's socket address, or null.
 * The answer — the seats as the plugin's `end` reports them, and those left for the death
 * window, which repeats the end.
 */
export async function endOnWord(
  places: Standing[],
  socket: string | null,
  ids: Map<string, string | null>,
): Promise<{ end: Revokes; left: Standing[] }> {
  const none: Revokes = { failed: [], revoked: [], probably: [] };
  if (!places.length) return { end: none, left: [] };
  const [main] = places;
  if (socket) {
    const { how, why, ended } = await stopBySocket(socket);
    if (how === "stopped") {
      log(`the agent's session ended on the harness's word — its seats end by its socket's token`);
      const done = settleStopped(places, socket, ids, ended, why);
      return { end: { ...none, revoked: done.map(keyOf) }, left: [] };
    }
    if (how === "moved") {
      settleMoved(places, main, socket);
      return { end: none, left: [] };
    }
    if (how === "unknown") {
      log(
        `${seatKeyOf(main)}: the stop by its token did not answer: ${why} — the window repeats it`,
      );
      return { end: { ...none, failed: places.map((s) => s.name ?? "") }, left: places };
    }
    log(`${seatKeyOf(main)}: no stop by token on this api (${why}) — a revoke by name`);
  }
  const end = await revokeOwnPlaces(places);
  return { end, left: dropConfirmed(places, end.revoked) };
}
