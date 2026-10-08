// Seat return from disk (graph @nks/nks-dev, nodes #5061, #5140, #6017): a restarted
// bridge takes its seat by the hold record instead of rotating it with connect.
// Doors: by name (stand.ts calls resumeFromDisk); by key or session directory (the
// plugin's `resume` request, which may name the harness session); the plugin's `check` request is the hearing watchdog.
// A bridge leading another seat never takes a foreign record: holdStanding of another
// key would kill the led one.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { envName, LOGGERS, method, tool } from "../delivery/index.ts";
import { sameDir as oneDir } from "../shared/canon.ts";
import { envOf, scoped } from "../shared/scope.ts";
import { standingsDirOf } from "../shared/standings.ts";
import { listens, nameOf, readBoard, undelivered } from "./board.ts";
import { callTool, short } from "./call.ts";
import { harnessName } from "./client.ts";
import { CFG } from "./config.ts";
import {
  awaitHello,
  holdsKey,
  holdStanding,
  isParked,
  ledKey,
  localSocketPathOf,
  noteResuming,
  noteStandCwd,
  parkStanding,
  releaseStanding,
  rememberStatus,
  resumeStanding,
} from "./hold.ts";
import { signHeldRecord } from "./holdkeep.ts";
import {
  type HoldRecord,
  keyOf,
  noteHarnessSession,
  noteSeatBase,
  readHoldRecord,
  restoreHoldRecord,
  sessionOfBridge,
} from "./holdrecord.ts";
import { holdWords } from "./holdwords.ts";
import { returnToStanding } from "./leave.ts";
import { placeFields } from "./placefields.ts";
import { resumeWords } from "./resumewords.ts";
import { publishStatus } from "./status.ts";
import { standingLog } from "./store.ts";
import { emit, log } from "./streams.ts";
import { afterResume } from "./suspend.ts";
import { localSocketAlive } from "./sweep.ts";
import { state } from "./transport.ts";
import { type JsonRpcMessage } from "./types.ts";

/** A return found no record of the named seat (expired): the next stand says so (#6649). */
const RJ = scoped(() => ({ lapsed: false }));
export function takeLapsed(): boolean {
  const was = RJ.lapsed;
  RJ.lapsed = false;
  return was;
}

/**
 * Return from disk the seat a former bridge of this directory held (#5061), only
 * when its local socket is dead and no other seat is led; hearing is proven by a
 * fresh hello. The busy line returns only to the session that said it (#6017).
 * null — nothing to return.
 */
export async function resumeFromDisk(
  realm: string,
  karta: string | number,
  name: string,
): Promise<{ word: string; pending: number } | null> {
  const key = keyOf(realm, karta, name);
  const rec = readHoldRecord(key);
  if (!rec) return null;
  if (holdsKey(key)) return null;
  const led = ledKey();
  if (led && led !== key) return null;
  if (await localSocketAlive(localSocketPathOf(key))) return null;
  const prev = state.standing;
  state.standing = { realm, karta, name };
  const prevCwd = rec.cwd ? noteStandCwd(rec.cwd) : null;
  if (rec.base) noteSeatBase(key, rec.base); // the new holder's record no longer carries it after an eviction
  noteResuming(1);
  try {
    holdStanding(rec.url, rec.statusUrl);
    const hello = await awaitHello(4000);
    if (hello && holdsKey(key)) {
      const pending = Number(hello.pending) || 0;
      const me = sessionOfBridge();
      let busy = "";
      if (rec.status && me && rec.session === me) {
        const st = await publishStatus(rec.status);
        const kept = st.doing ?? rec.status; // the line from the answer, not from the record
        busy = st.ok ? resumeWords.busyRestored(kept) : resumeWords.busyNotRestored(short(st.body));
      } else if (rec.status) {
        rememberStatus(""); // the former holder's line is not ours: drop it from the record
        busy = resumeWords.busyForeign();
      }
      log(`standing resumed from disk (${key}), pending ${pending}`);
      standingLog(`resumed-from-disk ${key}: pending ${pending}`);
      return { word: resumeWords.fromDisk(pending, busy), pending };
    }
  } finally {
    noteResuming(-1);
  }
  // A dead token already erased the record; a missed hello keeps it for the watchdog.
  // holdStanding rewrote it with a fresh `at`, so the old one is restored below: else every
  // failed attempt would extend its life indefinitely.
  const onDisk = readHoldRecord(key);
  const kept = onDisk !== null;
  log(
    kept
      ? `hold record for ${key}: no hello in time — record kept as it was, the place is not taken`
      : `hold record for ${key} is stale — dropped, the place is taken anew`,
  );
  releaseStanding(holdWords().resumeFailed());
  // A different url on disk means another path took the seat meanwhile: keep its record.
  if (onDisk?.url === rec.url) restoreHoldRecord(key, rec);
  state.standing = prev;
  if (rec.cwd) noteStandCwd(prevCwd); // else the next bare connect writes a foreign directory into another seat's record
  return null;
}

export interface ResumeSelector {
  /** Standing key — preferred: the exact record. */
  key?: string;
  /** Session directory — fallback: this harness's records stood by this session, freshest first. */
  cwd?: string;
  /** The harness session of this bridge: by directory only its own records count (#6017). */
  session?: string;
}

/**
 * Own hold records under the selector, same harness: by key first, then by
 * directory, freshest first. Key is a preference, directory a fallback, not "or": a
 * stale key (bridge killed between released and held) must not mute a live record.
 * By directory only records stood by THIS session or the seat this bridge leads
 * count (#6017); a seat released by `left` never does — only stand by name returns it.
 * `sameDir` — all same-directory records of this harness; `legacy` — records of an
 * earlier build without a session, named aloud but not taken.
 */
function recordsFor(sel: ResumeSelector): {
  own: HoldRecord[];
  sameDir: string[];
  legacy: HoldRecord[];
  left: string[];
  neighbour: string[];
} {
  const dir = standingsDirOf(CFG.authDir);
  if (!existsSync(dir)) return { own: [], sameDir: [], legacy: [], left: [], neighbour: [] };
  const mine = harnessName();
  const led = ledKey();
  const byKey: HoldRecord[] = [];
  const byCwd: HoldRecord[] = [];
  const sameDir: string[] = [];
  const legacy: HoldRecord[] = [];
  const left: string[] = [];
  const neighbour: string[] = [];
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".hold"))) {
    try {
      const rec = JSON.parse(readFileSync(join(dir, f), "utf8")) as HoldRecord;
      // Another harness's record: a bridge of another harness in the same copy keeps its seat.
      if (!rec || rec.client !== mine) continue;
      const key = keyOf(rec.realm, rec.karta, rec.name);
      const keyed = !!sel.key && key === sel.key;
      const inDir = oneDir(rec.cwd, sel.cwd); // /tmp and /private/tmp are one directory (#5048)
      // Stood by this session — taken outside the directory too: sessions move (#6550).
      const stoodBy = !!sel.session && rec.session === sel.session;
      if (!keyed && !inDir && !stoodBy) continue;
      // Read by key as stand does: an expired record is erased and not read.
      const fresh = readHoldRecord(key);
      if (!fresh) continue;
      if (inDir) sameDir.push(key);
      if (fresh.left) {
        left.push(key);
        continue;
      }
      const stoodHere = key === led || (!!sel.session && fresh.session === sel.session);
      // By key too, a neighbour's seat is not taken: another named session stood on it (#6706).
      const theirs = !!sel.session && !!fresh.session && fresh.session !== sel.session;
      if (keyed && theirs) neighbour.push(key);
      else if (keyed) byKey.push(fresh);
      else if (stoodHere) byCwd.push(fresh);
      else if (!fresh.session) legacy.push(fresh);
    } catch {
      /* foreign or broken file */
    }
  }
  return {
    own: [...byKey, ...byCwd.sort((a, b) => (b.at ?? 0) - (a.at ?? 0))],
    sameDir,
    legacy,
    left,
    neighbour,
  };
}

/** Word on earlier-build records without a session: returned by name, not by directory. */
export const legacyWord = (names: string[]): string =>
  names.map((n) => resumeWords.legacy(n)).join("; ");

/**
 * Earlier-build seats to offer back: not held by a live bridge of another session (#6594);
 * a call with a held name would give attribution without hearing.
 */
async function freeLegacy(recs: HoldRecord[]): Promise<string[]> {
  const free: string[] = [];
  for (const r of recs) {
    const key = keyOf(r.realm, r.karta, r.name);
    if (!holdsKey(key) && (await localSocketAlive(localSocketPathOf(key)))) continue;
    free.push(r.name);
  }
  return free;
}

export interface ResumeOutcome {
  resumed: boolean;
  key?: string;
  pending?: number;
  word: string;
  /** Other hold records of the same directory (keys) (graph @nks/nks-dev, node #5366). */
  others?: string[];
  /** Earlier-build seat names without a session in the directory: named, not returned. */
  legacy?: string[];
  /** Own seats whose socket a live bridge of another session holds: not taken (#6626). */
  elsewhere?: string[];
}

/** Back to the parked seat: a new socket, hello is the proof. */
async function backToParked(key: string, how: string): Promise<ResumeOutcome> {
  if (!returnToStanding(how)) return { resumed: false, key, word: resumeWords.failed() };
  const hello = await awaitHello(4000);
  return {
    resumed: true,
    key,
    pending: Number(hello?.pending) || 0,
    word: resumeWords.returnedParked(hello ? Number(hello.pending) || 0 : null),
  };
}

/**
 * Return a seat by key or session directory: own record → socket at the same
 * address, register, busy line back. Held — said so; parked — back to it.
 */
export async function resumeBy(sel: ResumeSelector, register = true): Promise<ResumeOutcome> {
  const { own: recs, sameDir, legacy: legacyRecs, left, neighbour } = recordsFor(sel);
  if (!recs.length) {
    const legacy = await freeLegacy(legacyRecs);
    const said = [resumeWords.noRecord(sel.key, sel.cwd)];
    if (neighbour.length) said.push(resumeWords.neighbourKey(neighbour.join(", ")));
    else if (sel.key) {
      // A named key with no record: it expired (#6649).
      said.push(resumeWords.rejoin());
      RJ.lapsed = true;
    }
    const foreign = sameDir.filter((k) => !left.includes(k));
    if (foreign.length) said.push(resumeWords.foreignDir(foreign.join(", ")));
    if (left.length) said.push(resumeWords.left(left.join(", ")));
    if (legacy.length) said.push(legacyWord(legacy));
    return {
      resumed: false,
      word: said.join(" — "),
      ...(legacy.length ? { legacy } : {}),
    };
  }
  const led = ledKey();
  const skipped: string[] = [];
  const elsewhere: string[] = [];
  for (const rec of recs) {
    const key = keyOf(rec.realm, rec.karta, rec.name);
    if (holdsKey(key))
      return { resumed: true, key, pending: 0, word: resumeWords.alreadyHolding() };
    if (isParked(rec.realm, rec.karta, rec.name)) return backToParked(key, resumeWords.byRecord());
    if (led && led !== key) {
      skipped.push(resumeWords.otherSeat(key, led));
      continue;
    }
    if (await localSocketAlive(localSocketPathOf(key))) {
      skipped.push(resumeWords.liveBridge(key));
      elsewhere.push(key);
      continue;
    }
    const back = await resumeFromDisk(rec.realm, rec.karta, rec.name);
    if (!back) {
      const kept = readHoldRecord(key);
      skipped.push(kept ? resumeWords.noHello(key) : resumeWords.stale(key));
      if (!kept) {
        skipped.push(resumeWords.rejoin()); // a stale record: the seat is dead at the platform (#6649)
        RJ.lapsed = true;
      }
      continue;
    }
    const lines = [back.word];
    if (register) {
      const r = await callTool(tool("channel"), {
        action: "register",
        realm: rec.realm,
        karta: rec.karta,
        name: rec.name,
        ...placeFields(rec),
      });
      lines.push(r.isError ? resumeWords.registerRefused(short(r.text)) : "register");
    }
    // Records the loop above found stale are already erased: not named.
    const others = [
      ...new Set([...recs.map((r) => keyOf(r.realm, r.karta, r.name)), ...sameDir]),
    ].filter((k) => k !== key && readHoldRecord(k) !== null);
    if (others.length) lines.push(resumeWords.othersInDir(others.join(", ")));
    // Leave, not revoke: the platform refuses to revoke the seat that founded the channel.
    lines.push(resumeWords.notYours());
    return { resumed: true, key, pending: back.pending, word: lines.join("; "), others };
  }
  return {
    resumed: false,
    word: resumeWords.nothingToReturn(skipped.join("; ")),
    ...(elsewhere.length ? { elsewhere } : {}),
  };
}

/** Bridge start: a socket from the environment without connect — a debug path. */
export function holdFromEnv(): void {
  const url = envOf(envName("CHANNEL_SOCKET"))?.trim();
  if (url) holdStanding(url, envOf(envName("CHANNEL_STATUS"))?.trim() || null);
}

const reply = (msg: JsonRpcMessage, result: unknown): JsonRpcMessage => ({
  jsonrpc: "2.0",
  id: msg.id,
  result,
});

const selectorOf = (msg: JsonRpcMessage): ResumeSelector => ({
  key:
    typeof msg.params?.key === "string" && msg.params.key.trim()
      ? msg.params.key.trim()
      : undefined,
  cwd:
    typeof msg.params?.cwd === "string" && msg.params.cwd.trim()
      ? msg.params.cwd.trim()
      : undefined,
  session:
    typeof msg.params?.session === "string" && msg.params.session.trim()
      ? msg.params.session.trim()
      : undefined,
});

/** The plugin request's selector; the named session is this bridge's, its hold records carry it. */
function selectorFrom(msg: JsonRpcMessage): ResumeSelector {
  const sel = selectorOf(msg);
  noteHarnessSession(sel.session);
  signHeldRecord();
  return sel;
}

export const isResumeCall = (msg: JsonRpcMessage): boolean => msg?.method === method("resume");
export const isCheckCall = (msg: JsonRpcMessage): boolean => msg?.method === method("check");

/** The plugin's `resume {key?, cwd?, session?}` request: return the own seat from disk. */
export async function runResume(msg: JsonRpcMessage): Promise<JsonRpcMessage> {
  const sel = selectorFrom(msg);
  if (!sel.key && !sel.cwd) return reply(msg, { resumed: false, word: resumeWords.noKeyNoCwd() });
  const r = await resumeBy(sel);
  if (r.resumed) afterResume(r.key); // a satellite after a pause takes the run's cases (suspend.ts)
  return reply(msg, r);
}

/**
 * The plugin's `check {key?, cwd?}` watchdog: held — read the board, deaf — reopen
 * the socket; parked — back; not led — return by record.
 */
export async function runCheck(msg: JsonRpcMessage): Promise<JsonRpcMessage> {
  const sel = selectorFrom(msg);
  const s = state.standing;
  const key = s ? keyOf(s.realm, s.karta, s.name ?? "") : null;
  if (!s || !key || !holdsKey(key)) {
    if (s && key && isParked(s.realm, s.karta, s.name ?? "")) {
      // Left by word: the watchdog does not raise the seat (#6017).
      if (readHoldRecord(key)?.left)
        return reply(msg, {
          holding: false,
          resumed: false,
          key,
          word: resumeWords.leftByWord(key),
        });
      const r = await backToParked(key, resumeWords.watchdogReason());
      return reply(msg, { holding: r.resumed, ...r });
    }
    if (!sel.key && !sel.cwd)
      return reply(msg, {
        holding: false,
        resumed: false,
        word: resumeWords.noSeatNoKeyNoCwd(),
      });
    const r = await resumeBy(sel);
    return reply(msg, { holding: r.resumed, ...r });
  }
  const board = await callTool(tool("channel"), { action: "list", realm: s.realm });
  if (board.isError)
    return reply(msg, { holding: true, key, word: resumeWords.boardUnread(short(board.text)) });
  const mine = readBoard(board).entries.find(
    (e) => e.karta === String(s.karta) && nameOf(e.address) === (s.name ?? ""),
  );
  if (!mine) return reply(msg, { holding: true, key, word: resumeWords.noSeatOnBoard() });
  const pending = undelivered(mine);
  const listening = listens(mine);
  if (listening) {
    D.reopens = 0;
    return reply(msg, { holding: true, key, listening, pending, word: resumeWords.listening() });
  }
  // The undelivered count is only a word in the answer; the hearing flag decides.
  // The board reads the seat deaf: reopen at the same address, at most REOPEN_LIMIT
  // times in a row, then say it aloud instead of tearing a live socket forever.
  if (D.reopens >= REOPEN_LIMIT) {
    const text = resumeWords.gaveUp(key, REOPEN_LIMIT);
    if (!D.said) {
      D.said = true;
      standingLog(`reopen ${key}: gave up after ${REOPEN_LIMIT} — board still reads deaf`);
      emit({
        jsonrpc: "2.0",
        method: "notifications/message",
        params: { level: "warning", logger: LOGGERS.channel, data: { kind: "lost", text } },
      });
    }
    return reply(msg, {
      holding: true,
      key,
      listening,
      pending,
      reopened: false,
      stuck: true,
      word: text,
    });
  }
  D.reopens++;
  standingLog(`reopen ${key}: board reads deaf${pending ? ` with ${pending} pending` : ""}`);
  parkStanding(resumeWords.deafBoard());
  resumeStanding();
  const hello = await awaitHello(4000);
  return reply(msg, {
    holding: true,
    key,
    listening,
    pending,
    reopened: !!hello,
    word: resumeWords.reopened(hello ? Number(hello.pending) || 0 : null),
  });
}

/** Reopenings in a row while the board reads the seat deaf. */
const D = scoped(() => ({ reopens: 0, said: false }));
const REOPEN_LIMIT = 2;
