// Server clock facts, not a new frame or case-record kind (graph @nks/nks-dev, #10167).
import { FRAME_TEXT } from "../delivery/index.ts";
import type { Frame } from "./channel.ts";
import { words } from "./lang.ts";

type Rec = Record<string, unknown>;
const rec = (v: unknown): Rec =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Rec) : {};
const text = (v: unknown): string | null =>
  typeof v === "string" &&
  v.length > 0 &&
  v.length <= 256 &&
  [...v].every((c) => c.charCodeAt(0) >= 32 && c.charCodeAt(0) !== 127)
    ? v
    : null;
const number = (v: unknown): number | null =>
  typeof v === "number" && Number.isSafeInteger(v) && v > 0 ? v : null;
const bool = (v: unknown): boolean | null => (typeof v === "boolean" ? v : null);
const timestamp = (v: unknown): string | null => {
  const s = text(v);
  return s &&
    /^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,9})?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/.test(
      s,
    ) &&
    Number.isFinite(Date.parse(s)) &&
    new Date(`${s.slice(0, 10)}T00:00:00Z`).toISOString().slice(0, 10) === s.slice(0, 10)
    ? s
    : null;
};

function kind(frame: Frame): "card_unanswered" | "line_due" | null {
  const p = frame.provenance;
  return frame.type === "message" &&
    p?.via === "platform" &&
    p.auth === "none" &&
    (p.notice === "card_unanswered" || p.notice === "line_due")
    ? p.notice
    : null;
}

function dataOf(frame: Frame, notice: "card_unanswered" | "line_due") {
  const d = rec(frame.provenance?.notice_data);
  const r = rec(d.room);
  const who = rec(notice === "card_unanswered" ? d.to : d.holder);
  const seat = {
    standing_id: text(who.standing_id),
    standing: text(who.standing),
    karta_seq: number(who.karta_seq),
  };
  return {
    room: { id: text(r.id), number: number(r.number), realm: text(r.realm) },
    entry_id: number(d.entry_id),
    key: text(d.key),
    ...(notice === "card_unanswered"
      ? {
          to: seat,
          listening: bool(d.listening),
          last_act_at: timestamp(d.last_act_at),
          role_called: bool(d.role_called),
        }
      : { holder: seat, due_at: timestamp(d.due_at), escalated: bool(d.escalated) }),
  };
}

/** The same allowlist protects old-bridge readers' details as well as visible text. */
export function clockNoticeFrame(frame: Frame): Frame {
  const notice = kind(frame);
  if (!notice) return frame;
  return {
    ...frame,
    body: "",
    provenance: { ...frame.provenance, notice_data: dataOf(frame, notice) },
  };
}

/** Empty means the existing general dispatch/render path, including unknown notices. */
export function clockNoticeText(frame: Frame): string {
  const notice = kind(frame);
  if (!notice) return "";
  const d = dataOf(frame, notice);
  const seat = "to" in d ? d.to : d.holder;
  return words(FRAME_TEXT).clockNotice(notice, {
    room: d.room.number,
    roomId: d.room.id,
    realm: d.room.realm,
    entry: d.entry_id,
    key: d.key,
    standing: seat?.standing ?? null,
    standingId: seat?.standing_id ?? null,
    karta: seat?.karta_seq ?? null,
    listening: "listening" in d ? d.listening : null,
    lastAct: "last_act_at" in d ? d.last_act_at : null,
    roleCalled: "role_called" in d ? d.role_called : null,
    due: "due_at" in d ? d.due_at : null,
    escalated: "escalated" in d ? d.escalated : null,
  });
}
