// Where the bridge lies and how its home copy keeps in step with the delivery.
import {
  accessSync,
  chmodSync,
  constants,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { BRIDGE_FILE, BRIDGE_SKILL, envName, PI } from "../delivery/index.ts";
import { homeBridgePath } from "../shared/home.ts";
import { words } from "../shared/lang.ts";
import { devBuildIn, releaseBuildIn, versionIn } from "../shared/version.ts";

export { homeBridgePath };

const BRIDGE_PATH_ENV = envName("BRIDGE_PATH");

export type Notify = (text: string, level?: "info" | "warning" | "error") => void;

/** Strict X.Y.Z comparison: 1 if a is newer than b, -1 if older, 0 if equal or unreadable. */
export function newer(a: string, b: string): number {
  const pa = a.split(".").map(Number),
    pb = b.split(".").map(Number);
  if (pa.length !== 3 || pb.length !== 3 || [...pa, ...pb].some((n) => !Number.isInteger(n)))
    return 0;
  for (let i = 0; i < 3; i++) if (pa[i] !== pb[i]) return pa[i] > pb[i] ? 1 : -1;
  return 0;
}

/**
 * The bridge that came in this same package. Derived ONCE and serving both halves — the one
 * mirroring the home copy and the one raising the bridge — so they never mirror one file and run
 * another. Throws when the loader gave no own path — call under try.
 */
export function packagedBridgePath(): string {
  return resolve(
    dirname(fileURLToPath(import.meta.url)),
    "..",
    "skills",
    BRIDGE_SKILL,
    "scripts",
    BRIDGE_FILE,
  );
}

/**
 * Keeps the home copy a MIRROR of the delivery's bridge: the extension prefers the home copy
 * (the grant lies beside it), and a delivery update used to leave the old bridge running. The
 * grant survives the swap (its state is separate files keyed by the server address). Compared by
 * bytes, not version: between releases a git install moves while the version constant stands;
 * at an equal version only an explicit dev build at home is replaced (#147 [145]).
 *
 * Fences: a delivery bridge that is not a release build is never written home (#6650); a home
 * copy strictly newer is left alone; a path named by the variable is left alone; and NO VOICE —
 * NO SWAP: in a session that cannot speak the copy does not change.
 */
export function refreshHomeBridge(notify: Notify, canSpeak: boolean): void {
  if (process.env[BRIDGE_PATH_ENV]?.trim()) return;
  if (!canSpeak) return; // nothing to speak with — nothing to change: no silent swap
  const W = words(PI);
  let packagedPath: string;
  try {
    packagedPath = packagedBridgePath();
  } catch {
    return; // the loader gave no own path — nothing to compare with
  }
  const homePath = homeBridgePath();
  let packaged: Buffer;
  try {
    packaged = readFileSync(packagedPath);
  } catch {
    return; // the delivery carries no bridge — that is the bridge skill's business
  }
  const vPackaged = versionIn(packaged.toString("utf8"));
  if (!vPackaged) {
    // The repair itself is dead: the file is there, its version unreadable.
    notify(W.versionUnreadable(), "warning");
    return;
  }
  // Only a release build writes home (#6650): a working copy's bridge would reach every harness of the machine.
  if (!releaseBuildIn(packaged.toString("utf8"))) return;

  let home: Buffer;
  try {
    home = readFileSync(homePath);
  } catch {
    return; // no home copy yet — the bridge skill lays it, not us
  }
  if (home.equals(packaged)) return; // byte for byte — nothing to say

  const vHome = versionIn(home.toString("utf8"));
  if (vHome && newer(vHome, vPackaged) > 0) {
    notify(W.homeNewer(vHome, vPackaged), "warning");
    return;
  }
  // An equal version: home is replaced only by an EXPLICIT dev build (#147 [145]).
  if (vHome === vPackaged && !devBuildIn(home.toString("utf8"))) return;

  const was = vHome ?? W.noVersion();
  const tmp = `${homePath}.tmp-${process.pid}`; // a pid in the name: two starts side by side do not write one file
  try {
    writeFileSync(tmp, packaged);
    chmodSync(tmp, 0o755);
    renameSync(tmp, homePath);
    notify(vHome === vPackaged ? W.replacedSame(vPackaged) : W.updated(was, vPackaged), "info");
  } catch (e) {
    try {
      unlinkSync(tmp);
    } catch {
      /* nothing to clean */
    }
    notify(W.replaceFailed(was, vPackaged, (e as Error).message), "warning");
  }
}

/**
 * The bridge's path is derived, not hard-coded. ORDER MATTERS: the delivery's bridge first, the
 * home copy only when the delivery carries none — the extension and the bridge share one
 * notification protocol and one version, while the home copy lags whenever a headless session may
 * not update it.
 */
export function findBridge(): { path: string; tried: string[] } | { path: null; tried: string[] } {
  const tried: string[] = [];
  const push = (p: string | null | undefined) => {
    if (!p) return;
    tried.push(p);
  };
  const named = process.env[BRIDGE_PATH_ENV]?.trim();
  push(named ? resolve(named) : null);
  try {
    // A git install of pi puts the extension next to the skills of the same repository.
    push(packagedBridgePath());
  } catch {
    /* the loader gave no own path — the variable and the home copy remain */
  }
  push(homeBridgePath());
  for (const candidate of tried) {
    try {
      accessSync(candidate, constants.R_OK);
      return { path: candidate, tried };
    } catch {
      /* next candidate */
    }
  }
  return { path: null, tried };
}
