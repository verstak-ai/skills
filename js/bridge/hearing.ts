// Whether another session listens on a seat (graph @nks/nks-dev, node #6706): a live local
// socket held by another session, or a listening row on the board; an unread board is "unknown".
// One answer for every path: the take=true advice, raw connect, mint and register, and
// the seat beside in the stand tool.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { HEARING, tool } from "../delivery/index.ts";
import { sameDir } from "../shared/canon.ts";
import { words } from "../shared/lang.ts";
import { sessionCwd } from "../shared/scope.ts";
import { standingsDirOf } from "../shared/standings.ts";
import { type Board, type BoardEntry, listens, nameOf, readBoard } from "./board.ts";
import { type AskedHearing, callTool as call, resolveAgainstLed } from "./call.ts";
import { harnessName } from "./client.ts";
import { CFG } from "./config.ts";
import { doors, holdsStanding, isParked, ledKey, localSocketPathOf, wasEvicted } from "./hold.ts";
import {
  type HoldRecord,
  holdRecordsNamed,
  keyOf,
  readHoldRecord,
  sessionOfBridge,
} from "./holdrecord.ts";
import { H } from "./holdstate.ts";
import { normKarta, normName } from "./names.ts";
import { resolveRealms, sameRealm } from "./realms.ts";
import { localSocketAlive } from "./sweep.ts";
import { state } from "./transport.ts";
import { type JsonRpcMessage } from "./types.ts";

/** A non-numeric role is a sentinel: the board prints roles as numbers. */
export const isSentinel = (karta: string): boolean => !/^\d+$/.test(karta);

/**
 * The call's role in board form: "agent" resolves to the role of the seat led in this
 * graph, else to the role this session held the name under.
 */
export function seatKarta(realm: unknown, karta: unknown, name = ""): string {
  const k = normKarta(karta);
  if (k !== "agent") return k;
  const r = String(realm ?? "").trim();
  const here = (x: string): boolean => x === r || sameRealm(r, x);
  const led = [state.standing, ...state.places].find((p) => p && here(p.realm));
  if (led) return String(led.karta);
  const me = sessionOfBridge();
  const rec =
    me && name ? holdRecordsNamed(name).find((x) => x.session === me && here(x.realm)) : null;
  return rec ? normKarta(rec.karta) : k;
}

/** Refusal for an "agent" the bridge could not resolve to a number. */
export const unresolvedAgent = (karta: string, what: string): string | null =>
  karta !== "agent" ? null : words(HEARING).unresolvedAgent(what);

/** The seat's graph in the spelling of led seats or hold records of this name, so a seat keeps one key. */
export async function seatRealm(given: unknown, asked: unknown): Promise<string> {
  const realm = typeof given === "string" ? given.trim() : "";
  const name = normName(asked);
  const known = [
    ...[state.standing, ...state.places].flatMap((p) => (p ? [p.realm] : [])),
    ...(name ? holdRecordsNamed(name).flatMap((r) => (r.realm ? [r.realm] : [])) : []),
  ];
  await resolveAgainstLed(realm); // graphs compare in one @owner/slug form (graph @nks/nks-dev, node #5838)
  if (!realm || !known.length || known.includes(realm)) return realm;
  await resolveRealms([realm, ...known], async () => {
    const r = await call(tool("realm"), { action: "list" });
    return r.isError ? null : r.text;
  });
  return known.find((r) => sameRealm(r, realm)) ?? realm;
}

/** A board row is this seat: same name and role (a sentinel matches any role). */
export const ofSeat = (e: BoardEntry, karta: string, name: string): boolean =>
  (isSentinel(karta) || e.karta === karta) && nameOf(e.address) === name;

export function boardHearing(bd: Board | null, karta: string, name: string): AskedHearing {
  if (!bd?.recognized) return "unknown";
  const at = bd.entries.filter((e) => ofSeat(e, karta, name));
  if (at.some(listens)) return "other";
  const unread = bd.declared != null && bd.declared !== bd.entries.length;
  // A board not parsed whole (header count off, seat not among parsed rows) is "unknown", not
  // "free": neither the take=true advice nor a pass without take.
  return unread && (at.length === 0 || isSentinel(karta)) ? "unknown" : "free";
}

/** Seat keys of this graph and name under any role in the grant directory. */
function keysNamed(realm: string, name: string): string[] {
  const dir = standingsDirOf(CFG.authDir);
  try {
    return readdirSync(dir)
      .filter((f) => f.endsWith(".key"))
      .map((f) => readFileSync(join(dir, f), "utf8").trim())
      .filter((k) => {
        const m = /^.*?--(.+)--/.exec(k);
        return !!m && keyOf(realm, m[1], name) === k;
      });
  } catch {
    return [];
  }
}

/**
 * An unsigned record of this harness from this directory — its holder named no session
 * (a return from disk before the plugin's word, a record of an earlier build): for a named
 * session of the harness the seat is its own, not another live session's (graph
 * @nks/nks-dev, node #6702). A live bridge signs the record once its session is named
 * (resume.ts), and the plugin names it before the first tool call (opencode/keep.ts).
 */
export const unsignedHere = (rec: HoldRecord, cwd: string): boolean =>
  !rec.session && !rec.left && rec.client === harnessName() && sameDir(rec.cwd, cwd);

/**
 * Who holds the seat's live local socket: this bridge, a former bridge of this session (its
 * record, or an unsigned record of this harness and `cwd` for a named session), another, or
 * none. A harness without session names counts only this bridge's socket as its own.
 */
export async function localHolder(
  key: string,
  cwd?: string,
): Promise<"self" | "session" | "other" | null> {
  if (!(await localSocketAlive(localSocketPathOf(key)))) return null;
  if (doors().some((d) => d.key === key && d.ownsSocket)) return "self";
  const me = sessionOfBridge();
  const rec = me ? readHoldRecord(key, true) : null;
  if (!rec) return "other";
  return rec.session === me || (cwd != null && unsignedHere(rec, cwd)) ? "session" : "other";
}

/** The seat's live local socket is held by another session's bridge, this session's former one, or none. */
async function heldLocally(
  realm: string,
  karta: string,
  name: string,
  cwd: string,
): Promise<"other" | "session" | null> {
  let own = false;
  for (const key of isSentinel(karta) ? keysNamed(realm, name) : [keyOf(realm, karta, name)]) {
    const h = await localHolder(key, cwd);
    if (h === "other") return "other";
    own ||= h === "session";
  }
  return own ? "session" : null;
}

/**
 * Who listens on the seat: another session, nobody, or the bridge does not know. Judged as
 * the stand tool does (separate.ts): the directory named by the call, else the standing's or
 * the session's; a former bridge of this session is its own though the board reads it
 * listening (graph @nks/nks-dev, node #6702).
 */
export async function askedHearing(
  realm: string,
  karta: string,
  name: string,
  cwd: string = H.standCwd ?? sessionCwd(),
): Promise<AskedHearing> {
  const local = await heldLocally(realm, karta, name, cwd);
  if (local === "other") return "other";
  if (local === "session") return "free";
  const b = await call(tool("channel"), { action: "list", realm }).catch(() => null);
  return boardHearing(b && !b.isError ? readBoard(b) : null, karta, name);
}

/**
 * Refuses a raw connect, mint or register of a seat this bridge does not lead while
 * another session listens on it (or the bridge does not know).
 */
export async function rawSeatRefusal(msg: JsonRpcMessage): Promise<string | null> {
  if (msg?.method !== "tools/call" || msg.params?.name !== tool("channel")) return null;
  const a = msg.params.arguments ?? {};
  const action = String(a.action);
  if (!["connect", "mint", "register"].includes(action)) return null;
  const realm = typeof a.realm === "string" ? a.realm.trim() : "";
  const name = normName(a.name);
  // An unnamed role is as unknown as "agent".
  const karta = seatKarta(realm, normKarta(a.karta) || "agent", name);
  if (!realm) return null;
  const agent = unresolvedAgent(karta, action);
  if (agent) return agent;
  if (ledHere(realm, karta, name)) return null;
  const hearing = await askedHearing(realm, karta, name);
  if (hearing === "free") return null;
  const seat = keyOf(realm, karta, name);
  const w = words(HEARING);
  const who = hearing === "other" ? w.otherListens(seat) : w.unknownListens(seat);
  return w.rawSeatRefusal(who, action);
}

/**
 * This bridge itself listens on the seat; an evicted or parked seat is not its own: a parked
 * seat may have been taken by another session meanwhile.
 */
export function ledHere(realm: string, karta: string, name: string): boolean {
  if (holdsStanding(realm, karta, name)) return true;
  return (
    ledKey() === keyOf(realm, karta, name) &&
    !H.unheard && // back on the same address without hello — another may have turned it
    !wasEvicted(realm, karta, name) &&
    !isParked(realm, karta, name)
  );
}
