// The busy line (STATUS): the line, the seat label, refusals without a status address, the
// hearing move path.
import type { Lang } from "../lang.ts";

export interface StatusWords {
  busyLine: (label: string, line: string, nudge: string) => string;
  placeDerived: (place: string) => string;
  placeUnnamed: (name: string) => string;
  evictedWhy: () => string;
  reopeningWhy: () => string;
  noSeatId: (key: string) => string;
  takePath: () => string;
  turnedGuidance: () => string;
  notHeld: () => string;
  notHeldNone: () => string;
  notHeldList: (list: string) => string;
  whereCwd: (cwd: string) => string;
  whereClient: (client: string) => string;
}

const TAKE_PATH_EN =
  "verstak_stand with take=true — only on the user's word — moves the hearing and the status address here ONCE: the address stays with THIS bridge instance, " +
  "and a watchdog raised after it does not carry it off — by design: the watchdog is a local client of the socket and makes no connect of its own. The former holder gets close 4000 " +
  "(the evicted one need not take the seat back the same way — it gets a seat beside, name.N); connect does not touch the seat's incoming address and queue, what waited comes in hello " +
  '(help: verstak_channel action="?", connect); after the move re-arm the watchdog with the command from the answer';

const TWO_ENTRIES_EN =
  "If the seat is yours and a bridge of this same session holds it (the session has two verstak entries, the plugin's and the user's), call status with the same tool set you called verstak_stand with: no move is needed.";

const TURNED_EN = `${TWO_ENTRIES_EN} Otherwise ${TAKE_PATH_EN}.`;

const NOT_HELD_EN = "Refused (bridge): this bridge holds no seat, it has no status address.";

export const STATUS: Readonly<Record<Lang, StatusWords>> = {
  en: {
    busyLine: (label, line, nudge) => `busyness ${label}: ${line || "(cleared)"}${nudge}`,
    placeDerived: (place) => `${place} (address derived, hello did not name it)`,
    placeUnnamed: (name) =>
      `of the seat${name ? ` "${name}"` : ""} (no @handle:name address yet — hello has not come)`,
    evictedWhy: () =>
      "the hearing is with another holder — take it back by verstak_stand with take=true only on the user's word",
    reopeningWhy: () =>
      "the socket is reopening — the line is published, the hearing comes back by itself",
    noSeatId: (key) =>
      `Refused (bridge): the bridge does not yet know the id of the seat ${key} (hello did not name it) — without it the line would land on all seats of the channel; repeat verstak_stand for this graph.`,
    takePath: () => TAKE_PATH_EN,
    turnedGuidance: () => TURNED_EN,
    notHeld: () => NOT_HELD_EN,
    notHeldNone: () =>
      `${NOT_HELD_EN} Introduce yourself with one call verstak_stand(realm, karta, model, status) — busyness can be passed right in it. ` +
      `If another holder listens on the seat, verstak_stand will say so; then ${TAKE_PATH_EN}.`,
    notHeldList: (list) =>
      `${NOT_HELD_EN} Seats of this graph on this machine are held by live bridges: ${list}. ${TURNED_EN}`,
    whereCwd: (cwd) => `directory ${cwd}`,
    whereClient: (client) => `harness ${client}`,
  },
};
