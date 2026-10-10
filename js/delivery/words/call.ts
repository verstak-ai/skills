// A tool call made by the bridge itself (CALL): one-seat-per-bridge and seat-beside
// refusals, the asked-vs-led seat advice, an empty answer.
import type { Lang } from "../lang.ts";
import { tool } from "../protocol.ts";

export interface CallWords {
  sameNamePrefix: () => string;
  heardAdvice: (other: boolean, asked: string, led: string) => string;
  sameKeysAdvice: () => string;
  sameNameAdvice: () => string;
  takeOtherAdvice: () => string;
  otherPlace: (led: string, asked: string, advice: string) => string;
  besideConnect: (led: string) => string;
  besideStand: (led: string) => string;
  noReply: () => string;
}

export const CALL: Readonly<Record<Lang, CallWords>> = {
  en: {
    sameNamePrefix: () => "the same name under another role; ",
    heardAdvice: (other, asked, led) =>
      `${other ? `another session listens on the seat ${asked}` : `the bridge does not know whether another session listens on the seat ${asked}`} — leave it alone; this bridge's own seat is ${led}: stay on it or pass another name; to stand beside — ${tool("stand")} without name; taking the seat (take=true) — only on the user's word`,
    sameKeysAdvice: () =>
      `the keys match — it is the same seat: repeat ${tool("stand")} with take=true to reopen it deliberately`,
    sameNameAdvice: () =>
      `the same name under another role (derived from the same directory) — pass another name, or ${tool("stand")} with take=true to change this bridge's seat`,
    takeOtherAdvice: () =>
      `to take another seat instead of this one — ${tool("stand")} with take=true (the former stays on the board without hearing; remove what is not needed with revoke)`,
    otherPlace: (led, asked, advice) =>
      `Refused (bridge): this bridge already leads the seat ${led} — one seat per bridge in a graph, and the seat ${asked} would silently take it off the socket. ` +
      `${advice}; holding both at once needs a second bridge, that is another harness session; a seat in another graph stands beside by itself.`,
    besideConnect: (led) =>
      `Refused (bridge): this bridge leads the seat ${led}, and a connect in another graph would open a second channel and take it off the socket. A seat in another graph stands beside on the same channel — ${tool("stand")}(realm=…) or register.`,
    besideStand: (led) =>
      `Refused (bridge): this bridge leads the seat ${led}, but has no channel socket now (it left the seat or the seat was taken) — a seat of another graph cannot stand beside. First bring back ${led}: ${tool("stand")} for its graph.`,
    noReply: () => "no reply",
  },
};
