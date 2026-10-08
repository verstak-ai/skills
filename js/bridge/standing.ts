import { ID_PREFIX, SEAT_GONE_RE, STANDING, tool, UNATTRIBUTED_RE } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import { scoped } from "../shared/scope.ts";
import { FORM } from "./board.ts";
import { deafPlaceIn, deafSeatTaken } from "./deaf.ts";
import { errorMessage } from "./errors.ts";
import { standBesideAgain } from "./evicted.ts";
import { seatField, structuredOf } from "./fields.ts";
import { addPlace, noteStandingId, releaseStanding } from "./hold.ts";
import { normKarta, normName } from "./names.ts";
import { placeFields } from "./placefields.ts";
import { dropExtra, keyOfPlace, rememberPlace } from "./places.ts";
import { otherRealm } from "./realms.ts";
import { openedConcurrently, refusalOf } from "./refusal.ts";
import { debug, log } from "./streams.ts";
import { post, type Standing, state } from "./transport.ts";
import { type JsonRpcMessage } from "./types.ts";

const SEAT_EXPIRED = (): string => words(STANDING).seatExpired();

// Remember a registration the harness made, so it can be replayed into the next
// session. Only a call the server ACCEPTED is remembered: a refused one names no
// seat we may take.
export function noteStanding(msg: JsonRpcMessage, reply: JsonRpcMessage): void {
  const a = msg?.params?.arguments;
  if (msg?.params?.name !== tool("channel") || a?.action !== "register") return;
  if (reply?.error || reply?.result?.isError) return;
  const place = rememberedPlace(a.realm, a.karta, a.name);
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
const R = scoped(() => ({ inFlight: null as Promise<void> | null }));

// Put the remembered standing back on the current session — before the call
// that would otherwise land unattributed. Silent by contract: register releases
// nothing and evicts nobody, so replaying it costs one call and no state.
export async function ensureStanding(): Promise<void> {
  // Seat taken (4000) and standing beside failed: try again; never sign with a taken seat (#6706).
  if (state.standing && (await standBesideAgain())) return;
  return replayStanding();
}

function replayStanding(): Promise<void> {
  if (!state.standing || !state.sessionId) return Promise.resolve();
  if (state.standingSession === state.sessionId) return Promise.resolve();
  if (R.inFlight) return R.inFlight; // wait for the replay already running
  R.inFlight = (async () => {
    try {
      // A deaf seat another session may listen on is not re-bound (deaf.ts, #6706).
      const deaf = await deafSeatTaken();
      if (deaf) return log(`standing not re-registered: ${deaf}`);
      const got = await replayRegister(state.standing);
      if (got && !got.error && !got.result?.isError) {
        // Seats of other graphs in the same move, or their writes would land unattributed (#5838).
        if (await replayBeside()) state.standingSession = state.sessionId;
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
    } catch (e) {
      log(`re-registering the standing failed: ${errorMessage(e)}`);
    } finally {
      R.inFlight = null;
    }
  })();
  return R.inFlight;
}

export async function replayRegister(place: Standing | null): Promise<JsonRpcMessage | null> {
  const got = await registerOnce(place);
  if (!openedConcurrently(got)) return got;
  log("register refused by a concurrent opening (409, no rule) — registering again once");
  return registerOnce(place);
}

async function registerOnce(place: Standing | null): Promise<JsonRpcMessage | null> {
  const id = `${ID_PREFIX}bridge-restanding-${++state.reinitCounter}`;
  let reply: JsonRpcMessage | null = null;
  await post(
    {
      jsonrpc: "2.0",
      id,
      method: "tools/call",
      params: {
        name: tool("channel"),
        arguments: { ...place, ...placeFields(place ?? {}), action: "register" },
      },
    },
    (m) => {
      if (m.id === id) reply = m;
    },
  );
  return reply as JsonRpcMessage | null;
}

/** Re-register seats of other graphs; true — all in place (an expired one is forgotten). */
async function replayBeside(): Promise<boolean> {
  let whole = true;
  for (const place of [...state.places]) {
    // A deaf seat another session may listen on is not re-bound (deaf.ts, #6706).
    const deaf = deafPlaceIn(place.realm) ? await deafSeatTaken(place) : null;
    if (deaf) {
      log(`place ${keyOfPlace(place)} not re-registered: ${deaf}`);
      continue;
    }
    const got = await replayRegister(place);
    if (got && !got.error && !got.result?.isError) continue;
    const key = keyOfPlace(place);
    if (seatIsGone(got)) {
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
 * structuredContent (fields.ts), else the prose form (FORM.seatId). Neither — null.
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
