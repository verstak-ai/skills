// A satellite's exit from its run's cases and revoke of its seats at the run's end
// (graph @nks/nks-dev, nodes #6573, #6593).
import { CASE_EXIT_CLOSED, envName, tool } from "../delivery/index.ts";
import { scoped } from "../shared/scope.ts";
import { type Answer, callTool as call } from "./call.ts";
import { CFG } from "./config.ts";
import { H } from "./holdstate.ts";
import { extraPlaces } from "./places.ts";
import { canonRealm, otherRealm } from "./realms.ts";
import { log } from "./streams.ts";
import { type Standing, state } from "./transport.ts";
import { type JsonRpcMessage } from "./types.ts";

/** One cap for all end-of-run exits: the harness kills the bridge after a short grace. */
const LEAVE_CAP_MS = Number(process.env[envName("CASE_LEAVE_MS")]) || 1_500;

/** The run's cases, per session; key — realm and bare number. */
const joined = scoped(() => new Map<string, { realm?: string; room: string }>());

/** "#102", "\u2116102", " 102 " are one number; a case id stays as is. */
const roomNo = (room: string): string => room.replace(/^[#\u2116]\s*/, "");

/** A successful case join remembers the case, a leave forgets it. */
export function noteCaseEntry(name: unknown, args: unknown, reply: JsonRpcMessage): void {
  if (reply.result?.isError || (name !== tool("case") && name !== tool("room"))) return;
  const a = (args ?? {}) as Record<string, unknown>;
  if (a.action !== "join" && a.action !== "leave") return;
  const room = typeof a.room === "string" ? a.room.trim() : "";
  if (!room || (a.action === "join" && room.startsWith("-"))) return;
  const realm = typeof a.realm === "string" ? a.realm : undefined;
  const no = roomNo(room);
  // The same number in a realm not known to be another is the same case.
  for (const [k, c] of joined)
    if (roomNo(c.room) === no && !otherRealm(c.realm, realm)) joined.delete(k);
  if (a.action === "join") joined.set(`${realm ? canonRealm(realm) : ""}#${no}`, { realm, room });
}

/** The run's cases for the satellite's pause record (suspend.ts). */
export const joinedCases = (): { realm?: string; room: string }[] => [...joined.values()];

/** Cases handed over by the former bridge's pause: this bridge leaves them at the end. */
export function seedJoined(cases: { realm?: string; room: string }[] | undefined): void {
  for (const c of cases ?? [])
    if (c?.room) joined.set(`${c.realm ? canonRealm(c.realm) : ""}#${roomNo(c.room)}`, c);
}

/**
 * Leaves the run's cases at a satellite's end, before the seat goes, all at once
 * under the cap (graph @nks/nks-dev, node #6573). Satellites only.
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

/** A satellite's seats, main and in other graphs; taken before releaseStanding erases them. */
export const satellitePlaces = (): Standing[] =>
  CFG.satellite
    ? [
        // An evicted (4000) seat belongs to its taker: revoking it would remove theirs.
        H.evictedKey && H.evictedKey === H.currentKey ? null : state.standing,
        ...extraPlaces().map((p) => p.standing),
      ].filter((s): s is Standing => !!s?.name)
    : [];

/**
 * Revokes the satellite's seats at the run's end (graph @nks/nks-dev, nodes #6550,
 * #6593): a closed socket does not remove a seat from the board. Called after
 * releaseStanding and the case exits, so a 4001 close is not taken for a dead token.
 */
export async function revokeSatellitePlaces(places: Standing[]): Promise<string[]> {
  if (!places.length) return [];
  const failed = new Set(places.map((s) => s.name as string));
  const revokes = places.map((s) =>
    call(tool("channel"), { action: "revoke", realm: s.realm, karta: s.karta, standing: s.name })
      .then((r) => {
        // Already gone counts as revoked.
        if (!r.isError || alreadyClosed(r)) {
          failed.delete(s.name as string);
          return log(`revoked ${s.name} in ${s.realm} at the run's end (#6593)`);
        }
        log(`place ${s.name} NOT revoked at the run's end: ${r.text.slice(0, 120)}`);
      })
      .catch((e: Error) => log(`place ${s.name} NOT revoked at the run's end: ${e.message}`)),
  );
  if (!(await underCap(Promise.allSettled(revokes))))
    log(
      `revoke at the run's end exceeded ${LEAVE_CAP_MS} ms — the place lapses by the channel's term`,
    );
  return [...failed];
}

/** A revoke reply about a seat already gone: 410, or 404 without a rule; without refusal data — the prose. */
const alreadyClosed = (r: Answer): boolean =>
  r.refusal
    ? r.refusal.status === 410 || (r.refusal.status === 404 && !r.refusal.rule)
    : CASE_EXIT_CLOSED.test(r.text);

/** true when the work finished under the end-of-run cap. */
async function underCap(work: Promise<unknown>): Promise<boolean> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const cap = new Promise<"cap">((r) => (timer = setTimeout(() => r("cap"), LEAVE_CAP_MS)));
  const got = await Promise.race([work, cap]);
  clearTimeout(timer);
  return got !== "cap";
}
