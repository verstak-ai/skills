// The pulse's pending (graph @nks/nks-dev, node #7529): what the bridge holds for its seats
// and no client has given to the agent yet.
import { deliveryKeys } from "../shared/seen.ts";
import { isDelivered } from "./fanout.ts";
import { doors } from "./hold.ts";

/**
 * Frames the bridge holds for its seats that no client has given to the agent yet: each door's
 * ring, its stale batch (a stale frame skips the ring, hold.ts), wake window and watchdogs' room
 * batch (both outlive the ring's cut) — one frame once, by id.
 */
export function pendingFrames(): number {
  let n = 0;
  for (const d of doors()) {
    const counted = new Set<unknown>();
    const held = [
      ...d.ring.map((r) => r.frame),
      ...d.stale.frames,
      ...d.backlog.frames,
      ...d.roomBatch.frames,
    ];
    for (const frame of held) {
      const one = typeof frame?.id === "string" ? frame.id : frame;
      if (frame?.type !== "message" || counted.has(one)) continue;
      counted.add(one);
      if (!isDelivered(deliveryKeys(frame), d.seen, d.seenPath)) n++;
    }
  }
  return n;
}
