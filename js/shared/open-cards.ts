// Server-owned snapshot, never a local count or clock (graph @nks/nks-dev, #10167); since
// wire 0.181.0 it names up to five oldest cards in `items` (#11419).
import { FRAME_TEXT } from "../delivery/index.ts";
import type { Frame } from "./channel.ts";
import { clockNoticeFrame, number, rec, text, timestamp } from "./clock-notices.ts";
import { words } from "./lang.ts";

export interface OpenCard {
  room: { id: string; number: number; realm: string };
  entry_id: number;
  key: string;
  asked_at: string;
  asker: { standing_id: string | null; standing: string | null; karta_seq: number | null };
}

export interface OpenCards {
  count: number;
  oldest_at: string | null;
  /** The oldest cards as the server named them; absent when the server sends none. */
  items?: OpenCard[];
  /** Entries left out as malformed (a non-list `items` is one) — said in the text, not hidden. */
  malformed_items?: number;
}

/** The wire names up to five; more is off the wire's shape. */
const MAX_ITEMS = 5;

const repeatNumber = (n: unknown): number | null =>
  typeof n === "number" && Number.isSafeInteger(n) && n > 0 ? n : null;

/** Strip untrusted card fields even when the reader is paired with an older bridge. */
export function cardFrame(frame: Frame | null): Frame | null {
  if (!frame) return null;
  frame = clockNoticeFrame(frame);
  const checked: Record<string, unknown> = {};
  if (Object.hasOwn(frame, "my_open_cards")) checked.my_open_cards = openCards(frame.my_open_cards);
  if (Object.hasOwn(frame, "repeat")) checked.repeat = frame.repeat === true;
  if (Object.hasOwn(frame, "repeat_n")) checked.repeat_n = repeatNumber(frame.repeat_n);
  return Object.keys(checked).length ? { ...frame, ...checked } : frame;
}

/** This is the server's repeat marker, not a local retry count (#10167 v13). */
export const cardRepeatText = (frame: Frame): string => {
  if (frame.repeat !== true) return "";
  return words(FRAME_TEXT).cardRepeat(repeatNumber(frame.repeat_n));
};

/** null and absent are null; a value of the wrong form is undefined — the entry is malformed. */
const orNull = <T>(v: unknown, read: (v: unknown) => T | null): T | null | undefined =>
  v === null || v === undefined ? null : (read(v) ?? undefined);

function card(value: unknown): OpenCard | null {
  const c = rec(value);
  const r = rec(c.room);
  const a = rec(c.asker); // the very object when asker is one: `c.asker !== a` below — none
  const [id, num, realm] = [text(r.id), number(r.number), text(r.realm)];
  const [entry, key, at] = [number(c.entry_id), text(c.key), timestamp(c.asked_at)];
  const standing_id = orNull(a.standing_id, text);
  const standing = orNull(a.standing, text);
  const karta_seq = orNull(a.karta_seq, number);
  if (!id || !num || !realm || !entry || !key || !at || c.asker !== a) return null;
  if (standing_id === undefined || standing === undefined || karta_seq === undefined) return null;
  return {
    room: { id, number: num, realm },
    entry_id: entry,
    key,
    asked_at: at,
    asker: { standing_id, standing, karta_seq },
  };
}

function itemsOf(v: Record<string, unknown>): Pick<OpenCards, "items" | "malformed_items"> {
  const before = number(v.malformed_items) ?? 0; // already counted by a bridge upstream
  if (v.items === undefined) return before ? { malformed_items: before } : {};
  const list = Array.isArray(v.items) ? v.items : null;
  const items = (list ?? []).slice(0, MAX_ITEMS).flatMap((x) => card(x) ?? []);
  const bad = before + (list ? list.length - items.length : 1);
  return bad ? { items, malformed_items: bad } : { items };
}

/** Accept only the known wire shape; never echo malformed server data. */
export function openCards(value: unknown): OpenCards | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  const { count, oldest_at: at } = v;
  if (typeof count !== "number" || !Number.isSafeInteger(count) || count < 0) return null;
  if (count === 0) return at === null ? { count, oldest_at: null, ...itemsOf(v) } : null;
  const oldest = timestamp(at);
  return oldest ? { count, oldest_at: oldest, ...itemsOf(v) } : null;
}

export const openCardsText = (frame: Frame): string => {
  const value = frame.my_open_cards;
  const cards = openCards(value);
  const T = words(FRAME_TEXT);
  const lines = [
    T.openCards(cards?.count ?? null, cards?.oldest_at ?? null, value !== undefined && !cards),
  ];
  for (const c of cards?.items ?? [])
    lines.push(
      T.openCard({
        room: c.room.number,
        entry: c.entry_id,
        key: c.key,
        standing: c.asker.standing,
        karta: c.asker.karta_seq,
        askedAt: c.asked_at,
      }),
    );
  if (cards?.malformed_items) lines.push(T.cardsMalformed(cards.malformed_items));
  return lines.join("\n");
};

/** The latest envelope in this output wins; it does not become a delivery event. */
export const cardsIn = (frames: readonly Frame[]): string =>
  frames.length ? openCardsText(frames[frames.length - 1]) : "";

/** The card lines already stand in `text` as whole lines. */
export const hasCards = (text: string, cards: string): boolean =>
  `\n${text}\n`.includes(`\n${cards}\n`);
