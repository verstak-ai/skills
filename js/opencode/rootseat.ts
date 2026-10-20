// A root session of an aligned project seats itself before its first model request: the
// cover of its directory (shared/cover.ts) names the graph and the agent role, the session's
// own bridge returns the session's seat from disk or stands on the role (seatBy, from tools.ts),
// and the first prompt carries one line to the model — seated, or why not (rootseat-say.ts).
// A defective or absent cover — the word to align, and the root waits (rootseat-again.ts); a
// tool call wakes only its own root's wait. A session moved away while waiting has its wait set
// aside; back here, it waits again for its cover, and a prompt before that reads the cover anew.
// A seating in flight and the seat held move by half.moved (moves.ts), first or retried alike.
// Child sessions are not seated here (launch.ts); the contract and terms — rootseat-doors.ts.
//
// One seating per session (a memoized promise): only the first prompt starts it and
// waits for it — no longer than ROOT_SEAT_MS, then the request goes without a
// seat and the word says so; a seat taken after the term is told by the channel's path. Seatings
// of one instance go one at a time; fresh names carry independent random suffixes across instances.
// The queue bounds service work, not name allocation; a seating hung in the bridge holds the
// line no longer than its ceiling. Only proof from the serving bridge makes the seat
// provisional and promises replacement by an explicit stand in the same graph without take.
import { createRealign } from "./rootseat-again.ts";
import { type Attempt, attempt } from "./rootseat-attempt.ts";
import {
  pause,
  type RootSeatDoors,
  rootSeatEnabled,
  rootSeatMs,
  type RootSeats,
} from "./rootseat-doors.ts";
import { lateWord, realignWord } from "./rootseat-say.ts";

export function createRootSeats(d: RootSeatDoors): RootSeats {
  const seatings = new Map<string, Attempt>();
  const dead = new Set<string>();
  const told = new Set<string>();
  let stopped = false;
  const line = { at: Promise.resolve() as Promise<unknown> }; // one seating at a time in this instance
  const again = createRealign((s) => stopped || dead.has(s) || d.halted(s));
  const alive = (s: string, a: Attempt): boolean =>
    !stopped && !dead.has(s) && !d.halted(s) && seatings.get(s) === a;
  const doors = { d, stopped: () => stopped, arm: again.arm, line };

  function start(session: string, expect?: string): Attempt {
    const known = seatings.get(session);
    if (known) return known;
    const t = attempt(session, doors, expect);
    seatings.set(session, t);
    return t;
  }

  /** The prompt waits for the seating no longer than its term; a later seat goes by the channel. */
  async function wait(session: string, seating: Attempt): Promise<string | null> {
    const ms = rootSeatMs();
    const aborted = new Promise<null>((r) =>
      seating.abort.signal.addEventListener("abort", () => r(null), { once: true }),
    );
    const first = await Promise.race([seating.promise, pause(ms).then(() => null), aborted]);
    if (stopped || dead.has(session) || seating.abort.signal.aborted || d.halted(session))
      return null;
    if (first) return first.word;
    // Seated after the term: the model has read "not seated"; the seat follows by the channel.
    if (!seating.followed)
      void seating.promise.then((t) => {
        if (alive(session, seating) && t.seated && t.word) d.tell(session, t.word);
      });
    seating.followed = true;
    return lateWord(ms);
  }

  /**
   * The seating after the alignment, its word delivered once: a tool hook and a prompt that
   * both wait for it within the term — the first to have the word gives it, the other none.
   */
  async function retried(session: string, a?: Attempt, where?: string): Promise<string | null> {
    if (!a) {
      seatings.delete(session);
      a = start(session, where);
      a.retry = true;
    }
    const word = await wait(session, a);
    if (!word || a.said) return null;
    a.said = true;
    return word;
  }

  return {
    async word(session) {
      if (!rootSeatEnabled() || stopped || dead.has(session)) return null;
      if (told.has(session)) {
        const a = seatings.get(session);
        if (a?.retry && !(a.done && a.said)) return retried(session, a);
        const next = again.check(session, true);
        if (!next) return null;
        return "why" in next ? realignWord(next.why) : retried(session, undefined, next.seat);
      }
      told.add(session);
      if (d.halted(session)) return null;
      return wait(session, start(session));
    },
    aligning: (session) => again.has(session),
    async touched(session) {
      if (!rootSeatEnabled() || stopped) return;
      // Into the running turn, no new one: the hook holds the turn no longer than the term.
      const next = again.check(session, false);
      const word = !next
        ? null
        : "why" in next
          ? realignWord(next.why)
          : await retried(session, undefined, next.seat);
      if (word) await d.steer(session, word);
    },
    moved(session, here) {
      if (here !== null) {
        // Synchronous, by the event's own folder: no late answer outlives a later move.
        const fresh = !stopped && !dead.has(session) && !told.has(session);
        if (again.back(session, fresh ? here : "")) told.add(session);
        return;
      }
      // A seating in flight is half.moved's, as on a first prompt; only a wait is set aside here.
      if (!again.leave(session)) return;
      told.delete(session);
      if (seatings.get(session)?.done) seatings.delete(session);
    },
    forget(session) {
      dead.add(session);
      again.drop(session);
      d.cancel(session);
      seatings.get(session)?.abort.abort();
    },
    stop() {
      stopped = true;
      again.clear();
      for (const [s, t] of seatings)
        if (!t.done) {
          d.cancel(s);
          t.abort.abort();
        }
    },
  };
}
