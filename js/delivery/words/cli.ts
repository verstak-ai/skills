// Subcommands (CLI): --help, the home alignment line, update, use.
import type { Lang } from "../lang.ts";
import { tool } from "../protocol.ts";

export interface CliWords {
  usage: (build: string, rituals: string) => string;
  homeUpdated: (path: string) => string;
  updateTitle: (build: string) => string;
  updateServer: (url: string, source: string, fresh: string) => string;
  rateLimited: (error: string | undefined, reset: boolean) => string;
  latestUnknown: (error: string | undefined) => string;
  lag: (cmp: number) => string;
  latest: (version: string, tag: string | null, mine: string, lag: string) => string;
  downloadFailed: (error: string) => string;
  placed: (path: string) => string;
  nothingPlaced: (home: string) => string;
  next: () => string;
  stepSkills: (setup: string, fetched: boolean) => string;
  stepRestart: () => string;
  stepDoctor: () => string;
  useNoAddress: () => string;
  useWritten: (url: string, path: string, fresh: string) => string;
  useEffect: () => string;
}

export const CLI: Readonly<Record<Lang, CliWords>> = {
  en: {
    usage: (build, rituals) => `verstak ${build}
  node verstak-bridge.mjs [bridge] [server-url] [--timeout <ms>] [--auth-dir <dir>] [--no-browser] [--debug] [--satellite] [--tools <a,b,c>]
      (--satellite — the bridge of a subagent run from an agent file: only the satellite seat <caller's seat>.sub-N)
      (--tools — which tools the harness sees, ${tool("stand")} always; without the flag — all)
  node verstak-bridge.mjs watchdog [key] [--auth-dir <dir>] [--lang en]
  node verstak-bridge.mjs watchdog-exit [key] [--auth-dir <dir>] [--lang en]
  node verstak-bridge.mjs watchdog-codex [key] [--auth-dir <dir>] [--lang en]   (from the Codex shell: CODEX_THREAD_ID, CODEX_HOME)
      (--lang — the surface language; the bridge block prints the watchdog command with it)
  node verstak-bridge.mjs doctor [server-url] [--auth-dir <dir>]
  node verstak-bridge.mjs update [--auth-dir <dir>]
  node verstak-bridge.mjs use <en|url> [--auth-dir <dir>]   (en — mcp.verstak.ai)
  ${rituals}
  node verstak-bridge.mjs daemon --auth-dir <dir>   (the machine daemon; the thin bridge raises it — the default bridge)
  node verstak-bridge.mjs version   (or --version)
  env: VERSTAK_BRIDGE_TOKEN — a personal token instead of OAuth (or the file <auth-dir>/token);
       VERSTAK_BRIDGE_DAEMON=0 — the full bridge in its own process, without the machine daemon;
       VERSTAK_BRIDGE_URL, VERSTAK_BRIDGE_AUTH_DIR, VERSTAK_BRIDGE_NO_BROWSER, VERSTAK_BRIDGE_DEBUG
`,
    homeUpdated: (path) => `[verstak-bridge] home updated by this build: ${path}\n`,
    updateTitle: (build) => `verstak update — ${build}`,
    updateServer: (url, source, fresh) => `server: ${url} (${source}) — ${fresh}`,
    rateLimited: (error, reset) =>
      `latest release unknown: ${error} — GitHub rate limit; retry ${reset ? "after the reset" : "later"}`,
    latestUnknown: (error) =>
      `latest release unknown: ${error ?? "no answer"} — network or GitHub; retry later`,
    lag: (cmp) =>
      cmp > 0
        ? " — behind"
        : cmp < 0
          ? " — newer than the release (a branch build)"
          : " — not behind",
    latest: (version, tag, mine, lag) =>
      `latest release: v${version} (${tag}); this file: v${mine}${lag}`,
    downloadFailed: (error) => `download failed: ${error}`,
    placed: (path) => `placed: ${path}`,
    nothingPlaced: (home) =>
      `nothing was placed in the home: ${home} is not older than the release`,
    next: () => "Next:",
    stepSkills: (setup, fetched) =>
      `  1. Skills are updated by the harness channel — the order is in the fresh installer ${setup}${fetched ? "" : " (not downloaded — take it from the release)"}: read it and carry out the update steps for this harness.`,
    stepRestart: () =>
      "  2. Restart the harness sessions: a bridge started by the previous build lives until the end of its session.",
    stepDoctor: () =>
      "  3. node ~/.verstak-bridge/verstak-bridge.mjs doctor — a check of what is installed and working.",
    useNoAddress: () => "use: name an address — en (mcp.verstak.ai) or the full URL of an instance",
    useWritten: (url, path, fresh) => `the bridge looks at ${url} — written to ${path}; ${fresh}`,
    useEffect: () =>
      "Takes effect from a new bridge process: restart the harness sessions. The grant is separate per address — the first call at a new address leads to login.",
  },
};
