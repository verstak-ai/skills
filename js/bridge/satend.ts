// A satellite's end (graph @nks/nks-dev, nodes #11362, #6593): reported by the one end call by its
// socket's token (endreport.ts); the seats its ended[] names are ended, the rest are another
// holder's and stay. The revoke by name is only the one fallback on an api without the route (404
// with no rule, 405); a refusal (403, 422), a token not current or no answer revoke nothing.
import { type SeatKey } from "../shared/seat.ts";
import { type Revokes, revokeSatellitePlaces } from "./caseexit.ts";
import { type EndEvent, reportEnd } from "./endreport.ts";
import { standingIdIn } from "./hold.ts";
import { normKarta } from "./names.ts";
import { canonRealm } from "./realms.ts";
import { log } from "./streams.ts";
import { type Standing } from "./transport.ts";

const keyOf = (s: Standing): SeatKey => ({
  realm: canonRealm(s.realm),
  karta: normKarta(s.karta),
  name: s.name ?? "",
});

/** `socket` — the satellite's own socket address while it held one; `ids` — seat ids by name. */
export async function endSatellite(
  places: Standing[],
  socket: string | null,
  event: EndEvent,
  ids: Map<Standing, string | null> = new Map(places.map((s) => [s, standingIdIn(s.realm)])),
): Promise<Revokes> {
  const none: Revokes = { failed: [], revoked: [], probably: [] };
  if (!places.length) return none;
  if (!socket) return revokeSatellitePlaces(places);
  // The one fallback — an api without the route (404 with no rule, 405): the revoke by name.
  let fellBack = false;
  const absent = async () => {
    fellBack = true;
    return { how: "absent" as const, why: "no end-event route", ended: [] };
  };
  const r = await reportEnd(socket, event, null, absent);
  if (fellBack) return revokeSatellitePlaces(places);
  if (r.how === "moved") {
    log(`the satellite's token is not current — another holder took it or it ended; not revoked`);
    return none;
  }
  // Refused (403, 422) or no answer: nothing by name — the server's word stands, the seat lapses
  // by the channel's term.
  if (r.how !== "stopped") {
    log(`the satellite's end event: ${r.how} (${r.why}) — no revoke by name`);
    return { ...none, failed: places.map((s) => s.name ?? "") };
  }
  // A seat its ended[] does not name is another holder's now: left alone. A seat with no id
  // known is the one an unclaimed ended id names — when it is the only such seat (deadstop.ts).
  const idOf = (s: Standing): string | null => ids.get(s) ?? null;
  const unclaimed = r.ended.filter((id) => !places.some((s) => idOf(s) === id));
  const unnamed = places.filter((s) => !idOf(s));
  const done = places.filter((s) => {
    const id = idOf(s);
    return id ? r.ended.includes(id) : unnamed.length === 1 && unclaimed.length > 0;
  });
  for (const s of places)
    log(
      done.includes(s)
        ? `${s.name} ended by the end event (${event}) — the server's word`
        : `${s.name}: not among the end event's ended seats — left alone, not revoked`,
    );
  return { ...none, revoked: done.map(keyOf) };
}
