// Case record kinds and the short frame (ROOM), platform auto records by code (ROOM_AUTO),
// case links by rel (ROOM_REL), a line's verdict (VERDICT); arguments are ready strings.
import type { Lang } from "../lang.ts";

export interface RoomWords {
  said: (author: string) => string;
  saidPending: (author: string) => string;
  aside: (author: string, addressee: string, word: string) => string;
  asideRun: (author: string, addressee: string, count: string, word: string) => string;
  asideBody: (author: string, addressee: string, word: string) => string;
  messages: (n: number) => string;
  body: (refersTo: string, author: string) => string;
  bodyAborted: (refersTo: string) => string;
  bodyLapsed: (refersTo: string) => string;
  closing: (author: string, endsAt: string, evidence: string) => string;
  closingMay: (entryId: string) => string;
  closingNot: () => string;
  closed: (reason: string) => string;
  objection: (author: string, reason: string) => string;
  lateObjection: (author: string) => string;
  progress: (key: string, done: string, verdict: string, note: string, author: string) => string;
  opened: (author: string) => string;
  joined: (who: string) => string;
  left: (who: string, reason: string) => string;
  invite: (author: string, who: string) => string;
  withdraw: (author: string) => string;
  node: (seq: string, name: string, realm: string, reasoning: string) => string;
  nodeUpdated: (seq: string, name: string, reasoning: string) => string;
  nodeDeleted: (seq: string, name: string, reasoning: string) => string;
  nodeUndeleted: (seq: string, name: string, reasoning: string) => string;
  link: (room: string, rel: string) => string;
  auto: (code: string, room: string) => string;
  unknown: (kind: string) => string;
  case: (room: string) => string;
  replyTo: (id: string) => string;
  stale: () => string;
  bodyRead: (how: string) => string;
  whoHuman: (user: string) => string;
  whoRole: (karta: string) => string;
  whoSibling: (karta: string) => string;
  whoPlatform: () => string;
  whoGraph: () => string;
  legacy: (kind: string, stack: string) => string;
}

export const ROOM: Readonly<Record<Lang, RoomWords>> = {
  en: {
    said: (author) => `message from ${author}`,
    saidPending: (author) => `message from ${author} in flight — the text follows`,
    aside: (author, addressee, word) => `${author} → ${addressee}: message [${word}]`,
    asideRun: (author, addressee, count, word) =>
      `${author} → ${addressee}: ${count} (last [${word}])`,
    asideBody: (author, addressee, word) => `${author} → ${addressee}: text of message [${word}]`,
    messages: (n) => `${n} ${n === 1 ? "message" : "messages"}`,
    body: (refersTo, author) => `text of message [${refersTo}] from ${author}`,
    bodyAborted: (refersTo) => `message [${refersTo}] cut off by its author`,
    bodyLapsed: (refersTo) => `message [${refersTo}] cut off by the platform on its deadline`,
    closing: (author, endsAt, evidence) =>
      `the lead ${author} proposes to close the case by ${endsAt}${evidence ? `; evidence: ${evidence}` : ""}`,
    closingMay: (entryId) =>
      `you may object — verstak_case(action="object", in_reply_to=${entryId})`,
    closingNot: () => "the objection is not yours to make",
    closed: (reason) => `case closed: ${reason}`,
    objection: (author, reason) => `${author} objects to closing: ${reason}`,
    lateObjection: (author) => `${author} objected after the close`,
    progress: (key, done, verdict, note, author) =>
      `[${key}] [${done}] = ${verdict}${note} · ${author}`,
    opened: (author) => `case opened by ${author}`,
    joined: (who) => `entered ${who}`,
    left: (who, reason) => `left ${who}${reason ? `; reason: ${reason}` : ""}`,
    invite: (author, who) => `${author} invites ${who} to the case`,
    withdraw: (author) => `invitation withdrawn by ${author}`,
    node: (seq, name, realm, reasoning) =>
      `node #${seq} ${name} (${realm}) in the case${reasoning}`,
    nodeUpdated: (seq, name, reasoning) => `node #${seq} ${name} updated${reasoning}`,
    nodeDeleted: (seq, name, reasoning) => `node #${seq} ${name} deleted${reasoning}`,
    nodeUndeleted: (seq, name, reasoning) => `node #${seq} ${name} restored${reasoning}`,
    link: (room, rel) => `case linked to case #${room} (${rel})`,
    auto: (code, room) => `platform record ${code} about case #${room}`,
    unknown: (kind) => `kind ${kind} is unknown to the bridge`,
    case: (room) => `case #${room}`,
    replyTo: (id) => `in reply to [${id}]`,
    stale: () => "stale",
    bodyRead: (how) => `body: ${how}`,
    whoHuman: (user) => `user${user}`,
    whoRole: (karta) => `role #${karta}`,
    whoSibling: (karta) => `sibling of role #${karta}`,
    whoPlatform: () => "platform — a wake-up",
    whoGraph: () => "graph event",
    legacy: (kind, stack) => `kind ${kind}${stack ? ` · ${stack}` : ""}`,
  },
};

export interface RoomAutoWords {
  child_opened: (room: string) => string;
  child_closing: (room: string) => string;
  child_closed: (room: string) => string;
  child_late_objection: (room: string) => string;
}

export const ROOM_AUTO: Readonly<Record<Lang, RoomAutoWords>> = {
  en: {
    child_opened: (room) => `child case #${room} opened`,
    child_closing: (room) => `child case #${room} is closing`,
    child_closed: (room) => `child case #${room} closed`,
    child_late_objection: (room) => `late objection in child case #${room}`,
  },
};

export interface RoomRelWords {
  parent: () => string;
  child: () => string;
  continues: () => string;
}

export const ROOM_REL: Readonly<Record<Lang, RoomRelWords>> = {
  en: {
    parent: () => "its child",
    child: () => "its parent",
    continues: () => "continues it",
  },
};

export interface VerdictWords {
  ok: () => string;
  partial: () => string;
  bad: () => string;
}

export const VERDICT: Readonly<Record<Lang, VerdictWords>> = {
  en: { ok: () => "ok", partial: () => "partial", bad: () => "slop" },
};
