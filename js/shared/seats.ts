// The seat a case record names and whether it is mine (graph @nks/nks-dev, nodes #6574,
// #6867; case №1249 [19]): by id first (seatIs), the envelope's addressee only as a helper.
import { ASK_KINDS, byMe } from "./asks.ts";
import { type Frame } from "./channel.ts";
import { obj, type Rec, seatIs } from "./room-fields.ts";
import { wordSeats } from "./room-kinds.ts";

/**
 * Seats a record names: ask — fields.to.standing (the api writes the chosen seat there
 * for a role alone too); answer, ack, retract — fields.to; a word — its fields.to; all —
 * the envelope's addressee, a helper string that may be null.
 */
function seatsOf(f: Rec, kind: string): unknown[] {
  const to = obj(obj(obj(f.line).fields).to);
  if (kind === "said" || kind === "body") return wordSeats(f);
  return [
    kind === "ask" ? to.standing : ASK_KINDS.has(kind) || kind === "retract" ? to : null,
    f.addressee,
  ];
}

/** The named seat: mine, another's (false), none named (null); my own question is an echo. */
export function seatOf(frame: Frame, kind: string): boolean | null {
  const f = frame as Rec;
  if (kind === "ask" && byMe(f)) return false;
  return seatIs(f, ...seatsOf(f, kind));
}

/** The record names my seat explicitly. */
export const namedMine = (frame: Frame, kind: string): boolean => seatOf(frame, kind) === true;
