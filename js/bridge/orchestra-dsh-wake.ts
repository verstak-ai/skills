// What wakes a sleeping dsh call, and where its sleep's cursor starts (graph @nks/nks-dev,
// node #10995). A word whose body has not landed (body_pending) is not yet a word: the cursor
// stays before it, and the same number with its body is its first reading (#4949).
import type { CaseEntry } from "./orchestra-case-read.ts";

/** The platform's addressing wakes: a said or an ask to a standing id the call's seat had, an
 * ask to the invited role's karta uuid, an answer to the seat's own ask. A new invite of the
 * role raises a fresh call by the ordinary path — it never wakes the sleeping one. */
export function wakesBy(
  seats: ReadonlySet<string>,
  karta: string | undefined,
  asks: Record<string, string>,
  entries: CaseEntry[],
): (e: CaseEntry) => boolean {
  // An answer may answer an ask of this same page: the page's own asks resolve first.
  const pageAsks = new Map(
    entries
      .filter((e) => e.kind === "ask" && e.author_standing_id)
      .map((e) => [e.n, e.author_standing_id as string]),
  );
  return (e) => {
    if (e.author_standing_id && seats.has(e.author_standing_id)) return false;
    if (
      (e.kind === "said" || e.kind === "ask") &&
      !!e.to_standing_id &&
      seats.has(e.to_standing_id)
    )
      return true;
    if (e.kind === "ask" && !!karta && e.to_karta_node_id === karta) return true;
    if (e.kind === "answer" && e.in_reply_to !== null) {
      const author = pageAsks.get(e.in_reply_to) ?? asks[String(e.in_reply_to)];
      return !!author && seats.has(author);
    }
    return false;
  };
}

/**
 * The cursor a sleep starts from (PR review of 8.14.0): the seat's own last word, unless a
 * waking word before it still waits for its body — then the cursor stays before that word,
 * and the waking words with a body between it and the seat's last word, which the live agent
 * already had, are kept as seen so they do not wake again. `floor` — the cursor never walks
 * back behind the call's invite or an earlier sleep's cursor.
 */
export function entryCursor(
  entries: CaseEntry[],
  wakes: (e: CaseEntry) => boolean,
  last: number,
  floor: number,
): { cursor: number; seen: number[] } {
  const cursor = Math.max(last, floor);
  const pending = entries.find(
    (e) => e.n > floor && e.n <= cursor && e.body_pending && !e.aborted && wakes(e),
  )?.n;
  if (pending === undefined) return { cursor, seen: [] };
  const seen = entries
    .filter((e) => e.n > pending && e.n <= cursor && !e.body_pending && wakes(e))
    .map((e) => e.n);
  return { cursor: pending - 1, seen };
}
