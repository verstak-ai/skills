// Observed status + host name forms on Orca 1.4.242 (#9966v14), before side effects.
import { hostname } from "node:os";

import { run } from "./orchestra-orca.ts";

export const execHost = (host: string | null): boolean =>
  !!host &&
  host.toLowerCase() === hostname().toLowerCase() &&
  ["darwin", "linux"].includes(process.platform);

export type OrcaReply = {
  ok?: boolean;
  _meta?: { runtimeId?: string };
  result?: Record<string, unknown>;
};
export function parseOrca(out: string): OrcaReply {
  try {
    return JSON.parse(out) as OrcaReply;
  } catch {
    return {};
  }
}
export async function execRuntime(): Promise<string | null> {
  const surface = await run(["agent-context", "--json"], 10_000);
  try {
    const commands = (
      JSON.parse(surface.out) as { commands?: { command?: string; flags?: string[] }[] }
    ).commands;
    const required = {
      status: ["json"],
      "host name": ["json"],
      "terminal create": ["worktree", "command", "json"],
      "terminal show": ["terminal", "json"],
      "terminal wait": ["terminal", "for", "timeout-ms", "json"],
    };
    if (
      surface.code !== 0 ||
      !Object.entries(required).every(([command, flags]) =>
        flags.every((flag) => commands?.find((c) => c.command === command)?.flags?.includes(flag)),
      )
    )
      return null;
  } catch {
    return null;
  }
  const status = await run(["status", "--json"], 10_000);
  const host = await run(["host", "name", "--json"], 10_000);
  const s = parseOrca(status.out),
    h = parseOrca(host.out);
  const t = s.result?.target as { kind?: string } | undefined;
  const r = s.result?.runtime as
    | {
        state?: string;
        reachable?: boolean;
        connectionState?: string;
        runtimeId?: string;
      }
    | undefined;
  const id = s._meta?.runtimeId;
  if (
    status.code !== 0 ||
    host.code !== 0 ||
    s.ok !== true ||
    h.ok !== true ||
    t?.kind !== "local" ||
    r?.state !== "ready" ||
    r.reachable !== true ||
    r.connectionState !== "connected" ||
    typeof id !== "string" ||
    !id ||
    id !== r.runtimeId ||
    id !== h._meta?.runtimeId ||
    !["darwin", "linux"].includes(String(h.result?.platform)) ||
    h.result?.platform !== process.platform
  )
    return null;
  return id;
}
