// The OpenCode plugin about subagents (LEAD): the lead and its end, refusals to an ended
// child, waiting for a permission.
import type { Lang } from "../lang.ts";

export interface LeadWords {
  cancelled: () => string;
  cancelledRefusal: () => string;
  cascade: (who: string) => string;
  placeEvicted: () => string;
  placeClosed: () => string;
  placeEvictedRefusal: () => string;
  placeClosedRefusal: () => string;
  end: (who: string, why: string, done: string, said: string) => string;
  endKept: (who: string, kept: string) => string;
  endPlain: () => string;
  keptLine: (who: string, place: string) => string;
  keptSaid: (who: string, place: string) => string;
  unrevokedUnknown: (who: string) => string;
  unrevoked: (who: string, places: string, first: string) => string;
  turn: (place: string) => string;
  notice: (child: string, place: string) => string;
  release: (who: string) => string;
  released: () => string;
  away: (who: string, last: string) => string;
  lost: (who: string, why: string) => string;
  tellDone: (sessionID: string) => string;
  tellFailed: (sessionID: string, message: string) => string;
  sessionOf: (child: string) => string;
  noParent: (text: string) => string;
  notDown: (who: string, message: string) => string;
  leftSeat: () => string;
  leftCases: () => string;
  leftCase: (room: string) => string;
  releasedByLauncher: () => string;
  deleted: () => string;
  reloadUnreadable: () => string;
  reloadNoKey: () => string;
  reloadNotBack: () => string;
  identity: (name: string, action: string) => string;
  writeUnderParent: (name: string, of: string) => string;
  writeNoParent: () => string;
  finalRefusal: (why: string, name: string) => string;
  releasedChild: () => string;
  endedChild: () => string;
  endedSatellite: () => string;
  launcherSeat: () => string;
  endedRefusal: (why: string, name: string, action: string, of: string) => string;
  ask: (who: string, what: string) => string;
  more: (n: number) => string;
  action: () => string;
  interrupt: (who: string, reason: string) => string;
}

const act = (action: string): string => (action ? ` (${action})` : "");
const keptEn = (who: string, place: string): string =>
  `child ${who} stood not as a satellite (${place}) — the seat is not revoked, the bridge is not down`;

export const LEAD: Readonly<Record<Lang, LeadWords>> = {
  en: {
    cancelled: () => "its turn was cancelled in OpenCode (by the user or the launcher)",
    cancelledRefusal: () => "its turn was cancelled in OpenCode",
    cascade: (who) =>
      `Verstak: the turn of subagent ${who} was cut by the cancel of your turn — it has not ended: it holds its seat and cases and waits for frames of its case. ` +
      `To go on — a word into its case; to release it — verstak_channel(action="revoke", standing="${who}").`,
    placeEvicted: () => "its satellite seat was evicted by another holder",
    placeClosed: () =>
      "its satellite seat was revoked not through the launcher or closed by the platform (4001)",
    placeEvictedRefusal: () => "its satellite seat was evicted by another holder",
    placeClosedRefusal: () => "its satellite seat was revoked or closed by the platform (4001)",
    end: (who, why, done, said) =>
      `Verstak: subagent ${who} ENDED — ${why}. This is the end of the errand, not a turn: ${done}` +
      `The outcome is its last word:\n${said || "(it left no text — see its case)"}`,
    endKept: (who, kept) =>
      `${keptEn(who, kept)}; to revoke it — verstak_channel(action="revoke", standing="${kept}"), only on the user's word. `,
    endPlain: () =>
      "the subagent's bridge goes down: it leaves its cases, its seat is revoked (if it is not, I will say so separately). ",
    keptLine: keptEn,
    keptSaid: (who, place) => `Verstak: ${keptEn(who, place)}`,
    unrevokedUnknown: (who) =>
      `Verstak: the bridge of subagent ${who} is down; whether it revoked its seat it did not answer: if it is left on the board — revoke it with verstak_channel(action="revoke").`,
    unrevoked: (who, places, first) =>
      `Verstak: subagent ${who}'s seat was not revoked (network): ${places} — revoke it with verstak_channel(action="revoke", standing="${first}").`,
    turn: (place) =>
      `Verstak: subagent ${place} handed over a turn, not the errand — it goes on and waits for frames of its case; the outcome lands here at its end. ` +
      `To release it earlier — verstak_channel(action="revoke", standing="${place}").`,
    notice: (child, place) =>
      `Verstak: the OpenCode notice <subagent sessionID="${child}" state="completed"> is the end of a TURN of subagent ${place}, not of the errand: ` +
      `it is a lead, stands on its own seat and waits for frames of its case. Do not count it finished — the outcome lands here with the word "ENDED" at its end. ` +
      `To release it earlier — verstak_channel(action="revoke", standing="${place}").`,
    release: (who) =>
      `Verstak: subagent ${who} is released — its bridge is down: it leaves its cases and revokes its seat itself; the outcome landed here as a synthetic message.`,
    released: () =>
      "Verstak: the launcher released you — the errand is over, the seat is revoked, you are taken out of the cases; standing again is not possible, write nothing more into the graph or cases.",
    away: (who, last) =>
      `Verstak: subagent ${who} was taken down by the parent's move to another folder — the errand here ended not by its outcome, there will be no "ENDED": ` +
      `its bridge goes down: it leaves its cases, its seat is revoked; its session stayed in the previous folder. Its last word:\n${last || "(it left no text — see its case)"}`,
    lost: (who, why) =>
      `Verstak: subagent ${who} is taken down — ${why}. The seat without a bridge goes with the channel's term, its cases with the seat's term; there is no outcome, its turn is in its session.`,
    tellDone: (sessionID) =>
      `Verstak: the word about the subagent was delivered into session ${sessionID}`,
    tellFailed: (sessionID, message) =>
      `Verstak: the word about the subagent was not delivered into ${sessionID}: ${message}`,
    sessionOf: (child) => `of session ${child}`,
    noParent: (text) =>
      `${text}\n(the plugin does not know the parent — nobody to give the outcome to)`,
    notDown: (who, message) =>
      `Verstak: the bridge of subagent ${who} was not put down after the outcome — ${message}`,
    leftSeat: () => "left its seat by the outcome",
    leftCases: () => "left its cases by the outcome",
    leftCase: (room) => `left case #${room} by the outcome`,
    releasedByLauncher: () => "released on the launcher's word",
    deleted: () => "the subagent's session was deleted",
    reloadUnreadable: () => "plugin reload, the subagent's session is unreadable",
    reloadNoKey: () => "plugin reload, no seat key",
    reloadNotBack: () => "plugin reload, the satellite seat did not return by its key",
    identity: (name, action) =>
      `Refused (plugin): ${name}${act(action)} is the user's identity, and the child session has no seat of its own: ` +
      "it does not get it through the root's bridge. The graph and cases can be read; who you are — ask the launcher.",
    writeUnderParent: (name, of) =>
      `Refused (plugin): a child session writes only with its own satellite seat — ${name} would go under the parent's seat ${of}. ` +
      `Stand: verstak_stand(realm, karta, satellite_of="${of}"), then repeat; reading works as is.`,
    writeNoParent: () =>
      "Refused (plugin): a child session writes only with its own satellite seat, and the parent's seat is unknown — the root holds no seat. " +
      "It cannot have a seat of its own; reading works as is, writing — by a word to the launcher.",
    finalRefusal: (why, name) =>
      `Refused (plugin): ${why} — the errand is over, the seat is revoked; ` +
      `${name} goes neither with its seat nor with the launcher's, and standing again is not possible.`,
    releasedChild: () => "the launcher released this child session",
    endedChild: () => "this child session has ended",
    endedSatellite: () => "this child session has ended, its satellite seat is released",
    launcherSeat: () => "<the launcher's seat>",
    endedRefusal: (why, name, action, of) =>
      `Refused (plugin): ${why} — ` +
      `${name}${act(action)} would go with the launcher's bridge and seat. Stand again: ` +
      `verstak_stand(realm, karta, satellite_of="${of}"), then repeat the call.`,
    ask: (who, what) =>
      `Verstak: subagent ${who} is waiting for a permission: ${what}. Only the user can answer this request — in the window of the subagent's session ${who}. ` +
      "You cannot answer it, and no message to the subagent unblocks it. " +
      "Tell the user what is waiting and where: only they can answer or cancel the subagent's turn.",
    more: (n) => ` and ${n} more`,
    action: () => "action",
    interrupt: (who, reason) => `Verstak: the turn of subagent ${who} was interrupted (${reason}).`,
  },
};
