// The root seating's words to the model (rootseat.ts): which one a seating's outcome gets.
import { COVER, ROOT_SEAT } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import type { HeldSeat } from "./rootseat-by.ts";

const W = () => words(ROOT_SEAT);

/** The word is one line: a refusal's prose is folded and cut. */
const oneLine = (text: string): string => {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length > 300 ? `${t.slice(0, 299)}\u2026` : t;
};

/** The cover names no seat outside a repository: nothing to align, the reason only. */
export const notSeatedWord = (why: string): string => W().notSeated(why);

/** The bridge or the server refused the seating. */
export const refusedWord = (text: string): string => W().notSeated(W().refused(oneLine(text)));

/** The prompt's term ran out: the request goes without a seat. */
export const lateWord = (ms: number): string => W().notSeated(W().late(Math.round(ms / 100) / 10));

/** The cover names no seat: align the repository, the seating repeats by itself. */
export const realignWord = (why: string): string => W().realign(why, COVER.file);

/** The word of a seat taken or held: own by the cover, or another the model must know of. */
export function heldWord(
  r:
    | { place: string; realm?: string; provisional?: boolean }
    | { other: HeldSeat; uncompared?: string },
  realm: string,
  karta: string,
): string {
  if ("other" in r) {
    const { name, karta: k, realm: held } = r.other;
    return r.uncompared
      ? W().heldUncompared(name, k, held || W().unknownRealm(), r.uncompared)
      : W().ownOther(name, k, held || W().unknownRealm());
  }
  return (r.provisional === true ? W().seated : W().ownSeated)(
    r.place,
    karta,
    r.realm ?? realm,
    COVER.file,
  );
}
