// Case reads use the same authenticated orchestrator identity as invites and raised (#10995).
// The page form is the api holder's (#48 in the graph's case): GET /rooms/{id}/history?since=N
// &limit ≤ 200 → {items, cursor, numbering:"case"} — cursor is the number of the last covered
// entry, or the former one when nothing new came; the end is an empty items with the cursor
// unmoved. The whole form lives in the two parsers below — the rest of the code reasons over
// parsed entries only, so a changed page never reaches past this file. Every history read
// carries since and advance=false: the reader holds no seat, and the platform's own cursor
// must not move — without since a one-seat account would read from that seat's cursor instead.
import { namedFetch } from "../shared/http.ts";
import { ORCHESTRA_SESSION_HEADER, ORCHESTRA_SESSION_ID } from "./orchestra-session.ts";

/** The raised door's own cap (#6010); the case door shares it. */
const LIMIT = 200;
const TIMEOUT_MS = 10_000;

/** One history path with both of the holder's read parameters always present. */
const historyPath = (room: string, since: number): string =>
  `/rooms/${encodeURIComponent(room)}/history?since=${since}&limit=${LIMIT}&advance=false`;

/** One case-door GET under the orchestrator identity; a refusal's rule rides the error. A
 * 409 standing_required under advance=false cannot happen by the holder's word — its arrival
 * is an api defect, said aloud in the journal and named in the error. */
async function caseGet(base: string, token: string, path: string): Promise<unknown> {
  const res = await namedFetch(`${base}${path}`, {
    headers: {
      authorization: `Bearer ${token}`,
      [ORCHESTRA_SESSION_HEADER]: ORCHESTRA_SESSION_ID,
    },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (res.ok) return res.json();
  const body = (await res.json().catch(() => ({}))) as { errors?: { rule?: unknown }[] };
  if (res.status === 409 && body.errors?.[0]?.rule === "standing_required") {
    process.stderr.write("case_history_standing_required_under_advance_false\n");
    throw new Error("api_defect_standing_required");
  }
  throw new Error(String(res.status));
}

/** One journal entry as the tact reasons over it: the page's own fields, parsed. */
export interface CaseEntry {
  /** The entry's number in the case — the journal's own numbering. */
  n: number;
  kind: string;
  to_standing_id: string | null;
  to_karta_node_id: string | null;
  in_reply_to: number | null;
  author_standing_id: string | null;
  author: string | null;
  key: string | null;
  verdict: string | null;
  body_pending: boolean;
  aborted: boolean;
  /** The left's own reason, from payload (revoked, expired, unheard). */
  reason: string | null;
  /** A platform invite's cause and the seat whose end opened it, from payload (ownerless). */
  cause: string | null;
  gone_standing: string | null;
}

const text = (v: unknown): string | null => (typeof v === "string" && v ? v : null);
const number = (v: unknown): number | null =>
  typeof v === "number" && Number.isSafeInteger(v) && v > 0 ? v : null;

function entryOf(v: unknown): CaseEntry {
  if (!v || typeof v !== "object" || Array.isArray(v)) throw new Error("invalid_entry");
  const e = v as Record<string, unknown>;
  const n = number(e.id);
  const kind = text(e.kind);
  if (!n || !kind) throw new Error("invalid_entry");
  const payload = e.payload;
  const line =
    e.line && typeof e.line === "object" && !Array.isArray(e.line)
      ? (e.line as Record<string, unknown>)
      : {};
  const p = (
    payload && typeof payload === "object" && !Array.isArray(payload) ? payload : {}
  ) as Record<string, unknown>;
  return {
    n,
    kind,
    to_standing_id: text(e.to_standing_id),
    to_karta_node_id: text(e.to_karta_node_id),
    in_reply_to: number(e.in_reply_to),
    author_standing_id: text(e.author_standing_id),
    author: text(e.author),
    key: text(line.key),
    verdict: text(line.verdict),
    body_pending: e.body_pending === true,
    aborted: e.aborted === true,
    reason: text(p.reason),
    cause: text(p.cause),
    gone_standing: text(p.gone_standing),
  };
}

/** One history page → its entries and its cursor; a page that is not the form refuses. */
export function parseCasePage(body: unknown): { entries: CaseEntry[]; cursor: number } {
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("history_not_page");
  const page = body as { items?: unknown; cursor?: unknown };
  if (!Array.isArray(page.items)) throw new Error("history_not_list");
  const entries = page.items.map(entryOf);
  if (typeof page.cursor !== "number" || !Number.isSafeInteger(page.cursor) || page.cursor < 0)
    throw new Error("invalid_cursor");
  return { entries, cursor: page.cursor };
}

/** A case status answer → open|closed: closing still lives, abandoned is a close (#10995). */
export function parseCaseStatus(body: unknown): "open" | "closed" {
  const s = (body as { status?: unknown } | null)?.status;
  if (s === "open" || s === "closing") return "open";
  if (s === "closed" || s === "abandoned") return "closed";
  throw new Error("case_status_unknown");
}

/** The case journal from a cursor, page by page until the page comes back empty with the
 * cursor unmoved; the answer's cursor is the last covered entry's number. */
export async function readCaseHistory(
  base: string,
  token: string,
  room: string,
  since?: number,
): Promise<{ entries: CaseEntry[]; cursor: number }> {
  if (since !== undefined && (!Number.isSafeInteger(since) || since < 0))
    throw new Error("invalid_cursor");
  let cursor = since ?? 0;
  const out: CaseEntry[] = [];
  for (;;) {
    const page = parseCasePage(await caseGet(base, token, historyPath(room, cursor)));
    if (!page.entries.length) return { entries: out, cursor };
    if (page.cursor <= cursor) throw new Error("history_stalled");
    out.push(...page.entries);
    cursor = page.cursor;
  }
}

/** The case's own status — open or closed — by its REST door. */
export async function readCaseStatus(
  base: string,
  token: string,
  room: string,
): Promise<"open" | "closed"> {
  return parseCaseStatus(await caseGet(base, token, `/rooms/${encodeURIComponent(room)}`));
}
