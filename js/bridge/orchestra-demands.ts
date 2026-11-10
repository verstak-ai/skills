// Read-only local demands (graph @nks/nks-dev, nodes #9957, #9958, #8202).
import { namedFetch } from "../shared/http.ts";
import { object, type OpenOrder, openOrder, startRow, stopRow } from "./demand-rows.ts";
import { canonIn, realmIndexOf } from "./realmindex.ts";

export interface Demands {
  schema_version: 1;
  observed_at: string;
  scope: { realms: string[]; orders: "own_account" };
  start: Record<string, unknown>[];
  stop: Record<string, unknown>[];
  complete: boolean;
  errors: { source: string; realm?: string; code: string }[];
}

const LIMIT = 200;
const MAX_PAGES = 50;
async function get(base: string, token: string, path: string): Promise<Record<string, unknown>> {
  const r = await namedFetch(`${base}${path}`, {
    headers: { authorization: `Bearer ${token}` },
    redirect: "error",
    signal: AbortSignal.timeout(10_000),
  });
  if (!r.ok) throw new Error(`http_${r.status}`);
  return object(await r.json());
}
function items(body: Record<string, unknown>): unknown[] {
  if (!Array.isArray(body.items)) throw new Error("invalid_items");
  return body.items;
}
/** Do not expose response bodies, arbitrary exception text, or server-owned fields. */
function code(e: unknown): string {
  const s = e instanceof Error ? e.message : "";
  return /^(http_\d{3}|invalid_\w+|missing_identifier|pagination_\w+)$/.test(s) ? s : "read_failed";
}

export async function readDemands(
  base: string,
  token: string | null,
  requested: string[],
  boundary: string[],
  gone?: { gone: boolean },
  /** Every open order of the account, any graph — the projection keeps the boundary's only. */
  owned?: OpenOrder[],
): Promise<Demands> {
  const realms = [...new Set(requested.map((s) => s.trim()))];
  const result: Demands = {
    schema_version: 1,
    observed_at: new Date().toISOString(),
    scope: { realms, orders: "own_account" },
    start: [],
    stop: [],
    complete: true,
    errors: [],
  };
  const error = (source: string, why: string, realm?: string): void => {
    result.complete = false;
    result.errors.push({ source, ...(realm ? { realm } : {}), code: why });
  };
  // Orders name canonical refs; aliases would silently drop their matching stop rows.
  if (realms.some((r) => !/^@[^/\s]+\/[^/\s]+$/.test(r))) {
    error("scope", "invalid_realm");
    return result;
  }
  let canonicalBoundary = boundary;
  if (realms.some((r) => !boundary.includes(r)) && boundary.some((r) => /^r\d+$/i.test(r.trim()))) {
    if (!base || !token) {
      error("connection", "unavailable");
      return result;
    }
    try {
      const index = realmIndexOf(items(await get(base, token, `/realms?limit=${LIMIT}`)));
      canonicalBoundary = boundary.map((r) => {
        if (!/^r\d+$/i.test(r.trim())) return r;
        const canonical = canonIn(index, r);
        if (!canonical) throw new Error("invalid_boundary");
        return canonical;
      });
    } catch (e) {
      error("scope", code(e));
      return result;
    }
  }
  if (!realms.length || realms.some((r) => !r || !canonicalBoundary.includes(r))) {
    error("scope", "outside_boundary");
    return result;
  }
  if (!base || !token) {
    error("connection", "unavailable");
    return result;
  }
  for (const realm of realms) {
    if (gone?.gone) {
      error("caller", "gone");
      return result;
    }
    try {
      const body = await get(base, token, `/realms/${encodeURIComponent(realm)}/invites`);
      // This door returns the complete list, not a cursor tape (#4951).
      const rows = items(body).map((v) => startRow(v, realm));
      result.start.push(...rows);
    } catch (e) {
      error("invites", code(e), realm);
    }
  }
  let since = 0;
  try {
    for (let n = 0; n < MAX_PAGES; n++) {
      if (gone?.gone) throw new Error("caller_gone");
      const q = `open=true&limit=${LIMIT}${since ? `&since=${since}` : ""}`;
      const body = await get(base, token, `/me/orders?${q}`);
      const rows = items(body);
      if (!rows.length) return result;
      const projected = rows.map((v) => stopRow(v, realms)).filter((v) => v !== null);
      owned?.push(...rows.map(openOrder));
      result.stop.push(...projected);
      const next = body.next_since;
      if (typeof next !== "number" || !Number.isSafeInteger(next) || next <= since)
        throw new Error("pagination_stalled");
      since = next;
    }
    throw new Error("pagination_limit");
  } catch (e) {
    error("orders", code(e));
  }
  return result;
}
