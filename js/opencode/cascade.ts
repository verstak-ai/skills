// A cancel of the parent's turn is no cancel of the child (graph @nks/nks-dev, node #6625; case №147).
// OpenCode 2.0.22 (core/src/tool/plugin/subagent.ts): a task tool with background=false waits
// for the child, and interrupting the parent's turn interrupts the child without a reason,
// i.e. "user" — the same event as a direct cancel. The parent tells them apart: in a cascade
// its own turn is interrupted with "user" close in time (the two events come in any order).
/* eslint-disable @typescript-eslint/no-explicit-any -- SDK events without a schema */
import { envName } from "../delivery/index.ts";
import { sleep } from "./bridge-io.ts";

/** The window in which the parent's and the child's interruptions count as one cancel. */
const WINDOW_MS = Number(process.env[envName("CASCADE_MS")]) || 3_000;

export interface Cascade {
  /** Every service event: interruptions with reason "user" are remembered per session. */
  note(ev: any): void;
  /** The child's turn interrupted at t was cut by its parent's cancel — waits up to the window. */
  byParent(parent: Promise<string | null>, t: number): Promise<boolean>;
}

export function createCascade(): Cascade {
  const cut = new Map<string, number>();
  return {
    note(ev) {
      const s: unknown = ev?.data?.sessionID;
      if (ev?.type !== "session.execution.interrupted" || ev.data?.reason !== "user") return;
      if (typeof s !== "string") return;
      const now = Date.now();
      for (const [k, at] of cut) if (now - at > 2 * WINDOW_MS) cut.delete(k);
      cut.set(s, now);
    },
    async byParent(parent, t) {
      const p = await parent.catch(() => null);
      if (!p) return false;
      const near = (): boolean => {
        const at = cut.get(p);
        return at !== undefined && Math.abs(at - t) <= WINDOW_MS;
      };
      while (!near() && Date.now() - t < WINDOW_MS) await sleep(50);
      return near();
    },
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */
