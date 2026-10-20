// The root seating's contract with the plugin (rootseat.ts) and its terms.
import { envName } from "../delivery/index.ts";
import type { Seating } from "./rootseat-by.ts";

/** How long the first prompt waits for the seating; the variable is for probes. */
export const rootSeatMs = (): number => Number(process.env[envName("ROOT_SEAT_MS")] || 15_000);
/** Agent-launched headless runs opt out explicitly; a root without parentID is not proof of a human. */
export const rootSeatEnabled = (): boolean => process.env[envName("ROOT_SEAT")] !== "0";
/** How long a seating holds the instance's line: the term and as much again, at most 5 s more. */
export const ceilingMs = (): number => rootSeatMs() + Math.min(rootSeatMs(), 5_000);
export const pause = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms).unref?.());

export interface RootSeatDoors {
  /** The session's directory; unknown — null, and the session is not seated. */
  directoryOf(session: string): Promise<string | null>;
  halted(session: string): boolean;
  seat(session: string, realm: string, karta: string, cancelled: () => boolean): Promise<Seating>;
  cancel(session: string): void;
  release(session: string): Promise<void>;
  finished(session: string): void;
  /** A word into the session by the channel's path — it comes before the model's next turn. */
  tell(session: string, text: string): void;
  /** A word into the running turn: steer, no new turn (leaddoors.ts teller). */
  steer(session: string, text: string): Promise<void> | void;
}

export interface RootSeats {
  /**
   * The root's first prompt: waits for the seating and gives its word once; a later prompt —
   * only a root waiting for its cover's alignment; null — nothing to say.
   */
  word(session: string): Promise<string | null>;
  /** Not seated for its cover's defect or absence: the word is the alignment's. */
  aligning(session: string): boolean;
  /**
   * A tool call of the root session (its own, or its child's): when it waits and its cover file
   * changed, the cover is read again; a seating it starts is waited for within the term, so its
   * word lands before the turn ends. Other waiting roots — on their own tool or prompt.
   */
  touched(session: string): Promise<void>;
  /**
   * Moved; here — this instance's folder as the event names it, null — elsewhere. Away while
   * waiting: the wait is set aside, a prompt back here is a first one again. Back into the
   * folder it waited in: the wait set aside waits again. A seating in flight is not touched —
   * half.moved carries it, as on a first prompt.
   */
  moved(session: string, here: string | null): void;
  forget(session: string): void;
  stop(): void;
}
