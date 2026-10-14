// A lead subagent (graph @nks/nks-dev, node #6625; #6550, rule 4): a child session that stood
// on its own seat lives until its errand's outcome, not until its turn's end. Its end is an
// explicit act: leaving by the outcome (leave of the last case it is in — by the platform's
// word, casesleft.ts, #7234; leaving all
// cases, or channel leave), the launcher's revoke of its seat, the session's deletion. Esc of
// its turn only interrupts the turn (#7493, the owner's word in №607 [41]); a parent's cancel
// that cut it by cascade is a word to the parent (cascade.ts). No idle ceiling: waiting for a
// human is not neglect. A plugin reload is no end: the child returns (children.ts). At the end
// the child's bridge goes down, the outcome goes to the parent as a synthetic message, and
// nothing reaches the child's session any more (#7505). Contract — leaddoors.ts, words — leadwords.ts.

import { tool } from "../delivery/index.ts";
import { sameSeat } from "../shared/seat.ts";
import { createCascade } from "./cascade.ts";
import type { LeadDoors, Leads, RunEnd } from "./leaddoors.ts";
import type { Up } from "./leadframes.ts";
import { awayWord, endWord, unrevokedWord, W } from "./leadwords.ts";
import { type Place, standsBy } from "./satellite.ts";

interface Lead {
  parent: Promise<string | null>;
  up?: Up; // the parent once known — its launcher (leadframes.ts)
  place?: Place;
  moves: number; // its case joins and leaves: the platform's answer to an earlier leave is stale
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
  // Finally ended: released by the launcher (no reason), taken down by the platform — with a reason.
  const gone = new Map<string, string | undefined>();
  // Ended by any end, until they stand again: seen by every instance and after a reload (leadends.ts).
  const over = d.ends;
  const cascade = createCascade();
  const who = (l: Lead, child: string): string => l.place?.name ?? W().sessionOf(child);
  const parentOf = (child: string) => d.parentOf(child).catch(() => null);

  /**
   * The end: the outcome to the parent, then the bridge ends its run and goes down (ended).
   * The outcome wakes and goes steer: OpenCode's own synthetic on the child's quiet wakes the
   * parent first, and a queued word would land only after its turn. A seat taken down by the
   * platform, an unreturned seat (lost) and the parent's move (away — no "ended") do not wake.
   * own — the launcher's revoke follows by its own bridge: no correction word here. A parent
   * ended or stopped itself gets nothing: the word goes up to a live ancestor unwoken (teller).
   * The answer — the child's bridge's run end (what it revoked itself); not ended by it — null.
   */
  async function finish(
    child: string,
    why: string,
    ended = true,
    wake = true,
    kind: "end" | "lost" | "away" = "end",
    own = false,
  ): Promise<RunEnd | null> {
    const l = leads.get(child);
    if (!l) return null;
    leads.delete(child);
    over.end(child);
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
    if (!ended || kept) return null;
    // The bridge ends its run after the word: after it, the word landed later than OpenCode's
    // synthetic and the parent woke twice (№147). A failed release is a correction that does not wake.
    const run = await d.close(child).catch(() => null);
    await d.end(child).catch((e: Error) => d.say(W().notDown(who(l, child), e.message), "warning"));
    const failed = run?.failed ?? null;
    if (kind !== "lost" && !own && (failed === null || failed.length))
      await tell(unrevokedWord(who(l, child), failed), false);
    return run;
  }

  function leave(child: string, l: Lead, why: string): void {
    l.leaving = why;
    if (!l.running) void finish(child, why);
  }

  /**
   * After a case leave: the end only on the platform's word that no case is left (casesleft.ts).
   * Unasked or unread — no end, a warning to the parent that does not wake it: a false end is
   * worse than an unfinished one. A join or leave since the question makes its answer stale.
   */
  async function lastLeave(child: string, l: Lead, room: string, realm: string): Promise<void> {
    const at = l.moves;
    const left = await d.sits(child, realm).catch((e: Error) => e);
    if (leads.get(child) !== l || l.moves !== at || l.leaving) return;
    if (left === 0) return leave(child, l, W().leftCase(room));
    if (typeof left === "number") return;
    const text = W().lastUnknown(who(l, child), room, left.message);
    const parent = await l.parent;
    if (parent) await d.tell(parent, text, false);
    else d.say(W().noParent(text), "warning");
  }

  /** lift — an explicit stand: an end of the session's in any instance goes; a reload's return is none. */
  function stood(child: string, lift = true): Lead {
    let l = leads.get(child);
    if (!l) {
      const n: Lead = { parent: parentOf(child), moves: 0 };
      void n.parent.then(async (p) => {
        if (p) n.up = { id: p, root: !(await parentOf(p)) };
      });
      l = n;
    }
    leads.set(child, l);
    if (lift) over.lift(child);
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
      const room = name === tool("case") ? roomNo(args.room) : null;
      if (room !== null && (args.action === "join" || args.action === "leave")) l.moves++;
      if (args.action !== "leave") return;
      if (name === tool("channel")) leave(child, l, W().leftSeat());
      else if (room === "") leave(child, l, W().leftCases());
      // The outcome is leaving the last case it is in, not the first it joined (#7234) — the
      // platform says which; the call's graph, by default the graph of the child's seat.
      else if (room)
        void lastLeave(child, l, room, String(args.realm ?? "").trim() || l.place?.realm || "");
    },
    async release(caller, name, args) {
      const s = String(args.standing ?? "").trim();
      if (name !== tool("channel") || args.action !== "revoke" || !s) return null;
      for (const [child, l] of leads) {
        if (!names(l.place, child, s) || (await l.parent) !== caller) continue;
        if (d.ownPlace(child)) return null; // not a satellite — the revoke goes by the launcher's bridge as is
        gone.set(child, undefined);
        const place = l.place ?? null;
        // No word into the child (#7505): anything laid there would wake it for a turn.
        const run = await finish(child, W().releasedByLauncher(), true, true, "end", true);
        // Off only for the very seat the launcher revokes — its call's graph and role, else its
        // seat's; one name in another graph is another seat (#5838, №664).
        const seat = place && {
          realm: String(args.realm ?? "").trim() || place.realm,
          karta: args.karta == null ? place.karta : String(args.karta),
          name: place.name,
        };
        const off = !!seat && !!run?.revoked.some((k) => sameSeat(k, seat));
        return { word: W().release(who(l, child)), place, off };
      }
      return null;
    },
    ended: (child) => gone.has(child) || !!leads.get(child)?.leaving || over.has(child),
    released: (child) => gone.has(child),
    goneWhy: (child) => gone.get(child),
    heard(child, kind, place) {
      // A satellite seat taken down by the platform (evicted, closed 4002) or by its owner (4001,
      // stopped — the plugin interrupts the child's turn, channel.ts): an end like the launcher's
      // revoke — a word to the parent without waking; no channel word to the child (true).
      const down = kind === "evicted" || kind === "dead" || kind === "stopped";
      if (down && leads.has(child) && !d.ownPlace(child)) {
        const evicted = kind === "evicted";
        gone.set(child, evicted ? W().placeEvictedRefusal() : W().placeClosedRefusal());
        void finish(child, evicted ? W().placeEvicted() : W().placeClosed(), true, false);
        return true;
      }
      if (gone.has(child)) return true;
      if (kind === "held") {
        touch(stood(child), place); // stood again — a lead again
        return false;
      }
      if (over.has(child)) return true; // ended by any end — no channel words to it
      if (kind === "frame") touch(leads.get(child), place);
      return false;
    },
    back(child, was) {
      const l = stood(child, false);
      if (was.noted) l.noted = true; // the turn was told to the parent by the previous instance
      if (was.last) l.last ??= was.last; // the outcome at the end — after a reload too
      if (was.name && was.of) l.place ??= { ...was.of, name: was.name }; // revoke by name before "held"
    },
    fail: async (child, why) => void (await finish(child, why, true, false, "lost")),
    away: async (child) => void (await finish(child, "", true, false, "away")),
    snapshot: (child) => {
      const l = leads.get(child);
      return { noted: !!l?.noted, last: l?.last };
    },
    handoff(child) {
      const l = leads.get(child);
      leads.delete(child); // neither "ended" nor over: the lead lives in the new folder's instance
      return { noted: !!l?.noted, last: l?.last };
    },
    nameOf: (child) => leads.get(child)?.place?.name ?? (leads.has(child) ? child : null),
    upOf: (child) => leads.get(child)?.up ?? null,
    onEvent(ev) {
      cascade.note(ev); // interruptions of all sessions: the lead's parent too (cascade.ts)
      const child: unknown = ev?.data?.sessionID;
      const l = typeof child === "string" ? leads.get(child) : undefined;
      // No session — no end record either, whichever instance ended it.
      if (ev?.type === "session.deleted" && typeof child === "string" && !l) over.lift(child);
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
          // A leave said in the turn ends it at the turn's end, an interrupted one too.
          if (l.leaving) return void finish(child, l.leaving);
          // Esc of the child's own turn (reason "user") only interrupts the turn, the errand lives
          // (#7493, №607 [41]); shutdown, superseded, inactivity are no cancel either. The same
          // "user" by a parent's cancel — a cut turn, a word to the parent (cascade.ts).
          if (ev.data?.reason !== "user") return;
          void cascade.byParent(l.parent, Date.now()).then(async (byParent) => {
            const p = byParent && leads.has(child) ? await l.parent : null;
            if (p) await d.tell(p, W().cascade(who(l, child)), false);
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
          void finish(child, W().deleted(), false); // its end is laid at once, and goes with the session
          return over.lift(child);
      }
    },
  };
}
