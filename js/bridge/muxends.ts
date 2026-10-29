// How the server's word ends a subscription (graph @nks/nks-dev, node #8620 v15): a refused
// subscribe by its code, a channel_closed by its class. The router (muxroute.ts) does the acts.
import { type Sub } from "./muxsub.ts";
import { GAP_MS } from "./muxtick.ts";
import { log } from "./streams.ts";

const DEAD_SECRET = new Set(["secret_invalid", "secret_dead"]);
const REVOKED = 4004; // channel_closed of a revoked seat
const EXPIRED = 4002; // channel_closed of a subscription the server let lapse

export interface Ends {
  /** The subscription is over: `word` tells the holder why (nothing — its own release). */
  end(s: Sub, word?: () => void): void;
  /** Subscribed again after a pause of the ladder. */
  again(s: Sub): void;
  toSocket(s: Sub): void;
}

/** error{ref, code} on a subscribe: a dead secret — as a dead token; the limit — a socket per seat. */
export function refusedBy(e: Ends, s: Sub, code: string): void {
  if (s.closed) return e.end(s);
  if (DEAD_SECRET.has(code)) return e.end(s, () => s.o.onDeadToken(4002));
  if (code === "limit_subscriptions") return e.toSocket(s);
  log(`dispatcher: subscription refused (${code}) — again later`);
  e.again(s);
}

/**
 * By class (#8620): 1000 — own unsubscribe answered; 4000 — another holds the channel; 4002
 * expired — subscribed again; 4004 revoked:person|self|gone — the seat is over, the stop. A 1000
 * nobody asked for is a server defect: subscribed again once; a second in a row is the end, as a
 * dead token. "In a row" (written in #8620): the subscription did not live a tact interval after its
 * hello. Any other code — subscribed again.
 */
export function closedBy(e: Ends, s: Sub, code: number, reason: string): void {
  if (s.closed) return e.end(s);
  if (s.handing) return e.end(s, () => s.handing?.onGone(code));
  if (code === 4000) return e.end(s, () => (s.o.onEvicted ?? s.o.onDeadToken)(code));
  if (code === REVOKED) return e.end(s, () => s.o.onStopped(code, reason));
  if (code === EXPIRED) {
    log(`dispatcher: ${s.channel} expired — subscribed again`);
    return e.again(s);
  }
  log(`dispatcher: ${s.channel} closed with ${code} (${reason}) — a server defect`);
  if (code === 1000) {
    const lived = s.helloAt > 0 && Date.now() - s.helloAt >= GAP_MS;
    if (s.resubscribed && !lived) return e.end(s, () => s.o.onDeadToken(code));
    Object.assign(s, { resubscribed: true, helloAt: 0 });
  }
  e.again(s);
}
