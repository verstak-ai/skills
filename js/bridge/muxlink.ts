// The daemon's one dispatcher connection per api (graph @nks/nks-dev, nodes #8620, #8622): GET
// <apiBase>/channel/mux, no secret in it. A seen 404/405 — a socket per seat till the restart
// (muxprobe.ts judges); anything else and a drop after opening — a jittered ladder pause.
import { CHANNEL } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import { type Attempt, attempt, type AttemptEnd } from "./muxattempt.ts";
import { watchSilence } from "./muxlife.ts";
import { pauseOf, verdictOf } from "./muxprobe.ts";
import { log } from "./streams.ts";

const IDLE_MS = 1_000;

export interface LinkHooks {
  /** Whether any subscription waits for the connection. */
  wanted(): boolean;
  onOpen(): void;
  onMessage(raw: string): void;
  /** The open connection is gone; a reconnection follows if still wanted. */
  onDrop(code: number): void;
  onHung(text: string): void;
  onFallback(why: string): void;
}

export interface Link {
  readonly open: boolean;
  /**
   * "probing" — never opened yet; "mux" — opened at least once, stays so across drops;
   * "fallback" — a seen 404/405: a socket per seat until the process restarts.
   */
  readonly mode: "probing" | "mux" | "fallback";
  connect(): void;
  send(frame: object): boolean;
  /** A hello came: the connection works — the ladder starts over, the silence watch arms. */
  proven(pingMs: number): void;
  /** Nothing subscribed: closed after a short grace unless wanted again. */
  idle(): void;
}

export function createLink(url: string, h: LinkHooks): Link {
  let mode: Link["mode"] = "probing";
  let now: Attempt | null = null;
  let open = false;
  let asking = false;
  let tries = 0;
  let retry: ReturnType<typeof setTimeout> | null = null;
  let idler: ReturnType<typeof setTimeout> | null = null;
  const silence = watchSilence(
    () => (open ? (now?.sock ?? null) : null),
    (silentS, pingS) => {
      h.onHung(words(CHANNEL).hung(silentS, pingS));
      now?.end(1006);
    },
  );

  const later = (): void => {
    if (!h.wanted() || retry) return;
    retry = setTimeout(() => {
      retry = null;
      connect();
    }, pauseOf(tries++));
  };

  function ended(a: Attempt, e: AttemptEnd): void {
    if (now !== a) return;
    now = null;
    silence.stop();
    if (e.opened) {
      open = false;
      h.onDrop(e.code);
      return later();
    }
    asking = true;
    void verdictOf(url, e).then((v) => {
      asking = false;
      if (v.none) return fallBack(v.why);
      log(`dispatcher ${url}: ${v.why}`);
      later();
    });
  }

  function fallBack(why: string): void {
    mode = "fallback";
    log(`dispatcher ${url}: ${why} — a socket per seat until the daemon restarts`);
    h.onFallback(why);
  }

  function connect(): void {
    if (idler) clearTimeout(idler);
    idler = null;
    if (mode === "fallback" || now || retry || asking) return;
    try {
      const a: Attempt = attempt(url, {
        onOpen: () => {
          if (now !== a) return a.end(1000);
          [open, mode] = [true, "mux"];
          silence.life();
          h.onOpen();
        },
        onPing: () => silence.ping(),
        onMessage: (raw) => {
          if (now !== a) return;
          silence.life();
          h.onMessage(raw);
        },
        onEnd: (e) => ended(a, e),
      });
      now = a;
    } catch (e) {
      fallBack(`not opened: ${(e as Error).message}`);
    }
  }

  function shut(): void {
    idler = null;
    if (h.wanted()) return;
    if (retry) clearTimeout(retry);
    retry = null;
    const [a, was] = [now, open];
    [now, open] = [null, false];
    silence.stop();
    a?.end(1000);
    if (was) h.onDrop(1000); // the router forgets what this connection carried
  }

  return {
    get open() {
      return open;
    },
    get mode() {
      return mode;
    },
    connect,
    send(frame) {
      try {
        return !!(open && now) && (now.sock.send(JSON.stringify(frame)), true);
      } catch {
        return false;
      }
    },
    proven(pingMs) {
      tries = 0;
      silence.arm(pingMs);
    },
    idle() {
      if (idler || h.wanted()) return;
      idler = setTimeout(shut, IDLE_MS);
      idler.unref?.();
    },
  };
}
