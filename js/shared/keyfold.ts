// Folding of key lines in a batch to the agent (graph @nks/nks-dev, nodes #6718, #6715):
// one function for every batch (watchdog room window, wake-up, stale, pi and OpenCode
// plugins, the Codex watchdog), because all of them count a case in one line
// (frame-text.ts caseCountLine).
import { addressedToMine } from "./addressed.ts";
import { type Frame } from "./channel.ts";

type Rec = Record<string, unknown>;
const rec = (v: unknown): Rec => (v && typeof v === "object" ? (v as Rec) : {});
const idOf = (v: unknown): string =>
  typeof v === "number" || (typeof v === "string" && v) ? String(v) : "";

/**
 * Work lines superseded in the batch: a progress frame followed in the batch by a
 * line of the same key (room.id, line.key) with a larger entry_id. A frame has no
 * "supersedes" flag: any later line of the key supersedes. Anything not progress
 * (enter, leave, word, close…), a line addressed to the seat and a bad verdict are
 * never folded and fold nothing.
 * Every frame, superseded ones too, is marked delivered.
 */
export function superseded(frames: Frame[]): Set<Frame> {
  const last = new Map<string, { frame: Frame; at: number }>();
  const out = new Set<Frame>();
  frames.forEach((f, i) => {
    const r = f as Rec;
    const line = rec(r.line);
    const key = typeof line.key === "string" ? line.key : "";
    if (line.kind !== "progress" || !key || line.verdict === "bad" || addressedToMine(f)) return;
    const k = `${idOf(rec(r.room).id) || idOf(rec(r.room).seq)}|${key}`;
    const e = Number(r.entry_id ?? line.entry_id);
    const at = Number.isFinite(e) ? e : i;
    const was = last.get(k);
    if (!was) return void last.set(k, { frame: f, at });
    if (at >= was.at) {
      out.add(was.frame);
      last.set(k, { frame: f, at });
    } else out.add(f);
  });
  return out;
}
