// The server's life check of a seat (graph @nks/nks-dev, nodes #11362, #11359): a control frame
// {type:"life_check", standing_id, ref} on the seat's socket or the dispatcher (with channel_id).
// It is never a turn: the bridge answers at once {type:"life", standing_id, ref, state} —
// present: the harness session holding that seat is this bridge's and lives; gone: the server's
// ended[] of this session's end named the seat; unknown: the seat is not this bridge's, its
// session is paused or handed over, or its run ended and the server spared the seat (another
// live channel carries it — not in ended[]).
// The bridge declares it answers by "life" in its register attrs.caps (placefields.ts).
import { doors } from "./hold.ts";
import { type Frame, H, handoverReason, whenLifeChecked } from "./holdstate.ts";
import { seatEnded } from "./muxlifecheck.ts";
import { suspended } from "./pauserecord.ts";
import { runEnded } from "./runend.ts";
import { log } from "./streams.ts";

export type Life = "present" | "gone" | "unknown";

/** The seat `id`'s life, by this bridge's own session. */
export function lifeOf(id: string): Life {
  if (!id || !doors().some((d) => d.standingId === id)) return "unknown";
  if (seatEnded(id)) return "gone"; // the server's ended[] named it (muxlifecheck.ts)
  // The run ended but the server did not name this seat: another live channel may carry it.
  if (runEnded()) return "unknown";
  if (suspended() || handoverReason() || !H.holder?.alive) return "unknown";
  return "present";
}

function answer(frame: Frame): void {
  const standing_id = typeof frame.standing_id === "string" ? frame.standing_id : "";
  // The ref is the server's string (a UUID's text), echoed as is; a malformed one is the server's.
  const ref = typeof frame.ref === "string" ? frame.ref : null;
  if (ref === null) return log(`life_check without a string ref — not answered`);
  const state = lifeOf(standing_id);
  const sent = H.holder?.send(JSON.stringify({ type: "life", standing_id, ref, state })) ?? false;
  log(`life_check ${ref} of ${standing_id || "?"}: ${state}${sent ? "" : " — not sent"}`);
}

whenLifeChecked(answer);
