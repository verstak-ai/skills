// Memory of questions to me (graph @nks/nks-dev, nodes #6867, #6868): which question on
// a case key is asked to me and still open. It closes when the last line of its key is
// no longer it: a withdrawal, an answer by another seat of my role, a re-ask to another
// (each told to the seat in words); an acceptance closes it silently. A fresh question on
// a key where mine already closed is not to me.
//
// The store is a set of strings: per process, and the seat's .asks for the bridge
// (bridge/askdisk.ts), so the exit watchdog and a restarted bridge see closings.
// Entries: open — `<base>#<ask number>`, closed — `off:<base>#<number>`; base — reader's
// seat, case and line key in the frame's count (#6576).
import { askedMine, byMe } from "./asks.ts";
import { type Frame } from "./channel.ts";
import { numberedKey } from "./numbering.ts";
import { mineOf, obj, type Rec, str } from "./room-fields.ts";

/** Memory store. */
export interface AskStore {
  has(s: string): boolean;
  add(s: string): void;
  keys(): Iterable<string>;
}

const baseOf = (frame: Rec): string =>
  numberedKey(
    frame as Frame,
    `${mineOf(frame)[0] ?? ""}|${str(obj(frame.room).id) || str(obj(frame.room).seq)}|${str(obj(frame.line).key)}`,
  );
const lineOf = (frame: Rec): Rec => obj(frame.line);
const kindOf = (frame: Rec): string => str(lineOf(frame).kind);
const numOf = (frame: Rec): string => str(lineOf(frame).entry_id ?? frame.entry_id);

/** Numbers of my open questions on the frame's key. */
function openOn(store: AskStore, frame: Rec): string[] {
  const base = `${baseOf(frame)}#`;
  const out: string[] = [];
  for (const s of store.keys())
    if (s.startsWith(base) && !store.has(`off:${s}`)) out.push(s.slice(base.length));
  return out;
}

/** The number the frame closes by name: withdraws of a withdrawal, the question of an answer. */
const namedOf = (frame: Rec): string => {
  const kind = kindOf(frame);
  if (kind === "progress") return str(obj(lineOf(frame).fields).withdraws);
  if (kind === "answer") return str(lineOf(frame).refers_to) || str(frame.in_reply_to);
  return "";
};
/** My question with this number on the frame's key is open — without scanning the memory. */
const isOpen = (store: AskStore, frame: Rec, n: string): boolean => {
  const k = `${baseOf(frame)}#${n}`;
  return !!n && store.has(k) && !store.has(`off:${k}`);
};

/**
 * The frame closes my open question: its withdrawal, an answer to it, a re-ask to
 * another on its key. An own record is an echo. Frequent work lines are checked by
 * number; the memory is scanned only for rare asks.
 */
export function closesMine(store: AskStore, frame: Rec): boolean {
  if (byMe(frame) || !str(lineOf(frame).key)) return false;
  const kind = kindOf(frame);
  if (kind === "progress" || kind === "answer") return isOpen(store, frame, namedOf(frame));
  return (
    kind === "ask" &&
    !askedMine(frame, obj(lineOf(frame).fields)) &&
    openOn(store, frame).length > 0
  );
}

/**
 * Note the frame: a question to me opens; its withdrawal closes it; an acceptance or a
 * re-ask closes the whole key; an answer by another seat of my role closes its
 * question. My own answer does not close: the question may still be re-asked (#6778).
 */
export function noteAsk(store: AskStore, frame: Rec): void {
  if (!str(lineOf(frame).key)) return;
  const kind = kindOf(frame);
  const fields = obj(lineOf(frame).fields);
  const base = `${baseOf(frame)}#`;
  if (kind === "ask" && askedMine(frame, fields)) {
    // One open question per key; a repeat of the same frame does not close itself.
    const own = numOf(frame);
    if (store.has(`${base}${own}`)) return;
    for (const n of openOn(store, frame)) store.add(`off:${base}${n}`);
    store.add(`${base}${own}`);
    return;
  }
  // Only closing my open question is written: others' withdrawals and answers do not grow the memory.
  if (kind === "progress" || (kind === "answer" && !byMe(frame))) {
    const n = namedOf(frame);
    if (isOpen(store, frame, n)) store.add(`off:${base}${n}`);
  } else if ((kind === "ack" || kind === "ask") && !byMe(frame))
    for (const n of openOn(store, frame)) store.add(`off:${base}${n}`);
}

const ASKS_KEPT = 512;
const kept = new Set<string>();
/** This process's memory; the oldest entries go past the limit. */
export const processAsks: AskStore = {
  has: (s) => kept.has(s),
  add: (s) => {
    kept.add(s);
    for (const old of kept) {
      if (kept.size <= ASKS_KEPT) break;
      kept.delete(old);
    }
  },
  keys: () => kept,
};
