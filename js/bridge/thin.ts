// Thin bridge: the agent side of the seam to the machine daemon (wire shared/seam.ts,
// entrance shared/seam-entrance.ts, daemon daemon.ts). It relays the harness stdio to the
// daemon of its grant directory as JSON-RPC both ways and keeps only what a break would
// turn into silence or loss: the harness initialize, calls in flight, the held seat key.
//
//   no daemon     raise one detached (`<bridge> daemon`, the newer of own and home copy)
//                 under the raise lock; not up, entrance not private, or no lock — the full
//                 bridge in-process, said on stderr, in the first tool answer and as a
//                 fallback mark (fallback.ts). A raised daemon that exits "daemon busy" is
//                 waited for, not replaced by the full bridge.
//   link broken   an acked call gets "outcome unknown"; an unacked one (daemon speaks ack)
//                 is resent after the reattach; a daemon without ack — always unknown. A
//                 verdicted id is remembered: its late answer is dropped. Reattach by the
//                 local session id; a new session replays initialize and resumes the held
//                 seat by its hold record (resume with its key and the harness session), harness calls wait for these moves (a paused
//                 satellite takes no seat); not back — a lost notice and a spoken refusal of
//                 each tool call into its graph, except the stand tool.
//   end           stdin closed, SIGTERM — bye to the daemon with a bounded wait.
//
// Default in every harness; BRIDGE_DAEMON=0 (or BRIDGE_NO_DAEMON=1) — always the full
// bridge. Home sync at start (cli: syncHome/reexec) is done here as in the full bridge;
// release checks never: only the daemon runs them (the engine, in full mode).
import { createInterface } from "node:readline";
import { PassThrough } from "node:stream";

import { BRIDGE_NAME, envName, ID_PREFIX, method, THIN } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import {
  connectSeam,
  DAEMON_ENV,
  helloFrame,
  NO_DAEMON_ENV,
  patShaOf,
  SeamError,
  type SeamLink,
} from "../shared/seam.ts";
import { seamEntranceProblem, seamSocketPath } from "../shared/seam-entrance.ts";
import { BUILD } from "./build.ts";
import { parseArgs, setConfig } from "./config.ts";
import { DAEMON_BUSY_EXIT, ms } from "./daemon.ts";
import { syntheticError } from "./deliver.ts";
import { fullBridgeSigint, installCrashWords, startEngine } from "./engine.ts";
import { NOT_SENT, UNKNOWN } from "./errors.ts";
import { markFallback } from "./fallback.ts";
import { lostPlaces, placeWord, realmListAsk, resumeParams, seeSession } from "./lostplaces.ts";
import { type Raise, raiseDaemon, SELF } from "./raise.ts";
import { type BridgeSession, openSession } from "./session.ts";
import { sleep } from "./store.ts";
import { debug, flushStdout, log, writeTo } from "./streams.ts";
import { type JsonRpcMessage } from "./types.ts";

/** How long to wait for a daemon, own or raised, before going as the full bridge. */
const ATTACH_MS = ms(envName("BRIDGE_DAEMON_WAIT_MS"), 5_000);
/** Wait after a break: a leaving daemon hands seats to a successor that does not rise at once. */
const REATTACH_MS = ms(envName("BRIDGE_DAEMON_REATTACH_MS"), 30_000);
const BYE_MS = ms(envName("BRIDGE_BYE_MS"), 5_000);
const HELLO_MS = 3_000;
const POLL_MS = 100;
/** How long to wait for a successor named by a leaving daemon before raising one. */
const SUCCESSOR_MS = 20_000;
/** A raised daemon exited "daemon busy": do not raise again before this pause. */
const BUSY_RETRY_MS = 2_000;
/** How long harness calls wait for the bridge's own moves in a new session. */
const GATE_MS = 20_000;

/** Thin bridge on: the default unless a switch is set. */
export function daemonWanted(): boolean {
  if (process.env[DAEMON_ENV]?.trim() === "0") return false;
  const off = process.env[NO_DAEMON_ENV]?.trim();
  return !off || off === "0";
}

// --- thin bridge -------------------------------------------------------------

interface Flight {
  id: string | number;
  msg: JsonRpcMessage;
  /** The daemon acked it: the session saw the request — the outcome is unknown. */
  acked: boolean;
}

export function thinMain(argv: string[]): void {
  // Config is parsed here (log and debug read it); the engine starts only in full mode.
  const cfg = parseArgs(argv);
  setConfig(cfg);
  const authDir = cfg.authDir;
  const patSha = patShaOf(cfg.pat);
  installCrashWords();

  let mode: "attaching" | "daemon" | "local" = "attaching";
  let link: SeamLink | null = null;
  let sessionId: string | null = null;
  let local: { session: BridgeSession; input: PassThrough } | null = null;
  let initCopy: JsonRpcMessage | null = null;
  let initSent = false;
  let initializedSeen = false;
  let word: string | null = null; // the full-mode word, for the first tool answer
  let leaving: Promise<void> | null = null;
  let byeDone: (() => void) | null = null;
  let heldKey: string | null = null; // the seat the session holds — resumed in a new session
  let paused = false; // the harness paused the satellite (bridge/suspend.ts): the seat waits on its pause record
  let everAttached = false;
  let successorAwaited = 0; // when a leaving daemon named its successor
  const queue: JsonRpcMessage[] = [];
  const flights = new Map<string, Flight>();
  const verdicted = new Set<string>(); // ids closed by a verdict: a late answer is a duplicate
  const replayIds = new Set<string>();
  const realmIds = realmListAsk(); // own realm-list calls (lostplaces.ts)
  const cancelled = new Set<string>(); // cancelled by the harness before their ack
  let replays = 0;
  const key = (id: unknown) => JSON.stringify(id);
  const writeHarness = (m: JsonRpcMessage) => writeTo(process.stdout, JSON.stringify(m) + "\n");

  const toHarness = (msg: JsonRpcMessage) => {
    if (msg.method === undefined && msg.id !== undefined && msg.id !== null) {
      const k = key(msg.id);
      if (realmIds.reply(msg, log)) {
        openGate(k); // the gate also waited on the realm list (askRealms)
        return;
      }
      if (replayIds.delete(k)) {
        // An answer to the bridge's own move (initialize, resume): the harness has its own.
        const back = resuming.get(k);
        resuming.delete(k);
        if (back && msg.result?.resumed !== true) {
          placeLost(back.key, back.realm, String(msg.result?.word ?? msg.error?.message ?? "?"));
          askRealms(); // the loss surfaced with the resume answer — ask the realm list now
        }
        openGate(k);
        return;
      }
      cancelled.delete(k);
      if (verdicted.delete(k)) {
        debug(`a late answer to ${k} dropped — the harness already has its verdict`);
        return;
      }
      const f = flights.get(k);
      flights.delete(k);
      if (f?.msg.method === method("suspend") && msg.result?.suspended === true) paused = true;
      if (word && f?.msg.method === "tools/call" && Array.isArray(msg.result?.content)) {
        msg.result.content.push({ type: "text", text: word });
        word = null;
      }
    }
    const place = placeWord(msg);
    // Seat words fold into lostplaces.seen; "released" from a daemon session while the
    // harness lives is not the agent leaving (the daemon ended without a successor).
    heldKey = places.seen(place, heldKey, mode === "daemon" && !leaving);
    writeHarness(msg);
  };

  // Gate after a reattach to a new session: harness calls wait until the bridge's own
  // moves (replayed initialize, seat resume, realm list) answer — otherwise writes overtake
  // the resume and land without an author, and a lost-seat refusal is judged before the
  // list's aliases. Not answered in GATE_MS — the gate opens with a log line.
  const gate = new Set<string>();
  let gateTimer: ReturnType<typeof setTimeout> | null = null;
  const openGate = (k?: string) => {
    if (k) gate.delete(k);
    else gate.clear();
    if (gate.size) return;
    if (gateTimer) clearTimeout(gateTimer);
    gateTimer = null;
    for (const m of queue.splice(0)) dispatch(m);
  };
  const closeGate = (k: string) => {
    gate.add(k);
    gateTimer ??= setTimeout(() => {
      gateTimer = null;
      if (!gate.size) return;
      log(
        `the new session did not answer the bridge's own calls in ${GATE_MS}ms — letting calls through`,
      );
      openGate();
    }, GATE_MS);
  };

  const places = lostPlaces(writeHarness, log);
  const live = places.live;
  const resuming = new Map<string, { key: string; realm: string }>(); // resume call id → seat
  const placeLost = (k: string, realm: string, why: string) => {
    places.lose(k, realm, why, cfg.satellite && k === heldKey);
    if (k === heldKey) heldKey = null;
  };
  // Ask the realm list with an own call when seats are lost: without it rN and slug of
  // calls do not resolve (lostplaces.ts). The held seat's loss surfaces with the resume
  // answer, later than the reattach.
  const askRealms = () => {
    const m = realmIds.ask(places.lostCount(), () => `${ID_PREFIX}thin-realms-${++replays}`);
    if (!m) return;
    if (mode === "daemon" && link) toDaemon(link, m);
    else if (mode === "local") toLocal(m);
    else return;
    // Hold the gate while the list is in flight: a call judged before it would get an
    // unresolved refusal where the list's aliases would resolve the name.
    closeGate(key(m.id));
  };

  // A verdict to every id in flight, remembered so a late answer is not a second one.
  // With `resend`, a request unacked by an acking daemon was never seen: it is queued again.
  const verdictAll = (why: string, acks: boolean, resend = false): JsonRpcMessage[] => {
    const again: JsonRpcMessage[] = [];
    for (const [k, f] of flights) {
      if (resend && acks && !f.acked) {
        // Cancelled by the harness before it went: neither resend nor answer.
        if (cancelled.delete(k)) flights.delete(k);
        else again.push(f.msg);
        continue;
      }
      writeHarness(syntheticError(f.id, why, !acks || f.acked ? UNKNOWN : NOT_SENT));
      verdicted.add(k);
      flights.delete(k);
    }
    return again;
  };

  const toDaemon = (l: SeamLink, msg: JsonRpcMessage) => {
    if (msg.method === "initialize") initSent = true;
    const f = msg.id !== undefined && msg.id !== null ? flights.get(key(msg.id)) : undefined;
    if (f && f.msg === msg) f.acked = false; // sent again — waits for a new ack
    l.send({ t: "rpc", msg });
  };
  const toLocal = (msg: JsonRpcMessage) => {
    if (msg.method === "initialize") initSent = true;
    local?.input.write(JSON.stringify(msg) + "\n");
  };
  const dispatch = (msg: JsonRpcMessage) => {
    // A tool call into the graph of a seat lost in the new session is refused aloud
    // (lostplaces.ts), judged at send time — after the gate the resume has answered.
    const refusal = !gate.size && msg.id != null ? places.refusal(msg) : null;
    if (refusal) {
      flights.delete(key(msg.id));
      writeHarness({
        jsonrpc: "2.0",
        id: msg.id,
        result: { isError: true, content: [{ type: "text", text: refusal }] },
      });
    } else if (gate.size) queue.push(msg);
    else if (mode === "daemon" && link) toDaemon(link, msg);
    else if (mode === "local") toLocal(msg);
    else queue.push(msg);
  };
  // The session on the other side is new while the harness already shook hands: the
  // bridge replays initialize with its own id and keeps the answer; the held seat comes
  // back by its hold record. An initialize queued for resend is the handshake itself.
  const replay = (send: (m: JsonRpcMessage) => void) => {
    if (!initCopy || !initSent) return;
    if (!queue.some((m) => m.method === "initialize")) {
      const id = `${ID_PREFIX}thin-replay-${++replays}`;
      replayIds.add(key(id));
      closeGate(key(id));
      send({ ...initCopy, id });
      if (initializedSeen) send({ jsonrpc: "2.0", method: "notifications/initialized" });
    }
    // Beside seats in other graphs are not resumed by the thin bridge — loudly.
    const held = heldKey ? { key: heldKey, realm: live.get(heldKey) ?? "" } : null;
    for (const [k, realm] of [...live]) {
      if (k === heldKey) continue;
      placeLost(k, realm, words(THIN).besideNotBack());
    }
    live.clear();
    // A paused satellite takes no seat: its seat and cases wait on the pause record.
    if (held && paused)
      log(`the session is new — its place ${held.key} is paused and waits on its pause record`);
    else if (held) {
      const id = `${ID_PREFIX}thin-resume-${++replays}`;
      replayIds.add(key(id));
      resuming.set(key(id), held);
      closeGate(key(id));
      log(`the session is new — bringing its place ${held.key} back from the hold record`);
      send({ jsonrpc: "2.0", id, method: method("resume"), params: resumeParams(held.key) });
    }
  };

  const goLocal = (reason: string) => {
    if (mode === "local" || leaving) return;
    log(`${reason} — going as the full bridge inside this process`);
    markFallback(authDir, { build: BUILD, cwd: process.cwd(), why: reason });
    word =
      `${BRIDGE_NAME} ${BUILD}: ${reason}; this bridge runs as the full bridge in its own process ` +
      `(the machine's daemon is the default; ${DAEMON_ENV}=0 runs the full bridge on purpose).`;
    const input = new PassThrough();
    const output = new PassThrough();
    startEngine(cfg);
    const session = openSession({ input, output });
    createInterface({ input: output, terminal: false }).on("line", (line) => {
      if (!line.trim()) return;
      try {
        toHarness(JSON.parse(line) as JsonRpcMessage);
      } catch {}
    });
    local = { session, input };
    mode = "local";
    replay(toLocal);
    askRealms(); // the replay's seat losses surface here too: ask in the local session
    for (const m of queue.splice(0)) dispatch(m);
  };

  const onWelcome = (l: SeamLink) => {
    if (leaving) return l.close();
    const w = l.welcome;
    const resumed = w.resumed && !!sessionId && w.session === sessionId;
    sessionId = w.session;
    link = l;
    mode = "daemon";
    everAttached = true;
    log(
      `through the machine's bridge daemon ${w.build} (pid ${w.pid}), session ${sessionId}` +
        (resumed ? " — resumed" : ""),
    );
    l.onFrame((f) => {
      if (f.t === "rpc") toHarness(f.msg as JsonRpcMessage);
      else if (f.t === "ack") {
        const fl = flights.get(key(f.id));
        if (fl) fl.acked = true;
        cancelled.delete(key(f.id)); // taken by the session — a cancel goes to it now
      } else if (f.t === "log")
        writeTo(process.stderr, f.line.endsWith("\n") ? f.line : `${f.line}\n`);
      else if (f.t === "handover") {
        successorAwaited = Date.now();
        log(
          `the machine's bridge daemon hands over to its successor (${f.why ?? "?"}) — waiting for it`,
        );
      } else if (f.t === "bye-ok") byeDone?.();
    });
    l.onClose(() => {
      if (link !== l) return;
      link = null;
      if (leaving) return byeDone?.();
      lost(!!w.ack);
    });
    if (!resumed) replay((m) => toDaemon(l, m));
    askRealms();
    for (const m of queue.splice(0)) dispatch(m);
  };

  const lost = (acks: boolean) => {
    mode = "attaching";
    replayIds.clear();
    resuming.clear();
    realmIds.forget();
    gate.clear(); // the broken session's moves will not answer — the new session closes the gate again
    if (gateTimer) clearTimeout(gateTimer); // an inherited timer would open the new session's gate early
    gateTimer = null;
    const inFlight = flights.size;
    const again = verdictAll(
      "the link to this machine's bridge daemon broke before the answer came back",
      acks,
      true,
    );
    log(
      `the link to the machine's bridge daemon broke — ${inFlight} call(s) in flight: ` +
        `${again.length} not taken by the daemon go again after the reattach, ` +
        `${inFlight - again.length} get a verdict; reattaching`,
    );
    queue.unshift(...again); // unsent ones first, in their order
    void attach();
  };

  const attach = async (): Promise<void> => {
    const unsafe = seamEntranceProblem(authDir);
    if (unsafe) return goLocal(`the daemon's entrance is not private (${unsafe})`);
    const socketPath = seamSocketPath(authDir);
    const wait = everAttached ? REATTACH_MS : ATTACH_MS;
    const deadline = Date.now() + wait;
    let raise: Raise | null = null;
    let raiseFailed: string | null = null;
    let raiseAgainAt = 0;
    try {
      for (;;) {
        if (leaving) return;
        try {
          const hello = helloFrame({ build: BUILD, path: SELF, argv, session: sessionId, patSha });
          return onWelcome(await connectSeam(socketPath, hello, HELLO_MS));
        } catch (e) {
          if (!(e instanceof SeamError)) throw e;
          if (e.kind === "refused")
            return goLocal(`the machine's bridge daemon refused this bridge: ${e.message}`);
          // A successor named by the leaving daemon is awaited: a daemon raised here
          // would fight it for the entrance.
          const successorDue = !!successorAwaited && Date.now() - successorAwaited < SUCCESSOR_MS;
          if (e.kind === "absent" && !raise && !successorDue && Date.now() >= raiseAgainAt) {
            const r = raiseDaemon(authDir);
            raise = r;
            if (r.kind === "fault")
              return goLocal(`cannot raise the bridge daemon for ${authDir}: ${r.why}`);
            if (r.kind === "raising")
              void r.failed.then(({ code, why }) => {
                // "Daemon busy": a leaving one lives or another rises — wait for it, and
                // raise again only after a pause, not raise after raise.
                if (code !== DAEMON_BUSY_EXIT) return void (raiseFailed = why);
                r.release();
                if (raise === r) raise = null;
                raiseAgainAt = Date.now() + BUSY_RETRY_MS;
              });
          }
          if (raiseFailed) return goLocal(`no bridge daemon for ${authDir}: ${raiseFailed}`);
          if (Date.now() >= deadline)
            return goLocal(`no bridge daemon for ${authDir} answered in ${wait}ms (${e.message})`);
          await sleep(POLL_MS);
        }
      }
    } finally {
      if (raise?.kind === "raising") raise.release();
    }
  };

  const rl = createInterface({ input: process.stdin, terminal: false });
  rl.on("line", (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    let msg: JsonRpcMessage;
    try {
      msg = JSON.parse(trimmed) as JsonRpcMessage;
    } catch {
      log(`unparseable line from harness: ${trimmed.slice(0, 120)}`);
      return;
    }
    if (msg.method === "initialize") initCopy = msg;
    if (msg.method === "notifications/initialized") initializedSeen = true;
    // Cancel of a call not yet sent (waiting for reattach or the gate) or sent unacked
    // to a leaving daemon: it does not go again. An acked one — the cancel goes to the session.
    if (msg.method === "notifications/cancelled") {
      const k = key(msg.params?.requestId);
      const f = flights.get(k);
      if (f && !f.acked) {
        const i = queue.indexOf(f.msg);
        if (i >= 0) {
          queue.splice(i, 1);
          flights.delete(k);
        } else cancelled.add(k);
      }
    }
    if (msg.method && msg.id !== undefined && msg.id !== null) {
      verdicted.delete(key(msg.id)); // the harness reused the id — its answer is no duplicate
      cancelled.delete(key(msg.id));
      flights.set(key(msg.id), { id: msg.id, msg, acked: false });
    }
    dispatch(seeSession(msg)); // the session the plugin names goes into the seat's return (lostplaces.ts)
  });

  const leave = (why: string): Promise<void> => (leaving ??= windDown(why));
  const windDown = async (why: string) => {
    debug(`${why} — winding down`);
    let acks = false;
    if (mode === "local" && local) {
      await local.session.leave(why);
    } else if (link) {
      const l = link;
      acks = !!l.welcome.ack;
      // bye: the daemon answers everything in flight, drops the session, says bye-ok
      await new Promise<void>((resolve) => {
        byeDone = resolve;
        setTimeout(resolve, BYE_MS).unref?.();
        l.send({ t: "bye", why });
      });
      l.close();
    } else acks = true; // no link: whatever waited for a resend never went
    // What the daemon did not answer (or never went) gets a verdict: the harness may still read.
    verdictAll("the bridge left before the machine's daemon answered", acks);
    await flushStdout(process.stdout);
    process.exit(0);
  };
  rl.on("close", () => void leave("stdin closed, the harness is gone"));
  process.on("SIGTERM", () => void leave("SIGTERM"));
  // Ctrl-C: in full mode as the full bridge (exit at once); through the daemon — bye,
  // a second Ctrl-C exits at once.
  const localSigint = fullBridgeSigint(leave);
  let interrupted = false;
  process.on("SIGINT", () => {
    if (mode === "local") return localSigint();
    if (interrupted) process.exit(0);
    interrupted = true;
    void leave("SIGINT");
  });

  void attach().catch((e) => goLocal(`the seam failed: ${(e as Error)?.message ?? String(e)}`));
}
