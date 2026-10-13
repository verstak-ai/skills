// Stopping an agent by taking its seat off (graph @nks/nks-dev, nodes #7439, #7440, #7493):
// an agent and its seat share one life — a seat taken off ends the agent; someone else's
// close 4001 or a standing_ended frame is a stop, not a dead token. The name stays free:
// taking it again is an explicit call.
import type { Lang } from "../lang.ts";

/** Who took the seat off — by the close reason (`revoked:person`, `revoked:self`), or unknown. */
export type StopWho = "person" | "self" | "other";

export interface StopWords {
  /** The agent's word, one on every path: a close, a frame, a bridge move meeting the removal. */
  stopped: (name: string, who: StopWho) => string;
}

const WHO_EN: Record<StopWho, string> = {
  person: "by the human",
  self: "by a session of the same account",
  other: "by the owner or another session",
};

export const STOP: Readonly<Record<Lang, StopWords>> = {
  en: {
    stopped: (name, who) =>
      `the seat ${name} was taken off (${WHO_EN[who]}) — you are stopped: end the work, do not take the seat`,
  },
};
