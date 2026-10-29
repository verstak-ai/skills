// One seat channel's subscription on the dispatcher connection (graph @nks/nks-dev, node #8620):
// what the holder facade (muxhold.ts) and the router (muxroute.ts) share. The dedup window is the
// subscription's, not the connection's: a frame sent again in a new subscription after a break
// or a resubscribe is known by its id (the last 1000 ids of the channel).
import { type Frame, type Holder, type HoldOptions } from "../shared/channel.ts";
import { type Lost, type TickEntry } from "./muxtick.ts";

const SEEN_MAX = 1000;

export interface Sub {
  secret: string;
  o: HoldOptions;
  /** The ref of the subscribe in flight on the current connection. */
  ref: string | null;
  /** From hello: the channel and the server's subscription id. */
  channel: string | null;
  sub: string | null;
  /** hello came on the current connection. */
  live: boolean;
  /** The holder let it go: unsubscribed or about to be. */
  closed: boolean;
  /** Seat ids of the channel from the last hello, and how many seats it named, ids or not. */
  standings: string[];
  seats: number;
  /** An unasked 1000 had its one resubscribe; the next ends it unless a tact passed from helloAt. */
  resubscribed: boolean;
  helloAt: number;
  handing: { onFrame: (raw: string) => void; onGone: (code: number) => void } | null;
  /** No dispatcher: the holder holds its own socket now. */
  fallback: Holder | null;
  heardAt: number;
  tries: number;
  retry: ReturnType<typeof setTimeout> | null;
  seen: Set<string>;
  /**
   * Busy and usage lines given before hello, the last per seat and kind (#8620 v15): into the
   * tact once hello names the seats; if no dispatcher turns out to be there, the old way.
   */
  early: Early[];
}

/** Whom a line is for: a seat id; EVERY — each seat of the channel; null — the own seat, id unknown. */
export const EVERY = Symbol("every seat");
export type SeatScope = string | null | typeof EVERY;

/** `url` — the address the line was given for; `lost` — no dispatcher after all: the old way. */
export interface Early {
  url: string;
  scope: SeatScope;
  fields: Pick<TickEntry, "status" | "usage">;
  lost?: () => void;
}

const kindOf = (e: Early): string => ("status" in e.fields ? "status" : "usage");

/**
 * Held for hello: a newer line replaces every older one of its kind it covers — one without a
 * seat id (the own seat unknown, or each seat) covers them all, one with an id covers that seat.
 */
export function holdEarly(s: Sub, e: Early): void {
  const covered = (x: Early): boolean =>
    kindOf(x) === kindOf(e) && (typeof e.scope !== "string" || x.scope === e.scope);
  s.early = s.early.filter((x) => !covered(x)).concat(e);
}

// The seat ids a line goes to (#8620 v15): each record names its seat on a channel of several;
// without a known id only a channel of one seat takes a line — none fans out to all.
export function seatsFor(s: Sub, scope: SeatScope): (string | null)[] {
  if (typeof scope === "string") return [scope];
  if (scope === EVERY && s.standings.length) return s.standings;
  if (s.standings.length === 1) return s.standings;
  return s.seats <= 1 && !s.standings.length ? [null] : [];
}

export const entryOf = (
  channel: string,
  id: string | null,
  fields: Early["fields"],
): TickEntry => ({
  channel_id: channel,
  ...(id ? { standing_id: id } : {}),
  ...fields,
});

export function newSub(secret: string, o: HoldOptions): Sub {
  return {
    secret,
    o,
    ref: null,
    channel: null,
    sub: null,
    live: false,
    closed: false,
    standings: [],
    seats: 0,
    resubscribed: false,
    helloAt: 0,
    handing: null,
    fallback: null,
    heardAt: 0,
    tries: 0,
    retry: null,
    seen: new Set(),
    early: [],
  };
}

/** True — the id is new to the subscription and is now remembered. */
export function firstSeen(s: Sub, id: string): boolean {
  if (s.seen.has(id)) return false;
  s.seen.add(id);
  if (s.seen.size > SEEN_MAX) s.seen.delete(s.seen.values().next().value as string);
  return true;
}

/** A frame of the subscription to its holder, once by its id; true — it carries a seq to ack. */
export function deliver(s: Sub, f: Frame): boolean {
  s.heardAt = Date.now();
  const id = typeof f.id === "string" ? f.id : "";
  if (!id || firstSeen(s, id)) {
    const seat = asSeatFrame(f);
    if (s.handing) s.handing.onFrame(seat.raw);
    else s.o.onFrame(seat.raw, seat.frame);
  }
  return typeof f.seq === "number";
}

/** Lines given before hello, now that hello named the channel and its seats; `lost` rides on. */
export function earlyLines(s: Sub, channel: string): [TickEntry, Lost][] {
  return s.early
    .splice(0)
    .flatMap(({ scope, fields, lost }) =>
      seatsFor(s, scope).map((id): [TickEntry, Lost] => [entryOf(channel, id, fields), lost]),
    );
}

/** The frame as a seat's own socket gives it: the connection's labels stripped. */
export function asSeatFrame(f: Frame): { raw: string; frame: Frame } {
  const { channel_id: _c, sub: _s, seq: _q, ref: _r, ...rest } = f;
  return { raw: JSON.stringify(rest), frame: rest as Frame };
}

/** The secret of a seat address: the last segment of /channel/ws/<secret> or /channel/status/<secret>. */
export function secretOf(url: string): string | null {
  try {
    const m = /\/channel\/(?:ws|status)\/([^/?#]+)$/.exec(new URL(url).pathname);
    return m ? decodeURIComponent(m[1]) : null;
  } catch {
    return null;
  }
}
