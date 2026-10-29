// The subscriptions a dispatcher connection carries (graph @nks/nks-dev, nodes #8620, #8622):
// the router's (muxroute.ts) tables — by ref of a subscribe in flight, by channel from hello —
// and what the holder facade (muxhold.ts) asks of them.
import { type Sub } from "./muxsub.ts";

export interface SubTable {
  subs: Set<Sub>;
  byRef: Map<string, Sub>;
  byChannel: Map<string, Sub>;
  /** Secrets sent to a socket per seat past the subscription limit. */
  onSockets: Set<string>;
  /** Subscriptions not let go and not on a socket per seat. */
  active(): Sub[];
  /** A live subscription of this seat secret, if the dispatcher carries it now. */
  liveOf(secret: string): Sub | null;
  /** The subscription of this secret not let go, live or waiting for hello. */
  heldOf(secret: string): Sub | null;
  /** Let-go subscriptions confirmed by channel_closed, or `ms` passed. */
  settled(ms: number): Promise<void>;
}

export function createTable(): SubTable {
  const subs = new Set<Sub>();
  const active = (): Sub[] => [...subs].filter((s) => !s.closed && !s.fallback);
  return {
    subs,
    byRef: new Map(),
    byChannel: new Map(),
    onSockets: new Set(),
    active,
    liveOf: (secret) => active().find((s) => s.live && s.secret === secret) ?? null,
    heldOf: (secret) => active().find((s) => s.secret === secret) ?? null,
    async settled(ms) {
      for (const until = Date.now() + ms; Date.now() < until;) {
        if (![...subs].some((s) => s.closed)) return;
        await new Promise((r) => setTimeout(r, 20));
      }
    },
  };
}
