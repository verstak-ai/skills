// Lead subagents' contract (leads.ts; graph @nks/nks-dev, node #6625) and the doors
// to the OpenCode context through which their words reach the parent.
/* eslint-disable @typescript-eslint/no-explicit-any -- SDK answers without a schema */
import { method } from "../delivery/index.ts";
import type { Bridge } from "../shared/bridge-client.ts";
import { W } from "./leadwords.ts";
import type { Context } from "./plugin.ts";
import { ownPlace, type Place, type SatelliteSlot } from "./satellite.ts";
import type { Say } from "./tools.ts";

export interface Leads {
  /** A child's successful call through its bridge: stood — a lead; first case entered — its errand; leaving by outcome — the end. */
  called(child: string, name: string, args: Record<string, unknown>, place?: Place | null): void;
  /** The launcher's revoke naming its lead's seat; null — not this case. */
  release(caller: string, name: string, args: Record<string, unknown>): Promise<string | null>;
  /** Released by the launcher — may not stand again. */
  released(child: string): boolean;
  /** Finally ended not by the launcher — the reason to refuse the child; otherwise undefined. */
  goneWhy(child: string): string | undefined;
  /** The child's bridge word: "held" names the seat. true — the child is ended, do not deliver to it. */
  heard(child: string, kind: unknown, place?: Place | null): boolean;
  /** A child of a previous plugin instance returns as a lead — with its errand case, said turn, last text. */
  back(child: string, was: Partial<Snapshot> & { name?: string; of?: Place | null }): void;
  /** The seat could not be returned — the bridge goes down, the parent gets a word without a wake-up. */
  fail(child: string, why: string): Promise<void>;
  /** The parent moved to another folder: the child ends here without the "ended" word. */
  away(child: string): Promise<void>;
  /** What of the lead survives a reload — into the loss marker. */
  snapshot(child: string): Snapshot;
  /** The child moved to another folder (graph @nks/nks-dev, node #6695): the lead leaves without an end. */
  handoff(child: string): Snapshot;
  /** Seat name of a live lead (no seat — the session id); not a lead — null. */
  nameOf(child: string): string | null;
  onEvent(ev: any): void;
}

export interface Snapshot {
  room: string | null;
  noted: boolean;
  last?: string;
}

export interface LeadDoors {
  say: Say;
  parentOf(child: string): Promise<string | null>;
  /**
   * Synthetic text with steer: into the running turn at the next step boundary
   * (queue into a busy session started one more turn); wake — resume an idle one.
   */
  tell(session: string, text: string, wake: boolean): Promise<void>;
  /** The child's bridge ends its run (usage first, then the end method); the answer — seats left unrevoked, null — unknown. */
  close(child: string): Promise<string[] | null>;
  /** The session is marked ended while its bridge still finishes the run: any write is refused. */
  seal(child: string): void;
  end(child: string): Promise<void>;
  /** The child's seat name when it is not its satellite; satellite or no seat — null. */
  ownPlace(child: string): string | null;
}

/** The end of a run by the child's bridge — no longer than this. */
const END_MS = 5_000;

/**
 * The parent is the session's parentID (public Session API; it also restores the
 * link after a reload); resume=false schedules no turn, the word waits for the next.
 */
export function leadDoors(
  ctx: Context,
  say: Say,
  flush: (session: string) => Promise<void>,
  end: (child: string, out?: ((s: string) => void) | null) => void,
  slots: Map<string, SatelliteSlot & { child?: boolean; bridge: Pick<Bridge, "request"> }>,
): LeadDoors {
  return {
    say,
    ownPlace: (child) => ownPlace(slots.get(child)),
    async close(child) {
      // Ends the run after the word to the parent; a failed seat release is a separate word.
      await flush(child).catch(() => {});
      const got: any = await slots
        .get(child)
        ?.bridge.request(method("end"), {}, { timeoutMs: END_MS, service: true })
        .catch(() => null);
      return got?.ended ? (got.failed ?? []) : null;
    },
    seal: (child) => end(child, null),
    async end(child) {
      end(child);
    },
    async parentOf(child) {
      const s: any = await ctx.session.get({ sessionID: child } as any);
      return s?.parentID ?? s?.data?.parentID ?? null;
    },
    tell: teller(ctx, say),
  };
}

/** Synthetic text (no synthetic — prompt) with steer; wake — resume. */
export function teller(ctx: Context, say: Say): LeadDoors["tell"] {
  return async (sessionID, text, wake) => {
    const s: any = ctx.session;
    const delivery = "steer";
    try {
      if (typeof s.synthetic === "function")
        await s.synthetic({ sessionID, text, delivery, resume: wake });
      else await s.prompt({ sessionID, text, delivery, resume: wake });
      say(W().tellDone(sessionID), "info");
    } catch (e) {
      say(W().tellFailed(sessionID, (e as Error).message), "error");
    }
  };
}

/* eslint-enable @typescript-eslint/no-explicit-any */
