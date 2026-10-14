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
  /** a return from disk brings the seats beside back: the handover spool waits for them (#7602) */
  spoolHeld: 0,
  spoolLater: null as (() => void) | null,
  /** live frames of a seat beside not back yet, judged after the spool once the return ends */
  liveLater: [] as (() => void)[],
  /** own revoke in flight (absorb.ts): close 4001 outruns the revoke answer */
  revokingOwn: false,
  /** own channel close in flight (absorb.ts): close 4001 outruns the answer, as with revoke (#6634) */
  closingOwn: false,
  /** keys of seats beside whose own revoke is in flight (absorb.ts): standing_ended outruns the answer */
  revokingBeside: new Set<string>(),
  /** the daemon goes down while this session's thin bridge lives and restores the place (daemon.ts, #6485) */
  handingOver: null as string | null,
  /** the last owner's stop of this session (stophold.ts, #7439): `n` counts stops, a move compares it before and after */
  stopped: { n: 0, key: "", text: "" },
  /** a stand call in flight since this stop count (standundo.ts): a stop meanwhile — its connect answers are not held */
  moveSince: null as number | null,
  /** seats a stand call in flight took or bound again (connect, register answered): a stop meanwhile takes them off */
  taken: null as { realm: string; karta: string; name: string }[] | null,
}));

/** A channel connect or register answered: the seat goes into the stand call's list, if one runs. */
export function noteTaken(a: Record<string, unknown>): void {
  if (!H.taken || (a.action !== "connect" && a.action !== "register")) return;
  const seat = {
    realm: String(a.realm ?? ""),
    karta: String(a.karta ?? ""),
    name: String(a.name ?? ""),
  };
  if (
    !H.taken.some((s) => s.realm === seat.realm && s.karta === seat.karta && s.name === seat.name)
  )
    H.taken.push(seat);
}

/** The stop word if the seat `key` was taken off by its owner since the count `before` (stopsNow); otherwise null. */
export const stoppedSince = (before: number, key: string): string | null =>
  H.stopped.n !== before && H.stopped.key === key ? H.stopped.text : null;
export const stopsNow = (): number => H.stopped.n;
/** The stop word if the session was stopped since the count `before`, whichever seat it held; otherwise null. */
export const stoppedDuring = (before: number): string | null =>
  H.stopped.n !== before ? H.stopped.text : null;
/** A stand call's connect answers after the session was stopped: the seat it took is not held (#7439). */
export const stoppedInMove = (): boolean =>
  H.moveSince !== null && stoppedDuring(H.moveSince) !== null;

/** Next step after eviction (evicted.ts) and after the owner's stop (stophold.ts): set once at load, one per process for all sessions. */
export const E: {
  next: ((key: string, url: string, code: number) => void) | null;
  /** close 4001 not the session's own; or a standing_ended frame (`ended`) naming a seat of the channel */
  stop: ((key: string, code: number, reason: string, ended?: Frame) => void) | null;
  /** every frame of the socket passes the stop orders (stoporder.ts): true — a stop frame, taken, not the agent's */
  order: ((url: string, frame: Frame | null) => boolean) | null;
  /** The seat's pulse (pulse.ts): a frame or hello came, or `holder` is about to be let go ("last"). */
  pulse: ((why: "hello" | "frame" | "last", holder?: Holder) => void) | null;
} = {
  next: null,
  stop: null,
  order: null,
  pulse: null,
};
export function whenPulsed(fn: NonNullable<(typeof E)["pulse"]>): void {
  E.pulse = fn;
}
export function whenOrdered(fn: NonNullable<(typeof E)["order"]>): void {
  E.order = fn;
}
export function whenEvicted(fn: (key: string, url: string, code: number) => void): void {
  E.next = fn;
}
export function whenStopped(fn: NonNullable<(typeof E)["stop"]>): void {
  E.stop = fn;
}

/** A disk resume started (+1) or ended (-1). */
export function noteResuming(delta: number): void {
  H.resuming += delta;
}

/**
 * Hold the handover spool while `fn` returns the seat with its seats beside: a spooled frame
 * of a seat beside is judged once that seat is back, not given to the main seat as a stray (#7602).
 */
export async function withSpoolHeld<T>(fn: () => Promise<T>): Promise<T> {
  H.spoolHeld++;
  try {
    return await fn();
  } finally {
    if (--H.spoolHeld === 0) {
      const later = [...(H.spoolLater ? [H.spoolLater] : []), ...H.liveLater];
      Object.assign(H, { spoolLater: null, liveLater: [] });
      for (const fn of later) fn();
    }
  }
}
/** Drain the spool now, or once the return holding it ends. */
export function drainWhenFree(drain: () => void): void {
  if (H.spoolHeld > 0) H.spoolLater = drain;
  else drain();
}
/** A live frame waits like the spool while a return is held (after it); false — not held, judge now. */
export function liveWhenFree(judge: () => void): boolean {
  if (H.spoolHeld === 0) return false;
  H.liveLater.push(judge);
  return true;
}

/** absorb.ts: own revoke in flight; close 4001 is then not a dead token. */
export function setRevokingOwn(v: boolean): void {
  H.revokingOwn = v;
}

/** absorb.ts: own channel close in flight; close 4001 is then not a dead token. */
export function setClosingOwn(v: boolean): void {
  H.closingOwn = v;
}

/** absorb.ts: own revoke of the seat beside `key` in flight (true) or answered (false). */
export function setRevokingBeside(key: string, v: boolean): void {
  if (v) H.revokingBeside.add(key);
  else H.revokingBeside.delete(key);
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
