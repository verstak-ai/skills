// Stale frames go as one batch per window, with bodies (graph @nks/nks-dev, nodes
// #4881, #5033): a stale: true frame is worth no move but is not lost. Each seat has
// its own batch (door.ts, #5838): one graph's stale frames do not reach another's watchdog.
import { type Frame } from "../shared/channel.ts";
import { type Marks, sameCopy } from "../shared/seen.ts";
import { staleBatch } from "../shared/stalebatch.ts";
import { type ChannelEvent } from "./door.ts";

const STALE_BURST_MS = 1500;

export class StaleBurst {
  /** Every frame of the window; the batch shows the first STALE_BURST_KEEP, all are marked given (#5831). */
  private readonly burst: Frame[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;

  /** The seat's marks: an event already in play is not repeated (seen.ts eventIn). */
  private readonly has: Marks;
  constructor(has: Marks) {
    this.has = has;
  }

  /** Add a stale frame; when the window ends `flush` gets one event. A repeated id is not a second frame. */
  note(frame: Frame, flush: (ev: ChannelEvent) => void): void {
    const id = typeof frame.id === "string" ? frame.id : "";
    if (!id || !this.burst.some((f) => f.id === id)) this.burst.push(frame);
    if (this.timer) return;
    this.timer = setTimeout(() => {
      this.timer = null;
      const all = this.burst.splice(0);
      if (!all.length) return; // a live copy of the same event took them all
      // Text and marks by the seat's memory now; watchdogs judge it themselves at print time (shared/stalebatch.ts).
      const { text, keys } = staleBatch(all, this.has);
      if (!text) return; // all already in play: marks only grow, the watchdog decides the same
      flush({ kind: "stale", frames: all, marks: keys, text });
    }, STALE_BURST_MS).unref();
  }

  /** Whether the pending batch holds a copy of this event of the same kind (fanout.ts). */
  holdsCopy(frame: Frame): boolean {
    return this.burst.some((f) => sameCopy(f, frame));
  }

  /** Take stale copies of the same kind out of the batch — the live one wakes, the batch does not (fanout.ts). */
  dropCopies(frame: Frame): void {
    for (let i = this.burst.length - 1; i >= 0; i--)
      if (sameCopy(this.burst[i], frame)) this.burst.splice(i, 1);
  }

  /** Forget the accumulated batch when the standing is released. */
  drop(): void {
    this.burst.length = 0;
    if (this.timer) clearTimeout(this.timer); // otherwise an empty batch would go out as a prompt
    this.timer = null;
  }
}
