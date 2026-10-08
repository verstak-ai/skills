import { createHash } from "node:crypto";
import {
  appendFileSync,
  mkdirSync,
  readFileSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

import { BUILD } from "./build.ts";
import { CFG } from "./config.ts";
import { type GrantState, type Store } from "./types.ts";

export const b64url = (buf: Buffer | Uint8Array): string => Buffer.from(buf).toString("base64url");
export const sha256 = (s: string): Buffer => createHash("sha256").update(s).digest();
export const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

// ------------------------------------------------------------- token store

// One JSON file per server origin+path: { client, tokens, meta, updated_at }.
export function storePath(): string {
  const u = new URL(CFG.serverUrl);
  const h = b64url(sha256(u.origin + u.pathname)).slice(0, 10);
  return join(CFG.authDir, `${u.hostname}_${h}.json`);
}

export function loadStore(): Store {
  try {
    return JSON.parse(readFileSync(storePath(), "utf8")) as Store;
  } catch {
    return {};
  }
}

// Written whole to a neighbouring file and renamed over the old one. Dozens of
// local bridges read this store; a plain overwrite lets one of them read a
// half-written file, and a store that fails to parse reads as "no grant at
// all" — which is exactly the state that sends the human to a login screen.
export function saveStore(patch: Partial<Store>): Store {
  mkdirSync(CFG.authDir, { recursive: true, mode: 0o700 });
  const next: Store = {
    ...loadStore(),
    ...patch,
    server_url: CFG.serverUrl,
    updated_at: new Date().toISOString(),
  };
  const tmp = `${storePath()}.tmp-${process.pid}`;
  try {
    writeFileSync(tmp, JSON.stringify(next, null, 2), { mode: 0o600 });
    renameSync(tmp, storePath()); // atomic within the directory
  } catch (e) {
    try {
      unlinkSync(tmp);
    } catch {}
    throw e;
  }
  return next;
}

// The server's last answers to the handshake and to the tools list, next to the
// grant: a bridge started with the network down answers the harness with them
// instead of failing the handshake. Tokens never go in here.
export interface ServerCache {
  init?: unknown;
  tools?: unknown;
}

// Not a *.json name: the grant store is the one .json per server in the auth
// dir, and whoever looks for it (a probe, a doctor, a plugin watching for the
// grant) must not find the answers cache instead.
export function serverCachePath(): string {
  return storePath() + ".server-answers";
}

export function loadServerCache(): ServerCache {
  try {
    return JSON.parse(readFileSync(serverCachePath(), "utf8")) as ServerCache;
  } catch {
    return {};
  }
}

export function saveServerCache(patch: ServerCache): void {
  try {
    mkdirSync(CFG.authDir, { recursive: true, mode: 0o700 });
    const tmp = `${serverCachePath()}.tmp-${process.pid}`;
    writeFileSync(tmp, JSON.stringify({ ...loadServerCache(), ...patch }), { mode: 0o600 });
    renameSync(tmp, serverCachePath());
  } catch {
    /* the cache is a convenience, not an obligation */
  }
}

// A short machine-wide record of what the grant has been doing. Its whole point
// is that the next surprise login can be explained after the fact: a bridge's
// stderr belongs to whichever harness happened to spawn it and is usually gone
// by the time anyone asks. Tokens never go in here.
export function grantLogPath(): string {
  return join(CFG.authDir, "grant.log");
}

export function grantLog(msg: string): void {
  appendJournal(grantLogPath(), msg);
}

/** A line in a machine journal beside the grant: time, pid, build; past 128 KB it starts over. */
export function appendJournal(path: string, msg: string): void {
  try {
    mkdirSync(CFG.authDir, { recursive: true, mode: 0o700 });
    let size = 0;
    try {
      size = statSync(path).size;
    } catch {}
    if (size > 128_000) {
      try {
        unlinkSync(path);
      } catch {}
    }
    appendFileSync(path, `${new Date().toISOString()} pid=${process.pid} ${BUILD} ${msg}\n`, {
      mode: 0o600,
    });
  } catch {} // a log that cannot be written must never break the call
}

/** The standings' life journal — held/released/parked/resumed/evicted/dead (graph @nks/nks-dev, node #5140). */
export function standingsLogPath(): string {
  return join(CFG.authDir, "standings.log");
}

export function standingLog(msg: string): void {
  appendJournal(standingsLogPath(), msg);
}

// The machine's memory of a refused grant: since when, in whose words, and
// whether a human has already been asked and declined. Shared by every bridge,
// so one refusal is one question to the human, not one per process.
export function grantStatePath(): string {
  return storePath() + ".grant-state";
}

export function loadGrantState(): GrantState {
  try {
    return JSON.parse(readFileSync(grantStatePath(), "utf8")) as GrantState;
  } catch {
    return {};
  }
}

export function saveGrantState(patch: Partial<GrantState>): void {
  try {
    mkdirSync(CFG.authDir, { recursive: true, mode: 0o700 });
    const next = { ...loadGrantState(), ...patch };
    const tmp = `${grantStatePath()}.tmp-${process.pid}`;
    writeFileSync(tmp, JSON.stringify(next), { mode: 0o600 });
    renameSync(tmp, grantStatePath());
  } catch {}
}

export function clearGrantState(): void {
  try {
    unlinkSync(grantStatePath());
  } catch {}
}
