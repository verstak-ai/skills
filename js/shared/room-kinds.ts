// Room kinds dictionary (graph @nks/nks-dev, nodes #5851, #5893): a technical room
// frame — its word and stack. Only `event_kind: "room.<kind>"` is decided here;
// rules are code (RULES, stackOf), words come from the delivery layer.
import { CASE_LINE, ROOM, ROOM_AUTO, ROOM_REL, VERDICT } from "../delivery/index.ts";
import { addressedMine, ASK_KINDS, askText, askValues } from "./asks.ts";
import { type Frame } from "./channel.ts";
import { words } from "./lang.ts";
import {
  addresseeOf,
  after,
  mineOf,
  myRole,
  need,
  obj,
  opt,
  pick,
  type Rec,
  str,
} from "./room-fields.ts";

export { addresseeOf, after, mineOf, myRole, obj, str };

/** Where a frame goes: interrupt the running turn or join the batch. */
export type Stack = "interrupt" | "batch";

/** Node record op (#6070) → its word; bound and an unknown op keep the plain node word. */
const NODE_OPS = {
  updated: "nodeUpdated",
  deleted: "nodeDeleted",
  undeleted: "nodeUndeleted",
} as const;

/**
 * stack — by the frame's stack (said, body); mine — interrupts when the target is
 * my standing or my role (invite); addressed — when the addressee is my seat.
 */
type Rule = Stack | "stack" | "mine" | "addressed";
const RULES: Readonly<Record<string, Rule>> = {
  said: "stack",
  body: "stack",
  closing: "interrupt",
  closed: "interrupt",
  objection: "interrupt",
  late_objection: "interrupt",
  invite: "mine",
  // Only the answer to the waiting seat interrupts (graph @nks/nks-dev, nodes #6655, #6868).
  ask: "batch",
  answer: "addressed",
  ack: "batch",
  progress: "batch",
  opened: "batch",
  joined: "batch",
  left: "batch",
  withdraw: "batch",
  node: "batch",
  link: "batch",
  // (graph @nks/nks-dev, node #4925)
  auto: "batch",
};

export interface RoomKind {
  /** Kind without the room. prefix. */
  kind: string;
  rule: Stack;
  /** The kind's word for the frame head. */
  words: string;
  author: string;
  /** Word phase (graph @nks/nks-dev, node #5953): said in flight — pending, cut off — aborted. */
  phase: "pending" | "aborted" | null;
  /** false — unknown kind: batch and a line in the bridge log. */
  known: boolean;
  /**
   * An addressed word not to me (graph @nks/nks-dev, node #6081): pair — key of the
   * (case, author, addressee) pair; counts — said, not its body; run(n) — the line of
   * a run of n words closed by this frame (0 — a lone body).
   */
  aside?: { pair: string; counts: boolean; run: (n: number) => string };
}

function authorOf(author: unknown): string {
  const a = obj(author);
  const name = str(a.name);
  const standing = str(a.standing);
  if (name) return standing ? `${name} (${standing})` : name;
  if (standing) return standing;
  return a.kind === "platform" ? words(CASE_LINE).platform() : "?";
}

/** Linked case in link and auto fields (graph @nks/nks-dev, node #5893): seq, else id, else a bare string. */
function roomOf(v: unknown): string {
  const r = obj(v);
  return str(r.seq) || str(r.id) || str(v);
}

function whoOf(fields: Rec): string {
  const st = obj(fields.standing);
  const ka = obj(fields.karta);
  const name = str(st.name) || str(ka.name);
  const addr = str(st.standing);
  return name && addr ? `${name} (${addr})` : name || addr;
}

/** The word of a known kind, from the frame's values. */
function kindText(kind: string, v: Rec, f: Rec, pending: boolean, aborted: boolean): string {
  const W = words(ROOM);
  const n = (k: string): string => need(v[k]);
  const lapsed = obj(obj(f.line).author).kind === "platform";
  if (pending) return W.saidPending(n("author"));
  if (aborted) return lapsed ? W.bodyLapsed(n("refers_to")) : W.bodyAborted(n("refers_to"));
  if (kind === "auto")
    return pick(words(ROOM_AUTO), str(v.code))?.(n("room")) ?? W.auto(n("code"), n("room"));
  const ask = askText(kind, str(v.cause), v);
  if (ask !== undefined) return ask;
  const reasoning = opt("; ", v.reasoning);
  const op = kind === "node" ? pick(NODE_OPS, str(v.op)) : undefined;
  if (op) return W[op](n("seq"), n("name"), reasoning);
  switch (kind) {
    case "said":
      return W.said(n("author"));
    case "body":
      return W.body(n("refers_to"), n("author"));
    case "closing":
      return W.closing(n("author"), n("ends_at"), str(v.evidence));
    case "closed":
      return W.closed(n("reason"));
    case "objection":
      return W.objection(n("author"), n("reason"));
    case "late_objection":
      return W.lateObjection(n("author"));
    case "progress":
      return W.progress(n("key"), n("done"), n("verdict"), opt(" — ", v.note), n("author"));
    case "opened":
      return W.opened(n("author"));
    case "joined":
      return W.joined(n("who"));
    case "left":
      return W.left(n("who"), str(v.reason));
    case "invite":
      return W.invite(n("author"), n("who"));
    case "withdraw":
      return W.withdraw(n("author"));
    case "node":
      return W.node(n("seq"), n("name"), n("realm"), reasoning);
    case "link":
      return W.link(n("room"), n("rel"));
    default:
      return "";
  }
}

/** A technical room frame (event_kind room.*) — kind, rule, word; null — not decided here. */
export function roomKind(frame: Frame | null | undefined): RoomKind | null {
  if (!frame || typeof frame !== "object") return null;
  const f = frame as Rec;
  const ek = f.event_kind;
  if (typeof ek !== "string" || !ek.startsWith("room.")) return null;
  const kind = ek.slice(5);
  const line = obj(f.line);
  const fields = obj(line.fields);
  const key = str(line.key);
  const mine = mineOf(f);
  const node = obj(fields.node);
  const cause = kind === "invite" ? str(fields.cause) : "";
  // A body line's author is the body record's; the word's author is in_reply_to_from (graph @nks/nks-dev, node #5893).
  const byWhom = authorOf(
    kind === "body" && Object.keys(obj(f.in_reply_to_from)).length
      ? f.in_reply_to_from
      : line.author,
  );
  const values: Rec = {
    kind,
    cause,
    author: byWhom,
    key,
    done: line.done,
    verdict: pick(words(VERDICT), str(line.verdict))?.() ?? line.verdict,
    note: line.note,
    ends_at: fields.ends_at,
    evidence: Array.isArray(fields.evidence) ? fields.evidence.map(str).join(", ") : "",
    entry_id: line.entry_id ?? f.entry_id,
    refers_to: str(line.refers_to) || str(f.in_reply_to) || str(obj(f.word).entry_id),
    reason: fields.reason,
    target: after(key, "invite:"),
    // Observed live: the invite key carries the id, the invitee's name is in the line fields (standing/karta with name).
    // Joined and left — fields.standing (a timed-out leave is written by the platform, api 0.89.6), else the author;
    // a role call by cause — fields.karta (graph @nks/nks-dev, node #6870).
    who:
      kind === "joined" || kind === "left"
        ? whoOf({ standing: fields.standing }) || byWhom
        : (cause ? whoOf({ karta: fields.karta }) : whoOf(fields)) || after(key, "invite:"),
    standing: str(fields.gone_standing) || addresseeOf(fields.gone_standing)?.label,
    ...(ASK_KINDS.has(kind) ? askValues(kind, line, fields) : {}),
    room: roomOf(fields.room) || after(key, "link:"),
    rel: pick(words(ROOM_REL), str(fields.rel))?.() ?? fields.rel,
    code: fields.code,
    op: fields.op,
    seq: node.seq,
    name: node.name,
    realm: node.realm,
    // A node delta's reasoning is the record's body, not a field (graph @nks/nks-dev, node #6070).
    reasoning: kind === "node" ? line.done || f.body : undefined,
    withdraws: fields.withdraws,
  };
  const W = words(ROOM);
  const rule = RULES[kind];
  const author = str(values.author);
  if (!rule)
    return {
      kind,
      rule: "batch",
      words: W.unknown(need(kind)),
      author,
      phase: null,
      known: false,
    };
  // Addressed word (graph @nks/nks-dev, node #6081): not to me — a fact in the batch, no body;
  // the body carries its word's addressee and joins the same pair.
  const word = kind === "said" || kind === "body";
  const withheld = word && f.body_withheld === true;
  const to = word
    ? (addresseeOf(f.addressee) ?? (withheld ? { addr: ["?"], label: "?" } : null))
    : null;
  // The addressee left the case: the word goes to everyone, printed as any word.
  const addresseeLeft = f.addressee_left === true || fields.addressee_left === true;
  if (
    to &&
    !addresseeLeft &&
    (withheld || (mine.length && !to.addr.some((a) => mine.includes(a))))
  ) {
    const counts = kind === "said";
    const pair = JSON.stringify([roomOf(f.room), author, to.addr[0]]);
    const id = need(counts ? values.entry_id : values.refers_to);
    const by = need(values.author);
    const addressee = need(to.label);
    const run = (n: number): string =>
      n === 0
        ? W.asideBody(by, addressee, id)
        : n > 1
          ? W.asideRun(by, addressee, W.messages(n), id)
          : W.aside(by, addressee, id);
    const aside = { pair, counts, run };
    const words = run(counts ? 1 : 0);
    return { kind, rule: "batch", words, author, phase: null, known: true, aside };
  }
  const pending = kind === "said" && f.body_pending === true && !str(f.body) && !str(line.done);
  const aborted = kind === "body" && fields.aborted === true;
  let text = kindText(kind, values, f, pending, aborted);
  if (kind === "closing") {
    // may_object: objects {id, standing, name, karta} (api 0.88.0) or bare id strings.
    const may = Array.isArray(fields.may_object)
      ? fields.may_object.map((m) => (typeof m === "string" ? m : str(obj(m).id)))
      : [];
    const myId = str(f.to_standing_id);
    const mayI = !!myId && may.includes(myId);
    text += "; " + (mayI ? W.closingMay(need(values.entry_id)) : W.closingNot());
  }
  const stack: Stack =
    rule === "stack"
      ? f.stack === "defer"
        ? "batch"
        : "interrupt"
      : rule === "mine"
        ? mine.includes(str(values.target)) || myRole(f, fields)
          ? "interrupt"
          : "batch"
        : rule === "addressed"
          ? addressedMine(f)
            ? "interrupt"
            : "batch"
          : rule;
  // A word in flight and a cut-off never wake: batch at any stack.
  const phase = pending ? "pending" : aborted ? "aborted" : null;
  return { kind, rule: phase ? "batch" : stack, words: text, author, phase, known: true };
}

export const byKind = (frame: Frame | null | undefined): boolean => roomKind(frame) !== null;

/** Frame path: with event_kind — the kind's rule; otherwise the frame's own stack (defer — batch). */
export const stackOf = (frame: Frame | null | undefined): Stack =>
  roomKind(frame)?.rule ??
  ((frame as Rec | null | undefined)?.stack === "defer" ? "batch" : "interrupt");
