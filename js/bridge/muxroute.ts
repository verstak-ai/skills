// Frames of the dispatcher connection to the sessions of the daemon (graph @nks/nks-dev, nodes
// #8622, #8616, #8621): a subscription per seat channel, the table channel_id → the session
// holding it; a frame goes to that session only and is acked {channel_id, sub, seq}, a repeat
// of its id is acked and goes to no one; a frame without a channel — the journal, no one.
import { type Frame, holdSocket, statusUrl } from "../shared/channel.ts";
import { closedBy, type Ends, refusedBy } from "./muxends.ts";
import { type FrameRoutes, routeFrame } from "./muxframe.ts";
import { createLink, type Link } from "./muxlink.ts";
import { pauseOf } from "./muxprobe.ts";
import { asSeatFrame, deliver, earlyLines, holdEarly, type Sub } from "./muxsub.ts";
import { createTable, type SubTable } from "./muxtable.ts";
import { createTicker, type Ticker } from "./muxtick.ts";

export interface Mux extends Pick<SubTable, "liveOf" | "heldOf" | "settled"> {
  readonly link: Link;
  readonly ticker: Ticker;
  add(s: Sub): void;
  /** The holder lets the subscription go: its leaving lines in one tick, then unsubscribe. */
  release(s: Sub): void;
  /** The secret's channel goes through the dispatcher, not a socket per seat. */
  carries(secret: string): boolean;
}

/** `onSocket` — a subscription went to a socket per seat: what it held for hello is its. */
export function createMux(url: string, onSocket?: (s: Sub) => void): Mux {
  const table = createTable();
  const { subs, byRef, byChannel, onSockets, active } = table;
  let refs = 0;
  const link: Link = createLink(url, {
    wanted: () => active().length > 0,
    onOpen: () => active().forEach(subscribe),
    onMessage: (raw) => routeFrame(raw, routes),
    onDrop,
    onHung: (text) => active().forEach((s) => (s.o.onHung ?? s.o.onNote)?.(text)),
    onFallback: () => [...subs].forEach(toSocket),
  });
  const ticker = createTicker((tick) => link.send(tick));

  function subscribe(s: Sub): void {
    if (s.retry) clearTimeout(s.retry);
    s.retry = null;
    if (s.closed || s.fallback) return;
    if (!link.open) return link.connect();
    s.ref = `r${++refs}`;
    byRef.set(s.ref, s);
    link.send({ type: "subscribe", secret: s.secret, ref: s.ref });
  }

  function toSocket(s: Sub): void {
    subs.delete(s);
    if (s.handing) return end(s, () => s.handing?.onGone(0));
    onSockets.add(s.secret);
    if (s.closed) return;
    s.fallback = holdSocket(s.o);
    onSocket?.(s);
  }

  function end(s: Sub, word?: () => void): void {
    Object.assign(s, { closed: true, live: false });
    subs.delete(s);
    if (s.channel && byChannel.get(s.channel) === s) byChannel.delete(s.channel);
    if (s.retry) clearTimeout(s.retry);
    if (s.channel) ticker.drop(s.channel); // its leaving lines went before the unsubscribe
    word?.();
    s.handing = null;
    if (!active().length) link.idle();
  }

  // Lines put for the tact while the subscription lived wait for its next hello (#8620 v15): the
  // server refuses them before it. The pulse is not held: the holding sends one on hello.
  function holdBack(s: Sub): void {
    if (!s.channel) return;
    const url = statusUrl(s.o.url);
    for (const [{ standing_id: id, status, usage }, lost] of ticker.take(s.channel)) {
      if (typeof status === "string") holdEarly(s, { url, scope: id ?? null, fields: { status } });
      if (usage) holdEarly(s, { url, scope: id ?? null, fields: { usage }, lost });
    }
  }

  // The channel stays routed meanwhile: a channel_closed before the new hello is still its word.
  function again(s: Sub): void {
    s.live = false;
    holdBack(s);
    s.o.onDropped?.();
    s.retry = setTimeout(() => subscribe(s), pauseOf(s.tries++));
  }

  function onDrop(): void {
    byRef.clear();
    byChannel.clear();
    for (const s of [...subs]) {
      if (s.handing) end(s, () => s.handing?.onGone(1006));
      else if (s.closed) subs.delete(s);
      else {
        if (s.live) s.o.onDropped?.();
        Object.assign(s, { live: false, ref: null });
        holdBack(s);
      }
    }
  }

  function hello(s: Sub, f: Frame): void {
    const channel = String(f.channel_id);
    Object.assign(s, { channel, sub: String(f.sub), heardAt: Date.now() });
    byChannel.set(channel, s);
    if (s.closed) return void link.send({ type: "unsubscribe", channel_id: channel });
    const named = f.standings ?? [];
    const standings = named.map((x) => x.standing_id ?? "").filter(Boolean);
    // From its hello the subscription earns back its resubscribe after an unasked 1000 (muxends.ts).
    Object.assign(s, { live: true, tries: 0, standings, seats: named.length, helloAt: Date.now() });
    for (const [e, lost] of earlyLines(s, channel)) ticker.put(e, lost);
    link.proven(Number(f.ping_interval_seconds) * 1000);
    const seat = asSeatFrame(f);
    s.o.onFrame(seat.raw, seat.frame);
  }

  function frame(s: Sub, f: Frame, channel: string): void {
    if (deliver(s, f)) link.send({ type: "ack", channel_id: channel, sub: f.sub, seq: f.seq });
  }

  const ends: Ends = { end, again, toSocket };
  const refused = (s: Sub, code: string): void => refusedBy(ends, s, code);
  const closed = (s: Sub, code: number, why: string): void => closedBy(ends, s, code, why);
  const routes: FrameRoutes = { byRef, byChannel, hello, refused, closed, frame };

  return {
    link,
    ticker,
    add(s) {
      onSockets.delete(s.secret);
      subs.add(s);
      subscribe(s);
    },
    release(s) {
      if (s.closed) return;
      s.closed = true;
      if (s.live && s.channel) {
        ticker.flushChannel(s.channel);
        link.send({ type: "unsubscribe", channel_id: s.channel });
      }
      if (!s.live && !(s.ref && byRef.has(s.ref))) end(s);
      else if (!active().length) link.idle();
    },
    liveOf: table.liveOf,
    heldOf: table.heldOf,
    settled: table.settled,
    carries: (secret) => link.mode !== "fallback" && !onSockets.has(secret),
  };
}
