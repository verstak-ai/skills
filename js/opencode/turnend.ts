// The turn's end on a watch in OpenCode (shared/turnend.ts, graph @nks/nks-dev, nodes #9342,
// #9345): the plugin lays the frames itself, so it knows a turn they started — counts with
// nothing addressed to the seat are no frame (quietframe.ts). A frame enters a turn when
// OpenCode takes its inbox item (at once when the prompt names none; a taking heard before the
// prompt's answer named the item is kept for it, inbox.ts); a prompt without the delivery's mark
// is a human's word, and its time outlives the turn; a completed call that speaks (case ask,
// say, answer, talk; channel send) is the word laid; the turn's text is its session.text.ended
// after the last call. At the
// turn's end — session.execution.succeeded, or the deprecated session.idle — a frame's turn that
// lost its word gets the wake word in the service's log and the session's next completed tool
// reply, once; the plugin opens no turn of its own (#11359, replynotes.ts).
/* eslint-disable @typescript-eslint/no-explicit-any -- SDK events without a schema */
import { TURN } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import { quiet } from "../shared/quietframe.ts";
import { lostWord, marked, speaks, type TurnSeen } from "../shared/turnend.ts";
import { createInboxBook } from "./inbox.ts";
import type { Context } from "./plugin.ts";
import { putNote } from "./replynotes.ts";

const ENDS = new Set<unknown>(["session.execution.succeeded", "session.idle"]);
/** A turn's end that is no turn of a frame left alone: its state goes, no word. */
const CUTS = new Set<unknown>(["session.execution.failed", "session.execution.interrupted"]);

/** A frame's text the channel laid into the session (the seat's pulse, pulse.ts; the turn's end here). */
export type Laid = (
  session: string,
  inbox: string | null,
  delivery: "steer" | "queue",
  text: string,
) => void;

export interface TurnEnds {
  /** The channel laid a frame's text into the session; inbox — its inbox item, if OpenCode named one. */
  laid: (session: string, inbox: string | null, text: string) => void;
  /** A prompt passed the prompt hook. */
  prompt: (session: string, text: string) => void;
  /** The tool hook that sees the session's calls end. */
  wire: () => Promise<void>;
  onEvent: (ev: any) => void;
  forget: (session: string) => void;
}

export function createTurnEnds(
  ctx: Context,
  opts: {
    /** A session the wake word is not for: a child, a stopped or ended one. */
    skip: (session: string) => boolean;
    /** The ritual is switched on for the session (the cover's list of rituals). */
    on: (session: string) => Promise<boolean>;
    say: (text: string) => void;
  },
): TurnEnds {
  const turns = new Map<string, TurnSeen>();
  // When a human last wrote in each session: it outlives the turn.
  const heard = new Map<string, number>();
  // The frames' inbox items, until a turn takes them.
  const frames = createInboxBook();
  const turn = (s: string): TurnSeen => {
    let t = turns.get(s);
    if (!t) {
      t = { framed: false, human: false, spoke: false, text: "", heard: null };
      turns.set(s, t);
    }
    return t;
  };

  async function end(s: string): Promise<void> {
    const t = turns.get(s);
    turns.delete(s);
    if (!t) return;
    if (!lostWord({ ...t, heard: heard.get(s) ?? null })) return;
    if (opts.skip(s) || !(await opts.on(s)) || opts.skip(s)) return;
    // A turn opens only by a server frame passed as is (#11359): the word goes to the log and
    // rides the session's next completed tool reply (replynotes.ts), no prompt.
    opts.say(words(TURN).logged(s, words(TURN).wake()));
    putNote(s, words(TURN).wake());
  }

  return {
    laid(session, inbox, text) {
      if (quiet(text)) return;
      if (!inbox || frames.prompted(session, inbox)) turn(session).framed = true;
    },
    prompt(session, text) {
      if (marked(text)) return;
      turn(session).human = true;
      heard.set(session, Date.now());
    },
    async wire() {
      const tool = (ctx as Partial<Pick<Context, "tool">>).tool;
      if (typeof tool?.hook !== "function") return;
      await tool.hook("execute.after", (c) => {
        const t = turn(String(c.sessionID));
        t.text = "";
        if (c.status === "completed" && speaks(c.tool, c.input)) t.spoke = true;
      });
    },
    onEvent(ev) {
      const s: unknown = ev?.data?.sessionID;
      if (typeof s !== "string") return;
      const type: unknown = ev?.type;
      const inbox: unknown = ev.data?.inboxID;
      if (type === "session.inbox.delivered") {
        if (typeof inbox !== "string") return;
        if (frames.delivered(s, inbox)) turn(s).framed = true;
      } else if (type === "session.inbox.cancelled") {
        if (typeof inbox !== "string") return;
        frames.cancelled(s, inbox);
      } else if (type === "session.text.ended") {
        const said: unknown = ev.data?.text;
        if (typeof said !== "string" || !said.trim()) return;
        const t = turn(s);
        t.text = t.text ? `${t.text}\n${said}` : said;
      } else if (ENDS.has(type)) void end(s);
      else if (CUTS.has(type)) turns.delete(s);
    },
    forget(session) {
      turns.delete(session);
      heard.delete(session);
      frames.forget(session);
    },
  };
}
