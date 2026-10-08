import { linkSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";

import { CFG } from "../config.ts";
import { errorCode, errorMessage } from "../errors.ts";
import { storePath } from "../store.ts";
import { debug } from "../streams.ts";
import { pidAlive } from "./authlock.ts";

// --- machine-wide refresh coordination -------------------------------------
// The grant is ONE shared thing on disk, and refreshing it ROTATES it: the
// server issues a new refresh token and retires the old one. So a dozen local
// bridges refreshing "their" copy at the same moment is not merely wasteful —
// eleven of them present a token the server has just retired, and a server that
// watches for replay (the recommended posture for rotating grants) reads that
// as a stolen grant and answers by killing the whole family. Every agent on the
// machine is then logged out at once, minutes after a perfectly good login.
// That is the shape of the periodic surprise re-login this lock exists to end.
//
// So: at most one bridge on the machine refreshes at a time, and it re-reads the
// store once it holds the lock — if a sibling already did the work there is
// nothing left to do. One expiry, one refresh, however many bridges are up.
export const REFRESH_LOCK_STALE_MS = 45_000; // longer than the token request's own deadline

interface RefreshLock {
  pid: number;
  started_at: number;
}

export function refreshLockPath(): string {
  return storePath() + ".refreshing";
}

// The filesystem decides the winner: link() onto an existing name fails, and it
// publishes a file that was already written whole — so a rival reading the lock
// the instant it appears sees an owner, never a half-written one it would
// mistake for garbage and break. A lock left behind by a bridge that died
// mid-refresh must not stop the machine from ever refreshing again, so a lock
// whose owner is gone (or which outlived the longest possible refresh) is
// broken rather than obeyed.
export function acquireRefreshLock(): boolean {
  const claim = (): boolean => {
    const tmp = `${refreshLockPath()}.${process.pid}`;
    writeFileSync(tmp, JSON.stringify({ pid: process.pid, started_at: Date.now() }), {
      mode: 0o600,
    });
    try {
      linkSync(tmp, refreshLockPath());
      return true; // atomic; EEXIST if held
    } finally {
      try {
        unlinkSync(tmp);
      } catch {}
    }
  };
  // EEXIST means someone holds it; anything else means we cannot lock at all,
  // and waiting on a lock we could never take would only hang the call.
  const notHeld = (e: unknown) => {
    if (errorCode(e) !== "EEXIST") {
      throw new Error(`cannot take the refresh lock: ${errorMessage(e)}`, { cause: e });
    }
  };
  try {
    mkdirSync(CFG.authDir, { recursive: true, mode: 0o700 });
    return claim();
  } catch (e) {
    notHeld(e);
  }

  let held: RefreshLock | null = null;
  try {
    held = JSON.parse(readFileSync(refreshLockPath(), "utf8")) as RefreshLock;
  } catch {}
  if (held && pidAlive(held.pid) && Date.now() - held.started_at < REFRESH_LOCK_STALE_MS) {
    return false;
  }
  debug("breaking a refresh lock nobody is holding");
  try {
    unlinkSync(refreshLockPath());
  } catch {}
  try {
    return claim();
  } catch (e) {
    notHeld(e);
    return false; // someone else broke it first
  }
}

export function releaseRefreshLock(): void {
  try {
    const l = JSON.parse(readFileSync(refreshLockPath(), "utf8")) as RefreshLock;
    if (l.pid === process.pid) unlinkSync(refreshLockPath());
  } catch {}
}

export function installRefreshLockExitHook(): void {
  process.on("exit", releaseRefreshLock);
}
