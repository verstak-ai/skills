// Read-only service calls share the root's bridge, but never restore its standing.
import type { OnboardCall } from "../shared/onboardstart.ts";
import type { Slot } from "./slot.ts";

export async function inSlot<T>(slot: Slot, call: () => Promise<T>): Promise<T> {
  slot.busy++;
  try {
    return await call();
  } finally {
    slot.busy--;
    slot.lastCall = Date.now();
  }
}

export function serviceCalls(
  slotFor: (session: string) => Promise<Slot>,
  ready: (slot: Slot) => Promise<void>,
): (session: string) => OnboardCall {
  return (session) => async (name, args, signal) => {
    signal.throwIfAborted();
    const slot = await slotFor(session);
    return inSlot(slot, async () => {
      let onAbort: (() => void) | undefined;
      const aborted = new Promise<never>((_resolve, reject) => {
        onAbort = () => reject(signal.reason);
        signal.addEventListener("abort", onAbort, { once: true });
        if (signal.aborted) onAbort();
      });
      try {
        await Promise.race([ready(slot), aborted]);
      } finally {
        if (onAbort) signal.removeEventListener("abort", onAbort);
      }
      signal.throwIfAborted();
      return slot.bridge.request(
        "tools/call",
        { name, arguments: args },
        { service: true, signal },
      );
    });
  };
}
