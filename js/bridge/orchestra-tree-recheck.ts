// A kept tree of an ended run is looked at again (graph @nks/nks-dev, #11189): the first
// cleanup's reason written once was never revisited, though commits a trunk took later or a
// change undone may have taken it away. The look is the first cleanup's own path and proof of
// ours; at most once an interval per row, nothing read but local Git.
import { readRuns, type Run, runIdentity, writeRuns } from "./orchestra-runs.ts";

/** How often a kept tree of an ended run is looked at again. */
export const RECHECK_MS = 10 * 60_000;

/** Kept for what may yet go away: commits a trunk takes later, a change undone, a fact unread.
 * Anything else stays kept as it was said. */
const passing = (why = ""): boolean =>
  why === "tree_commits_retained" || why === "tree_dirty_retained" || why.endsWith("_unverified");

/** A kept tree whose reason may have gone, not looked at within the interval. */
export const recheckDue = (r: Run, now: number): boolean =>
  r.tree?.state === "retained" &&
  passing(r.tree.why) &&
  !(now - Date.parse(r.tree.checked ?? "") < RECHECK_MS);

type Cleanup = (authDir: string, runs: Record<string, Run>, key: string) => Promise<string | null>;

/** Its reason gone — removed by `cleanup`; still there — kept and said as before. */
export async function recheckKept(
  authDir: string,
  runs: Record<string, Run>,
  key: string,
  now: number,
  cleanup: Cleanup,
): Promise<void> {
  const r = runs[key],
    t = r.tree!;
  const before = t.why;
  t.checked = new Date(now).toISOString();
  t.state = "ready";
  const why = await cleanup(authDir, runs, key);
  if (t.state === "ready") {
    // Turned back before any look at the tree (the run superseded, its client unproven).
    t.state = "retained";
    t.why = before;
  } else if (t.state === "removed" && r.why === before) delete r.why;
  else if (why && t.state === "retained") r.why = why;
  const latest = readRuns(authDir)[key];
  if (latest && runIdentity(latest) === runIdentity(r)) writeRuns(authDir, runs);
}
