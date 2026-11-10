// A compacted session keeps its role: the compaction request's system tells the summary to keep
// the role, the seat and the live cases, and the same hook marks the session; the first eligible primary
// request after it ("context" hook, @opencode/plugin 2.0.4 — graph @nks/nks-dev, node #5048)
// carries ONE word about the role in its system. The generation is consumed only after the
// complete system block is assembled (#10112): a missing seat or failed slice leaves it pending.
// Cancellation invalidates awaiting contexts; concurrent contexts commit only once. This proves
// system insertion, not provider delivery or the model's reading. An inbox word arrives a step late.
/* eslint-disable @typescript-eslint/no-explicit-any -- SDK events without a schema */
import { COMPACTION } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import type { Place } from "./satellite.ts";
import type { Say } from "./tools.ts";

const FAILED = "session.compaction.failed";

export interface CompactionDoors {
  /** The seat the session's own bridge holds; none — null. */
  placeOf(session: string): Place | null;
  /** Stopped by the owner or an ended lead: no word (halts.ts, #7505). */
  closed(session: string): boolean;
  /** The human's rules read by the session's bridge (mindslice.ts); no bridge — null. */
  slice(session: string): Promise<string> | null;
  say: Say;
}

interface Req {
  sessionID: unknown;
  system: any[];
}

interface Generation {
  /** undefined after a rejected read: the next context must read again. */
  rules: Promise<string> | null | undefined;
}

export function createCompaction(doors: CompactionDoors) {
  const W = () => words(COMPACTION);
  // Session → the human's rules being read since its compaction began (#9817): ready by the next request.
  const pending = new Map<string, Generation>();
  const seated = (s: string): Place | null => (doors.closed(s) ? null : doors.placeOf(s));
  const read = (s: string): Promise<string> | null => {
    let rules: Promise<string> | null;
    try {
      rules = doors.slice(s);
    } catch (e) {
      rules = Promise.reject(e);
    }
    // Reading starts before a context is ready to await it; never leave an unhandled rejection.
    void rules?.catch(() => {});
    return rules;
  };

  return {
    /** The "compaction" hook: what the summary must keep; the session waits for its word. */
    instruct(req: Req): void {
      const s = String(req.sessionID);
      const p = seated(s);
      if (!p) return; // a session without a seat keeps no mark
      req.system.push({ type: "text", text: W().keep(p.karta, p.name, p.realm) });
      if (!pending.has(s)) pending.set(s, { rules: read(s) }); // retries keep their generation
    },
    /** The "context" hook: the first eligible request after a compaction carries the complete word. */
    async tell(req: Req): Promise<void> {
      const s = String(req.sessionID);
      const generation = pending.get(s);
      if (!generation) return;
      if (doors.closed(s)) {
        pending.delete(s);
        return;
      }
      if (!doors.placeOf(s)) return;
      if (generation.rules === undefined) generation.rules = read(s);
      const rules = generation.rules;
      let text: string | null;
      try {
        text = rules ? await rules : null;
      } catch (e) {
        if (pending.get(s) !== generation) return;
        if (generation.rules === rules) generation.rules = undefined;
        if (doors.closed(s)) {
          pending.delete(s);
          return;
        }
        throw e;
      }
      if (pending.get(s) !== generation) return;
      if (doors.closed(s)) {
        pending.delete(s);
        return;
      }
      const p = doors.placeOf(s);
      if (!p) return;
      const block = [{ type: "text", text: W().back(p.karta, p.name, p.realm) }];
      if (text) block.push({ type: "text", text });
      // No await between the generation check, full insertion and consumption.
      req.system.push(...block);
      pending.delete(s);
      doors.say(W().returned(s), "info");
    },
    onEvent(ev: any): void {
      if (ev?.type === FAILED && typeof ev.data?.sessionID === "string")
        pending.delete(ev.data.sessionID);
    },
    forget: (session: string): void => void pending.delete(session),
    sweep(): void {
      for (const s of pending.keys()) if (doors.closed(s)) pending.delete(s);
    },
  };
}

/* eslint-enable @typescript-eslint/no-explicit-any */
