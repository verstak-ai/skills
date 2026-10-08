// A held seat keeps the directory loaded. OpenCode 2.0.22 (LocationActivity) unloads a
// directory's services after 60 min without durable events of its sessions; GET, SSE and an
// open TUI do not extend it. With the unload the plugin stops and the bridge lets the seat go.
// While the instance has a held seat, the plugin lays such an event itself.
//
// Only an event with a location envelope extends the term; of the plugin surface only
// session.create sets one explicitly. So the event is a child session of the seat, created
// and removed at once: its session.created carries the parent's location, it gets no turn.
//
// Cost: a directory with a held seat is never unloaded, and the unload no longer cuts a hung
// turn — the human cancels it. The switch: the KEEPALIVE_MS variable set to 0.
/* eslint-disable @typescript-eslint/no-explicit-any -- SDK events and answers without a schema */
import { envName, OPENCODE_KEEP } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import type { Context } from "./plugin.ts";

/** Silence before the event; 0 — off. The directory's term is 60 min. */
const EVERY_MS = (() => {
  const v = process.env[envName("KEEPALIVE_MS")];
  return v === undefined || v === "" ? 50 * 60_000 : Number(v) || 0;
})();

// OpenCode 2.0.22 turn events (schema/session-event.ts, durable) extend the term themselves;
// the plugin's words, deltas, tool progress and usage.updated do not. Unknown is not counted.
const DURABLE =
  /^session\.(execution\.(started|succeeded|failed|interrupted)|(step|text|reasoning|compaction)\.(started|ended|failed)|tool\.(called|success|failed|input\.(started|ended))|shell\.(started|ended)|skill\.activated|instructions\.updated|message\.content\.updated|usage\.recorded|retry\.scheduled)$/;

/** How many unremoved service sessions the plugin remembers for a retry. */
const LEFTOVER_MAX = 20;

/** The title of the one-day child session: events and the log know it by it. */
export const keepaliveTitle = (): string => words(OPENCODE_KEEP).keepaliveTitle();

export interface KeepAlive {
  /** A service event: a durable event of this instance's session extends the term itself. */
  onEvent(ev: any): void;
  stop(): void;
}

export interface KeepDoors {
  /** The instance's sessions with a held seat (a root with a seat, a live lead satellite). */
  holders(): string[];
  /** A session of this instance: its events extend its directory's term. */
  owns(session: string): boolean;
  say(text: string, level?: "warning" | "error"): void;
}

/** Sessions of holding slots, roots first: the event lands in a root with a seat. */
export const holdersOf = (
  slots: Iterable<{ holding: boolean; session?: string | null; child?: boolean }>,
): string[] =>
  [...slots]
    .filter((x) => x.holding && x.session)
    .sort((a, b) => Number(!!a.child) - Number(!!b.child))
    .map((x) => x.session as string);

export function createKeepAlive(ctx: Context, d: KeepDoors): KeepAlive {
  if (EVERY_MS <= 0) return { onEvent() {}, stop() {} };
  const W = words(OPENCODE_KEEP);
  const title = keepaliveTitle();
  let last = Date.now();
  let busy = false;
  // Service sessions that could not be removed: one retry per tact, after the extension.
  const leftover = new Set<string>();
  let noRemoveSaid = false;
  let capSaid = false;
  /** One removal try; any failure, a synchronous one too, is false, not a rejection. */
  async function removeOnce(id: string): Promise<boolean> {
    // remove is on the OpenCode 2.0.22 context, but not in the @opencode/plugin 2.0.4 types.
    const fn = (ctx.session as any).remove;
    if (typeof fn !== "function") {
      if (!noRemoveSaid) d.say(W.noRemove(title), "error");
      noRemoveSaid = true;
      return false;
    }
    try {
      await fn.call(ctx.session, { sessionID: id });
      return true;
    } catch {
      return false;
    }
  }
  function remember(id: string): void {
    leftover.add(id);
    if (leftover.size <= LEFTOVER_MAX) return;
    const oldest = leftover.values().next().value as string;
    leftover.delete(oldest); // past the limit — not remembered: the human removes it
    if (!capSaid) d.say(W.cap(LEFTOVER_MAX, title), "error");
    capSaid = true;
  }
  /** The extension: a service session created — the term extended (its session.created carries location). */
  async function touch(session: string): Promise<string | null> {
    let s: any;
    try {
      s = await ctx.session.create({ parentID: session, title } as any);
    } catch (e) {
      d.say(W.notCreated((e as Error).message));
      return null;
    }
    const id = s?.id ?? s?.data?.id;
    if (typeof id === "string") return id;
    d.say(W.noId(JSON.stringify(s ?? null).slice(0, 160), title), "error");
    return null;
  }
  /** Tidying — after the extension and independent of it: two tries for a fresh one, one for earlier ones. */
  async function tidy(fresh: string | null): Promise<void> {
    for (const id of [...leftover]) if (await removeOnce(id)) leftover.delete(id);
    if (!fresh) return;
    if ((await removeOnce(fresh)) || (await removeOnce(fresh))) return;
    remember(fresh);
    if (!noRemoveSaid) d.say(W.notRemoved(fresh));
  }
  async function tick(): Promise<void> {
    let fresh: string | null = null;
    const held = Date.now() - last >= EVERY_MS ? d.holders() : [];
    if (held.length) {
      last = Date.now();
      fresh = await touch(held[0]);
    }
    await tidy(fresh);
  }
  const timer = setInterval(
    () => {
      if (busy) return;
      busy = true;
      void tick()
        .catch((e: Error) => d.say(W.tickFailed(e.message)))
        .finally(() => (busy = false));
    },
    Math.max(50, Math.min(60_000, EVERY_MS / 5)),
  );
  timer.unref?.();
  return {
    onEvent(ev) {
      const s = ev?.data?.sessionID;
      // Only an event with a location envelope extends the term — the plugin's synthetics carry none.
      if (typeof s === "string" && ev?.location && DURABLE.test(String(ev?.type)) && d.owns(s))
        last = Date.now();
    },
    stop: () => clearInterval(timer),
  };
}

/* eslint-enable @typescript-eslint/no-explicit-any */
