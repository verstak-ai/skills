// The second LOCAL phase of a full stop (#9256): only a fresh interrupt-confirmed plugin
// receipt can reach a launch this bridge proves own. Historical terminal acks never enter here.
import { isHaltPhase } from "../shared/halt-phase.ts";
import { CFG } from "./config.ts";
import { H } from "./holdstate.ts";
import { orcaCloseObserved } from "./orca-stop.ts";
import { LIVE, readRuns, recordRunClosed, runIdentity } from "./orchestra-runs.ts";
import { sameRealm } from "./realms.ts";
import { state } from "./transport.ts";

/** Capture before stopAgent forgets the main seat, then recheck before every irreversible act. */
export function boundStop(standing: string): (code: string | null) => Promise<string | null> {
  const realm = state.standing?.realm;
  const runs = Object.entries(readRuns(CFG.authDir)).filter(
    ([, r]) =>
      sameRealm(r.realm, realm) &&
      r.standing_id === standing &&
      r.harness === "opencode" &&
      !!r.terminal &&
      !!r.runtime &&
      LIVE.includes(r.state),
  );
  const found = runs.length === 1 ? runs[0] : undefined;
  const expected = found ? runIdentity(found[1]) : null;
  const generation = H.stopped.n + 1;
  return async (code) => {
    // These codes are issued only AFTER interrupt and dropping wakes. Archive has its own ceiling. It is not
    // permission to close on another failure, nor an interpretation of an old halt_confirmed.
    if (!isHaltPhase(code) || !found) return code;
    const [key, r] = found;
    if (!r.terminal || !r.runtime) return "client_unbound";
    const current = (): boolean => {
      const latest = readRuns(CFG.authDir)[key];
      return (
        H.stopped.n === generation &&
        state.standing === null &&
        !!latest &&
        LIVE.includes(latest.state) &&
        runIdentity(latest) === expected
      );
    };
    if (!current()) return "stop_superseded";
    const latest = readRuns(CFG.authDir)[key];
    if ((latest?.exec?.exit || latest?.tree?.exit) && latest.closed === "client_exited")
      return null;
    if (r.exec && !r.exec.incarnation) return "client_unbound";
    const incarnation = r.exec?.incarnation ?? r.tree?.incarnation;
    if (r.tree && !incarnation) return "client_unbound";
    const expectedClient = incarnation ? { incarnation, worktree: r.worktree } : undefined;
    const outcome = await orcaCloseObserved(r.terminal, r.runtime, current, expectedClient);
    if (outcome !== null) return outcome;
    if (!recordRunClosed(CFG.authDir, key, r)) return "stop_superseded";
    return current() ? null : "stop_superseded";
  };
}
