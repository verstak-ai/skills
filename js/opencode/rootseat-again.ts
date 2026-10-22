// A root not seated for a defect of its cover (rootseat.ts) waits for the alignment in the same
// session: after every tool call of the instance its cover file is looked at by a cheap stat
// (mtime, size, inode — no watcher), on every prompt of the root it is read again. Unambiguous —
// the root seats once by the same path; another defect — its exact word. A defect is a missing
// file, broken front matter, a missing or ambiguous graph or role; the contract's number is not
// the plugin's to know — the cover file itself and the start hook keep it. Alignment is only
// at a repository's root (shared/reposigns.ts), where no cover file is its entry too: the cover
// is read only in the session's own directory, and a subdirectory's never comes from the alignment.
// Elsewhere — outside a repository or below its root — main's reading: no file — silence, a
// defective one — the plain "not seated", neither waits. A stopped session waits no more:
// alignment does not lift a stop.
import { realpathSync, statSync } from "node:fs";
import { join } from "node:path";

import { COVER, ROOT_SEAT } from "../delivery/index.ts";
import { type Cover, readCover } from "../shared/cover.ts";
import { words } from "../shared/lang.ts";
import { repoRoot } from "../shared/reposigns.ts";

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

/** The cover file's signature; no file — "". */
export function stamp(where: string): string {
  try {
    const st = statSync(join(where, COVER.file));
    return `${st.mtimeMs}:${st.size}:${st.ino}`;
  } catch {
    return "";
  }
}

/** What a waiting root does now: say the new reason, seat in the directory it waited in, or nothing. */
export type Again = { why: string } | { seat: string } | null;

export function createRealign(halted: (session: string) => boolean) {
  const waiting = new Map<string, { where: string; why: string; sig: string }>();
  const left = new Map<string, { where: string; why: string }>(); // moved away while waiting
  return {
    /** sig — the stamp taken before the defective read: a write in between is not missed. */
    arm(session: string, where: string, why: string, sig: string): void {
      waiting.set(session, { where, why, sig });
    },
    has: (session: string): boolean => waiting.has(session),
    drop(session: string): void {
      waiting.delete(session);
      left.delete(session);
    },
    clear(): void {
      waiting.clear();
      left.clear();
    },
    /** Moved away: the wait is kept aside, not looked at, until the session comes back; none — false. */
    leave(session: string): boolean {
      const w = waiting.get(session);
      waiting.delete(session);
      if (w) left.set(session, { where: w.where, why: w.why });
      return !!w;
    },
    /** Back in the folder it waited in: it waits again, the cover read at the next look. */
    back(session: string, where: string): boolean {
      const w = left.get(session);
      left.delete(session);
      if (!w || w.where !== where) return false;
      waiting.set(session, { ...w, sig: "\0back" });
      return true;
    },
    /** always — a prompt reads the cover even when its stamp did not move. */
    check(session: string, always: boolean): Again {
      const w = waiting.get(session);
      if (!w) return null;
      if (halted(session)) {
        waiting.delete(session);
        return null;
      }
      const sig = stamp(w.where);
      if (!always && sig === w.sig) return null;
      w.sig = sig;
      const cover = coverIn(w.where);
      if (cover === null) return null;
      if ("why" in cover) {
        if (cover.why === w.why) return null;
        w.why = cover.why;
        return { why: cover.why };
      }
      waiting.delete(session);
      return { seat: w.where };
    },
  };
}
