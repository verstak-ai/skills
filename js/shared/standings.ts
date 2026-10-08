// Where standing sockets lie — ONE convention for the bridge and its watchdogs. The
// root is the bridge's grant directory (`--auth-dir`, the BRIDGE_AUTH_DIR variable,
// else the home directory); a watchdog must derive the same place as the bridge, or it
// reports "no standing held" about a bridge that holds one.
import { createHash } from "node:crypto";
import { lstatSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

import { envName, HOME_DIR, RUNTIME_PREFIX, STANDINGS } from "../delivery/index.ts";
import { words } from "./lang.ts";
import { envOf } from "./scope.ts";

export const defaultAuthDir = (): string => join(homedir(), HOME_DIR);

export const authDirFromEnv = (): string =>
  envOf(envName("BRIDGE_AUTH_DIR"))?.trim() || defaultAuthDir();

export const standingsDirOf = (authDir: string): string => join(authDir, "standings");

const hashOf = (key: string): string => createHash("sha256").update(key).digest("hex").slice(0, 16);

/**
 * Socket path by the key's hash, not the key: a unix socket path is limited to 104
 * bytes on macOS and BSD. The readable name lies beside as `<hash>.key`, by which a
 * watchdog without arguments finds the standing.
 */
export function socketPathOf(authDir: string, key: string): string {
  if (process.platform === "win32") return `\\\\.\\pipe\\${RUNTIME_PREFIX}-${hashOf(key)}`;
  const near = join(standingsDirOf(authDir), `${hashOf(key)}.sock`);
  if (Buffer.byteLength(near) <= SOCKET_PATH_MAX) return near;
  // Long grant directory: hash directory and key, so two bridges never share a socket.
  return join(shortSocketDir(), `${hashOf(resolve(authDir) + "\0" + key)}.sock`);
}

/** Unix socket path limit without the trailing zero: 104 bytes on macOS and BSD, 108 on Linux. */
const SOCKET_PATH_MAX = 103;

/** Short private socket directory, for when the path under the grant directory does not fit. */
export const shortSocketDir = (): string =>
  join(
    "/tmp",
    `${RUNTIME_PREFIX}-${typeof process.getuid === "function" ? process.getuid() : "u"}`,
  );

/**
 * A private socket directory is created 0700 and used only if it is a directory (not
 * a link) of this user with no group or other rights; the sticky /tmp keeps it from
 * being swapped before listen. Returns why not, null when fit. Shared by door.ts and seam.ts.
 */
export function privateDirProblem(dir: string): string | null {
  let st;
  try {
    try {
      mkdirSync(dir, { mode: 0o700 });
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "EEXIST") throw e;
    }
    st = lstatSync(dir);
  } catch (e) {
    return `${dir}: ${(e as Error).message}`;
  }
  const W = words(STANDINGS);
  if (!st.isDirectory()) return W.notDir(dir);
  if (typeof process.getuid === "function" && st.uid !== process.getuid()) return W.otherUser(dir);
  if (st.mode & 0o077) return W.openToOthers(dir);
  return null;
}

export const keyFilePathOf = (authDir: string, key: string): string =>
  join(standingsDirOf(authDir), `${hashOf(key)}.key`);

/** Hold record (0600): a restarted bridge returns the seat from disk (graph @nks/nks-dev, node #5061). */
export const holdFilePathOf = (authDir: string, key: string): string =>
  join(standingsDirOf(authDir), `${hashOf(key)}.hold`);

/** Seat base (graph @nks/nks-dev, node #6706): outlives the hold record a dead token erases. */
export const baseFilePathOf = (authDir: string, key: string): string =>
  join(standingsDirOf(authDir), `${hashOf(key)}.base`);

/** Intent to take the seat (0600): lies while the bridge's connect is in flight (graph @nks/nks-dev, node #6706). */
export const takingFilePathOf = (authDir: string, key: string): string =>
  join(standingsDirOf(authDir), `${hashOf(key)}.taking`);

/** Handover spool (0600): frames a leaving daemon got after closing the seat door, for its successor (graph @nks/nks-dev, node #6586). */
export const spoolFilePathOf = (authDir: string, key: string): string =>
  join(standingsDirOf(authDir), `${hashOf(key)}.spool`);

/**
 * Memory of delivered frame ids, beside the key file (on Windows the socket is a pipe,
 * not a path). With `server` — per server (`<key hash>.<origin hash>.seen`), outliving the
 * bridge: the seat key names no server and the grant directory is shared across servers
 * (#5831); without — the old name, a memory that lives as long as the bridge.
 */
export function seenFilePathOf(authDir: string, key: string, server = ""): string {
  if (!server) return join(standingsDirOf(authDir), `${hashOf(key)}.seen`);
  let origin = server;
  try {
    origin = new URL(server).origin;
  } catch {
    /* not a URL — hashed as is */
  }
  return join(standingsDirOf(authDir), `${hashOf(key)}.${hashOf(origin).slice(0, 8)}.seen`);
}
