// Watchdogs (WATCHDOG): the hearing sign, outcomes, the Codex door.
import type { Lang } from "../lang.ts";
import { tool } from "../protocol.ts";

export interface WatchdogWords {
  doer: (text: string) => string;
  listening: (key: string | undefined, tail?: string) => string;
  listeningCodex: (key: string | undefined, thread: string | undefined) => string;
  backfilled: (count: string) => string;
  frames: (n: number) => string;
  noHeld: () => string;
  severalHeld: (held: string) => string;
  bridgeLetGo: () => string;
  seatNotBack: (s: number, path: string) => string;
  noSocket: (path: string, s: number) => string;
  bridgeReleasedSocket: (text: string) => string;
  notWakeup: (type: string | undefined) => string;
  seenEarlier: (id: string) => string;
  unaddressed: () => string;
  seatLost: () => string;
  aliveNote: () => string;
  codexLost: () => string;
  codexAlive: () => string;
  noThread: () => string;
  noDoor: (path: string) => string;
  threadRefused: (why: string) => string;
  refusal: () => string;
  framePut: (thread: string | undefined) => string;
  frameSent: (thread: string | undefined) => string;
  flushNotPut: (s: number) => string;
  frameNotPut: (why: string) => string;
  doorClosed: (why: string, lost: string) => string;
  doorNotOpened: (why: string) => string;
  noIdFromRing: () => string;
  alreadyPut: (id: string) => string;
}

export const WATCHDOG: Readonly<Record<Lang, WatchdogWords>> = {
  en: {
    doer: (text) => `DOER: ${text}`,
    listening: (key, tail = "") => `listening on standing ${key}${tail}`,
    listeningCodex: (key, thread) =>
      `listening on standing ${key}; putting frames into thread ${thread}`,
    backfilled: (count) => ` (${count} back-dated)`,
    frames: (n) => `${n} ${n === 1 ? "frame" : "frames"}`,
    noHeld: () =>
      `the bridge holds no standing — name yourself with one call to ${tool("stand")}(realm, karta, model): its answer names the listening command`,
    severalHeld: (held) => `the bridge holds several standings — name the one you need: ${held}`,
    bridgeLetGo: () => "the bridge released the standing or went away — did the session end?",
    seatNotBack: (s, path) =>
      `the seat did not return within ${s}s after the daemon change — socket ${path} is not up; to bring it back use ${tool("stand")}`,
    noSocket: (path, s) => `the bridge did not bring up the local socket ${path} within ${s}s`,
    bridgeReleasedSocket: (text) => `the bridge released the socket: ${text}`,
    notWakeup: (type) => `frame ${type ?? "unparsed"} — not a reason to wake`,
    seenEarlier: (id) =>
      `frame ${id} was already delivered by an earlier arming — not a reason to wake`,
    unaddressed: () =>
      "a batch with nothing addressed to the seat — the count waits for the next wake-up",
    seatLost: () => "DOER: the standing is lost",
    aliveNote: () =>
      "DOER: the socket keeps being cut while the service answers — the bridge holds the seat",
    codexLost: () => `Verstak: the standing is lost — name yourself again: ${tool("stand")}`,
    codexAlive: () =>
      "Verstak: the socket keeps being cut while the service answers — the bridge holds the seat",
    noThread: () =>
      "DOER: no CODEX_THREAD_ID — run this watchdog from the Codex session shell: that is where Codex puts the thread id into the environment",
    noDoor: (path) =>
      `DOER: no door (${path}) — this thread is not under an app-server daemon. This is the USER's move before the session starts, not yours: the daemon and the Codex session must start with one short CODEX_HOME (recipe in SETUP, section Codex). Tell them so; until there is a door, listen with watchdog-exit`,
    threadRefused: (why) => `DOER: the thread did not accept the frame — ${why}`,
    refusal: () => "refusal",
    framePut: (thread) => `frame put into thread ${thread}`,
    frameSent: (thread) => `frame sent to thread ${thread}`,
    flushNotPut: (s) =>
      `DOER: the put did not go through within ${s}s after one's own release — the batch was not sent to the thread`,
    frameNotPut: (why) => `DOER: the frame was not put in — ${why}`,
    doorClosed: (why, lost) =>
      `the door closed: ${why} — will reopen on the next frame` +
      (lost ? `; unanswered: ${lost} — will come back from the ring on the next arming` : ""),
    doorNotOpened: (why) => `the door did not open: ${why}`,
    noIdFromRing: () =>
      "a frame without an id from the ring — nothing to mark it with, not putting it into the thread again",
    alreadyPut: (id) => `frame ${id} was already put in — not putting it into the thread again`,
  },
};
