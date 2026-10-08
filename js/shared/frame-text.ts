import { FRAME_TEXT, ROOM } from "../delivery/index.ts";
import { addressedToMine } from "./addressed.ts";
import { classifyOrigin, type Frame } from "./channel.ts";
import { superseded } from "./keyfold.ts";
import { words as wordsOf } from "./lang.ts";
import { need, opt } from "./room-fields.ts";
import { roomKind } from "./room-kinds.ts";

const W = () => wordsOf(ROOM);
const T = () => wordsOf(FRAME_TEXT);

type Rec = Record<string, unknown>;
const rec = (v: unknown): Rec => (v && typeof v === "object" ? (v as Rec) : {});
const idOf = (v: unknown): string =>
  typeof v === "number" || (typeof v === "string" && v) ? String(v) : "";

/** Case opening (zachin) in a line — how many characters. */
const ZACHIN = 40;

/** Cases of the batch frames — by case, in order of first appearance. */
function casesOf(frames: Frame[]): Frame[][] {
  const by = new Map<string, Frame[]>();
  for (const f of frames) {
    const key = caseKey(f) || idOf((f as Rec).id) || "?";
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
  if (roomKind(frame)?.aside) return ""; // an addressed word not to me (#6081) has no body
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

/**
 * A standing frame, short, into the agent's turn — the same in pi, OpenCode and the
 * watchdogs (graph @nks/nks-dev, node #6081): the first line is case, record, kind and
 * who; then the text once. Rule #6574: a case record not addressed to the seat goes
 * as a count (caseCountLine).
 */
export function frameToText(frame: Frame | null | undefined, raw: string): string {
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
    const who = origin === "platform" ? "" : whoOf(frame, false);
    const by = [author, who].filter(Boolean).join(", ");
    const withReply = rk?.kind !== "body"; // a body's in_reply_to is its word, already in the words
    const head =
      `${caseHead(frame, true)}${entry ? ` [${entry}]` : ""} ${words}` +
      `${by ? ` — ${by}` : ""}${tail(frame, withReply)}`;
    const lines = [head];
    if (text && !words.includes(text.trim())) lines.push(text);
    return lines.join("\n");
  }
  // Direct word, wake-up, graph event — no instruction to answer (#6574).
  const lines = [`${whoOf(frame, true) || "?"}${tail(frame, true)}`];
  if (text) lines.push(text);
  return lines.join("\n");
}

/** Start of the frame text in a batch line — how many characters. */
const BATCH_TEXT = 160;

/**
 * A case batch frame for the watchdog in one line: case, [entry_id], kind, author,
 * start of text; the case opening on its first appearance. An addressed word not to
 * me (#6081) has no body; run — the number of words in the pair's run closed by this
 * frame (foldAsides).
 */
export function batchLine(frame: Frame, run?: number, withZachin = true): string {
  const f = frame as Rec;
  const rk = roomKind(frame);
  const head = caseHead(frame, withZachin);
  const pre = head ? `${head} ` : "";
  if (rk?.aside) return pre + (run === undefined ? rk.words : rk.aside.run(run));
  const line = rec(f.line);
  const e = f.entry_id ?? line.entry_id ?? f.id;
  const entry = typeof e === "number" || typeof e === "string" ? e : "?";
  const words = rk?.words ?? T().frame(typeof f.id === "string" ? f.id : "?");
  const author = rk?.author && !words.includes(rk.author) ? ` — ${rk.author}` : "";
  const flat = [...textOf(frame).replace(/\s+/g, " ").trim()];
  const text = flat.length > BATCH_TEXT ? flat.slice(0, BATCH_TEXT).join("") + "…" : flat.join("");
  const dup = !!text && words.includes(text);
  return `${pre}[${entry}] ${words}${author}${tail(frame, rk?.kind !== "body")}${text && !dup ? `: ${text}` : ""}`;
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

/** Batch lines — only those addressed to the seat (#6574), as text; the rest counted in the head. */
export function batchLines(frames: Frame[]): string[] {
  const seen = new Set<string>();
  return frames.flatMap((f) => {
    if (!addressedToMine(f)) return [];
    const key = caseKey(f);
    const first = !seen.has(key);
    seen.add(key);
    return [batchLine(f, undefined, first)];
  });
}

/**
 * Case count line — rule #6574: how many records came, how many to the seat, where to
 * read in full. frames are records of one case; superseded key lines are counted
 * apart (keyfold.ts, #6718).
 */
export function caseCountLine(frames: Frame[]): string {
  const c = frames.length ? caseOf(frames[0]) : null;
  if (!c) return "";
  const mineN = frames.filter((f) => addressedToMine(f)).length;
  const gone = superseded(frames).size;
  const head = caseHead(frames[0], true);
  const yours = mineN ? T().yoursBelow() : T().noneYours();
  const n = frames.length - gone;
  return (
    T().count(head, n, mineN) +
    (gone ? T().supersededLines(gone) : "") +
    yours +
    batchPointer(frames) +
    "."
  );
}

/** Batch count lines — one per case (#6574), above all its records. */
export function caseCountLines(frames: Frame[]): string[] {
  return casesOf(frames).map(caseCountLine).filter(Boolean);
}

/** Case batch head: counts per case and where to read in full (#6574) — at the head, since cutting trims the tail. */
export function batchHead(frames: Frame[]): string {
  return caseCountLines(frames).join("\n");
}

/**
 * How to read the batch in full: per case, history with since before the batch's
 * first record (since exists from mcp 0.84.2).
 */
export function batchPointer(frames: Frame[]): string {
  // realm is always required by the case tool.
  const since = new Map<string, number>();
  for (const frame of frames) {
    const f = frame as Record<string, unknown>;
    const room = (f.room ?? {}) as Record<string, unknown>;
    const line = (f.line ?? {}) as Record<string, unknown>;
    const n = room.seq ?? room.id;
    const e = Number(f.entry_id ?? line.entry_id);
    if ((typeof n !== "number" && typeof n !== "string") || !Number.isFinite(e)) continue;
    const realm = room.realm ?? f.realm;
    const args =
      (typeof realm === "string" && realm ? `realm="${realm}", ` : "") +
      `action="history", room=${typeof n === "number" ? String(n) : JSON.stringify(n)}`;
    since.set(args, Math.min(since.get(args) ?? e, e));
  }
  return T().inFull([...since].map(([args, e]) => T().caseHistory(args, e - 1)).join("; "));
}
