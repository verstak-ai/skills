// A satellite seat names the model its subagent runs on (graph @nks/nks-dev, node #7591): the
// harness's, not the agent's word — one rule for the OpenCode plugin and the pi extension.
import { takingArgs } from "./busyargs.ts";

/**
 * The stand arguments of a satellite with the harness's model; the satellite's name does not
 * derive from it. The agent's model is always dropped: no model from the harness — no model.
 * A busy line alone stays one (#6509): the bridge runs it so only while it holds a seat in the
 * call's graph (`heldRealms` — the graphs of its seats, SeatRealms) and nothing but the busy-only
 * arguments is set; otherwise the stand takes the seat and names the model. The bridge compares
 * graphs in their canonical form, which the harness does not know: two spellings count as two
 * graphs here, so at worst a busy line takes the held seat again, with the harness's model.
 */
export function withHarnessModel(
  args: Record<string, unknown>,
  model: string | null | undefined,
  heldRealms: readonly string[],
): Record<string, unknown> {
  if (!args.satellite_of) return args;
  const { model: _said, ...own } = args;
  const realm = typeof own.realm === "string" ? own.realm.trim() : "";
  const holds = !!realm && heldRealms.includes(realm);
  const busy = holds && typeof own.status === "string" && takingArgs(own).length === 0;
  return model && !busy ? { ...own, model } : own;
}

/**
 * The graphs the bridge holds seats in, from its channel words: the main seat ("held") and each
 * seat beside ("beside"); a seat goes with "beside-gone" and with released, stopped, dead or
 * evicted — of its key, or of all seats when the word names none (standing_ended comes as these).
 */
export interface SeatRealms {
  see(data: unknown): void;
  realms(): string[];
  clear(): void;
}

export function createSeatRealms(): SeatRealms {
  const seats = new Map<string, string>(); // key → graph as the bridge named it
  let main: string | null = null; // a new main seat replaces the former one
  return {
    see(data) {
      const d = (data ?? {}) as { kind?: unknown; key?: unknown; place?: { realm?: unknown } };
      const key = typeof d.key === "string" && d.key ? d.key : null;
      const realm = typeof d.place?.realm === "string" ? d.place.realm.trim() : "";
      if ((d.kind === "held" || d.kind === "beside") && key && realm) {
        if (d.kind === "held") {
          if (main && main !== key) seats.delete(main);
          main = key;
        }
        seats.set(key, realm);
      } else if (
        typeof d.kind === "string" &&
        ["beside-gone", "released", "stopped", "dead", "evicted"].includes(d.kind)
      ) {
        if (key) seats.delete(key);
        else if (d.kind !== "beside-gone") seats.clear();
      }
    },
    realms: () => [...new Set(seats.values())],
    clear: () => {
      seats.clear();
      main = null;
    },
  };
}
