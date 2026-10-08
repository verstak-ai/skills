// Whether a case record is addressed to the reader's seat — the delivery rule
// (graph @nks/nks-dev, node #6574): only addressed records enter the turn as text.
import { closesMine, noteAsk, processAsks } from "./askmemory.ts";
import { ASK_KINDS, askedMine, askFromPerson } from "./asks.ts";
import { classifyOrigin, type Frame } from "./channel.ts";
import { numberedKey } from "./numbering.ts";
import { addresseeOf, after, byKind, mineOf, myRole, obj, roomKind, str } from "./room-kinds.ts";

type Rec = Record<string, unknown>;

/** Kinds important by themselves: they require the reader's action (objection window — #4928). */
const LOUD_KINDS = new Set(["closing", "closed", "objection", "late_objection"]);

/** Words in flight addressed to the seat: key — seat, case, word record. */
const addressedWords = new Set<string>();
const WORDS_KEPT = 512;
/** Key of a two-phase word: a said in flight has its own record, a body the one it belongs to. */
export function wordKeyOf(frame: Frame): string {
  const f = frame as Rec;
  const line = obj(f.line);
  const entry =
    roomKind(frame)?.kind === "body"
      ? str(line.refers_to) || str(f.in_reply_to) || str(obj(f.word).entry_id)
      : str(line.entry_id ?? f.entry_id);
  // Record numbers are per case: the key is in the frame's count (#6576).
  return numberedKey(
    frame,
    `${mineOf(f)[0] ?? ""}|${str(obj(f.room).id) || str(obj(f.room).seq)}|${entry}`,
  );
}
function rememberWord(key: string): void {
  addressedWords.add(key);
  for (const old of addressedWords) {
    if (addressedWords.size <= WORDS_KEPT) break;
    addressedWords.delete(old);
  }
}

/** Kinds that close a question to me (askmemory.ts). */
const ASK_CLOSERS = new Set(["ask", "answer", "ack", "progress"]);
/**
 * The question memory decides once per frame: addressing is asked many times
 * (batch, count, folding), while the frame itself changes the memory.
 */
const askDecided = new Map<string, boolean>();
function askMemory(f: Rec): boolean {
  // Decided by the bridge (bridge/addressmark.ts, seat memory on disk): its addressed is the answer.
  if (f.asks_decided === true) return false;
  const id = str(f.id) || wordKeyOf(f as Frame);
  const was = askDecided.get(id);
  if (was !== undefined) return was;
  const hit = closesMine(processAsks, f);
  noteAsk(processAsks, f);
  askDecided.set(id, hit);
  for (const old of askDecided.keys()) {
    if (askDecided.size <= WORDS_KEPT) break;
    askDecided.delete(old);
  }
  return hit;
}

/**
 * Whether the frame is addressed to the reader's seat — rule #6574: a word to it
 * (addressee), a reply to its record (in_reply_to_from, #5954), an invite or its
 * withdrawal to me, or something important: an important word (#4939), closing and
 * objection kinds, a person's word; a two-phase body counts as its word (#5953).
 * An addressed word not to me (#6081) and other case records are counted
 * (frame-text.ts). A frame not from a case goes as text; an old-form case frame
 * without event_kind keeps the old path.
 */
export function addressedToMine(frame: Frame | null | undefined): boolean {
  if (!frame) return false;
  const f = frame as Rec;
  const room = obj(f.room);
  if (!str(room.seq) && !str(room.id)) return true; // not a case record
  if (!byKind(frame)) return true; // old form — old path
  const line = obj(f.line);
  const fields = obj(line.fields);
  const rk = roomKind(frame);
  if (rk?.aside) return false; // a word not to me (#6081): a fact without a body
  // Question memory before any decision: an accepted answer to me closes the key even if addressed above.
  const closesAsk = !!rk && ASK_CLOSERS.has(rk.kind) && askMemory(f);
  const mine = mineOf(f);
  const hit = (v: unknown): boolean => {
    const a = addresseeOf(v);
    return !!a && mine.length > 0 && a.addr.some((x) => mine.includes(x));
  };
  if (rk?.kind === "body") {
    // A body's in_reply_to_from is the author of the word itself (#5893 §4.6) and the
    // word's kind is in word.line: the body is addressed when its word was, as
    // remembered at the said phase; the bridge, seeing both phases, marks addressed
    // (bridge/addressmark.ts) for a watchdog that gets the body in a new process.
    const word = obj(f.word);
    if (
      f.addressed === true ||
      hit(f.addressee) ||
      str(obj(obj(word.line).fields).kind) === "important" ||
      addressedWords.has(wordKeyOf(frame))
    )
      return true;
  } else if (
    // A word to me, a reply to my record (#5954), marked important; a word in flight
    // is remembered, since its body comes as a second phase without these marks.
    hit(f.addressee) ||
    hit(f.in_reply_to_from) ||
    str(f.said) === "important" ||
    str(fields.kind) === "important"
  ) {
    if (rk?.phase === "pending") rememberWord(wordKeyOf(frame));
    return true;
  }
  // A question to my role or seat (#6867), or what closes a question to me.
  if (rk?.kind === "ask" && askedMine(f, fields)) return true;
  if (closesAsk || (rk && ASK_CLOSERS.has(rk.kind) && f.addressed === true)) return true;
  // An invite to me or its withdrawal: key invite:<my seat>; a role invite — to my role.
  if (rk?.kind === "invite" || rk?.kind === "withdraw") {
    if (mine.includes(after(str(line.key), "invite:"))) return true;
    if (rk.kind === "invite" && myRole(f, fields)) return true;
  }
  if (rk && LOUD_KINDS.has(rk.kind)) return true;
  // Question kinds have an addressee (#6867): a person's answer to someone else is not a word to me.
  if ((rk && ASK_KINDS.has(rk.kind)) || askFromPerson(f)) return false;
  // The bridge marks origin on a person's body (roomstack.ts, #5953): its provenance does not carry it.
  return (frame.origin ?? classifyOrigin(frame, str(f.karta_seq) || undefined)) === "human";
}
