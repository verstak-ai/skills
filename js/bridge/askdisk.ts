// A seat's question memory on disk (graph @nks/nks-dev, nodes #6867, #6868): the
// `.asks` file beside `.seen`, one line per question, closer and decision; removed with
// its `.seen` by sweep.ts. A question to a person waits for days while `.seen` keeps a
// day: it would be pushed out there and its closer would arrive as a count. Open
// questions are never trimmed; closed ones and per-frame decisions are, oldest first,
// past a limit — a replay comes within the batch window, long before that.
import { appendFileSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";

import { envName } from "../delivery/index.ts";
import { type AskStore } from "../shared/askmemory.ts";

/** The seat's question-memory path, from its .seen path. */
export const asksPathOf = (seenPath: string): string => seenPath.replace(/\.seen$/, "") + ".asks";

/** Closed questions and frame decisions kept; the variable is a probe seam. */
const kept = (): number => Number(process.env[envName("BRIDGE_ASKS_KEPT")]) || 2048;

/** A frame decision: `hit:<id>`, or `closes:<id>=<n>` whose value get(`closes:<id>`) gives. */
const DECIDED = /^(hit|closes):/;

interface Memory {
  set: Set<string>;
  /** Valued entries by their key: `closes:<id>` → n. */
  index: Map<string, string>;
  /** Adds since the last trim. */
  room: number;
}
const loaded = new Map<string, Memory>();

function note(m: Memory, k: string): void {
  const at = k.indexOf("=");
  if (at > 0) m.index.set(k.slice(0, at), k.slice(at + 1));
}

function load(path: string): Memory {
  const m: Memory = { set: new Set(), index: new Map(), room: 0 };
  try {
    for (const k of readFileSync(path, "utf8").split("\n").filter(Boolean)) {
      m.set.add(k);
      note(m, k);
    }
  } catch {}
  return m;
}

/** Oldest closed questions (with their open line) and decisions past the limit go; the file is rewritten. */
function trim(path: string, m: Memory): void {
  const drop = (k: string): void => {
    m.set.delete(k);
    const at = k.indexOf("=");
    if (at > 0) m.index.delete(k.slice(0, at));
  };
  const decided = [...m.set].filter((k) => DECIDED.test(k));
  const closed = [...m.set].filter((k) => k.startsWith("off:"));
  const max = kept();
  if (decided.length <= max && closed.length <= max) return;
  for (const k of decided.slice(0, Math.max(0, decided.length - max))) drop(k);
  for (const k of closed.slice(0, Math.max(0, closed.length - max))) {
    drop(k);
    drop(k.slice(4));
  }
  // Through a rename: a write cut short leaves the old file whole, not a truncated one.
  const tmp = `${path}.${process.pid}.tmp`;
  try {
    writeFileSync(tmp, [...m.set].map((k) => `${k}\n`).join(""));
    renameSync(tmp, path);
  } catch {
    try {
      unlinkSync(tmp);
    } catch {}
  }
}

/** In process a set with an index of valued decisions, on disk an append-only file trimmed past the limit. */
export function diskAsks(seenPath: string): AskStore {
  const path = asksPathOf(seenPath);
  let m = loaded.get(path);
  if (!m) loaded.set(path, (m = load(path)));
  const mem = m;
  return {
    has: (k) => mem.set.has(k),
    add: (k) => {
      if (mem.set.has(k)) return;
      mem.set.add(k);
      note(mem, k);
      try {
        appendFileSync(path, `${k}\n`);
      } catch {}
      // Trimmed in batches — a quarter of the limit's adds apart, not on every add.
      if (++mem.room > kept() / 4) {
        mem.room = 0;
        trim(path, mem);
      }
    },
    keys: () => mem.set,
    get: (k) => mem.index.get(k),
  };
}
