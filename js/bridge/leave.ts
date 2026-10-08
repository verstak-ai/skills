// Leaving the seat — between an absence and a revoke (graph nks-dev: #4895):
// socket closed, busyness cleared; address, queue and hooks intact.
// Three causes: the doer's word (channel leave), deafness (no local listener
// past the threshold where the harness hears only through one), session end.
// Mail piles up at the platform and arrives as a stale tail on return; pi and OpenCode
// get frames by notification and are never deaf.
import { envName, LEAVE, LOGGERS, tool } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import { scoped } from "../shared/scope.ts";
import { resolveAgainstLed, unresolvedRefusal } from "./call.ts";
import { notifiedClient } from "./client.ts";
import { CFG } from "./config.ts";
import {
  awaitHello,
  besideKeyIn,
  heldPlaces,
  holdsStanding,
  ledKey,
  listenerIdleSince,
  localListeners,
  onListenerAttached,
  parkStanding,
  readHoldRecord,
  releaseStanding,
  rememberStatus,
  resumeStanding,
} from "./hold.ts";
import { markLeft } from "./holdrecord.ts";
import { H } from "./holdstate.ts";
import { otherRealm } from "./realms.ts";
import { releaseSatelliteClaims } from "./satellite.ts";
import { publishedStatus, publishStatus } from "./status.ts";
import { emit, log } from "./streams.ts";
import { state } from "./transport.ts";
import { type JsonRpcMessage } from "./types.ts";
import { flushUsage, usagePlace } from "./usage.ts";

/** Deafness threshold; the variable is a seam for probes. */
const DEAF_MS = Number(process.env[envName("BRIDGE_DEAF_MS")]) || 15 * 60_000;
const TICK_MS = Math.min(60_000, Math.max(200, Math.floor(DEAF_MS / 5)));

const clearedLine = (st: { ok: boolean; body: string }): string =>
  st.ok ? words(LEAVE).cleared() : words(LEAVE).notCleared(st.body);

/** Frames reach this harness only through the bridge's local client. */
const deafWithoutListener = (): boolean => !notifiedClient();

const K = scoped(() => ({
  /** Busy line cleared by the leave — restored with the seat. */
  status: "",
  /** Busy lines of seats in other graphs cleared by the same leave — each to its seat (#5838). */
  beside: [] as { realm: string; text: string }[],
}));

/** Leave the seat: busyness cleared, socket closed, seat intact. Returns the word on what was done. */
export async function leaveStanding(reason: string, byWord = false): Promise<string> {
  const W = words(LEAVE);
  if (byWord && CFG.satellite) return leaveSatellite(reason);
  // Beside seats' lines come from their hold records before the leave drops them.
  const beside = heldPlaces()
    .filter((p) => !p.primary)
    .map((p) => ({ realm: p.realm, text: readHoldRecord(p.key)?.status ?? "" }))
    .filter((k) => k.text);
  // Seats of the channel share the socket: leaving closes it for all (#5838).
  const leaving = heldPlaces().map((p) => p.key);
  if (leaving.length) await flushUsage(usagePlace()); // last usage snapshot while the seat is held (#6401)
  const parked = parkStanding(reason);
  if (!parked) return W.notHolding();
  K.beside = beside;
  K.status = publishedStatus();
  const st = await publishStatus("", undefined, true); // cleared on all seats of the channel
  // Kept in the hold record; restored only when the same session returns (#6017).
  if (st.ok && K.status) rememberStatus(K.status);
  // A leave by word holds: only a stand by name raises the seat again (#6017).
  if (byWord) for (const k of leaving) markLeft(k, true);
  const line = clearedLine(st);
  log(`left the standing: ${reason}; ${line}`);
  const which = leaving.length > 1 ? W.seats(leaving.join(", ")) : W.seat(parked);
  return byWord ? W.leftByWord(which, line) : W.left(which, line);
}

/**
 * A satellite's leave by word is whole (#6361): it has no hold record, so a park
 * mark would land nowhere and the plugin's watchdog would raise the seat again.
 */
async function leaveSatellite(reason: string): Promise<string> {
  const W = words(LEAVE);
  const place = heldPlaces()[0]?.key;
  if (!place) return W.notHolding();
  await flushUsage(usagePlace());
  const st = await publishStatus("", undefined, true);
  releaseStanding(`${reason}: ${W.satelliteReleased()}`, true, false, true);
  releaseSatelliteClaims(); // the name is free for the next run
  const line = clearedLine(st);
  log(`left the satellite place: ${reason}; ${line}`);
  return W.leftSatellite(place, line);
}

/**
 * Return to the seat that was left: socket anew, cleared busyness restored.
 * False if there was no leave.
 */
export function returnToStanding(how: string): boolean {
  if (!resumeStanding()) return false;
  for (const p of heldPlaces()) markLeft(p.key, false);
  const text = words(LEAVE).returned(how, K.status);
  log(text);
  if (K.status) {
    const line = K.status;
    K.status = "";
    void publishStatus(line).then((st) => {
      if (!st.ok) log(`busy line not restored after the return: ${st.body}`);
    });
  }
  // Each beside seat gets its own line, not the main one's (#5838).
  for (const k of K.beside.splice(0))
    void publishStatus(k.text, k.realm).then((st) => {
      if (!st.ok) log(`busy line of ${k.realm} not restored after the return: ${st.body}`);
    });
  emit({
    jsonrpc: "2.0",
    method: "notifications/message",
    params: { level: "info", logger: LOGGERS.channel, data: { kind: "note", text } },
  });
  return true;
}

/**
 * A socket reopened at the same address hears only once its hello arrives; without
 * it in time another may have turned the address (answered with 404, not a close code)
 * — the seat is released (#6706).
 */
export async function heardOnReturn(): Promise<void> {
  if (!H.unheard || (await awaitHello(4000))) return;
  const why = words(LEAVE).noHello();
  log(why);
  H.deafKey = H.currentKey; // binding remembered, no hearing (deaf.ts)
  releaseStanding(why, false, false, true);
}

/**
 * Deafness watch: nobody listening past the threshold on a watchdog-only harness — leave the
 * seat. An attaching watchdog returns it: the socket reopens at the same address.
 */
export function startDeafnessWatch(): void {
  // A liveness probe attaches and drops at once; only a listener that stays returns the seat (#5140).
  onListenerAttached(() =>
    setTimeout(() => {
      if (localListeners() > 0) returnToStanding(words(LEAVE).watchdogAttached());
    }, 300).unref(),
  );
  setInterval(() => {
    const since = listenerIdleSince();
    if (since == null || !deafWithoutListener()) return;
    if (Date.now() - since < DEAF_MS) return;
    const s = state.standing;
    if (!s || !holdsStanding(s.realm, s.karta, s.name ?? "")) return;
    const min = Math.round(DEAF_MS / 60_000);
    void leaveStanding(words(LEAVE).nobodyListens(min));
  }, TICK_MS).unref();
}

/** action="leave" of the channel tool — the doer's word, done by the bridge. */
export function localLeave(msg: JsonRpcMessage): Promise<JsonRpcMessage> | null {
  if (msg?.method !== "tools/call" || msg?.params?.name !== tool("channel")) return null;
  if (msg.params?.arguments?.action !== "leave") return null;
  const realm: unknown = msg.params.arguments.realm;
  const answer = (text: string, isError = false): JsonRpcMessage => ({
    jsonrpc: "2.0",
    id: msg.id,
    result: { ...(isError ? { isError: true } : {}), content: [{ type: "text", text }] },
  });
  return (async () => {
    const W = words(LEAVE);
    await resolveAgainstLed(realm); // call's graph and seat's graph in one form (#5838)
    const unresolved = unresolvedRefusal(realm);
    if (unresolved) return answer(unresolved, true);
    // Shared socket (#5838): leaving a beside seat would deafen all — refused aloud.
    const beside = besideKeyIn(realm);
    if (beside)
      return answer(W.refusedBeside(beside, String(ledKey()), state.standing?.realm), true);
    if (state.standing && otherRealm(realm, state.standing.realm))
      return answer(W.refusedOther(String(realm), String(ledKey()), state.standing.realm), true);
    return answer(await leaveStanding(W.byDoerWord(), true));
  })();
}
