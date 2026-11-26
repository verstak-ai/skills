// The cover a root session is seated by (opencode/rootseat.ts, dsh/rootseat.ts): the cover of the
// session's own directory, and whether its defect leads to the alignment. Alignment is only at a
// repository's root (reposigns.ts), where no cover file is its entry too; elsewhere — outside a
// repository or below its root — no file is silence and a defective one the plain "not seated".
import { realpathSync } from "node:fs";

import { COVER, ROOT_SEAT } from "../delivery/index.ts";
import { type Cover, readCover } from "./cover.ts";
import { words } from "./lang.ts";
import { repoRoot } from "./reposigns.ts";

/** The cover of a session's directory; a reason says whether it leads to the alignment. */
export type Found =
  Exclude<Cover, { why: string } | { foreign: true }> | { why: string; align: boolean };

/** The directory is a repository's root, under any spelling (a symlink, /var → /private/var). */
function atRepoRoot(where: string): boolean {
  const root = repoRoot(where);
  if (root === null) return false;
  try {
    return realpathSync(root) === realpathSync(where);
  } catch {
    return false;
  }
}

/** Whether the directory is a repository's root is asked before any defect: else — main's reading. */
export function coverIn(where: string): Found {
  const align = atRepoRoot(where);
  const cover = readCover(where);
  if (cover === null) return align ? { why: words(ROOT_SEAT).noFile(COVER.file), align } : null;
  if ("foreign" in cover) return null;
  return "why" in cover ? { why: cover.why, align } : cover;
}
