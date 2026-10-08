// Status address of the held channel for busyness (status.ts, engine.ts, session.ts).
import { H } from "./holdstate.ts";
import { extraIn } from "./places.ts";
import { state } from "./transport.ts";

/**
 * The channel's status address, key, id and seat address (@handle:name as the board has
 * it; derived — built by the bridge, hello did not name it; neither — null) of this graph
 * (without a graph — the main one), with the seat name — for busyness.
 */
export function statusAddress(realm?: string): {
  url: string;
  key: string;
  standingId: string | null;
  place: string | null;
  derived: boolean;
  name: string;
} | null {
  if (!H.currentStatusUrl || !H.currentKey) return null;
  const extra = realm ? extraIn(realm) : undefined;
  const d = extra?.door ?? H.door;
  return {
    url: H.currentStatusUrl,
    key: d?.key ?? H.currentKey,
    standingId: d?.standingId ?? null,
    place: d?.address ?? null,
    derived: d?.addressDerived ?? false,
    name: (extra?.standing ?? state.standing)?.name ?? "",
  };
}
