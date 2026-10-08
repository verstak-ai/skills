// Room frames by the kinds dictionary, batched for watchdogs by the bridge
// (graph @nks/nks-dev, nodes #5851, #6574): a batch leaves by window, when full,
// or before an interrupting frame, as a note head (at: 0) and frames marked batch.
import { envName } from "../delivery/index.ts";
import { addressedToMine } from "../shared/addressed.ts";
import { askFromPerson } from "../shared/asks.ts";
import { classifyOrigin, type Frame } from "../shared/channel.ts";
import { batchHead, foldAsides } from "../shared/frame-text.ts";
import { byKind, roomKind, stackOf } from "../shared/room-kinds.ts";
import { deliveryKeys, type Marks, noteSeen, splitBatch } from "../shared/seen.ts";
import { type ChannelEvent, type Door } from "./door.ts";
import { HumanWords, idOf, isWordOf } from "./humanwords.ts";
import { log } from "./streams.ts";

/** The variable is a seam for probes, not a human knob. */
const ROOM_BATCH_MS = Number(process.env[envName("BRIDGE_ROOM_BATCH_MS")]) || 60_000;
/** A full batch leaves at once: no frame is ever dropped. */
const ROOM_BATCH_CAP = 20;

const rec = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" ? (v as Record<string, unknown>) : {};

export class RoomBatch {
  private readonly held: { raw: string; frame: Frame }[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;
  private emit: ((ev: ChannelEvent) => void) | null = null;

  add(raw: string, frame: Frame, emit: (ev: ChannelEvent) => void): void {
    this.emit = emit;
    this.held.push({ raw, frame });
    if (this.held.length >= ROOM_BATCH_CAP) return this.flushNow();
    this.timer ??= setTimeout(() => this.flushNow(), ROOM_BATCH_MS).unref();
  }

  /** Human words in flight: their body is the human's word, not a batch frame. */
  readonly humanWords = new HumanWords();

  /** Take a word in flight out of the pending batch once its body came. */
  dropWord(body: Frame, word: string, dropped: (frame: Frame) => void): void {
    for (let i = this.held.length - 1; i >= 0; i--) {
      if (!isWordOf(this.held[i].frame, body, word)) continue;
      dropped(this.held[i].frame);
      this.held.splice(i, 1);
    }
    if (!this.held.length && this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  /** A batched frame is not handed out separately by the ring (door.ts). */
  holds(frame: Frame | null): boolean {
    return !!frame && this.held.some((h) => h.frame === frame);
  }

  /** Flush now; `carrier` — the interrupting frame that follows as text (seen.ts splitBatch). */
  flushNow(carrier?: Frame | null): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    const got = this.held.splice(0);
    const emit = this.emit;
    if (!got.length || !emit) return;
    const unit = [...got.map((h) => h.frame), ...(carrier ? [carrier] : [])];
    const kept = new Set(splitBatch(unit, Infinity, this.has).kept);
    const out = got.filter((h) => kept.has(h.frame));
    if (out.length) emitBatch(out, emit);
  }

  /** The seat's marks: an event already in the turn is not repeated (seen.ts eventIn). */
  private readonly has: Marks;
  constructor(has: Marks) {
    this.has = has;
  }
}

export function emitBatch(
  got: { raw: string; frame: Frame }[],
  emit: (ev: ChannelEvent) => void,
): void {
  const of = got.length;
  const frames = got.map((h) => h.frame);
  const fold = foldAsides(frames);
  emit({ kind: "note", text: batchHead(frames), batch: { at: 0, of } });
  got.forEach((h, i) =>
    emit({
      kind: "frame",
      raw: h.raw,
      frame: h.frame,
      batch: {
        at: i + 1,
        of,
        ...(fold[i] === null
          ? { folded: true }
          : roomKind(h.frame)?.aside
            ? { fold: fold[i] ?? 1 }
            : {}),
      },
    }),
  );
}

/** A case record not addressed to the seat goes to watchdogs only counted in a batch (graph @nks/nks-dev, node #6574). */
export function countOnly(frame: Frame | null): frame is Frame {
  return frame?.type === "message" && !!byKind(frame) && !addressedToMine(frame);
}

/** An unknown kind is logged so it gets noticed. */
export function noteRoomKind(frame: Frame): void {
  const rk = roomKind(frame);
  if (rk && !rk.known)
    log(`room frame ${String(frame.id ?? "?")}: ${rk.words} — batched, not interrupting`);
}

/** true — batched, not sent now; false — sent now, after the pending batch. */
export function batchForWatchdogs(
  d: Door,
  raw: string,
  frame: Frame,
  emit: (ev: ChannelEvent) => void,
): boolean {
  const rk = roomKind(frame);
  const f = rec(frame);
  // An ask from a person's seat is routed by addressing (asks.ts askFromPerson).
  let human = (frame.origin ?? classifyOrigin(frame)) === "human" && !askFromPerson(frame);
  // Two-phase word (graph @nks/nks-dev, node #5953): the body wakes one event, the word in flight leaves the batch.
  if (rk?.kind === "said" && rk.phase === "pending" && human)
    d.roomBatch.humanWords.remember(frame);
  if (rk?.kind === "body") {
    const word = idOf(rec(f.line).refers_to ?? f.in_reply_to);
    if (d.roomBatch.humanWords.forget(frame, word) && rk.phase !== "aborted") {
      human = true;
      frame.origin = "human"; // the frame head names the human, not their bridge's seat
      d.roomBatch.dropWord(frame, word, (said) => {
        for (const k of deliveryKeys(said)) noteSeen(d.seenPath, k, d.seen);
      });
    }
  }
  // A human's word goes now unless addressed to another (graph @nks/nks-dev, node #6081);
  // anything not addressed to the seat is batched (graph @nks/nks-dev, node #6574).
  if (
    (!human || rk?.phase || rk?.aside) &&
    byKind(frame) &&
    (!addressedToMine(frame) || stackOf(frame) === "batch")
  ) {
    d.roomBatch.add(raw, frame, emit);
    return true;
  }
  d.roomBatch.flushNow(frame);
  return false;
}
