// Wake-up batch: what accumulates goes out as one event, not frame by frame
// (graph @nks/nks-dev, nodes #5140, #5838). A window opens on hello with pending > 0
// or on a platform frame; on expiry one kind=backlog event carries the frames by
// received_at. Each seat has its own window (door.ts) and marks the batch in its own .seen.
// hello with pending flushes the whole queue at once (else one turn per frame); a platform
// wake frame should bring what arrives beside it. Bodies are capped like stale ones; the
// rest via history.
import { BACKLOG, envName } from "../delivery/index.ts";
import { type Frame, isDirectWord } from "../shared/channel.ts";
import { words } from "../shared/lang.ts";
import { isLifeCheck, type Marks, splitBatch } from "../shared/seen.ts";
import { batchBodyText } from "../shared/stalebatch.ts";
import { logBatch } from "./batchlog.ts";
import { type ChannelEvent } from "./door.ts";

/** The accumulation window; the variable is a seam for probes, not a human's knob. */
const BACKLOG_MS = Number(process.env[envName("BRIDGE_BACKLOG_MS")]) || 1500;
const BACKLOG_KEEP = 20;

const at = (f: Frame): string => (typeof f.received_at === "string" ? f.received_at : "");

export class Backlog {
  /** Shows the first BACKLOG_KEEP, marks all as given (graph @nks/nks-dev, node #5831). */
  private readonly all: Frame[] = [];
  private pending = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private flush: ((ev: ChannelEvent) => void) | null = null;

  /** The seat's marks: an event already in a turn is not repeated (seen.ts eventIn). */
  private readonly has: Marks;
  /** The seat's key, for the journal line of the batch (batchlog.ts). */
  private readonly seat: () => string;
  constructor(has: Marks, seat: () => string = () => "") {
    this.has = has;
    this.seat = seat;
  }

  /** The frames the window holds (pulse.ts pending). */
  get frames(): readonly Frame[] {
    return this.all;
  }

  /** An open window is not extended, only filled. */
  open(expected: number, emit: (ev: ChannelEvent) => void): void {
    this.pending = Math.max(this.pending, expected);
    this.flush = emit;
    if (this.timer) return;
    this.timer = setTimeout(() => this.close(), BACKLOG_MS).unref();
  }

  /** On releasing the standing: nothing ungiven is lost silently. */
  flushNow(): void {
    if (!this.timer) return;
    clearTimeout(this.timer);
    this.close();
  }

  /** On the owner's stop: what waited is not given, the stopped agent is not woken (#7439). */
  drop(): number {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.flush = null;
    this.pending = 0;
    return this.all.splice(0).length;
  }

  /**
   * false — no window, a direct word or a life check: each goes its own way whole.
   * A repeated id already in the window is not counted.
   */
  note(frame: Frame): boolean {
    if (!this.timer || isLifeCheck(frame) || isDirectWord(frame)) return false;
    const id = typeof frame.id === "string" ? frame.id : "";
    if (id && this.all.some((f) => f.id === id)) return true;
    this.all.push(frame);
    return true;
  }

  private close(): void {
    this.timer = null;
    const all = this.all.splice(0);
    // Each event once, as text or count (seen.ts splitBatch); keys are the batch's marks.
    const { shown, kept, keys } = splitBatch(all, BACKLOG_KEEP, this.has);
    const got = shown.sort((a, b) => (at(a) < at(b) ? -1 : at(a) > at(b) ? 1 : 0));
    const count = kept.length;
    const expected = this.pending;
    this.pending = 0;
    const emit = this.flush;
    this.flush = null;
    if (!got.length || !emit) return;
    // No head of the bridge's own (graph @nks/nks-dev, node #11359): the batch is the server's
    // frames grouped by case — but for one that did not fit whole: what was left out is said.
    const incomplete = count > got.length;
    const head = incomplete ? words(BACKLOG).head(count, expected, got.length, 0) : "";
    const body = { head, shown: got.map((_, i) => i), incomplete };
    logBatch("wake-up", this.seat(), all);
    emit({
      kind: "backlog",
      frames: got,
      marks: keys,
      pending: expected,
      text: batchBodyText(got, body),
      body,
    });
  }
}
