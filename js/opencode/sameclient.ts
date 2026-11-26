// The other seats a stopped session's client still serves (host.ts archiver): one OpenCode
// process may hold several seated roots (a shared run), and its client is not one stop's to close.
// Read from the process's instances (twins.ts registry), no registry of its own.
import { clientOf } from "./client.ts";
import { registry } from "./twins.ts";

/**
 * Seat names of the roots, other than `id`, holding a seat in any instance of this process and
 * served by the client `pid`; a stopped root's seat is already off the list.
 */
export function seatsOfClient(id: string, pid: number): string[] {
  const seated = new Map<string, string>();
  for (const t of registry())
    for (const s of t.holders()) {
      const slot = t.holds(s);
      if (slot && !slot.child && slot.place) seated.set(s, slot.place.name);
    }
  return [...seated].filter(([s]) => s !== id && clientOf(s)?.pid === pid).map(([, name]) => name);
}
