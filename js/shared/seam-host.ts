// Daemon side of the seam (wire — seam.ts):
//   listenSeam(authDir, onSocket) local entrance (seam-entrance.ts): private 0700
//                                 directory, daemon life lock, 0600 socket; a dead
//                                 socket is removed, a live one refuses
//   serveSeam(socket, host)       handshake, ack, rpc, bye, reattach window
//   streamSeamSession(id, open)   an engine session over streams as a SeamSession
// The host (SeamHost) decides which session to open on hello and which to return by id.
import { chmodSync, unlinkSync } from "node:fs";
import { connect, createServer, type Server, type Socket } from "node:net";
import { createInterface } from "node:readline";
import { PassThrough } from "node:stream";

import {
  checkHello,
  readFrames,
  type RpcMessage,
  SEAM_PROTOCOL,
  SEAM_REATTACH_GRACE_MS,
  type SeamFrame,
  type SeamHello,
  writeFrame,
} from "./seam.ts";
import {
  seamDaemonLockPath,
  seamEntranceProblem,
  seamSocketPath,
  takeFileLock,
} from "./seam-entrance.ts";

/** An engine session as the seam sees it. */
export interface SeamSession {
  readonly id: string;
  /** A harness message into the session. */
  deliver(msg: RpcMessage): void;
  /**
   * Where the session writes to the harness: the current socket; null — no link, output
   * is lost. `logSink` — where the session's log goes (log frame to the thin bridge).
   */
  attach(sink: ((msg: RpcMessage) => void) | null, logSink?: ((line: string) => void) | null): void;
  /** End of the session; resolves when everything in flight is answered. A repeat call awaits the first. */
  end(why: string): Promise<void>;
}

/** The daemon's session host. */
export interface SeamHost {
  /** Daemon build, `vX.Y.Z+hash` — in welcome and refuse. */
  build: string;
  /** A new session by handshake; a string — refusal with this reason. */
  open(hello: SeamHello): SeamSession | string | Promise<SeamSession | string>;
  /** A live session by id, for reattach; null — none (a new one opens). */
  find(id: string): SeamSession | null;
  /** A daemon line into its log. */
  log?(msg: string): void;
  /** How many sessions the daemon holds — in a probe answer. */
  count?(): number;
  /** The daemon's file — in a probe answer. */
  path?: string;
  /**
   * The daemon is leaving (handing seats to a successor): new requests are not taken —
   * without ack the thin bridge knows they did not go and resends them to the successor.
   */
  draining?(): boolean;
  /**
   * A request the leaving daemon answers itself (satellite pause: the handover already
   * set it); null — not taken, like the rest.
   */
  answerDraining?(session: string, msg: RpcMessage): Promise<RpcMessage> | null;
}

const HELLO_WAIT_MS = 5_000;

// Reattach window: a session whose socket closed without bye waits for its thin bridge,
// then ends the same way as on bye.
const graceTimers = new Map<SeamSession, NodeJS.Timeout>();
// Whose socket carries the session now: closing the old one after reattach is no drop.
const owners = new Map<SeamSession, Socket>();

/** Serve one thin bridge connection. */
export function serveSeam(socket: Socket, host: SeamHost, graceMs = SEAM_REATTACH_GRACE_MS): void {
  const say = (m: string) => host.log?.(m);
  let session: SeamSession | null = null;
  let helloSeen = false;
  let byeing = false;
  const early: SeamFrame[] = []; // frames that came while the host opened the session
  const helloTimer = setTimeout(() => {
    if (!helloSeen) socket.destroy();
  }, HELLO_WAIT_MS);
  helloTimer.unref?.();
  socket.on("error", () => {}); // close reports the drop
  const refuse = (reason: string) => {
    say(`seam refused: ${reason}`);
    writeFrame(socket, { t: "refuse", seam: SEAM_PROTOCOL, build: host.build, reason });
    socket.end();
  };
  // A request reaches the session only after its ack reached the kernel: no ack at the
  // thin bridge means the session never saw it. Chained to keep arrival order.
  let chain = Promise.resolve();
  const onFrame = (s: SeamSession, f: SeamFrame) => {
    if (f.t === "rpc") {
      const msg = f.msg;
      const request = msg.method !== undefined && msg.id !== undefined && msg.id !== null;
      // A leaving daemon takes no new requests (the thin bridge resends them); notifications
      // and harness replies about what is in flight are still delivered; answerDraining
      // requests are taken and answered by the host.
      if (request && host.draining?.()) {
        const late = host.answerDraining?.(s.id, msg) ?? null;
        if (!late) {
          say(`request ${JSON.stringify(msg.id)} not taken: the daemon is handing over`);
          return;
        }
        writeFrame(socket, { t: "ack", id: msg.id as string | number });
        void late
          .then((reply) => writeFrame(socket, { t: "rpc", msg: reply }))
          .catch((e: Error) => say(`request ${JSON.stringify(msg.id)} failed: ${e.message}`));
        return;
      }
      chain = chain.then(
        () =>
          new Promise<void>((done) => {
            if (!request) {
              s.deliver(msg);
              return done();
            }
            writeFrame(socket, { t: "ack", id: msg.id as string | number }, (err) => {
              if (!err) s.deliver(msg);
              else say(`request ${JSON.stringify(msg.id)} not taken: its ack did not go out`);
              done();
            });
          }),
      );
    } else if (f.t === "bye") {
      byeing = true;
      owners.delete(s);
      chain = chain.then(() =>
        s.end(f.why || "bye").then(() => {
          writeFrame(socket, { t: "bye-ok" });
          socket.end();
        }),
      );
    }
  };
  readFrames(
    socket,
    (f) => {
      if (!helloSeen) {
        helloSeen = true;
        clearTimeout(helloTimer);
        const why = checkHello(f);
        if (why) return refuse(why);
        void accept(f as SeamHello);
        return;
      }
      if (session) onFrame(session, f);
      else early.push(f);
    },
    (line) => say(`unparseable seam line: ${line.slice(0, 120)}`),
  );
  const accept = async (hello: SeamHello) => {
    const welcome = (id: string | null, resumed: boolean) =>
      writeFrame(socket, {
        t: "welcome",
        seam: SEAM_PROTOCOL,
        build: host.build,
        pid: process.pid,
        session: id,
        resumed,
        ack: true,
        ...(id === null && host.count ? { sessions: host.count() } : {}),
        ...(id === null && host.path ? { path: host.path } : {}),
      });
    if (hello.probe) {
      welcome(null, false);
      socket.end();
      return;
    }
    // A leaving daemon drops rather than refuses (a refusal would send the thin bridge
    // full for good): the thin bridge waits for the successor by reattach.
    if (host.draining?.()) {
      say("seam hello dropped: the daemon is handing over to its successor");
      socket.destroy();
      return;
    }
    let s = hello.session ? host.find(hello.session) : null;
    const resumed = !!s;
    if (!s) {
      const opened = await host.open(hello);
      if (typeof opened === "string") return refuse(opened);
      s = opened;
    }
    const grace = graceTimers.get(s);
    if (grace) clearTimeout(grace);
    graceTimers.delete(s);
    session = s;
    owners.set(s, socket);
    welcome(s.id, resumed);
    s.attach(
      (msg) => writeFrame(socket, { t: "rpc", msg }),
      (line) => writeFrame(socket, { t: "log", line }),
    );
    say(
      `seam session ${s.id} ${resumed ? "resumed" : "opened"} for pid ${hello.pid} (${hello.build})`,
    );
    for (const f of early.splice(0)) onFrame(s, f);
  };
  socket.on("close", () => {
    clearTimeout(helloTimer);
    const s = session;
    if (!s || byeing || owners.get(s) !== socket) return;
    owners.delete(s);
    s.attach(null, null);
    say(`seam of session ${s.id} closed without bye — ending it in ${graceMs}ms unless reattached`);
    const t = setTimeout(() => {
      graceTimers.delete(s);
      void s.end("the thin bridge is gone (seam closed without bye)");
    }, graceMs);
    t.unref?.();
    graceTimers.set(s, t);
  });
}

/**
 * A session over streams: open gets input and output, like the engine's openSession,
 * and `log` — to the thin bridge while linked (onLog — always, the daemon journal).
 */
export function streamSeamSession(
  id: string,
  open: (
    io: { input: PassThrough; output: PassThrough },
    log: (line: string) => void,
  ) => { leave(why: string): Promise<void> },
  onLost?: (msg: RpcMessage) => void,
  onLog?: (line: string) => void,
): SeamSession {
  const input = new PassThrough();
  const output = new PassThrough();
  let logSink: ((line: string) => void) | null = null;
  const engine = open({ input, output }, (line) => {
    onLog?.(line);
    logSink?.(line);
  });
  let sink: ((msg: RpcMessage) => void) | null = null;
  createInterface({ input: output, terminal: false }).on("line", (line) => {
    if (!line.trim()) return;
    let msg: RpcMessage;
    try {
      msg = JSON.parse(line) as RpcMessage;
    } catch {
      return;
    }
    if (sink) sink(msg);
    else onLost?.(msg);
  });
  let ending: Promise<void> | null = null;
  return {
    id,
    // Session gone — input closed: writing to an ended stream would be an error.
    deliver: (msg) => void (input.writableEnded || input.write(JSON.stringify(msg) + "\n")),
    attach: (s, l) => {
      sink = s;
      logSink = l ?? null;
    },
    end: (why) =>
      (ending ??= engine
        .leave(why)
        .then(() => new Promise<void>((r) => setImmediate(r))) // last output lines before bye-ok
        .then(() => void input.end())),
  };
}

const fail = (code: string, message: string): NodeJS.ErrnoException =>
  Object.assign(new Error(message), { code });

/**
 * Age ceiling of the daemon life lock without a socket answer: the time a daemon has to
 * rise. Past it a silent socket under an old lock means the lock is stale.
 */
export const DAEMON_RISE_MS = 15_000;

const socketAnswers = (path: string): Promise<boolean> =>
  new Promise((r) => {
    const probe = connect(path);
    probe.once("connect", () => {
      probe.destroy();
      r(true);
    });
    probe.once("error", () => r(false));
  });

/**
 * Raise the daemon entrance of this grant directory. Order: the entrance is private
 * (else EUNSAFE); the socket does not answer (else EADDRINUSE); the life lock is taken
 * (held by a live own process within DAEMON_RISE_MS — EADDRINUSE); only then the dead
 * socket is removed and a new 0600 one listens. The lock goes with the server or process.
 */
export async function listenSeam(authDir: string, onSocket: (s: Socket) => void): Promise<Server> {
  const bad = seamEntranceProblem(authDir);
  if (bad) throw fail("EUNSAFE", `the seam entrance is not private: ${bad}`);
  const path = seamSocketPath(authDir);
  if (await socketAnswers(path)) throw fail("EADDRINUSE", `a daemon already listens on ${path}`);
  const lockPath = seamDaemonLockPath(authDir);
  const lock = takeFileLock(lockPath, DAEMON_RISE_MS);
  if (!lock.held)
    throw fail(
      "EADDRINUSE",
      lock.fault ??
        `the daemon lock ${lockPath} is held by pid ${lock.holder?.pid ?? "?"}, rising for ` +
          `${Math.round((Date.now() - (lock.holder?.started_at ?? Date.now())) / 1000)}s — its socket does not answer yet`,
    );
  const win = process.platform === "win32";
  try {
    if (!win) {
      try {
        unlinkSync(path); // a dead daemon's socket
      } catch {}
    }
    const server = createServer(onSocket);
    await new Promise<void>((r, reject) => {
      server.once("error", reject);
      server.listen(path, () => r());
    });
    if (!win) chmodSync(path, 0o600);
    server.once("close", lock.release);
    process.once("exit", lock.release);
    return server;
  } catch (e) {
    lock.release();
    throw e;
  }
}
