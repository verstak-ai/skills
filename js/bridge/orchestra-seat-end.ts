import { ORCHESTRA } from "../delivery/index.ts";
import { namedFetch } from "../shared/http.ts";
import { words } from "../shared/lang.ts";
import type { Run } from "./orchestra-runs.ts";

/** A failed or ambiguous read is never evidence that a seat ended. */
export async function seatEnded(base: string, token: string, r: Run): Promise<boolean> {
  try {
    if (!r.standing_id) return false;
    const res = await namedFetch(
      `${base}/me/standings?standing=${encodeURIComponent(r.standing_id)}`,
      {
        headers: { authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(10_000),
      },
    );
    if (!res.ok) return false;
    const body: unknown = await res.json();
    const rows: unknown = Array.isArray(body) ? body : (body as { items?: unknown } | null)?.items;
    if (!Array.isArray(rows) || rows.length !== 1) return false;
    const row: unknown = rows[0];
    if (!row || typeof row !== "object" || Array.isArray(row)) return false;
    const item = row as { id?: unknown; standing_id?: unknown; ended_at?: unknown };
    const id = item.id ?? item.standing_id;
    return (
      (id === undefined || id === r.standing_id) &&
      typeof item.ended_at === "string" &&
      Number.isFinite(Date.parse(item.ended_at))
    );
  } catch {
    return false;
  }
}

export async function markEndedSeats(
  base: string,
  token: string,
  runs: Record<string, Run>,
  gone?: { gone: boolean },
): Promise<string[]> {
  const said: string[] = [];
  for (const r of Object.values(runs)) {
    if (gone?.gone) break;
    if (
      r.state !== "raised" ||
      r.exec?.exit ||
      r.tree?.exit ||
      r.rooms !== 0 ||
      !r.sat ||
      !r.standing_id ||
      r.idle_due ||
      r.seat_ended
    )
      continue;
    if ((await seatEnded(base, token, r)) && !gone?.gone) {
      r.seat_ended = true;
      const w = words(ORCHESTRA);
      said.push(w.leadRow(r.realm, r.room, r.invite, w.seatEnded()));
    }
  }
  return said;
}
