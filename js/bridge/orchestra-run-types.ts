import type { ModelRef } from "./exec-spec.ts";
import type { RunTree } from "./orchestra-tree-types.ts";

export type RunState =
  "preparing" | "ambiguity" | "launched" | "raised" | "stopping" | "ended" | "refused" | "no_seat";
export interface Run {
  tree?: RunTree;
  exec?: {
    attempt: string;
    receipt: string;
    server: string;
    model: ModelRef;
    session?: string;
    incarnation?: string;
    /** Observed exact-client exit, not proof of durable halt. */
    exit?: string;
  };
  /** A dsh process the bridge started itself (#10777): its pid, its event file, what it said. */
  dsh?: {
    pid: number;
    events: string;
    /** This run's model overlay: its path in the command line proves the pid ours. */
    model?: string;
    session?: string;
    /** The `final` event's reason kind. */
    final?: string;
    /** Observed exit: its code, or "unknown" when not proven ours after a restart. */
    exit?: string;
    terminated?: string;
  };
  realm: string;
  room: string;
  invite: number;
  karta: number;
  launcher: string;
  harness: string;
  model: string;
  repository: string;
  worktree: string;
  terminal?: string;
  runtime?: string;
  /** The launch answer's prompt words (#9966): delivery "submit" with outcome
   * "handed-to-terminal" is the only observed proof the brief was handed over. */
  prompt?: { delivery: string; outcome: string };
  /** The launch answer's receipt words (#9966), a safe short projection. */
  receipt?: { mode: string; reason: string };
  closed?: string;
  state: RunState;
  at: string;
  why?: string;
  standing_id?: string;
  n?: number;
  rooms?: number;
  sat?: boolean;
  order_id?: string;
  stopping_at?: string;
  stop_outcome?: string;
  /** A failed order after the exact terminal exited was replaced once by the exit stop. */
  restop?: boolean;
}
