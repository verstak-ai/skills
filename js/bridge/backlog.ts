// Wake-up batch: what accumulates goes out as one event, not frame by frame
// (graph @nks/nks-dev, nodes #5140, #5838). A window opens on hello with pending > 0
// or on a platform frame; on expiry one kind=backlog event carries the frames by
// received_at. Each seat has its own window (door.ts).
import { BACKLOG, envName } from "../delivery/index.ts";
import { addressedToMine } from "../shared/addressed.ts";
import { type Frame, isDirectWord } from "../shared/channel.ts";
import { caseCountLines, frameToText } from "../shared/frame-text.ts";
import { words } from "../shared/lang.ts";
import { type Marks, splitBatch } from "../shared/seen.ts";
import { type ChannelEvent } from "./door.ts";

/** The variable is a seam for probes, not a human's knob. */
const BACKLOG_MS = Number(process.env[envName("BRIDGE_BACKLOG_MS")]) || 1500;
const BACKLOG_KEEP = 20;
const BODY_CAP = 800;

const at = (f: Frame): string => (typeof f.received_at === "string" ? f.received_at : "");

export class Backlog {
  /** Shows the first BACKLOG_KEEP, marks all as given (graph @nks/nks-dev, node #5831). */
  private readonly all: Frame[] = [];
  /** Direct words went out separately; the head only counts them. */
  private direct = 0;
  private pending = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private flush: ((ev: ChannelEvent) => void) | null = null;

  /** The seat's marks: an event already in a turn is not repeated (seen.ts eventIn). */
  private readonly has: Marks;
  constructor(has: Marks) {
    this.has = has;
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

  /**
   * false — no window, or a direct word that goes its own way whole.
   * A repeated id already in the window is not counted.
   */
  note(frame: Frame): boolean {
    if (!this.timer) return false;
    if (isDirectWord(frame)) {
      this.direct++;
      return false;
    }
    const id = typeof frame.id === "string" ? frame.id : "";
    if (id && this.all.some((f) => f.id === id)) return true;
    this.all.push(frame);
    return true;
  }

  private close(): void {
    this.timer = null;
    const all = this.all.splice(0);
    const { shown, kept, keys } = splitBatch(all, BACKLOG_KEEP, this.has);
    const got = shown.sort((a, b) => (at(a) < at(b) ? -1 : at(a) > at(b) ? 1 : 0));
    const count = kept.length;
    const expected = this.pending;
    const direct = this.direct;
    this.direct = 0;
    this.pending = 0;
    const emit = this.flush;
    this.flush = null;
    if (!got.length || !emit) return;
    // Addressed to the seat as text, other case records counted per case
    // (graph @nks/nks-dev, node #6574).
    const bodies = [
      ...caseCountLines(got),
      ...got
        .filter((f) => addressedToMine(f))
        .map((f) => {
          const t = frameToText(f, JSON.stringify(f));
          return [...t].length > BODY_CAP ? [...t].slice(0, BODY_CAP).join("") + "…" : t;
        }),
    ];
    const head = words(BACKLOG).head(count, expected, got.length, direct);
    emit({
      kind: "backlog",
      frames: got,
      marks: keys,
      pending: expected,
      text: `${head}\n\n${bodies.join("\n\n")}`,
    });
  }
}
