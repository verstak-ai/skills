// Stale batch text (graph @nks/nks-dev, nodes #4881, #5033) — composed by whoever hands
// it out, at that moment (seen.ts): the bridge notifying pi and OpenCode, the watchdog
// printing or threading it. An event already in the turn is not repeated (eventIn).
import { STALE } from "../delivery/index.ts";
import { addressedToMine } from "./addressed.ts";
import { type Frame } from "./channel.ts";
import { caseCountLines, frameToText } from "./frame-text.ts";
import { words } from "./lang.ts";
import { type Marks, splitBatch } from "./seen.ts";

const STALE_BURST_KEEP = 20;
const BODY_CAP = 800;

/**
 * Stale batch by the giver's memory `has`: the text ("" — all already in the turn) and
 * its delivery marks, written by the giver once the text is out (#5831). Rule #6574:
 * addressed to the seat as text, other case records by count; an event once.
 */
export function staleBatch(all: readonly Frame[], has: Marks): { text: string; keys: string[] } {
  const { shown: frames, kept, keys } = splitBatch(all, STALE_BURST_KEEP, has);
  const count = kept.length;
  if (!count) return { text: "", keys };
  const bodies = [
    ...caseCountLines(frames),
    ...frames
      .filter((f) => addressedToMine(f))
      .map((f) => {
        const t = frameToText(f, JSON.stringify(f));
        return [...t].length > BODY_CAP ? [...t].slice(0, BODY_CAP).join("") + "…" : t;
      }),
  ];
  const head = words(STALE).head(count, frames.length);
  return { text: `${head}\n\n${bodies.join("\n\n")}`, keys };
}
