// The machine daemon: the daemon side of the thin-bridge/daemon seam (wire
// shared/seam.ts, entrance shared/seam-entrance.ts, host shared/seam-host.ts).
//
//   <bridge>.mjs daemon --auth-dir <dir> [--successor]
//
//   one per grant   life lock and listenSeam socket; a second exits DAEMON_BUSY_EXIT
//   sessions        Map id → engine session in its own scope (session.ts, shared/scope.ts)
//   idle            the last session gone — the daemon leaves after the idle window;
//                   a login awaiting a click holds it only up to a limit (daemon-idle.ts)
//   update          a newer home copy or thin bridge — places are handed to a successor
//                   (resume.ts, suspend.ts, handoff.ts), then the daemon leaves; only the
//                   daemon checks releases. Handover: no new requests (unacked ones are
//                   resent to the successor), in-flight calls awaited, seat doors closed
//                   without "released" and without clearing busy
//   journal         <grant dir>/run/daemon.log
import { spawn } from "node:child_process";
import { appendFileSync, mkdirSync, readFileSync, statSync, unlinkSync } from "node:fs";
import { type Server, type Socket } from "node:net";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { BRIDGE_NAME, envName } from "../delivery/index.ts";
import { homeBridgePath } from "../shared/home.ts";
import { escapeRe } from "../shared/regex.ts";
import { runIn, type Scope } from "../shared/scope.ts";
import { type SeamHello, writeFrame } from "../shared/seam.ts";
import { ownPidAlive, seamRunDir, seamSocketPath } from "../shared/seam-entrance.ts";
import {
  listenSeam,
  type SeamHost,
  type SeamSession,
  serveSeam,
  streamSeamSession,
} from "../shared/seam-host.ts";
import { compareVersions } from "../shared/semver.ts";
import { VERSION, versionIn } from "../shared/version.ts";
import { BUILD } from "./build.ts";
import { parseArgs } from "./config.ts";
import { idleWatch } from "./daemon-idle.ts";
import { installCrashWords, startEngine } from "./engine.ts";
import { errorMessage } from "./errors.ts";
import { pruneFallbacks } from "./fallback.ts";
import { handoffsSettled } from "./handoff.ts";
import { beginHandover, beginSessionHandover } from "./holdstate.ts";
import { pauseForHandover } from "./pauserecord.ts";
import { endUnreturnedPause } from "./runend.ts";
import { type BridgeSession, openSession } from "./session.ts";
import { log, setProcessLog } from "./streams.ts";
import { localSuspend, pauseSettled } from "./suspend.ts";
import {
  pendNotice,
  startFreshnessWatch,
  syncHome,
  tellNotice,
  updatesDisabled,
} from "./update.ts";

/** A duration in ms from the environment variable `name`, else `dflt` (thin.ts reads it too). */
export const ms = (name: string, dflt: number): number => {
  const v = Number(process.env[name]);
  return process.env[name]?.trim() && Number.isFinite(v) && v >= 0 ? v : dflt;
};
/** The stamp of a log line (streams.ts): `[<bridge> <time>] `. */
const LOG_MARK = new RegExp(`\\[${escapeRe(BRIDGE_NAME)} [^\\]]*\\] `);
/** How long the daemon lives after the last session leaves. */
const IDLE_MS = ms(envName("BRIDGE_DAEMON_IDLE_MS"), 60_000);
/** How often the home copy is checked (by stat). */
const HOME_CHECK_MS = ms(envName("BRIDGE_DAEMON_HOME_CHECK_MS"), 60_000);
/** How long a successor waits for the leaving daemon to release the entrance. */
const SUCCESSOR_WAIT_MS = ms(envName("BRIDGE_DAEMON_SUCCESSOR_WAIT_MS"), 20_000);
/** How long a session whose seam closed without bye is kept for reattach. */
const GRACE_MS = ms(envName("BRIDGE_DAEMON_GRACE_MS"), 5_000);
/** How long a leaving daemon waits for a live satellite bridge to return to the successor. */
const RETURN_WAIT_MS = ms(envName("BRIDGE_DAEMON_RETURN_WAIT_MS"), 30_000);
const JOURNAL_MAX = 256_000;

/** Exit code: this grant's daemon is already alive — the spawner waits for it instead of going full. */
export const DAEMON_BUSY_EXIT = 75;

const SELF = (() => {
  try {
    return fileURLToPath(import.meta.url);
  } catch {
    return process.argv[1] ?? "";
  }
})();

const versionOfFile = (path: string): string | null => {
  try {
    return versionIn(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
};

export async function daemonMain(argv: string[]): Promise<void> {
  const successor = argv.includes("--successor");
  const cfg = parseArgs(argv.filter((a) => a !== "--successor"));
  const authDir = cfg.authDir;
  const run = seamRunDir(authDir);
  const journalPath = join(run, "daemon.log");
  const journal = (line: string): void => {
    try {
      mkdirSync(run, { recursive: true, mode: 0o700 });
      try {
        if (statSync(journalPath).size > JOURNAL_MAX) unlinkSync(journalPath);
      } catch {}
      // The journal line already starts with time and build, so the log stamp is dropped.
      const text = line.trimEnd().replace(LOG_MARK, "");
      appendFileSync(
        journalPath,
        `${new Date().toISOString()} pid=${process.pid} ${BUILD} ${text}\n`,
        { mode: 0o600 },
      );
    } catch {} // an unwritable journal never kills the daemon
  };
  setProcessLog(journal);
  installCrashWords();

  // Home against self: a newer own build goes home; a newer home copy rises as successor.
  if (!updatesDisabled()) {
    const sync = syncHome();
    for (const p of sync.copied) log(`home updated by this build: ${p}`);
    if (sync.reexec) {
      log(`the home copy is newer — the daemon rises from it: ${sync.reexec}`);
      spawnDaemon(sync.reexec, authDir, successor);
      process.exit(0);
    }
  }

  const sessions = new Map<string, SeamSession>();
  const engines = new Map<string, BridgeSession>();
  /** Sessions whose thin bridge is attached now. */
  const attached = new Set<string>();
  /** Thin bridge pid per session: seam cut but bridge alive means it is within the reattach window. */
  const bridgePids = new Map<string, number>();
  const sockets = new Set<Socket>();
  /** Scopes of sessions handed to the successor: a pause asked during handover is answered there. */
  const handed = new Map<string, Scope>();
  const answering = new Set<Promise<unknown>>();
  let draining = false;
  let counter = 0;
  let lastNotice: string | null = null;
  let server: Server | null = null;

  const idle = idleWatch(
    IDLE_MS,
    () => draining || sessions.size > 0,
    () => {
      server?.close();
      process.exit(0);
    },
  );
  const armIdle = idle.arm;

  const handover = async (to: string, why: string): Promise<void> => {
    if (draining) return;
    draining = true;
    idle.hold();
    log(`handing over to ${to}: ${why} — ${sessions.size} session(s)`);
    beginHandover(why);
    server?.close();
    // Thin bridges wait for the successor instead of raising a daemon themselves.
    for (const so of sockets) writeFrame(so, { t: "handover", why });
    spawnDaemon(to, authDir, true); // the successor waits for this one to release the entrance
    // A satellite with a live thin bridge is paused, not ended (pauserecord.ts); one whose
    // bridge died ends as before.
    const paused: [Scope, number][] = [];
    for (const [id, e] of engines) {
      if (!e.scope) continue;
      handed.set(id, e.scope);
      const pid = bridgePids.get(id) ?? 0;
      if (!attached.has(id) && !ownPidAlive(pid)) continue;
      runIn(e.scope, () => pauseForHandover(why));
      paused.push([e.scope, pid]);
    }
    await Promise.allSettled([...sessions.values()].map((s) => s.end(`daemon handover: ${why}`)));
    await Promise.allSettled([...answering]); // handover pause answers go out before the cut
    // The cut makes thin bridges settle verdicts, resend unacked requests and reattach.
    for (const so of sockets) so.end();
    // Seat sockets are kept until the successor evicts them; frames arriving meanwhile are
    // spooled to it (graph @nks/nks-dev, node #6586).
    await handoffsSettled();
    await Promise.allSettled([...answering]); // pauses asked after the cut, too
    // A bridge gone during handover without returning ends its paused run (runend.ts).
    await Promise.allSettled(
      paused.map(([scope, pid]) => runIn(scope, () => endUnreturnedPause(pid, RETURN_WAIT_MS))),
    );
    log("handed over — leaving");
    setTimeout(() => process.exit(0), 300);
  };

  // Newer by version only: builds of one version differ by hash, which has no order.
  const newer = (v: string | null): boolean => !!v && compareVersions(v, VERSION) > 0;
  let homeSeen = "";
  const checkHome = (): void => {
    if (draining || updatesDisabled()) return;
    const home = homeBridgePath();
    let stamp: string;
    try {
      const st = statSync(home);
      stamp = `${st.ino}:${st.size}:${st.mtimeMs}`;
    } catch {
      return;
    }
    if (stamp === homeSeen) return;
    homeSeen = stamp;
    const v = versionOfFile(home);
    if (newer(v)) void handover(home, `the home copy is v${v}, this daemon v${VERSION}`);
  };

  // A newer thin bridge: its session is accepted (else its call would wait), then all are
  // handed to the newest of the home copy and that bridge's file.
  const newerBridge = (hello: SeamHello): void => {
    if (updatesDisabled()) return;
    const theirs = /^v(\d+\.\d+\.\d+)/.exec(hello.build)?.[1] ?? null;
    if (!newer(theirs)) return;
    const home = homeBridgePath();
    const homeV = versionOfFile(home);
    const to = homeV && compareVersions(homeV, theirs) >= 0 ? home : hello.path;
    if (!to || !newer(versionOfFile(to))) return;
    setImmediate(() => void handover(to, `a thin bridge ${hello.build} is newer than this daemon`));
  };

  const host: SeamHost = {
    build: BUILD,
    path: SELF,
    log: (m) => log(m),
    count: () => sessions.size,
    draining: () => draining,
    // A pause asked during handover becomes a harness pause (suspend.ts), not a refusal.
    answerDraining(id, msg) {
      const scope = handed.get(id);
      const p = scope ? runIn(scope, () => localSuspend(msg)) : null;
      if (scope && p) {
        // Settled before the daemon exits, even past the reply ceiling.
        const settled = p.then(() => runIn(scope, pauseSettled));
        answering.add(settled);
        void settled.finally(() => answering.delete(settled)).catch(() => {});
      }
      return p;
    },
    find: (id) => sessions.get(id) ?? null,
    open(hello) {
      const id = `s${++counter}-${process.pid}`;
      let engine: BridgeSession | null = null;
      let s: SeamSession;
      try {
        s = streamSeamSession(
          id,
          (io, logTo) =>
            (engine = openSession(
              io,
              {
                argv: hello.argv,
                env: hello.env ?? {},
                cwd: hello.cwd,
                pid: hello.pid,
                path: hello.path,
                patSha: hello.patSha ?? null,
              },
              { id, log: logTo },
            )),
          (msg) =>
            log(
              `session ${id}: said while no thin bridge was attached — lost: ${JSON.stringify(msg).slice(0, 160)}`,
            ),
          (line) => journal(`[${id}] ${line}`),
        );
      } catch (e) {
        return errorMessage(e);
      }
      const opened = engine as BridgeSession | null;
      const traced: SeamSession = {
        ...s,
        deliver: (msg) => {
          if (process.env[envName("BRIDGE_DAEMON_TRACE")])
            journal(`[${id}] rpc ${msg.method ?? "reply"} ${JSON.stringify(msg.id ?? null)}`);
          s.deliver(msg);
        },
        attach: (sink, logSink) => {
          if (sink) attached.add(id);
          else attached.delete(id);
          s.attach(sink, logSink);
        },
        end: (why) => {
          attached.delete(id);
          bridgePids.delete(id);
          return s.end(why).then(() => {
            if (sessions.get(id) !== traced) return;
            sessions.delete(id);
            engines.delete(id);
            log(`session ${id} ended: ${why}`);
            armIdle();
          });
        },
      };
      sessions.set(id, traced);
      bridgePids.set(id, hello.pid);
      if (opened) engines.set(id, opened);
      idle.hold();
      log(
        `session ${id} for pid ${hello.pid} (${hello.build}, ${hello.path}) argv=${JSON.stringify(hello.argv)}`,
      );
      if (lastNotice && opened?.scope) {
        const notice = lastNotice;
        runIn(opened.scope, () => pendNotice(notice));
      }
      newerBridge(hello);
      return traced;
    },
  };

  const started = Date.now();
  for (;;) {
    try {
      server = await listenSeam(authDir, (socket) => {
        sockets.add(socket);
        socket.on("close", () => sockets.delete(socket));
        serveSeam(socket, host, GRACE_MS);
      });
      break;
    } catch (e) {
      const code = (e as NodeJS.ErrnoException).code;
      // Only a successor waits for the entrance; others leave — a daemon already exists.
      if (code === "EADDRINUSE" && successor && Date.now() - started < SUCCESSOR_WAIT_MS) {
        await new Promise((r) => setTimeout(r, 100));
        continue;
      }
      log(`the daemon does not rise: ${errorMessage(e)}`);
      process.exit(code === "EADDRINUSE" ? DAEMON_BUSY_EXIT : 3);
    }
  }
  log(`listening ${seamSocketPath(authDir)}${successor ? " (successor)" : ""}`);
  // Marks of sessions run past the daemon and killed without exit (doctor, fallback.ts).
  pruneFallbacks(authDir);

  // One process engine for all sessions; the release check tells every session and
  // a fresh downloaded copy raises a successor.
  startEngine(cfg, { freshness: false });
  startFreshnessWatch(
    authDir,
    cfg.serverUrl,
    (notice) => {
      lastNotice = notice;
      for (const e of engines.values()) if (e.scope) runIn(e.scope, () => tellNotice(notice));
    },
    checkHome,
  );
  const homeTimer = setInterval(checkHome, HOME_CHECK_MS);
  homeTimer.unref();
  checkHome();
  armIdle();

  const stop = (sig: string): void => {
    if (draining) return;
    draining = true;
    log(`${sig} — ending ${sessions.size} session(s)`);
    server?.close();
    // A session whose bridge is alive is a holder change, not a leave; a dead
    // bridge's seat is released (graph @nks/nks-dev, node #6485). A live bridge (attached or
    // in the reattach window) raises a new daemon and returns the seat by its hold record.
    for (const id of sessions.keys()) {
      if (!attached.has(id) && !ownPidAlive(bridgePids.get(id))) continue;
      const scope = engines.get(id)?.scope;
      if (scope) runIn(scope, () => beginSessionHandover(`daemon ${sig}`));
    }
    void Promise.allSettled([...sessions.values()].map((s) => s.end(sig)))
      .then(() => {
        for (const so of sockets) so.destroy();
        return handoffsSettled();
      })
      .then(() => process.exit(0));
  };
  process.on("SIGTERM", () => stop("SIGTERM"));
  process.on("SIGINT", () => stop("SIGINT"));
}

/** Spawn a detached daemon from this file. */
function spawnDaemon(file: string, authDir: string, successor: boolean): void {
  try {
    const child = spawn(
      process.execPath,
      [file, "daemon", "--auth-dir", authDir, ...(successor ? ["--successor"] : [])],
      {
        detached: true,
        stdio: "ignore",
        cwd: seamRunDir(authDir),
        env: process.env,
        windowsHide: true,
      },
    );
    child.on("error", (e) => log(`the successor did not start: ${e.message}`));
    child.unref();
  } catch (e) {
    log(`the successor did not start: ${errorMessage(e)}`);
  }
}
