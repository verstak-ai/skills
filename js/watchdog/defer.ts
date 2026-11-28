// A word the server deferred, or a question to the seat, goes into the Codex thread after the
// running turn, not into it (graph @nks/nks-dev, nodes #11433, #11421): turn/start on a busy
// thread steers (#4294), and this connection hears no turn of the thread — no turn signal is
// recorded for it. So such a frame waits the bridge's former batch window, the same knob, or
// goes earlier with the next frame that interrupts anyway: no worse than before the bridge
// handed it out at once. Held frames are not marked delivered: the bridge's ring replays them
// to the next arming; the end gate and the owner's stop drop them with the process.
import { envName } from "../delivery/index.ts";
import { askFromPerson } from "../shared/asks.ts";
import { classifyOrigin, type Frame } from "../shared/channel.ts";
import { deferredMine } from "../shared/room-kinds.ts";

/** The window; the variable is the bridge's batch seam (roomstack.ts), not a human knob. */
export const DEFER_MS = Number(process.env[envName("BRIDGE_ROOM_BATCH_MS")]) || 60_000;

export interface Carrier {
  frame: Frame;
  raw: string;
}

/** Waits out the turn: deferred to the seat, and not a human's word, which goes now (#6081). */
export function afterTurn(frame: Frame): boolean {
  if (!deferredMine(frame)) return false;
  return (frame.origin ?? classifyOrigin(frame)) !== "human" || askFromPerson(frame);
}

export class DeferHold {
  private readonly held: Carrier[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;
  private readonly flush: (held: Carrier[]) => void;
  constructor(flush: (held: Carrier[]) => void) {
    this.flush = flush;
  }

  /** false — the same frame already waits (a repeat behind the bridge, #5831). */
  hold(c: Carrier): boolean {
    const id = c.frame.id;
    if (typeof id === "string" && this.held.some((h) => h.frame.id === id)) return false;
    this.held.push(c);
    this.timer ??= setTimeout(() => this.flush(this.take()), DEFER_MS);
    return true;
  }

  get size(): number {
    return this.held.length;
  }

  /** Everything held, oldest first; the window stops. */
  take(): Carrier[] {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    return this.held.splice(0);
  }
}
