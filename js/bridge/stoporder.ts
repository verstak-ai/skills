// The owner's stop order (graph @nks/nks-dev, nodes #7509, #7510, #7519): it reaches the bridge
// by the socket's stop frame or by the open orders read on hello, and both meet here by order
// id. The frame is never the agent's. The order goes on disk, accepted is answered, the seat
// stops as when the owner takes it off (stophold.ts), the harness's part of the stop is awaited
// where the harness confirms it (orderhalt.ts), and the outcome is answered — never before the
// accepted's answer; the api's taking of the outcome ends the seat (stopped — as by itself).
// The same id again gives the same outcome, not a second stop. Every bridge that knows orders
// executes them, with or without the orchestrator's flag (#7513). Wired into hold.ts at load
// (session.ts).
import { STOP } from "../delivery/index.ts";
import { apiBase } from "../shared/channel.ts";
import { words } from "../shared/lang.ts";
import { broadcast, notify } from "./hold.ts";
import { type Frame, whenOrdered } from "./holdstate.ts";
import { answerOutcome, type Order, repeatLater, sendAck, windowEnd } from "./orderack.ts";
import { fly } from "./orderflight.ts";
import { awaitHalt, confirmsHalts, SILENT } from "./orderhalt.ts";
import { isTerminal, type OrderEntry, readOrder, writeOrder } from "./orderjournal.ts";
import { readOpenOrders } from "./orderread.ts";
import { holdsSeat, stopSeatByOrder } from "./stophold.ts";
import { sleep, standingLog } from "./store.ts";
import { log } from "./streams.ts";

/** Orders this process is executing or has executed: a second arrival is the same order. */
const taken = new Set<string>();
const ACCEPT_CAP_MS = 2000;

const str = (v: unknown): string => (typeof v === "string" ? v : "");

function orderOf(frame: Frame): Order | null {
  const id = str(frame.order_id);
  const standing = str(frame.standing_id);
  if (!id || !standing) return null;
  const span = frame.ack_window_seconds;
  return {
    id,
    standing_id: standing,
    reason_code: str(frame.reason_code),
    by: str(frame.by),
    issued_at: str(frame.issued_at),
    ...(typeof span === "number" ? { ack_window_seconds: span } : {}),
  };
}

/** The journal refused an entry: loudly — to the log, the doors and the human. */
function journalRefused(id: string, outcome: boolean): void {
  const text = words(STOP).orderJournalRefused(id, outcome);
  log(text);
  broadcast({ kind: "note", text });
  notify("warning", { kind: "note", text });
}

/**
 * The stop itself and the harness's part of it. Where the harness confirms (the OpenCode
 * plugin), stopped is its executed interrupt and its refusal is failed with its code; where it
 * cannot (the watchdog, pi), the stop is executed once the bridge gave the stop word and let
 * the seat go. A seat beside stops no agent: it goes alone. stopped names which of the three it
 * was: halt_confirmed, word_given, seat_beside.
 */
async function stopOf(o: Order, entry: OrderEntry): Promise<OrderEntry> {
  const confirms = confirmsHalts();
  let seat: "main" | "beside" | null;
  try {
    seat = stopSeatByOrder(o.standing_id, o.by ?? "", o.id);
  } catch (e) {
    log(`stop order ${o.id}: the stop failed — ${(e as Error).message}`);
    return { ...entry, state: "failed", reason: "stop_failed" };
  }
  if (seat === null) return { ...entry, state: "unknown", reason: "seat_gone_before_stop" };
  if (seat === "beside") return { ...entry, state: "stopped", reason: "seat_beside" };
  if (!confirms) return { ...entry, state: "stopped", reason: "word_given" };
  const code = await awaitHalt(o.id);
  if (code === null) return { ...entry, state: "stopped", reason: "halt_confirmed" };
  log(`stop order ${o.id}: the harness's stop — ${code}`);
  return code === SILENT
    ? { ...entry, state: "unknown", reason: SILENT }
    : { ...entry, state: "failed", reason: code };
}

/** The outcome on disk, then answered; a disk that refused it — answered once, no repeat. */
async function finish(end: OrderEntry): Promise<void> {
  standingLog(
    `stop order ${end.id} for ${end.standing}: ${end.state}${end.reason ? ` (${end.reason})` : ""}`,
  );
  if (writeOrder(end)) return answerOutcome(end);
  journalRefused(end.id, true);
  await sendAck(end.base, end.id, end.state, end.reason);
}

async function execute(o: Order, base: string, framed: boolean): Promise<void> {
  const known = readOrder(o.id);
  if (known && isTerminal(known.state)) {
    log(`stop order ${o.id} again — the same outcome ${known.state}, no second stop`);
    return answerOutcome(known);
  }
  // The read lists every seat of the account: one this session does not hold is another's.
  if (taken.has(o.id) || (!framed && !holdsSeat(o.standing_id, false))) return;
  taken.add(o.id);
  return fly(o.id, (f) => carry(o, base, f));
}

async function carry(o: Order, base: string, f: { end: OrderEntry | null }): Promise<void> {
  const at = Date.now();
  const entry: OrderEntry = {
    id: o.id,
    standing: o.standing_id,
    state: "accepted",
    base,
    acked: false,
    at,
    pid: process.pid,
    until: windowEnd(o, at),
  };
  if (!holdsSeat(o.standing_id, true))
    return finish({ ...entry, state: "refused", reason: "seat_not_held" });
  // accepted is the order on disk (#7510): not on disk — no accepted, the outcome goes alone.
  const kept = writeOrder(entry);
  if (!kept) journalRefused(o.id, false);
  const accepted = kept ? sendAck(base, o.id, "accepted") : null;
  // An api out of reach does not hold the stop longer than the cap…
  if (accepted) await Promise.race([accepted, sleep(ACCEPT_CAP_MS)]);
  const end = (f.end = await stopOf(o, entry));
  // …but the outcome never overtakes the accepted's answer or its timeout (orderack.ts); an
  // accepted the api takes later, past the outcome, is a harmless 200 idempotent_noop.
  await accepted;
  await finish(end);
}

/**
 * One handler for both ways in: the stop frame (taken: true), and the socket's hello — the open
 * orders read; its answer comes after hello.standings named the seats' ids (hold.ts).
 */
function onOrder(url: string, frame: Frame | null): boolean {
  const base = apiBase(url);
  if (frame?.type === "hello") {
    repeatLater(true); // a new socket — a new chance for outcomes the api has not taken
    void readOpenOrders(base, (orders) => orders.map((o) => execute(o, base, false)));
    return false;
  }
  if (frame?.type !== "stop") return false;
  const o = orderOf(frame);
  if (!o) log(`stop frame without order_id or standing_id — ignored, not given to the agent`);
  else void execute(o, base, true);
  return true;
}

whenOrdered(onOrder);
