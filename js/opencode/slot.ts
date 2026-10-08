// One session's bridge — a slot of the "tools" half (tools.ts); the type stands apart so
// that modules tools.ts calls (twins.ts, half.ts) take it without an import cycle.
import { envName, OPENCODE, PRODUCT } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import { type KeptSlot, WATCH_MS } from "./keep.ts";
import type { SatelliteSlot } from "./satellite.ts";

/**
 * The bridge of a session long silent and holding nothing is released. Invariant:
 * IDLE_MS > WATCH_MS — the hearing watchdog (keep.ts) looks at a slot that stood more
 * often than the reaper shrinks it, or a bridge that lost its seat would go before the return.
 */
export const IDLE_MS = Number(process.env[envName("BRIDGE_IDLE_MS")] || 30 * 60_000);
if (IDLE_MS <= WATCH_MS)
  process.stderr.write(`[${PRODUCT}/warning] ${words(OPENCODE).idleShort(IDLE_MS, WATCH_MS)}\n`);
/** The idle reaper's step; the variable is for probes. */
export const REAP_MS = Number(process.env[envName("BRIDGE_REAP_MS")] || 60_000);

/** One session's bridge. */
export interface Slot extends KeptSlot, SatelliteSlot {
  /** The handshake passed — tools may be called. */
  ready: Promise<unknown>;
  /** The root session the bridge belongs to; null — not given to anyone yet. */
  session: string | null;
  lastCall: number;
  /** Calls in flight — a bridge in the middle of a call is not given to the reaper. */
  busy: number;
  /** Stopped by the plugin itself — its exit is not a loss of hearing. */
  ownStop: boolean;
}
