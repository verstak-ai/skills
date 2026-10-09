// Leaving a seat and returning to it (LEAVE): the outcome, leave refusals, deafness; seat
// keys as one string joined by ", ".
import type { Lang } from "../lang.ts";

export interface LeaveWords {
  notHolding: () => string;
  cleared: () => string;
  notCleared: (body: string) => string;
  seats: (keys: string) => string;
  seat: (key: string) => string;
  leftByWord: (which: string, line: string) => string;
  left: (which: string, line: string) => string;
  satelliteReleased: () => string;
  leftSatellite: (place: string, line: string) => string;
  returned: (how: string, status: string) => string;
  noHello: () => string;
  watchdogAttached: () => string;
  nobodyListens: (min: number) => string;
  byDoerWord: () => string;
  refusedBeside: (beside: string, led: string, realm: string | undefined) => string;
  refusedOther: (realm: string, led: string, ledRealm: string) => string;
  /** led — this bridge's seat; none — the word that it holds none. */
  refusedNamed: (standing: string, led: string | null) => string;
}

export const LEAVE: Readonly<Record<Lang, LeaveWords>> = {
  en: {
    notHolding: () => "the bridge holds no seat — nothing to leave",
    cleared: () => "busyness cleared",
    notCleared: (body) => `busyness not cleared (${body})`,
    seats: (keys) => `the seats ${keys} (they share the channel socket)`,
    seat: (key) => `the seat ${key}`,
    leftByWord: (which, line) =>
      `left ${which}: the socket is closed, ${line}; address, queue and hooks intact — mail piles up; the seat is released by word and will not return by itself — to bring it back: verstak_stand with the same name`,
    left: (which, line) =>
      `left ${which}: the socket is closed, ${line}; address, queue and hooks intact — mail piles up and arrives on return (the watchdog or verstak_stand)`,
    satelliteReleased: () => "the satellite seat is released whole",
    leftSatellite: (place, line) =>
      `left the satellite seat ${place}: the socket is closed, ${line}; the seat is released whole — neither the watchdog nor a return will raise it; to stand again — verstak_stand with satellite_of`,
    returned: (how, status) =>
      `the bridge is back on the seat (${how}) — the socket is reopened at the same address${status ? `, busyness "${status}" restored` : ""}`,
    noHello: () =>
      "the socket reopened at the same address gave no hello — another may have turned the address",
    watchdogAttached: () => "a watchdog attached",
    nobodyListens: (min) => `nobody has listened for ${min} min`,
    byDoerWord: () => "by the doer's word",
    refusedBeside: (beside, led, realm) =>
      `Refused (bridge): the seat ${beside} stands on the bridge's shared channel beside ${led} — leaving would close the socket for all seats of the channel. To leave all — leave in the graph ${realm ?? "of the main seat"}; to remove only this seat — revoke.`,
    refusedOther: (realm, led, ledRealm) =>
      `Refused (bridge): this bridge holds no seat in the graph ${realm} — nothing to leave; its seat ${led} in the graph ${ledRealm} is untouched.`,
    refusedNamed: (standing, led) =>
      `Refused (bridge): ${standing} is not this bridge's seat, the call was not sent; leave releases only this bridge's seat${led ? ` (${led}, untouched)` : " (it holds no seat now)"}; a spare seat of your own account is removed by revoke(karta, standing=${standing}) — only on the user's word: revoke destroys the seat's incoming address and hooks.`,
  },
};
