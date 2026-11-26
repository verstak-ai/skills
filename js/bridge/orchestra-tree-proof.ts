// Whether a run's client is over, for its tree's cleanup (#7517, #9256): the proof as the row
// says it now, or the one a cleanup kept apart for this very run (#11189) — a kept tree's
// reason overwrites `why`, and a later look must still see the client's end.
import { REAPED_OVER } from "./orchestra-reap.ts";
import { type Run, runIdentity } from "./orchestra-runs.ts";

/** The client is over: the stop said stopped, or the seat was already over after the exact
 * terminal exited (#9256). A run that slept (#10995) had settled its seat at the exit that
 * armed the sleep — the sleep's own end needs no fresh proof; the seat's own farewell
 * (dormant_seat_left, #4929) is as final; so is the daemon's observed close of a launch that
 * never sat or of a row already ended (#11099). */
const provenNow = (r: Run): boolean =>
  r.stop_outcome === "stopped" ||
  r.reaped === REAPED_OVER ||
  r.why === "seat_gone_after_exit" ||
  r.why === "dormant_seat_left" ||
  (r.why === "dormant_share_claimed" && !!r.dsh?.exit) ||
  (!!r.dsh?.exit && !r.standing_id) ||
  (!!r.dormant && !!r.dsh?.exit);

/** Proven now, or proven before for this very run; another run's proof proves nothing. */
export const clientGone = (r: Run): boolean =>
  provenNow(r) || (!!r.client_gone && r.client_gone.identity === runIdentity(r));

/** Keep the proof seen now apart from `why`, with the run it proves. */
export function keepProof(r: Run): void {
  if (!provenNow(r) || r.client_gone?.identity === runIdentity(r)) return;
  const proof =
    r.stop_outcome === "stopped" ? "stopped" : r.reaped === REAPED_OVER ? r.reaped : r.why;
  r.client_gone = { proof: proof ?? "dsh_exit", identity: runIdentity(r) };
}
