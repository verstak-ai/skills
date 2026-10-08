// The "tools" half from outside (tools.ts) — what plugin.ts calls it by, and its empty
// form: no bridge found or the half did not come up, and the plugin loads on.
/* eslint-disable @typescript-eslint/no-explicit-any -- SDK events without a schema */
import type { Bridge } from "../shared/bridge-client.ts";
import type { Home, LostEntry } from "./records.ts";
import type { Slot } from "./slot.ts";

export interface ToolsHalf {
  /** The session died — its bridge is released together with its standing. */
  forget(session: string): void;
  /** A service event: a lead subagent's turn, text, deletion (leads.ts, #6625). */
  onEvent(ev: any): void;
  /** A session's first prompt — the launch line with a case runs before the model's turn (launch.ts). */
  launch(session: string, text: string): Promise<string | null>;
  /** The stop; held seats that went into a marker — upward (twins.ts). */
  stop(): void | Promise<void | LostEntry[]>;
  bridgeOf(session: string): Bridge | null; // the holding slot's bridge — for session usage (usage.ts)
  /** The seat name of a live lead subagent; not a lead — null (notice.ts). */
  leadOf(session: string): string | null;
  /** Sessions with a held seat — root, lead satellite; roots first (keepalive.ts). */
  holders(): string[];
  /** The session has a bridge of this instance — it is in its directory (keepalive.ts). */
  owns(session: string): boolean;
  /** A root's slot holding a seat in this instance; none — null (twins.ts). */
  held(root: string): Slot | null;
  /** Take this location's marker now — a child moved here (adopt.ts, #6695). */
  adopt(): void;
  /** The session moved to location to (event session.moved). */
  moved(session: string, to: Home | null): void;
}

export const idleHalf = (): ToolsHalf => ({
  forget() {},
  onEvent() {},
  launch: async () => null,
  stop() {},
  bridgeOf: () => null,
  leadOf: () => null,
  holders: () => [],
  owns: () => false,
  held: () => null,
  adopt() {},
  moved() {},
});

/* eslint-enable @typescript-eslint/no-explicit-any */
