// Cleanup is a separate, fail-closed transition after exact client exit and confirmed stop (#7517).
import { closeSync, existsSync, fstatSync, lstatSync, openSync, unlinkSync } from "node:fs";
import { join } from "node:path";

import { readRuns, type Run, runIdentity, writeRuns } from "./orchestra-runs.ts";
import {
  directory,
  type Git,
  git,
  gitText,
  inspectTree,
  OID,
  treeContent,
} from "./orchestra-tree-check.ts";

export async function cleanupTree(
  authDir: string,
  runs: Record<string, Run>,
  key: string,
  execute: Git = git,
): Promise<string | null> {
  const r = runs[key],
    t = r.tree;
  if (!t || t.state === "removed") return null;
  if (t.state !== "ready") return t.why ?? "tree_cleanup_unverified";
  if (
    r.state !== "ended" ||
    r.stop_outcome !== "stopped" ||
    r.closed !== "client_exited" ||
    !t.exit
  )
    return "tree_client_unverified";
  const identity = runIdentity(r);
  const current = () => {
    const latest = readRuns(authDir)[key];
    return (
      !!latest &&
      runIdentity(latest) === identity &&
      latest.state === "ended" &&
      latest.stop_outcome === "stopped" &&
      latest.closed === "client_exited"
    );
  };
  const retain = (why: string) => {
    t.state = "retained";
    t.why = why;
    if (current()) writeRuns(authDir, runs);
    return why;
  };
  if (!current()) return "tree_superseded";
  if (
    !t.identity ||
    !/^[a-f0-9-]{36}$/.test(t.operation) ||
    t.path !== r.worktree ||
    t.path !== join(t.source, ".worktrees", `orchestra-${t.operation}`) ||
    !OID.test(t.baseOID) ||
    t.realm !== r.realm ||
    t.room !== r.room ||
    t.invite !== r.invite ||
    !directory(t.source)
  )
    return retain("tree_identity_unverified");
  let lock: { fd: number; path: string; dev: number; ino: number } | undefined;
  try {
    const common = await gitText(
      t.source,
      ["rev-parse", "--path-format=absolute", "--git-common-dir"],
      execute,
    );
    if (
      common !== t.commonDir ||
      JSON.stringify(await inspectTree(t, execute)) !== JSON.stringify(t.identity)
    )
      return retain("tree_identity_unverified");
    const invalid = await treeContent(t, execute);
    if (invalid) return retain(invalid);
    if (!current()) return "tree_superseded";
    // A detached commit updates this HEAD through HEAD.lock. Hold it across the final check
    // and remove, so a clean new commit cannot race the base-OID guard and be discarded.
    const lockPath = join(t.identity.gitDir, "HEAD.lock");
    try {
      const fd = openSync(lockPath, "wx", 0o600);
      const s = fstatSync(fd);
      lock = { fd, path: lockPath, dev: s.dev, ino: s.ino };
    } catch {
      return retain("tree_head_locked");
    }
    if (JSON.stringify(await inspectTree(t, execute)) !== JSON.stringify(t.identity))
      return retain("tree_identity_unverified");
    const changed = await treeContent(t, execute);
    if (changed) return retain(changed);
    if (!current()) return "tree_superseded";
    t.state = "removing";
    writeRuns(authDir, runs);
    const removed = await execute(t.source, ["worktree", "remove", "--", t.path], 30_000);
    if (removed.code !== 0 || existsSync(t.path) || existsSync(t.identity.gitDir))
      return retain("tree_remove_unverified");
    t.state = "removed";
    delete t.why;
    if (!current()) return "tree_superseded";
    writeRuns(authDir, runs);
    return null;
  } catch {
    return retain("tree_cleanup_unverified");
  } finally {
    if (lock) {
      closeSync(lock.fd);
      try {
        const s = lstatSync(lock.path);
        if (!s.isSymbolicLink() && s.dev === lock.dev && s.ino === lock.ino) unlinkSync(lock.path);
      } catch {
        /* removed metadata, or leave a changed lock untouched */
      }
    }
  }
}

export async function cleanupEndedTrees(authDir: string, runs: Record<string, Run>): Promise<void> {
  for (const [key, r] of Object.entries(runs))
    if (r.tree?.state === "ready" && r.state === "ended") {
      const why = await cleanupTree(authDir, runs, key);
      if (why) r.why = why;
    }
}
