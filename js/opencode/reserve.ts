// One owner per ROOT session across the OpenCode process (graph @nks/nks-dev, node #11463; the
// contract of #6550: a session speaks with at most one seat). OpenCode loads the plugin once per
// location, and the calls of a root's running turn may reach two instances in the same tick: a
// look for a holder followed by an await lets both open a bridge. So an instance takes the root's
// slot only under the process's reservation of the root, taken synchronously before any other
// wait; a later instance is served through the owner's slot. The reservation follows the owner's
// slot: dropped (reaper, forget, stop, a move) — it is free. A move hands it to the new folder's
// instance when that one is live (moves.ts): it takes the reservation by its own call.
// Children are not reserved (#6626, #6695, #8991).
/* eslint-disable @typescript-eslint/no-explicit-any -- a process registry on globalThis */
import { envName, GLOBAL_PREFIX } from "../delivery/index.ts";
import type { Home } from "./records.ts";
import type { Slot } from "./slot.ts";

type Owner = Map<string, Slot>;

export interface Reservation {
  root: string;
  /** The owning instance's slots; null — handed to the instance of `to`. */
  owner: Owner | null;
  to: Home | null;
  /** The owner's slot of the root, once set: a later instance is served through it. */
  slot: Slot | null;
  ready: Promise<void>;
  open: () => void;
  /** Not opened by then — the reservation is free (a hand-over nobody took). */
  until: number;
  /** The owner's own path to its slot of the root — it replaces a dead bridge; a waiter's door. */
  revive?: (() => Promise<Slot>) | null;
}

const table = (): Map<string, Reservation> =>
  ((globalThis as any)[`${GLOBAL_PREFIX}Roots`] ??= new Map<string, Reservation>());

/** How long an instance waits for the owner of a root's reservation to set its slot. */
export const waitMs = (): number => Number(process.env[envName("ROOT_WAIT_MS")]) || 15_000;

const same = (a: Home, b: Home): boolean =>
  a.directory === b.directory && (a.workspace ?? null) === (b.workspace ?? null);

function arm(r: Reservation, owner: Owner | null, to: Home | null, ms: number): Reservation {
  r.owner = owner;
  r.to = to;
  r.slot = null;
  r.revive = null;
  r.until = Date.now() + ms;
  r.ready = new Promise<void>((done) => (r.open = done));
  return r;
}

/** The reservation still binds: its owner keeps the slot it set, or sets one, or a hand-over waits. */
function binds(r: Reservation): boolean {
  if (r.slot && r.owner) return r.owner.get(r.root) === r.slot;
  return Date.now() < r.until;
}

/**
 * The root's reservation, synchronously: this instance's own, a binding one of another instance,
 * or a new one of this instance — also a hand-over to this instance's folder.
 */
export function reserveRoot(root: string, slots: Owner, home: Home | null): Reservation {
  const r = table().get(root);
  if (r?.owner === slots) return r;
  const handedHere = !!r && !r.owner && !!r.to && !!home && same(r.to, home);
  if (r && binds(r) && !handedHere) return r;
  if (r && (handedHere || !r.slot)) {
    // Taken in place: the instances waiting for it wake when this owner sets its slot.
    const until = Date.now() + waitMs();
    Object.assign(r, { owner: slots, to: null, slot: null, until, revive: null });
    return r;
  }
  const fresh = arm({ root } as Reservation, slots, null, waitMs());
  table().set(root, fresh);
  return fresh;
}

/** The slot another instance owns for the root under a binding reservation, synchronously; none — null. */
export function ownedElsewhere(root: string, slots: Owner): Slot | null {
  const r = table().get(root);
  return r?.owner && r.owner !== slots && r.slot && binds(r) ? r.slot : null;
}

/** The owner set its slot of the root: the waiting instances are served through it. */
export function setSlot(r: Reservation, slot: Slot): void {
  r.slot = slot;
  r.open();
  // A dead bridge's replacement dropped the reservation with the old slot a moment ago.
  if (!table().has(r.root)) table().set(r.root, r);
}

/**
 * The owner dropped its slot of the root: the reservation goes with it — the slot is its
 * generation, so an old owner's or an old slot's drop never erases a newer reservation.
 */
function release(root: string, slots: Owner, slot: Slot): void {
  const r = table().get(root);
  if (r?.owner === slots && r.slot === slot) table().delete(root);
}

/**
 * An instance's slots: every drop — the reaper, a session's end, a move, the instance's stop —
 * releases the root's reservation it was the generation of (the table holds no dropped slot).
 */
export class OwnedSlots extends Map<string, Slot> {
  override delete(key: string): boolean {
    const slot = this.get(key);
    const had = super.delete(key);
    if (slot) release(key, this, slot);
    return had;
  }
  override clear(): void {
    for (const key of [...this.keys()]) this.delete(key);
  }
}

/** The owner's call ended without a slot of the root: the reservation is free. */
export function unready(r: Reservation, slots: Owner): void {
  if (r.owner === slots && !r.slot && table().get(r.root) === r) table().delete(r.root);
}

/**
 * The root moved to `to`: its reservation goes to that folder's instance if it is live, else it
 * is free. A hand-over nobody takes frees itself after twice the wait.
 */
export function handRoot(root: string, slots: Owner, to: Home, live: boolean): void {
  const r = table().get(root);
  if (r?.owner !== slots) return;
  if (!live) return void table().delete(root);
  arm(r, null, to, 2 * waitMs());
  const untaken = () => table().get(root) === r && !r.owner && Date.now() >= r.until;
  setTimeout(() => untaken() && table().delete(root), 2 * waitMs()).unref?.();
}

/**
 * Wait for another instance's reservation: the owner's slot; undefined — the reservation went
 * meanwhile (reserve again); null — not ready in time: the caller refuses, the reservation stays.
 */
export async function ownerSlot(r: Reservation): Promise<Slot | null | undefined> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const late = await Promise.race([
    r.ready.then(() => false),
    new Promise<boolean>((done) => {
      timer = setTimeout(() => done(true), waitMs());
    }),
  ]);
  clearTimeout(timer);
  if (late) return null;
  return r.owner && r.slot && r.owner.get(r.root) === r.slot ? r.slot : undefined;
}

/**
 * The owner's slot came with a dead bridge: the waiter asks the owner's own door to replace it,
 * once, within the root wait — the revived live slot, or null (no door, failed, late): the
 * caller refuses, no bridge of its own.
 */
export async function revived(r: Reservation): Promise<Slot | null> {
  const door = r.revive;
  if (!door) return null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const slot = await Promise.race([
    door().catch(() => null),
    new Promise<null>((done) => {
      timer = setTimeout(() => done(null), waitMs());
    }),
  ]);
  clearTimeout(timer);
  return slot && !slot.bridge.failure && r.slot === slot ? slot : null;
}

/* eslint-enable @typescript-eslint/no-explicit-any */
