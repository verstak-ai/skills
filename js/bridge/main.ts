// The bridge — stdio <-> streamable-HTTP MCP bridge with the full OAuth 2.1 flow.
//
// For harnesses that cannot (or should not) speak https+OAuth MCP themselves:
// the harness runs this file as an ordinary stdio MCP server, and the bridge
// carries every JSON-RPC message to a remote streamable-HTTP MCP server,
// handling discovery (RFC 9728 / RFC 8414), dynamic client registration,
// authorization-code + PKCE in the browser, token persistence and refresh.
//
// The design rule that justifies this bridge's existence: NEVER answer the
// harness with silence. Every forwarded request gets a deadline; any upstream
// failure — timeout, dead TCP, HTTP error, lost session — comes back to the
// harness as a JSON-RPC error for that request id. There are no long-lived
// upstream connections to go half-dead: each request is its own POST.
//
// Usage:
//   node <BRIDGE_FILE> [bridge] [server-url] [--timeout <ms>] [--auth-dir <dir>]
//                   [--client-name <name>] [--no-browser] [--debug] [--satellite] [--tools <a,b,c>]
// --satellite: the bridge of a subagent run — see satellite.ts (a flag only, no env: an older bridge must fail loudly).
// --tools: the tools the harness sees — see narrow.ts.
// With no server-url the bridge points at the product instance (DEFAULT_SERVER_URL);
// pass a URL (or set BRIDGE_URL) only for another instance or fork.
// Env, each under the delivery's ENV_PREFIX (flags win): BRIDGE_URL, BRIDGE_TIMEOUT,
//                  BRIDGE_AUTH_DIR, BRIDGE_NO_BROWSER, BRIDGE_DEBUG, BRIDGE_SCOPE,
//                  BRIDGE_RESOURCE (override the resource indicator / audience),
//                  BRIDGE_CLIENT_ID,
//                  BRIDGE_DEVICE_CLIENT (the client of sign-in from another device;
//                  default BRIDGE_NAME; a server without it offers no code),
//                  BRIDGE_DEVICE_REGISTER=1 (no such client: register one for the code),
//                  BRIDGE_TOKEN (a personal access token: no OAuth at all; the
//                  file <auth-dir>/token is read when the variable is absent),
//                  BRIDGE_DAEMON=0 (the full bridge in process; by default — a thin
//                  bridge to the machine daemon, thin.ts), BRIDGE_NO_DAEMON=1 (the same)
//
// No dependencies. Node >= 22.
import { envName } from "../delivery/index.ts";
import { BUILD } from "./build.ts";
import { parseArgs } from "./config.ts";
import { fullBridgeSigint, installCrashWords, startEngine } from "./engine.ts";
import { markFallback } from "./fallback.ts";
import { openSession } from "./session.ts";
import { guardStream } from "./streams.ts";
import { daemonWanted, thinMain } from "./thin.ts";

export function bridgeMain(argv: string[]): void {
  guardStream(process.stdout); // before the first write: a broken pipe is news, not a crash
  guardStream(process.stderr);
  if (daemonWanted()) {
    thinMain(argv);
    return;
  }
  const cfg = parseArgs(argv);
  // Bypassing the daemon by choice gets the fallback's mark: doctor names every such session.
  markFallback(cfg.authDir, {
    build: BUILD,
    cwd: process.cwd(),
    why: `the daemon switch is off (${envName("BRIDGE_DAEMON")}=0 or ${envName("BRIDGE_NO_DAEMON")})`,
  });
  startEngine(cfg);
  const session = openSession({ input: process.stdin, output: process.stdout });
  void session.ended.then(() => process.exit(0));
  process.on("SIGTERM", () => void session.leave("SIGTERM"));
  process.on("SIGINT", fullBridgeSigint(session.leave));
  installCrashWords();
}
