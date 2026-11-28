// The root's service stand and the held seat's comparison with the project cover.
import { method, PLUGIN } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import { canonical, type HeldSeat, sameSeat, short } from "../shared/sameseat.ts";
import { STAND_TOOL } from "./satellite.ts";
import type { Slot } from "./slot.ts";

export { type HeldSeat, sameSeat } from "../shared/sameseat.ts";

/** Taken seat, returned own seat unlike the cover, or refusal. */
export type Seating =
  | { place: string; realm?: string; provisional?: boolean }
  | { other: HeldSeat; uncompared?: string }
  | { error: string }
  | { cancelled: true };

export interface SeatDoors {
  slotFor(session: string): Promise<Slot>;
  modelOf(session: string): Promise<string | null>;
  cancelled?(session: string): boolean;
  provisional?(slot: Slot, session: string): boolean;
  recorded?(slot: Slot, session: string): HeldSeat | null;
  claiming?(session: string): boolean;
  awaitReady(slot: Slot): Promise<void>;
  callThrough(
    slot: Slot,
    name: string,
    input: Record<string, unknown>,
    session: string,
    service: boolean,
  ): Promise<SeatAnswer>;
}

/** Bridge's held word, else the real record; a sanitized key cannot recover a graph. */
function heldSeat(d: Pick<SeatDoors, "recorded">, slot: Slot, session: string): HeldSeat {
  if (slot.place) return { ...slot.place };
  const rec = d.recorded?.(slot, session);
  if (rec) return rec;
  const [name = "", karta = ""] = (slot.key ?? "").split("--");
  return { name, karta, realm: "" };
}

const REALM_MS = 10_000;

/** rN as the serving bridge names it (#8191); an older bridge or an unknown name — as given. */
export async function canonOf(slot: Pick<Slot, "bridge">, realm: string): Promise<string> {
  try {
    const opts = { timeoutMs: REALM_MS, service: true };
    const r = (await slot.bridge.request(method("realm"), { realm }, opts)) as { realm?: unknown };
    return typeof r?.realm === "string" && canonical(r.realm) ? r.realm : realm;
  } catch {
    return realm;
  }
}

/**
 * The slot's held seat against the graph and the role: same — the seat is theirs; not same —
 * another seat; null — a spelling not to be compared. One spelling short and the other not:
 * the short one goes by the bridge's realm table.
 */
export async function heldAs(
  d: Pick<SeatDoors, "recorded">,
  slot: Slot,
  session: string,
  realm: string,
  karta: string,
): Promise<{ own: HeldSeat; same: boolean } | null> {
  const own = heldSeat(d, slot, session);
  const mixed = !!own.realm && short(own.realm) !== short(realm);
  const [x, y] = mixed
    ? await Promise.all([own.realm, realm].map((r) => (short(r) ? canonOf(slot, r) : r)))
    : [own.realm, realm];
  if (!x || short(x) !== short(y)) return null;
  return { own, same: sameSeat({ ...own, realm: x }, y, karta) };
}

async function outcome(
  d: SeatDoors,
  slot: Slot,
  session: string,
  realm: string,
  karta: string,
  provisional: boolean,
): Promise<Seating> {
  const got = await heldAs(d, slot, session, realm, karta);
  if (!got) return { other: heldSeat(d, slot, session), uncompared: realm };
  return got.same ? { place: got.own.name, realm: got.own.realm, provisional } : { other: got.own };
}

export interface SeatAnswer {
  content: string;
  place?: HeldSeat;
  provisional?: boolean;
  key?: string;
  fresh?: boolean;
}

/** Return this session's disk seat first, else take a fresh provisional seat by service call. */
export async function seatBy(
  d: SeatDoors,
  root: string,
  realm: string,
  karta: string,
): Promise<Seating> {
  try {
    const cancelled = () => d.cancelled?.(root) === true;
    if (cancelled()) return { cancelled: true };
    const slot = await d.slotFor(root);
    slot.busy++;
    try {
      await d.awaitReady(slot);
      if (slot.resume) await slot.resume;
      if (cancelled()) return { cancelled: true };
      const provisional = () => d.provisional?.(slot, root) === true;
      if (slot.holding && !d.claiming?.(root))
        return await outcome(d, slot, root, realm, karta, provisional());
      const model = await d.modelOf(root);
      if (cancelled()) return { cancelled: true };
      const args = { realm, karta, provisional: true, ...(model ? { model } : {}) };
      const out = await d.callThrough(slot, STAND_TOOL, args, root, true);
      if (cancelled()) return { cancelled: true };
      if (!slot.holding) return { error: out.content || words(PLUGIN).refusalNoText(STAND_TOOL) };
      // A fresh successful stand resolved rN itself. Its held reply proves that spelling;
      // a disk seat, handled above before the call, carries none — its rN goes by the bridge's
      // realm table (#7972, #8191).
      return await outcome(
        d,
        slot,
        root,
        short(realm) && out.place ? out.place.realm : realm,
        karta,
        out.provisional === true,
      );
    } finally {
      slot.busy--;
      slot.lastCall = Date.now();
    }
  } catch (e) {
    return { error: (e as Error).message };
  }
}
