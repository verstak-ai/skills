import { FRAME_MARK, FRAME_TEXT, ROOM } from "../delivery/index.ts";
import { addressedToMine, closedQuestion } from "./addressed.ts";
import { classifyOrigin, type Frame, type FrameOrigin } from "./channel.ts";
import { compactCounts } from "./frame-format.ts";
import { superseded } from "./keyfold.ts";
import { words as wordsOf } from "./lang.ts";
import { addresseeOf, need, opt } from "./room-fields.ts";
import { roomKind } from "./room-kinds.ts";
import { isLifeCheck } from "./seen.ts";

const W = () => wordsOf(ROOM);
const T = () => wordsOf(FRAME_TEXT);

/** These kinds already name their reference in the structured caption (#4957). */
const CAPTION_REPLY = new Set(["body", "answer", "ack", "retract"]);

type Rec = Record<string, unknown>;
const rec = (v: unknown): Rec => (v && typeof v === "object" ? (v as Rec) : {});
const idOf = (v: unknown): string =>
  typeof v === "number" || (typeof v === "string" && v) ? String(v) : "";

/** Case opening (zachin) in a line — how many characters. */
const ZACHIN = 40;

/** The case a frame is grouped by — graph and number; a frame outside a case by its id. */
function groupKey(f: Frame): string {
  const c = caseOf(f);
  return c ? JSON.stringify([c.realm, c.room]) : idOf((f as Rec).id) || "?";
}

/** Cases of the batch frames — by case, in order of first appearance. */
function casesOf(frames: Frame[]): Frame[][] {
  const by = new Map<string, Frame[]>();
  for (const f of frames) {
    const key = groupKey(f);
    const got = by.get(key);
    if (got) got.push(f);
    else by.set(key, [f]);
  }
  return [...by.values()];
}

/** Case of the frame: number (seq, else id), opening, graph; null — not a case frame. */
function caseOf(frame: Frame): { room: string; zachin: string; realm: string } | null {
  const f = frame as Rec;
  const room = rec(f.room);
  const n = idOf(room.seq) || idOf(room.id);
  if (!n) return null;
  const z = typeof room.zachin === "string" ? [...room.zachin.trim()] : [];
  const zachin = z.length > ZACHIN ? z.slice(0, ZACHIN).join("") + "…" : z.join("");
  const realm = idOf(room.realm) || idOf(f.realm);
  return { room: n, zachin, realm };
}

/** Case key of the frame — the watchdog tells by it whether the case was in the batch. */
export const caseKey = (frame: Frame): string => caseOf(frame)?.room ?? "";

function caseHead(frame: Frame, withZachin: boolean): string {
  const c = caseOf(frame);
  if (!c) return "";
  const no = W().case(need(c.room));
  return withZachin && c.zachin ? `${no} «${c.zachin}»` : no;
}

/** Who speaks — one word from provenance: human, role with seat, sibling, platform. */
function whoOf(frame: Frame, withPlace: boolean): string {
  const p = frame.provenance ?? {};
  const origin = frame.origin ?? classifyOrigin(frame);
  if (origin === "platform") return W().whoPlatform();
  if (p.via === "graph" && p.from_karta_seq == null && !p.from_standing) return W().whoGraph();
  const place = withPlace && p.from_standing ? ` (${p.from_standing})` : "";
  if (origin === "human") return W().whoHuman(opt(" @", p.user)) + place;
  const karta = p.from_karta_seq;
  if (karta == null) return p.from_standing ?? "";
  return (origin === "sibling" ? W().whoSibling : W().whoRole)(need(karta)) + place;
}

/** Frame text: a line as is, a JSON body (graph event) in one line. */
function textOf(frame: Frame): string {
  const rk = roomKind(frame);
  if (rk?.aside || rk?.bodyInWords) return "";
  const b = frame.body;
  return typeof b === "string" ? b : b === undefined ? "" : JSON.stringify(b);
}

/** Tail of the first line: reply to a record, staleness, fate of the body. */
function tail(frame: Frame, withReply: boolean): string {
  const f = frame as Rec;
  const parts: string[] = [];
  const to = idOf(f.in_reply_to) || idOf(frame.provenance?.in_reply_to);
  if (withReply && to) parts.push(W().replyTo(need(to)));
  if (frame.stale === true) parts.push(W().stale());
  if (typeof frame.body_read === "string" && frame.body_read !== "history")
    parts.push(W().bodyRead(need(frame.body_read)));
  return parts.length ? `, ${parts.join(", ")}` : "";
}

/** Text a plugin puts into the session: its first line carries the delivery's mark. */
export const markFrame = (text: string): string => `${FRAME_MARK} ${text}`;

/**
 * The reply line under a person's direct word (#9128): the answer reaches the window
 * under the word only as send with in_reply_to, and send is executable only in full —
 * the frame's graph, the person's role (from_karta_seq, else user_karta_seq) and the
 * NAME of their seat (from_standing; an id does not name a seat for send). A part
 * missing is said aloud instead of silence, so the doer does not hunt for an address;
 * a doer's word carries no line at all.
 */
function humanWordReply(frame: Frame, origin: FrameOrigin): string {
  if (origin !== "human") return "";
  const f = frame as Rec;
  const p = rec(frame.provenance);
  const karta = idOf(p.from_karta_seq) || idOf(p.user_karta_seq);
  const missing = {
    realm: !idOf(f.realm),
    karta: !karta,
    standing: !idOf(p.from_standing),
    id: !idOf(frame.id),
  };
  return Object.values(missing).every((x) => !x)
    ? T().humanWordReply(need(f.realm), need(karta), need(p.from_standing), need(frame.id))
    : T().noReplyAddress(missing);
}

/**
 * A standing frame, short, into the agent's turn — the same in pi, OpenCode and the
 * watchdogs (graph @nks/nks-dev, node #6081): the first line is case, record, kind and
 * who; then the text once. Rule #6574: a case record not addressed to the seat goes
 * as a count (caseCountLine). The bridge has already checked the frame; provenance and
 * envelope are never printed raw (case history reads the whole record), and
 * delivery never tells the agent to answer — but for the life check and a person's
 * word from the window (#9128). withCase false — the line stands under its case's count,
 * which names the case (underCounts, #9654).
 */
export function frameToText(frame: Frame | null | undefined, raw: string, withCase = true): string {
  if (!frame) return raw;
  const f = frame as Rec;
  const origin = frame.origin ?? classifyOrigin(frame);
  const text = textOf(frame);
  const c = caseOf(frame);
  if (c) {
    if (!addressedToMine(frame)) return caseCountLine([frame]);
    const rk = roomKind(frame);
    const line = rec(f.line);
    const entry = idOf(f.entry_id) || idOf(line.entry_id);
    const words = rk
      ? rk.words
      : W().legacy(need(f.kind), typeof f.stack === "string" ? f.stack : "");
    const author = rk?.author && !words.includes(rk.author) ? rk.author : "";
    const who = rk || origin === "platform" ? "" : whoOf(frame, false);
    const by = [author, who].filter(Boolean).join(", ");
    const withReply = !rk || !CAPTION_REPLY.has(rk.kind);
    const label = [withCase ? caseHead(frame, true) : "", entry ? `[${entry}]` : ""];
    const head =
      `${[...label.filter(Boolean), words].join(" ")}` +
      `${by ? ` — ${by}` : ""}${tail(frame, withReply)}`;
    const lines = [head];
    if (text && !words.includes(text.trim())) lines.push(text);
    return lines.join("\n");
  }
  // Direct word, wake-up, graph event — no instruction to answer (#6574); two name the way
  // to answer: the life check (case #1046) — a seat silent past it is put out — and a
  // person's word from the window (#9128): without an address its reply is lost.
  const lines = [`${whoOf(frame, true) || "?"}${tail(frame, true)}`];
  if (text) lines.push(text);
  const reply = humanWordReply(frame, origin);
  if (reply) lines.push(reply);
  if (isLifeCheck(frame)) lines.push(T().lifeCheckSeat(warnedSeat(frame)), T().lifeCheckReply());
  return lines.join("\n");
}

/** The seat a life check warned — the name of its to_standing (the bridge fills it by id); "" — none. */
export const warnedSeat = (frame: Frame): string =>
  typeof frame.to_standing === "string" ? frame.to_standing.replace(/^.*:/, "") : "";

/**
 * A case batch frame for the watchdog in one line: case, [entry_id], kind, author,
 * full text; the case opening on its first appearance. An addressed word not to
 * me (#6081) has no body; run — the number of words in the pair's run closed by this
 * frame (foldAsides), absent for a lone frame. No envelope: batchPointer reads it whole.
 * withCase false — under its case's count, which names the case (underCounts, #9654).
 */
export function batchLine(frame: Frame, run?: number, withZachin = true, withCase = true): string {
  const f = frame as Rec;
  const rk = roomKind(frame);
  const head = withCase ? caseHead(frame, withZachin) : "";
  const pre = head ? `${head} ` : "";
  if (rk?.aside) return pre + (run === undefined ? rk.words : rk.aside.run(run));
  const line = rec(f.line);
  const e = f.entry_id ?? line.entry_id ?? f.id;
  const entry = typeof e === "number" || typeof e === "string" ? e : "?";
  const words = (rk?.words ?? T().frame(typeof f.id === "string" ? f.id : "?"))
    .replace(/\s+/g, " ")
    .trim();
  const author = rk?.author && !words.includes(rk.author) ? ` — ${rk.author}` : "";
  const text = textOf(frame).replace(/\s+/g, " ").trim();
  const dup = !!text && words.includes(text);
  return `${pre}[${entry}] ${words}${author}${tail(frame, !rk || !CAPTION_REPLY.has(rk.kind))}${text && !dup ? `: ${text}` : ""}`;
}

/**
 * Batch folding (#6081): consecutive addressed words not to me of one pair and their
 * bodies become one line. Per frame: null — folded into the next one's line; n — the
 * line of a run of n words (a body is not counted; 0 — a lone body). Outside a run — 1.
 */
export function foldAsides(frames: Frame[]): (number | null)[] {
  const asides = frames.map((f) => roomKind(f)?.aside ?? null);
  const out: (number | null)[] = [];
  let n = 0;
  asides.forEach((a, i) => {
    if (!a) {
      n = 0;
      out.push(1);
      return;
    }
    n = (i > 0 && asides[i - 1]?.pair === a.pair ? n : 0) + (a.counts ? 1 : 0);
    out.push(asides[i + 1]?.pair === a.pair ? null : n);
  });
  return out;
}

/** A record shown as text: with its case's label, or under its case's count without it. */
export interface Shown {
  frame: Frame;
  text: (withCase: boolean) => string;
}

/** Batch lines — only those addressed to the seat (#6574); the rest counted in the head. */
export function batchShown(frames: Frame[]): Shown[] {
  const seen = new Set<string>();
  return frames.flatMap((f) => {
    if (!addressedToMine(f)) return [];
    const key = caseKey(f);
    const first = !seen.has(key);
    seen.add(key);
    return [{ frame: f, text: (withCase: boolean) => batchLine(f, undefined, first, withCase) }];
  });
}

/** Addressed records as their whole text (frameToText), cut at `cap` characters: stale and wake-up batches. */
export const textShown = (frames: Frame[], cap: number): Shown[] =>
  frames
    .filter((f) => addressedToMine(f))
    .map((f) => ({
      frame: f,
      text: (withCase: boolean) => {
        const t = [...frameToText(f, JSON.stringify(f), withCase)];
        return t.length > cap ? t.slice(0, cap).join("") + "…" : t.join("");
      },
    }));

/** A batch as text: counts of `counted` per case, the addressed of `frames` under their case's count. */
export const batchText = (counted: Frame[], frames: Frame[] = counted): string =>
  underCounts(counted, batchShown(frames)).join("\n");

/**
 * Count lines with the shown records under their case's count (#9654): a case is named
 * once, in its count — its records carry no number or opening. A shown record whose case
 * is not counted keeps its label and follows the counts.
 */
export function underCounts(counted: Frame[], shown: Shown[], incomplete = false): string[] {
  const groups = casesOf(counted).filter((group) => caseOf(group[0]));
  const placed = new Set<Shown>();
  const under = (group: Frame[]): string[] => {
    const key = groupKey(group[0]);
    return shown
      .filter((s) => caseOf(s.frame) && groupKey(s.frame) === key)
      .map((s) => (placed.add(s), s.text(false)));
  };
  const rest = (): string[] => shown.filter((s) => !placed.has(s)).map((s) => s.text(true));
  if (!groups.length) return rest();
  if (!compactCounts())
    return [...groups.flatMap((g) => [legacyCountLine(g, incomplete), ...under(g)]), ...rest()];
  if (groups.length === 1 && !incomplete)
    return [caseCountLine(groups[0]), ...under(groups[0]), ...rest()];
  const pointer = incomplete ? T().inFull("") : batchPointer(groups.flat());
  if (groups.length === 1)
    return [`${countText(groups[0], true)}; ${pointer}.`, ...under(groups[0]), ...rest()];
  return [...groups.flatMap((g) => [countText(g, true), ...under(g)]), `${pointer}.`, ...rest()];
}

/**
 * Waiting counts and the records shown with them in one output (#9654): a shown case record
 * not to the seat joins its case's count (#6574), not a count line of its own; the shown to
 * the seat are counted in their case and stand under it. Nothing counted — the shown alone.
 */
export function countsWithShown(counted: Frame[], shown: Shown[]): string[] {
  const asCount = shown.filter((s) => caseOf(s.frame) && !addressedToMine(s.frame));
  const lines = shown.filter((s) => !asCount.includes(s));
  const all = [...counted, ...asCount.map((s) => s.frame).filter((f) => !counted.includes(f))];
  if (!all.length) return lines.map((s) => s.text(true));
  const extra = lines.map((s) => s.frame).filter((f) => caseOf(f) && !all.includes(f));
  return underCounts([...all, ...extra], lines);
}

/**
 * Another's record that closed my question (closes_mine, set by addressedToMine): who
 * answered or whom it is re-asked of — its text stays in history (#6867, #6574).
 */
function closingOf(frame: Frame): string {
  const n = closedQuestion(frame); // decided here: independent of the count's order
  if (!n) return "";
  const rk = roomKind(frame);
  const to = rec(rec(rec(rec(frame).line).fields).to);
  if (rk?.kind !== "ask") return T().askAnswered(n, need(rk?.author));
  const seat = addresseeOf(to.standing)?.label || idOf(rec(to.karta).name);
  return T().askMoved(n, need(seat));
}

/**
 * Case count line — rule #6574: how many records came, how many to the seat, where to
 * read in full. frames are records of one case; superseded key lines are counted
 * apart (keyfold.ts, #6718).
 */
export function caseCountLine(frames: Frame[]): string {
  const count = countText(frames, false);
  if (!compactCounts()) return legacyCountLine(frames, false);
  return count ? `${count}; ${batchPointer(frames)}.` : "";
}

function legacyCountLine(frames: Frame[], incomplete: boolean): string {
  const count = countText(frames, false);
  if (!count) return "";
  const yours = frames.some((f) => addressedToMine(f)) ? "; " : T().noneYours();
  return count + yours + (incomplete ? T().inFull("") : batchPointer(frames)) + ".";
}

function countText(frames: Frame[], withCursor: boolean): string {
  const c = frames.length ? caseOf(frames[0]) : null;
  if (!c) return "";
  const mineN = frames.filter((f) => addressedToMine(f)).length;
  const gone = superseded(frames).size;
  const head = caseHead(frames[0], true);
  const cursor = withCursor ? cursorOf(frames) : null;
  const n = frames.length - gone;
  return (
    T().count(head, n, mineN) +
    (gone ? T().supersededLines(gone) : "") +
    frames.map(closingOf).join("") +
    (cursor ? ` · realm=${JSON.stringify(cursor.realm)}, since=${cursor.since}` : "")
  );
}

/**
 * Batch count lines — one per case (#6574), above all its records: "yours N" counts the
 * addressed ones that follow as lines below, so the count does not contradict them.
 */
export const caseCountLines = (frames: Frame[], incomplete = false): string[] =>
  underCounts(frames, [], incomplete);

/**
 * Case batch head: counts per case and where to read in full (#6574). The pointer closes the
 * counts — in one case's count line, after several cases' counts and so after their records
 * under them (underCounts); nothing trims a batch's text, bodies are cut per record (textShown).
 */
export function batchHead(frames: Frame[]): string {
  return caseCountLines(frames).join("\n");
}

/**
 * How to read the batch in full: per case, history with since before the batch's
 * first record (since exists from mcp 0.84.2).
 */
function cursorOf(frames: Frame[]): { realm: string; room: string; since: number } | null {
  const first = frames[0];
  const c = first && caseOf(first);
  if (!c?.realm) return null;
  const room = rec((first as Rec).room);
  const entries = frames.map((f) => idOf(f.entry_id ?? rec((f as Rec).line).entry_id));
  if (entries.some((e) => !e || !Number.isSafeInteger(Number(e)) || Number(e) < 1)) return null;
  return {
    realm: c.realm,
    room: JSON.stringify(room.seq ?? room.id),
    since: Math.min(...entries.map(Number)) - 1,
  };
}

export function batchPointer(frames: Frame[]): string {
  const cursors = casesOf(frames).map(cursorOf);
  const c = cursors[0];
  if (!c || cursors.some((cursor) => !cursor)) return T().inFull("");
  if (cursors.length > 1)
    return T().inFull(T().caseHistory('realm=R, action="history", room=N', "S"));
  return T().inFull(
    T().caseHistory(`realm=${JSON.stringify(c.realm)}, action="history", room=${c.room}`, c.since),
  );
}
