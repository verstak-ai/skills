import type { ModelRef } from "./exec-spec.ts";

export type RunState =
  "preparing" | "ambiguity" | "launched" | "raised" | "stopping" | "ended" | "refused" | "no_seat";
export interface Run {
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
}
