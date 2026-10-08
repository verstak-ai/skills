// Sweeping dead standing keys before the bridge lays its own (see hold.ts).
import { existsSync, readdirSync, readFileSync, statSync, unlinkSync } from "node:fs";
import { connect as connectLocal } from "node:net";
import { basename, join } from "node:path";

import { seenFilePathOf, socketPathOf, standingsDirOf } from "../shared/standings.ts";
import { HOLD_RECORD_MAX_AGE_MS } from "./holdrecord.ts";

/**
 * A bridge killed without goodbye leaves `.key` and `.sock`, which mislead a watchdog
 * listing keys (to a socket nobody listens on, or to a "several standings" refusal);
 * before laying its own key, each other one is probed by one connect and removed if
 * nobody answers.
 */
/** Whether someone listens on a local standing socket: a live bridge holds it, a dead one left the file. */
export function localSocketAlive(sock: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (process.platform !== "win32" && !existsSync(sock)) return resolve(false);
    const probe = connectLocal(sock);
    const done = (v: boolean): void => {
      probe.destroy();
      resolve(v);
    };
    probe.once("connect", () => done(true));
    probe.once("error", () => done(false));
    probe.setTimeout(1000, () => done(false));
  });
}

/**
 * How long the given-memory (.seen) of an unheld server seat lives: it outlives the
 * bridge because the platform replays the seat's queue the next day too (#5831), but
 * not forever, or the directory would keep a file for every name.
 */
const SEEN_FILE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function sweepStale(authDir: string, mine: string): void {
  const dir = standingsDirOf(authDir);
  if (!existsSync(dir)) return;
  // A server seat's memory is `<key hash>.<origin hash>.seen`, a seatless standing's `<key hash>.seen`.
  const mineHash = basename(seenFilePathOf(authDir, mine), ".seen");
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".seen"))) {
    const p = join(dir, f);
    const [keyHash, serverHash] = f.split(".");
    if (keyHash === mineHash || existsSync(join(dir, `${keyHash}.key`))) continue;
    try {
      // Without a server the memory lives with the bridge: no key, no bridge.
      if (serverHash === "seen" || Date.now() - statSync(p).mtimeMs > SEEN_FILE_MAX_AGE_MS)
        unlinkSync(p);
    } catch {}
  }
  // A seat's asks memory (.asks, askdisk.ts) lives with its .seen.
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".asks"))) {
    const keyHash = f.split(".")[0];
    if (keyHash === mineHash || existsSync(join(dir, `${keyHash}.key`))) continue;
    if (existsSync(join(dir, `${basename(f, ".asks")}.seen`))) continue;
    try {
      unlinkSync(join(dir, f));
    } catch {}
  }
  // Hold records past the seat's idle limit are dead at the platform. A record whose key
  // lies beside is held: its age counts from its socket's departure (holdkeep.ts, #6649);
  // a dead key there is removed by the probe below.
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".hold"))) {
    if (existsSync(join(dir, `${basename(f, ".hold")}.key`))) continue;
    try {
      const rec = JSON.parse(readFileSync(join(dir, f), "utf8")) as { at?: number };
      if (typeof rec.at !== "number" || Date.now() - rec.at > HOLD_RECORD_MAX_AGE_MS)
        unlinkSync(join(dir, f));
    } catch {
      try {
        unlinkSync(join(dir, f));
      } catch {}
    }
  }
  // A handover spool nobody replayed lives no longer than a hold record (#6586).
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".spool"))) {
    try {
      if (Date.now() - statSync(join(dir, f)).mtimeMs > HOLD_RECORD_MAX_AGE_MS)
        unlinkSync(join(dir, f));
    } catch {}
  }
  if (process.platform === "win32") return;
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".key"))) {
    const keyFile = join(dir, f);
    let key: string;
    try {
      key = readFileSync(keyFile, "utf8").trim();
    } catch {
      continue;
    }
    if (!key || key === mine) continue;
    const sock = socketPathOf(authDir, key);
    // A server seat's memory stays (another bridge may bring the seat back); a seatless one goes.
    const drop = (): void => {
      for (const p of [keyFile, sock, seenFilePathOf(authDir, key)]) {
        try {
          unlinkSync(p);
        } catch {}
      }
    };
    if (!existsSync(sock)) {
      drop();
      continue;
    }
    const probe = connectLocal(sock);
    probe.once("connect", () => probe.destroy());
    probe.once("error", drop);
    probe.setTimeout(1000, () => probe.destroy());
  }
}
