// The root's service stand and the held seat's comparison with the project cover.
import { PLUGIN } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import { STAND_TOOL } from "./satellite.ts";
import type { Slot } from "./slot.ts";

export interface HeldSeat {
  name: string;
  karta: string;
  realm: string;
}

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
  awaitReady(slot: Slot): Promise<void>;
  callThrough(
    slot: Slot,
    name: string,
    input: Record<string, unknown>,
    session: string,
    service: boolean,
  ): Promise<{ content: string; place?: HeldSeat; provisional?: boolean; key?: string }>;
}

/** Bridge's held word, else the real record; a sanitized key cannot recover a graph. */
function heldSeat(d: SeatDoors, slot: Slot, session: string): HeldSeat {
  if (slot.place) return { ...slot.place };
  const rec = d.recorded?.(slot, session);
  if (rec) return rec;
  const [name = "", karta = ""] = (slot.key ?? "").split("--");
  return { name, karta, realm: "" };
}

const short = (t: string): boolean => /^r\d+$/.test(t.trim());
const canonical = (t: string): boolean => /^@[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(t);
const slug = (t: string): boolean => /^[A-Za-z0-9_.-]+$/.test(t) && !short(t);

/** Compare known spellings only: rN against a slug has no proven correspondence. */
export function sameSeat(seat: HeldSeat, realm: string, karta: string): boolean {
  if (seat.karta.trim().replace(/^#/, "") !== karta.trim().replace(/^#/, "")) return false;
  const [x, y] = [seat.realm.trim(), realm.trim()];
  if (short(x) || short(y)) return short(x) && short(y) && x === y;
  if (canonical(x) && canonical(y)) return x === y;
  if (canonical(x) && slug(y)) return x.slice(x.indexOf("/") + 1) === y;
  if (slug(x) && canonical(y)) return x === y.slice(y.indexOf("/") + 1);
  return slug(x) && slug(y) && x === y;
}

function outcome(
  d: SeatDoors,
  slot: Slot,
  session: string,
  realm: string,
  karta: string,
  provisional: boolean,
): Seating {
  const own = heldSeat(d, slot, session);
  if (!own.realm || short(own.realm) !== short(realm)) return { other: own, uncompared: realm };
  return sameSeat(own, realm, karta)
    ? { place: own.name, realm: own.realm, provisional }
    : { other: own };
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
      if (slot.holding) return outcome(d, slot, root, realm, karta, provisional());
      const model = await d.modelOf(root);
      if (cancelled()) return { cancelled: true };
      const args = { realm, karta, provisional: true, ...(model ? { model } : {}) };
      const out = await d.callThrough(slot, STAND_TOOL, args, root, true);
      if (cancelled()) return { cancelled: true };
      if (!slot.holding) return { error: out.content || words(PLUGIN).refusalNoText(STAND_TOOL) };
      // A fresh successful stand resolved rN itself. Its held reply proves that spelling;
      // a disk seat, handled above before the call, carries no such proof (#7972).
      return outcome(
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
