import {
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { connect } from "node:net";
import { basename, dirname, join } from "node:path";

import { CFG } from "../config.ts";
import { storePath } from "../store.ts";
import { type DeviceCode } from "./devicecode.ts";

// --- machine-wide authorization coordination ------------------------------
// Dozens of local agents share one grant, so a machine has at most ONE login in
// flight; every bridge (and every call meanwhile) surfaces the SAME authorize
// URL — whichever surface the human happens to look at, one click heals the
// whole machine.
//
// The file IS that login. It is published once and lives until the login lands
// or is refused, longer than the bridge that published it, and it carries what
// any bridge needs to catch this very login's redirect (state, PKCE verifier,
// the client its sign-in page was minted under). Its link is the loopback
// address of whoever listens on the port, never the sign-in server's page. So
// the tab the human already has stays good whichever bridge is alive when they
// click: a later bridge that finds nobody listening listens on the same link
// itself (graph nks-dev: #4721, #4794). Whether anyone listens right now is the
// LISTENER's word, never the file's — a caller probes the port before it hands
// the link to anyone.
//
// Publishing needs no network — the sign-in page is minted only when the link is
// opened — so the record goes down, link included, the moment the port is
// bound: a sibling meeting the bound port finds the login to join at once
// (#4793). A record with no link is a bare claim an earlier build wrote while it
// registered its client; it is waited on briefly, never trusted for long.

export interface AuthLock {
  pid: number;
  started_at: number;
  callback_port: number;
  authorize_url?: string;
  state?: string;
  verifier?: string;
  /** the client the sign-in page was last minted under — the code is exchanged under it */
  client_id?: string;
  /** a fingerprint of the grant the login was published over — another grant makes it moot */
  grant?: string;
  /** the same login's code for sign-in from another device, while one stands */
  device?: DeviceCode;
  /** why no such code is offered: the server has no client for it — the word for the human */
  device_unset?: string;
}

export function authLockPath(): string {
  return storePath() + ".auth-pending";
}

export function pidAlive(pid: unknown): boolean {
  if (!Number.isInteger(pid) || (pid as number) <= 0) return false;
  try {
    process.kill(pid as number, 0);
    return true;
  } catch (e) {
    return (e as { code?: string }).code === "EPERM"; // alive, merely not ours to signal
  }
}

// Is anything accepting connections on the loopback callback port?
export function portListening(port: unknown, timeoutMs = 700): Promise<boolean> {
  return new Promise((resolve) => {
    if (!Number.isInteger(port)) return resolve(false);
    const sock = connect({ host: "127.0.0.1", port: port as number });
    const done = (v: boolean) => {
      sock.destroy();
      resolve(v);
    };
    sock.setTimeout(timeoutMs, () => done(false));
    sock.once("connect", () => done(true));
    sock.once("error", () => done(false));
  });
}

export function readAuthLock(): AuthLock | null {
  try {
    return JSON.parse(readFileSync(authLockPath(), "utf8")) as AuthLock;
  } catch {
    return null;
  }
}

// Written only by the process that holds the port — the bind settled who writes
// here — and atomically, through a rename, wherever the rename goes through: a
// reader never meets a half-written record and takes a live login for a closed
// one. Where it does not (below), the write is plain, and a caller whose write
// fails hands out no login at all. The login's tab is not in the
// record at all: it goes to whoever creates the tab's marker (claimTab).
export function writeAuthLock(
  fields: Omit<AuthLock, "pid" | "started_at"> & Partial<Pick<AuthLock, "pid" | "started_at">>,
): void {
  mkdirSync(CFG.authDir, { recursive: true, mode: 0o700 });
  const tmp = `${authLockPath()}.tmp-${process.pid}`;
  const body = JSON.stringify({
    ...fields,
    pid: fields.pid ?? process.pid,
    started_at: fields.started_at ?? Date.now(),
  });
  try {
    writeFileSync(tmp, body, { mode: 0o600 });
    renameSync(tmp, authLockPath());
  } catch {
    // A rename can fail for a moment on Windows while something holds the
    // target; the record still goes down — unatomically — rather than not at
    // all, and the temporary copy, with its verifier, does not stay behind.
    try {
      unlinkSync(tmp);
    } catch {}
    writeFileSync(authLockPath(), body, { mode: 0o600 });
  }
}

// Only the login's own listener clears it: a record a newer login or a taker
// has rewritten is not ours to drop, so a caller names what it owns.
export function releaseAuthLock(owns?: (l: AuthLock) => boolean): void {
  try {
    const l = readAuthLock();
    if (owns && (!l || !owns(l))) return;
    unlinkSync(authLockPath());
  } catch {}
}

const tabMarkPath = (state: string): string => `${authLockPath()}.tab-${state}`;

// The one tab of a login goes to whoever creates its marker — publishing,
// taking it over or joining it: exclusive create is atomic across processes,
// where reading a record and then writing it is not (#4794).
export function claimTab(state: string): boolean {
  try {
    mkdirSync(CFG.authDir, { recursive: true, mode: 0o700 });
    writeFileSync(tabMarkPath(state), "", { flag: "wx", mode: 0o600 });
    return true;
  } catch {
    return false;
  }
}

// Markers of logins that are over are swept when a new login is published — by
// then no other login is out on this machine — and only then: dropped together
// with the record, a marker could be claimed afresh by a bridge that read the
// record a moment before, a tab onto a closed port.
export function sweepTabMarks(): void {
  const prefix = `${basename(authLockPath())}.tab-`;
  try {
    for (const f of readdirSync(dirname(authLockPath()))) {
      if (f.startsWith(prefix)) unlinkSync(join(dirname(authLockPath()), f));
    }
  } catch {}
}

// A published login outlives its bridge on purpose. A bare claim does not: a
// claimer that dies before publishing must not keep siblings waiting on it.
export function installAuthLockExitHook(): void {
  process.on("exit", () => {
    try {
      const l = JSON.parse(readFileSync(authLockPath(), "utf8")) as AuthLock;
      if (l.pid === process.pid && !l.authorize_url) unlinkSync(authLockPath());
    } catch {}
  });
}
