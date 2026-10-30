// The seat's end at the session's end (graph @nks/nks-dev, nodes #4895, #6573, #6593, #6649,
// #7493), once per session: called by the leave (session.ts) or earlier by the OpenCode plugin's
// `end` method ending a lead subagent, whose outcome then reaches the parent, or a deleted session.
import { method, RUN_END } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import { scoped } from "../shared/scope.ts";
import { ownPidAlive } from "../shared/seam-entrance.ts";
import { awayAnnounced } from "./away.ts";
import {
  leaveJoinedCases,
  ownPlaces,
  revokeOwnPlaces,
  type Revokes,
  revokeSatellitePlaces,
  satellitePlaces,
} from "./caseexit.ts";
import { CFG } from "./config.ts";
import { dropConfirmed, heldSince, recordAt, seatKeyOf } from "./deadseat.ts";
import { closeDeadSeats } from "./deadstop.ts";
import { localSocketPathOf, releaseStanding, standingIdIn } from "./hold.ts";
import { keepHoldRecord } from "./holdkeep.ts";
import { dropHoldRecord, readHoldRecord } from "./holdrecord.ts";
import { H } from "./holdstate.ts";
import { holdLate } from "./latehold.ts";
import { leavingLine, released } from "./muxhold.ts";
import { handoverPauseKey, suspended } from "./pauserecord.ts";
import { publishStatusTo } from "./status.ts";
import { statusAddress } from "./statusaddr.ts";
import { sleep } from "./store.ts";
import { log } from "./streams.ts";
import { localSocketAlive } from "./sweep.ts";
import { letGo, type Standing, state } from "./transport.ts";
import { type JsonRpcMessage } from "./types.ts";
import { flushUsage, usagePlace } from "./usage.ts";

/** Seats at the run's end: failed, confirmed revoked, gone only by the reply's prose (caseexit.ts, №664). */
export type RunEnd = Revokes;

const R = scoped(() => ({
  run: null as Promise<RunEnd> | null,
  /** the run's seats and busy address while a handover pause lasts */
  held: null as { places: Standing[]; addr: { url: string } | null } | null,
  /**
   * the session's own seats left on the board at its end, their platform ids by key, the status
   * address of their socket, and its address when the main seat is among them: the death
   * window's; `now` — a satellite's, it has no window
   */
  dead: null as Dead | null,
  /**
   * how a seat answered after the run's end goes — never by a socket: with the death window
   * (the run ended closing its seats), at once (a satellite's end), or into the hold record
   * for the return (a handover, a pause or an announced absence: latehold.ts)
   */
  late: null as "window" | "now" | "hold" | null,
}));

interface Dead {
  places: Standing[];
  ids: Map<string, string | null>;
  /** when each seat's hold record was written at the run's end: a newer one is a later life (heldSince) */
  eras: Map<string, number | null>;
  status: string | null;
  socket: string | null;
  now?: boolean;
}

/**
 * Release the session's seat; the answer — satellite seats that failed to revoke and those it revoked.
 * handover — the daemon hands seats to a successor: a non-satellite seat stays open.
 * now — the harness ended the agent (its session deleted): its own seats are revoked at once.
 */
export function closeRun(why: string, handover: boolean, now = false): Promise<RunEnd> {
  return (R.run ??= (async () => {
    // Socket and key go FIRST, before any network call: a harness killing us soon must not find a live key (graph @nks/nks-dev, node #4895).
    // Else the watchdog would follow a dead socket; case exits and revoke are session calls, no socket needed.
    const addr = statusAddress();
    const places = satellitePlaces();
    // A satellite paused for a plugin reload (suspend.ts) keeps seat, cases and busy for the new bridge.
    const paused = suspended();
    const closing = (!handover || CFG.satellite) && !paused;
    const spent = closing || paused ? usagePlace() : null;
    // The agent's end closes its seat (graph @nks/nks-dev, node #7493): at once on the harness's
    // word, else after the death window (endDeadRun) — not on an announced absence or a handover.
    const mortal = !CFG.satellite && !paused && !handover && !awayAnnounced();
    // A satellite's end is its death, as the harness's word is: a seat answered late goes at once (lateSeat).
    R.late = mortal && !now ? "window" : (CFG.satellite || mortal) && !paused ? "now" : "hold";
    const dying = mortal && !!H.currentKey;
    const own = dying ? ownPlaces() : [];
    // Platform ids before the release forgets the doors: the stop's ended[] names seats by them.
    const ids = new Map(own.map((s) => [seatKeyOf(s), standingIdIn(s.realm)]));
    // The main seat's socket — its token ends the seat after the window (deadstop.ts).
    const socket = own[0] && own[0] === state.standing ? H.currentUrl : null;
    const ended = dying && now;
    // A satellite keeps no hold record; others keep it with the term counted from now (graph
    // @nks/nks-dev, node #6649) — the agent's end too, until its revoke is confirmed.
    if (!CFG.satellite) keepHoldRecord();
    const eras = new Map(own.map((s) => [seatKeyOf(s), recordAt(seatKeyOf(s))]));
    // On the dispatcher the cleared busy line goes in the tact before the unsubscribe (#8620 v11).
    const line = addr && closing ? leavingLine(addr.url) : "none";
    // A paused seat keeps its busyness even if nobody takes the handover socket.
    releaseStanding(why, CFG.satellite && !paused, false, ended, paused);
    if (paused) R.held = { places, addr };
    // The satellite leaves its cases while still on the board; the last usage snapshot goes before revoke
    // (graph @nks/nks-dev, nodes #6573, #6593, #6401). On a daemon change without a pause the lost
    // seat closes too; a handover with a live bridge pauses itself (daemon.ts, pauseForHandover).
    await Promise.all([paused ? null : leaveJoinedCases(), flushUsage(spent)]);
    let end: RunEnd = paused
      ? { failed: [], revoked: [], probably: [] }
      : await revokeSatellitePlaces(places);
    const status = addr?.url ?? null;
    // The end awaited its exits: a seat another bridge of this home took meanwhile is not revoked
    // by name and its record not touched — the death window's guard (notHeldAgain).
    const free = ended ? await notHeldAgain(own, eras) : own;
    if (ended) end = await revokeOwnPlaces(free);
    // Seats not confirmed revoked wait for the death window, which repeats the revoke.
    const left = ended ? dropConfirmed(free, end.revoked) : own;
    if (dying && left.length) {
      const mine = { places: left, ids, eras, status, socket: left[0] === own[0] ? socket : null };
      R.dead = R.dead ? withLate(mine, R.dead) : mine;
    }
    // Busyness ends with the session, else the board shows a doer where nobody is; a satellite's
    // goes even on handover (it has no return from disk).
    if (addr && line === "post") await publishStatusTo(addr.url, "", 3000).catch(() => {});
    if (line === "tick") await released(1000);
    return end;
  })());
}

/**
 * A connect answered after the run's end (case №677) never opens a socket — nobody is left to
 * listen. The agent died while it was in flight: the seat joins the death window, which ends it
 * by that socket's token; a satellite's goes the same way at once — it has no window, its end is
 * its death; a run keeping its seats keeps this one in the hold record. `id` — the seat's
 * platform id from the reply. false — the run goes on: hold it as ever.
 */
export function lateSeat(
  seat: Standing,
  socket: string,
  status: string | null,
  id: string | null,
): boolean {
  if (!R.run || !R.late) return false;
  if (R.late === "hold") {
    holdLate(seat, socket, status);
    return true;
  }
  const key = seatKeyOf(seat);
  const others = R.dead?.places.filter((s) => seatKeyOf(s) !== key) ?? [];
  const ids = new Map(R.dead?.ids ?? []).set(key, id);
  const eras = new Map(R.dead?.eras ?? []).set(key, recordAt(key));
  R.dead = { places: [seat, ...others], ids, eras, status, socket, now: R.late === "now" };
  log(
    `${key}: connect answered after the run's end — no socket opened, it ends ${R.late === "now" ? "at once" : "with the window"}`,
  );
  return true;
}

/**
 * The end's own snapshot over a seat a connect answered while the end awaited its revokes
 * (lateSeat): the late seat, its id and its newer token stay first (case №2264).
 */
function withLate(mine: Dead, late: Dead): Dead {
  const keys = new Set(late.places.map(seatKeyOf));
  return {
    ...late,
    places: [...late.places, ...mine.places.filter((s) => !keys.has(seatKeyOf(s)))],
    ids: new Map([...mine.ids, ...late.ids]),
    eras: new Map([...mine.eras, ...late.eras]),
  };
}

/**
 * A daemon handover pause the bridge did not return to: the thin bridge left (stdin
 * closed, bye, death) in the handover window, the seat untaken — the run ends as
 * without a pause. A live bridge is waited for up to `waitMs`.
 */
export async function endUnreturnedPause(bridgePid: number, waitMs: number): Promise<void> {
  const key = handoverPauseKey();
  const held = R.held;
  if (!key || !held) return;
  const until = Date.now() + waitMs;
  for (;;) {
    if (handoverPauseKey() !== key || !readHoldRecord(key)) return; // the harness confirmed the pause, the end already happened
    if (await localSocketAlive(localSocketPathOf(key))) return; // the successor took the seat back
    if (!ownPidAlive(bridgePid)) break;
    if (Date.now() > until) return log(`handover pause of ${key}: the bridge lives on — kept`);
    await sleep(200);
  }
  log(`handover pause of ${key}: the bridge left in the handover window — the run ends`);
  dropHoldRecord(key);
  await leaveJoinedCases();
  const { failed } = await revokeSatellitePlaces(held.places);
  if (failed.length) log(`handover pause of ${key}: NOT revoked ${failed.join(", ")}`);
  if (held.addr) await publishStatusTo(held.addr.url, "", 3000).catch(() => {});
}

/**
 * The agent died — its session ended without an announced absence (graph @nks/nks-dev, node
 * #7493): after the window (a reconnect of MCP must not kill the seat) the seats no live bridge
 * holds again are closed — the whole channel by its dead socket's token, else by the server's
 * board (deadstop.ts); a hold record goes with a confirmed end only. Also the repeat of an end
 * whose revoke failed, and a satellite's seat answered late (no window). The daemon calls it in
 * the session's scope after the session ended; a full bridge's process ends with its session
 * and keeps none.
 */
export async function endDeadRun(waitMs: number): Promise<void> {
  if (!deathPending()) return;
  try {
    await closeDeadRun(waitMs);
  } finally {
    // The window reads the board and revokes through this session, so the leave deferred
    // its upstream close (session.ts): it ends only now (#9174).
    await letGo("the run's death window ended");
  }
}

/** A death window is pending: the session's upstream session must outlive the leave (session.ts). */
export const deathPending = (): boolean => !!R.dead?.places.length;

async function closeDeadRun(waitMs: number): Promise<void> {
  const dead = R.dead;
  R.dead = null;
  if (!dead?.places.length) return;
  if (!dead.now) await sleep(waitMs);
  const kept = await notHeldAgain(dead.places, dead.eras);
  const [first] = dead.places;
  const main = dead.socket && kept[0] === first ? { seat: first, socket: dead.socket } : null;
  if (kept.length) await closeDeadSeats(kept, main, dead.status, dead.ids);
}

/** The seats no live bridge holds again since this run's end (`eras`): only those are this run's to close. */
async function notHeldAgain(
  places: Standing[],
  eras: Map<string, number | null>,
): Promise<Standing[]> {
  const kept: Standing[] = [];
  for (const s of places) {
    const key = seatKeyOf(s);
    if (await localSocketAlive(localSocketPathOf(key))) log(`${key} is held again — not closed`);
    // Taken back and left again in the window (an announced absence, a death with its own window).
    else if (heldSince(key, eras.get(key)))
      log(`${key}: held again after this run's end — its window is not this run's, not closed`);
    else kept.push(s);
  }
  return kept;
}

/**
 * The plugin's `end` method — for a seat not on pause: a satellite's run ends; another
 * session's agent ended (its session deleted) and its own seats are revoked at once. The
 * answer — what failed to revoke and what this bridge revoked itself (the launcher's revoke
 * then goes nowhere, #7599).
 */
export function localEnd(msg: JsonRpcMessage): Promise<JsonRpcMessage> | null {
  if (msg?.method !== method("end")) return null;
  const answer = (result: unknown): JsonRpcMessage => ({ jsonrpc: "2.0", id: msg.id, result });
  if (suspended()) return Promise.resolve(answer({ ended: false }));
  return closeRun(words(RUN_END).pluginEnd(), false, true)
    .then(({ failed, revoked, probably }) => answer({ ended: true, failed, revoked, probably }))
    .catch((e: Error) => answer({ ended: false, word: e.message }));
}
