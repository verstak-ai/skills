// Observing the exact exec client is independent of automatic raising (#9256).
import { createHash } from "node:crypto";

import { namedFetch } from "../shared/http.ts";
import { execExited } from "./exec-client-exit.ts";
import { execBound, importAttempt } from "./exec-launch.ts";
import { bindExecRaised } from "./exec-raised.ts";
import { foreignStops } from "./orchestra-foreign.ts";
import { LIVE, readRuns, type Run, runIdentity, writeRuns } from "./orchestra-runs.ts";

export const exitClientId = (r: Run): string =>
  `orchestra-${createHash("sha256")
    .update(`${runIdentity(r)}|client_exited`)
    .digest("hex")
    .slice(0, 32)}`;
export function execPending(authDir: string): boolean {
  try {
    return Object.values(readRuns(authDir)).some((r) => !!r.exec && LIVE.includes(r.state));
  } catch {
    return true;
  } // preserve a corrupt registry for recovery, never reinterpret it as empty
}

/** Process exit is persisted before networking. Neither 410 nor timeout is suppression proof. */
export async function observeExec(
  authDir: string,
  base: string,
  token: string | null,
): Promise<void> {
  let runs = readRuns(authDir);
  for (const [key, r] of Object.entries(runs)) {
    if (!r.exec || !LIVE.includes(r.state)) continue;
    importAttempt(r, authDir);
    if (r.exec.session && !execBound(r, authDir)) {
      r.state = "ambiguity";
      r.why = "exec_receipt_binding_unverified";
      writeRuns(authDir, runs);
      continue;
    }
    writeRuns(authDir, runs);
    const identity = runIdentity(r);
    if (!r.exec.exit && r.exec.session && (await execExited(r))) {
      const latest = readRuns(authDir)[key];
      if (!latest || runIdentity(latest) !== identity) continue;
      r.exec.exit = new Date().toISOString();
      r.closed = "client_exited";
      writeRuns(authDir, runs);
    }
  }
  if (!base || !token) return;
  runs = readRuns(authDir);
  const realms = [
    ...new Set(
      Object.values(runs)
        .filter((r) => r.exec && LIVE.includes(r.state))
        .map((r) => r.realm),
    ),
  ];
  try {
    await bindExecRaised(authDir, base, token, realms);
    const latest = readRuns(authDir);
    await foreignStops(authDir, base, token, latest);
    writeRuns(authDir, latest);
    await finishExits(authDir, base, token);
  } catch {
    process.stderr.write("exec_observer_graph_unreadable\n");
  }
}

async function finishExits(authDir: string, base: string, token: string): Promise<void> {
  const runs = readRuns(authDir);
  for (const [key, r] of Object.entries(runs)) {
    if (!r.exec?.exit || !r.standing_id || !LIVE.includes(r.state) || !execBound(r, authDir))
      continue;
    if (r.stop_outcome === "stopped") {
      r.state = "ended";
      writeRuns(authDir, runs);
      continue;
    }
    const before = runIdentity(r);
    if (r.order_id) continue; // the ordinary order path owns halt/drop/interrupt and its ack
    try {
      const latest = readRuns(authDir)[key];
      if (!latest || runIdentity(latest) !== before) continue;
      const res = await namedFetch(`${base}/standings/${encodeURIComponent(r.standing_id)}/stop`, {
        method: "POST",
        redirect: "error",
        headers: {
          authorization: `Bearer ${token}`,
          "x-nks-realm": r.realm,
          "content-type": "application/json",
        },
        body: JSON.stringify({ reason_code: "client_exited", client_id: exitClientId(r) }),
        signal: AbortSignal.timeout(10_000),
      });
      const body = (await res.json().catch(() => ({}))) as { id?: unknown };
      if (res.ok && typeof body.id === "string" && body.id) {
        r.order_id = body.id;
        r.state = "stopping";
        r.stopping_at = new Date().toISOString();
      } else r.why = res.status === 410 ? "exec_suppression_unverified" : "exec_stop_unconfirmed";
    } catch {
      r.why = "exec_stop_unknown";
    }
    writeRuns(authDir, runs);
  }
}
