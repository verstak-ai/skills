// Silence watch of the dispatcher connection (graph @nks/nks-dev, nodes #5397, #8620): a ping
// or a frame on it is life of every subscription it carries; silent past three ping intervals
// (with the channel's floor) — hung: the connection is closed and reopened aloud. No ping seen
// by the runtime — no timer, as on a seat's socket (../shared/channel.ts).
import * as diagnostics from "node:diagnostics_channel";

import { PING_CHANNEL, SILENT_FLOOR_MS, SILENT_INTERVALS } from "../shared/channel.ts";

export interface Silence {
  /** A frame came, or the connection opened. */
  life(): void;
  /** A protocol ping came (the runtime's socket event). */
  ping(): void;
  /** The ping interval from hello: the watch starts. */
  arm(pingMs: number): void;
  stop(): void;
}

export function watchSilence(
  current: () => WebSocket | null,
  hung: (silentS: number, pingS: number) => void,
): Silence {
  let lastLife = 0;
  let pingMs = 0;
  let seesPings = false;
  let lastTick = 0;
  let timer: ReturnType<typeof setInterval> | null = null;
  const ping = (): void => {
    lastLife = Date.now();
    seesPings = true;
  };
  // Node 22 does not name the ping's socket: a foreign ping may only extend life.
  diagnostics.subscribe?.(PING_CHANNEL, (m: unknown) => {
    const from = (m as { websocket?: unknown } | null)?.websocket;
    const ws = current();
    if (ws && (from === undefined || from === ws)) ping();
  });
  const stop = (): void => {
    if (timer) clearInterval(timer);
    timer = null;
  };
  return {
    life: () => void (lastLife = Date.now()),
    ping,
    arm(ms) {
      if (!(ms > 0) || (timer && ms === pingMs)) return;
      stop();
      pingMs = ms;
      const every = Math.max(pingMs, 250);
      lastTick = Date.now();
      timer = setInterval(() => {
        const now = Date.now();
        // Late by intervals — the process slept, not the service: the measure starts over.
        if (now - lastTick > 2 * every + 1000) lastLife = now;
        lastTick = now;
        if (!current() || !seesPings) return;
        const silent = now - lastLife;
        if (silent <= Math.max(SILENT_INTERVALS * pingMs + 1000, SILENT_FLOOR_MS)) return;
        stop();
        hung(Math.round(silent / 1000), pingMs / 1000);
      }, every);
      timer.unref?.();
    },
    stop,
  };
}
