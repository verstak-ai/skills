// An OpenCode session's word on its turn for the seat's pulse (graph @nks/nks-dev, node #7529):
// state from service events — busy on session.execution.started (2.0.28 sends no session.status)
// or session.status busy, the end on session.execution.succeeded, failed and interrupted or
// session.status idle; turn_at — when a turn ended; read_at — when a frame the channel laid into the
// session entered a turn as text: on session.inbox.delivered of its inbox item, a steer too — it
// waits for the running tool to return (#5048). Each change goes to the session's bridge by
// method("pulse"); the bridge paces the socket. The last word is kept: a seat taken or returned
// gets it at once (seated), so a turn heard before the seat is not lost; a word the bridge
// refused stays unsent and goes again.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { method } from "../delivery/index.ts";
import { type Bridge } from "../shared/bridge-client.ts";
import { createInboxBook } from "./inbox.ts";

type State = "idle" | "busy" | "interrupted" | "failed";

interface Word {
  state?: State;
  turn_at?: string;
  read_at?: string;
}

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

/** A word the bridge refused is told again this much later, unless an event tells it first. */
const RETRY_MS = 2_000;

export function createPulseFeed(opts: {
  /** The bridge holding the session's own seat; null — no seat, nowhere to send. */
  bridgeOf: (session: string) => Bridge | null;
  /** The session holds more inbox items laid by the channel and not taken than the book awaits (inbox.ts). */
  overflow?: (session: string, waiting: number) => void;
}): PulseFeed {
  const words = new Map<string, Word>();
  const inboxes = createInboxBook(opts.overflow);
  const unsent = new Set<string>();
  const retries = new Map<string, ReturnType<typeof setTimeout>>();
  let stopped = false;

  const tell = (session: string, change: Word): void => {
    if (stopped) return;
    const was = words.get(session) ?? {};
    const now = { ...was, ...change };
    if (JSON.stringify(now) === JSON.stringify(was) && !unsent.has(session)) return;
    words.set(session, now);
    const bridge = opts.bridgeOf(session);
    // No seat yet: the word goes with the next event once a bridge holds one.
    if (!bridge) return void unsent.add(session);
    unsent.delete(session);
    void bridge.request(method("pulse"), now, { timeoutMs: 5_000 }).catch(() => {
      // Refused and still the last word: unsent, it goes with the next event or the retry.
      if (stopped || words.get(session) !== now) return;
      unsent.add(session);
      if (retries.has(session)) return;
      const t = setTimeout(() => {
        retries.delete(session);
        if (unsent.has(session)) tell(session, {});
      }, RETRY_MS);
      (t as { unref?: () => void }).unref?.();
      retries.set(session, t);
    });
  };
  const at = (): string => new Date().toISOString();
  /** A turn's end: the busy turn becomes `to`; an end already told keeps its state; idle with no turn seen — no turn_at. */
  const ended = (session: string, to: State): void => {
    const was = words.get(session)?.state;
    if (to !== "idle" || was === "busy") return tell(session, { state: to, turn_at: at() });
    if (was === undefined) tell(session, { state: "idle" });
    else if (unsent.has(session)) tell(session, {});
  };
  const unretry = (session: string): void => {
    clearTimeout(retries.get(session));
    retries.delete(session);
  };

  return {
    onEvent(ev: any): void {
      const session: unknown = ev?.data?.sessionID;
      if (typeof session !== "string") return;
      const type: unknown = ev?.type;
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
      if (!words.has(session)) return;
      unsent.add(session);
      tell(session, {});
    },
    forget(session): void {
      words.delete(session);
      unsent.delete(session);
      unretry(session);
      inboxes.forget(session);
    },
    stop(): void {
      stopped = true;
      for (const session of [...retries.keys()]) unretry(session);
      words.clear();
      inboxes.clear();
    },
  };
}

/* eslint-enable @typescript-eslint/no-explicit-any */
