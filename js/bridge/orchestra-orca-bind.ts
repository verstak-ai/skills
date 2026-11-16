// The launched terminal bound to its own tree (#7517, #9966): one show by the launch's handle
// and runtime; local, the tree's path and an incarnation — else the binding is unverified.
import { run as orcaRun } from "./orchestra-orca.ts";
import type { Run } from "./orchestra-runs.ts";

export async function bindTerminal(run: Run, handle?: string, runtime?: string): Promise<void> {
  if (!handle || !runtime) {
    run.why ??= "tree_client_binding_unverified";
    return;
  }
  const shown = await orcaRun(["terminal", "show", "--terminal", handle, "--json"], 5_000);
  try {
    const reply = JSON.parse(shown.out) as {
      ok?: boolean;
      _meta?: { runtimeId?: string };
      result?: {
        terminal?: {
          handle?: string;
          incarnationId?: string;
          worktreePath?: string;
          executionHostId?: string;
        };
      };
    };
    const t = reply.result?.terminal;
    if (
      shown.code === 0 &&
      reply.ok &&
      reply._meta?.runtimeId === runtime &&
      t?.handle === handle &&
      t.executionHostId === "local" &&
      t.worktreePath === run.worktree &&
      t.incarnationId
    ) {
      if (run.tree) run.tree.incarnation = t.incarnationId;
    } else run.why = "tree_client_binding_unverified";
  } catch {
    run.why = "tree_client_binding_unverified";
  }
}
