import { SEAT_GONE_RE, STANDING, tool, UNATTRIBUTED_RE } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import { scoped } from "../shared/scope.ts";
import { FORM } from "./board.ts";
import { deafPlaceIn, deafSeatTaken } from "./deaf.ts";
import { endedSince } from "./endedseats.ts";
import { errorMessage } from "./errors.ts";
import { standBesideAgain } from "./evicted.ts";
import { seatField, structuredOf } from "./fields.ts";
import { addPlace, isParked, noteStandingId, releaseStanding } from "./hold.ts";
import { normKarta, normName } from "./names.ts";
import { besideSeats, dropExtra, keyOfPlace, rememberPlace } from "./places.ts";
import {
  type MoveSeat,
  rateLimitedWait,
  type RegisterMove,
  registerMove,
  seatOfPlace,
  throughRateLimit,
} from "./ratelimit.ts";
import { otherRealm } from "./realms.ts";
import { type Refusal, refusalOf } from "./refusal.ts";
import { registerRaw } from "./registergate.ts";
import { noteSkills } from "./skillwatch.ts";
import { debug, log } from "./streams.ts";
import { seatLeftJudgedBy, type Standing, state } from "./transport.ts";
import { type JsonRpcMessage } from "./types.ts";

const SEAT_EXPIRED = (): string => words(STANDING).seatExpired();

/** The bridge's own seat left by word (hold.ts `isParked`): it returns by its own stand — here in `rebind`, and for the handshake sign (transport.ts `noteBinding`). */
const seatLeft = (): boolean => {
  const s = state.standing;
  return !!s && isParked(s.realm, s.karta, s.name ?? "");
};
// transport.ts cannot import this module back: the judge of its question is handed down at load.
seatLeftJudgedBy(seatLeft);

// Remember a registration the harness made, so it can be replayed into the next
// session. Only a call the server ACCEPTED is remembered: a refused one names no
// seat we may take.
export function noteStanding(msg: JsonRpcMessage, reply: JsonRpcMessage): void {
  const a = msg?.params?.arguments;
  if (msg?.params?.name !== tool("channel") || a?.action !== "register") return;
  if (reply?.error || reply?.result?.isError) return;
  const place = rememberedPlace(a.realm, a.karta, a.name);
  noteSkills(place, a.attrs?.skills);
  const prim = state.standing;
  if (prim && otherRealm(prim.realm, place.realm)) {
    // Another graph — a seat beside on the same channel, not a replacement of the main one (#5838).
    rememberPlace(place);
    addPlace(place);
  } else state.standing = place;
  noteStandingId(place.realm, standingIdOf(reply)); // for frames and busyness (#5838)
  state.standingSession = state.sessionId;
  debug(`standing remembered: ${a.name ?? "(unnamed)"} at karta ${a.karta} in ${a.realm}`);
}

/**
 * The binding is stored NORMALIZED — the form the key, the board and the one-standing
 * rule compare (#5140 B2, #5154 N1). The "agent" sentinel takes the role number the
 * bridge already remembers; without one the sentinel stays.
 */
export function rememberedPlace(
  realm: unknown,
  karta: unknown,
  name: unknown,
): { realm: string; karta: string; name?: string } {
  const k = normKarta(karta);
  // A role number is per graph: "agent" in another graph does not take the main seat's number.
  const prev = [state.standing, ...state.places].find((p) => p && !otherRealm(p.realm, realm));
  const n = typeof name === "string" ? normName(name) : undefined;
  return {
    realm: String(realm ?? ""),
    karta: k === "agent" && prev ? String(prev.karta) : k,
    ...(n !== undefined ? { name: n } : {}),
  };
}

// One replay at a time — and every concurrent caller WAITS for it. A flag that
// merely skipped the second caller let it through unattributed while the first
// was still re-registering (harnesses send calls in batches).
const R = scoped(() => ({ inFlight: null as Promise<string | null> | null }));

// Put the remembered standing back on the current session — before the call
// that would otherwise land unattributed. Silent by contract: register releases
// nothing and evicts nobody, so replaying it costs one call and no state.
// The stop word — the owner's stop met the rebind (#7439): every call that waited for it
// answers the stop and is not sent; null — go on.
export async function ensureStanding(): Promise<string | null> {
  // Seat taken (4000) and standing beside failed: try again; never sign with a taken seat (#6706).
  if (state.standing && (await standBesideAgain())) return null;
  return replayStanding();
}

function replayStanding(): Promise<string | null> {
  if (!state.standing || !state.sessionId) return Promise.resolve(null);
  if (state.standingSession === state.sessionId) return Promise.resolve(null);
  if (R.inFlight) return R.inFlight; // wait for the replay already running
  R.inFlight = (async () => {
    // One move: the main seat and every seat beside (#7439, #11030); a re-registration — the return gate.
    const move = registerMove("returns", undefined, true);
    try {
      await rebind(move);
    } catch (e) {
      log(`re-registering the standing failed: ${errorMessage(e)}`);
    } finally {
      R.inFlight = null;
    }
    // A stop met anywhere in the move holds at the border of every call that waited (#7439).
    const stop = move.stopped();
    if (stop) log("standing not re-registered: the session was stopped");
    return stop;
  })();
  return R.inFlight;
}

async function rebind(move: RegisterMove): Promise<void> {
  // A seat the bridge left (leave, nobody listening) is no rebind's: its register would not be
  // sent (registergate.ts), so its deaf check reads the board for nothing (#11351, #11337).
  // It returns by its own stand; the socket's state decides, not the board.
  if (seatLeft())
    return log("standing not re-registered: the seat was left — it returns by its own stand");
  // A deaf seat another session may listen on is not re-bound (deaf.ts, #6706).
  const deaf = await deafSeatTaken();
  if (deaf) return log(`standing not re-registered: ${deaf}`);
  const got = await replayRegister(state.standing, false, move);
  if (move.stopped()) return;
  if (got && !got.error && !got.result?.isError) {
    // Seats of other graphs in the same move, or their writes would land unattributed (#5838).
    const whole = await replayBeside(move);
    if (move.stopped()) return;
    if (whole) state.standingSession = state.sessionId;
    log(`standing re-registered on the new session (${state.standing?.name ?? "unnamed"})`);
  } else if (seatIsGone(got)) {
    // The seat itself is gone (expired while we were away) — say so and let
    // the agent take it back with connect; never guess a different name.
    // The hold goes with the binding: a socket kept for a seat the platform
    // no longer knows would make the bridge «lead» a place it cannot name,
    // and the next connect would replace it silently (#5168).
    log(`the standing's seat is gone, forgetting it: ${replyText(got).slice(0, 200)}`);
    state.standing = null;
    releaseStanding(SEAT_EXPIRED(), true);
  } else {
    // Any other refusal is the hour's, not the seat's: keep the memory and
    // try again before the next call. Forgetting here is what left a bridge
    // writing unattributed for the rest of a shift after one passing 503.
    log(
      `could not re-register the standing this time, will retry before the next call: ${replyText(got).slice(0, 200)}`,
    );
  }
}

/** A raw register reply (its own post, not callTool) as the rate-limit wait reads it (ratelimit.ts). */
const asRefusalView = (reply: JsonRpcMessage | null): { isError: boolean; refusal?: Refusal } => {
  const refusal = refusalOf(reply) ?? undefined;
  return { isError: !!(reply?.error || reply?.result?.isError), ...(refusal ? { refusal } : {}) };
};

/**
 * One register of `place` as a step of a move (ratelimit.ts RegisterMove, begun once at the
 * move's start): a rebind of several seats or a skills refresh passes the same move to every
 * seat, so a stop ends the whole move and the 429 deadline is one; a lone register begins its
 * own and says its kind (a usage snapshot: "once", no wait). `seat` — the main seat by default
 * (it waits out a 429 in a move that returns a seat); a seat beside passes its id and does not
 * wait. null — no register went (stopped, ended, a terminal claim refusal).
 */
export async function replayRegister(
  place: Standing | null,
  freshSkills: boolean,
  move: RegisterMove,
  seat: MoveSeat = seatOfPlace(place ?? { realm: "", karta: "" }, true), // exactly this seat's id
): Promise<JsonRpcMessage | null> {
  // A 429 rate_limited of the source is waited out inside the rebind (#10801); a 409 seat-open
  // race is registered once more by the gate itself (registergate.ts).
  const { r: got, waitS } = await throughRateLimit(
    () => registerRaw(move, seat, place, freshSkills),
    (g) => rateLimitedWait(asRefusalView(g)),
    move,
    seat,
  );
  if (waitS > 0) log(`register waited out a 429 rate limit of the source (${waitS} s)`);
  return got;
}

/**
 * Re-register seats of other graphs; true — all in place (an expired one is forgotten).
 * `move` — the rebind's register move: a stop ends it, no register of the rest; a seat beside
 * does not wait out a 429; one ended or forgotten meanwhile is not registered.
 */
async function replayBeside(move: RegisterMove): Promise<boolean> {
  let whole = true;
  // Ids taken now, before any wait: a seat forgotten later has no door to ask.
  for (const { place, id } of besideSeats()) {
    // A deaf seat another session may listen on is not re-bound (deaf.ts, #6706).
    const deaf = deafPlaceIn(place.realm) ? await deafSeatTaken(place) : null;
    if (deaf) {
      log(`place ${keyOfPlace(place)} not re-registered: ${deaf}`);
      continue;
    }
    const key = keyOfPlace(place);
    // Ended in the move (its owner took it off, its own release): forgotten, the rest go on.
    if (!state.places.includes(place)) {
      log(`place ${key} ended during the rebind — not re-registered`);
      continue;
    }
    const got = await replayRegister(place, false, move, { id, main: false });
    if (move.stopped())
      return (log("places beside not re-registered: the session was stopped"), false);
    if (got && !got.error && !got.result?.isError) continue;
    if (endedSince(id, move.since)) log(`place ${key} ended during the rebind — not re-registered`);
    else if (seatIsGone(got)) {
      log(
        `the place ${key} is gone at the platform, forgetting it: ${replyText(got).slice(0, 200)}`,
      );
      dropExtra(key, SEAT_EXPIRED(), true);
      state.places = state.places.filter((p) => keyOfPlace(p) !== key);
    } else {
      whole = false;
      log(`could not re-register ${key} this time, will retry: ${replyText(got).slice(0, 200)}`);
    }
  }
  return whole;
}

/**
 * The seat id from the channel tool's register answer: seats[0].seat_id of
 * structuredContent (fields.ts), else the prose form (FORM.seatId): the id on the line
 * after the seat-id line (observed on server 0.74.0; the English form is assumed).
 * Neither — null: the id is never guessed.
 */
export function standingIdOf(reply: JsonRpcMessage | null): string | null {
  return (
    seatField(structuredOf(reply), "register")?.seat_id ??
    FORM.seatId.exec(replyText(reply))?.[1] ??
    null
  );
}

export const replyText = (reply: JsonRpcMessage | null): string => {
  if (!reply) return "";
  if (reply.error) return JSON.stringify(reply.error);
  const content = reply.result?.content;
  return Array.isArray(content)
    ? content.map((c: { text?: string }) => c?.text ?? "").join("\n")
    : JSON.stringify(reply.result ?? "");
};

// "No seat to bind to" — the one refusal that means the remembered standing is
// no longer takeable by register. The API says it by rule (422, errors[0].rule =
// standing_not_held, carried in the refusal _meta, refusal.ts); another rule is
// another refusal; with no rule (a 404 or 409 of register, or no _meta at all) —
// the surface's own words, as before.
export const seatIsGone = (reply: JsonRpcMessage | null): boolean => {
  const rule = refusalOf(reply)?.rule;
  if (rule) return rule === "standing_not_held";
  return SEAT_GONE_RE.test(replyText(reply));
};

// The surface's marks for a call that ran WITHOUT its author: the channel
// refuses (409, nothing applied), the graph factories write and warn. Either
// way the binding this session believed in is gone. Anchored on the surface's
// CODES, never on prose: a node body read back may well contain the words
// "session not registered", and a lookup must not buy a register for that.
const UNATTRIBUTED_CODE = /write_unattributed\w*|session_not_registered/;
// A bare 409 is no mark: re-minting and version conflicts answer it too (#5380).
const UNATTRIBUTED_REFUSAL = UNATTRIBUTED_RE;

export const isUnattributed = (reply: JsonRpcMessage | null): boolean => {
  if (!reply) return false;
  // A refusal's rule, where the API named one, decides alone (refusal _meta).
  const rule = refusalOf(reply)?.rule;
  if (rule) return UNATTRIBUTED_CODE.test(rule);
  const text = replyText(reply);
  if (UNATTRIBUTED_CODE.test(text)) return true;
  return !!reply.result?.isError && UNATTRIBUTED_REFUSAL.test(text);
};
