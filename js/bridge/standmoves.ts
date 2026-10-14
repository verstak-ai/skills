// Refusals of the stand tool that name the move that works (graph @nks/nks-dev, node #5036
// p. 8; counterexamples #7552–#7556): an api rule in the surface's words, a call in full.
import { STAND_MOVES, type StandMovesWords, tool } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import { type Answer, callTool, short } from "./call.ts";
import { holdsStanding } from "./hold.ts";
import { setRevokingBeside, stoppedDuring } from "./holdstate.ts";
import { holdWords } from "./holdwords.ts";
import { dropExtra, extraIn, extraOf, extraPlaces } from "./places.ts";
import { sameRealm } from "./realms.ts";
import { standingsInRealm } from "./refusal.ts";
import { sw } from "./standwords.ts";
import { type Standing, state } from "./transport.ts";

const mw = (): StandMovesWords => words(STAND_MOVES);

/** The stand call that takes this seat, every argument named. */
export const standCall = (realm: string, karta: string | number, name: string): string =>
  `${tool("stand")}(realm="${realm}", karta=${karta}${name ? `, name="${name}"` : ""})`;

/** The seat this bridge leads in the graph (main or beside), if any. */
export function ledIn(realm: string): Standing | undefined {
  const prim = state.standing;
  return prim && sameRealm(prim.realm, realm) ? prim : extraIn(realm)?.standing;
}

const STANDS_IN_REALM = "channel_already_stands_in_realm";

/**
 * take=true onto another seat of the same graph moves the session, it does not add a seat:
 * the seat this bridge led before — main or beside, in the call's graph — is revoked, or
 * cases ask for from_standing on every call (#7553). A seat beside goes before the register
 * (one channel stands once in a graph) and its door with it. The note after the answer's header.
 */
export async function releasePrior(
  realm: string,
  prior: Standing,
): Promise<{ ok: boolean; note: string }> {
  const name = prior.name ?? "";
  const beside = extraOf(realm, prior.karta, name)?.door.key;
  const args = { action: "revoke", realm, karta: String(prior.karta), standing: name };
  if (beside) setRevokingBeside(beside, true);
  const r = await callTool(tool("channel"), args).finally(() => {
    if (beside) setRevokingBeside(beside, false);
  });
  if (!r.isError) {
    if (beside) dropExtra(beside, holdWords().revokedOwn(), true, "own");
    return { ok: true, note: mw().priorReleased(name) };
  }
  return { ok: false, note: mw().priorKept(name, short(r.text, 160), revokeCall(realm, prior)) };
}

export const revokeCall = (realm: string, s: Standing): string =>
  `${tool("channel")}(action="revoke", realm="${realm}", karta="${s.karta}", standing="${s.name ?? ""}")`;

/**
 * take=true onto another main seat while seats of other graphs stand on the led main one: the new
 * channel would drop their doors, and the former main seat is not revoked while they stand (#6499).
 * Refused before any connect, with the seats beside and the move; null — the move may go.
 */
export function besideHoldsMain(realm: string, prior: Standing, asked: string): string | null {
  const prim = state.standing;
  if (!prim || !sameRealm(prim.realm, realm) || prim.name !== prior.name) return null;
  const beside = extraPlaces().map((p) => p.standing);
  if (!beside.length) return null;
  return mw().besideHoldsMain(
    prior.name ?? "",
    asked,
    beside.map((s) => `${s.name ?? ""} (${s.realm})`).join(", "),
    beside.map((s) => revokeCall(s.realm, s)).join("; "),
    standCall(realm, prior.karta, prior.name ?? ""),
  );
}

const REISSUE_MAX_S = 15;

/** Seconds to wait out a 429 socket reissue refusal of connect (#7552); null — another answer. */
function reissueThrottled(r: Answer): number | null {
  if (!r.isError) return null;
  const rule = r.refusal?.rule;
  const hit =
    rule === "socket_reissue_throttled" ||
    (!rule && r.refusal?.status === 429) ||
    r.text.includes("socket_reissue_throttled");
  if (!hit) return null;
  const said = Number(/retry in (\d+)\s*s/i.exec(r.text)?.[1] ?? NaN);
  return Math.min(Math.max(Number.isFinite(said) ? said : 10, 1), REISSUE_MAX_S);
}

/** The wait for the seat's socket: `own` — it is ours; `stop` — the owner stopped the session meanwhile. */
async function awaitReissue(
  seconds: number,
  held: () => boolean,
  stopped: () => string | null,
): Promise<{ own: boolean; stop: string | null }> {
  for (const end = Date.now() + seconds * 1000; Date.now() < end;) {
    const stop = stopped();
    if (stop || held()) return { own: !stop, stop };
    await new Promise((r) => setTimeout(r, 200));
  }
  const stop = stopped();
  return { own: !stop && held(), stop };
}

export interface Reissued {
  /** connect's answer: the first one, or the repeat after the wait */
  c: Answer;
  /** the socket became this bridge's own during the wait (its own reopening): no second connect */
  own: boolean;
  note: string | null;
}

/**
 * connect met 429 socket_reissue_throttled — mostly the bridge's own reopening of the seat's
 * socket: wait inside the call for the outcome instead of passing the 429 to the agent (#7552);
 * the socket not ours after the wait — connect `again`. The session stopped meanwhile — no
 * connect again, the 429 stays; the caller says the stop (standundo.ts, #7439).
 */
export async function throughReissue(
  c: Answer,
  again: () => Promise<Answer>,
  seat: { realm: string; karta: string | number; name: string },
  stopsBefore: number,
): Promise<Reissued> {
  const throttle = reissueThrottled(c);
  if (!throttle) return { c, own: false, note: null };
  const t0 = Date.now();
  const { own, stop } = await awaitReissue(
    throttle,
    () => holdsStanding(seat.realm, seat.karta, seat.name),
    () => stoppedDuring(stopsBefore),
  );
  if (stop) return { c, own, note: null };
  const seconds = Math.round((Date.now() - t0) / 1000);
  return { c: own ? c : await again(), own, note: mw().reissueWaited(seconds, own) };
}

/**
 * The channel's seats in the graph by the refusal (data.your_standings, api 0.124.0; #7556): the
 * call standing on each. The api gives {id, name}, no role, and the seat may be another role's
 * (#5418) — so the call leaves karta open, the role read off the seat's line on the board;
 * null — no names given.
 */
function yourStandingsMove(r: Answer, realm: string): { call: string; name: string } | null {
  const names = standingsInRealm(r.refusal);
  if (!names.length) return null;
  const call = names.map((n) => `${tool("stand")}(realm="${realm}", karta, name="${n}")`);
  return { call: call.join("; "), name: names.join(", ") };
}

/**
 * The refusal of connect or register as the agent reads it: a known api rule with its move, else as is.
 * `afterConnect` — register refused right after this call's connect: the led seat is the one just
 * taken, not the seat the channel stands on; other refusals read this word.
 */
export function refusedWord(what: string, r: Answer, realm: string, afterConnect?: string): string {
  if (r.refusal?.rule === STANDS_IN_REALM || r.text.includes(STANDS_IN_REALM)) {
    // The api's names first: the bridge's own record of the led seat may lag the platform.
    const yours = yourStandingsMove(r, realm);
    const led = yours || afterConnect !== undefined ? undefined : ledIn(realm);
    const call = yours?.call ?? (led ? standCall(realm, led.karta, led.name ?? "") : "");
    const board = `${tool("channel")}(action="list", realm="${realm}")`;
    const leave = `${tool("channel")}(action="revoke", realm="${realm}", karta, standing=<${yours?.name ?? led?.name ?? "name"}>)`;
    return mw().standsInRealm(realm, call, board, leave, !!yours);
  }
  return afterConnect ?? sw().refused(what, short(r.text));
}
