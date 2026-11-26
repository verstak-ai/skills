// The journal of ended seats (graph @nks/nks-dev, nodes #7439, #11030): every standing_ended
// frame and stop order names a seat id, known to the bridge or not — a seat a register move
// is about to register may not be held yet (a disk return's seat beside) or its turn may come
// after the frame. Each id is kept a short while with the moment it ended; a register move
// asks the journal before every register (ratelimit.ts): a seat ended since the move began
// is not registered.
import { scoped } from "../shared/scope.ts";

/** How long an ended id is kept: longer than any register move (its deadline is a minute). */
const KEEP_MS = 10 * 60_000;

const J = scoped(() => ({ ended: new Map<string, number>() }));

/** The seat `id` ended now (standing_ended, a stop order): kept for the moves under way; the id back as a string. */
export function noteEndedSeat(raw: unknown): string {
  const id = typeof raw === "string" ? raw : "";
  if (!id) return id;
  const now = Date.now();
  for (const [k, at] of J.ended) if (now - at > KEEP_MS) J.ended.delete(k);
  J.ended.set(id, now);
  return id;
}

/** Whether the seat `id` ended at `since` or later; an unknown id (null) — no. */
export const endedSince = (id: string | null, since: number): boolean =>
  !!id && (J.ended.get(id) ?? -1) >= since;
