// The owner took a seat off (graph @nks/nks-dev, nodes #7439, #7440, #7493): the agent and
// its seat have one life, so taking the seat off ends the agent. A close 4001 the session did
// not expect as its own revoke or close — or such a standing_ended frame naming the main seat — is
// the stop: every door and the notification client hear the stop word, unsent batches are
// dropped to the journal (flushed, they would wake the stopped agent), the seat is released
// with its record and binding forgotten, and no automatic path takes it again (none has a
// record or a binding left; a move under way when it came says the stop word, stoppedSince).
// The name stays free: an explicit call of the stand tool stands as usual. A standing_ended frame for a
// seat beside forgets only that seat, waking nobody — unless it outran the answer of the session's
// own revoke of that seat or close of the channel: then it is that quiet own release. Wired into
// hold.ts at load (session.ts).
import { STOP, type StopWho } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import { type Door } from "./door.ts";
import { broadcast, type ChannelEvent, forgetSeat, notify, releasedAsOwn } from "./hold.ts";
import { type Frame, H, whenStopped } from "./holdstate.ts";
import { holdWords } from "./holdwords.ts";
import { dropExtra, extraPlaces, type Place } from "./places.ts";
import { standingLog } from "./store.ts";
import { log } from "./streams.ts";
import { state } from "./transport.ts";

const WHO_BY_REASON: Readonly<Record<string, StopWho>> = {
  "revoked:person": "person",
  "revoked:self": "self",
  "revoked:silent": "silent",
};
const whoOf = (reason: string): StopWho => WHO_BY_REASON[reason] ?? "other";

const stopWord = (name: string, reason: string): string => words(STOP).stopped(name, whoOf(reason));

/** What a stopped seat had not given yet stays in the journal, not in the session: it would wake the agent. */
function dropUnsent(key: string, doors: (Door | null | undefined)[]): void {
  const n = doors.reduce((sum, d) => sum + (d?.dropBatches() ?? 0), 0);
  if (n) standingLog(`stopped ${key}: ${n} undelivered frame(s) dropped, not given`);
}

function stopAgent(key: string, how: string, reason: string, order?: string): void {
  const text = stopWord(state.standing?.name ?? "", reason);
  log(text);
  standingLog(`stopped ${key}: ${how}${reason ? ` (${reason})` : ""}`);
  dropUnsent(key, [H.door, ...extraPlaces().map((p) => p.door)]);
  H.stopped = { n: H.stopped.n + 1, key, text };
  const ev: ChannelEvent = {
    kind: "stopped",
    key,
    text,
    ...(reason ? { reason } : {}),
    ...(order ? { order } : {}),
  };
  broadcast(ev);
  notify("error", ev);
  forgetSeat(text);
}

function stopBeside(beside: Place, reason: string): void {
  const text = stopWord(beside.standing.name ?? "", reason);
  log(`${text} — that seat beside is forgotten, the rest are held`);
  dropUnsent(beside.door.key, [beside.door]);
  dropExtra(beside.door.key, text, true, "beside");
}

/**
 * A stop order for seat `id` (stoporder.ts, graph @nks/nks-dev, node #7519): the same stop as
 * the owner taking that seat off — the main seat stops the agent, a seat beside goes alone.
 * null — no seat of this session has that id. An id unknown to a lone main seat is its own.
 */
export function stopSeatByOrder(id: string, by: string, order: string): "main" | "beside" | null {
  const reason = by ? `revoked:${by}` : "";
  const seat = seatOf(id);
  if (seat === "main" && H.currentKey)
    stopAgent(H.currentKey, `stop order ${order}`, reason, order);
  else if (seat && seat !== "main") stopBeside(seat, reason);
  return seat === null ? null : seat === "main" ? "main" : "beside";
}

/** The session's seat with this id: the main one, one beside, or none. */
function seatOf(id: string): Place | "main" | null {
  const beside = extraPlaces().find((p) => p.door.standingId === id);
  if (beside) return beside;
  const main = H.door?.standingId;
  if (!H.door || !H.currentKey || (main ? main !== id : extraPlaces().length > 0)) return null;
  return "main";
}

/** Whether the order is this session's: by its seat's known id, or — `framed`, on this channel's socket — as seatOf. */
export const holdsSeat = (id: string, framed: boolean): boolean =>
  framed
    ? seatOf(id) !== null
    : H.door?.standingId === id || extraPlaces().some((p) => p.door.standingId === id);

/** One seat of a live channel taken off (api: standing_ended {standing_id, by | reason}). */
function seatEnded(key: string, frame: Frame): void {
  const id = typeof frame.standing_id === "string" ? frame.standing_id : "";
  const reason =
    typeof frame.by === "string"
      ? `revoked:${frame.by}`
      : frame.reason === "silent"
        ? "revoked:silent"
        : "";
  const beside = id ? extraPlaces().find((p) => p.door.standingId === id) : undefined;
  if (beside) {
    // The frame outran the answer of the session's own revoke of that seat or close of the channel.
    const own = H.closingOwn
      ? holdWords().closedOwn()
      : H.revokingBeside.has(beside.door.key)
        ? holdWords().revokedOwn()
        : null;
    if (own) {
      log(
        `seat beside ${beside.door.key} released quietly (standing_ended arrived before the answer)`,
      );
      return dropExtra(beside.door.key, own, true, "own");
    }
    return stopBeside(beside, reason);
  }
  const main = H.door?.standingId;
  // An id that names neither seat: with seats beside it may be one whose id the bridge never learnt.
  if (id && (main ? main !== id : extraPlaces().length > 0))
    return log(`standing_ended for seat ${id}, not one this bridge knows — ignored`);
  if (releasedAsOwn("standing_ended")) return; // the frame outran the answer of the session's own revoke or close
  stopAgent(key, "standing_ended", reason);
}

whenStopped((key, code, reason, ended) =>
  ended ? seatEnded(key, ended) : stopAgent(key, `close ${code}`, reason),
);
