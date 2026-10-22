// Room frame fields shared by room-kinds.ts and asks.ts.

export type Rec = Record<string, unknown>;
export const obj = (v: unknown): Rec =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Rec) : {};
export const str = (v: unknown): string =>
  typeof v === "string" ? v : typeof v === "number" || typeof v === "boolean" ? String(v) : "";

export const after = (key: string, prefix: string): string =>
  key.startsWith(prefix) ? key.slice(prefix.length) : key;

/** Required field of a word: the value, "?" when empty. */
export const need = (v: unknown): string => str(v) || "?";

/** Optional field of a word: separator and value, nothing when empty. */
export const opt = (sep: string, v: unknown): string => {
  const x = str(v);
  return x ? sep + x : "";
};

/** The word of a dictionary for a value the server sends; an unknown value — undefined. */
export const pick = <T extends object>(dict: T, key: string): T[keyof T] | undefined =>
  Object.hasOwn(dict, key) ? dict[key as keyof T] : undefined;

/** Own standing of the frame for the invite key — seat id and address: the key format (#5893 §4.2) is unconfirmed. */
export const mineOf = (frame: Rec): string[] =>
  [str(frame.to_standing_id), str(frame.to_standing)].filter(Boolean);

/**
 * Invite of my role (api 0.89.6): the key carries the role node id, line fields carry
 * karta {id, name, seq, realm} (observed in production), the frame my karta_seq. A seq belongs to a graph, so
 * graphs named on both sides must match.
 */
export function myRole(frame: Rec, fields: Rec): boolean {
  const ka = obj(fields.karta);
  const seq = str(ka.seq);
  if (!seq || seq !== str(frame.karta_seq)) return false;
  const theirs = str(ka.realm);
  const mine = str(frame.realm) || str(obj(frame.room).realm);
  return !theirs || !mine || theirs === mine;
}

/**
 * An invite (or its withdrawal) to me (#6870, #6574): key invite:<my seat id>; a role
 * invite — key invite:<role node id> (confirmed by the api, case №1249 [19]; the key is the
 * role's id when fields.karta carries none) of my role; its withdrawal the same — the api
 * hands it to one live seat of the role (#6974, case №1249). An invite of another seat
 * names its role too: not mine. One decision for the stack and for addressing.
 */
export function inviteMine(frame: Rec): boolean {
  const fields = obj(obj(frame.line).fields);
  const target = after(str(obj(frame.line).key), "invite:");
  if (target && mineOf(frame).includes(target)) return true;
  const seat = Object.keys(obj(fields.standing)).length > 0 || !!str(fields.standing);
  const roleId = str(obj(fields.karta).id) || (seat ? "" : target);
  return (!target || target === roleId) && myRole(frame, fields);
}

/**
 * Whether the seat a frame names is mine (#6867, case №1249 [19]): by id first — the
 * first named id decides; an address string only when no id is named or my id is
 * unknown. null — no seat named (an addressee null among them names nothing) or the
 * frame does not say who I am.
 */
export function seatIs(frame: Rec, ...named: unknown[]): boolean | null {
  const myId = str(frame.to_standing_id);
  const myAddr = str(frame.to_standing);
  if (!myId && !myAddr) return null;
  const id = named.map((v) => str(obj(v).id)).find(Boolean);
  if (id && myId) return id === myId;
  const addr = named
    .map((v) => addresseeOf(v)?.addr.filter((a) => a.startsWith("@"))[0])
    .find(Boolean);
  if (addr) return addr === myAddr;
  return id ? false : null;
}

/**
 * Addressee of a word (api 0.91.3, observed in production): a seat address string
 * or a seat object {standing | handle+name, id, name}. addr — what to compare with
 * my seat, label — how to name it.
 */
export function addresseeOf(v: unknown): { addr: string[]; label: string } | null {
  if (typeof v === "string") return v ? { addr: [v], label: v } : null;
  const o = obj(v);
  const handle = str(o.handle).replace(/^@/, "");
  const standing =
    str(o.standing) || (handle ? `@${handle}${str(o.name) ? `:${str(o.name)}` : ""}` : "");
  const id = str(o.id);
  const name = str(o.standing) ? str(o.name) : "";
  const label = name && standing ? `${name} (${standing})` : standing || str(o.name) || id;
  const addr = [standing, id].filter(Boolean);
  return addr.length ? { addr, label } : null;
}
