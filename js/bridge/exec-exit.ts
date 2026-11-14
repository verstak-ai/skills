// Observing the exact exec client is independent of automatic raising (#9256).
import { createHash } from "node:crypto";

import { namedFetch } from "../shared/http.ts";
import { execExited } from "./exec-client-exit.ts";
import { execBound, importAttempt } from "./exec-launch.ts";
import { bindExecRaised } from "./exec-raised.ts";
import { foreignStops } from "./orchestra-foreign.ts";
import { LIVE, readRuns, type Run, runIdentity, writeRuns } from "./orchestra-runs.ts";
import { cleanupEndedTrees } from "./orchestra-tree-clean.ts";

export const exitClientId = (r: Run): string =>
  `orchestra-${createHash("sha256")
    .update(`${runIdentity(r)}|client_exited`)
    .digest("hex")
    .slice(0, 32)}`;
export function execPending(authDir: string): boolean {
  try {
    return Object.values(readRuns(authDir)).some(
      (r) =>
        (!!(r.exec || r.tree) && LIVE.includes(r.state)) ||
        (r.state === "ended" && r.tree?.state === "ready"),
    );
  } catch {
    return true;
  } // preserve a corrupt registry for recovery, never reinterpret it as empty
}

/** Process exit is persisted before networking. For an exec client neither 410 nor timeout is
 * suppression proof; a tree run whose exact terminal exited ends on 410. */
export async function observeExec(
  authDir: string,
  base: string,
  token: string | null,
): Promise<void> {
  let runs = readRuns(authDir);
  for (const [key, r] of Object.entries(runs)) {
    if (!(r.exec || r.tree) || !LIVE.includes(r.state)) continue;
    if (r.exec) importAttempt(r, authDir);
    if (r.exec?.session && !execBound(r, authDir)) {
      r.state = "ambiguity";
      r.why = "exec_receipt_binding_unverified";
      writeRuns(authDir, runs);
      continue;
    }
    writeRuns(authDir, runs);
    const identity = runIdentity(r);
    if (!(r.exec?.exit || r.tree?.exit) && (await execExited(r))) {
      const latest = readRuns(authDir)[key];
      if (!latest || runIdentity(latest) !== identity) continue;
      if (r.exec) r.exec.exit = new Date().toISOString();
      if (r.tree) r.tree.exit = new Date().toISOString();
      r.closed = "client_exited";
      writeRuns(authDir, runs);
    }
  }
  await cleanupEndedTrees(authDir, readRuns(authDir));
  if (!base || !token) return;
  runs = readRuns(authDir);
  const realms = [
    ...new Set(
      Object.values(runs)
        .filter((r) => (r.exec || r.tree) && LIVE.includes(r.state))
        .map((r) => r.realm),
    ),
  ];
  try {
    await bindExecRaised(authDir, base, token, realms);
    const latest = readRuns(authDir);
    await foreignStops(authDir, base, token, latest);
    writeRuns(authDir, latest);
    await finishExits(authDir, base, token);
    await cleanupEndedTrees(authDir, readRuns(authDir));
  } catch {
    process.stderr.write("exec_observer_graph_unreadable\n");
  }
}

interface StopAnswer {
  id?: unknown;
  errors?: { rule?: unknown }[];
}
const ruleOf = (b: StopAnswer): unknown => b.errors?.[0]?.rule;
/** An ordinary tree run of OpenCode: its terminal holds its own process with the embedded server,
 * so the exact terminal's exit leaves nothing to wake (#9256). */
const ownProcess = (r: Run): boolean => !!r.tree && !r.exec && r.harness === "opencode";

async function finishExits(authDir: string, base: string, token: string): Promise<void> {
  const runs = readRuns(authDir);
  for (const [key, r] of Object.entries(runs)) {
    if (
      !(r.exec?.exit || r.tree?.exit) ||
      !r.standing_id ||
      !LIVE.includes(r.state) ||
      (r.exec && !execBound(r, authDir))
    )
      continue;
    if (r.stop_outcome === "stopped") {
      r.state = "ended";
      writeRuns(authDir, runs);
      await cleanupEndedTrees(authDir, runs);
      continue;
    }
    // A failed order after the exact terminal exited (Orca may refuse closing a tab that then
    // exits, #9966) proves no ended seat: stop once more by the exit reason (#9256).
    if (r.stop_outcome === "failed" && ownProcess(r) && r.closed === "client_exited" && !r.restop) {
      r.restop = true;
      delete r.order_id;
      delete r.stop_outcome;
    }
    const before = runIdentity(r);
    if (r.order_id) continue; // the ordinary order path owns halt/drop/interrupt and its ack
    try {
      const latest = readRuns(authDir)[key];
      if (!latest || runIdentity(latest) !== before) continue;
      const seat = r.standing_id;
      const stop = (reason_code: string) =>
        namedFetch(`${base}/standings/${encodeURIComponent(seat)}/stop`, {
          method: "POST",
          redirect: "error",
          headers: {
            authorization: `Bearer ${token}`,
            "x-nks-realm": r.realm,
            "content-type": "application/json",
          },
          body: JSON.stringify({ reason_code, client_id: exitClientId(r) }),
          signal: AbortSignal.timeout(10_000),
        });
      let res = await stop("client_exited");
      let body = (await res.json().catch(() => ({}))) as StopAnswer;
      // An API without the client_exited reason refuses it before it looks at the seat (#9969).
      if (res.status === 422 && ruleOf(body) === "stop_reason_unknown") {
        res = await stop("other");
        body = (await res.json().catch(() => ({}))) as StopAnswer;
      }
      if (res.ok && typeof body.id === "string" && body.id) {
        r.order_id = body.id;
        r.state = "stopping";
        r.stopping_at = new Date().toISOString();
      } else if (res.status === 410 && ownProcess(r)) {
        // The exact terminal exited and the seat is over: nobody is left to wake (#9256).
        r.state = "ended";
        r.why = "seat_gone_after_exit";
      } else
        r.why =
          res.status === 410
            ? "exec_suppression_unverified"
            : `exec_stop_unconfirmed_${res.status}`;
    } catch {
      r.why = "exec_stop_unknown";
    }
    writeRuns(authDir, runs);
    if (r.state === "ended") await cleanupEndedTrees(authDir, runs);
  }
}
