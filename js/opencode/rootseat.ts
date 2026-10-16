// A root session of an aligned project seats itself before its first model request: the
// cover of its directory (shared/cover.ts) names the graph and the agent role, the session's
// own bridge returns the session's seat from disk or stands on the role (seatBy, from tools.ts),
// and the first prompt carries one line to the model — seated, or why not. No cover file —
// no seat and no word. Child sessions are not seated here (launch.ts).
//
// One seating per session (a memoized promise): only the first prompt starts it and
// waits for it — no longer than ROOT_SEAT_MS, then the request goes without a
// seat and the word says so; a seat taken after the term is told by the channel's path. Seatings
// of one instance go one at a time; fresh names carry independent random suffixes across instances.
// The queue bounds service work, not name allocation; a seating hung in the bridge holds the
// line no longer than its ceiling. Only proof from the serving bridge makes the seat
// provisional and promises replacement by an explicit stand in the same graph without take.
import { COVER, envName, ROOT_SEAT } from "../delivery/index.ts";
import { readCover } from "../shared/cover.ts";
import { words } from "../shared/lang.ts";
import type { Seating } from "./rootseat-by.ts";

/** How long the first prompt waits for the seating; the variable is for probes. */
export const rootSeatMs = (): number => Number(process.env[envName("ROOT_SEAT_MS")] || 15_000);
/** Agent-launched headless runs opt out explicitly; a root without parentID is not proof of a human. */
export const rootSeatEnabled = (): boolean => process.env[envName("ROOT_SEAT")] !== "0";
/** How long a seating holds the instance's line: the term and as much again, at most 5 s more. */
const ceilingMs = (): number => rootSeatMs() + Math.min(rootSeatMs(), 5_000);
const pause = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms).unref?.());

/** The word is one line: a refusal's prose is folded and cut. */
const oneLine = (text: string): string => {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length > 300 ? `${t.slice(0, 299)}\u2026` : t;
};

export interface RootSeatDoors {
  /** The session's directory; unknown — null, and the session is not seated. */
  directoryOf(session: string): Promise<string | null>;
  halted(session: string): boolean;
  seat(session: string, realm: string, karta: string, cancelled: () => boolean): Promise<Seating>;
  cancel(session: string): void;
  release(session: string): Promise<void>;
  finished(session: string): void;
  /** A word into the session by the channel's path — it comes before the model's next turn. */
  tell(session: string, text: string): void;
}

export interface RootSeats {
  /** The root's first prompt: waits for the seating and gives its word once; null — nothing to say. */
  word(session: string): Promise<string | null>;
  forget(session: string): void;
  stop(): void;
}

export function createRootSeats(d: RootSeatDoors): RootSeats {
  const W = words(ROOT_SEAT);
  type Told = { word: string | null; seated: boolean };
  type Attempt = { abort: AbortController; done: boolean; begun: boolean; promise: Promise<Told> };
  const seatings = new Map<string, Attempt>();
  const dead = new Set<string>();
  const told = new Set<string>();
  let stopped = false;
  let line: Promise<unknown> = Promise.resolve(); // one seating at a time in this instance

  function start(session: string): Attempt {
    const known = seatings.get(session);
    if (known) return known;
    const no = (word: string | null): Told => ({ word, seated: false });
    const t: Attempt = {
      abort: new AbortController(),
      done: false,
      begun: false,
      promise: Promise.resolve(no(null)),
    };
    const cancelled = () => stopped || t.abort.signal.aborted || d.halted(session);
    seatings.set(session, t);
    const p = (async (): Promise<Told> => {
      const where = await d.directoryOf(session);
      if (cancelled() || !where) return no(null);
      const cover = readCover(where);
      if (cover === null) return no(null);
      if ("why" in cover) return no(W.notSeated(cover.why));
      const before = line;
      const turn = before.then(() => {
        if (cancelled()) return { cancelled: true } as const;
        t.begun = true;
        return d.seat(session, cover.realm, cover.karta, cancelled);
      });
      // A seating hung in the bridge holds the line no longer than its ceiling: the next goes.
      line = before.then(() => Promise.race([turn, pause(ceilingMs())])).catch(() => {});
      const r = await turn;
      if (cancelled() || "cancelled" in r) {
        if (t.begun) await d.release(session);
        return no(null);
      }
      if ("error" in r) return no(W.notSeated(W.refused(oneLine(r.error))));
      if ("other" in r)
        return {
          word: r.uncompared
            ? W.heldUncompared(
                r.other.name,
                r.other.karta,
                r.other.realm || W.unknownRealm(),
                r.uncompared,
              )
            : W.ownOther(r.other.name, r.other.karta, r.other.realm || W.unknownRealm()),
          seated: true,
        };
      return {
        word: (r.provisional === true ? W.seated : W.ownSeated)(
          r.place,
          cover.karta,
          r.realm ?? cover.realm,
          COVER.file,
        ),
        seated: true,
      };
    })()
      .catch(async (e: Error) => {
        if (cancelled()) {
          if (t.begun) await d.release(session);
          return no(null);
        }
        return no(W.notSeated(W.refused(oneLine(e.message))));
      })
      .finally(() => {
        t.done = true;
        if (t.begun) d.finished(session);
      });
    t.promise = p;
    return t;
  }

  return {
    async word(session) {
      if (!rootSeatEnabled() || stopped || dead.has(session)) return null;
      if (told.has(session)) return null;
      told.add(session);
      if (d.halted(session)) return null;
      const ms = rootSeatMs();
      const late = W.notSeated(W.late(Math.round(ms / 100) / 10));
      const seating = start(session);
      const aborted = new Promise<null>((r) =>
        seating.abort.signal.addEventListener("abort", () => r(null), { once: true }),
      );
      const first = await Promise.race([seating.promise, pause(ms).then(() => null), aborted]);
      if (stopped || dead.has(session) || seating.abort.signal.aborted || d.halted(session))
        return null;
      if (first) return first.word;
      // Seated after the term: the model has read "not seated"; the seat follows by the channel.
      void seating.promise.then((t) => {
        if (
          !stopped &&
          !dead.has(session) &&
          !d.halted(session) &&
          t.seated &&
          t.word &&
          seatings.get(session) === seating
        )
          d.tell(session, t.word);
      });
      return late;
    },
    forget(session) {
      dead.add(session);
      d.cancel(session);
      seatings.get(session)?.abort.abort();
    },
    stop() {
      stopped = true;
      for (const [s, t] of seatings)
        if (!t.done) {
          d.cancel(s);
          t.abort.abort();
        }
    },
  };
}
