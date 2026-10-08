// A seat's question memory on disk (graph @nks/nks-dev, nodes #6867, #6868): the
// `.asks` file beside `.seen`, one line per question, closer and decision; never
// trimmed, removed with its `.seen` by sweep.ts. A question to a person waits for days while
// `.seen` keeps a day: it would be pushed out there and its closer would arrive as a count.
import { appendFileSync, readFileSync } from "node:fs";

import { type AskStore } from "../shared/askmemory.ts";

/** The seat's question-memory path, from its .seen path. */
export const asksPathOf = (seenPath: string): string => seenPath.replace(/\.seen$/, "") + ".asks";

const loaded = new Map<string, Set<string>>();

function load(path: string): Set<string> {
  try {
    return new Set(readFileSync(path, "utf8").split("\n").filter(Boolean));
  } catch {
    return new Set();
  }
}

/** In process a set, on disk an append-only file. */
export function diskAsks(seenPath: string): AskStore {
  const path = asksPathOf(seenPath);
  let set = loaded.get(path);
  if (!set) loaded.set(path, (set = load(path)));
  const s = set;
  return {
    has: (k) => s.has(k),
    add: (k) => {
      if (s.has(k)) return;
      s.add(k);
      try {
        appendFileSync(path, `${k}\n`);
      } catch {}
    },
    keys: () => s,
  };
}
