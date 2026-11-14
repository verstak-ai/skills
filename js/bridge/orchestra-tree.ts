// Detached Git trees, never Orca create or a branch change in the source (#7517).
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, realpathSync } from "node:fs";
import { join } from "node:path";

import { readRuns, type Run, writeRuns } from "./orchestra-runs.ts";
import {
  directory,
  filesRefs,
  type Git,
  git,
  gitText,
  inspectTree,
  OID,
  treeContent,
} from "./orchestra-tree-check.ts";

export const LOCK_REASON =
  "do not remove or unlock: the agent raised here dies with this tree; its orchestrator frees it after the agent ends";

export async function prepareTree(
  authDir: string,
  runs: Record<string, Run>,
  key: string,
  source: string,
  execute: Git = git,
): Promise<string | null> {
  const r = runs[key];
  if (r.tree) return "tree_intent_exists";
  try {
    source = realpathSync.native(source);
  } catch {
    return "tree_source_unverified";
  }
  if (process.platform === "win32" || !directory(source)) return "tree_source_unverified";
  let commonDir: string, baseOID: string;
  try {
    if ((await gitText(source, ["rev-parse", "--show-toplevel"], execute)) !== source)
      return "tree_source_unverified";
    if (!(await filesRefs(source, execute))) return "tree_ref_storage_unverified";
    commonDir = await gitText(
      source,
      ["rev-parse", "--path-format=absolute", "--git-common-dir"],
      execute,
    );
    baseOID = await gitText(
      source,
      ["rev-parse", "--verify", "refs/remotes/origin/main^{commit}"],
      execute,
    );
    if (!directory(commonDir) || !OID.test(baseOID)) return "tree_base_unverified";
  } catch {
    return "tree_base_unverified";
  }
  const parent = join(source, ".worktrees");
  if (!existsSync(parent)) mkdirSync(parent, { mode: 0o700 });
  if (!directory(parent)) return "tree_parent_unverified";
  const operation = randomUUID();
  const path = join(parent, `orchestra-${operation}`);
  if (existsSync(path)) return "tree_path_exists";
  r.tree = {
    operation,
    source,
    path,
    commonDir,
    baseOID,
    realm: r.realm,
    room: r.room,
    invite: r.invite,
    state: "creating",
  };
  r.worktree = path;
  r.state = "preparing";
  writeRuns(authDir, runs); // durable intent precedes any add; never retry its uncertain outcome
  const current = () => readRuns(authDir)[key]?.tree?.operation === operation;
  if (!current()) return "tree_intent_superseded";
  // Locked from birth (#10603): the raised agent's terminal lives here, and Orca closes it with
  // the tree — a plain `git worktree remove` or prune by anyone else refuses it.
  const added = await execute(
    source,
    ["worktree", "add", "--lock", "--reason", LOCK_REASON, "--detach", path, baseOID],
    30_000,
  );
  try {
    if (!current()) return "tree_intent_superseded";
    if (added.code !== 0) throw new Error("tree_add_unverified");
    r.tree.identity = await inspectTree(r.tree, execute);
    const invalid = await treeContent(r.tree, execute);
    if (invalid) throw new Error(invalid);
    r.tree.state = "ready";
    writeRuns(authDir, runs);
    if (!current()) return "tree_intent_superseded";
    return null;
  } catch {
    r.tree.state = "ambiguity";
    r.tree.why = "tree_add_unverified";
    r.state = "ambiguity";
    writeRuns(authDir, runs);
    return "tree_add_unverified";
  }
}
