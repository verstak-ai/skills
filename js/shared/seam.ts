// The "thin bridge ↔ machine daemon" seam — a local protocol.
//
// The daemon holds the MCP connection and channel sockets; the agent's thin bridge
// hands the harness's stdio to the daemon of its grant directory. This module is both
// sides of the wire: framing, handshake, versions, ack, bye, errors. Entrance —
// seam-entrance.ts; the daemon side — seam-host.ts; the thin bridge — bridge/thin.ts.
//
// Wire: NDJSON over a 0600 unix socket in a private directory (a named pipe on
// Windows), one line per `{t: …}` frame.
//   thin → daemon   hello    first; seam version, build, path, argv, env, cwd, pid,
//                            session (reattach by local session id), probe (build only)
//   daemon → thin   welcome  daemon build and pid, local session id, resumed, ack
//                   refuse   wrong seam version or session not accepted — with a reason
//   both ways       rpc      JSON-RPC as is
//   daemon → thin   ack      the request with this id was taken by the session (sent to
//                            the kernel before the request reaches the session)
//   thin → daemon   bye      session end on the harness's word (stdin closed, SIGTERM)
//   daemon → thin   bye-ok   the session left: everything in flight answered
//   daemon → thin   log      a session line for the thin bridge's stderr
//   daemon → thin   handover the daemon hands seats to a successor: the thin bridge
//                            waits for it instead of raising a daemon itself
// An unknown frame kind is skipped by both sides, so additions need no version bump.
// A socket closed without bye ends the session after SEAM_REATTACH_GRACE_MS.
import { createHash } from "node:crypto";
import { connect, type Socket } from "node:net";

import { ENV_PREFIX, envName, PRODUCT } from "../delivery/index.ts";

/** Wire version. Different versions do not talk: the daemon refuses, the thin bridge runs full. */
export const SEAM_PROTOCOL = 2;

/** How long the daemon keeps a session whose socket closed without bye, awaiting reattach. */
export const SEAM_REATTACH_GRACE_MS = 5_000;

/** Thin bridge by default; `0` switches to a full in-process bridge (probes, people). */
export const DAEMON_ENV = envName("BRIDGE_DAEMON");
/** The old-name switch: a full in-process bridge regardless. */
export const NO_DAEMON_ENV = envName("BRIDGE_NO_DAEMON");

/** A JSON-RPC message — the wire carries it without parsing. */
export interface RpcMessage {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: unknown;
  result?: unknown;
  error?: unknown;
}

export interface SeamHello {
  t: "hello";
  seam: number;
  /** The thin bridge's delivery (since seam protocol 2, graph @nks/nks-dev, node #6815). */
  product: string;
  /** Thin bridge build, `vX.Y.Z+hash`. */
  build: string;
  /** The thin bridge's file — which copy the harness launched. */
  path: string;
  /** Bridge argv after the subcommand: --satellite, --client-name, --auth-dir, server address… */
  argv: string[];
  /** Harness environment the session needs (seamEnv), without the personal token. */
  env: Record<string, string>;
  cwd: string;
  pid: number;
  /** Personal token fingerprint (sha256, 16 chars); null — OAuth login. A daemon with another refuses. */
  patSha?: string | null;
  /** Local session id for reattach; absent — a new session. */
  session?: string | null;
  /** Only ask the daemon's build (--version): open no session. */
  probe?: boolean;
}

export interface SeamWelcome {
  t: "welcome";
  seam: number;
  build: string;
  pid: number;
  /** Local session id; null — a probe answer. */
  session: string | null;
  /** The same session as named in hello: initialize is not replayed. */
  resumed: boolean;
  /** The daemon confirms requests with ack; absent — the fate of any sent request is unknown. */
  ack?: boolean;
  /** Probe answer: how many sessions the daemon holds (doctor). */
  sessions?: number;
  /** Probe answer: the daemon's file. */
  path?: string;
}

export interface SeamLog {
  t: "log";
  line: string;
}

export interface SeamHandover {
  t: "handover";
  why?: string;
}

export interface SeamAck {
  t: "ack";
  id: string | number;
}

export interface SeamRefuse {
  t: "refuse";
  seam: number;
  build: string;
  reason: string;
}

export interface SeamRpc {
  t: "rpc";
  msg: RpcMessage;
}

export interface SeamBye {
  t: "bye";
  why?: string;
}

export interface SeamByeOk {
  t: "bye-ok";
}

export type SeamFrame =
  | SeamHello
  | SeamWelcome
  | SeamRefuse
  | SeamRpc
  | SeamAck
  | SeamBye
  | SeamByeOk
  | SeamLog
  | SeamHandover;

// --- handshake ---------------------------------------------------------------

/** The personal token never crosses the seam: the same user's daemon takes it from its env or grant file. */
export const TOKEN_ENV = envName("BRIDGE_TOKEN");

/** Personal token fingerprint — to check the daemon uses the same token; null — no token. */
export const patShaOf = (pat: string | null | undefined): string | null =>
  pat ? createHash("sha256").update(pat).digest("hex").slice(0, 16) : null;

// Environment a daemon session needs: everything under the delivery prefix but the
// token, plugin root, skill lock place (shared/skilllock.ts), proxies and CA certs.
const PASS_ENV = new Set([
  "CLAUDE_PLUGIN_ROOT",
  "XDG_STATE_HOME",
  "NODE_EXTRA_CA_CERTS",
  "NODE_USE_ENV_PROXY",
  "HTTP_PROXY",
  "HTTPS_PROXY",
  "NO_PROXY",
  "ALL_PROXY",
  "http_proxy",
  "https_proxy",
  "no_proxy",
  "all_proxy",
]);

/** A session environment key: its value is the harness's, not the daemon's. */
export const isSessionEnvKey = (k: string): boolean =>
  k !== TOKEN_ENV && (k.startsWith(ENV_PREFIX) || PASS_ENV.has(k));

export function seamEnv(env: NodeJS.ProcessEnv = process.env): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(env)) if (v !== undefined && isSessionEnvKey(k)) out[k] = v;
  return out;
}

// A daemon raised by a thin bridge gets the session env, the token and the process
// basics (home, paths, tmp, runtime), not the whole harness env.
const BASE_ENV = [
  "HOME",
  "USERPROFILE",
  "PATH",
  "TMPDIR",
  "TMP",
  "TEMP",
  "SystemRoot",
  "LANG",
  "LC_ALL",
  "BUN_BE_BUN",
  TOKEN_ENV,
];

export function daemonEnv(env: NodeJS.ProcessEnv = process.env): Record<string, string> {
  const out = seamEnv(env);
  for (const k of BASE_ENV) if (env[k] !== undefined) out[k] = env[k]!;
  return out;
}

export function helloFrame(o: {
  build: string;
  path: string;
  argv: string[];
  session?: string | null;
  probe?: boolean;
  patSha?: string | null;
}): SeamHello {
  return {
    t: "hello",
    seam: SEAM_PROTOCOL,
    product: PRODUCT,
    build: o.build,
    path: o.path,
    argv: o.argv,
    env: seamEnv(),
    cwd: process.cwd(),
    pid: process.pid,
    session: o.session ?? null,
    patSha: o.patSha ?? null,
    ...(o.probe ? { probe: true } : {}),
  };
}

/** Handshake refusal reason; null — accepted. */
export function checkHello(f: unknown): string | null {
  const h = f as Partial<SeamHello> | null;
  if (!h || h.t !== "hello") return "the first frame is not a hello";
  if (h.seam !== SEAM_PROTOCOL)
    return `seam protocol ${String(h.seam)} is not spoken here (this side speaks ${SEAM_PROTOCOL})`;
  if (h.product !== PRODUCT)
    return `the thin bridge belongs to the delivery ${String(h.product)} (this side is ${PRODUCT})`;
  if (!Array.isArray(h.argv) || typeof h.cwd !== "string" || typeof h.pid !== "number")
    return "the hello lacks argv, cwd or pid";
  return null;
}

// --- framing -----------------------------------------------------------------

/** Read frames from the socket: a line is a frame; a line that is not JSON goes to onBad. */
export function readFrames(
  socket: Socket,
  onFrame: (f: SeamFrame) => void,
  onBad: (line: string) => void = () => {},
): void {
  socket.setEncoding("utf8");
  let buf = "";
  socket.on("data", (chunk: string) => {
    buf += chunk;
    let nl: number;
    while ((nl = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (!line) continue;
      let f: SeamFrame;
      try {
        f = JSON.parse(line) as SeamFrame;
      } catch {
        onBad(line);
        continue;
      }
      onFrame(f);
    }
  });
}

/** Write a frame; cb — when the bytes reached the kernel (err — they did not). */
export function writeFrame(
  socket: Socket,
  frame: SeamFrame,
  cb?: (err?: Error | null) => void,
): boolean {
  if (socket.destroyed || !socket.writable) {
    cb?.(new Error("the seam socket is closed"));
    return false;
  }
  return socket.write(JSON.stringify(frame) + "\n", cb);
}

// --- thin bridge side --------------------------------------------------------

/** Why the daemon link failed: no daemon, refused, broken before welcome. */
export class SeamError extends Error {
  kind: "absent" | "refused" | "broken";
  constructor(kind: "absent" | "refused" | "broken", message: string) {
    super(message);
    this.kind = kind;
  }
}

/** The thin bridge's link to the daemon after welcome. */
export interface SeamLink {
  readonly welcome: SeamWelcome;
  send(frame: SeamFrame, cb?: (err?: Error | null) => void): boolean;
  /** Daemon frames; those that came before subscribing are kept. */
  onFrame(cb: (f: SeamFrame) => void): void;
  /** The link broke (daemon gone, socket closed). Once. */
  onClose(cb: () => void): void;
  close(): void;
}

const ABSENT = new Set(["ENOENT", "ECONNREFUSED", "ENOTSOCK", "ENOTDIR"]);

/** Connect to the daemon and pass the handshake. Failure — SeamError. */
export function connectSeam(path: string, hello: SeamHello, timeoutMs: number): Promise<SeamLink> {
  return new Promise((resolveLink, reject) => {
    const socket = connect(path);
    let welcome: SeamWelcome | null = null;
    const early: SeamFrame[] = [];
    let frameCb: ((f: SeamFrame) => void) | null = null;
    let closeCb: (() => void) | null = null;
    let closed = false;
    const fail = (e: SeamError) => {
      clearTimeout(timer);
      socket.destroy();
      reject(e);
    };
    const timer = setTimeout(
      () => fail(new SeamError("broken", `no welcome from the daemon in ${timeoutMs}ms`)),
      timeoutMs,
    );
    timer.unref?.();
    socket.on("error", (e: NodeJS.ErrnoException) => {
      if (welcome) return; // after welcome an error is a close, reported by close
      fail(new SeamError(ABSENT.has(e.code ?? "") ? "absent" : "broken", `${e.code ?? e.message}`));
    });
    socket.on("close", () => {
      if (!welcome) {
        fail(new SeamError("broken", "the daemon closed the seam before its welcome"));
        return;
      }
      if (closed) return;
      closed = true;
      closeCb?.();
    });
    socket.on("connect", () => writeFrame(socket, hello));
    readFrames(socket, (f) => {
      if (!welcome) {
        if (f.t === "refuse") return fail(new SeamError("refused", f.reason));
        if (f.t !== "welcome") return fail(new SeamError("broken", `expected welcome, got ${f.t}`));
        welcome = f;
        clearTimeout(timer);
        resolveLink({
          welcome: f,
          send: (frame, cb) => writeFrame(socket, frame, cb),
          onFrame: (cb) => {
            frameCb = cb;
            for (const e of early.splice(0)) cb(e);
          },
          onClose: (cb) => {
            closeCb = cb;
            if (closed) cb();
          },
          close: () => {
            socket.end();
            setTimeout(() => socket.destroy(), 1000).unref?.();
          },
        });
        return;
      }
      if (frameCb) frameCb(f);
      else early.push(f);
    });
  });
}
