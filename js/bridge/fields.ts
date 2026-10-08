// Server reply fields next to the prose (graph @nks/nks-dev, node #6637): read when present
// and on form, else the prose template with a log line. Shape: structuredContent `{action, …}`
// with api keys on success of the channel and admin tools; the refusal `_meta` key holds
// {rule, status, data}. Secrets (socket, status url, hook url) are only in the text, never
// in fields. Seats and common helpers here; hooks in hookfields.ts, refusals in refusal.ts.
import { tool } from "../delivery/index.ts";
import { asksFields } from "../shared/fields.ts";
import { log } from "./streams.ts";
import { state } from "./transport.ts";
import { type JsonRpcMessage } from "./types.ts";

/** A seat — seats[] of list, connect and register (one for connect and register). */
export interface Seat {
  seat_id?: string;
  karta_seq?: number;
  karta_name?: string;
  /** `@handle:name` */
  standing?: string;
  listening?: boolean;
  /** api status: `active` | `revoked` | `expired`. */
  state?: string;
  /** undelivered frames */
  pending?: number;
  /** incoming address */
  inbound?: string;
  locale?: string;
  satellite_of?: string | null;
  realm?: string;
  doing?: string;
  /** register: true — opened by this call, false — already existed. */
  opened?: boolean;
}

/** A seat is live only by api status; any other or missing value is not live. */
export const LIVE_STATE = "active";

type Obj = Record<string, unknown>;
export const isObj = (v: unknown): v is Obj => !!v && typeof v === "object" && !Array.isArray(v);
export const is = {
  str: (v: unknown) => v === undefined || typeof v === "string",
  num: (v: unknown) => v === undefined || (typeof v === "number" && Number.isFinite(v)),
  bool: (v: unknown) => v === undefined || typeof v === "boolean",
  strOrNull: (v: unknown) => v === undefined || v === null || typeof v === "string",
};
const SEAT_KEYS: Record<string, (v: unknown) => boolean> = {
  seat_id: is.str,
  karta_seq: is.num,
  karta_name: is.str,
  standing: is.str,
  listening: is.bool,
  state: is.str,
  pending: is.num,
  inbound: is.str,
  locale: is.str,
  satellite_of: is.strOrNull,
  realm: is.str,
  doing: is.str,
  opened: is.bool,
};

export const structuredOf = (reply: JsonRpcMessage | null): unknown =>
  reply?.result?.structuredContent;

/** The harness asked for reply fields itself (graph @nks/nks-dev, node #6731). */
export const harnessAsksFields = (): boolean => asksFields(state.initParams);

/**
 * A tool reply for the harness: without structuredContent unless it asked for fields
 * (graph @nks/nks-dev, node #6707) — given fields, Claude Code shows the model only them,
 * no text. The bridge has already read them.
 */
export function forHarness(reply: JsonRpcMessage): JsonRpcMessage {
  const r = reply?.result;
  if (!r || !("structuredContent" in r) || harnessAsksFields()) return reply;
  const { structuredContent: _, ...rest } = r;
  return { ...reply, result: rest };
}

/**
 * Rows were dropped (`dropped` > 0) or not carried at all (`incomplete: true`). Such fields
 * are unfit: the prose would not lose a seat or hook missing from them.
 */
export const incomplete = (sc: unknown): boolean =>
  isObj(sc) && (sc.incomplete === true || (sc.dropped !== undefined && sc.dropped !== 0));

const said = new Set<string>();
/**
 * Falls back to the prose template; one log line per reason per process (the watchdog reads
 * the board every tact).
 */
export function fallback(what: string, sc: unknown): null {
  const why =
    sc === undefined
      ? "no field — the prose template"
      : incomplete(sc)
        ? "fields incomplete — the prose template"
        : "field off its form — the prose template";
  if (!said.has(`${what}|${why}`)) {
    said.add(`${what}|${why}`);
    log(`structuredContent ${what}: ${why}`);
  }
  return null;
}

const seat = (v: unknown): Seat | null =>
  isObj(v) && Object.entries(SEAT_KEYS).every(([k, ok]) => ok(v[k])) ? (v as Seat) : null;

/** seats[] of this action, all on form, else null. */
function seats(sc: unknown, action: string): Seat[] | null {
  const what = `${tool("channel")} ${action}`;
  if (!isObj(sc) || incomplete(sc) || sc.action !== action || !Array.isArray(sc.seats))
    return fallback(what, sc);
  const out = sc.seats.map(seat);
  return out.every((s) => s) ? (out as Seat[]) : fallback(what, sc);
}

/** The board by fields; folded — how many seats the board folded. */
export function boardField(sc: unknown): { seats: Seat[]; folded: number } | null {
  const list = seats(sc, "list");
  if (!list) return null;
  const folded = (sc as Obj).folded;
  const whole = list.every(
    (s) =>
      typeof s.karta_seq === "number" &&
      typeof s.standing === "string" &&
      s.standing.startsWith("@") &&
      typeof s.listening === "boolean",
  );
  if (!whole || !is.num(folded)) return fallback(`${tool("channel")} list`, sc);
  return { seats: list, folded: typeof folded === "number" ? folded : 0 };
}

/** The single seat of a connect or register reply, else null. */
export function seatField(sc: unknown, action: string): Seat | null {
  const list = seats(sc, action);
  if (!list) return null;
  return list.length === 1 ? list[0] : fallback(`${tool("channel")} ${action}`, sc);
}
