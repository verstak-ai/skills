// A root session of an aligned project seats itself before its first model request: the
// cover of its directory (shared/cover.ts) names the graph and the agent role, the session's
// own bridge returns the session's seat from disk or stands on the role (seatBy, from tools.ts),
// and the first prompt carries one line to the model — seated, or why not. No cover file —
// no seat and no word. Child sessions are not seated here (launch.ts).
//
// One seating per session (a memoized promise): session.created may start it early, the
// first prompt waits for it — no longer than ROOT_SEAT_MS, then the request goes without a
// seat and the word says so. Seatings of one instance go one at a time: the second root of the
// same role reads the board after the first stood and takes a seat beside, not the same name.
import { COVER, envName, PLUGIN, ROOT_SEAT } from "../delivery/index.ts";
import { readCover } from "../shared/cover.ts";
import { words } from "../shared/lang.ts";
import { STAND_TOOL } from "./satellite.ts";
import type { Slot } from "./slot.ts";

/** How long the first prompt waits for the seating; the variable is for probes. */
export const rootSeatMs = (): number => Number(process.env[envName("ROOT_SEAT_MS")] || 15_000);

/** A seat as the plugin knows it: the bridge's held word, else the seat's key. */
export interface HeldSeat {
  name: string;
  karta: string;
  realm: string;
}

/**
 * The seating's outcome: the seat taken; the session's own previous seat that returned in
 * another role or graph than the cover's (not taken as the root's seating); the refusal.
 */
export type Seating = { place: string } | { other: HeldSeat } | { error: string };

/** The word is one line: a refusal's prose is folded and cut. */
const oneLine = (text: string): string => {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length > 300 ? `${t.slice(0, 299)}\u2026` : t;
};

export interface RootSeatDoors {
  /** The session's directory; unknown — null, and the session is not seated. */
  directoryOf(session: string): Promise<string | null>;
  seat(session: string, realm: string, karta: string): Promise<Seating>;
}

/** What seatBy needs of the "tools" half (tools.ts). */
export interface SeatDoors {
  slotFor(session: string): Promise<Slot>;
  awaitReady(slot: Slot): Promise<void>;
  callThrough(
    slot: Slot,
    name: string,
    input: Record<string, unknown>,
    session: string,
    service: boolean,
  ): Promise<{ content: string }>;
}

/** The seat a slot holds: the bridge's held word, else its key "name--karta--realm" (bridge/holdrecord.ts keyOf). */
function heldSeat(slot: Slot): HeldSeat {
  if (slot.place) return { ...slot.place };
  const [name = "", karta = "", realm = ""] = (slot.key ?? "").split("--");
  return { name, karta, realm };
}

const keyPart = (t: string): string => t.trim().replace(/[^A-Za-z0-9._-]+/g, "_");
const short = (t: string): boolean => /^r\d+$/.test(t.trim());
/**
 * The held seat is the cover's: the same role, and the same graph. A graph is compared in the
 * key's spelling, a bare slug matching its @owner/slug; rN against a slug is not resolved here,
 * and then only the role is compared.
 */
export function sameSeat(seat: HeldSeat, realm: string, karta: string): boolean {
  if (keyPart(seat.karta.replace(/^#/, "")) !== keyPart(karta)) return false;
  if (short(seat.realm) !== short(realm)) return true;
  const [x, y] = [keyPart(seat.realm), keyPart(realm)];
  return x === y || x.endsWith(`_${y}`) || y.endsWith(`_${x}`);
}

/**
 * A root's seat by its cover: the session's own seat returns from disk first (keep.ts);
 * otherwise a stand on the role, the name derived by the bridge — beside a seat another
 * session hears, never over it. A service move, not the agent's.
 */
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
      if (slot.holding) {
        const own = heldSeat(slot);
        return sameSeat(own, realm, karta) ? { place: own.name } : { other: own };
      }
      const out = await d.callThrough(slot, STAND_TOOL, { realm, karta }, root, true);
      if (!slot.holding) return { error: out.content || words(PLUGIN).refusalNoText(STAND_TOOL) };
      return { place: heldSeat(slot).name };
    } finally {
      slot.busy--;
      slot.lastCall = Date.now();
    }
  } catch (e) {
    return { error: (e as Error).message };
  }
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
  const seatings = new Map<string, Promise<string | null>>();
  const told = new Set<string>();
  let line: Promise<unknown> = Promise.resolve(); // one seating at a time in this instance

  function start(session: string, dir?: string): Promise<string | null> {
    const known = seatings.get(session);
    if (known) return known;
    const p = (async (): Promise<string | null> => {
      const where = dir ?? (await d.directoryOf(session));
      if (!where) return null;
      const cover = readCover(where);
      if (cover === null) return null;
      if ("why" in cover) return W.notSeated(cover.why);
      const turn = line.then(() => d.seat(session, cover.realm, cover.karta));
      line = turn.catch(() => {});
      const r = await turn;
      if ("error" in r) return W.notSeated(W.refused(oneLine(r.error)));
      if ("other" in r) return W.notSeated(W.ownOther(r.other.name, r.other.karta, r.other.realm));
      return W.seated(r.place, cover.karta, cover.realm, COVER.file);
    })().catch((e: Error) => W.notSeated(W.refused(oneLine(e.message))));
    seatings.set(session, p);
    return p;
  }

  return {
    start: (session, dir) => void start(session, dir),
    async word(session) {
      if (told.has(session)) return null;
      told.add(session);
      const ms = rootSeatMs();
      let timer: ReturnType<typeof setTimeout> | undefined;
      const late = new Promise<string>((r) => {
        timer = setTimeout(() => r(W.notSeated(W.late(Math.round(ms / 100) / 10))), ms);
      });
      try {
        return await Promise.race([start(session), late]);
      } finally {
        clearTimeout(timer);
      }
    },
    forget(session) {
      seatings.delete(session);
      told.delete(session);
    },
  };
}
