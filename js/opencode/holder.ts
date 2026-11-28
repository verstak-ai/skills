// One seat per root session across the OpenCode process (graph @nks/nks-dev, node #11463; the
// contract of #6550: a session speaks with at most one seat). OpenCode loads the plugin once per
// location, and a session moved to another folder (moves.ts) may have the calls of its running
// turn reach the previous folder's instance. Before an instance stands, returns or opens a
// bridge for a ROOT, it takes the process's reservation of the root (reserve.ts): the slot of the
// instance owning it serves the call — no second bridge, no second name. A seating in flight in
// another instance is waited for first: two instances seating one root stand two seats.
import { OPENCODE_KEEP, PLUGIN } from "../delivery/index.ts";
import type { Bridge } from "../shared/bridge-client.ts";
import { takingArgs } from "../shared/busyargs.ts";
import { words } from "../shared/lang.ts";
import { authDir, textOf } from "./bridge-io.ts";
import type { Keeper } from "./keep.ts";
import { writeLostMarker } from "./marker.ts";
import type { Home } from "./records.ts";
import {
  ownedElsewhere,
  ownerSlot,
  type Reservation,
  reserveRoot,
  revived,
  setSlot,
  unready,
  waitMs,
} from "./reserve.ts";
import { heldAs } from "./rootseat-by.ts";
import { STAND_TOOL } from "./satellite.ts";
import type { Slot } from "./slot.ts";
import { adoptIn, seatClaim, seatingElsewhere, slotOwners } from "./twins.ts";

export function owned(slot: Slot, slots: Map<string, Slot>): void {
  slotOwners().set(slot, slots);
}
export const foreign = (slot: Slot, slots: Map<string, Slot>): boolean =>
  slotOwners().has(slot) && slotOwners().get(slot) !== slots;

export function handMoved(slot: Slot, to: Home, keeper: Keeper<Slot>): void {
  const entries = writeLostMarker(authDir(), [{ ...slot, dir: to.directory, moved: true }], to);
  if (entries.length) keeper.hint(entries);
  adoptIn(to);
}

export function claimResume(root: string, slot: Slot, slots: Map<string, Slot>): void {
  if (!slot.resume) return;
  const withdraw = seatClaim(
    root,
    slot.resume.then(
      () => {},
      () => {},
    ),
    slots,
  );
  void slot.resume.then(withdraw, withdraw);
}

export function foreignAnswer(result: unknown, name: string): { content: string } {
  if ((result as { isError?: boolean } | null)?.isError)
    throw Object.assign(new Error(textOf(result) || words(PLUGIN).refusalNoText(name)), { result });
  return { content: textOf(result) };
}

/**
 * The root's slot under the process's reservation (reserve.ts), taken synchronously at the call:
 * this instance's own by `own`, or the slot of the instance that owns the root — after its
 * seating in flight, if any. The owner's slot not set in time: a refusal aloud, the reservation
 * untouched — the waiter never becomes a second owner.
 */
export async function rootSlot(
  root: string,
  slots: Map<string, Slot>,
  home: Home | null,
  own: (r: Reservation) => Promise<Slot>,
  touch: boolean,
): Promise<Slot> {
  for (;;) {
    const r = reserveRoot(root, slots, home);
    if (r.owner === slots)
      try {
        r.revive = () => own(r); // the owner's own path: it replaces a dead bridge
        return await own(r);
      } finally {
        unready(r, slots);
      }
    const got = await ownerSlot(r);
    // A dead owner's bridge is revived by the owner's door, never called nor replaced here.
    const slot = got?.bridge.failure ? await revived(r) : got;
    if (slot === null)
      throw new Error(words(OPENCODE_KEEP).rootElsewhere(Math.ceil(waitMs() / 1000)));
    if (slot) {
      await seatingElsewhere(root, slots);
      return served(slot, touch);
    }
  }
}

/**
 * The owner of the root's reservation set its slot: the waiting instances are served through it.
 * A fresh slot returns no seat while another instance's seating of the root is in flight — two
 * seatings stand two seats; the owner waits for it only after it opened its slot to the waiters.
 */
export async function ownerSet(
  r: Reservation,
  slot: Slot,
  slots: Map<string, Slot>,
  fresh: boolean,
): Promise<void> {
  setSlot(r, slot);
  if (fresh) await seatingElsewhere(r.root, slots);
}

/** An explicit stand of the seat another instance's slot holds for the root: its word (alreadyStands). */
export const keptStand = async (
  name: string,
  slot: Slot,
  session: string,
  args: Record<string, unknown>,
  slots: Map<string, Slot>,
): Promise<string | null> =>
  name === STAND_TOOL && slot.session === session
    ? alreadyStands(slot, session, args, foreign(slot, slots))
    : null;

/**
 * The bridge holding the session's seat, for its consumers here — the context gate, usage, the
 * pulse, the rules: this instance's own holding slot, or for a ROOT the holding slot of the
 * instance owning it (reserve.ts) — the one its writes go through. A child — only its own.
 */
export function bridgeOf(session: string, slots: Map<string, Slot>): Bridge | null {
  const own = slots.get(session);
  if (own?.holding) return own.bridge;
  if (own?.child) return null;
  const other = ownedElsewhere(session, slots);
  return other?.holding && other.session === session ? other.bridge : null;
}

/** A call goes through the holder's slot: counted as its call, and known as not this instance's. */
export function served(slot: Slot, touch: boolean): Slot {
  if (touch) slot.lastCall = Date.now();
  return slot;
}

/**
 * An explicit stand of the seat the slot holds NOW, come to an instance that does not hold it: the
 * holder's word instead of a register — a register would stand a second name beside the
 * session's seat. The model names the session's model and changes nothing here. A busy line, a
 * satellite's stand, a local recovery and a call doing more than standing — a name, a room, a
 * take — go to the holder's bridge as any call.
 */
export async function alreadyStands(
  slot: Slot,
  session: string,
  args: Record<string, unknown>,
  foreign: boolean,
): Promise<string | null> {
  if (!foreign || args.context_restored === true || args.satellite_of != null) return null;
  // A place kept after a stop or a release is no seat: the stand goes to the holder's bridge.
  if (!slot.holding || !slot.place || slot.bridge.failure) return null;
  if (Object.keys(args).some((k) => !["realm", "karta", "model"].includes(k))) return null;
  if (typeof args.status === "string" || takingArgs(args).some((k) => k !== "model")) return null;
  const realm = String(args.realm ?? "").trim();
  const karta = String(args.karta ?? "").trim();
  if (!realm || !karta) return null;
  const seat = await heldAs({}, slot, session, realm, karta);
  return seat?.same
    ? words(OPENCODE_KEEP).alreadyStanding(seat.own.name, seat.own.realm, seat.own.karta)
    : null;
}
