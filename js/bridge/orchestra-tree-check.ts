// Read-only Git facts; mutation commands also disable repository hooks for this call (#7517).
import { lstatSync, readFileSync, realpathSync } from "node:fs";
import { isAbsolute, join, relative } from "node:path";
import { isDeepStrictEqual } from "node:util";

import { run } from "./orchestra-orca.ts";
import { readRuns, type Run, runKey } from "./orchestra-runs.ts";
import type { RunTree, TreeIdentity } from "./orchestra-tree-types.ts";

export const git = (cwd: string, args: string[], timeout = 10_000) =>
  run(
    ["--no-optional-locks", "--no-replace-objects", "-c", "core.hooksPath=/dev/null", ...args],
    timeout,
    "git",
    cwd,
  );
export type Git = typeof git;

export async function gitText(cwd: string, args: string[], execute: Git = git): Promise<string> {
  const result = await execute(cwd, args);
  if (result.code !== 0) throw new Error("git_read_unverified");
  return result.out.trim();
}
export const OID = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/;

export async function filesRefs(cwd: string, execute: Git = git): Promise<boolean> {
  const storage = await execute(cwd, ["config", "--local", "--get", "extensions.refStorage"]);
  return (
    (storage.code === 1 && !storage.out.trim()) ||
    (storage.code === 0 && storage.out.trim() === "files")
  );
}

/** Canonical directory only, never a symlink or a directory reached through one. */
export function directory(path: string): boolean {
  try {
    const s = lstatSync(path);
    return (
      isAbsolute(path) &&
      s.isDirectory() &&
      !s.isSymbolicLink() &&
      realpathSync.native(path) === path
    );
  } catch {
    return false;
  }
}

export async function inspectTree(tree: RunTree, execute: Git = git): Promise<TreeIdentity> {
  if (!directory(tree.path) || !directory(tree.commonDir))
    throw new Error("tree_identity_unverified");
  const marker = lstatSync(join(tree.path, ".git"));
  if (!marker.isFile() || marker.isSymbolicLink()) throw new Error("tree_identity_unverified");
  const common = await gitText(
    tree.path,
    ["rev-parse", "--path-format=absolute", "--git-common-dir"],
    execute,
  );
  const gitDir = await gitText(tree.path, ["rev-parse", "--absolute-git-dir"], execute);
  if (
    common !== tree.commonDir ||
    !directory(gitDir) ||
    !/^worktrees\/[^/]+$/.test(relative(common, gitDir))
  )
    throw new Error("tree_identity_unverified");
  const back = join(gitDir, "gitdir");
  if (
    !lstatSync(back).isFile() ||
    lstatSync(back).isSymbolicLink() ||
    readFileSync(back, "utf8").trim() !== join(tree.path, ".git")
  )
    throw new Error("tree_identity_unverified");
  if ((await gitText(tree.path, ["rev-parse", "--show-toplevel"], execute)) !== tree.path)
    throw new Error("tree_identity_unverified");
  const path = lstatSync(tree.path),
    metadata = lstatSync(gitDir),
    shared = lstatSync(common);
  return {
    gitDir,
    pathDev: path.dev,
    pathIno: path.ino,
    gitDev: metadata.dev,
    gitIno: metadata.ino,
    commonDev: shared.dev,
    commonIno: shared.ino,
  };
}

export async function treeContent(tree: RunTree, execute: Git = git): Promise<string | null> {
  if (!(await filesRefs(tree.path, execute))) return "tree_ref_storage_unverified";
  const head = await gitText(tree.path, ["rev-parse", "--verify", "HEAD^{commit}"], execute);
  if (head !== tree.baseOID) return "tree_commits_retained";
  const branch = await execute(tree.path, ["symbolic-ref", "-q", "HEAD"]);
  if (branch.code !== 1 || branch.out.trim()) return "tree_not_detached";
  const dirty = await execute(tree.path, [
    "status",
    "--porcelain=v1",
    "--untracked-files=all",
    "--ignored=matching",
  ]);
  return dirty.code !== 0 ? "tree_status_unverified" : dirty.out ? "tree_dirty_retained" : null;
}

/** Admit only the durable ready tree of this exact Run, never an arbitrary checkout path. */
export async function readyTree(
  authDir: string,
  key: string,
  r: Run,
  source: string,
): Promise<boolean> {
  const t = r.tree;
  if (
    !t ||
    t.state !== "ready" ||
    r.state !== "preparing" ||
    r.exec ||
    r.closed ||
    !t.identity ||
    !/^[a-f0-9-]{36}$/.test(t.operation) ||
    !OID.test(t.baseOID) ||
    key !== runKey(r.realm, r.room, r.invite) ||
    t.realm !== r.realm ||
    t.room !== r.room ||
    t.invite !== r.invite ||
    t.source !== source ||
    !directory(source) ||
    r.worktree !== t.path ||
    t.path !== join(source, ".worktrees", `orchestra-${t.operation}`)
  )
    return false;
  try {
    return (
      (await gitText(source, ["rev-parse", "--path-format=absolute", "--git-common-dir"])) ===
        t.commonDir &&
      isDeepStrictEqual(await inspectTree(t), t.identity) &&
      (await treeContent(t)) === null &&
      isDeepStrictEqual(readRuns(authDir)[key], r)
    );
  } catch {
    return false;
  }
}
