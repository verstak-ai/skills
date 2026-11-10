// The extinguishing half of the tact (graph @nks/nks-dev, nodes #5042, #8203, #7518, #6010):
// the raised tape tells which of OUR launches sat down (its spawned_for) and its composition at
// the greatest n; an empty composition after the seat sat in a case is the moment — the tape is
// read again from the fresh cursor first (a fresh membership cancels the end), then the seat
// gets a stop order with composition_empty and an idempotent client_id. The orchestrator never
// revokes a seat silently and never touches a seat it did not launch.
import { createHash } from "node:crypto";

import { envName, ORCHESTRA, type OrchestraWords } from "../delivery/index.ts";
import { namedFetch } from "../shared/http.ts";
import { words } from "../shared/lang.ts";
import type { OpenOrder } from "./demand-rows.ts";
import { orcaClose } from "./orchestra-orca.ts";
import { type Run, runKey } from "./orchestra-runs.ts";

const w = (): OrchestraWords => words(ORCHESTRA);
const TIMEOUT_MS = 10_000;
/** No seat this long after the launch — the claim went elsewhere or never came (#7523). */
const RAISE_WINDOW_MS = Number(process.env[envName("ORCHESTRA_RAISE_WINDOW_MS")]) || 15 * 60_000;
/** A stopping run's window from its stop has passed — whatever its order says (#7522). */
export const stopLapsed = (r: Run, now = Date.now()): boolean =>
  now - Date.parse(r.stopping_at ?? r.at) > RAISE_WINDOW_MS;

type Signal = Record<string, unknown>;
type Close = (handle: string, runtime: string) => Promise<string>;

const idOf = (v: unknown): string | null => {
  if (typeof v === "string" && v) return v;
  const id = (v as { id?: unknown } | null)?.id;
  return typeof id === "string" && id ? id : null;
};

/** The run a signal speaks of: its spawned_for names our invite in our case. */
function runOf(realm: string, s: Signal, runs: Record<string, Run>): Run | null {
  const sf = (s.spawned_for ?? {}) as { invite?: unknown; room?: unknown };
  const invite = Number(sf.invite);
  const room = idOf(sf.room) ?? idOf(s.room);
  if (!Number.isSafeInteger(invite) || !room) return null;
  return (
    runs[runKey(realm, room.toLowerCase(), invite)] ?? runs[runKey(realm, room, invite)] ?? null
  );
}

/** Fold one realm's tape into the registry: seats found, compositions at their greatest n. */
export function foldTape(realm: string, tape: Signal[], runs: Record<string, Run>): void {
  for (const s of tape) {
    const run = runOf(realm, s, runs);
    if (!run || run.state === "ended") continue;
    const seat = idOf(s.standing) ?? idOf(s.standing_id);
    if (seat) run.standing_id = seat;
    // A seat with our spawned_for is ours, whatever the launch's own outcome said.
    if (run.state === "launched" || run.state === "no_seat" || run.state === "refused")
      run.state = "raised";
    const n = Number(s.n);
    if (!Number.isFinite(n) || (run.n !== undefined && n < run.n)) continue;
    run.n = n;
    run.rooms = Array.isArray(s.rooms) ? s.rooms.length : 0;
    if (run.rooms > 0) run.sat = true;
  }
}

/**
 * Launched without a seat past the window: no_seat, and the terminal our launch opened is closed
 * by its handle (№4050 [56]) — a harness that cannot stand has no seat to take a stop order. Why
 * it did not stand is the harness's own log, not the daemon's to read: said as cause_unseen.
 */
export async function expireLaunches(
  runs: Record<string, Run>,
  gone?: { gone: boolean },
  close: Close = orcaClose,
  now = Date.now(),
): Promise<string[]> {
  const said: string[] = [];
  for (const r of Object.values(runs))
    if (r.state === "launched" && now - Date.parse(r.at) > RAISE_WINDOW_MS) {
      if (gone?.gone) break;
      r.state = "no_seat";
      const closed = !r.terminal
        ? "no_terminal_handle"
        : r.runtime
          ? await close(r.terminal, r.runtime)
          : "terminal_runtime_unknown";
      if (r.terminal) r.closed = closed;
      said.push(w().leadRow(r.realm, r.room, r.invite, `no_seat (cause_unseen), ${closed}`));
    }
  return said;
}

/**
 * An ended run's terminal is closed by its handle once (№4050 [74]): the harness exited on
 * its stop, and the tab it leaves is ours to close, as on no_seat. Only a handle whose Orca
 * runtime the registry kept at the launch: a run ended before that is never touched.
 */
export async function closeEnded(
  runs: Record<string, Run>,
  gone?: { gone: boolean },
  close: Close = orcaClose,
): Promise<string[]> {
  const said: string[] = [];
  for (const r of Object.values(runs))
    if (r.state === "ended" && r.terminal && r.runtime && !r.closed) {
      if (gone?.gone) break;
      r.closed = await close(r.terminal, r.runtime);
      said.push(w().leadRow(r.realm, r.room, r.invite, `ended, ${r.closed}`));
    }
  return said;
}

/**
 * A stopping run whose order closed `stopped` has ended; a stop answered without an id is
 * tracked by its seat. `open` is every open order of the account in any graph (a complete
 * snapshot) — so a run of a graph that left the boundary ends too, and frees its limit slot.
 * `fresh` — runs marked stopping after that snapshot was read: it cannot speak of their order.
 * A closed order of another outcome (failed, refused, unknown — or one never read) did not
 * carry the stop out: the agent may still live, so the run stays stopping until its window
 * passes, then frees its slot with its tab left open and said so — the branch of the agent that
 * did not answer the stop (graph @nks/nks-dev, #7522); the tab is never closed on it. An order
 * still open past the window (never taken) ends the run the same way, as stop_unanswered.
 */
export function settleStops(
  runs: Record<string, Run>,
  open: OpenOrder[],
  fresh: ReadonlySet<Run> = new Set(),
  now = Date.now(),
): string[] {
  const said: string[] = [];
  const orders = new Set(open.map((s) => s.order_id));
  const seats = new Set(open.map((s) => s.standing_id));
  for (const r of Object.values(runs)) {
    if (r.state !== "stopping" || fresh.has(r)) continue;
    const unanswered = r.order_id ? orders.has(r.order_id) : seats.has(r.standing_id ?? "");
    if (!unanswered && r.stop_outcome === "stopped") {
      r.state = "ended";
      continue;
    }
    if (!stopLapsed(r, now)) continue;
    r.state = "ended";
    r.closed = "terminal_left_open";
    const outcome = unanswered ? "unanswered" : (r.stop_outcome ?? "unknown");
    said.push(w().leadRow(r.realm, r.room, r.invite, `stop_${outcome}, ${r.closed}`));
  }
  return said;
}

async function order(base: string, token: string, r: Run, key: string) {
  const res = await namedFetch(`${base}/standings/${encodeURIComponent(r.standing_id!)}/stop`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "x-nks-realm": r.realm,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      reason_code: "composition_empty",
      client_id: `orchestra-${createHash("sha256").update(key).digest("hex").slice(0, 32)}`,
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const body = (await res.json().catch(() => ({}))) as { id?: unknown };
  return { status: res.status, id: typeof body.id === "string" ? body.id : "" };
}

/**
 * Extinguish our raised seats whose composition is empty — after they sat in a case, or never
 * having joined one within the window from the launch (a failed launch, #9970). `reread(realm)`
 * reads the tape again from the fresh cursor — the re-check before the end (#8203); a failed
 * re-read orders nothing. A caller gone (#8202) stops it before the next order.
 */
export async function quench(
  base: string,
  token: string,
  runs: Record<string, Run>,
  reread: (realm: string) => Promise<Signal[]>,
  gone?: { gone: boolean },
  now = Date.now(),
): Promise<string[]> {
  const said: string[] = [];
  const due = Object.entries(runs).filter(
    ([, r]) =>
      r.state === "raised" &&
      r.rooms === 0 &&
      r.standing_id &&
      (r.sat || now - Date.parse(r.at) > RAISE_WINDOW_MS),
  );
  for (const [key, r] of due) {
    if (gone?.gone) break;
    try {
      foldTape(r.realm, await reread(r.realm), runs);
      // The re-read may outlast the caller: no order after it left.
      if (gone?.gone) break;
      if (r.rooms !== 0) {
        said.push(w().leadRow(r.realm, r.room, r.invite, "composition_changed"));
        continue;
      }
      const got = await order(base, token, r, key);
      // Never sat within the window: the launch failed (#9970) — said so before the stop's outcome.
      const why = r.sat ? "" : "no_join, ";
      if (got.status >= 200 && got.status < 300) {
        r.state = "stopping";
        r.stopping_at = new Date(now).toISOString();
        if (got.id) r.order_id = got.id;
        said.push(w().leadRow(r.realm, r.room, r.invite, `${why}stop_ordered`));
      } else if (got.status === 410) {
        r.state = "ended";
        said.push(w().leadRow(r.realm, r.room, r.invite, `${why}seat_gone`));
      } else said.push(w().leadRow(r.realm, r.room, r.invite, `${why}stop_refused_${got.status}`));
    } catch (e) {
      said.push(w().leadRow(r.realm, r.room, r.invite, `stop_unsent (${(e as Error).message})`));
    }
  }
  return said;
}
