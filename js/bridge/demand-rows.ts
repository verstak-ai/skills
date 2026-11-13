// The local projection's allowlisted rows (graph @nks/nks-dev, node #9957).
type Row = Record<string, unknown>;
export function object(v: unknown): Row {
  if (!v || typeof v !== "object" || Array.isArray(v)) throw new Error("invalid_object");
  return v as Row;
}
function text(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}
function required(v: unknown): string {
  const s = text(v);
  if (!s) throw new Error("missing_identifier");
  return s;
}
function seq(v: unknown): number {
  if (typeof v !== "number" || !Number.isSafeInteger(v) || v <= 0)
    throw new Error("invalid_sequence");
  return v;
}
export function startRow(v: unknown, realm: string): Row {
  const x = object(v);
  const p = x.payload === undefined ? {} : object(x.payload);
  const h = p.holon == null ? {} : object(p.holon);
  const a = x.attrs == null ? {} : object(x.attrs);
  return {
    realm,
    room: required(x.room_id),
    invite: seq(x.entry_id),
    karta: seq(x.karta_seq),
    holon: typeof h.seq === "number" ? h.seq : null,
    repository: text(h.repository),
    model: a.model == null ? null : (text(a.model) ?? ""),
    harness: a.harness == null ? null : (text(a.harness) ?? ""),
    launcher: a.launcher == null ? null : (text(a.launcher) ?? ""),
    author: text(x.author),
  };
}
/** An open order of the account in any graph — only what settles a stop of ours. */
export interface OpenOrder {
  order_id: string;
  standing_id: string;
}
export function openOrder(v: unknown): OpenOrder {
  const x = object(v);
  return { order_id: required(x.id), standing_id: required(x.standing_id) };
}
export function stopRow(v: unknown, realms: readonly string[]): Row | null {
  const x = object(v);
  const realm = required(x.realm);
  if (!realms.includes(realm)) return null;
  if (x.state !== "issued" && x.state !== "accepted") throw new Error("invalid_order_state");
  return {
    order_id: required(x.id),
    standing_id: required(x.standing_id),
    realm,
    karta: seq(x.karta_seq),
    standing: text(x.standing),
    repository: text(x.repository),
    state: x.state,
    reason_code: text(x.reason_code),
    answer_by: text(x.answer_by),
  };
}
