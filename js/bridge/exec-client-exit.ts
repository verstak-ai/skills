// Wait has no incarnation field: both separate shows must match the saved client (#9966).
import { existsSync } from "node:fs";

import { run } from "./orchestra-orca.ts";
import type { Run } from "./orchestra-runs.ts";

interface Terminal {
  handle?: string;
  incarnationId?: string;
  worktreePath?: string;
  worktreeId?: string;
  orphaned?: boolean;
  executionHostId?: string;
  connected?: boolean;
  writable?: boolean;
}
interface Reply {
  ok?: boolean;
  _meta?: { runtimeId?: string };
  result?: {
    terminal?: Terminal;
    wait?: { handle?: string; condition?: string; satisfied?: boolean; status?: string };
  };
}
const parse = (s: string): Reply => {
  try {
    return JSON.parse(s) as Reply;
  } catch {
    return {};
  }
};
export async function execExited(r: Run): Promise<boolean> {
  const incarnation = r.exec
    ? r.exec.session
      ? r.exec.incarnation
      : undefined
    : r.tree?.incarnation;
  if (!incarnation || !r.terminal || !r.runtime) return false;
  const show = async (): Promise<Reply> => {
    const got = await run(["terminal", "show", "--terminal", r.terminal!, "--json"], 5_000);
    return got.code === 0 ? parse(got.out) : {};
  };
  // A tree removed under its agent (#10603): Orca closed the terminal and shows it orphaned, its
  // path emptied but its worktree id still naming ours; the incarnation binds it all the same.
  const treeGone = (t: Terminal): boolean =>
    !!r.tree &&
    t.worktreePath === "" &&
    t.orphaned === true &&
    typeof t.worktreeId === "string" &&
    t.worktreeId.endsWith(`::${r.worktree}`) &&
    !existsSync(r.worktree);
  const matches = (v: Reply): boolean => {
    const terminal = v.result?.terminal;
    return (
      !!terminal &&
      v.ok === true &&
      v._meta?.runtimeId === r.runtime &&
      terminal.handle === r.terminal &&
      terminal.incarnationId === incarnation &&
      terminal.executionHostId === "local" &&
      (terminal.worktreePath === r.worktree || treeGone(terminal))
    );
  };
  if (!matches(await show())) return false;
  const waited = await run(
    [
      "terminal",
      "wait",
      "--terminal",
      r.terminal,
      "--for",
      "exit",
      "--timeout-ms",
      "5000",
      "--json",
    ],
    7_000,
  );
  const v = parse(waited.out),
    w = v.result?.wait;
  if (
    waited.code !== 0 ||
    v.ok !== true ||
    v._meta?.runtimeId !== r.runtime ||
    w?.handle !== r.terminal ||
    w.condition !== "exit" ||
    w.satisfied !== true ||
    w.status !== "exited"
  )
    return false;
  const after = await show();
  return (
    matches(after) &&
    after.result?.terminal?.connected === false &&
    after.result?.terminal?.writable === false
  );
}
