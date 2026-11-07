// Legacy/mixed bridge batches still obey the soft graph path (#7334).
import type { ChannelEvent } from "../bridge/door.ts";
import { batchHead, batchLines } from "./frame-text.ts";
import { isGraphInbox } from "./graph-inbox.ts";
import { deliveryKeys, splitBatch } from "./seen.ts";
import { staleBatch } from "./stalebatch.ts";

export function separateGraphBatch(ev: ChannelEvent) {
  const graph = ev.frames?.filter(isGraphInbox) ?? [];
  if (!graph.length) return { graph, rest: ev };
  const other = splitBatch(ev.frames ?? [], Infinity, () => false).kept.filter(
    (f) => !isGraphInbox(f),
  );
  const graphMarks = new Set(graph.flatMap((f) => deliveryKeys(f)));
  const text = !other.length
    ? ""
    : ev.kind === "stale"
      ? staleBatch(other, () => false).text
      : [batchHead(other), ...batchLines(other)].filter(Boolean).join("\n");
  return {
    graph,
    rest: {
      ...ev,
      frames: other,
      marks: ev.marks?.filter((key) => !graphMarks.has(key)),
      text,
    },
  };
}
