import path from "node:path";

export function treePath(value: string, paths: typeof path = path): string {
  if (paths.sep !== "\\") return value;
  return value.replaceAll("/", "\\").replace(/^[a-z]:/, (drive) => drive.toUpperCase());
}

export function sameTreePath(a: string, b: string, paths: typeof path = path): boolean {
  return treePath(a, paths) === treePath(b, paths);
}

export function treeMetadataPath(
  common: string,
  gitDir: string,
  paths: typeof path = path,
): boolean {
  const parts = paths.relative(treePath(common, paths), treePath(gitDir, paths)).split(paths.sep);
  return (
    parts.length === 2 &&
    parts[0] === "worktrees" &&
    !!parts[1] &&
    parts[1] !== ".." &&
    sameTreePath(paths.join(common, ...parts), gitDir, paths)
  );
}
