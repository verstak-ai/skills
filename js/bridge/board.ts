// The standings board: places[] of structuredContent (fields.ts), else the server's
// prose parsed by its observed form (graph @nks/nks-dev, node #4514): a seat line
// `#N … · @handle:name — …`, then `📥 address`. Control acts only on an unambiguous form.
import { BOARD_FORM } from "../delivery/index.ts";
import { boardField, LIVE_STATE, type Seat } from "./fields.ts";

export interface BoardEntry {
  karta: string;
  address: string;
  rest: string;
  incoming: string | null;
  /** The seat's own id from the `id <uuid>` line under it; null when the board lacks it. */
  id: string | null;
  /** Signs from fields; a seat parsed from prose has none — `rest` decides. */
  listening?: boolean;
  undelivered?: number;
  alive?: boolean;
}

export interface Board {
  entries: BoardEntry[];
  /** Form recognized: fields, header, empty-board phrase or at least one seat. */
  recognized: boolean;
  /** Seat count from the prose header; from fields only with folded seats, else null. */
  declared: number | null;
}

const fromField = (s: Seat): BoardEntry => ({
  karta: String(s.karta_seq),
  address: s.standing ?? "",
  rest: "",
  incoming: s.inbound ?? null,
  id: s.seat_id ?? null,
  listening: s.listening,
  undelivered: s.pending ?? 0,
  // Liveness only from the api status; an unknown or missing value is not alive.
  alive: s.state === LIVE_STATE,
});

/** The channel list reply: fields when the server gave them in form, else prose. */
export function readBoard(a: { text: string; structured?: unknown }): Board {
  const board = boardField(a.structured);
  if (board) {
    const entries = board.seats.map(fromField);
    // Folded seats are not listed — like a prose header whose count did not match.
    const declared = board.folded > 0 ? entries.length + board.folded : null;
    return { entries, recognized: true, declared };
  }
  const entries = parseBoard(a.text);
  const header = FORM.boardHeader.exec(a.text);
  // An empty graph is a legitimate emptiness (#4514).
  const empty = FORM.boardEmpty.test(a.text);
  return {
    entries,
    recognized: !!header || empty || entries.length > 0,
    declared: header?.[1] != null ? Number(header[1]) : null,
  };
}

/** Board lines: `#N … · @handle:name — …`, then `📥 https://…` and `id <uuid>`. */
export function parseBoard(text: string): BoardEntry[] {
  const out: BoardEntry[] = [];
  for (const line of text.split("\n")) {
    const m = /^\s*#(\d+)\s.*?·\s(@\S+)\s—\s(.*)$/.exec(line);
    if (m) {
      out.push({ karta: m[1], address: m[2], rest: m[3], incoming: null, id: null });
      continue;
    }
    const inc = /📥\s*(https?:\/\/\S+)/.exec(line);
    if (inc && out.length) out[out.length - 1].incoming = inc[1];
    const id = /^\s*id\s+([0-9a-f][0-9a-f-]{7,})\s*$/i.exec(line);
    if (id && out.length) out[out.length - 1].id = id[1];
  }
  return out;
}

/** Own half of `@handle:name`, compared whole: `endsWith(":proba")` would match neighbour `x.proba`. */
export const nameOf = (address: string): string => address.slice(address.indexOf(":") + 1);

/**
 * Server prose forms of the board and hook list, both languages (graph @nks/nks-dev,
 * nodes #4514, #6637): a fallback until the server gives fields; the bridge on an
 * English surface asks accept-language: en. Russian forms observed, English assumed.
 */
export const FORM = BOARD_FORM;

/** Whether the seat listens per the board — presence, not traffic. */
export const listens = (e: BoardEntry): boolean => e.listening ?? FORM.listens.test(e.rest);

export const alive = (e: BoardEntry): boolean => e.alive ?? FORM.alive.test(e.rest);

/** Frames the board calls undelivered for the seat; 0 when the line is silent. */
export function undelivered(e: BoardEntry): number {
  if (e.undelivered != null) return e.undelivered;
  const m = FORM.undelivered.exec(e.rest);
  return m ? Number(m[1]) : 0;
}
