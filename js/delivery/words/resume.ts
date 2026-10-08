// Returning a seat (RESUME): from disk and by record, the plugin watchdog's hearing check,
// refusals; the core joins lists into a string.
import type { Lang } from "../lang.ts";

export interface ResumeWords {
  failed: () => string;
  returnedParked: (pending: number | null) => string;
  legacy: (n: string) => string;
  noRecord: (key: string | undefined, cwd: string | undefined) => string;
  rejoin: () => string;
  foreignDir: (foreign: string) => string;
  neighbourKey: (keys: string) => string;
  left: (left: string) => string;
  alreadyHolding: () => string;
  byRecord: () => string;
  otherSeat: (key: string, led: string) => string;
  liveBridge: (key: string) => string;
  noHello: (key: string) => string;
  stale: (key: string) => string;
  registerRefused: (text: string) => string;
  othersInDir: (others: string) => string;
  notYours: () => string;
  nothingToReturn: (skipped: string) => string;
  noKeyNoCwd: () => string;
  noSeatNoKeyNoCwd: () => string;
  leftByWord: (key: string) => string;
  watchdogReason: () => string;
  boardUnread: (text: string) => string;
  noSeatOnBoard: () => string;
  listening: () => string;
  gaveUp: (key: string, limit: number) => string;
  deafBoard: () => string;
  reopened: (pending: number | null) => string;
  busyRestored: (kept: string) => string;
  busyNotRestored: (body: string) => string;
  busyForeign: () => string;
  fromDisk: (pending: number, busy: string) => string;
}

const via = "verstak_stand";

export const RESUME: Readonly<Record<Lang, ResumeWords>> = {
  en: {
    failed: () => "the return to the seat failed",
    returnedParked: (pending) =>
      pending === null
        ? "the return to the seat the bridge had left; hello did not come in 4 s"
        : `the return to the seat the bridge had left (frames waiting — ${pending})`,
    legacy: (n) =>
      `there is a seat of an earlier build without a session: ${n} — to bring it back: ${via}(name="${n}")`,
    noRecord: (key, cwd) =>
      `there is no own hold record ${key ? `with the key ${key}` : `for the directory ${cwd ?? "?"}`}`,
    rejoin: () =>
      `the seat may have expired at the platform and left its cases — after ${via} check verstak_case(action="mine"); empty — join your cases again (verstak_case action="join")`,
    foreignDir: (foreign) =>
      `the directory holds records of seats this session did not stand on (${foreign}); they are not taken by directory alone, ${via} will take the seat`,
    neighbourKey: (keys) =>
      `another session stood on the seat ${keys} — a return does not take a neighbour's seat; ${via} will take your own`,
    left: (left) =>
      `the seat was released by the holder's word (leave): ${left} — it will not return by itself, to bring it back: ${via} with the same name`,
    alreadyHolding: () => "the bridge already holds this seat",
    byRecord: () => "return by record",
    otherSeat: (key, led) => `${key}: the bridge leads another seat ${led}`,
    liveBridge: (key) => `${key}: held by a live bridge`,
    noHello: (key) =>
      `${key}: hello did not come — the record is intact, the watchdog will repeat the return; if you do not wait — ${via}`,
    stale: (key) => `${key}: the record went stale — ${via} will take the seat`,
    registerRefused: (text) => `register refused — ${text}`,
    othersInDir: (others) => `the same directory holds records of other seats too: ${others}`,
    notYours: () =>
      'the seat is not yours — verstak_channel(action="leave") will release it, the channel stays intact',
    nothingToReturn: (skipped) => `nothing to return — ${skipped}`,
    noKeyNoCwd: () => "neither key nor cwd was passed",
    noSeatNoKeyNoCwd: () => "no seat, and neither key nor cwd was passed",
    leftByWord: (key) =>
      `the seat ${key} was released by the holder's word (leave) — the watchdog does not raise it; to bring it back: ${via} with the same name`,
    watchdogReason: () => "the hearing watchdog",
    boardUnread: (text) => `the board could not be read — ${text}`,
    noSeatOnBoard: () => "the own seat is not on the board",
    listening: () => "listening",
    gaveUp: (key, limit) =>
      `Verstak: the board reads the seat ${key} as not listening and after ${limit} socket reopenings — ` +
      `I no longer tear it; check the board and the server, to restore hearing — ${via} with the same name: it leaves another session on the seat alone and stands beside; take=true — only on the user's word.`,
    deafBoard: () => "the board does not read it as listening",
    reopened: (pending) =>
      pending === null
        ? "the socket is reopened, hello did not come in 4 s"
        : `the socket is reopened: frames waiting — ${pending}`,
    busyRestored: (kept) => `; busy line restored: ${kept}`,
    busyNotRestored: (body) => `; busy line not restored: ${body}`,
    busyForeign: () => "; the former busy line is not restored — say your own",
    fromDisk: (pending, busy) =>
      `the seat returned from disk after the bridge restarted — the socket reopened at the same address (frames waiting — ${pending})${busy}`,
  },
};
