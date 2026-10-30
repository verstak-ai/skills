// Lead subagents' contract (leads.ts; graph @nks/nks-dev, node #6625) and the doors
// to the OpenCode context through which their words reach the parent.
/* eslint-disable @typescript-eslint/no-explicit-any -- SDK answers without a schema */
import { method } from "../delivery/index.ts";
import type { Bridge } from "../shared/bridge-client.ts";
import { markFrame } from "../shared/frame-text.ts";
import type { SeatKey } from "../shared/seat.ts";
import { authDir } from "./bridge-io.ts";
import { casesLeft } from "./casesleft.ts";
import { createEnds, type Ends } from "./leadends.ts";
import type { Up } from "./leadframes.ts";
import { W } from "./leadwords.ts";
import type { Context } from "./plugin.ts";
import { ownPlace, type Place, type SatelliteSlot } from "./satellite.ts";
import type { Say } from "./tools.ts";

export interface Leads {
  /**
   * A child's call went to its bridge: the turn that carries it is live even when this
   * instance missed its execution.started (#1237 — the deciding instance sits in another
   * folder) — a leave answered inside it waits for the turn's end and its final text.
   */
  dispatched(child: string, name: string, args: Record<string, unknown>): void;
  /** A child's successful call through its bridge: stood — a lead; cases entered — its errand; leaving the last — the end. */
  called(child: string, name: string, args: Record<string, unknown>, place?: Place | null): void;
  /**
   * The launcher's revoke naming its lead's seat ends the child; null — not this case. The
   * launcher's own revoke follows by its bridge (tools.ts): the seat goes on the platform —
   * unless the child's bridge revoked that very seat — graph, role, name — itself at its run's
   * end (off, #7599, №664).
   */
  release(caller: string, name: string, args: Record<string, unknown>): Promise<Released | null>;
  /** Ended or ending by any end: nothing is laid into its session any more (#7505). */
  ended(child: string): boolean;
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
  /** What of the lead survives a reload — into the loss marker. */
  snapshot(child: string): Snapshot;
  /** The child moved to another folder (graph @nks/nks-dev, node #6695): the lead leaves without an end. */
  handoff(child: string): Snapshot;
  /** Seat name of a live lead (no seat — the session id); not a lead — null. */
  nameOf(child: string): string | null;
  /** A live lead's parent session, once known; otherwise null. */
  upOf(child: string): Up | null;
  onEvent(ev: any): void;
}

/** A lead ended by its launcher's revoke: the word and its seat; off — its bridge revoked the seat itself. */
export interface Released {
  word: string;
  place: Place | null;
  off: boolean;
}

/**
 * The child's bridge at its run's end: names left unrevoked and seats it revoked itself — by
 * canonical graph, role and name (№664).
 */
export interface RunEnd {
  failed: string[];
  revoked: SeatKey[];
}

/** Its cases are not here: whether a leave is the last, the platform says (casesleft.ts). */
export interface Snapshot {
  noted: boolean;
  last?: string;
  /** A leave accepted and waiting for its turn's end — it must survive a reload (№1317 [19]). */
  leaving?: string;
}

export interface LeadDoors {
  say: Say;
  parentOf(child: string): Promise<string | null>;
  /**
   * Synthetic text with steer: into the running turn at the next step boundary
   * (queue into a busy session started one more turn); wake — resume an idle one.
   */
  tell(session: string, text: string, wake: boolean): Promise<void>;
  /** The child's bridge ends its run (usage first, then the end method); null — unknown. */
  close(child: string): Promise<RunEnd | null>;
  /** How many cases the child's session sits in, by the platform (casesleft.ts); unasked or unread — a throw with the reason. */
  sits(child: string, realm: string): Promise<number>;
  /** The session is marked ended while its bridge still finishes the run: any write is refused. */
  seal(child: string): void;
  end(child: string): Promise<void>;
  /** The child's seat name when it is not its satellite; satellite or no seat — null. */
  ownPlace(child: string): string | null;
  /** Ended leads of every instance of the process, past a reload (leadends.ts). */
  ends: Ends;
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
  closed: Closed = () => false,
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
      if (!got?.ended) return null;
      // A bare name (an older bridge) is no seat: it confirms nothing.
      const revoked = (got.revoked ?? []).filter((k: any) => typeof k?.name === "string");
      return { failed: got.failed ?? [], revoked };
    },
    sits: (child, realm) => casesLeft(slots.get(child)?.bridge, realm),
    seal: (child) => end(child, null),
    async end(child) {
      end(child);
    },
    parentOf: (child) => parentOf(ctx, child),
    tell: teller(ctx, say, closed),
    ends: createEnds(
      authDir,
      (s, message) => say(W().endUnwritten(s, message), "warning"),
      (s, message) => say(W().endUnlifted(s, message), "warning"),
    ),
  };
}

/** The session gets no word any more: an ended lead, a stopped session (#7505, #7440). */
export type Closed = (session: string) => boolean;

async function parentOf(ctx: Context, child: string): Promise<string | null> {
  const s: any = await ctx.session.get({ sessionID: child } as any);
  return s?.parentID ?? s?.data?.parentID ?? null;
}

/**
 * Synthetic text (no synthetic — prompt) with steer; wake — resume. A closed addressee gets
 * nothing — the word would wake it past the channel's ban (#7505): it goes up the parentID chain
 * to the nearest live ancestor without waking it; none — the journal.
 */
export function teller(ctx: Context, say: Say, closed: Closed = () => false): LeadDoors["tell"] {
  return async (sessionID, text, wake) => {
    const s: any = ctx.session;
    const delivery = "steer";
    for (const seen = new Set<string>(); closed(sessionID); wake = false) {
      seen.add(sessionID);
      const up = await parentOf(ctx, sessionID).catch(() => null);
      if (!up || seen.has(up)) return say(W().noLiveAncestor(text), "warning");
      sessionID = up;
    }
    text = markFrame(text);
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
