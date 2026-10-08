// The seat's end at the session's end (graph @nks/nks-dev, nodes #4895, #6573, #6593, #6649),
// once per session: called by the leave (session.ts) or earlier by the OpenCode plugin's
// `end` method ending a lead subagent, whose outcome then reaches the parent.
import { method, RUN_END } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import { scoped } from "../shared/scope.ts";
import { ownPidAlive } from "../shared/seam-entrance.ts";
import { leaveJoinedCases, revokeSatellitePlaces, satellitePlaces } from "./caseexit.ts";
import { CFG } from "./config.ts";
import { localSocketPathOf, releaseStanding } from "./hold.ts";
import { keepHoldRecord } from "./holdkeep.ts";
import { dropHoldRecord, readHoldRecord } from "./holdrecord.ts";
import { handoverPauseKey, suspended } from "./pauserecord.ts";
import { publishStatusTo } from "./status.ts";
import { statusAddress } from "./statusaddr.ts";
import { sleep } from "./store.ts";
import { log } from "./streams.ts";
import { localSocketAlive } from "./sweep.ts";
import { type Standing } from "./transport.ts";
import { type JsonRpcMessage } from "./types.ts";
import { flushUsage, usagePlace } from "./usage.ts";

const R = scoped(() => ({
  run: null as Promise<string[]> | null,
  /** the run's seats and busy address while a handover pause lasts */
  held: null as { places: Standing[]; addr: { url: string } | null } | null,
}));

/**
 * Release the session's seat; the answer — satellite seats that failed to revoke.
 * handover — the daemon hands seats to a successor: a non-satellite seat stays open.
 */
export function closeRun(why: string, handover: boolean): Promise<string[]> {
  return (R.run ??= (async () => {
    // Socket and key go FIRST, before any network call: a harness killing us soon must not find a live key (graph @nks/nks-dev, node #4895).
    const addr = statusAddress();
    const places = satellitePlaces();
    // A satellite paused for a plugin reload (suspend.ts) keeps seat, cases and busy for the new bridge.
    const paused = suspended();
    const closing = (!handover || CFG.satellite) && !paused;
    const spent = closing || paused ? usagePlace() : null;
    // A satellite keeps no hold record; others keep it with the term counted from now (graph @nks/nks-dev, node #6649).
    if (!CFG.satellite) keepHoldRecord();
    releaseStanding(why, CFG.satellite && !paused, false, false, paused);
    if (paused) R.held = { places, addr };
    // The satellite leaves its cases while still on the board; the last usage snapshot goes before revoke
    // (graph @nks/nks-dev, nodes #6573, #6593, #6401).
    await Promise.all([paused ? null : leaveJoinedCases(), flushUsage(spent)]);
    const failed = paused ? [] : await revokeSatellitePlaces(places);
    if (addr && closing) await publishStatusTo(addr.url, "", 3000).catch(() => {});
    return failed;
  })());
}

/**
 * A daemon handover pause the bridge did not return to: the thin bridge left in
 * the handover window, the seat untaken — the run ends as without a pause. A live
 * bridge is waited for up to `waitMs`.
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
  const failed = await revokeSatellitePlaces(held.places);
  if (failed.length) log(`handover pause of ${key}: NOT revoked ${failed.join(", ")}`);
  if (held.addr) await publishStatusTo(held.addr.url, "", 3000).catch(() => {});
}

/** The plugin's `end` method — only for a satellite not on pause: the answer — what failed to revoke. */
export function localEnd(msg: JsonRpcMessage): Promise<JsonRpcMessage> | null {
  if (msg?.method !== method("end")) return null;
  const answer = (result: unknown): JsonRpcMessage => ({ jsonrpc: "2.0", id: msg.id, result });
  if (!CFG.satellite || suspended()) return Promise.resolve(answer({ ended: false }));
  return closeRun(words(RUN_END).pluginEnd(), false)
    .then((failed) => answer({ ended: true, failed }))
    .catch((e: Error) => answer({ ended: false, word: e.message }));
}
