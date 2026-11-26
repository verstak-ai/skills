// A launch's terminal is not closed while its client still holds a live seat through this
// daemon — any seat, not only the call's (8.14.1 on a machine: the call's seat was over, the same
// OpenCode process had stood another place, and the reap killed a live agent). What the daemon
// knows itself: its thin bridges' sessions with a seat standing, by the bridge's pid; a bridge
// started by a client inside an Orca terminal inherits that terminal's handle in its environment.
// Closed by default: an environment not read is no proof of "not here" — the terminal is kept.
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";

/** A live session of this daemon: its thin bridge's pid and the seats it stands. */
export interface SeatHolder {
  pid: number;
  seats: string[];
}
/** Why this terminal must not be closed — `client_holds_seat <seat>` or `client_hold_unknown
 * (<refusal>)`; null — every live seat holder was read and none stands in it. */
export type Held = (terminal: string) => Promise<string | null>;

export const noHeld: Held = () => Promise.resolve(null);

const KEY = "ORCA_TERMINAL_HANDLE=";
const ENV_WORD = /^[A-Za-z_][A-Za-z0-9_]*=/;

/** A process's environment as read, or why it was not. */
type Environ = { words: string[] } | { refused: string };
/** The Orca terminal a process was started in (null — none in a read environment), or why its
 * environment was not read. */
export type TerminalRead = { terminal: string | null } | { refused: string };

const fromProc = (pid: number): Promise<Environ> =>
  readFile(`/proc/${pid}/environ`, "utf8").then(
    (s) => (s ? { words: s.split("\0") } : { refused: "environ_empty" }),
    (e: NodeJS.ErrnoException) => ({ refused: `environ_${e.code ?? "unreadable"}` }),
  );

const fromPs = (pid: number): Promise<Environ> =>
  new Promise((done) =>
    execFile(
      "ps",
      ["eww", "-o", "command=", "-p", String(pid)],
      { windowsHide: true, timeout: 5_000 },
      (e, out) => {
        if (e)
          return done({
            refused: e.killed || e.signal ? "ps_timeout" : `ps_exit_${String(e.code ?? "unknown")}`,
          });
        const words = String(out).trim().split(/\s+/).filter(Boolean);
        if (!words.length) return done({ refused: "ps_empty" });
        // ps may print the command alone when it may not show the environment.
        done(words.some((s) => ENV_WORD.test(s)) ? { words } : { refused: "ps_no_environment" });
      },
    ),
  );

/** The environment of a process of this user: /proc on Linux, `ps eww` elsewhere. */
const environOf = (pid: number): Promise<Environ> =>
  process.platform === "linux" ? fromProc(pid) : fromPs(pid);

export async function terminalOf(pid: number): Promise<TerminalRead> {
  const env = await environOf(pid);
  if ("refused" in env) return env;
  const found = env.words.find((s) => s.startsWith(KEY));
  return { terminal: found ? found.slice(KEY.length) : null };
}

/** Whether a live seat stands in this terminal, by the daemon's own sessions; one holder not
 * read makes the answer unknown unless another is seen holding it. */
export const heldBy =
  (holders: () => SeatHolder[], terminalOfPid = terminalOf): Held =>
  async (terminal) => {
    let unknown: string | null = null;
    for (const h of holders()) {
      if (!h.seats.length) continue;
      const read = await terminalOfPid(h.pid);
      if ("refused" in read) unknown ??= read.refused;
      else if (read.terminal === terminal) return `client_holds_seat ${h.seats[0]!}`;
    }
    return unknown ? `client_hold_unknown (${unknown})` : null;
  };
