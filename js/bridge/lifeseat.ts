// The seat a life check warned (case #1046; the frame — shared/seen.ts isLifeCheck): the frame
// names it by to_standing; one that carries only to_standing_id gets the name of the seat of this
// bridge with that id, so every reader (shared/frame-text.ts, the OpenCode plugin) names the
// same seat. An id of no seat here leaves the frame as it came: the text says the platform did
// not name it.
import { isLifeCheck } from "../shared/seen.ts";
import { type Frame } from "./holdstate.ts";
import { extraPlaces, type Place, routeFrame } from "./places.ts";

export function nameWarnedSeat(frame: Frame | null, primary: Place): void {
  if (!frame || !isLifeCheck(frame)) return;
  if (typeof frame.to_standing === "string" && frame.to_standing) return;
  const id = typeof frame.to_standing_id === "string" ? frame.to_standing_id : "";
  const seat = id ? [primary, ...extraPlaces()].find((p) => p.door.standingId === id) : undefined;
  if (seat?.standing.name) frame.to_standing = seat.standing.name;
}

/** routeFrame (places.ts), a life check named by its seat on the way (hold.ts). */
export function routeNamed(frame: Frame | null, primary: Place): ReturnType<typeof routeFrame> {
  nameWarnedSeat(frame, primary);
  return routeFrame(frame, primary);
}
