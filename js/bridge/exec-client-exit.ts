// Wait has no incarnation field: both separate shows must match the saved client (#9966).
import { run } from "./orchestra-orca.ts";
import type { Run } from "./orchestra-runs.ts";

interface Reply {
  ok?: boolean;
  _meta?: { runtimeId?: string };
  result?: {
    terminal?: {
      handle?: string;
      incarnationId?: string;
      worktreePath?: string;
      executionHostId?: string;
      connected?: boolean;
      writable?: boolean;
    };
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
  if (!r.exec?.session || !r.exec.incarnation || !r.terminal || !r.runtime) return false;
  const show = async (): Promise<Reply> => {
    const got = await run(["terminal", "show", "--terminal", r.terminal!, "--json"], 5_000);
    return got.code === 0 ? parse(got.out) : {};
  };
  const matches = (v: Reply): boolean => {
    const terminal = v.result?.terminal;
    return (
      !!terminal &&
      v.ok === true &&
      v._meta?.runtimeId === r.runtime &&
      terminal.handle === r.terminal &&
      terminal.incarnationId === r.exec?.incarnation &&
      terminal.executionHostId === "local" &&
      terminal.worktreePath === r.worktree
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
