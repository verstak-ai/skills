// One repeating line does not crowd a machine journal out (graph @nks/nks-dev, #10782): a line
// of a shape already written within the window is counted, not written. The shape masks what a
// storm renews on every turn — case and seat UUIDs, a root seat's random suffix — so a launch
// that takes a fresh seat each time folds too. The first line of a shape is written whole, its
// ids kept; the count goes as its own line once the window has passed, before the next line of
// the journal. A count still open when the process ends is lost — the ceiling of this fold.
// The daemon's session tag ([sN-pid]) is not masked: each session's lifecycle lines name it and
// are read to tell sessions apart, so a storm of fresh thin bridges is bounded at its source —
// the plugin's admission bound (opencode/spawn-retries.ts) — not here.
const WINDOW_MS = 60_000;
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
const ROOT = /\.root-[0-9a-f]{12}\b/g;

export const shapeOf = (line: string): string =>
  line.replace(UUID, "<id>").replace(ROOT, ".root-<id>");

/** Lines to write for this one: the counts of windows that passed, then the line or nothing. */
export function createFold(now: () => number = Date.now, windowMs = WINDOW_MS) {
  const open = new Map<string, { at: number; folded: number; last: string }>();
  return (line: string): string[] => {
    const t = now();
    const out: string[] = [];
    for (const [shape, s] of open)
      if (t - s.at >= windowMs) {
        if (s.folded)
          out.push(
            `repeated ${s.folded} more time(s) within ${windowMs / 1000} s, last: ${s.last}`,
          );
        open.delete(shape);
      }
    const shape = shapeOf(line);
    const s = open.get(shape);
    if (s) {
      s.folded++;
      s.last = line;
      return out;
    }
    open.set(shape, { at: t, folded: 0, last: line });
    out.push(line);
    return out;
  };
}

const folds = new Map<string, (line: string) => string[]>();

/** One fold per journal file of this process. */
export function foldInto(path: string, line: string): string[] {
  let fold = folds.get(path);
  if (!fold) folds.set(path, (fold = createFold()));
  return fold(line);
}
