// The turn's end on a watch (graph @nks/nks-dev, nodes #9342, #9345): a turn a frame of the
// channel or a case started, with no human word in it, that ended with the assistant's text and
// laid no word where the human sees it, lost that text in a console nobody reads. The delivery
// wakes the session with one word (TURN); the turn that word wakes does not repeat it. Not lost:
// a console a human wrote into lately, a short line with no question, a turn only frames with
// nothing addressed to the seat started. The cover's list of rituals names this one TURN_RITE.
import { FRAME_MARK, tool } from "../delivery/index.ts";
import type { Ritual } from "./coverblock.ts";

export const TURN_RITE: Ritual = "turn";

/** The calls that lay a word where the human sees it: by tool, the actions that do. */
const SPEAKING: ReadonlyMap<string, ReadonlySet<string>> = new Map([
  [tool("case"), new Set(["ask", "say", "answer", "talk"])],
  [tool("channel"), new Set(["send"])],
]);

/** A call laying a word where the human sees it; the name may carry the harness's prefix (mcp__…__). */
export function speaks(name: unknown, input: unknown): boolean {
  if (typeof name !== "string") return false;
  const is = (t: string): boolean => name === t || name.endsWith(`__${t}`);
  const i = input as { action?: unknown; status?: unknown } | null;
  // The life check's answer is the seat's busy line (the stand's status), not a word lost.
  if (is(tool("stand"))) return i?.status != null;
  for (const [t, acts] of SPEAKING)
    if (is(t)) return typeof i?.action === "string" && acts.has(i.action);
  return false;
}

/** Text the delivery laid into the session: a frame, a word of its own. */
export const marked = (text: string): boolean => text.trimStart().startsWith(FRAME_MARK);

/** What a turn showed, as each harness reads it. */
export interface TurnSeen {
  /** A frame of the channel or a case started it, or entered it — one addressing the seat (quietframe.ts). */
  framed: boolean;
  /** A human word started it or entered it. */
  human: boolean;
  /** A call in it laid a word where the human sees it. */
  spoke: boolean;
  /** The assistant's text it ended with; "" — it ended otherwise. */
  text: string;
  /** When a human last wrote in the session, ms since the epoch; null — not known. */
  heard: number | null;
}

/** A human who wrote in the session this recently watches its console (#9345). */
export const WATCHED_MS = 30 * 60_000;
/** A short line without a question is a receipt, not a lost word (#9345). */
const RECEIPT_MAX = 280;
const receipt = (text: string): boolean =>
  [...text.trim()].length <= RECEIPT_MAX && !text.includes("?");

/** Whether the turn's end calls for the wake word. */
export const lostWord = (t: TurnSeen, now = Date.now()): boolean =>
  t.framed &&
  !t.human &&
  !t.spoke &&
  !!t.text.trim() &&
  !receipt(t.text) &&
  !(t.heard !== null && now - t.heard < WATCHED_MS);
