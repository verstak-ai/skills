// The Orca adapter of the orchestrator (graph @nks/nks-dev, nodes #9966, #9971, #9968, #9969):
// the installed CLI's version and declared schema are read first; the launch is one argv array
// through execFile, never a shell; an ambiguous outcome is not retried with a second agent.
// `orca` is found on the daemon's PATH.
import { execFile } from "node:child_process";

/** The version whose surface was observed (#9966); any other — nothing is launched. */
export const ORCA_VERSION = "1.4.242";
const FLAGS = ["agent", "worktree", "model", "prompt", "json"];

function run(args: string[], timeoutMs: number): Promise<{ code: number | string; out: string }> {
  return new Promise((resolve) => {
    execFile(
      "orca",
      args,
      { timeout: timeoutMs, maxBuffer: 4 * 1024 * 1024, windowsHide: true },
      (err, stdout) => {
        const e = err as (NodeJS.ErrnoException & { killed?: boolean }) | null;
        const code = !e
          ? 0
          : e.killed
            ? "timeout"
            : typeof e.code === "number"
              ? e.code
              : (e.code ?? 1);
        resolve({ code, out: String(stdout ?? "") });
      },
    );
  });
}

/** The installed surface is the observed one; a code when it is not. */
export async function orcaReady(): Promise<string | null> {
  const v = await run(["--version"], 10_000);
  if (v.code !== 0) return v.code === "ENOENT" ? "orca_missing" : "orca_unreadable";
  if (v.out.trim() !== ORCA_VERSION) return "orca_version_unverified";
  const ctx = await run(["agent-context", "--json"], 10_000);
  try {
    const schema = JSON.parse(ctx.out) as {
      commands?: { command?: string; flags?: string[] }[];
    };
    const launch = schema.commands?.find((c) => c.command === "agent launch");
    if (ctx.code === 0 && launch && FLAGS.every((f) => launch.flags?.includes(f))) return null;
  } catch {
    /* below */
  }
  return "orca_schema_unverified";
}

/** A remote url in the repository form of #4518: host/org/repo, no scheme, user or .git. */
export function remoteKey(url: string): string {
  let u = url.trim();
  const scheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(u);
  u = u.replace(/^[a-z][a-z0-9+.-]*:\/\//i, "").replace(/^[^@/]+@/, "");
  if (!scheme) u = u.replace(/^([^/:]+):/, "$1/");
  return u.replace(/\/+$/, "").replace(/\.git$/, "");
}

/** The checkout of a repository by Orca's own projects: exactly one ready local setup. */
export type CheckoutOf = (repository: string) => { path: string } | { code: string };

/** Orca's projects and setups as 1.4.242 prints them (case №4050 [8]); a code when unreadable. */
export async function orcaCheckouts(): Promise<CheckoutOf | string> {
  const list = await run(["project", "list", "--json"], 10_000);
  const setups = await run(["project", "setups", "--json"], 10_000);
  type Project = {
    id?: unknown;
    gitRemoteIdentity?: { canonicalKey?: unknown; remoteUrl?: unknown };
  };
  type Setup = { projectId?: unknown; path?: unknown; setupState?: unknown; hostId?: unknown };
  let projects: Project[];
  let ready: Setup[];
  try {
    if (list.code !== 0 || setups.code !== 0) throw new Error();
    projects = (JSON.parse(list.out) as { result: { projects: Project[] } }).result.projects;
    ready = (JSON.parse(setups.out) as { result: { setups: Setup[] } }).result.setups;
    if (!Array.isArray(projects) || !Array.isArray(ready)) throw new Error();
  } catch {
    return "orca_projects_unreadable";
  }
  return (repository) => {
    const ids = new Set(
      projects
        .filter((p) => {
          const g = p.gitRemoteIdentity ?? {};
          return (
            g.canonicalKey === repository ||
            (typeof g.remoteUrl === "string" && remoteKey(g.remoteUrl) === repository)
          );
        })
        .map((p) => p.id),
    );
    const paths = [
      ...new Set(
        ready
          .filter(
            (s) =>
              ids.has(s.projectId) &&
              s.setupState === "ready" &&
              s.hostId === "local" &&
              typeof s.path === "string" &&
              s.path,
          )
          .map((s) => s.path as string),
      ),
    ];
    if (!paths.length) return { code: "no_checkout" };
    if (paths.length > 1) return { code: "ambiguous_checkout" };
    return { path: paths[0] };
  };
}

export function launchArgv(
  agent: string,
  worktree: string,
  model: string,
  prompt: string,
): string[] {
  return [
    "agent",
    "launch",
    "--agent",
    agent,
    "--worktree",
    `path:${worktree}`,
    "--model",
    model,
    "--prompt",
    prompt,
    "--json",
  ];
}

/** The terminal handle of a launch answer: `result.outcome.handle` of a terminal launch — the
 * answer observed on 1.4.242 (the launch of 09.11, case №4040; graph @nks/nks-dev, #9966);
 * under result.launch, or `agentTerminalHandle` of an older host — forms agent-context declares,
 * kept unobserved. Anything else — no handle. */
export function launchHandle(out: string): string | undefined {
  try {
    const r = (JSON.parse(out) as { result?: Record<string, unknown> }).result ?? {};
    for (const o of [r.outcome, (r.launch as { outcome?: unknown } | undefined)?.outcome]) {
      const x = o as { kind?: unknown; handle?: unknown } | undefined;
      if (x?.kind === "terminal" && typeof x.handle === "string" && x.handle) return x.handle;
    }
    if (typeof r.agentTerminalHandle === "string" && r.agentTerminalHandle)
      return r.agentTerminalHandle;
  } catch {
    /* not JSON — no handle */
  }
  return undefined;
}

/** The Orca runtime that answered: `_meta.runtimeId`, on every 1.4.242 answer observed — launch
 * included (№4050 [74]; #9966). */
function runtimeOf(out: string): string | undefined {
  try {
    const id = (JSON.parse(out) as { _meta?: { runtimeId?: unknown } })._meta?.runtimeId;
    return typeof id === "string" && id ? id : undefined;
  } catch {
    return undefined;
  }
}

/** ok — the harness was started (not yet a seat); ambiguous — do not launch again. */
export async function orcaLaunch(argv: string[]): Promise<{
  outcome: "ok" | "ambiguous" | "failed";
  why?: string;
  handle?: string;
  runtime?: string;
}> {
  const r = await run(argv, 120_000);
  if (r.code === 0)
    return { outcome: "ok", handle: launchHandle(r.out), runtime: runtimeOf(r.out) };
  if (r.code === "timeout") return { outcome: "ambiguous", why: "launch_timeout" };
  return { outcome: "failed", why: `launch_exit_${r.code}` };
}

/**
 * Close the one terminal our own launch opened, by its handle — never a process by PID — and
 * only while the Orca runtime that issued the handle still answers for it: a restarted Orca may
 * hand the same handle to another tab.
 */
export async function orcaClose(handle: string, runtime: string): Promise<string> {
  const shown = await run(["terminal", "show", "--terminal", handle, "--json"], 30_000);
  if (shown.code !== 0) return `terminal_show_failed_${shown.code}`;
  if (runtimeOf(shown.out) !== runtime) return "terminal_runtime_changed";
  const r = await run(["terminal", "close", "--terminal", handle, "--json"], 30_000);
  return r.code === 0 ? "terminal_closed" : `terminal_close_failed_${r.code}`;
}
