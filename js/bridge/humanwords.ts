// Human words in flight (graph @nks/nks-dev, node #5953) — the bridge door's memory:
// the body of such a word is the human's word, not a batch frame (roomstack.ts). Key —
// numbering, case and entry number: the number is per case (node #6576, shared/numbering.ts).
import { type Frame } from "../shared/channel.ts";
import { numberedKey } from "../shared/numbering.ts";

/** How many human words in flight to remember until their body. */
const HUMAN_WORDS_KEEP = 200;

const rec = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" ? (v as Record<string, unknown>) : {};
export const idOf = (v: unknown): string =>
  typeof v === "number" || (typeof v === "string" && v) ? String(v) : "";
/** entry_id of a case entry: from the journal line, else from the envelope. */
const entryOf = (frame: Frame): string => {
  const f = rec(frame);
  return idOf(rec(f.line).entry_id ?? f.entry_id);
};
/** The frame's case (id, else seq); "" — a frame without a case, the entry is known by number alone. */
const caseOf = (frame: Frame): string => {
  const room = rec(rec(frame).room);
  return idOf(room.id) || idOf(room.seq);
};
const wordKey = (frame: Frame, entry: string): string =>
  entry ? numberedKey(frame, `${caseOf(frame)}|${entry}`) : "";
/** Whether frame held is the word whose body `body` carries (word — the word's entry in the body's case). */
export const isWordOf = (held: Frame, body: Frame, word: string): boolean =>
  !!word && wordKey(held, entryOf(held)) === wordKey(body, word);

export class HumanWords {
  private readonly words = new Set<string>();

  /** A human word in flight — by its own entry. */
  remember(said: Frame): void {
    const key = wordKey(said, entryOf(said));
    if (!key) return;
    this.words.add(key);
    const oldest = this.words.values().next();
    if (this.words.size > HUMAN_WORDS_KEEP && !oldest.done) this.words.delete(oldest.value);
  }

  /** true — the body carries a human word in flight (word — its entry in the body's case); forgotten. */
  forget(body: Frame, word: string): boolean {
    const key = wordKey(body, word);
    return !!key && this.words.delete(key);
  }
}
