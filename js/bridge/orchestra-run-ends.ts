// Legacy launch expiry/close and ordinary stop settlement (#7522, #9256).
// Exec and tree runs never free a limit or close a client here: their terminal closes only
// under the exact-client proof (orchestra-reap.ts, #11099).
import { ORCHESTRA } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import type { OpenOrder } from "./demand-rows.ts";
import { dshTerminate } from "./orchestra-dsh-proc.ts";
import { orcaClose } from "./orchestra-orca.ts";
import { type Held, noHeld } from "./orchestra-reap-held.ts";
import type { Run } from "./orchestra-runs.ts";
import { RAISE_WINDOW_MS, stopLapsed } from "./orchestra-window.ts";

const w = () => words(ORCHESTRA);
type Close = (handle: string, runtime: string) => Promise<string>;
export async function expireLaunches(
  runs: Record<string, Run>,
  gone?: { gone: boolean },
  close: Close = orcaClose,
  now = Date.now(),
  held: Held = noHeld,
): Promise<string[]> {
  const said: string[] = [];
  for (const r of Object.values(runs))
    if (r.state === "launched" && now - Date.parse(r.at) > RAISE_WINDOW_MS) {
      if (gone?.gone) break;
      if (r.dsh) {
        // No seat stood: our own process ends; its observed exit frees the slot (#10777).
        if (r.dsh.terminated || r.dsh.exit) continue;
        await dshTerminate(r, "no_seat");
        r.why = "dsh_no_seat_terminated";
        said.push(w().leadRow(r.realm, r.room, r.invite, r.why));
        continue;
      }
      if (r.exec || r.tree) {
        r.state = "ambiguity";
        r.why = r.exec ? "exec_no_seat_unverified" : "tree_no_seat_unverified";
        said.push(w().leadRow(r.realm, r.room, r.invite, r.why));
        continue;
      }
      // The client in the terminal stands a seat through this daemon, or that is not known: the
      // row stays as it was.
      const kept = r.terminal ? await held(r.terminal) : null;
      if (kept) {
        said.push(w().leadRow(r.realm, r.room, r.invite, `no_seat, ${kept}`));
        continue;
      }
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
export async function closeEnded(
  runs: Record<string, Run>,
  gone?: { gone: boolean },
  close: Close = orcaClose,
  held: Held = noHeld,
): Promise<string[]> {
  const said: string[] = [];
  for (const r of Object.values(runs))
    if (r.state === "ended" && r.terminal && r.runtime && !r.closed) {
      if (gone?.gone) break;
      if (r.exec || r.tree) {
        r.why = r.exec ? "exec_client_unverified" : "tree_client_unverified";
        continue;
      }
      const kept = await held(r.terminal);
      if (kept) {
        said.push(w().leadRow(r.realm, r.room, r.invite, `ended, ${kept}`));
        continue;
      }
      r.closed = await close(r.terminal, r.runtime);
      said.push(w().leadRow(r.realm, r.room, r.invite, `ended, ${r.closed}`));
    }
  return said;
}
/** Only stopped closes an ordinary stop. Legacy unanswered windows retain their old policy. */
export function settleStops(
  runs: Record<string, Run>,
  open: OpenOrder[],
  fresh: ReadonlySet<Run> = new Set(),
  now = Date.now(),
): string[] {
  const said: string[] = [];
  const orders = new Set(open.map((s) => s.order_id)),
    seats = new Set(open.map((s) => s.standing_id));
  for (const r of Object.values(runs)) {
    if (r.state !== "stopping" || fresh.has(r)) continue;
    const unanswered = r.order_id ? orders.has(r.order_id) : seats.has(r.standing_id ?? "");
    if (
      !unanswered &&
      r.stop_outcome === "stopped" &&
      (!(r.exec || r.tree) || r.closed === "client_exited")
    ) {
      r.state = "ended";
      continue;
    }
    if (r.exec || r.tree || !stopLapsed(r, now)) continue;
    r.state = "ended";
    r.closed = "terminal_left_open";
    const outcome = unanswered ? "unanswered" : (r.stop_outcome ?? "unknown");
    said.push(w().leadRow(r.realm, r.room, r.invite, `stop_${outcome}, ${r.closed}`));
  }
  return said;
}
