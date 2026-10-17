// A call through a slot keeps the slot busy while it lasts and refreshes its idle time.
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
