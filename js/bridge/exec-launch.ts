// One runtime-local prepare → API brief → exec TUI path (#9967–#9969).
import { mkdirSync, realpathSync } from "node:fs";
import { resolve } from "node:path";

import { seamRunDir } from "../shared/seam-entrance.ts";
import { execHost, execRuntime, parseOrca } from "./exec-preflight.ts";
import { newAttempt, receiptFor } from "./exec-receipt.ts";
import type { ExecSpec } from "./exec-spec.ts";
import { orcaCheckouts, run } from "./orchestra-orca.ts";
import { type Run, writeRuns } from "./orchestra-runs.ts";
import { readyTree } from "./orchestra-tree-check.ts";
export { execRuntime } from "./exec-preflight.ts";

export function execBound(r: Run, authDir: string): boolean {
  try {
    const receipt = receiptFor(r, authDir);
    return receipt.phase === "ready" && !!r.exec?.session && receipt.session === r.exec.session;
  } catch {
    return false;
  }
}

/** Receipt is not enough: only our same Run and exact returned terminal can be imported. */
export function importAttempt(r: Run, authDir: string): void {
  if (!r.exec || !["preparing", "ambiguity"].includes(r.state)) return;
  try {
    const v = receiptFor(r, authDir);
    if (v.phase === "ambiguity") {
      r.state = "ambiguity";
      r.why = "exec_prepare_unknown";
      return;
    }
    if (v.phase === "ready" && r.terminal && r.runtime && r.exec.incarnation && v.session) {
      if (r.state === "ambiguity") return; // unknown terminal-create is never certified by a file
      r.exec.session = v.session;
      r.state = r.standing_id ? "raised" : "launched";
    }
  } catch {
    r.state = "ambiguity";
    r.why = "exec_receipt_untrusted_or_unreadable";
  }
}

export async function launchExec(
  authDir: string,
  runs: Record<string, Run>,
  key: string,
  host: string | null,
  spec: ExecSpec,
  prompt: string,
  bridge = resolve(process.argv[1]),
  gone?: { gone: boolean },
): Promise<string> {
  const r = runs[key];
  if (!execHost(host)) return "exec_host_unverified";
  const runtime = await execRuntime();
  if (!runtime) return "exec_runtime_unverified";
  const checkouts = await orcaCheckouts();
  const local = typeof checkouts === "string" ? null : checkouts(r.repository);
  if (!local || "code" in local) return "exec_checkout_unverified";
  const source = realpathSync(local.path);
  if (!r.tree && source !== realpathSync(r.worktree)) return "exec_checkout_unverified";
  if (
    realpathSync(r.worktree) !== r.worktree ||
    !/^[A-Za-z0-9_./-]+$/.test(bridge) ||
    !/^[A-Za-z0-9_./-]+$/.test(process.execPath)
  )
    return "exec_path_unsupported";
  const model = spec.modelRefs[r.model];
  if (!model) return "exec_model_unmapped";
  if ((await execRuntime()) !== runtime) return "exec_runtime_changed";
  if (gone?.gone) return "exec_caller_left";
  if (r.tree && !(await readyTree(authDir, key, r, source))) return "exec_checkout_unverified";
  if (gone?.gone) return "exec_caller_left";
  mkdirSync(seamRunDir(authDir), { recursive: true, mode: 0o700 });
  newAttempt(authDir, r, spec.server, model, prompt);
  r.state = "preparing";
  writeRuns(authDir, runs); // durable occupied key before terminal-create
  const receipt = r.exec!.receipt;
  if (!/^[A-Za-z0-9_./-]+$/.test(receipt)) {
    r.state = "refused";
    return "exec_path_unsupported";
  }
  const inner = `cmd=$(env BUN_BE_BUN=1 ${process.execPath} ${bridge} exec-prepare --receipt ${receipt}) && exec /bin/sh -c "$cmd"`;
  const args = [
    "terminal",
    "create",
    "--worktree",
    `path:${r.worktree}`,
    "--command",
    `exec /bin/sh -c '${inner}'`,
    "--json",
  ];
  const made = await run(args, 120_000);
  const reply = parseOrca(made.out);
  const terminal = reply.result?.terminal as
    | { handle?: string; incarnationId?: string; executionHostId?: string; hostPlatform?: string }
    | undefined;
  if (
    made.code !== 0 ||
    reply.ok !== true ||
    reply._meta?.runtimeId !== runtime ||
    typeof terminal?.handle !== "string" ||
    !terminal.handle ||
    typeof terminal.incarnationId !== "string" ||
    !terminal.incarnationId ||
    terminal.executionHostId !== "local" ||
    terminal.hostPlatform !== process.platform
  ) {
    r.state = "ambiguity";
    r.why = "exec_terminal_create_unknown";
  } else {
    r.terminal = terminal.handle;
    r.runtime = runtime;
    r.exec!.incarnation = terminal.incarnationId;
    importAttempt(r, authDir);
  }
  writeRuns(authDir, runs);
  return `exec_${r.state}`;
}
