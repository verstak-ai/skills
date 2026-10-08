// The intent to take a seat (graph @nks/nks-dev, node #6706): connect or mint runs
// under it through the hold record. In memory, a 4000 ahead of the own connect's reply
// is this bridge turning the address, not an eviction; on file (named sessions), an earlier
// bridge of the same session, on 4000, waits for that connect's outcome (a hold record with
// the new address or an erased intent) rather than for time: a slow connect makes no two seats.
import { mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import { scoped } from "../shared/scope.ts";
import { takingFilePathOf } from "../shared/standings.ts";
import { CFG } from "./config.ts";
import { seatKarta } from "./hearing.ts";
import { keyOf, sessionOfBridge } from "./holdrecord.ts";
import { normName } from "./names.ts";

interface Taking {
  session: string;
  pid: number;
}

const pathOf = (key: string): string => takingFilePathOf(CFG.authDir, key);

const alive = (pid: number): boolean => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return (e as NodeJS.ErrnoException).code === "EPERM";
  }
};

/** The session whose bridge is taking the seat now; a dead process's intent does not count. */
export function takerOf(key: string): string | null {
  try {
    const t = JSON.parse(readFileSync(pathOf(key), "utf8")) as Taking;
    return typeof t.session === "string" && alive(t.pid) ? t.session : null;
  } catch {
    return null;
  }
}

/** Own connects and mints in flight: seat key → outcome. */
const OWN = scoped(() => new Map<string, Promise<void>>());

/** The outcome of an own connect or mint of this seat in flight; none — null. */
export const ownTaking = (key: string): Promise<void> | null => OWN.get(key) ?? null;

function writeIntent(key: string): () => void {
  const session = sessionOfBridge();
  if (!session || CFG.satellite) return () => {};
  const path = pathOf(key);
  try {
    mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
    writeFileSync(path, JSON.stringify({ session, pid: process.pid }) + "\n", { mode: 0o600 });
  } catch {
    return () => {}; // not written: the earlier bridge takes the taker for another and stands beside
  }
  return () => {
    try {
      unlinkSync(path);
    } catch {}
  };
}

/** The intent for a connect or mint in args, before the call; returns its idempotent release. */
export function beginTaking(args: Record<string, unknown>): () => void {
  const action = String(args.action);
  const realm = typeof args.realm === "string" ? args.realm.trim() : "";
  if (!realm || (action !== "connect" && action !== "mint")) return () => {};
  const name = normName(args.name);
  const key = keyOf(realm, seatKarta(realm, args.karta, name), name);
  let settle = (): void => {};
  const done = new Promise<void>((res) => (settle = res));
  OWN.set(key, done);
  const unfile = writeIntent(key);
  let ended = false;
  return () => {
    if (ended) return;
    ended = true;
    if (OWN.get(key) === done) OWN.delete(key);
    unfile();
    settle();
  };
}

/** Run fn under the intent (beginTaking). */
export async function takingSeat<T>(
  args: Record<string, unknown>,
  fn: () => Promise<T>,
): Promise<T> {
  const end = beginTaking(args);
  try {
    return await fn();
  } finally {
    end();
  }
}
