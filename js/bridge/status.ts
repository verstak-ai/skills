// A standing's busy line is the socket holder's word, and the bridge holds the socket
// (graph @nks/nks-dev: #4284 rejected). The main move is the stand tool with status on
// a seat the bridge already holds (#6509); the channel tool's action="status" is the
// former move, kept for compatibility. Both run here and never reach the server: POST
// to the status address from the connect answer; the surface's answer is passed whole.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { isAbsolute, join } from "node:path";

import { STATUS, tool } from "../delivery/index.ts";
import { takingArgs } from "../shared/busyargs.ts";
import { words } from "../shared/lang.ts";
import { scoped } from "../shared/scope.ts";
import { socketPathOf, standingsDirOf } from "../shared/standings.ts";
import { nameOf } from "./board.ts";
import { resolveAgainstLed } from "./call.ts";
import { CFG } from "./config.ts";
import {
  hasStatusAddressFor,
  heldPlaces,
  holdsStanding,
  isParked,
  noteStandCwd,
  rememberStatus,
  wasEvicted,
} from "./hold.ts";
import { type HoldRecord, keyOf } from "./holdrecord.ts";
import { unheardListenBlock } from "./listen.ts";
import { normKarta, normName } from "./names.ts";
import { extraIn } from "./places.ts";
import { sameRealm } from "./realms.ts";
import { statusAddress } from "./statusaddr.ts";
import { publishStatusTo, type StatusOutcome, type StatusTrim, trimNudge } from "./statuspost.ts";
import { localSocketAlive } from "./sweep.ts";
import { type Standing, state } from "./transport.ts";
import { type JsonRpcMessage } from "./types.ts";

export { publishStatusTo, type StatusOutcome };

const isDirectory = (p: string): boolean => {
  try {
    return isAbsolute(p) && statSync(p).isDirectory();
  } catch {
    return false;
  }
};

const replyTo =
  (msg: JsonRpcMessage) =>
  (body: string, isError = false): JsonRpcMessage => ({
    jsonrpc: "2.0",
    id: msg.id,
    result: { ...(isError ? { isError: true } : {}), content: [{ type: "text", text: body }] },
  });

/** Publish the busy line of this graph's seat and word it — shared by both moves. */
async function statusWord(text: string, realm: string): Promise<[string, boolean]> {
  const st = await publishStatus(text, realm);
  if (!st.ok && !statusAddress()) return [await notHeldHere(realm), true];
  if (st.code === 404) return [`${st.body} ${TURNED_GUIDANCE()}`, true];
  if (st.ok) return [busyLine(text, realm), false];
  return [st.body, true];
}

/**
 * The word of an accepted busy line — one for the separate move and for taking a seat
 * (#6634): it names the seat. A line the server accepted trimmed (#6729) is named as
 * accepted, not as sent, and carries the nudge (#6730).
 */
export function busyLine(text: string, realm: string): string {
  const a = S.accepted.get(statusAddress(realm)?.key ?? "");
  const line = a?.sent === text ? a.doing : text;
  const nudge = a?.sent === text && a.trimmed ? `; ${trimNudge(a.trimmed)}` : "";
  return words(STATUS).busyLine(placeLabel(realm), line, nudge);
}

/** The seat as the board calls it; an address hello did not name is marked as such. */
function placeLabel(realm: string): string {
  const a = statusAddress(realm);
  if (a?.place) return a.derived ? words(STATUS).placeDerived(a.place) : a.place;
  return words(STATUS).placeUnnamed(a?.name ?? "");
}

/** action="status" — busyness of THIS standing; null for any other call. */
export function localStatus(msg: JsonRpcMessage): Promise<JsonRpcMessage> | null {
  if (msg?.method !== "tools/call" || msg?.params?.name !== tool("channel")) return null;
  const a = msg.params?.arguments;
  if (a?.action !== "status") return null;
  const text = typeof a.text === "string" ? a.text : "";
  const reply = replyTo(msg);
  // The seat of the call's graph (#5838); without a graph — the main one.
  const realm = typeof a.realm === "string" ? a.realm : "";
  return (async () => {
    await resolveAgainstLed(realm); // the call's graph, in the same form as the seat's graph
    return reply(...(await statusWord(text, realm)));
  })();
}

// Taking args — shared/busyargs.ts; model sends the call down the full path (register, hook, hello).
// satellite_of is not a taking arg: it is checked against the held satellite seat below.

/**
 * Why a status call did not become a busy line alone — for the refusal when karta is
 * missing and the full path has nothing to take a seat with (standwords.ts). "elsewhere":
 * the bridge has neither the socket nor the status address — taken away or released
 * (dead token, revoke); the bridge cannot tell these two apart from here.
 */
export type StatusMiss =
  | { why: "none" | "satellite" | "parked" | "elsewhere" }
  | { why: "args"; args: string[] }
  | { why: "name"; asked: string; held: string }
  | { why: "cwd"; cwd: string };

/** The busy-line-only reply — or why there is none (null — no status, or karta of another role). */
export type StatusOnly = { reply: JsonRpcMessage } | { miss: StatusMiss | null; of?: string };

/**
 * The stand tool with status on the seat this bridge leads (#6509): only the busy line —
 * no board, connect, register, hook or knock; an empty line clears. Role and name are the
 * seat's own or omitted. Busyness follows the
 * standing, not the live socket (#5033, #5035): after eviction it is published while the
 * bridge has the seat's status address. Otherwise — miss, and the call takes the full
 * path of stand.ts.
 */
export async function standStatusOnly(msg: JsonRpcMessage): Promise<StatusOnly> {
  const a = msg.params?.arguments ?? {};
  if (typeof a.status !== "string") return { miss: null };
  const unset = (v: unknown): boolean => v == null || v === false || v === "";
  const extra = takingArgs(a);
  const realm = typeof a.realm === "string" ? a.realm.trim() : "";
  if (!realm) return { miss: null };
  await resolveAgainstLed(realm); // the call's graph, in the same form as the seat's graph
  const held = ledIn(realm);
  if (!held) return { miss: { why: "none" } };
  if (extra.length) return { miss: { why: "args", args: extra } };
  if (!unset(a.karta) && normKarta(a.karta) !== String(held.karta)) return { miss: null };
  const asked = normName(a.name);
  if (asked && asked !== (held.name ?? ""))
    return { miss: { why: "name", asked, held: held.name ?? "" } };
  // A satellite is <caller>.sub-N; the bridge shortens a long base, hence a prefix match.
  const of = normName(a.satellite_of);
  const base = /^(.+)\.sub-[1-9]\d*$/.exec(held.name ?? "")?.[1];
  if (of && !(base && nameOf(of).startsWith(base))) return { miss: { why: "satellite" }, of };
  const [r, k, n] = [held.realm, held.karta, held.name ?? ""];
  if (isParked(r, k, n)) return { miss: { why: "parked" } };
  if (!hasStatusAddressFor(r, k, n)) return { miss: { why: "elsewhere" } };
  // The directory goes into the hold record for a later return, as on the full path (resume.ts).
  const cwd = typeof a.cwd === "string" ? a.cwd.trim() : "";
  if (cwd) {
    if (cwd !== process.cwd() && !isDirectory(cwd)) return { miss: { why: "cwd", cwd } };
    noteStandCwd(cwd);
  }
  const [said, isError] = await statusWord(a.status.trim(), realm);
  const heard = holdsStanding(r, k, n);
  // No socket now — the answer says why: eviction (close 4000) puts the hearing elsewhere;
  // otherwise it is our own reopening and the hearing comes back by itself.
  const why = wasEvicted(r, k, n) ? words(STATUS).evictedWhy() : words(STATUS).reopeningWhy();
  const body = isError || heard ? said : `${said}; ${why}`;
  // The bridge holds the socket but no watchdog is attached — hence the listen command here;
  // after eviction there is no hearing here, and a watchdog command would be untrue.
  const listen = isError || !heard ? null : unheardListenBlock(realm);
  return { reply: replyTo(msg)(listen ? `${body}\n${listen}` : body, isError) };
}

/** The seat the bridge leads in this graph (main or beside); whether it holds the socket is not judged. */
function ledIn(realm: string): Standing | undefined {
  const prim = state.standing;
  return prim && (prim.realm === realm || sameRealm(prim.realm, realm))
    ? prim
    : extraIn(realm)?.standing;
}

const S = scoped(() => ({
  lastPublished: "",
  /** The last accepted line per seat (address key): sent, landed (the answer's doing) and trim. */
  accepted: new Map<string, { sent: string; doing: string; trimmed?: StatusTrim }>(),
}));
/** The last busy line the board accepted from this bridge; empty — cleared. */
export const publishedStatus = (): string => S.lastPublished;

/**
 * POST the busy line to the status address of the channel the bridge holds. The line
 * belongs to a SEAT: with standing_id it lands on one seat of the channel, without it on
 * all live ones (#5838). realm — this graph's seat; `everyPlace` — all seats at once.
 */
export async function publishStatus(
  text: string,
  realm?: string,
  everyPlace = false,
): Promise<StatusOutcome> {
  const addr = statusAddress(realm);
  if (!addr) {
    return { ok: false, body: words(STATUS).notHeld() };
  }
  // Several seats on the channel and this one's id unknown — the line would land on all.
  // With one seat a line without id lands on it, as before.
  if (!everyPlace && !addr.standingId && heldPlaces().length > 1)
    return { ok: false, body: words(STATUS).noSeatId(addr.key) };
  const st = await publishStatusTo(addr.url, text, 5000, everyPlace ? null : addr.standingId);
  if (st.ok) {
    // Keep the line as it landed: a server-trimmed one comes back trimmed after a restart.
    const kept = st.doing ?? text;
    S.accepted.set(addr.key, { sent: text, doing: kept, trimmed: st.trimmed });
    if (addr.key === statusAddress()?.key) S.lastPublished = kept;
    rememberStatus(kept, realm);
  }
  return st;
}

/** The whole path of moving the hearing (graph @nks/nks-dev, node #5395). */
export const TAKE_PATH = (): string => words(STATUS).takePath();

/**
 * Refusal 404: someone's connect turned the address; whose is unknown and the hold record
 * is shared, so no holder list here.
 */
export const TURNED_GUIDANCE = (): string => words(STATUS).turnedGuidance();

const slugOf = (realm: string): string => realm.replace(/^@[^/]+\//, "");

/**
 * Seats of graph realm held by live bridges of this machine. Liveness is by an
 * answering local socket, not by the record's age: a long watch without a busyness
 * change is alive even when its record is older than the term — and reading never erases it.
 */
async function heldElsewhere(realm: string): Promise<HoldRecord[]> {
  const dir = standingsDirOf(CFG.authDir);
  if (!existsSync(dir)) return [];
  const anyRealm = !realm || /^r\d+$/.test(realm); // a short id cannot be matched with a record
  const out: HoldRecord[] = [];
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".hold"))) {
    try {
      const rec = JSON.parse(readFileSync(join(dir, f), "utf8")) as HoldRecord;
      if (!rec?.realm || rec.karta == null) continue;
      if (!anyRealm && slugOf(String(rec.realm)) !== slugOf(realm)) continue;
      const key = keyOf(rec.realm, rec.karta, rec.name ?? "");
      if (await localSocketAlive(socketPathOf(CFG.authDir, key))) out.push({ ...rec, key });
    } catch {
      /* a broken file is no holder */
    }
  }
  return out;
}

/** Refusal of a bridge without a standing: names live bridges of this machine on this graph, and the whole move path. */
export async function notHeldHere(realm: string): Promise<string> {
  const others = await heldElsewhere(realm);
  if (!others.length) return words(STATUS).notHeldNone();
  const list = others
    .map((r) => {
      const where = [
        r.cwd && words(STATUS).whereCwd(r.cwd),
        r.client && words(STATUS).whereClient(r.client),
      ].filter(Boolean);
      return where.length ? `${r.key} (${where.join(", ")})` : r.key;
    })
    .join("; ");
  return words(STATUS).notHeldList(list);
}
