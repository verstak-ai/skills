// The daemon's batch tact (graph @nks/nks-dev, nodes #8623, #8617): pulse, busy line and usage
// of every seat on the dispatcher connection gather between tacts and leave as one tick frame
// per connection per interval, only what changed; an empty tact sends nothing. A seat leaving
// sends its last lines at once, in a frame of their own, before its unsubscribe.
import { envName } from "../delivery/index.ts";

/** The tact interval is the pulse gap of today (pulse.ts): one seam for both. */
export const GAP_MS = Number(process.env[envName("PULSE_GAP_MS")]) || 30_000;

export interface TickEntry {
  channel_id: string;
  /** Required on a channel of several seats; absent — the channel's one seat (#8620 v15). */
  standing_id?: string;
  pulse?: Record<string, unknown>;
  status?: string;
  usage?: Record<string, unknown>;
}

/** What to do with a seat's numbers if they never go in a tact (no dispatcher after all). */
export type Lost = (() => void) | undefined;

export interface Ticker {
  /** A change of one seat: merged with what waits for the tact; `lost` — of its numbers. */
  put(e: TickEntry, lost?: Lost, pulseSent?: (at: number) => void): void;
  /** The channel's waiting lines now, in a frame of their own (the seat leaves). */
  flushChannel(channel: string): void;
  /** The channel's waiting lines go nowhere (the subscription ended without a leave). */
  drop(channel: string): void;
  /** The channel's waiting lines out of the tact, to the caller (they wait for a new hello). */
  take(channel: string): [TickEntry, Lost][];
}

/** `send` — the frame to the connection; false: not open now, the lines wait for the next tact. */
export function createTicker(
  send: (frame: { type: "tick"; entries: TickEntry[] }) => boolean,
): Ticker {
  const waiting = new Map<string, TickEntry>();
  const losts = new Map<string, () => void>();
  const receipts = new Map<string, (at: number) => void>();
  let lastAt = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const keyOf = (e: Pick<TickEntry, "channel_id" | "standing_id">): string =>
    `${e.channel_id}\n${e.standing_id ?? ""}`;

  function schedule(): void {
    if (timer || !waiting.size) return;
    timer = setTimeout(tact, Math.max(0, lastAt + GAP_MS - Date.now()));
    timer.unref?.();
  }

  function tact(): void {
    timer = null;
    if (!waiting.size) return;
    const entries = [...waiting.values()];
    lastAt = Date.now();
    if (send({ type: "tick", entries })) confirm(entries);
    schedule();
  }

  const ofChannel = (channel: string): [string, TickEntry][] =>
    [...waiting].filter(([, e]) => e.channel_id === channel);
  const forget = (k: string): void => void (waiting.delete(k), losts.delete(k), receipts.delete(k));
  function confirm(entries: TickEntry[]): void {
    const at = Date.now();
    for (const e of entries) {
      const k = keyOf(e);
      const receipt = receipts.get(k);
      forget(k);
      try {
        receipt?.(at);
      } catch {
        // On the wire already: a throwing receipt must not replay the entry.
      }
    }
  }
  const take = (channel: string): [TickEntry, Lost][] =>
    ofChannel(channel).map(([k, e]) => {
      const lost = losts.get(k);
      forget(k);
      return [e, lost];
    });

  return {
    put(e, lost, pulseSent) {
      const k = keyOf(e);
      waiting.set(k, { ...waiting.get(k), ...e });
      if (lost) losts.set(k, lost);
      if (e.pulse) {
        receipts.delete(k);
        if (pulseSent) receipts.set(k, pulseSent);
      }
      schedule();
    },
    flushChannel(channel) {
      const mine = ofChannel(channel);
      if (!mine.length) return;
      const entries = mine.map(([, e]) => e);
      if (send({ type: "tick", entries })) confirm(entries);
    },
    drop: (channel) => void take(channel),
    take,
  };
}
