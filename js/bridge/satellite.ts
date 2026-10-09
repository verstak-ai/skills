// Satellite bridge — a subagent's own seat (graph @nks/nks-dev, nodes #6002, #6001).
// Started with --satellite, it takes only `<caller seat>.sub-<N>` beside the caller,
// role from the call's karta, a short idle window and no hold
// record; when the run ends (stdin closed) it leaves the seat (session.ts).
// Claude Code keeps one connection per frontmatter entry name: parallel runs with the same
// entry share one process and one seat (the `led` path below).
// N is picked under a machine-wide claim: a name file with the holder's pid, chosen
// under a short lock of the claims directory, so bridges standing at once differ
// (each reads the board before the other's connect, so "first free" alone would collide).
import { randomBytes } from "node:crypto";
import {
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

import { envName, SATELLITE, type SatelliteWords, tool } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import { isSatelliteOf, satelliteName, SUB_RE } from "../shared/satname.ts";
import { scoped, sessionPid } from "../shared/scope.ts";
import { type BoardEntry, nameOf, readBoard } from "./board.ts";
import { type Answer, callTool as call, short } from "./call.ts";
import { CFG } from "./config.ts";
import { NAME_MAX, nameFault, normKarta } from "./names.ts";
import { noteSatelliteOf } from "./placefields.ts";
import { otherRealm } from "./realms.ts";
import { log } from "./streams.ts";
import { state } from "./transport.ts";

/** Satellite channel idle window, s; the variable is a probe seam. */
export const SATELLITE_TTL_S = Number(process.env[envName("BRIDGE_SATELLITE_TTL")]) || 300;

const sw = (): SatelliteWords => words(SATELLITE);

// The satellite name rule is shared with the OpenCode plugin (shared/satname.ts); a repeated
// stand of the same run knows its name by isSatelliteOf.
export { isSatelliteOf, satelliteName };

export type SatellitePick =
  | {
      ok: true;
      name: string;
      caller: string;
      callerKarta: string;
      callerId: string | null;
      notes: string[];
    }
  | { ok: false; refusal: string };

const claimDir = (): string => join(CFG.authDir, "satellites");
// By name, not graph: the graph is spelled several ways in a call (@owner/slug, slug, rN).
const claimFile = (name: string): string =>
  join(claimDir(), `${name.replace(/[^A-Za-z0-9._-]+/g, "_")}.claim`);
// Written with the harness bridge's pid (sessionPid): in the daemon it is the thin bridge's,
// so a claim lives as long as its bridge and two sessions of one daemon never share a name.
/** This session's claims — dropped on leaving the seat and at session end. */
const claims = scoped(() => new Set<string>());
/** All claims of the process — file → pid; process exit drops them all. */
const allClaims = new Map<string, number>();
let releaseOnExit = false;
const LOCK_STALE_MS = 10_000;
const LOCK_WAIT_MS = 3_000;

function alive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return (e as NodeJS.ErrnoException).code === "EPERM";
  }
}

/**
 * Claim a satellite name on this machine, under the directory lock only.
 * false — a live other bridge's claim holds it.
 */
function claimName(name: string): boolean {
  const file = claimFile(name);
  let pid = 0;
  try {
    pid = Number(readFileSync(file, "utf8").trim());
  } catch {
    // no claim
  }
  const me = sessionPid();
  if (pid && pid !== me && alive(pid)) return false;
  writeFileSync(file, `${me}\n`, { mode: 0o600 });
  if (!releaseOnExit) process.once("exit", releaseAllClaims);
  releaseOnExit = true;
  claims.add(file);
  allClaims.set(file, me);
  return true;
}

const dropClaim = (f: string, pid: number): void => {
  try {
    if (Number(readFileSync(f, "utf8").trim()) === pid) unlinkSync(f);
  } catch {
    // already dropped
  }
  allClaims.delete(f);
};

/** Drop this bridge's claims: the seat is released, the name is free for the next run. */
export function releaseSatelliteClaims(): void {
  const me = sessionPid();
  for (const f of claims) dropClaim(f, me);
  claims.clear();
}

/** Process exit: the claims of all its sessions. */
function releaseAllClaims(): void {
  for (const [f, pid] of [...allClaims]) dropClaim(f, pid);
}

const LOCK_OWNER = "owner";

/** The lock holder's token from the file inside it; null — not written yet or no lock. */
function lockOwner(lock: string): string | null {
  try {
    return readFileSync(join(lock, LOCK_OWNER), "utf8").trim();
  } catch {
    return null;
  }
}

/** Abandoned lock: its holder is dead or it is older than LOCK_STALE_MS. */
function abandoned(lock: string, owner: string | null): boolean {
  const pid = owner ? Number(owner.split(" ")[0]) : 0;
  if (pid && !alive(pid)) return true;
  try {
    return Date.now() - statSync(lock).mtimeMs > LOCK_STALE_MS;
  } catch {
    return false; // dropped by another
  }
}

/**
 * Take away the lock with token `owner` by an atomic rename to a unique name; only
 * the taker removes it. null — removed, or another took it. A lock of another owner
 * taken by mistake is left under its new name (renaming back could land on a fresh
 * `.lock`), and the answer is the reason to pick by the board alone.
 */
function takeLock(lock: string, owner: string | null): string | null {
  const away = `${lock}.${process.pid}-${randomBytes(6).toString("hex")}`;
  try {
    renameSync(lock, away);
  } catch {
    return null; // another took it
  }
  if (lockOwner(away) !== owner)
    return `the claims lock of another bridge was taken by mistake and is left as ${away}`;
  rmSync(away, { recursive: true, force: true });
  return null;
}

/**
 * Pick under the claims directory lock (an atomic mkdir with an owner token inside):
 * bridges of this machine pick N in turn; an abandoned lock is taken by `takeLock`, only
 * our own is removed at the end. When the pick is not guaranteed (no directory, claim not
 * written, wait over LOCK_WAIT_MS, lock lost) the second value is the reason — logged and noted.
 */
async function underClaimLock<T>(
  fn: (claim: (name: string) => boolean) => T,
): Promise<[T, string | null]> {
  const lock = join(claimDir(), ".lock");
  const token = `${process.pid} ${randomBytes(8).toString("hex")}`;
  let fault: string | null = null;
  try {
    mkdirSync(claimDir(), { recursive: true, mode: 0o700 });
  } catch (e) {
    fault = (e as Error).message;
  }
  for (const end = Date.now() + LOCK_WAIT_MS; !fault;) {
    try {
      mkdirSync(lock);
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "EEXIST") fault = (e as Error).message;
      else if (Date.now() > end) fault = `the claims lock ${lock} is held too long`;
      else {
        const owner = lockOwner(lock);
        if (abandoned(lock, owner)) fault = takeLock(lock, owner);
        if (!fault) await new Promise((r) => setTimeout(r, 20));
      }
      continue;
    }
    try {
      writeFileSync(join(lock, LOCK_OWNER), `${token}\n`, { mode: 0o600 });
    } catch (e) {
      fault = (e as Error).message;
      rmSync(lock, { recursive: true, force: true });
    }
    break;
  }
  if (fault) {
    log(`satellite claims unavailable — the board alone picks the name: ${fault}`);
    return [fn(() => true), fault];
  }
  let unwritten: string | null = null;
  let value: T;
  try {
    value = fn((name) => {
      try {
        return claimName(name);
      } catch (e) {
        unwritten = `claim not written: ${(e as Error).message}`;
        log(`satellite ${unwritten}`);
        return true;
      }
    });
  } catch (e) {
    if (lockOwner(lock) === token) takeLock(lock, token);
    throw e;
  }
  // Lock taken away mid-pick: another bridge may have picked at the same time.
  const lost =
    lockOwner(lock) === token
      ? takeLock(lock, token)
      : `the claims lock ${lock} is no longer ours — left as it is; another bridge may have picked at the same time`;
  if (lost) log(`satellite ${lost}`);
  return [value, unwritten ?? lost];
}

/**
 * The satellite seat by the board: the caller's seat (any role — the satellite's role is
 * the call's karta) must stand on it; the name is
 * the first `.sub-N` absent from the board and not claimed by another live bridge.
 * `led` — the seat this bridge already leads: a satellite of the same base returns to it.
 */
export function pickSatellite(
  entries: BoardEntry[],
  of: string,
  karta: string,
  led: string | null,
  claim: (name: string) => boolean = () => true,
): SatellitePick {
  const address = of.startsWith("@") && of.includes(":") ? of : null;
  const base = address ? nameOf(address) : of.replace(/^@/, "");
  const fault = base ? nameFault(base) : sw().empty();
  if (fault) return { ok: false, refusal: sw().notSeatName(of, fault) };
  const callers = entries.filter((e) =>
    address ? e.address === address : nameOf(e.address) === base,
  );
  if (!callers.length) return { ok: false, refusal: sw().noCaller(of) };
  // One name on several seats (different roles): the own role's seat if it is the only one.
  const same = callers.length > 1 ? callers.filter((e) => e.karta === normKarta(karta)) : callers;
  if (same.length !== 1) return { ok: false, refusal: sw().ambiguous(callers.length, base) };
  const caller = same[0].address;
  const callerKarta = same[0].karta;
  const callerId = same[0].id;
  const notes: string[] = [];
  if (led && isSatelliteOf(base, led)) {
    // A repeat of the run or a parallel run sharing the bridge entry: Claude Code
    // shares the server connection by entry name, and the call names no run — so name both.
    const word = sw().alreadyHolds(led);
    log(word);
    notes.push(word);
    return { ok: true, name: led, caller, callerKarta, callerId, notes };
  }
  const taken = new Set(entries.map((e) => nameOf(e.address)));
  for (let n = 1; n <= 99; n++) {
    const name = satelliteName(base, n);
    if (taken.has(name) || !claim(name)) continue;
    if (!name.startsWith(`${base}.`)) notes.push(sw().nameCut(base, n, NAME_MAX, name));
    return { ok: true, name, caller, callerKarta, callerId, notes };
  }
  return { ok: false, refusal: sw().allTaken(caller) };
}

/**
 * The stand step before the name is derived: a satellite bridge takes only a
 * satellite seat, a session bridge never. null — the call is not about a satellite.
 */
export async function satelliteGate(
  a: Record<string, unknown>,
  realm: string,
  karta: string,
  asked: string,
): Promise<SatellitePick | null> {
  const of = typeof a.satellite_of === "string" ? a.satellite_of.trim() : "";
  const refuse = (refusal: string): SatellitePick => ({ ok: false, refusal });
  if (CFG.satellite && !of) return refuse(sw().needSatelliteOf());
  if (!of) return null;
  if (!CFG.satellite) return refuse(sw().notSatellite());
  if (asked || a.take === true || (typeof a.room === "string" && a.room.trim()))
    return refuse(sw().derivesName());
  const b = await call(tool("channel"), { action: "list", realm });
  if (b.isError) return refuse(sw().boardUnread(short(b.text)));
  const s = state.standing;
  const led = s && !otherRealm(s.realm, realm) ? (s.name ?? null) : null;
  const { entries } = readBoard(b);
  const [pick, unsure] = await underClaimLock((claim) =>
    pickSatellite(entries, of, karta, led, claim),
  );
  if (!pick.ok) return pick;
  if (unsure && pick.name !== led) pick.notes.push(sw().claimsUnsure(unsure, pick.name));
  // Only a one-role board (list with karta) prints the seat id, as the last line under the seat.
  if (!pick.callerId) {
    const k = await call(tool("channel"), { action: "list", realm, karta: pick.callerKarta });
    if (!k.isError)
      pick.callerId = readBoard(k).entries.find((e) => e.address === pick.caller)?.id ?? null;
  }
  noteSatelliteOf(pick.caller, pick.callerId);
  pick.notes.push(sw().seat(pick.caller, normKarta(karta), SATELLITE_TTL_S));
  if (!pick.callerId) pick.notes.push(sw().noCallerId(pick.caller));
  return pick;
}

/**
 * Whether connect refused the idle window: the api refusal rule `ttl_out_of_range`,
 * else the answer names ttl or carries a 4xx code; the wording is not guessed.
 */
export const ttlRefused = (a: Pick<Answer, "text" | "refusal">): boolean =>
  a.refusal?.rule
    ? a.refusal.rule === "ttl_out_of_range"
    : /ttl/i.test(a.text) || /(^|\D)4\d\d(\D|$)/.test(a.text);

const PLACE_ACTIONS = new Set(["connect", "mint", "register", "revoke"]);

/**
 * The satellite bridge's fence on the raw channel tool: connect, mint, register and
 * revoke only of its own `.sub-N` seat, after stand. null — let it through.
 */
export function satelliteChannelRefusal(args: Record<string, unknown>): string | null {
  if (!CFG.satellite) return null;
  const action = String(args.action ?? "");
  if (!PLACE_ACTIONS.has(action)) return null;
  const s = state.standing;
  const own = s?.name ?? "";
  if (!s || !SUB_RE.test(own)) return sw().bypass(action);
  const sameRealm = !otherRealm(args.realm, s.realm);
  const karta = normKarta(args.karta ?? s.karta);
  const target =
    action === "revoke"
      ? args.channel != null
        ? null
        : String(args.standing ?? "")
      : String(args.name ?? "").trim();
  const mine =
    target != null &&
    (target === own || target.endsWith(`:${own}`) || (action === "revoke" && target === "mine"));
  if (sameRealm && karta === normKarta(s.karta) && mine) return null;
  return sw().onlyOwn(action, own, normKarta(s.karta), s.realm);
}

/** The hearing word instead of a watchdog command: a satellite holds no watchdog. */
export const satelliteListenWord = (): string => sw().listen(SATELLITE_TTL_S);
