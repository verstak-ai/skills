// Refusals of the stand tool that name the working move (graph @nks/nks-dev, node #5036 item 8;
// counterexamples #7552–#7556): the api's rule in the surface's word, the call whole.
import type { Lang } from "../lang.ts";
import { tool } from "../protocol.ts";

export interface StandMovesWords {
  /**
   * 409 channel_already_stands_in_realm (#7556); call — the full call of the seat already standing in the graph, or empty;
   * roleOpen — a call by the name from the api's refusal, the seat's role not named (#5418): its line on the board gives it.
   */
  standsInRealm: (
    realm: string,
    call: string,
    board: string,
    leave: string,
    roleOpen: boolean,
  ) => string;
  /** The full call taking the seat this session held (#7554). */
  standAgain: (call: string) => string;
  /** take revoked this session's former seat (#7553). */
  priorReleased: (prior: string) => string;
  /** The provisional seat of the root's seating (#777) gave way to the seat the agent named. */
  provisionalReplaced: (prior: string) => string;
  priorKept: (prior: string, text: string, revoke: string) => string;
  /** take onto another main name with seats beside (#6499): a refusal before connect; beside — the seats, revokes — their revoke, keep — the former name. */
  besideHoldsMain: (
    prior: string,
    asked: string,
    beside: string,
    revokes: string,
    keep: string,
  ) => string;
  /** 429 on a socket reopen (#7552): the call waited for the outcome; own — the bridge itself reopened the socket. */
  reissueWaited: (seconds: number, own: boolean) => string;
  /** take failed after connect (#7553): the seat just taken is revoked, the session stays on the former one. */
  moveUndone: (asked: string, prior: string) => string;
  /** the seat just taken could not be revoked: text — the refusal, revoke — the revoke call. */
  moveNotUndone: (asked: string, text: string, revoke: string) => string;
}

export const STAND_MOVES: Readonly<Record<Lang, StandMovesWords>> = {
  en: {
    standsInRealm: (realm, call, board, leave, roleOpen) =>
      `Refused (409): this bridge's channel already stands in the graph ${realm} with another seat — the platform holds no second seat of one channel in one graph. ` +
      (call
        ? `Stand as it: ${call}${roleOpen ? ` — the seat's karta is in its line on the board ${board}` : ""}. `
        : `Its name is this channel's line on the board ${board}; stand as it: ${tool("stand")}(realm="${realm}", karta, name=<that name>). `) +
      `If a new name is what you need, release the former one first: ${leave}, then repeat the call.`,
    standAgain: (call) =>
      `The bridge does not hold this session's seat now — take it with the full call: ${call} (status can go in the same call).`,
    priorReleased: (prior) =>
      `this session's former seat ${prior} is revoked: take moves the session to the taken seat, it does not add a second one`,
    provisionalReplaced: (prior) =>
      `the auto-seating's seat ${prior} is replaced: it was provisional — the explicit call stood on the named one and revoked it`,
    priorKept: (prior, text, revoke) =>
      `this session's former seat ${prior} is not revoked (${text}) — while it lives, cases will ask for from_standing; revoke it: ${revoke}`,
    besideHoldsMain: (prior, asked, beside, revokes, keep) =>
      `Refused: seats beside in other graphs stand on this session's main seat ${prior} — ${beside}. Moving to ${asked} would open a new channel: the seats beside would lose hearing, and ${prior} would not be revoked while they stand. Nothing was touched. Move: revoke the seats beside first — ${revokes}, then repeat the call; or keep the former name: ${keep}.`,
    reissueWaited: (seconds, own) =>
      own
        ? `yours — returned: the bridge itself was reopening this seat's socket at that moment, the call waited for its outcome (${seconds} s)`
        : `this seat's socket was just reopened — the call waited out the platform's threshold (${seconds} s) and took the seat`,
    moveUndone: (asked, prior) =>
      `The move did not happen: the seat ${asked} just taken is revoked, the session stays on its former seat ${prior} — its only one.`,
    moveNotUndone: (asked, text, revoke) =>
      `The seat ${asked} just taken could not be revoked (${text}) — revoke it: ${revoke}`,
  },
};
