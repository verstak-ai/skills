// Per-process part of the bridge engine (not per session): process config, grant locks
// on exit, token keepalive, release freshness. Called by the full bridge (main.ts), the
// thin bridge going in-process (thin.ts) and the machine daemon once (daemon.ts).
import { startTokenKeepalive } from "./auth.ts";
import { BUILD } from "./build.ts";
import { CFG, setConfig } from "./config.ts";
import { releaseStanding } from "./hold.ts";
import { installAuthLockExitHook } from "./oauth/authlock.ts";
import { installRefreshLockExitHook } from "./oauth/refreshlock.ts";
import { tokenRequestsInFlight } from "./oauth/tokenrequest.ts";
import { publishStatusTo } from "./status.ts";
import { statusAddress } from "./statusaddr.ts";
import { storePath } from "./store.ts";
import { log } from "./streams.ts";
import { type Config } from "./types.ts";
import { startFreshnessWatch } from "./update.ts";

// Bun reads HTTP(S)_PROXY itself, Node only from 24.5 under NODE_USE_ENV_PROXY=1:
// the bridge names the lever at start (graph @nks/nks-dev, nodes #4717, #4718).
export function proxyWord(): string | null {
  const env = process.env;
  const proxy = env.HTTPS_PROXY || env.https_proxy || env.HTTP_PROXY || env.http_proxy;
  if (!proxy || process.versions.bun) return null;
  const [major = 0, minor = 0] = process.versions.node.split(".").map(Number);
  const reads = major > 24 || (major === 24 && minor >= 5);
  const flags = [...process.execArgv, ...(env.NODE_OPTIONS ?? "").split(/\s+/)]; // NODE_OPTIONS flags are not in execArgv
  const on = env.NODE_USE_ENV_PROXY === "1" || flags.includes("--use-env-proxy");
  if (reads && on) return null;
  return reads
    ? "a proxy is set (HTTP(S)_PROXY), but Node reads it only under NODE_USE_ENV_PROXY=1 — " +
        "add that variable to the bridge's env in the harness config; until then calls go around the proxy"
    : `a proxy is set (HTTP(S)_PROXY), but Node ${process.versions.node} does not read it at all — ` +
        "Node 24.5+ with NODE_USE_ENV_PROXY=1 or the Bun runtime does; until then calls go around the proxy";
}

/** An uncaught failure is a stderr line, not process death: the harness must not lose its answer. */
export function installCrashWords(): void {
  process.on("uncaughtException", (e) => log(`uncaught: ${e?.stack || e}`));
  process.on("unhandledRejection", (e) =>
    log(`unhandled rejection: ${(e as Error)?.stack || String(e)}`),
  );
}

/**
 * Ctrl-C of the full bridge (and the thin one running in-process). Ctrl-C is the one exception —
 * someone is at the terminal, wanting out. Even so, a rotation already in flight
 * is written down first: the wait is bounded by the request's own deadline and
 * is usually well under a second, while leaving without it costs the whole
 * machine its grant (graph @nks/nks-dev, node #4170). A second Ctrl-C leaves at
 * once — the human has said it twice.
 * A satellite gets SIGINT from the harness, not a human: the first one ends the run
 * via `leave` (graph @nks/nks-dev, nodes #6573, #6593).
 */
export function fullBridgeSigint(leave?: (why: string) => Promise<void>): () => void {
  let interrupted = false;
  return () => {
    if (CFG.satellite && leave && !interrupted) {
      interrupted = true;
      void leave("SIGINT");
      return;
    }
    const addr = statusAddress();
    releaseStanding("SIGINT"); // else .key outlives the bridge and leads the watchdog to a dead socket
    if (interrupted) process.exit(0);
    interrupted = true;
    // Clear the busy status too, briefly.
    const clearing = addr ? publishStatusTo(addr.url, "", 2000).catch(() => {}) : null;
    if (!clearing && tokenRequestsInFlight.size === 0) process.exit(0);
    Promise.allSettled([...tokenRequestsInFlight, ...(clearing ? [clearing] : [])]).then(() =>
      process.exit(0),
    );
  };
}

/**
 * Start the per-process engine under this config, once per process.
 * `freshness: false` — the host runs the release check itself (daemon.ts).
 */
export function startEngine(cfg: Config, opts: { freshness?: boolean } = {}): void {
  setConfig(cfg);
  installAuthLockExitHook();
  installRefreshLockExitHook();
  log(
    `${BUILD} -> ${CFG.serverUrl} (timeout ${CFG.timeoutMs}ms, ${
      CFG.pat ? `personal access token from ${CFG.patSource}` : `auth in ${storePath()}`
    })`,
  );
  const proxy = proxyWord();
  if (proxy) log(proxy);
  startTokenKeepalive();
  // Delivery lag is the bridge's to tell (graph @nks/nks-dev, node #4509).
  if (opts.freshness !== false) startFreshnessWatch(CFG.authDir, CFG.serverUrl);
}
