// The daemon closes its own OpenCode launch's terminal when nobody else will (graph
// @nks/nks-dev, #11099, #7519, #9256): the stop order expired or failed, its window passed, the
// launch never sat, or the row ended without an observed client exit. The close is the agent
// bridge's own — orcaCloseObserved with the same proof of ours (terminal, runtime, incarnation,
// tree path, runIdentity); a proof that does not hold leaves the terminal untouched, said.
import { ORCHESTRA } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import { type ApiCall, execApi } from "./exec-prepare.ts";
import { orcaCloseObserved, ownClient } from "./orca-stop.ts";
import { haltExecSession } from "./orchestra-exec-halt.ts";
import { type Held, noHeld } from "./orchestra-reap-held.ts";
import { readRuns, type Run, runIdentity } from "./orchestra-runs.ts";
import { stopLapsed } from "./orchestra-window.ts";

const w = () => words(ORCHESTRA);
const NO_SEAT = new Set(["tree_no_seat_unverified", "exec_no_seat_unverified"]);
type Close = typeof orcaCloseObserved;
/** The proof of ours did not hold: the terminal is never touched again. */
const NOT_OURS = new Set(["terminal_binding_changed", "client_unbound"]);
/** Tacts a transient refusal (Orca unreachable, an exit not seen) is tried before it is said
 * exhausted. */
const REAP_TRIES = 3;
/** The daemon's observed close of a client nothing else waits on — the tree cleanup's proof. */
export const REAPED_OVER = "client_exited_over";

/** Why the daemon must close this run's terminal itself; null — not its turn, or settled. */
export function reapCause(r: Run, now = Date.now()): string | null {
  if (r.harness !== "opencode" || r.dsh || !(r.tree || r.exec) || !r.terminal || !r.runtime)
    return null;
  if (r.reaped || r.closed === "client_exited" || r.exec?.exit || r.tree?.exit) return null;
  if (r.seat_ended) return "seat_ended";
  if (r.state === "stopping") {
    if (r.stop_outcome === "expired" || r.stop_outcome === "failed")
      return `stop_${r.stop_outcome}`;
    return stopLapsed(r, now) ? `stop_${r.stop_outcome ?? "unanswered"}` : null;
  }
  if (r.state === "ended") return "ended";
  return r.state === "ambiguity" && NO_SEAT.has(r.why ?? "") ? "no_seat" : null;
}

/** Close what is due; the closed client's exit is recorded on the row. A client still holding a
 * live seat through the daemon (`held`) is never closed: said, no try counted. */
export async function reapOwn(
  authDir: string,
  runs: Record<string, Run>,
  gone?: { gone: boolean },
  close: Close = orcaCloseObserved,
  api: ApiCall = execApi,
  now = Date.now(),
  held: Held = noHeld,
): Promise<string[]> {
  const said: string[] = [];
  for (const [key, r] of Object.entries(runs)) {
    const cause = reapCause(r, now);
    if (!cause && !exitedNoSeat(r)) continue;
    if (gone?.gone) break;
    const row = (why: string): number => said.push(w().leadRow(r.realm, r.room, r.invite, why));
    if (cause) {
      const kept = await held(r.terminal!);
      if (kept) {
        row(`${cause}, ${kept}`);
        continue;
      }
      const expected = ownClient(r);
      const identity = runIdentity(r);
      const current = (): boolean => {
        const latest = readRuns(authDir)[key];
        return !!latest && runIdentity(latest) === identity && latest.closed !== "client_exited";
      };
      const outcome = expected
        ? await close(r.terminal!, r.runtime!, current, expected)
        : "client_unbound";
      row(`${cause}, ${settle(r, outcome, now)}`);
      // An ended row's end was already confirmed: the close is the exit its tree cleanup asks
      // for (#11099) — never for a row still stopping.
      if (outcome === null && cause === "ended") r.reaped = REAPED_OVER;
    }
    if (!exitedNoSeat(r)) continue;
    // A launch that never sat has no seat to stop; a native exec one may still have its session
    // on the shared server, prompted before any claim — it ends only once that session is halted
    // and archived as the plugin does on a confirmed stop (#9256).
    const halted = r.exec?.session
      ? await haltExecSession(r.exec.server, r.exec.session, api)
      : null;
    if (halted !== null) {
      row(`no_seat, ${retry(r, halted)}`);
      continue;
    }
    r.state = "ended";
    r.reaped = REAPED_OVER;
  }
  return said;
}

/** A launch that never sat whose client is seen gone; its end waits on nothing but its session. */
const exitedNoSeat = (r: Run): boolean =>
  r.harness === "opencode" &&
  !r.dsh &&
  r.state === "ambiguity" &&
  NO_SEAT.has(r.why ?? "") &&
  r.closed === "client_exited" &&
  r.reaped !== "reap_exhausted";

/** A transient refusal counted; past the bound the row is said exhausted and left alone. */
function retry(r: Run, outcome: string): string {
  r.reap_tries = (r.reap_tries ?? 0) + 1;
  if (r.reap_tries < REAP_TRIES) return outcome;
  r.reaped = "reap_exhausted";
  return `reap_exhausted (${outcome})`;
}

/** Final: the observed exit, or a proof of ours that did not hold. Anything else is tried
 * again on later tacts — the count lies in the registry, so a restart keeps it. */
function settle(r: Run, outcome: string | null, now: number): string {
  if (outcome === null) {
    // The observed exit is a fact, not an end: the run ends by the path #9256 asks for — the
    // order confirmed, or one stop for the exit answered (exec-exit.ts finishExits).
    const at = new Date(now).toISOString();
    r.closed = "client_exited";
    if (r.exec) r.exec.exit = at;
    if (r.tree) r.tree.exit = at;
    delete r.reap_tries;
    return (r.reaped = "client_exited");
  }
  if (NOT_OURS.has(outcome)) return (r.reaped = outcome);
  return retry(r, outcome);
}
