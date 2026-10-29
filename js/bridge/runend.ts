// The seat's end at the session's end (graph @nks/nks-dev, nodes #4895, #6573, #6593, #6649),
// once per session: called by the leave (session.ts) or earlier by the OpenCode plugin's
// `end` method ending a lead subagent, whose outcome then reaches the parent.
import { method, RUN_END } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import { scoped } from "../shared/scope.ts";
import { ownPidAlive } from "../shared/seam-entrance.ts";
import { type SeatKey } from "../shared/seat.ts";
import { leaveJoinedCases, revokeSatellitePlaces, satellitePlaces } from "./caseexit.ts";
import { CFG } from "./config.ts";
import { localSocketPathOf, releaseStanding } from "./hold.ts";
import { keepHoldRecord } from "./holdkeep.ts";
import { dropHoldRecord, readHoldRecord } from "./holdrecord.ts";
import { leavingLine, released } from "./muxhold.ts";
import { handoverPauseKey, suspended } from "./pauserecord.ts";
import { publishStatusTo } from "./status.ts";
import { statusAddress } from "./statusaddr.ts";
import { sleep } from "./store.ts";
import { log } from "./streams.ts";
import { localSocketAlive } from "./sweep.ts";
import { type Standing } from "./transport.ts";
import { type JsonRpcMessage } from "./types.ts";
import { flushUsage, usagePlace } from "./usage.ts";

/**
 * Satellite seats at the run's end: names failed to revoke, and seats confirmed revoked by this
 * bridge's own call — by canonical graph, role and name; a seat gone only by the reply's prose is
 * in neither (caseexit.ts, №664).
 */
export interface RunEnd {
  failed: string[];
  revoked: SeatKey[];
}

const R = scoped(() => ({
  run: null as Promise<RunEnd> | null,
  /** the run's seats and busy address while a handover pause lasts */
  held: null as { places: Standing[]; addr: { url: string } | null } | null,
}));

/**
 * Release the session's seat; the answer — satellite seats that failed to revoke and those it revoked.
 * handover — the daemon hands seats to a successor: a non-satellite seat stays open.
 */
export function closeRun(why: string, handover: boolean): Promise<RunEnd> {
  return (R.run ??= (async () => {
    // Socket and key go FIRST, before any network call: a harness killing us soon must not find a live key (graph @nks/nks-dev, node #4895).
    // Else the watchdog would follow a dead socket; case exits and revoke are session calls, no socket needed.
    const addr = statusAddress();
    const places = satellitePlaces();
    // A satellite paused for a plugin reload (suspend.ts) keeps seat, cases and busy for the new bridge.
    const paused = suspended();
    const closing = (!handover || CFG.satellite) && !paused;
    const spent = closing || paused ? usagePlace() : null;
    // A satellite keeps no hold record; others keep it with the term counted from now (graph @nks/nks-dev, node #6649).
    if (!CFG.satellite) keepHoldRecord();
    // On the dispatcher the cleared busy line goes in the tact before the unsubscribe (#8620 v11).
    const line = addr && closing ? leavingLine(addr.url) : "none";
    // A paused seat keeps its busyness even if nobody takes the handover socket.
    releaseStanding(why, CFG.satellite && !paused, false, false, paused);
    if (paused) R.held = { places, addr };
    // The satellite leaves its cases while still on the board; the last usage snapshot goes before revoke
    // (graph @nks/nks-dev, nodes #6573, #6593, #6401). On a daemon change without a pause the lost
    // seat closes too; a handover with a live bridge pauses itself (daemon.ts, pauseForHandover).
    await Promise.all([paused ? null : leaveJoinedCases(), flushUsage(spent)]);
    const end = paused ? { failed: [], revoked: [] } : await revokeSatellitePlaces(places);
    // Busyness ends with the session, else the board shows a doer where nobody is; a satellite's
    // goes even on handover (it has no return from disk).
    if (addr && line === "post") await publishStatusTo(addr.url, "", 3000).catch(() => {});
    if (line === "tick") await released(1000);
    return end;
  })());
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
 * The plugin's `end` method — only for a satellite not on pause: the answer — what failed to
 * revoke and what this bridge revoked itself (the launcher's revoke then goes nowhere, #7599).
 */
export function localEnd(msg: JsonRpcMessage): Promise<JsonRpcMessage> | null {
  if (msg?.method !== method("end")) return null;
  const answer = (result: unknown): JsonRpcMessage => ({ jsonrpc: "2.0", id: msg.id, result });
  if (!CFG.satellite || suspended()) return Promise.resolve(answer({ ended: false }));
  return closeRun(words(RUN_END).pluginEnd(), false)
    .then(({ failed, revoked }) => answer({ ended: true, failed, revoked }))
    .catch((e: Error) => answer({ ended: false, word: e.message }));
}
