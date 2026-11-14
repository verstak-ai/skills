// A detached tree git has just added is not yet one of Orca's workspaces (graph @nks/nks-dev,
// node #10598): on 1.4.258 `worktree show --worktree path:` answered selector_not_found right
// after `git worktree add` and the tree two seconds later, and a launch in that gap was refused
// before anything started. The launch waits, a bounded while, until Orca names the exact path.
import { envName } from "../delivery/index.ts";
import { run } from "./orchestra-orca.ts";

const PAUSE_MS = 500;

/** The whole wait; the probes shorten it through the environment. */
const budget = (): number => {
  const ms = Number(process.env[envName("ORCA_TREE_WAIT_MS")]);
  return Number.isFinite(ms) && ms >= 0 ? ms : 15_000;
};

const shown = (out: string): unknown => {
  try {
    return (JSON.parse(out) as { result?: { worktree?: { path?: unknown } } }).result?.worktree
      ?.path;
  } catch {
    return undefined;
  }
};

/** null once Orca shows the tree at this path; orca_tree_unseen when the wait ran out. */
export async function orcaSeesTree(path: string): Promise<string | null> {
  const until = Date.now() + budget();
  for (;;) {
    // One answer never outlasts the whole wait.
    const left = Math.max(1_000, Math.min(10_000, until - Date.now()));
    const r = await run(["worktree", "show", "--worktree", `path:${path}`, "--json"], left);
    if (r.code === 0 && shown(r.out) === path) return null;
    if (Date.now() + PAUSE_MS > until) return "orca_tree_unseen";
    await new Promise((resolve) => setTimeout(resolve, PAUSE_MS));
  }
}
