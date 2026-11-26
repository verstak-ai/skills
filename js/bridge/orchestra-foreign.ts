// A stop on demand of a seat we raised (graph @nks/nks-dev, nodes #7509, #7518, #5042; case
// №4050 [90]): a person or another agent orders our seat to stop — not the orchestrator. The
// seat's own bridge carries the order out; the tact learns it from the account's orders
// (GET /me/orders, every state, from the daemon's cursor): an order on a live run's seat that
// is not the run's own makes it stopping (settleStops ends it when the order closes `stopped`), a
// carried-out one ends it at once — then closeEnded closes its terminal and its limit slot is
// free; any other closed outcome keeps it stopping (#7522). The order of a stopping run is read
// again until it closes or the run's window passes, so its outcome is known. The
// raised tape says no revoke, and an open-only read misses an order carried out between tacts.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { ORCHESTRA, type OrchestraWords } from "../delivery/index.ts";
import { namedFetch } from "../shared/http.ts";
import { words } from "../shared/lang.ts";
import { seamRunDir } from "../shared/seam-entrance.ts";
import { stopLapsed } from "./orchestra-quench.ts";
import type { Run } from "./orchestra-runs.ts";

const w = (): OrchestraWords => words(ORCHESTRA);
const LIMIT = 200;
const MAX_PAGES = 50;
const OPEN = new Set(["issued", "accepted"]);
/** The api's clock may run behind the daemon's: an order issued this much before our stop is ours. */
const SKEW_MS = 60_000;

/** A seat's order may be the one our id-less stop put only if issued since that stop. */
const sinceStop = (r: Run, v: Record<string, unknown>): boolean =>
  Date.parse(String(v.issued_at ?? "")) >= Date.parse(r.stopping_at ?? r.at) - SKEW_MS;

const cursorFile = (authDir: string): string => join(seamRunDir(authDir), "orchestra-orders.json");

function readSince(authDir: string): number {
  try {
    const n = (JSON.parse(readFileSync(cursorFile(authDir), "utf8")) as { since?: unknown }).since;
    return typeof n === "number" && Number.isSafeInteger(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

function writeSince(authDir: string, since: number): void {
  mkdirSync(seamRunDir(authDir), { recursive: true, mode: 0o700 });
  writeFileSync(cursorFile(authDir), JSON.stringify({ since }) + "\n", { mode: 0o600 });
}

/**
 * Mark our live runs whose seat got someone else's stop order; a failed read changes nothing.
 * While a live run has no seat yet, the cursor stops before the first page with an order on an
 * unknown seat: that order is read again until the seat is matched or the run ends otherwise.
 * `fresh` — the runs marked stopping here.
 */
export async function foreignStops(
  authDir: string,
  base: string,
  token: string,
  runs: Record<string, Run>,
): Promise<{ said: string[]; fresh: Set<Run> }> {
  const said: string[] = [];
  const fresh = new Set<Run>();
  const bySeat = new Map<string, Run>();
  const seatRuns = new Map<string, Run>();
  // A sleeping run's seat (#10995): an order naming it ends the sleep — the stop is not ours.
  const asleep = new Map<string, Run>();
  // Stopping runs wait for their order's closed state: the cursor holds before an open one.
  const stopping = new Map<string, Run>();
  let unseated = false;
  for (const r of Object.values(runs)) {
    // 8.13.1 stored both own and foreign order ids with no durable origin marker.
    // An unmarked old id is ambiguous, so it must never authorize a continuation.
    if (!r.orders && r.order_id && !r.foreign_stop) {
      r.foreign_stop = {
        id: r.order_id,
        state: r.stop_outcome ?? "issued",
        at: r.stopping_at ?? r.at,
      };
      if (r.dsh && r.state === "stopping" && r.tree?.exit) {
        r.state = "ended";
        r.why = OPEN.has(r.foreign_stop.state)
          ? "stop_ordered_elsewhere"
          : `stop_${r.foreign_stop.state}_elsewhere`;
      }
    }
    if (r.state !== "ended" && r.standing_id) seatRuns.set(r.standing_id, r);
    if (r.state === "launched" || r.state === "raised") {
      if (r.standing_id) bySeat.set(r.standing_id, r);
      else unseated = true;
    } else if (r.state === "dormant" && r.standing_id) asleep.set(r.standing_id, r);
    else if (r.state === "stopping" && !r.stop_outcome && (r.exec || r.tree || !stopLapsed(r)))
      stopping.set(r.order_id ? `o:${r.order_id}` : `s:${r.standing_id ?? ""}`, r);
  }
  const seen = new Set(Object.values(runs).map((r) => r.standing_id));
  let since = readSince(authDir);
  let held: number | undefined;
  try {
    for (let n = 0; n < MAX_PAGES; n++) {
      const res = await namedFetch(`${base}/me/orders?limit=${LIMIT}&since=${since}`, {
        headers: { authorization: `Bearer ${token}` },
        redirect: "error",
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) throw new Error(`http_${res.status}`);
      const body = (await res.json()) as { items?: unknown; next_since?: unknown };
      if (!Array.isArray(body.items)) throw new Error("invalid_items");
      if (!body.items.length) break;
      for (const v of body.items as Record<string, unknown>[]) {
        const seat = String(v.standing_id ?? "");
        const run = bySeat.get(seat);
        const id = typeof v.id === "string" ? v.id : "";
        const state = String(v.state);
        const open = OPEN.has(state);
        const seatRun = seatRuns.get(seat);
        if (id && seatRun && !seatRun.orders?.includes(id)) {
          seatRun.foreign_stop ??= { id, state, at: new Date().toISOString() };
          if (seatRun.dsh && seatRun.state === "stopping" && seatRun.tree?.exit) {
            seatRun.state = "ended";
            seatRun.why = OPEN.has(seatRun.foreign_stop.state)
              ? "stop_ordered_elsewhere"
              : `stop_${seatRun.foreign_stop.state}_elsewhere`;
          }
        }
        // An order on a sleeping run's seat is foreign unless its id is the row's own
        // (#10995): the sticky field is set at this first reading and never erased — the
        // dormant tact ends the sleep by the field alone, not here.
        const sleep = !run && asleep.get(seat);
        if (sleep) {
          if (id && !sleep.orders?.includes(id))
            sleep.foreign_stop ??= { id, state, at: new Date().toISOString() };
          continue;
        }
        if (!run && unseated && seat && !seen.has(seat)) held ??= since;
        const bySeatOnly = stopping.get(`s:${seat}`);
        const own =
          stopping.get(`o:${id}`) ??
          (bySeatOnly && sinceStop(bySeatOnly, v) ? bySeatOnly : undefined);
        if (!run && own) {
          if (open) held ??= since;
          else {
            own.order_id ??= id;
            own.stop_outcome = state;
          }
          continue;
        }
        if (!run || !id || run.orders?.includes(id)) continue;
        bySeat.delete(seat);
        run.order_id = id;
        // A foreign order on the call's seat is a final end in any reading order of its
        // states: the sticky field is set at the first reading — issued or already closed —
        // and holds to the end, so no later path sleeps the row (#10995 review 5).
        run.foreign_stop ??= { id, state, at: new Date().toISOString() };
        if (open) run.why = "stop_ordered_elsewhere";
        // Only a carried-out stop ends the run; a closed order of another outcome keeps it
        // stopping until its window passes (settleStops, #7522). A carried-out one is a
        // wind-down: its end never sleeps (#10995).
        const done =
          state === "stopped" && (!(run.exec || run.tree) || run.closed === "client_exited");
        run.state = done ? "ended" : "stopping";
        if (done) run.why = "stopped_elsewhere";
        if (!done) run.stopping_at = new Date().toISOString();
        if (!open) run.stop_outcome = state;
        if (open) {
          fresh.add(run);
          held ??= since;
        }
        said.push(
          w().leadRow(
            run.realm,
            run.room,
            run.invite,
            open
              ? "stop_ordered_elsewhere"
              : done
                ? "stopped_elsewhere"
                : `stop_${state}_elsewhere`,
          ),
        );
      }
      const next = body.next_since;
      if (typeof next !== "number" || !Number.isSafeInteger(next) || next <= since)
        throw new Error("pagination_stalled");
      since = next;
    }
  } catch (e) {
    said.push(w().leadOrdersUnread((e as Error).message));
  }
  writeSince(authDir, held ?? since);
  return { said, fresh };
}
