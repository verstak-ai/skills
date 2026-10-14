// The model a session runs on, by the harness — for a satellite's stand (graph @nks/nks-dev,
// node #7591): the seat names the subagent's model from OpenCode, not from the agent's words.
// The last step's model (session.step.started — the source of usage, usage.ts) beats the
// session's own (session.get), which is all there is before the first step, at a launch line.
/* eslint-disable @typescript-eslint/no-explicit-any -- SDK events and answers without a schema */
import { createSeatRealms, type SeatRealms, withHarnessModel } from "../shared/seatmodel.ts";
import type { Context } from "./plugin.ts";

export interface Models {
  onEvent(ev: any): void;
  /** A channel word of the bridge `of`: the graphs of its seats (SeatRealms); returns the word's kind. */
  seen(of: object, data: any): any;
  /**
   * A satellite's stand arguments get the session's model in place of the agent's, none if the
   * harness names none; others are not touched. `of` — the bridge the call goes by: the graphs
   * it holds seats in decide whether a busy line goes alone.
   */
  name(args: Record<string, unknown>, session: string, of: object): Promise<void>;
}

const idOf = (m: any): string | null =>
  typeof m?.id === "string" && m.id.trim() ? m.id.trim() : null;

export function createModels(ctx: Context): Models {
  const stepped = new Map<string, string>();
  const seats = new WeakMap<object, SeatRealms>();
  const seatsOf = (of: object): SeatRealms => {
    const s = seats.get(of) ?? createSeatRealms();
    seats.set(of, s);
    return s;
  };
  /** The session's model id; null — the harness does not name one. */
  async function of(session: string): Promise<string | null> {
    const step = stepped.get(session);
    if (step) return step;
    try {
      const res: any = await ctx.session.get({ sessionID: session } as any);
      return idOf(res?.model ?? res?.data?.model);
    } catch {
      return null;
    }
  }
  return {
    onEvent(ev) {
      const session = ev?.data?.sessionID;
      if (typeof session !== "string") return;
      if (ev.type === "session.deleted") stepped.delete(session);
      const id = ev.type === "session.step.started" ? idOf(ev.data?.model) : null;
      if (id) stepped.set(session, id);
    },
    seen(bridge, data) {
      seatsOf(bridge).see(data);
      return data?.kind;
    },
    async name(args, session, bridge) {
      if (!args.satellite_of) return;
      const next = withHarnessModel(args, await of(session), seatsOf(bridge).realms());
      delete args.model;
      Object.assign(args, next);
    },
  };
}

/* eslint-enable @typescript-eslint/no-explicit-any */
