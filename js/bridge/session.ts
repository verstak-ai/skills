// The bridge session: everything after stdio — the harness's lines, delivery,
// standing, doors, usage and leaving. The full bridge feeds it the process's
// stdio (main.ts); the thin bridge's fallback and the machine daemon feed it
// streams (thin.ts, shared/seam.ts). A foreign bridge's session lives in its
// own scope (shared/scope.ts).
import { createInterface } from "node:readline";
import { type Writable } from "node:stream";

import { envName, ID_PREFIX } from "../delivery/index.ts";
import { bindScope, newScope, runIn, type Scope } from "../shared/scope.ts";
import { isSessionEnvKey, patShaOf } from "../shared/seam.ts";
import { CFG, readArgs, setConfig } from "./config.ts";
import { deliver } from "./deliver.ts";
import { errorMessage } from "./errors.ts";
import { handoverUnderway } from "./holdstate.ts";
import { startDeafnessWatch } from "./leave.ts";
import { clickPending } from "./oauth/flow.ts";
import { ORPHAN_FLOW_MS } from "./oauth/pacing.ts";
import { tokenRequestsInFlight } from "./oauth/tokenrequest.ts";
import { holdFromEnv } from "./resume.ts";
import { closeRun } from "./runend.ts";
import { releaseSatelliteClaims } from "./satellite.ts";
import { sleep } from "./store.ts";
import { debug, flushStdout, guardStream, log, setSessionOutput } from "./streams.ts";
import { pauseSettled, suspended } from "./suspend.ts";
import { type JsonRpcMessage } from "./types.ts";
import { lastAgentWork, noteAgentWork } from "./work.ts";

/** How long a daemon session handing seats over waits for calls in flight; the thin bridge answers the rest. */
const HANDOVER_WAIT_MS = Number(process.env[envName("BRIDGE_HANDOVER_WAIT_MS")]) || 10_000;

export interface SessionIO {
  input: NodeJS.ReadableStream;
  output: Writable;
}

export interface BridgeSession {
  /** One leave per session: a second caller waits for the first. Does not exit the process. */
  leave(why: string): Promise<void>;
  /** Input closed (or leave called) and everything answered. */
  readonly ended: Promise<void>;
  /** null — this process's own session. */
  readonly origin: SessionOrigin | null;
  readonly scope: Scope | null;
  /** Last agent tool call, ms epoch (0 — none) (graph @nks/nks-dev, node #6510). */
  lastWork(): number;
}

/** The harness bridge as launched, taken as-is from the seam handshake (shared/seam.ts SeamHello). */
export interface SessionOrigin {
  argv: string[];
  env: Record<string, string>;
  cwd: string;
  pid: number;
  path?: string;
  patSha?: string | null;
}

export interface SessionOptions {
  id?: string;
  log?: (line: string) => void;
}

let counter = 0;

// The personal token is not a session key: the daemon has its own, and a different one is refused.
function applyOrigin(origin: SessionOrigin): void {
  const cfg = readArgs(origin.argv);
  if (origin.patSha !== undefined && patShaOf(cfg.pat) !== origin.patSha)
    throw new Error(
      "this daemon signs in otherwise than the bridge asking (its personal token differs)",
    );
  setConfig(cfg);
}

/**
 * Open a bridge session over streams. Without origin — this process's session
 * (setConfig already called); with origin — a foreign bridge's session in its
 * own scope, throwing on bad argv or a foreign token.
 */
export function openSession(
  io: SessionIO,
  origin?: SessionOrigin,
  opts: SessionOptions = {},
): BridgeSession {
  if (!origin) return openIn(io, null, null);
  const scope = newScope(
    opts.id ?? `s${++counter}`,
    { env: origin.env, cwd: origin.cwd, pid: origin.pid, path: origin.path ?? "" },
    isSessionEnvKey,
  );
  scope.log = opts.log ?? null;
  return runIn(scope, () => {
    applyOrigin(origin);
    return openIn(io, origin, scope);
  });
}

function openIn(io: SessionIO, origin: SessionOrigin | null, scope: Scope | null): BridgeSession {
  setSessionOutput(io.output);
  guardStream(io.output); // before the first write: a broken pipe is news, not a crash
  holdFromEnv(); // (graph @nks/nks-dev, node #5140)
  // (graph @nks/nks-dev, node #4895); a satellite's seat signs the run's writes, so it keeps no deafness watch.
  if (!CFG.satellite) startDeafnessWatch();

  const rl = createInterface({ input: io.input, terminal: false });
  const pending = new Set<Promise<void>>();
  let handshake: Promise<void> | null = null;
  // Lines arrive in the writer's scope (the daemon's seam socket): run them in the session's.
  rl.on(
    "line",
    bindScope((line: string) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      let msg: JsonRpcMessage;
      try {
        msg = JSON.parse(trimmed) as JsonRpcMessage;
      } catch {
        log(`unparseable line from harness: ${trimmed.slice(0, 120)}`);
        return;
      }
      // Only an agent's tool call counts as work, not the bridge's or plugin's own calls (graph @nks/nks-dev, node #6510).
      if (msg.method === "tools/call" && !String(msg.id ?? "").startsWith(ID_PREFIX))
        noteAgentWork();
      // Pipelined clients send calls before the initialize answer; they wait behind the handshake, in order (graph @nks/nks-dev, node #4308).
      const run = () =>
        deliver(msg).catch((e) => log(`unexpected: ${(e as Error)?.stack || errorMessage(e)}`));
      let p: Promise<void>;
      if (msg.method === "initialize") {
        p = run();
        handshake = p;
        p.finally(() => {
          if (handshake === p) handshake = null;
        });
      } else if (handshake) {
        const gate = handshake;
        p = gate.then(run, run);
      } else p = run();
      pending.add(p);
      p.finally(() => pending.delete(p));
    }),
  );
  // A human may be mid-click on OUR authorize URL (the loopback link opened):
  // dying now kills the callback server and silently loses their login, and the click is not repeatable —
  // the human sees a browser error, not a retry. So a bridge asked to go away
  // outlives a pending flow, and a token rotation already in flight must land
  // on disk before exit; each request's own timeout bounds the wait. A harness
  // that will not wait that long may kill us outright. That is survivable for
  // the browser flow: the next bridge finds no listener on the callback port
  // and takes the flow over. It is NOT survivable for an in-flight rotation:
  // the killed bridge leaves the machine holding a retired refresh token. That
  // is the price SIGKILL always pays; SIGTERM, stdin-close, and SIGINT no longer do.
  // The harness closes stdin AND sends SIGTERM: the second leave waits for the first (graph @nks/nks-dev, node #5140).
  let leaving: Promise<void> | null = null;
  let markEnded!: () => void;
  const ended = new Promise<void>((resolve) => (markEnded = resolve));
  const leave = bindScope(
    (why: string): Promise<void> => (leaving ??= windDown(why).finally(markEnded)),
  );
  const windDown = async (why: string) => {
    debug(`${why} — winding down`);
    // Handover to a successor daemon (daemon.ts): the seat is kept, calls in flight get a short wait.
    const handover = !!origin && handoverUnderway();
    const paused = suspended();
    // A failure of the run's end does not break the leave.
    await closeRun(why, handover).catch((e: Error) => log(`the run's end failed: ${e.message}`));
    if (handover) await Promise.race([Promise.allSettled([...pending]), sleep(HANDOVER_WAIT_MS)]);
    else await Promise.allSettled([...pending, ...tokenRequestsInFlight]);
    if (paused) await pauseSettled(); // a late re-arm of the pause turned the address — wait for its write
    await flushStdout(io.output); // an answer half-written is an answer not given
    if (origin) {
      // A daemon session: login and token rotation belong to the daemon process, which outlives it.
      releaseSatelliteClaims();
      return;
    }
    const flow = clickPending();
    if (flow) {
      // The login has no deadline while a harness holds us; once it is gone,
      // the click is waited for only so long — nothing is left hanging forever.
      // A login whose link nobody opened — a code polled for another device —
      // is not waited for: the record keeps link and code, the next bridge takes
      // both over, and a harness stopping us is not made to kill us.
      log(
        `${why}, but an authorization flow is pending — staying up for the human's click, ` +
          `at most ${Math.round(ORPHAN_FLOW_MS / 1000)}s`,
      );
      await Promise.race([flow.catch(() => {}), sleep(ORPHAN_FLOW_MS)]);
    }
    await Promise.allSettled([...tokenRequestsInFlight]); // a tick may have started one while we waited
    await flushStdout(io.output);
  };
  rl.on(
    "close",
    bindScope(() => void leave("stdin closed, the harness is gone")),
  );
  return { leave, ended, origin, scope, lastWork: bindScope(lastAgentWork) };
}
