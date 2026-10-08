// The attention tact in an OpenCode session (graph @nks/nks-dev, node #6569; the rule — shared/seen.ts foldedTacts).
// While the session's turn is busy a tact does not join the queue — it waits for the turn's
// end, and a new one replaces the waiting one: once free, the agent sees one, the last. Busy —
// the session said busy and did not go idle yet, or a tact prompt waits untaken in its queue.
import { type ChannelEvent } from "../bridge/hold.ts";
import { envName, OPENCODE } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import { isTact, onlyTacts, tactAt } from "../shared/seen.ts";
import { type Say } from "./tools.ts";

/**
 * A tact waits for a busy turn's end no longer than this, from the first one held: OpenCode
 * may keep silent about the turn's end. The same limit lifts "busy" by an untaken tact prompt.
 */
const WAKE_HOLD_MS = Number(process.env[envName("OPENCODE_WAKE_HOLD_MS")]) || 6 * 3_600_000;

/** A queued prompt into the session; null — not delivered, inbox null — no taking id. */
type Send = (
  session: string | null,
  text: string,
  what: string,
  child: boolean,
) => Promise<{ session: string; inbox: string | null } | null>;

export interface Tacts {
  /** A stale or wake-up batch with a tact — taken here (true): delivered or waiting for the turn's end. */
  offer(session: string | null, child: boolean, ev: ChannelEvent, what: string): boolean;
  /** The session's turn is busy (session.status busy). */
  busy(session: string): void;
  /** A prompt was taken (`inbox`) or the session went idle (no id): the waiting tact goes now. */
  taken(session: string, inbox?: string): void;
  /** The session was deleted: it is not busy, and its waiting tact has nowhere to go. */
  gone(session: string): void;
  /** The plugin stops: waiting tacts go now. */
  stop(): void;
}

/** `takenEarly` — ids taken before the prompt's answer (shared with channel.ts case piles). */
export function setupTacts(
  send: Send,
  takenEarly: Set<string>,
  freshestRoot: () => string | null,
  say: Say,
): Tacts {
  const W = words(OPENCODE);
  const busy = new Set<string>();
  const queued = new Map<string, { session: string; at: number }>(); // inbox → session
  const held = new Map<
    string,
    {
      session: string | null;
      child: boolean;
      ev: ChannelEvent;
      timer: ReturnType<typeof setTimeout>;
    }
  >();

  const occupied = (id: string): boolean => {
    for (const [k, q] of queued) if (q.at + WAKE_HOLD_MS <= Date.now()) queued.delete(k);
    return busy.has(id) || [...queued.values()].some((q) => q.session === id);
  };

  function put(session: string | null, child: boolean, ev: ChannelEvent, what: string): void {
    void send(session, ev.text ?? "", what, child).then((got) => {
      if (!got?.inbox || takenEarly.delete(got.inbox)) return; // no taking id — not seen
      queued.set(got.inbox, { session: got.session, at: Date.now() });
      for (const k of queued.keys()) if (queued.size > 100) queued.delete(k);
    });
  }

  function release(id: string): void {
    const t = held.get(id);
    if (!t) return;
    held.delete(id);
    clearTimeout(t.timer);
    put(t.session, t.child, t.ev, W.tact());
  }

  return {
    offer(session, child, ev, what) {
      const id = session ?? freshestRoot();
      if (!id || !ev.frames?.some(isTact)) return false;
      const prev = held.get(id);
      const at = tactAt(ev.frames);
      const was = prev ? tactAt(prev.ev.frames) : "";
      const older = !!at && !!was && at < was; // a stale batch older than the waiting live one
      if (!onlyTacts(ev.frames) || !occupied(id)) {
        if (prev && !older) {
          clearTimeout(prev.timer);
          held.delete(id); // a tact newer than the waiting one goes now
        }
        put(session, child, ev, what);
        return true;
      }
      if (older) return true; // the waiting one is newer — this one is folded
      const timer = prev?.timer ?? setTimeout(() => release(id), WAKE_HOLD_MS);
      (timer as { unref?: () => void }).unref?.();
      held.set(id, { session, child, ev, timer });
      say(prev ? W.tactWaitsFolded() : W.tactWaits(), "info");
      return true;
    },
    busy(session) {
      busy.add(session);
      // A session deleted without idle does not hang busy forever: older ones go.
      for (const s of busy) if (busy.size > 100) busy.delete(s);
    },
    taken(session, inbox) {
      // A taken tact prompt starts a turn: the session is busy until idle, even without session.status.
      if (inbox) return void (queued.delete(inbox) && this.busy(session));
      busy.delete(session);
      for (const [k, q] of queued) if (q.session === session) queued.delete(k);
      release(session);
    },
    gone(session) {
      busy.delete(session);
      clearTimeout(held.get(session)?.timer);
      held.delete(session);
    },
    stop() {
      for (const id of [...held.keys()]) release(id);
    },
  };
}
