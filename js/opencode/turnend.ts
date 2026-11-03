// The turn's end on a watch in OpenCode (shared/turnend.ts, graph @nks/nks-dev, node #9342): the
// plugin lays the frames itself, so it knows a turn they started. A frame enters a turn when
// OpenCode takes its inbox item (at once when the prompt names none; a taking heard before the
// prompt's answer named the item is kept for it, inbox.ts); a prompt without the delivery's mark
// is a human's word; a completed call that speaks (case ask, say, answer, talk; channel send) is
// the word laid; the turn's text is its last session.text.ended after the last call. At the
// turn's end — session.execution.succeeded, or the deprecated session.idle — a frame's turn that
// lost its word gets the wake word queued, once: the turn that takes the wake word's own inbox
// item is exempt, whatever else entered it — not the next turn, which may be a waiting frame's.
// A wake word with no item named exempts nothing: the turn it starts has no frame of its own.
/* eslint-disable @typescript-eslint/no-explicit-any -- SDK events without a schema */
import { TURN } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import { lostWord, marked, speaks, type TurnSeen } from "../shared/turnend.ts";
import { createInboxBook } from "./inbox.ts";
import type { Context } from "./plugin.ts";

const ENDS = new Set<unknown>(["session.execution.succeeded", "session.idle"]);
/** A turn's end that is no turn of a frame left alone: its state goes, no word. */
const CUTS = new Set<unknown>(["session.execution.failed", "session.execution.interrupted"]);

export interface TurnEnds {
  /** The channel laid a frame into the session; inbox — its inbox item, if OpenCode named one. */
  laid: (session: string, inbox: string | null) => void;
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
  // woken — the wake word's own inbox item entered the turn.
  const turns = new Map<string, TurnSeen & { woken: boolean }>();
  // The frames' and the wake words' inbox items, until a turn takes them.
  const frames = createInboxBook();
  const wakes = createInboxBook();
  const turn = (s: string): TurnSeen & { woken: boolean } => {
    let t = turns.get(s);
    if (!t)
      turns.set(s, (t = { framed: false, human: false, spoke: false, text: false, woken: false }));
    return t;
  };

  async function end(s: string): Promise<void> {
    const t = turns.get(s);
    turns.delete(s);
    if (!t || t.woken || !lostWord(t) || opts.skip(s) || !(await opts.on(s))) return;
    try {
      const r: any = await ctx.session.prompt({
        sessionID: s,
        text: words(TURN).wake(),
        delivery: "queue",
      });
      const inbox: unknown = r?.id ?? r?.data?.id;
      if (typeof inbox === "string" && wakes.prompted(s, inbox)) turn(s).woken = true;
    } catch (e) {
      opts.say(words(TURN).notLaid(s, (e as Error).message));
    }
  }

  return {
    laid(session, inbox) {
      if (!inbox || frames.prompted(session, inbox)) turn(session).framed = true;
    },
    prompt(session, text) {
      if (!marked(text)) turn(session).human = true;
    },
    async wire() {
      const tool = (ctx as Partial<Pick<Context, "tool">>).tool;
      if (typeof tool?.hook !== "function") return;
      await tool.hook("execute.after", (c) => {
        const t = turn(String(c.sessionID));
        t.text = false;
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
        else if (wakes.delivered(s, inbox)) turn(s).woken = true;
      } else if (type === "session.inbox.cancelled") {
        if (typeof inbox !== "string") return;
        frames.cancelled(s, inbox);
        wakes.cancelled(s, inbox);
      } else if (type === "session.text.ended") {
        if (typeof ev.data?.text === "string" && ev.data.text.trim()) turn(s).text = true;
      } else if (ENDS.has(type)) void end(s);
      else if (CUTS.has(type)) turns.delete(s);
    },
    forget(session) {
      turns.delete(session);
      frames.forget(session);
      wakes.forget(session);
    },
  };
}
