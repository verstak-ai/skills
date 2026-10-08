// A sessionless probe of the machine daemon (a hello frame with probe): build, pid,
// session count and file — for `--version` of the thin bridge and doctor's daemon section.
import { fileURLToPath } from "node:url";

import { envName } from "../delivery/index.ts";
import { connectSeam, helloFrame } from "../shared/seam.ts";
import { seamEntranceProblem, seamSocketPath } from "../shared/seam-entrance.ts";
import { defaultAuthDir } from "../shared/standings.ts";
import { BUILD } from "./build.ts";
import { daemonWanted } from "./thin.ts";

const HELLO_MS = 3_000;

const SELF = (() => {
  try {
    return fileURLToPath(import.meta.url);
  } catch {
    return process.argv[1] ?? "";
  }
})();

/**
 * `--version` of the thin bridge (the default): this file's build, then its grant dir's
 * daemon, one line each; the first line as always.
 */
export async function versionLines(args: string[]): Promise<string[]> {
  const lines = [BUILD];
  if (!daemonWanted()) return lines;
  const d = await probeDaemon(args);
  lines.push(
    d.ok
      ? `daemon ${d.build} (pid ${d.pid}, ${d.socket})`
      : d.unsafe
        ? `daemon: the entrance is not private (${d.why})`
        : `daemon: none answering at ${d.socket} (${d.why})`,
  );
  return lines;
}

export type DaemonProbe =
  | { ok: true; socket: string; build: string; pid: number; sessions?: number; path?: string }
  | { ok: false; socket: string; why: string; unsafe?: boolean };

/** Ask the daemon of the grant dir (args or env) for build, pid and sessions without opening a session. */
export async function probeDaemon(args: string[]): Promise<DaemonProbe> {
  const i = args.indexOf("--auth-dir");
  const authDir =
    (i >= 0 ? args[i + 1] : undefined) ||
    process.env[envName("BRIDGE_AUTH_DIR")] ||
    defaultAuthDir();
  const unsafe = seamEntranceProblem(authDir);
  if (unsafe) return { ok: false, socket: "", why: unsafe, unsafe: true };
  const socket = seamSocketPath(authDir);
  try {
    const l = await connectSeam(
      socket,
      helloFrame({ build: BUILD, path: SELF, argv: args, probe: true }),
      HELLO_MS,
    );
    l.close();
    const w = l.welcome;
    return { ok: true, socket, build: w.build, pid: w.pid, sessions: w.sessions, path: w.path };
  } catch (e) {
    return { ok: false, socket, why: (e as Error).message };
  }
}
