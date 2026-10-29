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
  /** Another seat's record closed the question to me [n]: who answered — without its text. */
  askAnswered: (n: string, by: string) => string;
  /** The question to me [n] re-asked on its key of another addressee. */
  askMoved: (n: string, to: string) => string;
  inFull: (cases: string) => string;
  caseHistory: (args: string, since: number) => string;
  /** Below the text of a life check: how to answer it. */
  lifeCheckReply: () => string;
  /** The seat a life check warned; empty — the platform named none. */
  lifeCheckSeat: (name: string) => string;
  /**
   * The reply line under a person's direct word from the window: the full send that puts
   * the answer under it. realm — the frame's graph, karta — the person's role, standing —
   * their seat, id — the word's.
   */
  humanWordReply: (realm: string, karta: string, standing: string, id: string) => string;
  /** No address to reply: true marks each missing part, said plainly so the agent knows. */
  noReplyAddress: (missing: {
    realm: boolean;
    karta: boolean;
    standing: boolean;
    id: boolean;
  }) => string;
}

export const FRAME_TEXT: Readonly<Record<Lang, FrameTextWords>> = {
  en: {
    myCases: () => `${tool("case")}(action="mine"), then read each`,
    frame: (id) => `frame ${id}`,
    yoursBelow: () => ` — yours in the lines below; `,
    noneYours: () => ` — none of them yours; `,
    count: (head, n, mine) => `${head}: ${n} records, yours ${mine}`,
    supersededLines: (gone) => `, ${gone} superseded lines of a key`,
    askAnswered: (n, by) => `; your question [${n}] is closed: answered by ${by}`,
    askMoved: (n, to) => `; your question [${n}] is re-asked of ${to}`,
    inFull: (cases) => `in full — ${cases || FRAME_TEXT.en.myCases()}`,
    caseHistory: (args, since) => `${tool("case")}(${args}, since=${since})`,
    lifeCheckReply: () =>
      `Answer with an action: update your status — ${tool("stand")}(realm, status=<what you are doing>) — or say a word in the case.`,
    lifeCheckSeat: (name) => `Seat warned: ${name || "the platform did not name the seat"}.`,
    humanWordReply: (realm, karta, standing, id) =>
      `reply: ${tool("channel")}(action="send", realm=${realm}, karta=${karta}, standing=${standing}, in_reply_to=${id}, text=…)`,
    noReplyAddress: (m) =>
      `no address to reply: missing ${[
        m.realm && "the graph",
        m.karta && "the person's role",
        m.standing && "the person's seat",
        m.id && "the word's id",
      ]
        .filter(Boolean)
        .join(", ")}`,
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
