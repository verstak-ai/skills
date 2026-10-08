// This location's marker records (marker.ts) — what the plugin instance does with them: roots
// get return hints (keep.ts); a satellite child returns by key (children.ts); a child on a plain
// bridge has ended its run. A child of a root moved to another folder (moves.ts) is ended by the
// move: the previous instance put its bridge down and revoked its seat. Its write here is a loud
// refusal, not the root's slot (graph @nks/nks-dev: #6550, rules 1-2; #6361); no revoke is sent.
import { OPENCODE_KEEP, tool } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import type { Keeper } from "./keep.ts";
import { takeLostMarker } from "./marker.ts";
import type { Home, LostEntry } from "./records.ts";
import type { Slot } from "./tools.ts";

export interface AdoptDoors {
  keeper: Keeper<Slot>;
  authDir: () => string;
  home: Home | null;
  /** A previous instance's satellite child — back by key (children.ts). */
  back(e: LostEntry): Promise<void>;
  /** The child ended in this instance: its write is a refusal aloud with this word. */
  endKid(session: string, of: LostEntry["of"], why: string): void;
}

export function createAdopt(d: AdoptDoors) {
  const moved = new Map<string, string>(); // a moved root's child's seat name → its session

  function take(entries: LostEntry[]): void {
    d.keeper.hint(entries);
    for (const e of entries) {
      if (!e.child || !e.session) continue;
      if (!e.moved) void d.back(e);
      else {
        if (e.name) moved.set(e.name, e.session);
        d.endKid(e.session, e.of ?? null, words(OPENCODE_KEEP).movedWhy(e.name ?? ""));
      }
    }
  }

  return {
    take,
    /**
     * A marker laid after this instance loaded — take it: a session moved here into a live
     * instance, or a previous one's stop that ended after our load.
     */
    now(): void {
      const lost = takeLostMarker(d.authDir(), d.home);
      if (!lost) return;
      take(lost.entries);
      void d.keeper.resumeLost(lost.entries, lost.wordFor);
    },
    /** A revoke of a child ended by the parent's move: the plugin's answer instead of a call. */
    revoked(name: string, args: Record<string, unknown>): string | null {
      const s = String(args.standing ?? "").trim();
      if (name !== tool("channel") || args.action !== "revoke" || !s) return null;
      for (const n of moved.keys())
        if (s === n || s.endsWith(`:${n}`)) return words(OPENCODE_KEEP).revokedMoved(n);
      return null;
    },
  };
}
