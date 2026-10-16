// The root's service stand and the held seat's comparison with the project cover.
import { PLUGIN, ROOT_SEAT } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import { STAND_TOOL } from "./satellite.ts";
import type { Slot } from "./slot.ts";

export interface HeldSeat {
  name: string;
  karta: string;
  realm: string;
}

/** Taken seat, returned own seat unlike the cover, or refusal. */
export type Seating = { place: string; realm?: string } | { other: HeldSeat } | { error: string };

export interface SeatDoors {
  slotFor(session: string): Promise<Slot>;
  modelOf(session: string): Promise<string | null>;
  awaitReady(slot: Slot): Promise<void>;
  callThrough(
    slot: Slot,
    name: string,
    input: Record<string, unknown>,
    session: string,
    service: boolean,
  ): Promise<{ content: string; place?: HeldSeat }>;
}

/** Bridge's held word, else its disk key (bridge/holdrecord.ts). */
function heldSeat(slot: Slot): HeldSeat {
  if (slot.place) return { ...slot.place };
  const [name = "", karta = "", realm = ""] = (slot.key ?? "").split("--");
  return { name, karta, realm };
}

const keyPart = (t: string): string => t.trim().replace(/[^A-Za-z0-9._-]+/g, "_");
const short = (t: string): boolean => /^r\d+$/.test(t.trim());

/** Compare known spellings only: rN against a slug has no proven correspondence. */
export function sameSeat(seat: HeldSeat, realm: string, karta: string): boolean {
  if (keyPart(seat.karta.replace(/^#/, "")) !== keyPart(karta)) return false;
  if (short(seat.realm) !== short(realm)) return false;
  const [x, y] = [keyPart(seat.realm), keyPart(realm)];
  return x === y || x.endsWith(`_${y}`) || y.endsWith(`_${x}`);
}

function outcome(slot: Slot, realm: string, karta: string): Seating {
  const own = heldSeat(slot);
  if (short(own.realm) !== short(realm))
    return { error: words(ROOT_SEAT).uncompared(realm, own.realm) };
  return sameSeat(own, realm, karta) ? { place: own.name, realm: own.realm } : { other: own };
}

/** Return this session's disk seat first, else take a fresh provisional seat by service call. */
export async function seatBy(
  d: SeatDoors,
  root: string,
  realm: string,
  karta: string,
): Promise<Seating> {
  try {
    const slot = await d.slotFor(root);
    slot.busy++;
    try {
      await d.awaitReady(slot);
      if (slot.resume) await slot.resume;
      if (slot.holding) return outcome(slot, realm, karta);
      const model = await d.modelOf(root);
      const args = { realm, karta, provisional: true, ...(model ? { model } : {}) };
      const out = await d.callThrough(slot, STAND_TOOL, args, root, true);
      if (!slot.holding) return { error: out.content || words(PLUGIN).refusalNoText(STAND_TOOL) };
      // A fresh successful stand resolved rN itself. Its held reply proves that spelling;
      // a disk seat, handled above before the call, carries no such proof (#7972).
      return outcome(slot, short(realm) && out.place ? out.place.realm : realm, karta);
    } finally {
      slot.busy--;
      slot.lastCall = Date.now();
    }
  } catch (e) {
    return { error: (e as Error).message };
  }
}
