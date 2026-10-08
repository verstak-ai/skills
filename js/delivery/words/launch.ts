// Entering a case by the launch line (LAUNCH).
// #6078, #6550).
import type { Lang } from "../lang.ts";

export interface LaunchWords {
  notSeated: (why: string, no: string, join: string) => string;
  ownSeat: () => string;
  notEntered: (place: string, no: string, why: string) => string;
  entered: (place: string, no: string) => string;
}

export const LAUNCH: Readonly<Record<Lang, LaunchWords>> = {
  en: {
    notSeated: (why, no, join) =>
      `Verstak: launch line — not seated: ${why}. A subagent takes only a satellite of its launcher's seat: if the launcher holds one, repeat verstak_stand and enter case #${no}: ${join}; ` +
      "if not, the launcher takes a seat and launches you again; until then the work goes without the graph, the result as a word to the launcher.",
    ownSeat: () => "in a seat of its own",
    notEntered: (place, no, why) =>
      `Verstak: seated ${place}; did not enter case #${no} — ${why}. The seat stays.`,
    entered: (place, no) =>
      `Verstak: seated ${place}, entered case #${no} — retell the brief as your first message in the case.`,
  },
};
