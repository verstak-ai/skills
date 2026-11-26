// The source's pace limit met by register (graph @nks/nks-dev, node #10801): the bridge
// is the second belt behind the platform's fuse — a 429 rate_limited refusal names its
// Retry-After in the body, `errors[0].data.retry_after_secs` of the ProblemDetail (api
// 0.202.0; the HTTP answer also carries a Retry-After header, but the refusal view holds
// no headers — refusal.ts reads the _meta refusal the api builds from the body), and the
// move's main seat waits exactly that inside the move and registers again, so an honest burst
// over the source's allowance still takes its seat; a seat beside does not wait. Any other 429 (source_paused — the fuse's own
// word is "do not retry") and every other refusal return as they came. The wait shares
// the reissue loop's stop watch (standmoves.ts, #7552).
import { RATE_LIMIT_WAIT_S } from "../shared/ratelimit.ts";
import { endedSince } from "./endedseats.ts";
import { type StopWatch, stopWatch } from "./holdstate.ts";
import { heldIdOf } from "./places.ts";
import { type Refusal } from "./refusal.ts";
import { awaitReissue } from "./standmoves.ts";
import { type Standing } from "./transport.ts";

/** At most this many register tries behind one move, however long each waited. */
const RATE_LIMIT_TRIES = 3;

/**
 * Seconds the api names on a 429 rate_limited refusal of register — the ProblemDetail's
 * `errors[0].data.retry_after_secs`, an integer the api puts into the refusal's `data`
 * verbatim (refusal.ts; #10801); `data` also carries `key` ("opening" at a seat
 * registration) and sometimes `kind`, and carries no `retry_after`. null — any other
 * answer, or a rate_limited without the seconds: without the source's own word how
 * long, the move does not guess.
 */
export function rateLimitedWait(r: { isError: boolean; refusal?: Refusal }): number | null {
  if (!r.isError || r.refusal?.rule !== "rate_limited" || r.refusal.status !== 429) return null;
  const said = r.refusal.data?.retry_after_secs;
  const s = typeof said === "number" ? said : Number(said);
  return Number.isFinite(s) && s > 0 ? s : null;
}

export interface RateLimited<R> {
  /**
   * the last answer, whatever it is — the caller reads it exactly as without the wait;
   * null — the move was stopped, or this seat ended, before the first call: nothing was sent
   */
  r: R | null;
  /** seconds actually waited out behind this call (the waits that ran, added up) */
  waitS: number;
  /** the stop word: the move was stopped before a call or during a wait; null — not stopped */
  stop: string | null;
  /** this seat ended in the move (endedseats.ts): no more register of it; the move goes on */
  ended: boolean;
}

/**
 * One register move (#7439, #10801, #11030): the rebind, the disk return, the skills refresh,
 * the explicit stand — each begins one and passes it to every register of the move, the
 * seats beside included. It carries its halves together, so no path takes one without the
 * others: the stop watch counted from the move's start (holdstate.ts stopWatch) — a stop
 * ends the whole move; the start itself — a seat ended since then (endedseats.ts) is not
 * registered, the rest go on; the deadline — the start plus the 429 wait budget
 * (../shared/ratelimit.ts): a wait that would end past it is not started — the client's cap holds.
 * Its kind says whether it may wait at all, chosen by every move that begins: only a move that
 * returns a seat ("returns") waits out a 429; any other register ("once" — the usage snapshot)
 * sends once and its refusal stands, so a late retry cannot outlive the caller's interest.
 */
export interface RegisterMove {
  /** the stop word since the move began; null — not stopped */
  readonly stopped: StopWatch;
  /** Date.now() at the move's start */
  readonly since: number;
  /** Date.now() past which no wait of the move may end */
  readonly deadline: number;
  /** whether its main seat waits out a 429 rate_limited */
  readonly waits: boolean;
  /**
   * a re-registration of seats the machine had (a rebind after a lost session, a return from
   * disk after a reload or a handover, a skills refresh after a self-update): it goes through
   * the machine's return gate (returngate.ts, #11375)
   */
  readonly regate: boolean;
}
/** "returns" — the move returns a seat (rebind, disk return, stand, skills refresh): it waits. */
export type MoveKind = "returns" | "once";
export function registerMove(
  kind: MoveKind,
  stopped: StopWatch = stopWatch(),
  regate = false,
): RegisterMove {
  const since = Date.now();
  const waits = kind === "returns";
  return { stopped, since, deadline: since + RATE_LIMIT_WAIT_S * 1000, waits, regate };
}

/**
 * The seat a register is for: its id, if the bridge knows it exactly (graph, role and name —
 * the hold, hello, a connect answer), and whether it is the move's main seat: only the main seat
 * waits out a 429; a seat beside answers its refusal at once — the next move brings it back.
 * `place` — the seat itself, when its id may come only later (a connect answer of the same
 * move): seatIdOf looks it up by place before each send and keeps it once found.
 */
export interface MoveSeat {
  id: string | null;
  main: boolean;
  place?: Standing;
}

/** The seat's id for the journal of ended seats (endedseats.ts): known, or found now and kept. */
export function seatIdOf(seat: MoveSeat): string | null {
  if (!seat.id && seat.place) seat.id = heldIdOf(seat.place);
  return seat.id;
}

/** The seat `place` of a move: its id as held now (kept by seatIdOf once a later answer gives it). */
export const seatOfPlace = (place: Standing, main: boolean): MoveSeat => ({
  id: heldIdOf(place),
  main,
  place,
});

/**
 * `call` registers the seat `seat` — the main seat answered 429 rate_limited: wait out the
 * api's Retry-After and call again, inside the same move: at most RATE_LIMIT_TRIES tries, and a
 * wait that would end past the move's deadline is not started — the refusal stands. Before
 * every call, the first one too, and through the wait the move is asked: stopped — the move
 * ends with no further call, the stopped session stands nowhere, its next seat sees the same
 * watch; this seat ended since the move began (endedseats.ts) — no call of it (`ended`), the
 * caller goes on. `waitOf` says the seconds of an answer, null — not a rate limit.
 */
export async function throughRateLimit<R>(
  call: () => Promise<R>,
  waitOf: (r: R) => number | null,
  move: RegisterMove,
  seat: MoveSeat,
): Promise<RateLimited<R>> {
  const ended = (): boolean => endedSince(seatIdOf(seat), move.since);
  let waitS = 0;
  let last: R | null = null;
  for (let tries = 1; ; tries++) {
    const stop = move.stopped();
    if (stop || ended()) return { r: last, waitS, stop, ended: !stop };
    const r = (last = await call());
    const wait = seat.main && move.waits ? waitOf(r) : null;
    if (wait === null || tries >= RATE_LIMIT_TRIES || Date.now() + wait * 1000 > move.deadline)
      return { r, waitS, stop: null, ended: false };
    const cut = await awaitReissue(wait, ended, move.stopped); // the seat's end cuts it too
    if (cut.stop || cut.own) continue; // cut short: the loop's head returns
    waitS += wait;
  }
}

/**
 * throughRateLimit over an Answer-shaped reply (call.ts) with rateLimitedWait as the waitOf —
 * the register paths: the rebind (standing.ts), the disk return (resume.ts, besideback.ts),
 * the explicit stand's return (stand.ts). One wait, shared, never a second one beside it.
 */
export const throughRateLimitAnswer = <R extends { isError: boolean; refusal?: Refusal }>(
  call: () => Promise<R>,
  move: RegisterMove,
  seat: MoveSeat,
): Promise<RateLimited<R>> => throughRateLimit(call, rateLimitedWait, move, seat);
