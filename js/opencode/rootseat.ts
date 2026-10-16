// A root session of an aligned project seats itself before its first model request: the
// cover of its directory (shared/cover.ts) names the graph and the agent role, the session's
// own bridge returns the session's seat from disk or stands on the role (seatBy, from tools.ts),
// and the first prompt carries one line to the model — seated, or why not. No cover file —
// no seat and no word. Child sessions are not seated here (launch.ts).
//
// One seating per session (a memoized promise): session.created may start it early, the
// first prompt waits for it — no longer than ROOT_SEAT_MS, then the request goes without a
// seat and the word says so; a seat taken after the term is told by the channel's path. Seatings
// of one instance go one at a time: the second root of the same role reads the board after the
// first stood and takes a seat beside, not the same name; a seating hung in the bridge holds the
// line no longer than its ceiling. The seat is provisional: the agent's own stand in the same
// graph replaces it (bridge/provisional.ts).
import { COVER, envName, ROOT_SEAT } from "../delivery/index.ts";
import { readCover } from "../shared/cover.ts";
import { words } from "../shared/lang.ts";
import type { Seating } from "./rootseat-by.ts";

/** How long the first prompt waits for the seating; the variable is for probes. */
export const rootSeatMs = (): number => Number(process.env[envName("ROOT_SEAT_MS")] || 15_000);
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
  seat(session: string, realm: string, karta: string): Promise<Seating>;
  /** A word into the session by the channel's path — it comes before the model's next turn. */
  tell(session: string, text: string): void;
}

export interface RootSeats {
  /** Start the seating of a root session (session.created); the directory when the event names it. */
  start(session: string, dir?: string): void;
  /** The root's first prompt: waits for the seating and gives its word once; null — nothing to say. */
  word(session: string): Promise<string | null>;
  forget(session: string): void;
}

export function createRootSeats(d: RootSeatDoors): RootSeats {
  const W = words(ROOT_SEAT);
  type Told = { word: string | null; seated: boolean };
  const seatings = new Map<string, Promise<Told>>();
  const told = new Set<string>();
  let line: Promise<unknown> = Promise.resolve(); // one seating at a time in this instance

  function start(session: string, dir?: string): Promise<Told> {
    const known = seatings.get(session);
    if (known) return known;
    const no = (word: string | null): Told => ({ word, seated: false });
    const p = (async (): Promise<Told> => {
      const where = dir ?? (await d.directoryOf(session));
      if (!where) return no(null);
      const cover = readCover(where);
      if (cover === null) return no(null);
      if ("why" in cover) return no(W.notSeated(cover.why));
      const before = line;
      const turn = before.then(() => d.seat(session, cover.realm, cover.karta));
      // A seating hung in the bridge holds the line no longer than its ceiling: the next goes.
      line = before.then(() => Promise.race([turn, pause(ceilingMs())])).catch(() => {});
      const r = await turn;
      if ("error" in r) return no(W.notSeated(W.refused(oneLine(r.error))));
      if ("other" in r)
        return no(W.notSeated(W.ownOther(r.other.name, r.other.karta, r.other.realm)));
      return { word: W.seated(r.place, cover.karta, cover.realm, COVER.file), seated: true };
    })().catch((e: Error) => no(W.notSeated(W.refused(oneLine(e.message)))));
    seatings.set(session, p);
    return p;
  }

  return {
    start: (session, dir) => void start(session, dir),
    async word(session) {
      if (told.has(session)) return null;
      told.add(session);
      const ms = rootSeatMs();
      const late = W.notSeated(W.late(Math.round(ms / 100) / 10));
      const seating = start(session);
      const first = await Promise.race([seating, pause(ms).then(() => null)]);
      if (first) return first.word;
      // Seated after the term: the model has read "not seated"; the seat follows by the channel.
      void seating.then((t) => {
        if (t.seated && t.word && seatings.get(session) === seating) d.tell(session, t.word);
      });
      return late;
    },
    forget(session) {
      seatings.delete(session);
      told.delete(session);
    },
  };
}
