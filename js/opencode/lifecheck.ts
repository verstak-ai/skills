// The life check in an OpenCode session (case #1046; the frame — shared/seen.ts isLifeCheck).
// Its own prompt into the root session, queued (channel.ts): an idle session wakes, a running
// turn is not cut; neither the case pile, its counts nor a tact. The platform's text as is,
// the warned seat and the way to answer below it — the words the bridge prints under the frame
// everywhere (shared/frame-text.ts). A child session's seat wakes no child: its root gets a line about it,
// how to release it if the child ended — the root's own status saves no child's seat.
import { FRAME_TEXT, OPENCODE } from "../delivery/index.ts";
import { type Frame } from "../shared/channel.ts";
import { warnedSeat } from "../shared/frame-text.ts";
import { words } from "../shared/lang.ts";
import { type Place } from "./satellite.ts";

/** A life check prompt: the session (null — the freshest root), its text, its label in the log. */
export type LifePrompt = { session: string | null; text: string; what: string };

export interface LifeChecks {
  /** A child session's bridge holds `place` ("held"): the seat its life check names. */
  held(session: string, place: Place | null | undefined): void;
  gone(session: string): void;
  /** The prompt of a life check that came by `session`'s bridge (`child` — a child's own bridge). */
  prompt(session: string | null, child: boolean, frame: Frame): LifePrompt;
}

const str = (v: unknown): string =>
  typeof v === "string" ? v : typeof v === "number" ? String(v) : "";

export function createLifeChecks(parents: ReadonlyMap<string, string>): LifeChecks {
  const places = new Map<string, Place>();
  return {
    held(session, place) {
      if (place?.name) places.set(session, place);
      for (const k of places.keys()) if (places.size > 100) places.delete(k);
    },
    gone(session) {
      places.delete(session);
    },
    prompt(session, child, frame) {
      const W = words(OPENCODE);
      const id = frame.id != null ? W.frameId(String(frame.id)) : W.frameNoId();
      const what = `${W.lifeCheck()}, ${id}`;
      const p = child && session ? places.get(session) : undefined;
      // The seat the frame is addressed to (@handle:name, its id named by the bridge), else as
      // the child's bridge named its seat.
      const name = warnedSeat(frame) || (p?.name ?? "");
      if (!child || !session) {
        const T = words(FRAME_TEXT);
        const body = typeof frame.body === "string" ? frame.body : JSON.stringify(frame.body ?? "");
        return {
          session,
          text: `${body}\n\n${T.lifeCheckSeat(name)}\n${T.lifeCheckReply()}`,
          what,
        };
      }
      const text = W.lifeCheckChild(
        name,
        p?.karta ?? str(frame.karta_seq),
        p?.realm ?? str(frame.realm),
      );
      return { session: rootAbove(session, parents), text, what };
    },
  };
}

/**
 * The root above a child session: the top of its known parent chain; null — no parent known,
 * the freshest root seen takes it.
 */
export function rootAbove(session: string, parents: ReadonlyMap<string, string>): string | null {
  const visited = new Set([session]);
  let root: string | null = null;
  for (let up = parents.get(session); up && !visited.has(up); up = parents.get(up)) {
    visited.add(up);
    root = up;
  }
  return root;
}
