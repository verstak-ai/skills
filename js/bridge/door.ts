// A seat's local door: the grant-dir socket its watchdog attaches to, its frame ring
// and delivered memory (graph @nks/nks-dev, nodes #4230, #5838). One service socket
// per channel (hold.ts), one door per seat: a frame goes to its own seat's door.
import { chmodSync, mkdirSync, unlinkSync, utimesSync } from "node:fs";
import { createServer, type Server, type Socket } from "node:net";
import { dirname } from "node:path";

import { DOOR } from "../delivery/index.ts";
import { type Frame } from "../shared/channel.ts";
import { words } from "../shared/lang.ts";
import { bindScope } from "../shared/scope.ts";
import { foldedTacts, type Marks, noteSeen, seenIds, splitBatch } from "../shared/seen.ts";
import {
  keyFilePathOf,
  privateDirProblem,
  seenFilePathOf,
  shortSocketDir,
  socketPathOf,
  standingsDirOf,
} from "../shared/standings.ts";
import { Backlog } from "./backlog.ts";
import { CFG } from "./config.ts";
import { closeServerKeeping, stampOf, unlinkOwned, writeOwned } from "./doorfiles.ts";
import { marksOf } from "./fanout.ts";
import { countOnly, emitBatch, RoomBatch } from "./roomstack.ts";
import { StaleBurst } from "./stale.ts";
import { log } from "./streams.ts";
import { sweepStale } from "./sweep.ts";

const RING = 20; // frames a late-attaching client gets retroactively

/** Key of a standing without a seat — the socket from the environment (hold.ts keyFor). */
export const ENV_KEY = "env";

export interface ChannelEvent {
  // held — the bridge took the socket (OpenCode plugin holding, #5140); backlog — a wake batch; lost, resumed — synthesized by the plugin (#5366);
  // handover — the machine daemon hands the seat to a successor: the door reopens at the same path (watchdog/client.ts)
  // prettier-ignore
  kind: "attached" | "frame" | "note" | "dead" | "alive" | "evicted" | "stale" | "released" | "held" | "backlog" | "lost" | "resumed" | "handover" | "beside" | "beside-gone";
  key?: string;
  raw?: string;
  frame?: Frame | null;
  text?: string;
  code?: number;
  version?: string;
  buffered?: number;
  /** kind="attached": this seat's delivered-memory file — the watchdog reads it instead of deriving the path. */
  seen?: string;
  /** kind="stale": frames received while unheard or replayed, judged by the watchdog (shared/stalebatch.ts); kind="backlog": shown frames by received_at. */
  frames?: Frame[];
  /** kind="stale" and "backlog": delivery marks of the batch (seen.ts splitBatch), written by whoever delivers it. */
  marks?: string[];
  /** kind="stale" from an older bridge: marks beyond the shown frames (watchdog/client.ts staleOf). */
  unshown?: string[];
  /** kind="held": the held seat — the OpenCode plugin seats a child session as satellite by it (#6002). */
  place?: { realm: string; karta: string; name: string };
  /** kind="backlog": frames pending per hello. */
  pending?: number;
  /**
   * kind="frame" from a room batch (roomstack.ts): position `at` of `of`; the batch is one wake.
   * Asides folding (#6081, foldAsides): folded — merged into the next frame's line;
   * fold — how many words of the run this frame's line closes.
   */
  batch?: { at: number; of: number; fold?: number; folded?: true };
  /** kind="released": released by this session's own close or revoke — the watchdog exits without alarm (#6638). */
  own?: true;
}

export interface DoorHooks {
  onAttach: () => void;
  /** An event a late attacher must learn rather than read as silence (seat taken). */
  lateEvent: () => ChannelEvent | null;
  onError: (text: string) => void;
}

export class Door {
  readonly key: string;
  readonly clients = new Set<Socket>();
  readonly ring: { raw: string; frame: Frame | null }[] = [];
  /** Delivered frames — the same memory the exit watchdog reads (../shared/seen.ts). */
  seen: Set<string>;
  /** Since when no local client listens; null — someone listens. */
  idleAt: number | null = Date.now();
  readonly marks: Marks = (k) => marksOf(this.seen, this.seenPath)(k);
  /** Stale and wake batches are per seat (#5838). */
  readonly stale = new StaleBurst(this.marks);
  readonly backlog = new Backlog(this.marks);
  /** Room batch for watchdogs, not notification clients (roomstack.ts, #5851). */
  readonly roomBatch = new RoomBatch(this.marks);
  /** Platform seat id (hello standings[].standing_id). */
  standingId: string | null = null;
  /** Seat address @handle:name — from hello, or derived from the main seat's handle for a seat beside. */
  address: string | null = null;
  addressDerived = false;
  /** Why the local socket did not come up; null — up or still coming up. */
  listenError: string | null = null;
  private server: Server | null = null;
  private freshen: ReturnType<typeof setInterval> | null = null;
  /** Stamps of the .key and .sock this door laid (doorfiles.ts): close removes only those. */
  private stamps: { key: string | null; sock: string | null } = { key: null, sock: null };
  private readonly hooks: DoorHooks;
  // Captured from the opening session's scope: the door may be closed from another scope (daemon exit).
  private readonly authDir: string;
  private readonly serverUrl: string;

  constructor(key: string, hooks: DoorHooks) {
    this.key = key;
    this.hooks = {
      onAttach: bindScope(hooks.onAttach),
      lateEvent: bindScope(hooks.lateEvent),
      onError: bindScope(hooks.onError),
    };
    this.authDir = CFG.authDir;
    this.serverUrl = CFG.serverUrl;
    this.seen = seenIds(this.seenPath);
  }

  /** A seat keeps its delivered memory per server beyond the bridge; the "env" standing's memory dies with it. */
  get persistent(): boolean {
    return this.key !== ENV_KEY;
  }

  get seenPath(): string {
    return seenFilePathOf(this.authDir, this.key, this.persistent ? this.serverUrl : "");
  }

  get socketPath(): string {
    return socketPathOf(this.authDir, this.key);
  }

  /** The socket at the path is this door's, not one a successor laid over it. */
  get ownsSocket(): boolean {
    return !!this.stamps.sock && stampOf(this.socketPath) === this.stamps.sock;
  }

  push(raw: string, frame: Frame | null): void {
    this.ring.push({ raw, frame });
    if (this.ring.length > RING) this.ring.shift();
  }

  broadcast(ev: ChannelEvent): void {
    const line = JSON.stringify(ev) + "\n";
    for (const c of this.clients) {
      try {
        c.write(line);
      } catch {
        this.clients.delete(c);
      }
    }
  }

  open(): void {
    const path = this.socketPath;
    const key = this.key;
    const authDir = this.authDir;
    mkdirSync(standingsDirOf(authDir), { recursive: true, mode: 0o700 });
    if (process.platform !== "win32" && dirname(path) === shortSocketDir()) {
      const bad = privateDirProblem(dirname(path));
      if (bad) {
        this.listenError = bad;
        this.hooks.onError(words(DOOR).privateDir(bad));
        return;
      }
    }
    sweepStale(authDir, key);
    this.stamps = { key: writeOwned(keyFilePathOf(authDir, key), key + "\n"), sock: null };
    if (process.platform !== "win32") {
      try {
        unlinkSync(path);
      } catch {}
    }
    const gone = (sock: Socket): void => {
      this.clients.delete(sock);
      if (this.clients.size === 0) this.idleAt = Date.now();
    };
    const srv = createServer(
      bindScope((sock: Socket) => {
        this.clients.add(sock);
        this.idleAt = null;
        sock.on("close", () => gone(sock));
        sock.on("error", () => gone(sock));
        this.hooks.onAttach();
        // Replay only ring frames no local client has delivered yet (the delivering client
        // marks them); frames held in a room batch come with it; a tact superseded later in
        // the ring is folded and marked by the bridge (#6569).
        const folded = foldedTacts(this.ring.map((r) => r.frame));
        for (const f of folded) if (f.id) noteSeen(this.seenPath, String(f.id), this.seen);
        const waiting = this.ring.filter(
          ({ frame }) =>
            frame?.type !== "message" ||
            (!folded.has(frame) &&
              !this.marks(String(frame.id ?? "")) &&
              !this.roomBatch.holds(frame)),
        );
        const msgs = waiting.flatMap(({ frame }) => (frame?.type === "message" ? [frame] : []));
        const kept = new Set<Frame | null>(splitBatch(msgs, Infinity, this.marks).kept);
        const backlog = waiting.filter(({ frame }) => frame?.type !== "message" || kept.has(frame));
        sock.write(
          JSON.stringify({
            kind: "attached",
            key,
            buffered: backlog.length,
            seen: this.seenPath,
          } satisfies ChannelEvent) + "\n",
        );
        // Case entries not addressed to the seat go first as one counted batch (#6574):
        // one by one the watchdog would take them for a wake.
        const counts = backlog.filter((h): h is { raw: string; frame: Frame } =>
          countOnly(h.frame),
        );
        const put = (ev: ChannelEvent): void => void sock.write(JSON.stringify(ev) + "\n");
        if (counts.length) emitBatch(counts, put);
        for (const { raw, frame } of backlog) {
          if (!countOnly(frame)) put({ kind: "frame", raw, frame });
        }
        // Seat taken and the watchdog re-armed: silence would read as hearing.
        const late = this.hooks.lateEvent();
        if (late) sock.write(JSON.stringify(late) + "\n");
      }),
    );
    srv.on("error", (e) => {
      this.listenError = e.message;
      this.hooks.onError(words(DOOR).listenFailed(e.message));
    });
    srv.listen(
      path,
      bindScope(() => {
        if (process.platform !== "win32") {
          try {
            chmodSync(path, 0o600);
          } catch {}
        }
        this.stamps.sock = stampOf(path);
        log(`standing socket held; local listeners attach at ${path}`);
        // Keep /tmp cleaners (macOS: 3 days without access) off a long watch's socket.
        if (dirname(path) === shortSocketDir()) {
          const touch = (): void => {
            const now = new Date();
            const mine = stampOf(path) === this.stamps.sock;
            for (const p of mine ? [dirname(path), path] : [dirname(path)])
              try {
                utimesSync(p, now, now);
              } catch {}
          };
          this.freshen = setInterval(touch, 6 * 3600_000);
          this.freshen.unref?.();
        }
      }),
    );
    this.server = srv;
  }

  flushBatches(): void {
    this.backlog.flushNow();
    this.roomBatch.flushNow();
  }

  /**
   * Close the door: clients, server, key and socket files. Idempotent. A seat's
   * delivered memory stays: a new bridge gets the same queue again (#5831); sweep.ts
   * removes old files by age.
   */
  close(): void {
    this.flushBatches();
    this.stale.drop();
    for (const c of this.clients) {
      try {
        c.end();
      } catch {}
    }
    this.clients.clear();
    if (this.freshen) clearInterval(this.freshen);
    const srv = this.server;
    this.server = null;
    const shut = (): void => {
      try {
        srv?.close();
      } catch {}
    };
    // Only own files: a successor of the same seat may sit at the same path (doorfiles.ts).
    if (process.platform === "win32" || !this.stamps.sock) shut();
    else closeServerKeeping(this.socketPath, this.stamps.sock, shut);
    unlinkOwned(keyFilePathOf(this.authDir, this.key), this.stamps.key);
    this.stamps = { key: null, sock: null };
    if (!this.persistent) {
      try {
        unlinkSync(this.seenPath);
      } catch {}
    }
    this.ring.length = 0;
    this.idleAt = null;
  }
}
