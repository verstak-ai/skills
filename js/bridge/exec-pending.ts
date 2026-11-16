// Whether an owned client lifecycle keeps the observer and the daemon alive (#9256, #10777).
import { LIVE, readRuns } from "./orchestra-runs.ts";

export function execPending(authDir: string): boolean {
  try {
    return Object.values(readRuns(authDir)).some(
      (r) =>
        (!!(r.exec || r.tree) && LIVE.includes(r.state)) ||
        ((r.state === "ended" || (r.state === "refused" && !!r.dsh?.exit)) &&
          r.tree?.state === "ready"),
    );
  } catch {
    return true;
  } // preserve a corrupt registry for recovery, never reinterpret it as empty
}
