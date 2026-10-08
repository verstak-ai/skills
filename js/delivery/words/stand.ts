// The verstak_stand answer (STAND): refusals, header, the seat's move, hello, knock; the
// board header comes as an argument (BOARD_HEADER).
import type { Lang } from "../lang.ts";

export interface StandWords {
  needRealmKarta: (tail: string) => string;
  badCwd: (cwd: string, relative: boolean) => string;
  badName: (asked: string, fault: string, max: number) => string;
  cutPart: (k: string) => string;
  nameCut: (full: string, max: number, name: string, what: string) => string;
  noModel: () => string;
  legacy: (address: string, realm: string, karta: string) => string;
  boardUnread: (text: string) => string;
  /** own — the board header in the session language, others — in the server's other languages (BOARD_HEADER). */
  boardUnknown: (start: string, own: string, others: string) => string;
  boardAmbiguous: (n: number, name: string, karta: string) => string;
  boardCount: (declared: number, parsed: number) => string;
  boardCountFound: (declared: number, parsed: number) => string;
  refused: (what: string, text: string) => string;
  noIdInRegister: () => string;
  howBeside: (led: string) => string;
  howReturned: () => string;
  howOwnSession: () => string;
  otherHolder: (holder: string) => string;
  howRegister: () => string;
  ttlRefused: (ttl: number, text: string) => string;
  takenButRegister: (text: string) => string;
  howConnect: (mine: boolean, listensElsewhere: boolean, take: boolean) => string;
  head: (place: string, karta: string, realm: string, how: string) => string;
  note: (text: string) => string;
  noWatchdog: () => string;
  noSocket: () => string;
  besideNoDoor: () => string;
  besideHeard: () => string;
  heldAlready: () => string;
  hello: (pending: string) => string;
  noLocalSocket: (why: string) => string;
  noHello: () => string;
  knockNotHere: (room: string) => string;
  knockTwice: (room: string) => string;
  knockSent: (room: string, waited: number, window: number) => string;
  knockEarly: (room: string, waited: number, window: number) => string;
  knockNoRole: (room: string, realm: string) => string;
  knockRefused: (room: string, text: string) => string;
  knockDone: (room: string, again: boolean, text: string) => string;
  statusElsewhere: (takePath: string) => string;
  statusRefused: (body: string, guidance: string) => string;
}

const s = (ms: number): number => Math.round(ms / 1000);
const left = (window: number, waited: number): number => Math.ceil((window - waited) / 1000);

export const STAND: Readonly<Record<Lang, StandWords>> = {
  en: {
    needRealmKarta: (tail) =>
      "Refused (bridge): verstak_stand needs realm and karta — the graph and the role from AGENTS.md or the launch line." +
      tail,
    badCwd: (cwd, relative) =>
      `Refused (bridge): cwd must be an existing absolute directory — got "${cwd}"${relative ? " (a relative path would resolve against the bridge's cwd, not the session's)" : ""}.`,
    badName: (asked, fault, max) =>
      `Refused (bridge): name "${asked}" — ${fault}; the name rule: lowercase latin letters, digits, dot, underscore, hyphen, the first sign a letter or digit, at most ${max} signs. A name is never cut silently: a shorter name would address another seat.`,
    cutPart: (k) => (k === "repo" ? "repo" : k === "host" ? "host" : "model"),
    nameCut: (full, max, name, what) =>
      `the derived name ${full} is longer than the ${max}-sign limit — cut to ${name} (dropped: ${what}); want another — pass name`,
    noModel: () =>
      "model not passed — the name has no third part (host.repo): a second session of this machine over this repository lands on the same seat; pass model to tell them apart",
    legacy: (address, realm, karta) =>
      `a seat of the former name ${address} is alive on the board — cases and hooks may hold its address; remove it: verstak_channel(action="revoke", realm="${realm}", karta="${karta}", standing="${address}")`,
    boardUnread: (text) => `Refused: the board did not read — ${text}`,
    boardUnknown: (start, own, others) =>
      `Refused: the board's form is not recognized — no "${own}" header${others ? ` ("${others}")` : ""}, no word about an empty graph, no seat lines; no controlling moves (connect, knock, hook) on a guess. The answer begins: ${start}`,
    boardAmbiguous: (n, name, karta) =>
      `Refused: the board has ${n} seats named ${name} for role #${karta} — the form is ambiguous, the state cannot be told.`,
    boardCount: (declared, parsed) =>
      `Refused: the board declares ${declared} seats, ${parsed} were read, and your own is not among them — the unread line may be it, or a seat another session listens on; connect would rotate it blind, and take=true would take it. Repeat when the board reads, or stand under another name.`,
    boardCountFound: (declared, parsed) =>
      `The board declares ${declared} seats, ${parsed} were read — the parser missed a line; your own seat is found, going on.`,
    refused: (what, text) => `Refused: ${what} — ${text}`,
    noIdInRegister: () =>
      "register did not name the seat's id — the seat's frames are found by graph and address; the busy line waits for the id.",
    howBeside: (led) =>
      `a seat of another graph — stands beside on the channel this bridge holds (${led}): register`,
    howReturned: () =>
      "back to the seat the bridge had left — the socket reopened at the same address, register",
    howOwnSession: () =>
      "this session's own seat — taken back: a former bridge of this same harness session held it, connect (the socket is now this bridge's, the former one got 4000) and register",
    otherHolder: (holder) =>
      `Refused (bridge): another holder listens on the seat ${holder} — the bridge will not sign with it without hearing; stand on your own seat: verstak_stand without name or with another name.`,
    howRegister: () => "this bridge already holds the socket — register",
    ttlRefused: (ttl, text) =>
      `The contour refused the ${ttl} s idle window (${text}) — the seat is taken with the contour's default window.`,
    takenButRegister: (text) => `The seat is taken, but register refused — ${text}`,
    howConnect: (mine, listensElsewhere, take) =>
      mine
        ? listensElsewhere
          ? "another holder listened on the seat — connect by take (the socket is now this bridge's, the former holder got 4000) and register"
          : take
            ? "connect by take — a new entry cycle, the knock count reset — and register"
            : "the seat was there — connect (the socket is now this bridge's) and register"
        : "connect and register",
    head: (place, karta, realm, how) =>
      `[verstak_stand] standing ${place} — role #${karta}, graph ${realm}: ${how}.`,
    note: (text) => `[verstak_stand] ${text}`,
    noWatchdog: () =>
      "No watchdog command: the bridge does not hold this seat's socket yet — this session takes no frames and no invitations until the seat is back.",
    noSocket: () =>
      "The bridge holds no socket — nothing to listen with; check the connect answer.",
    besideNoDoor: () =>
      "The seat is recorded, but it has no door — the bridge's channel socket is not alive; this graph's frames will not come here.",
    besideHeard: () =>
      "This bridge holds the channel socket — this graph's seat frames go to its watchdog.",
    heldAlready: () => "This bridge holds the socket (hello came when the socket opened).",
    hello: (pending) => `hello received: frames waiting — ${pending}.`,
    noLocalSocket: (why) =>
      `BUT the standing's local socket is not up (${why}) — the watchdog has nothing to attach to: no hearing in this session, the watchdog command above will not work. The seat is held, records are signed; tell the user.`,
    noHello: () =>
      "no hello within 4 s — the bridge holds the socket, but there is no proof of hearing yet: check the board.",
    knockNotHere: (room) =>
      `The user's seat ${room}: no knock sent — the bridge does not hold this seat's socket yet, the user's answer would not come here; knock with the same call once the seat is back.`,
    knockTwice: (room) =>
      `The user's seat ${room}: knocked twice, no invitation — no more knocks this time; tell the user their seat did not answer and ask them to open the chat (a new entry resets the count: take=true or a new session).`,
    knockSent: (room, waited, window) =>
      `The user's seat ${room}: a knock went ${s(waited)} s ago — wait for the invitation; a deliberate repeat — the same call with repeat_knock=true, not before ${s(window)} s.`,
    knockEarly: (room, waited, window) =>
      `The user's seat ${room}: too early to repeat — ${s(waited)} s since the first knock, the rule waits ${s(window)} s; repeat in ${left(window, waited)} s.`,
    knockNoRole: (room, realm) =>
      `The user's seat ${room}: the board of graph ${realm} does not have it, and send needs its holder's role — no knock sent. The user's seat lives by their presence: either they have been away past the threshold (ask them to open the chat and repeat), or pass room_karta=<the user's role>.`,
    knockRefused: (room, text) => `The user's seat ${room}: the knock was refused — ${text}`,
    knockDone: (room, again, text) =>
      `The user's seat ${room}: ${again ? "repeated " : ""}knock sent — ${text} Wait for the first message from the user's seat with its header; do not write there before it — you will stand beside the user when it comes.`,
    statusElsewhere: (takePath) =>
      `The busy line is not published: the bridge has no status address for this standing — the socket's holder has it; ${takePath}.`,
    statusRefused: (body, guidance) => `The busy line was not accepted: ${body}${guidance}`,
  },
};
