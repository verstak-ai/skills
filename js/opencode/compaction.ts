// A compacted session keeps its role: the compaction request's system tells the summary to keep
// the role, the seat and the live cases, and the same hook marks the session; the FIRST primary
// request after it ("context" hook, @opencode/plugin 2.0.4 — graph @nks/nks-dev, node #5048)
// carries ONE word about the role in its system. The mark is set while OpenCode builds the
// compaction request, so no race with the event stream; an inbox word arrives a step late and
// costs a model step of its own. Only a session whose bridge holds a seat; a stopped or ended one
// gets nothing.
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
  say: Say;
}

interface Req {
  sessionID: unknown;
  system: any[];
}

export function createCompaction(doors: CompactionDoors) {
  const W = () => words(COMPACTION);
  const pending = new Set<string>();
  const seated = (s: string): Place | null => (doors.closed(s) ? null : doors.placeOf(s));

  return {
    /** The "compaction" hook: what the summary must keep; the session waits for its word. */
    instruct(req: Req): void {
      const s = String(req.sessionID);
      const p = seated(s);
      if (!p) return; // a session without a seat keeps no mark
      req.system.push({ type: "text", text: W().keep(p.karta, p.name, p.realm) });
      pending.add(s);
    },
    /** The "context" hook: the first primary request after a compaction carries the word. */
    tell(req: Req): void {
      const s = String(req.sessionID);
      if (!pending.delete(s)) return;
      const p = seated(s);
      if (!p) return;
      req.system.push({ type: "text", text: W().back(p.karta, p.name, p.realm) });
      doors.say(W().returned(s), "info");
    },
    onEvent(ev: any): void {
      if (ev?.type === FAILED && typeof ev.data?.sessionID === "string")
        pending.delete(ev.data.sessionID);
    },
    forget: (session: string): void => void pending.delete(session),
  };
}

/* eslint-enable @typescript-eslint/no-explicit-any */
