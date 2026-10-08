// Memory of delivered standing frames — ids the doer was already woken on, in a file
// beside the standing key (standings.ts). Written by whoever HANDED the frame out (a
// write to a local socket is not delivery); read by all (graph @nks/nks-dev, nodes
// #4469, #4881). The file outlives the bridge (#5831); sweep.ts removes stale files.
import { appendFileSync, readFileSync, renameSync, writeFileSync } from "node:fs";

import { addressedToMine } from "./addressed.ts";
import { type Frame } from "./channel.ts";

/**
 * How many marks the memory keeps: a day of a seat's traffic plus the whole queue the
 * platform resends after reconnecting (#5831, #5828). A mark is one appended line; the
 * file is rewritten to its tail once per SEEN_SLACK new marks.
 */
export const SEEN_KEEP = 5000;
export const SEEN_SLACK = 1000;

const evOf = (v: unknown): string =>
  typeof v === "number" || (typeof v === "string" && v) ? `ev:${v}` : "";

/**
 * Graph event mark in the delivered memory: `ev:<event_id>`; "" — no event. Two frames
 * carry an event: via=graph with event_id in an object body (role inbox) and via=room
 * with event_id on the envelope (graph @nks/nks-dev, node #6563). One event goes to
 * every seat of the role, each copy with its own frame id (#5829).
 */
export function eventKeyOf(frame: Frame | null | undefined): string {
  const via = frame?.provenance?.via;
  if (via === "room") return evOf(frame?.event_id);
  if (via !== "graph") return "";
  const body = frame?.body;
  if (!body || typeof body !== "object" || Array.isArray(body)) return "";
  return evOf((body as Record<string, unknown>).event_id);
}

// One event enters the turn once, as text or as a count (graph @nks/nks-dev, nodes
// #5842, #6563, #6574). The rule is the two functions below and only they:
// deliveryKeys — what delivery marks, eventIn — whether a mark already quenches a copy.

/** Mark reader: the delivered memory, own or with a batch's local marks on top. */
export type Marks = (key: string) => boolean;

/**
 * A copy delivered AS TEXT: everything but a case record not addressed to the seat,
 * which enters as a count (#6574).
 */
const asText = (frame: Frame): boolean => addressedToMine(frame);

/**
 * Delivery marks of a frame: the id and, for a graph event entered as text, the event:
 * `ev:` live, `evs:` stale (a batch does not wake, a live copy may, #5842). `named` —
 * a text copy only counted beyond those shown (#5831): `cev:`/`cevs:`. A copy entered
 * as a count marks only its id.
 */
export function deliveryKeys(frame: Frame | null | undefined, named = false): string[] {
  const id = typeof frame?.id === "string" ? frame.id : "";
  const ev = frame && asText(frame) ? eventKeyOf(frame) : "";
  const mark = ev && frame?.stale === true ? `evs:${ev.slice(3)}` : ev;
  return [id, mark && (named ? `c${mark}` : mark)].filter(Boolean);
}

/**
 * This copy's event is already in the turn — neither offer nor count it. Any copy is
 * quenched by the event text (`ev:`); a counted or stale copy also by stale text
 * (`evs:`); a text copy also by a counted copy (`cev:`, stale also `cevs:`). Stale text
 * does not quench a live text copy: it wakes (graph @nks/nks-dev, node #5842).
 */
export function eventIn(frame: Frame | null | undefined, has: Marks): boolean {
  const ev = frame ? eventKeyOf(frame) : "";
  if (!ev || !frame) return false;
  const n = ev.slice(3);
  const stale = frame.stale === true;
  const keys = !asText(frame)
    ? [ev, `evs:${n}`]
    : stale
      ? [ev, `evs:${n}`, `cev:${n}`, `cevs:${n}`]
      : [ev, `cev:${n}`];
  return keys.some(has);
}

/**
 * Attention tact frame (graph @nks/nks-dev, node #6169): provenance.wake="look_up" —
 * the api steward's word, not observed on the wire.
 */
export const isTact = (frame: Frame | null | undefined): boolean =>
  frame?.provenance?.wake === "look_up";

/**
 * Tact folding (#6569): of the tacts in `all` only the last enters the turn; earlier ones
 * are marked delivered with it. While the turn is busy a tact waits and a newer one
 * replaces it (`onlyTacts`).
 */
export function foldedTacts(all: readonly (Frame | null | undefined)[]): Set<Frame> {
  const tacts = all.filter((f): f is Frame => isTact(f));
  const last = tacts.reduce<Frame | null>((a, f) => (a && tactAt([a]) > tactAt([f]) ? a : f), null);
  return new Set(tacts.filter((f) => f !== last));
}

/**
 * When the platform took the freshest tact among `frames` (received_at; "" — unknown):
 * latest by this, not by arrival — a stale batch arrives after a live tact.
 */
export const tactAt = (frames: readonly Frame[] | undefined): string =>
  (frames ?? [])
    .filter(isTact)
    .map((f) => (typeof f.received_at === "string" ? f.received_at : ""))
    .reduce((a, b) => (b > a ? b : a), "");

/** A batch of tacts only — a busy turn holds it until its end (#6569). */
export const onlyTacts = (frames: readonly Frame[] | undefined): boolean =>
  !!frames?.length && frames.every(isTact);

/** Whether this is the same event copy by delivery kind — text or count (fanout.ts). */
export const sameCopy = (a: Frame | null | undefined, b: Frame): boolean =>
  !!a && eventKeyOf(a) === eventKeyOf(b) && asText(a) === asText(b);

/**
 * A batch showing the first `keep` frames (`Infinity` — all): a copy whose event is in
 * the turn (`has`) or enters as text in this batch is dropped, as is a tact followed by
 * a newer one (`foldedTacts`). `kept` — frames delivered as text or count, once each;
 * `keys` — delivery marks of the whole batch, dropped included.
 */
export function splitBatch(
  all: readonly Frame[],
  keep: number,
  has: Marks,
): { shown: Frame[]; kept: Frame[]; keys: string[] } {
  const folded = foldedTacts(all);
  let kept = all.filter((f) => !folded.has(f) && !eventIn(f, has));
  for (;;) {
    const shown = new Set(kept.slice(0, keep));
    const marks = new Set<string>();
    const local: Marks = (k) => marks.has(k) || has(k);
    const texts = kept.filter((f) => {
      if (!asText(f)) return true;
      if (eventIn(f, local)) return false; // the event's text is already above in this batch
      for (const k of deliveryKeys(f, !shown.has(f))) marks.add(k);
      return true;
    });
    const next = texts.filter((f) => asText(f) || !eventIn(f, local));
    if (next.length < kept.length) {
      kept = next;
      continue;
    }
    const on = new Set(next.slice(0, keep));
    return {
      shown: next.slice(0, keep),
      kept: next,
      keys: all.flatMap((f) => deliveryKeys(f, !on.has(f))),
    };
  }
}

export function seenIds(seenPath: string): Set<string> {
  try {
    return new Set(readFileSync(seenPath, "utf8").split("\n").filter(Boolean));
  } catch {
    return new Set();
  }
}

export function noteSeen(seenPath: string, id: string, seen: Set<string>): void {
  if (seen.has(id)) return;
  seen.add(id);
  try {
    appendFileSync(seenPath, id + "\n");
    if (seen.size > SEEN_KEEP + SEEN_SLACK) compact(seenPath, seen);
  } catch {
    /* memory is best effort: a lost note costs one extra wake, never a lost one */
  }
}

/**
 * Trim the memory to a tail of SEEN_KEEP marks, oldest first. The tail merges with the
 * file, which holds other writers' marks; freshness is append order, and an own mark
 * no longer in the file counts as older than everything in it.
 */
function compact(seenPath: string, seen: Set<string>): void {
  const file = [...seenIds(seenPath)];
  const inFile = new Set(file);
  const tail = [...[...seen].filter((x) => !inFile.has(x)), ...file].slice(-SEEN_KEEP);
  // Temp file and rename: a reader never sees an empty file mid-trim.
  const tmp = `${seenPath}.${process.pid}.tmp`;
  writeFileSync(tmp, tail.join("\n") + "\n");
  renameSync(tmp, seenPath);
  seen.clear();
  for (const x of tail) seen.add(x);
}
