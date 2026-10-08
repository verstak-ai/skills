// A lead subagent (graph @nks/nks-dev, node #6625; #6550, rule 4): a child session that stood
// on its own seat lives until its errand's outcome, not until its turn's end. Its end is an
// explicit act: leaving by the outcome (leave of its errand case — the first it joined —,
// leaving all cases, or channel leave), the launcher's revoke of its seat, a cancel of its own
// turn in OpenCode (not a parent's cancel that cut it by cascade — cascade.ts), the session's
// deletion. No idle ceiling: waiting for a human is not neglect. A plugin reload is no end:
// the child returns (children.ts). At the end the child's bridge goes down, the outcome goes
// to the parent as a synthetic message. Contract — leaddoors.ts, words — leadwords.ts.

import { tool } from "../delivery/index.ts";
import { createCascade } from "./cascade.ts";
import type { LeadDoors, Leads } from "./leaddoors.ts";
import { awayWord, endWord, unrevokedWord, W } from "./leadwords.ts";
import { type Place, standsBy } from "./satellite.ts";

interface Lead {
  parent: Promise<string | null>;
  place?: Place;
  room?: string; // the errand case — its number without a sign
  running?: boolean;
  noted?: boolean;
  leaving?: string; // leaving said mid-turn — the end waits for the turn's end and its text
  last?: string;
}

const roomNo = (room: unknown): string => String(room ?? "").replace(/^\s*[#№]\s*|\s+$/g, "");
const names = (place: Place | undefined, child: string, s: string): boolean =>
  s === child || (!!place?.name && (s === place.name || s.endsWith(`:${place.name}`)));

export function createLeads(d: LeadDoors): Leads {
  const leads = new Map<string, Lead>();
  // Finally ended: released by the launcher (no reason), cancelled, taken down by the platform — with a reason.
  const gone = new Map<string, string | undefined>();
  const over = new Set<string>(); // ended by any end, until they stand again
  const cascade = createCascade();
  const who = (l: Lead, child: string): string => l.place?.name ?? W().sessionOf(child);
  const parentOf = (child: string) => d.parentOf(child).catch(() => null);

  /**
   * The end: the outcome to the parent, then the bridge ends its run and goes down (ended).
   * The outcome wakes and goes steer: OpenCode's own synthetic on the child's quiet wakes the
   * parent first, and a queued word would land only after its turn. A cancel, an unreturned
   * seat (lost) and the parent's move (away — no "ended") do not wake.
   */
  async function finish(
    child: string,
    why: string,
    ended = true,
    wake = true,
    kind: "end" | "lost" | "away" = "end",
  ) {
    const l = leads.get(child);
    if (!l) return;
    leads.delete(child);
    over.add(child);
    // The end takes down only the child's satellite: a plain seat that stood instead stays.
    const kept = ended && kind === "end" ? d.ownPlace(child) : null;
    if (kept) d.say(W().keptSaid(who(l, child), kept), "warning");
    // Ended from the first word: while the bridge ends its run, the child's write is a refusal (№147).
    if (ended && !kept) d.seal(child);
    const parent = await l.parent;
    const last = (l.last ?? "").trim();
    const tell = async (text: string, wakes: boolean) => {
      if (parent) await d.tell(parent, text, wakes);
      else d.say(W().noParent(text), "warning");
    };
    await tell(
      kind === "lost"
        ? W().lost(who(l, child), why)
        : kind === "away"
          ? awayWord(who(l, child), last)
          : endWord(who(l, child), why, last, kept),
      wake,
    );
    if (!ended || kept) return;
    // The bridge ends its run after the word: after it, the word landed later than OpenCode's
    // synthetic and the parent woke twice (№147). A failed release is a correction that does not wake.
    const failed = await d.close(child).catch(() => null);
    await d.end(child).catch((e: Error) => d.say(W().notDown(who(l, child), e.message), "warning"));
    if (kind !== "lost" && (failed === null || failed.length))
      await tell(unrevokedWord(who(l, child), failed), false);
  }

  function leave(child: string, l: Lead, why: string): void {
    l.leaving = why;
    if (!l.running) void finish(child, why);
  }

  function stood(child: string): Lead {
    const l = leads.get(child) ?? { parent: parentOf(child) };
    leads.set(child, l);
    over.delete(child);
    return l;
  }

  function touch(l: Lead | undefined, place?: Place | null): l is Lead {
    if (!l) return false;
    if (place) l.place = place;
    return true;
  }

  return {
    called(child, name, args, place) {
      if (gone.has(child)) return;
      const l = standsBy(name, args) ? stood(child) : leads.get(child);
      if (!touch(l, place)) return;
      const room = name === tool("case") || name === tool("room") ? roomNo(args.room) : null;
      if (args.action === "join" && room) l.room ??= room;
      if (args.action !== "leave") return;
      if (name === tool("channel")) leave(child, l, W().leftSeat());
      else if (room === "") leave(child, l, W().leftCases());
      else if (room && room === l.room) leave(child, l, W().leftCase(l.room));
    },
    async release(caller, name, args) {
      const s = String(args.standing ?? "").trim();
      if (name !== tool("channel") || args.action !== "revoke" || !s) return null;
      for (const [child, l] of leads) {
        if (!names(l.place, child, s) || (await l.parent) !== caller) continue;
        if (d.ownPlace(child)) return null; // not a satellite — the revoke goes by the launcher's bridge as is
        gone.set(child, undefined);
        await finish(child, W().releasedByLauncher());
        await d.tell(child, W().released(), false);
        return W().release(who(l, child));
      }
      return null;
    },
    released: (child) => gone.has(child),
    goneWhy: (child) => gone.get(child),
    heard(child, kind, place) {
      // A satellite seat taken down by the platform (evicted, closed 4001): an end like the
      // launcher's revoke — a word to the parent without waking; no channel word to the child (true).
      if ((kind === "evicted" || kind === "dead") && leads.has(child) && !d.ownPlace(child)) {
        const evicted = kind === "evicted";
        gone.set(child, evicted ? W().placeEvictedRefusal() : W().placeClosedRefusal());
        void finish(child, evicted ? W().placeEvicted() : W().placeClosed(), true, false);
        return true;
      }
      if (gone.has(child)) return true;
      if (kind === "held") {
        over.delete(child); // stood again — a lead again
        touch(stood(child), place);
        return false;
      }
      if (over.has(child)) return true; // ended by any end — no channel words to it
      if (kind === "frame") touch(leads.get(child), place);
      return false;
    },
    back(child, was) {
      const l = stood(child);
      if (was.room) l.room = was.room;
      if (was.noted) l.noted = true; // the turn was told to the parent by the previous instance
      if (was.last) l.last ??= was.last; // the outcome at the end — after a reload too
      if (was.name && was.of) l.place ??= { ...was.of, name: was.name }; // revoke by name before "held"
    },
    fail: (child, why) => finish(child, why, true, false, "lost"),
    away: (child) => finish(child, "", true, false, "away"),
    snapshot: (child) => {
      const l = leads.get(child);
      return { room: l?.room ?? null, noted: !!l?.noted, last: l?.last };
    },
    handoff(child) {
      const l = leads.get(child);
      leads.delete(child); // neither "ended" nor over: the lead lives in the new folder's instance
      return { room: l?.room ?? null, noted: !!l?.noted, last: l?.last };
    },
    nameOf: (child) => leads.get(child)?.place?.name ?? (leads.has(child) ? child : null),
    onEvent(ev) {
      cascade.note(ev); // interruptions of all sessions: the lead's parent too (cascade.ts)
      const child: unknown = ev?.data?.sessionID;
      const l = typeof child === "string" ? leads.get(child) : undefined;
      if (!l || typeof child !== "string") return;
      switch (ev.type) {
        case "session.execution.started":
          l.running = true;
          return;
        case "session.text.ended":
          if (typeof ev.data?.text === "string" && ev.data.text.trim()) l.last = ev.data.text;
          return;
        case "session.execution.interrupted":
          l.running = false;
          // A cancel of the child's own turn (reason "user") is an end without waking; shutdown,
          // superseded, inactivity are no cancel. The same "user" by a parent's cancel — a cut turn (cascade.ts).
          if (ev.data?.reason !== "user") return;
          void cascade.byParent(l.parent, Date.now()).then(async (byParent) => {
            if (!leads.has(child)) return;
            if (byParent) {
              const p = await l.parent;
              if (p) await d.tell(p, W().cascade(who(l, child)), false);
              return;
            }
            gone.set(child, W().cancelledRefusal());
            await finish(child, W().cancelled(), true, false);
          });
          return;
        case "session.execution.succeeded":
        case "session.execution.failed":
          l.running = false;
          if (l.leaving) return void finish(child, l.leaving);
          if (l.noted) return;
          l.noted = true; // the first turn handed in: to the parent — a turn, not the outcome
          void l.parent.then(async (p) => {
            if (p && leads.has(child)) await d.tell(p, W().turn(l.place?.name ?? child), false);
          });
          return;
        case "session.deleted":
          return void finish(child, W().deleted(), false);
      }
    },
  };
}
