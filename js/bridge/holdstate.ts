// Hold state (hold.ts) per bridge session (shared/scope.ts): in the machine daemon each
// session has its own channel socket and place doors, like separate bridge processes.
import { type Holder } from "../shared/channel.ts";
import { scoped } from "../shared/scope.ts";
import { type ChannelEvent, type Door } from "./door.ts";

export type Frame = NonNullable<ChannelEvent["frame"]>;

export const H = scoped(() => ({
  /** session dir the place is taken from (stand cwd), kept in the hold record for cwd resume (resume.ts) */
  standCwd: null as string | null,
  holder: null as Holder | null,
  /** last service sign of a socket released by parkStanding; the record lifetime counts from it (holdkeep.ts) */
  heardAt: 0,
  /** door of the primary place, the one the socket was taken for */
  door: null as Door | null,
  currentKey: null as string | null,
  currentUrl: null as string | null,
  currentStatusUrl: null as string | null,
  /** key of the place taken from this bridge by close 4000 */
  evictedKey: null as string | null,
  /** told to a client attaching later */
  evictedEvent: null as ChannelEvent | null,
  /** left the place: service socket closed, key and addresses kept (leave.ts) */
  parked: false,
  /** socket reopened on the same address without this opening's hello yet: another may have rotated it (deaf.ts) */
  unheard: false,
  /** key of a place whose socket was released but binding remembered, until hello proves hearing (deaf.ts) */
  deafKey: null as string | null,
  /** places of other graphs on the channel at the 4001: the server remembers the binding, no hearing (deaf.ts) */
  deadPlaces: [] as { realm: string; karta: string | number; name?: string }[],
  attachHooks: [] as (() => void)[],
  helloWaiters: new Set<(f: Frame | null) => void>(),
  /** disk resumes in flight: a dead token during one is a stale record, not an alarm */
  resuming: 0,
  /** own revoke in flight (absorb.ts): close 4001 outruns the revoke answer */
  revokingOwn: false,
  /** own channel close in flight (absorb.ts): close 4001 outruns the answer, as with revoke (#6634) */
  closingOwn: false,
  /** the daemon goes down while this session's thin bridge lives and restores the place (daemon.ts, #6485) */
  handingOver: null as string | null,
}));

/** Next step after eviction (evicted.ts): set once at load, one per process for all sessions. */
export const E: { next: ((key: string, url: string, code: number) => void) | null } = {
  next: null,
};
export function whenEvicted(fn: (key: string, url: string, code: number) => void): void {
  E.next = fn;
}

/** A disk resume started (+1) or ended (-1). */
export function noteResuming(delta: number): void {
  H.resuming += delta;
}

/** absorb.ts: own revoke in flight; close 4001 is then not a dead token. */
export function setRevokingOwn(v: boolean): void {
  H.revokingOwn = v;
}

/** absorb.ts: own channel close in flight; close 4001 is then not a dead token. */
export function setClosingOwn(v: boolean): void {
  H.closingOwn = v;
}

/**
 * The process hands places to a successor (daemon update, daemon.ts): "handed over", not
 * "released"; hold records stay, busy is kept. Process-wide: all daemon sessions leave at once.
 */
let handingOver: string | null = null;
export function beginHandover(why: string): void {
  handingOver = why;
}
/**
 * Per session: the daemon stops without a successor (SIGTERM) while the session's thin bridge
 * is connected and will restore the place by its hold record; a holder change, not the doer
 * leaving (#6485).
 */
export function beginSessionHandover(why: string): void {
  H.handingOver = why;
}
/** Why places are handed to a successor; null if they are not. */
export const handoverReason = (): string | null => handingOver ?? H.handingOver;
export const handoverUnderway = (): boolean => handoverReason() !== null;
