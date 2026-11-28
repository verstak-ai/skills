// A silent session's bridge without a standing does not live forever: `opencode run` breeds
// sessions (tools.ts). A bridge in the middle of a call is not given to the reaper either.
import { IDLE_MS, REAP_MS, type Slot } from "./slot.ts";

/** The idle reaper of an instance's slots and its spare; the returned word stops it with the instance. */
export function startReaper(
  slots: Map<string, Slot>,
  spare: { get: () => Slot | null; set: (s: Slot | null) => void },
  serverSeen: () => boolean,
): () => void {
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [session, slot] of slots) {
      if (slot.holding || slot.busy > 0 || now - slot.lastCall < IDLE_MS) continue;
      slot.ownStop = true;
      slot.bridge.stop();
      slots.delete(session);
    }
    const idle = spare.get();
    if (idle && !idle.holding && now - idle.lastCall >= IDLE_MS && serverSeen()) {
      idle.ownStop = true;
      idle.bridge.stop();
      spare.set(null);
    }
  }, REAP_MS);
  timer.unref?.();
  return () => clearInterval(timer);
}
