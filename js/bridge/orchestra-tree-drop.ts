// A tree nothing was launched in goes with its row (#10598): Orca never showed it, no agent was
// started, so the call is raised again by a later tact instead of holding a limit slot forever.
import { existsSync } from "node:fs";

import { type Run, writeRuns } from "./orchestra-runs.ts";
import { type Git, git, inspectTree, treeContent } from "./orchestra-tree-check.ts";

/** null — tree and row gone, the call is free; else the row stays in ambiguity with this why. */
export async function dropUnlaunched(
  authDir: string,
  runs: Record<string, Run>,
  key: string,
  execute: Git = git,
): Promise<string | null> {
  const r = runs[key],
    t = r.tree;
  if (!t || t.state !== "ready" || !t.identity || r.terminal || r.exec)
    return "tree_drop_unverified";
  try {
    if (JSON.stringify(await inspectTree(t, execute)) !== JSON.stringify(t.identity))
      return "tree_identity_unverified";
    const changed = await treeContent(t, execute);
    if (changed) return changed;
    t.state = "removing";
    writeRuns(authDir, runs);
    await execute(t.source, ["worktree", "unlock", "--", t.path], 10_000);
    const removed = await execute(t.source, ["worktree", "remove", "--", t.path], 30_000);
    if (removed.code !== 0 || existsSync(t.path) || existsSync(t.identity.gitDir)) {
      t.state = "retained";
      return "tree_remove_unverified";
    }
  } catch {
    return "tree_drop_unverified";
  }
  delete runs[key];
  writeRuns(authDir, runs);
  return null;
}
