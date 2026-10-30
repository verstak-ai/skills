// A satellite's exit from its run's cases and revoke of its seats at the run's end
// (graph @nks/nks-dev, nodes #6573, #6593). At session.ts windDown, after the socket and .key
// go and before the revoke; a failed leave only logs, the case lapses by the seat's term.
import { CASE_EXIT_CLOSED, envName, tool } from "../delivery/index.ts";
import { scoped } from "../shared/scope.ts";
import { type SeatKey } from "../shared/seat.ts";
import { type Answer, callTool as call } from "./call.ts";
import { CFG } from "./config.ts";
import { readHoldRecord, writeHoldRecord } from "./holdrecord.ts";
import { H } from "./holdstate.ts";
import { normKarta } from "./names.ts";
import { extraPlaces } from "./places.ts";
import { canonRealm, otherRealm } from "./realms.ts";
import { seatAlreadyOff } from "./refusal.ts";
import { log } from "./streams.ts";
import { type Standing, state } from "./transport.ts";
import { type JsonRpcMessage } from "./types.ts";

/** One cap for all end-of-run exits: the harness kills the bridge after a short grace. */
const LEAVE_CAP_MS = Number(process.env[envName("CASE_LEAVE_MS")]) || 1_500;

/** The run's cases, per session (a daemon holds many); key — realm and bare number. */
const joined = scoped(() => new Map<string, { realm?: string; room: string }>());

/** "#102", "\u2116102", " 102 " are one number; a case id stays as is. */
const roomNo = (room: string): string => room.replace(/^[#\u2116]\s*/, "");

/** A successful case join remembers the case, a leave forgets it. */
export function noteCaseEntry(name: unknown, args: unknown, reply: JsonRpcMessage): void {
  if (reply.result?.isError || name !== tool("case")) return;
  const a = (args ?? {}) as Record<string, unknown>;
  if (a.action !== "join" && a.action !== "leave") return;
  const room = typeof a.room === "string" ? a.room.trim() : "";
  if (!room || (a.action === "join" && room.startsWith("-"))) return;
  const realm = typeof a.realm === "string" ? a.realm : undefined;
  const no = roomNo(room);
  // The same number in a realm not known to be another (rN and its @owner/slug before hello)
  // is the same case.
  for (const [k, c] of joined)
    if (roomNo(c.room) === no && !otherRealm(c.realm, realm)) joined.delete(k);
  if (a.action === "join") joined.set(`${realm ? canonRealm(realm) : ""}#${no}`, { realm, room });
  keepRecordCases();
}

/**
 * A satellite's record carries the cases it is in now (suspend.ts, holdkeep.ts): a join or leave
 * after the return rewrites it, so a later return by key (a dead bridge replaced, no pause)
 * seeds neither a case left nor misses one joined (case №954).
 */
function keepRecordCases(): void {
  const key = H.currentKey;
  if (!CFG.satellite || !key || !H.currentUrl) return;
  const rec = readHoldRecord(key, true);
  if (!rec || rec.left || rec.url !== H.currentUrl || !rec.cases) return;
  writeHoldRecord(key, { ...rec, cases: joinedCases() }, true);
}

/** The run's cases for the satellite's pause record (suspend.ts): the next bridge leaves them. */
export const joinedCases = (): { realm?: string; room: string }[] => [...joined.values()];

/** Cases handed over by the former bridge's pause: this bridge leaves them at the end. */
export function seedJoined(cases: { realm?: string; room: string }[] | undefined): void {
  for (const c of cases ?? [])
    if (c?.room) joined.set(`${c.realm ? canonRealm(c.realm) : ""}#${roomNo(c.room)}`, c);
}

/**
 * Leaves the run's cases at a satellite's end, before the seat goes, all at once
 * under the cap (graph @nks/nks-dev, node #6573). Satellites only: a session's own seat
 * outlives it and returns.
 */
export async function leaveJoinedCases(): Promise<void> {
  if (!CFG.satellite || !joined.size) return;
  const cases = [...joined.values()];
  joined.clear();
  const leaves = cases.map(async (c) => {
    try {
      const r = await call(tool("case"), { action: "leave", ...c });
      log(
        r.isError
          ? `could not leave case ${c.room} at the run's end: ${r.text.slice(0, 120)}`
          : `left case ${c.room} at the run's end (#6573)`,
      );
    } catch (e) {
      log(`could not leave case ${c.room} at the run's end: ${(e as Error).message}`);
    }
  });
  if (!(await underCap(Promise.allSettled(leaves))))
    log(
      `case leave at the run's end exceeded ${LEAVE_CAP_MS} ms — the place goes, the rest lapse by term`,
    );
}

/** The session's seats, main first, then those in other graphs; taken before releaseStanding erases them. */
export const ownPlaces = (): Standing[] =>
  [
    // An evicted (4000) seat belongs to its taker: revoking it would remove theirs.
    H.evictedKey && H.evictedKey === H.currentKey ? null : state.standing,
    ...extraPlaces().map((p) => p.standing),
  ].filter((s): s is Standing => !!s?.name);

/** A satellite's seats, main and in other graphs. */
export const satellitePlaces = (): Standing[] => (CFG.satellite ? ownPlaces() : []);

/**
 * Revokes a session's own seats at the agent's end (graph @nks/nks-dev, node #7493): the seats
 * beside first — the platform keeps a channel's main seat while seats of other graphs stand on it.
 */
export async function revokeOwnPlaces(places: Standing[]): Promise<Revokes> {
  const [main, ...beside] = places;
  const a = await revokeSatellitePlaces(beside);
  const b = await revokeSatellitePlaces(main ? [main] : []);
  return {
    failed: [...a.failed, ...b.failed],
    revoked: [...a.revoked, ...b.revoked],
    probably: [...a.probably, ...b.probably],
  };
}

/**
 * Revokes' outcome: names left on the board; seats confirmed revoked by canonical graph, role
 * and name (№664); names gone only by the reply's prose — neither failed nor confirmed.
 */
export interface Revokes {
  failed: string[];
  revoked: SeatKey[];
  probably: string[];
}

/**
 * Revokes the satellite's seats at the run's end (graph @nks/nks-dev, nodes #6550,
 * #6593): a closed socket does not remove a seat from the board, only a revoke or the
 * channel's term does. Every seat of the channel, other graphs included. Called after
 * releaseStanding and the case exits, so a 4001 close is not taken for a dead token. The answer —
 * names left on the board, and confirmed revokes by canonical graph, role and name (№664).
 */
export async function revokeSatellitePlaces(places: Standing[]): Promise<Revokes> {
  const failed = new Set(places); // revoked seats are struck out — one name in two graphs is two (#5838)
  const revoked: SeatKey[] = [];
  const probably = new Set<string>();
  const revokes = places.map((s) =>
    call(tool("channel"), { action: "revoke", realm: s.realm, karta: s.karta, standing: s.name })
      .then((r) => {
        const how = revokeOutcome(r);
        if (how === "failed")
          return log(`place ${s.name} NOT revoked at the run's end: ${r.text.slice(0, 120)}`);
        failed.delete(s);
        if (how === "probably") {
          probably.add(s.name as string);
          return log(`${s.name} probably revoked at the run's end: ${r.text.slice(0, 120)}`);
        }
        revoked.push({ realm: canonRealm(s.realm), karta: normKarta(s.karta), name: s.name ?? "" });
        log(`revoked ${s.name} in ${s.realm} at the run's end (#6593)`);
      })
      .catch((e: Error) => log(`place ${s.name} NOT revoked at the run's end: ${e.message}`)),
  );
  if (places.length && !(await underCap(Promise.allSettled(revokes))))
    log(
      `revoke at the run's end exceeded ${LEAVE_CAP_MS} ms — the place lapses by the channel's term`,
    );
  return {
    failed: [...new Set([...failed].map((s) => s.name as string))],
    revoked: [...revoked],
    probably: [...probably],
  };
}

/**
 * A revoke reply: confirmed — success, or a seat already gone as data (refusal.ts seatAlreadyOff;
 * the platform's 4001, a retry after a closed connection); probably — prose that reads
 * as gone without refusal data, never confirmed to the plugin (№664); any other refusal
 * (e.g. the channel's main seat) is a real failure.
 */
const revokeOutcome = (r: Answer): "confirmed" | "probably" | "failed" => {
  if (!r.isError) return "confirmed";
  if (r.refusal) return seatAlreadyOff(r.refusal) ? "confirmed" : "failed";
  return CASE_EXIT_CLOSED.test(r.text) ? "probably" : "failed";
};

/** true when the work finished under the end-of-run cap. */
async function underCap(work: Promise<unknown>): Promise<boolean> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const cap = new Promise<"cap">((r) => (timer = setTimeout(() => r("cap"), LEAVE_CAP_MS)));
  const got = await Promise.race([work, cap]);
  clearTimeout(timer);
  return got !== "cap";
}
