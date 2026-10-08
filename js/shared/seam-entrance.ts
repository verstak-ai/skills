// Seam entrance (wire — seam.ts): where the daemon socket lies, whose directory it is
// and who raises the daemon. Shared by both sides.
//
//   <grant dir>/run/       private seam directory: 0700, this user, not a link
//                          (privateDirProblem); otherwise refused
//   run/daemon.sock        daemon socket 0600; a long path — the short private
//                          /tmp/<prefix>-<uid>/daemon-<key>.sock with the same check
//   run/daemon.lock        daemon life lock: one daemon per grant
//   run/daemon.raising     raise election lock: one thin bridge raises
//   run/pipe               Windows: the random part of the pipe name (0600)
import { createHash, randomBytes } from "node:crypto";
import { linkSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

import { RUNTIME_PREFIX } from "../delivery/index.ts";
import { privateDirProblem, shortSocketDir } from "./standings.ts";

/** Daemon key — the grant directory: one daemon per grant. */
export const seamKey = (authDir: string): string =>
  createHash("sha256").update(resolve(authDir)).digest("hex").slice(0, 16);

/** Private seam directory: locks, the random pipe-name part, the socket (if the path is short). */
export const seamRunDir = (authDir: string): string => join(resolve(authDir), "run");

// Unix socket path without the trailing zero: 104 bytes on macOS and BSD, 108 on Linux.
const SUN_PATH_MAX = 103;

// A Windows pipe name is visible to every user: its unpredictable part is a random
// word in the private seam directory (Node sets no pipe ACL — a limit in REALITY.md).
// Published atomically via link(), not rename, so a second writer cannot replace a
// word the first already read; a reader finding it empty rereads.
function pipeNonce(authDir: string): string {
  const run = seamRunDir(authDir);
  const file = join(run, "pipe");
  mkdirSync(run, { recursive: true, mode: 0o700 });
  const tmp = `${file}.${process.pid}-${randomBytes(6).toString("hex")}`;
  try {
    writeFileSync(tmp, randomBytes(16).toString("hex"), { mode: 0o600 });
    linkSync(tmp, file); // EEXIST — the word is already there
  } catch {
  } finally {
    try {
      unlinkSync(tmp);
    } catch {}
  }
  for (let i = 0; i < 50; i++) {
    const word = readFileSync(file, "utf8").trim();
    if (word) return word;
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 20);
  }
  throw new Error(`${file} stays empty — the pipe name is unknown`);
}

/** Local entrance of this grant directory's daemon. On Windows creates the random name part. */
export function seamSocketPath(authDir: string): string {
  const key = seamKey(authDir);
  if (process.platform === "win32")
    return `\\\\.\\pipe\\${RUNTIME_PREFIX}-daemon-${key}-${pipeNonce(authDir)}`;
  const inRun = join(seamRunDir(authDir), "daemon.sock");
  if (Buffer.byteLength(inRun) <= SUN_PATH_MAX) return inRun;
  return join(shortSocketDir(), `daemon-${key}.sock`);
}

/**
 * Whether the entrance is fit: the seam and socket directories belong to this user
 * with no group or other rights (created 0700). Otherwise why not: the thin bridge
 * runs full, the daemon does not listen. Not checked on Windows (a limit).
 */
export function seamEntranceProblem(authDir: string): string | null {
  if (process.platform === "win32") return null;
  const run = seamRunDir(authDir);
  try {
    mkdirSync(dirname(run), { recursive: true, mode: 0o700 }); // grant directory; its rights are not the seam's concern
  } catch (e) {
    return `${dirname(run)}: ${(e as Error).message}`;
  }
  const bad = privateDirProblem(run);
  if (bad) return bad;
  const sockDir = dirname(seamSocketPath(authDir));
  return sockDir === run ? null : privateDirProblem(sockDir);
}

/** Daemon raise election lock: one raises. */
export const seamRaiseLockPath = (authDir: string): string =>
  join(seamRunDir(authDir), "daemon.raising");

/** Daemon life lock: one daemon per grant directory. */
export const seamDaemonLockPath = (authDir: string): string =>
  join(seamRunDir(authDir), "daemon.lock");

// --- file lock (after refreshlock and satellite claims) ------------------------

interface LockBody {
  pid: number;
  token: string;
  started_at: number;
}

export type FileLock =
  | { held: true; release(): void }
  | {
      held: false;
      /** held by a live process — null; otherwise why the lock cannot be taken */ fault:
        string | null;
      /** who holds it, when held by a live process */
      holder?: { pid: number; started_at: number };
    };

// Seam locks lie in a 0700 private directory, so their owner is always this user:
// EPERM from kill(pid, 0) means the pid was reused by another user — the owner is dead.
export const ownPidAlive = (pid: unknown): boolean => {
  if (!Number.isInteger(pid) || (pid as number) <= 0) return false;
  try {
    process.kill(pid as number, 0);
    return true;
  } catch {
    return false;
  }
};

const readLock = (path: string): LockBody | null => {
  try {
    return JSON.parse(readFileSync(path, "utf8")) as LockBody;
  } catch {
    return null;
  }
};

/**
 * Take the lock: link() publishes an already written file atomically (EEXIST — taken).
 * An abandoned one (owner not a live own process, or older than staleMs) is renamed
 * away and removed only by whoever carried it, checking the token; a live lock carried
 * by mistake is put back. A filesystem refusal (EACCES, EROFS…) is a fault at once.
 */
export function takeFileLock(path: string, staleMs: number): FileLock {
  const token = `${process.pid}-${randomBytes(8).toString("hex")}`;
  const body = JSON.stringify({ pid: process.pid, token, started_at: Date.now() });
  const release = () => {
    if (readLock(path)?.token === token) {
      try {
        unlinkSync(path);
      } catch {}
    }
  };
  const claim = (): boolean => {
    const tmp = `${path}.${token}`;
    writeFileSync(tmp, body, { mode: 0o600 });
    try {
      linkSync(tmp, path);
      return true;
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "EEXIST") return false;
      throw e;
    } finally {
      try {
        unlinkSync(tmp);
      } catch {}
    }
  };
  try {
    if (claim()) return { held: true, release };
    const held = readLock(path);
    if (held && ownPidAlive(held.pid) && Date.now() - held.started_at < staleMs)
      return { held: false, fault: null, holder: { pid: held.pid, started_at: held.started_at } };
    const mistake = carryAwayStale(path, held?.token);
    if (mistake) return { held: false, fault: mistake.putBack ? null : mistake.word };
    return claim() ? { held: true, release } : { held: false, fault: null };
  } catch (e) {
    return { held: false, fault: `${path}: ${(e as Error).message}` };
  }
}

/**
 * Carry away an abandoned lock with staleToken: rename to a unique name, remove only
 * one's own. null — carried (or by another); otherwise a live one was carried by
 * mistake: putBack — returned (the lock is held), else left aside.
 */
export function carryAwayStale(
  path: string,
  staleToken: string | undefined,
): { putBack: boolean; word: string } | null {
  const away = `${path}.stale-${process.pid}-${randomBytes(6).toString("hex")}`;
  try {
    renameSync(path, away);
  } catch {
    return null; // another carried it — it will take it
  }
  if (readLock(away)?.token !== staleToken) {
    // A live lock replaced the abandoned one before rename: link() it back — never
    // over a lock a third party took meanwhile.
    try {
      linkSync(away, path);
    } catch {
      return {
        putBack: false,
        word: `a live lock was carried away by mistake and could not be put back (${path} is taken again); it is left as ${away}`,
      };
    }
    try {
      unlinkSync(away);
    } catch {}
    return {
      putBack: true,
      word: `a live lock was carried away by mistake and put back — ${path} is held`,
    };
  }
  try {
    unlinkSync(away);
  } catch {}
  return null;
}
