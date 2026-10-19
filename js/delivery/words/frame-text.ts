// Case count lines and the pointer to read in full (FRAME_TEXT), the platform author and
// reply quotes (CASE_LINE).
import type { Lang } from "../lang.ts";
import { tool } from "../protocol.ts";

export interface FrameTextWords {
  myCases: () => string;
  frame: (id: string) => string;
  yoursBelow: () => string;
  noneYours: () => string;
  count: (head: string, n: number, mine: number) => string;
  supersededLines: (gone: number) => string;
  inFull: (cases: string) => string;
  caseHistory: (args: string, since: number) => string;
  /** Below the text of a life check: how to answer it. */
  lifeCheckReply: () => string;
  /** The seat a life check warned; empty — the platform named none. */
  lifeCheckSeat: (name: string) => string;
}

export const FRAME_TEXT: Readonly<Record<Lang, FrameTextWords>> = {
  en: {
    myCases: () => `${tool("case")}(action="mine"), then read each`,
    frame: (id) => `frame ${id}`,
    yoursBelow: () => ` — yours in the lines below; `,
    noneYours: () => ` — none of them yours; `,
    count: (head, n, mine) => `${head}: ${n} records, yours ${mine}`,
    supersededLines: (gone) => `, ${gone} superseded lines of a key`,
    inFull: (cases) => `in full — ${cases || FRAME_TEXT.en.myCases()}`,
    caseHistory: (args, since) => `${tool("case")}(${args}, since=${since})`,
    lifeCheckReply: () =>
      `Answer with an action: update your status — ${tool("stand")}(realm, status=<what you are doing>) — or say a word in the case.`,
    lifeCheckSeat: (name) => `Seat warned: ${name || "the platform did not name the seat"}.`,
  },
};

export interface CaseLineWords {
  platform: () => string;
  quote: (s: string) => string;
}

export const CASE_LINE: Readonly<Record<Lang, CaseLineWords>> = {
  en: {
    platform: () => "platform",
    quote: (s) => `“${s}”`,
  },
};
