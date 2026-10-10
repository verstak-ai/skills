// A seat's hearing (HEARING): the bare 'agent' refusal, who listens to the seat, raw
// connect, mint, register refusals.
import type { Lang } from "../lang.ts";
import { tool } from "../protocol.ts";

export interface HearingWords {
  unresolvedAgent: (what: string) => string;
  otherListens: (seat: string) => string;
  unknownListens: (seat: string) => string;
  rawSeatRefusal: (who: string, action: string) => string;
}

export const HEARING: Readonly<Record<Lang, HearingWords>> = {
  en: {
    unresolvedAgent: (what) =>
      `Refused (bridge): karta="agent" — the bridge leads no seat in this graph and does not know which role this session held the name under, and a seat under the sentinel matches neither the board nor a former hold (${what} could make a second seat or take another's). Name the role by number — the agent's role from AGENTS.md.`,
    otherListens: (seat) => `another session listens on the seat ${seat}`,
    unknownListens: (seat) =>
      `the bridge does not know whether another session listens on the seat ${seat} (the board did not read, or not all of it)`,
    rawSeatRefusal: (who, action) =>
      `Refused (bridge): ${who} — ${action} ${action === "register" ? "would sign writes with another's seat" : "would take it"}; the call was not sent. Stand with ${tool("stand")}: the bridge takes its own seat back by itself and stands beside another's on name.N with hearing.`,
  },
};
