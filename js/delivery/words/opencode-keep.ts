// The OpenCode plugin about hearing and seats (OPENCODE_KEEP): return, hearing watchdog,
// directory keepalive, loss marker, move, twins, sign-in.
import type { Lang } from "../lang.ts";

export interface OpencodeKeepWords {
  resumed: (key: string) => string;
  elsewhere: (keys: string) => string;
  notBack: (place: string, why: string) => string;
  noKeyNoDir: () => string;
  noAnswer: () => string;
  legacy: (word: string) => string;
  sessionResumed: (root: string, word: string) => string;
  resumeFailed: (root: string, message: string) => string;
  retryFailed: (place: string, why: string) => string;
  noWhy: () => string;
  watchResumed: (root: string, word: string) => string;
  watchReopened: (root: string, word: string) => string;
  watchFailed: (root: string, message: string) => string;
  keepaliveTitle: () => string;
  noRemove: (title: string) => string;
  cap: (max: number, title: string) => string;
  notCreated: (message: string) => string;
  noId: (answer: string, title: string) => string;
  notRemoved: (id: string) => string;
  tickFailed: (message: string) => string;
  lostWord: (hhmm: string, where: string) => string;
  movedWhy: (name: string) => string;
  revokedMoved: (name: string) => string;
  twinUp: (dir: string) => string;
  markerUntaken: (seconds: number) => string;
  unloaded: (dir: string, named: string, why: string) => string;
  thisSession: () => string;
  seatLost: (key: string, dir: string, why: string) => string;
  movedAway: (session: string, dir: string) => string;
  takenFromNew: (session: string) => string;
  parentMoved: () => string;
  farRefusal: () => string;
  elsewhereDevice: (device: string) => string;
  elsewhereTunnel: (why: string) => string;
  needLoginError: (open: string, elsewhere: string) => string;
  openAndFinish: (url: string) => string;
  finishItInBrowser: () => string;
  needLogin: (open: string, elsewhere: string) => string;
  codeUntil: (link: string, until: string) => string;
}

export const OPENCODE_KEEP: Readonly<Record<Lang, OpencodeKeepWords>> = {
  en: {
    resumed: (key) =>
      `Verstak: the bridge came up and returned the seat ${key} itself — by its own holding record (the session's directory or the previous seat's key), without your move. ` +
      'Check the name against the one derived for this session: if it is someone else\'s, release it with verstak_channel(action="leave") (the channel stays; the platform rejects a revoke of the seat that founded the channel) and take your own with one verstak_stand; ' +
      "a write that already went out on this move — check it by its author in the node's history: a word under someone else's name lands on another seat, and the bridge answers with success.",
    elsewhere: (keys) =>
      `Verstak: returning the seat ${keys} from disk failed — its socket is held by another live bridge, not this session's bridge: ` +
      "hearing and the busy line here hold no seat. Call verstak_stand with this name, no take needed: the seat of this same session's previous bridge " +
      "the bridge returns itself, it does not touch another session's seat and stands beside on name.N with hearing.",
    notBack: (place, why) =>
      `Verstak: the seat ${place} did not return from disk: ${why}. ` +
      "The hearing watchdog retries the return once; if you will not wait — verstak_stand.",
    noKeyNoDir: () => "neither a seat key nor a session directory",
    noAnswer: () => "the bridge did not answer",
    legacy: (word) => `Verstak: ${word}.`,
    sessionResumed: (root, word) => `Verstak: session ${root} — ${word}`,
    resumeFailed: (root, message) =>
      `Verstak: returning the seat of session ${root} failed — ${message}`,
    retryFailed: (place, why) =>
      `Verstak: the seat ${place} did not return on the watchdog's retry either: ${why}. ` +
      "The watchdog no longer raises it by itself — take the seat with verstak_stand.",
    noWhy: () => "the bridge did not say why",
    watchResumed: (root, word) =>
      `Verstak: the hearing watchdog returned the seat of session ${root} — ${word}`,
    watchReopened: (root, word) =>
      `Verstak: the hearing watchdog reopened the socket of session ${root} — ${word}`,
    watchFailed: (root, message) => `Verstak: the hearing watchdog of session ${root} — ${message}`,
    keepaliveTitle: () => "verstak: the directory holds a seat",
    noRemove: (title) =>
      `Verstak: the OpenCode sessions context has no remove — keepalive service sessions "${title}" are not removed and pile up as children of the seat; the keepalive goes on`,
    cap: (max, title) =>
      `Verstak: more than ${max} keepalive service sessions are not removed — no longer retrying the oldest, remove the children "${title}" by hand`,
    notCreated: (message) =>
      `Verstak: the directory was not kept alive — the service session was not created: ${message}`,
    noId: (answer, title) =>
      `Verstak: the directory was kept alive, but the service session's id was not parsed from the create answer (${answer}) — it stays a child session of the seat "${title}", remove it by hand`,
    notRemoved: (id) =>
      `Verstak: the directory was kept alive, the service session ${id} was not removed — retrying on the next tact`,
    tickFailed: (message) => `Verstak: the directory keepalive tact failed — ${message}`,
    lostWord: (hhmm, where) =>
      `Verstak: hearing was lost at ${hhmm} — the plugin was stopped (restart, directory eviction) with a holding bridge: ${where}. ` +
      "The seat returns from disk by itself; the waiting frames come as a batch. If it did not return — verstak_stand.",
    movedWhy: (name) =>
      `this child session's errand ended with the parent's move to another folder: its seat${name ? ` ${name}` : ""} is revoked, the bridge is down; a write from here would go under the parent's seat`,
    revokedMoved: (name) =>
      `Verstak: ${name} is a subagent ended by the parent's move: the previous instance put its bridge down and revoked its seat, ` +
      'the outcome reached the parent as the word "moved"; no revoke is needed and none was sent.',
    twinUp: (dir) =>
      `Verstak: the instance of directory ${dir} was raised again — it returned the seat`,
    markerUntaken: (seconds) => `nobody took the marker of its seats within ${seconds} s`,
    unloaded: (dir, named, why) =>
      `Verstak: directory ${dir} was unloaded with a seat (${named}) and not raised — ${why}`,
    thisSession: () => "of this session",
    seatLost: (key, dir, why) =>
      `Verstak: the seat ${key} was released — the plugin instance of directory ${dir} ` +
      `was unloaded and did not come up (${why}). Return the seat: verstak_stand.`,
    movedAway: (session, dir) =>
      `Verstak: session ${session} was moved to ${dir} — releasing its seat to that folder's instance`,
    takenFromNew: (session) =>
      `Verstak: the seat of session ${session} was taken from its new folder — it was moved`,
    parentMoved: () =>
      "Refused (plugin): this session's parent was moved to another folder — its errand ended with the move, " +
      "the parent's bridge is not raised here, and it has no seat of its own; this session's work goes on without the graph, or by a word to the launcher.",
    farRefusal: () =>
      "Refused (plugin): this child session was moved to a different directory than its parent, and the parent's seat " +
      "is held by no plugin instance of this OpenCode process — the parent is in another process or holds no seat. " +
      "No standing as a satellite from here; reading works as is, writing — by a word to the launcher.",
    elsewhereDevice: (device) =>
      `from another device (a phone will do) — ${device}; or a personal token in ~/.verstak-bridge/token`,
    elsewhereTunnel: (why) =>
      (why ? `${why}; ` : "") +
      "from another machine — ssh -L <port>:127.0.0.1:<port>, or a personal token in ~/.verstak-bridge/token",
    needLoginError: (open, elsewhere) =>
      `Verstak: sign-in to the graph is needed — ${open} and repeat the call. ` +
      `The address is local to the OpenCode machine: ${elsewhere} (the verstak skill, its establish-mcp method).`,
    openAndFinish: (url) => `open ${url} and finish it`,
    finishItInBrowser: () => "finish it in the browser",
    needLogin: (open, elsewhere) =>
      `Verstak: sign-in needed — ${open}; ` +
      `the address is local: ${elsewhere}. ` +
      "The verstak_* tools come up by themselves after sign-in.",
    codeUntil: (link, until) => `${link} (the code is valid until ${until} UTC)`,
  },
};
