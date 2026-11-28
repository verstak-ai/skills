// The register gate (graph @nks/nks-dev, nodes #7439, #10801, #11030): the bridge's own
// register of a seat goes to the server only through this file. Every send — the first one,
// the retry after a waited 429, the retry after a 409 opened concurrently (it lives here and
// nowhere else, call.ts has none) — asks its move first: stopped since the move began (the stop
// watch) or this seat ended since then (endedseats.ts) — nothing is sent; a re-registration's
// every send, its 409 retry too, goes through the machine's return gate. A path past the gate
// is a defect; the probe register-gate.test.mjs fails on one: the literal of a register's
// arguments or a 409 retry (racedOpening) outside this file.
import { ID_PREFIX, tool } from "../delivery/index.ts";
import { type Answer, callTool } from "./call.ts";
import { claimResult } from "./claimdelivery.ts";
import { endedSince } from "./endedseats.ts";
import { H } from "./holdstate.ts";
import { placeFields } from "./placefields.ts";
import { type MoveSeat, type RegisterMove, seatIdOf } from "./ratelimit.ts";
import { racedOpening, refusalOf } from "./refusal.ts";
import { noteSkills } from "./skillwatch.ts";
import { claimRefusal, launchBasis, registeredBasis, rememberBasis } from "./spawned-for.ts";
import { log } from "./streams.ts";
import { post, type Standing, state, throughReturn } from "./transport.ts";
import { type JsonRpcMessage } from "./types.ts";

/**
 * The move's main seat whose end is the move's own stop (stophold.ts), its id not asked — only
 * the disk return's main seat (resume.ts). Every other caller passes its real seat (seatOfPlace):
 * the guard register-gate.test.mjs fails on MAIN_SEAT elsewhere.
 */
export const MAIN_SEAT: MoveSeat = Object.freeze({ id: null, main: true });

/**
 * Why the gate is shut for `seat` in `move`: the stop word, the seat's end; null — open. The
 * seat's id is looked up again on every ask (seatIdOf): one learnt mid-move, from a connect
 * answer, is kept for the retries after it.
 */
export const gateShut = (move: RegisterMove, seat: MoveSeat): string | null =>
  move.stopped() ?? (endedSince(seatIdOf(seat), move.since) ? "the seat ended in this move" : null);

/**
 * A re-registration (a rebind after a lost session, a return from disk after a reload or a
 * handover, a skills refresh after a self-update) goes through the machine's return gate
 * (returngate.ts, #11375): one probe, the rest spread after it; a session that already came back
 * through it (its reopen after 404) goes as its tail, not waiting again (#11413). A first stand
 * does not. The
 * gate is asked once more right before the request leaves — a wait at the return gate may last a
 * minute: stopped, the seat ended, or left by word meanwhile — nothing is sent (#7439), `dropped`.
 */
async function returning<R>(
  move: RegisterMove,
  seat: MoveSeat,
  send: () => Promise<R>,
  dropped: (why: string) => R,
): Promise<R> {
  const go = (): Promise<R> => {
    const shut = gateShut(move, seat) ?? (H.parked ? "the seat was left meanwhile" : null);
    if (!shut) return send();
    log(`register not sent: ${shut}`);
    return Promise.resolve(dropped(shut));
  };
  return move.regate ? throughReturn(go) : go();
}

/**
 * A seat-open race (409 without a rule, refusal.ts) is registered once more — a claim
 * (spawned_for) never: its refusal stands. The gate is asked again before the retry, and the
 * journal says what happened: the retry went, or it did not and why. `again` — the retry as the
 * first went: a re-registration's through the machine's return gate, counted in flight, the
 * stop and the seat's end asked once more right before it leaves (returning).
 */
async function onceMoreIfRaced<R>(
  first: R,
  raced: (r: R) => boolean,
  claim: boolean,
  move: RegisterMove,
  seat: MoveSeat,
  again: () => Promise<R>,
): Promise<R> {
  if (claim || !raced(first)) return first;
  const shut = gateShut(move, seat);
  if (shut) {
    log(`register refused by a concurrent opening (409, no rule) — not registered again: ${shut}`);
    return first;
  }
  log("register refused by a concurrent opening (409, no rule) — registering again once");
  return again();
}

/**
 * A register over the tool call (stand, the disk return and its seats beside, a move undone):
 * `args` — the seat and its fields. Shut — nothing sent, a refusal answer with the reason.
 */
export async function registerByCall(
  move: RegisterMove,
  seat: MoveSeat,
  args: Record<string, unknown>,
): Promise<Answer> {
  const shut = gateShut(move, seat);
  if (shut) return { isError: true, text: shut };
  const send = () => callTool(tool("channel"), { ...args, action: "register" });
  const claim = !!(args.spawned_for || launchBasis(args)); // callTool adds the same basis
  const raced = (a: Answer): boolean => a.isError && racedOpening(a.refusal);
  const gated = () => returning(move, seat, send, (text): Answer => ({ isError: true, text }));
  return onceMoreIfRaced(await gated(), raced, claim, move, seat, gated);
}

/**
 * The bridge's own register of a remembered `place` on the current session (the rebind, the
 * skills refresh, usage): its own post, the claim's echo checked. null — nothing sent: the
 * gate is shut, or a terminal claim refusal ends every own register of this session (#9959).
 */
export async function registerRaw(
  move: RegisterMove,
  seat: MoveSeat,
  place: Standing | null,
  freshSkills: boolean,
): Promise<JsonRpcMessage | null> {
  if (gateShut(move, seat) || claimRefusal()) return null;
  const send = () => postRegister(place, freshSkills);
  const gated = () => returning(move, seat, send, () => null);
  const first = await gated();
  const claim = !!registeredBasis(place ?? {}).spawned_for; // remembered by the send itself
  const raced = (m: JsonRpcMessage | null): boolean =>
    !!m?.result?.isError && racedOpening(refusalOf(m));
  return onceMoreIfRaced(first, raced, claim, move, seat, gated);
}

async function postRegister(
  place: Standing | null,
  freshSkills: boolean,
): Promise<JsonRpcMessage | null> {
  if (claimRefusal()) return null;
  const id = `${ID_PREFIX}bridge-restanding-${++state.reinitCounter}`;
  let reply: JsonRpcMessage | null = null;
  const basis = launchBasis({ ...place });
  rememberBasis({ ...place }, basis);
  const arguments_ = {
    ...place,
    ...placeFields(place ?? {}, freshSkills),
    ...registeredBasis(place ?? {}),
    action: "register",
  };
  await post(
    {
      jsonrpc: "2.0",
      id,
      method: "tools/call",
      params: { name: tool("channel"), arguments: arguments_ },
    },
    (m) => {
      if (m.id === id) {
        m = claimResult(arguments_, m, true);
        reply = m;
        if (!m.error && !m.result?.isError && place) noteSkills(place, arguments_.attrs.skills);
      }
    },
  );
  return reply as JsonRpcMessage | null;
}
