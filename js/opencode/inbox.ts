// Which inbox items an OpenCode session awaits, for the seat's pulse read_at (graph @nks/nks-dev,
// node #7529): a frame the channel laid is read when OpenCode takes its inbox item
// (session.inbox.delivered). The prompt's answer, the taking and the cancelling race each other:
// a taking or a cancelling may come before the answer that names the item, so both are remembered
// by the session until the answer comes.

/**
 * Per session. Taken before the channel's answer is mostly the session's own prompts, never
 * answered by the channel: past TAKEN_MAX the oldest goes. Cancelled before the answer is rare and
 * as bounded. Laid and not taken yet is awaited and never pushed out: past QUEUED_MAX it is only told.
 */
const TAKEN_MAX = 100;
const CANCELLED_MAX = 100;
const QUEUED_MAX = 100;

type Book = Map<string, Set<string>>;

const add = (m: Book, session: string, inbox: string, max = Infinity): number => {
  const ids = m.get(session) ?? new Set<string>();
  m.set(session, ids.add(inbox));
  if (ids.size > max) ids.delete(ids.values().next().value as string);
  return ids.size;
};

/** True — the inbox id was the session's and is gone now. */
const drop = (m: Book, session: string, inbox: string): boolean => {
  const ids = m.get(session);
  if (!ids?.delete(inbox)) return false;
  if (!ids.size) m.delete(session);
  return true;
};

export interface InboxBook {
  /** OpenCode took the item into a turn: true — a frame awaited, read now. */
  delivered: (session: string, inbox: string) => boolean;
  /** OpenCode cancelled the item: never taken, not awaited any more. */
  cancelled: (session: string, inbox: string) => void;
  /** The prompt's answer named the frame's item: true — already taken, read now. */
  prompted: (session: string, inbox: string) => boolean;
  forget: (session: string) => void;
  clear: () => void;
}

export function createInboxBook(
  /** The session holds more items laid by the channel and not taken than QUEUED_MAX. */
  overflow?: (session: string, waiting: number) => void,
): InboxBook {
  // session → inbox ids: laid by the channel, not taken yet; taken or cancelled before the answer
  const queued: Book = new Map();
  const taken: Book = new Map();
  const cancelled: Book = new Map();
  const books = [queued, taken, cancelled];
  return {
    delivered(session, inbox) {
      if (drop(queued, session, inbox)) return true;
      add(taken, session, inbox, TAKEN_MAX);
      return false;
    },
    cancelled(session, inbox) {
      if (!drop(queued, session, inbox)) add(cancelled, session, inbox, CANCELLED_MAX);
    },
    prompted(session, inbox) {
      if (drop(taken, session, inbox)) return true;
      if (drop(cancelled, session, inbox)) return false;
      const waiting = add(queued, session, inbox);
      if (waiting === QUEUED_MAX + 1) overflow?.(session, waiting);
      return false;
    },
    forget(session) {
      for (const m of books) m.delete(session);
    },
    clear() {
      for (const m of books) m.clear();
    },
  };
}
