// The stand call's move is undone, not half kept (graph @nks/nks-dev, nodes #7439, #7553). One
// guard at the exit of the whole call: the session stopped since the call began — every seat
// the call took or bound again is taken off quietly, the session is left with no seat, and the
// answer is the stop word. register refused after connect — the new seat is taken off and the
// session goes back to the seat it stood on, unless it was stopped meanwhile.
import { STAND_MOVES, type StandMovesWords, tool } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import { type Answer, callTool, short } from "./call.ts";
import { forgetSeat, holdsStanding, holdStanding, keyOf } from "./hold.ts";
import { H, setRevokingOwn, stoppedDuring, stoppedInMove, stopsNow } from "./holdstate.ts";
import { holdWords } from "./holdwords.ts";
import { placeFields } from "./placefields.ts";
import { refusedWord, type Reissued, revokeCall, throughReissue } from "./standmoves.ts";
import { sw } from "./standwords.ts";
import { type Standing, state } from "./transport.ts";
import { type JsonRpcMessage } from "./types.ts";

const mw = (): StandMovesWords => words(STAND_MOVES);

type Seat = { realm: string; karta: string | number; name: string };

/** The main seat's socket before the move: the former seat is held on it again if the move is undone. */
export interface HeldAddress {
  url: string;
  statusUrl: string | null;
}
export const heldAddress = (realm: string, prior: Standing | null): HeldAddress | null =>
  prior && holdsStanding(realm, prior.karta, prior.name ?? "") && H.currentUrl
    ? { url: H.currentUrl, statusUrl: H.currentStatusUrl }
    : null;

/**
 * The move's connect — `first`, a 429 of a socket reissue waited out and connected `again`;
 * `taken` — the seat this connect took.
 */
export async function connectInMove(
  before: number,
  seat: Required<Standing>,
  again: () => Promise<Answer>,
  first: () => Promise<Answer>,
): Promise<Reissued & { taken: Required<Standing> | null }> {
  const re = await throughReissue(await first(), again, seat, before);
  return { ...re, taken: !re.c.isError && !re.own ? seat : null };
}

/**
 * Take a seat this call took off again, quietly: held — as an own revoke, not a stop; unheld —
 * the platform alone. A refusal for the seat the owner's stop took off is that stop's: no word.
 * null — revoked; otherwise the word with the revoke call.
 */
async function dropTaken(seat: Seat): Promise<string | null> {
  const { realm, karta, name } = seat;
  const own = holdsStanding(realm, karta, name);
  if (own) setRevokingOwn(true);
  const args = { action: "revoke", realm, karta: String(karta), standing: name };
  const r = await callTool(tool("channel"), args).finally(() => {
    if (own) setRevokingOwn(false);
  });
  if (r.isError && !own && H.stopped.key === keyOf(realm, karta, name)) return null;
  if (r.isError) return mw().moveNotUndone(name, short(r.text, 160), revokeCall(realm, seat));
  if (own && holdsStanding(realm, karta, name)) forgetSeat(holdWords().revokedOwn());
  return null;
}

/**
 * The stop guard around the whole stand call (#7439): every answer passes it. Stopped since the
 * call began — the seats the call's connect or register took or bound again are revoked, the
 * binding goes (no seat to write from), and the answer is the stop word, nothing held.
 */
export async function stopGuard(
  msg: JsonRpcMessage,
  run: () => Promise<JsonRpcMessage>,
): Promise<JsonRpcMessage> {
  const before = stopsNow();
  const outer = { since: H.moveSince, taken: H.taken };
  H.moveSince = outer.since ?? before; // a connect answered after a stop is not held (absorb.ts)
  H.taken = [];
  let reply: JsonRpcMessage;
  let taken: NonNullable<typeof H.taken>;
  try {
    reply = await run();
  } finally {
    taken = H.taken ?? [];
    Object.assign(H, { moveSince: outer.since, taken: outer.taken });
  }
  const stop = stoppedDuring(before);
  if (!stop) {
    outer.taken?.push(...taken);
    return reply;
  }
  const left: string[] = [];
  for (const seat of taken) {
    const word = await dropTaken(seat);
    if (word) left.push(word);
  }
  forgetSeat(stop);
  const text = [stop, ...left].join("\n");
  return {
    jsonrpc: "2.0",
    id: msg.id,
    result: { isError: true, content: [{ type: "text", text }] },
  };
}

/**
 * register `r` refused right after connect. A move (`taken` from `prior`) fails: the new seat
 * goes, the former one is held again on its socket and registered, so it stays the session's
 * only seat (#7553). Otherwise the seat stays taken. The answer's words.
 */
export async function registerRefused(
  r: Answer,
  realm: string,
  taken: Required<Standing> | null,
  prior: Standing | null,
  addr: HeldAddress | null,
): Promise<string> {
  const text = short(r.text);
  if (!taken || !prior) return refusedWord("register", r, realm, sw().takenButRegister(text));
  const refusal = refusedWord("register", r, realm, sw().refused("register", text));
  // Stopped since the call began: the former seat is not held again (held lifts a harness's
  // wake ban that the stop does not restore); the stop guard takes the new one off and answers.
  if (stoppedInMove()) return refusal;
  const left = await dropTaken(taken);
  if (left) return `${refusal}\n${left}`;
  if (stoppedInMove()) return refusal;
  state.standing = { ...prior };
  if (addr) holdStanding(addr.url, addr.statusUrl);
  const back = await callTool(tool("channel"), {
    action: "register",
    ...prior,
    ...placeFields(prior, true),
  });
  const word = mw().moveUndone(taken.name, prior.name ?? "");
  return `${refusal}\n${back.isError ? `${word} register: ${short(back.text, 160)}` : word}`;
}
