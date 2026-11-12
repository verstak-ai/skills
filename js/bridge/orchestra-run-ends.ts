// Legacy launch expiry/close and ordinary stop settlement (#7522, #9256).
// Exec attempts never free a limit or close a client on timeout/absence alone.
import { ORCHESTRA } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import type { OpenOrder } from "./demand-rows.ts";
import { orcaClose } from "./orchestra-orca.ts";
import type { Run } from "./orchestra-runs.ts";
import { RAISE_WINDOW_MS, stopLapsed } from "./orchestra-window.ts";

const w = () => words(ORCHESTRA);
type Close = (handle: string, runtime: string) => Promise<string>;
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
      if (r.exec) {
        r.state = "ambiguity";
        r.why = "exec_no_seat_unverified";
        said.push(w().leadRow(r.realm, r.room, r.invite, r.why));
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
): Promise<string[]> {
  const said: string[] = [];
  for (const r of Object.values(runs))
    if (r.state === "ended" && r.terminal && r.runtime && !r.closed) {
      if (gone?.gone) break;
      if (r.exec) {
        r.why = "exec_client_unverified";
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
    if (!unanswered && r.stop_outcome === "stopped" && (!r.exec || r.closed === "client_exited")) {
      r.state = "ended";
      continue;
    }
    if (r.exec || !stopLapsed(r, now)) continue;
    r.state = "ended";
    r.closed = "terminal_left_open";
    const outcome = unanswered ? "unanswered" : (r.stop_outcome ?? "unknown");
    said.push(w().leadRow(r.realm, r.room, r.invite, `stop_${outcome}, ${r.closed}`));
  }
  return said;
}
