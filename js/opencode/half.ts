// The "tools" half from outside (tools.ts) — what plugin.ts calls it by, and its empty
// form: no bridge found or the half did not come up, and the plugin loads on.
/* eslint-disable @typescript-eslint/no-explicit-any -- SDK events without a schema */
import { ROOT_SEAT } from "../delivery/index.ts";
import type { Bridge } from "../shared/bridge-client.ts";
import { words } from "../shared/lang.ts";
import type { OnboardCall } from "../shared/onboardstart.ts";
import type { Home, LostEntry } from "./records.ts";
import type { Seating } from "./rootseat-by.ts";
import type { Slot } from "./slot.ts";

export interface ToolsHalf {
  /** The session died — its bridge is released together with its standing. */
  forget(session: string): void;
  /** A service event: a lead subagent's turn, text, deletion (leads.ts, #6625). */
  onEvent(ev: any): void;
  /** A session's first prompt — the launch line with a case runs before the model's turn (launch.ts). */
  launch(session: string, text: string): Promise<string | null>;
  /** A root's seat by its project's cover — its own from disk, else a stand on the role (rootseat.ts). */
  seatRoot(
    session: string,
    realm: string,
    karta: string,
    cancelled: () => boolean,
  ): Promise<Seating>;
  cancelSeat(session: string): void;
  releaseSeat(session: string): Promise<void>;
  finishSeat(session: string): void;
  /** Read-only service calls, without returning or taking a standing. */
  onboardCall(session: string): OnboardCall;
  /** The stop; held seats that went into a marker — upward (twins.ts). */
  stop(): void | Promise<void | LostEntry[]>;
  bridgeOf(session: string): Bridge | null; // the holding slot's bridge — for session usage (usage.ts)
  /** The seat name of a live lead subagent; not a lead — null (notice.ts). */
  leadOf(session: string): string | null;
  /** A lead subagent ended or ending: nothing goes into its session (#7505, channel.ts). */
  ended(session: string): boolean;
  /** The launcher's seat name of a live lead subagent; otherwise null (channel.ts). */
  launcherOf(session: string): string | null;
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
  /** Child sessions whose own bridge holds a seat in this instance. */
  children(): string[];
  /** An ancestor of the child was stopped: its seat goes down as by its own 4001 (#7440, #6625). */
  halt(child: string): void;
}

export const idleHalf = (): ToolsHalf => ({
  forget() {},
  onEvent() {},
  launch: async () => null,
  seatRoot: async () => ({ error: words(ROOT_SEAT).noBridge() }),
  cancelSeat() {},
  releaseSeat: async () => {},
  finishSeat() {},
  onboardCall: () => async () => null,
  stop() {},
  bridgeOf: () => null,
  leadOf: () => null,
  ended: () => false,
  launcherOf: () => null,
  holders: () => [],
  owns: () => false,
  held: () => null,
  adopt() {},
  moved() {},
  children: () => [],
  halt() {},
});

/* eslint-enable @typescript-eslint/no-explicit-any */
