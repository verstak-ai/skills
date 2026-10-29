// An OpenCode session's word on its turn for the seat's pulse (graph @nks/nks-dev, node #7529):
// state from service events — busy on session.execution.started (2.0.28 sends no session.status)
// or session.status busy, the end on session.execution.succeeded, failed and interrupted or
// session.status idle; turn_at — when a turn ended; read_at — when a frame the channel laid into the
// session entered a turn as text: on session.inbox.delivered of its inbox item, a steer too — it
// waits for the running tool to return (#5048); act_at — the session's own tool, output, reasoning,
// shell and step events, deltas included (ACTS), never state, inbox or another session's events.
// Each change goes to the session's bridge by its word line (shared/pulseword.ts); the bridge
// paces the socket. The last word is kept: a seat taken or returned gets it at once (seated), so
// a turn heard before the seat is not lost; a word the bridge refused goes again.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { type Bridge } from "../shared/bridge-client.ts";
import { type TurnWord, type WordLine, wordLine } from "../shared/pulseword.ts";
import { createInboxBook } from "./inbox.ts";

type State = "idle" | "busy" | "interrupted" | "failed";

/** Movement of the session's own turn (@opencode/schema event-manifest, plugin 2.0.4, #5048). */
const ACTS = new Set<unknown>([
  "session.tool.input.started",
  "session.tool.input.delta",
  "session.tool.input.ended",
  "session.tool.called",
  "session.tool.progress",
  "session.tool.success",
  "session.tool.failed",
  "session.text.started",
  "session.text.delta",
  "session.text.ended",
  "session.reasoning.started",
  "session.reasoning.delta",
  "session.reasoning.ended",
  "session.shell.started",
  "session.shell.ended",
  "session.step.ended",
  "session.step.failed",
]);

export interface PulseFeed {
  onEvent: (ev: any) => void;
  /** The channel laid a frame into the session: read when OpenCode takes its inbox item, steer or queue. */
  prompted: (session: string, inbox: string | null) => void;
  /** The session's bridge took or returned its seat: the last word goes to it now. */
  seated: (session: string) => void;
  forget: (session: string) => void;
  stop: () => void;
}

const ENDS = new Map<unknown, State>([
  ["session.execution.succeeded", "idle"],
  ["session.execution.failed", "failed"],
  ["session.execution.interrupted", "interrupted"],
]);

export function createPulseFeed(opts: {
  /** The bridge holding the session's own seat; null — no seat, nowhere to send. */
  bridgeOf: (session: string) => Bridge | null;
  /** The session holds more inbox items laid by the channel and not taken than the book awaits (inbox.ts). */
  overflow?: (session: string, waiting: number) => void;
}): PulseFeed {
  const lines = new Map<string, WordLine>();
  const inboxes = createInboxBook(opts.overflow);
  let stopped = false;

  const tell = (session: string, change: TurnWord): void => {
    if (stopped) return;
    let line = lines.get(session);
    if (!line) lines.set(session, (line = wordLine(() => opts.bridgeOf(session))));
    line.tell(change);
  };
  const at = (): string => new Date().toISOString();
  /** A turn's end: the busy turn becomes `to`; an end already told keeps its state; idle with no turn seen — no turn_at. */
  const ended = (session: string, to: State): void => {
    const was = lines.get(session)?.word().state;
    if (to !== "idle" || was === "busy") return tell(session, { state: to, turn_at: at() });
    tell(session, was === undefined ? { state: "idle" } : {});
  };

  return {
    onEvent(ev: any): void {
      const session: unknown = ev?.data?.sessionID;
      if (typeof session !== "string") return;
      const type: unknown = ev?.type;
      if (ACTS.has(type)) return tell(session, { act_at: at() });
      const end = ENDS.get(type);
      if (end) return ended(session, end);
      switch (type) {
        case "session.execution.started":
          return tell(session, { state: "busy" });
        case "session.status": {
          const s: unknown = ev.data?.status?.type;
          if (typeof s !== "string") return;
          if (s === "idle") ended(session, "idle");
          else tell(session, { state: "busy" });
          return;
        }
        case "session.idle":
          return ended(session, "idle");
        case "session.inbox.delivered": {
          const inbox: unknown = ev.data?.inboxID;
          if (typeof inbox === "string" && inboxes.delivered(session, inbox))
            tell(session, { read_at: at() });
          return;
        }
        case "session.inbox.cancelled": {
          const inbox: unknown = ev.data?.inboxID;
          if (typeof inbox === "string") inboxes.cancelled(session, inbox);
          return;
        }
      }
    },
    prompted(session, inbox): void {
      if (inbox && inboxes.prompted(session, inbox)) tell(session, { read_at: at() });
    },
    seated(session): void {
      lines.get(session)?.again();
    },
    forget(session): void {
      lines.get(session)?.drop();
      lines.delete(session);
      inboxes.forget(session);
    },
    stop(): void {
      stopped = true;
      for (const line of lines.values()) line.drop();
      lines.clear();
      inboxes.clear();
    },
  };
}

/* eslint-enable @typescript-eslint/no-explicit-any */
