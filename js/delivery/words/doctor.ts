// doctor (DOCTOR): build, home, server, grant, release, harness plugins, the machine
// daemon.
import type { Lang } from "../lang.ts";

export interface DoctorWords {
  title: (build: string) => string;
  homeNone: (home: string) => string;
  homeSame: (home: string) => string;
  homeDiffers: (home: string, v: string, hash: string, selfPath: string | null) => string;
  srcArgument: () => string;
  srcEnv: () => string;
  srcFile: (p: string) => string;
  srcDefault: (p: string) => string;
  freshProd: () => string;
  freshOther: () => string;
  server: (url: string, source: string) => string;
  unreachable: (why: string) => string;
  wantsOAuth: () => string;
  noTokenProbe: () => string;
  answers: (status: number, note: string) => string;
  grantPat: (source: string) => string;
  patCheckFailed: (why: string) => string;
  patRejected: () => string;
  patAccepted: (status: number) => string;
  patOther: (status: number) => string;
  patStore: (path: string) => string;
  grant: (path: string) => string;
  noStore: () => string;
  noTokens: () => string;
  access: (usable: boolean, left: number | null, span: string) => string;
  refreshNone: () => string;
  refreshValidIn: (s: string) => string;
  refreshValid: () => string;
  refreshExpired: () => string;
  refreshExpiresIn: (s: string) => string;
  refresh: (parts: string) => string;
  refusedSince: (since: string, reason: string) => string;
  lock: (p: string) => string;
  grantLog: () => string;
  latestNotAsked: () => string;
  latestUnknown: (why: string | undefined, ago: number) => string;
  latestBehind: (latest: string, v: string, downloaded: string, ago: number) => string;
  latestCurrent: (latest: string, ago: number) => string;
  pluginMissing: (registry: string) => string;
  entryNotFound: () => string;
  entryFound: (name: string) => string;
  unreadable: (p: string) => string;
  pluginLine: (key: string, v: string, scope: string, entry: string, path: string) => string;
  claudeUnreadable: (p: string) => string;
  codexNoManifest: () => string;
  codexManifest: (v: string, hit: boolean) => string;
  codexPlugin: (plugin: string, market: string, word: string, dir: string) => string;
  codexNoPlugin: (cache: string) => string;
  claudeEntry: (name: string, cmd: string, args: string) => string;
  claudeNoManual: () => string;
  ocNoPlugin: (copy: string) => string;
  ocNoPackaged: (copy: string) => string;
  ocSame: (copy: string) => string;
  ocDiffers: (copy: string, packaged: string) => string;
  codexHome: (h: string) => string;
  codexDoorOpen: (door: string) => string;
  codexDoorNever: () => string;
  codexDoorNone: (door: string) => string;
  codexManual: (has: boolean) => string;
  daemonOn: () => string;
  daemonOff: () => string;
  daemonNeverUp: (dir: string) => string;
  daemonGrant: (dir: string) => string;
  daemonSocket: (s: string) => string;
  fallbackNone: () => string;
  fallbackCount: (n: number) => string;
  fallbackOne: (pid: number, build: string, since: string, cwd: string, why: string) => string;
  daemonAnswers: (
    pid: unknown,
    build: string,
    other: boolean,
    v: string,
    sessions: unknown,
    path?: string,
  ) => string;
  daemonUnsafe: (why: unknown) => string;
  daemonSilent: (socket: unknown, why: unknown) => string;
  thisFile: (p: string) => string;
}

export const DOCTOR: Readonly<Record<Lang, DoctorWords>> = {
  en: {
    title: (build) => `verstak doctor — ${build}`,
    homeNone: (home) => `home copy: none (${home}) — establish-mcp places it on connect`,
    homeSame: (home) => `home copy: ${home} — the same build as this file`,
    homeDiffers: (home, v, hash, selfPath) => {
      const fix = selfPath
        ? `update it from the delivery: cp "${selfPath}" ${home}`
        : "this file is unreadable";
      return `home copy: ${home} — v${v}+${hash}, DIFFERENT bytes: ${fix}`;
    },
    srcArgument: () => "launch argument",
    srcEnv: () => "the VERSTAK_BRIDGE_URL variable",
    srcFile: (p) => `choice file ${p}`,
    srcDefault: (p) => `the default; to change — node <bridge> use en | ru | <url>, file ${p}`,
    freshProd: () => "production address: self-update from the delivery releases is on",
    freshOther: () => "another instance: there are no updates from the delivery releases",
    server: (url, source) => `server: ${url} (${source})`,
    unreachable: (why) => `  unreachable: ${why}`,
    wantsOAuth: () => " (asks for OAuth)",
    noTokenProbe: () => " (a probe without a token — a refusal is expected)",
    answers: (status, note) => `  answers: HTTP ${status}${note}`,
    grantPat: (source) => `grant: a personal token (PAT) from ${source} — OAuth is not used`,
    patCheckFailed: (why) => `  the check failed: ${why}`,
    patRejected: () =>
      "  TOKEN REJECTED (HTTP 401) — revoked, expired or without rights to this graph: issue a new one on the graph's token page",
    patAccepted: (status) => `  the token is accepted by the server (HTTP ${status})`,
    patOther: (status) =>
      `  the server answered HTTP ${status} — not a token refusal, see the "server" line`,
    patStore: (path) => `  the OAuth store ${path} exists but is not read while a PAT is set`,
    grant: (path) => `grant: ${path}`,
    noStore: () => "  no store — the bridge has never logged in to this server",
    noTokens: () => "  no tokens",
    access: (usable, left, span) =>
      `  access: ${usable ? "usable" : "not usable"}${left !== null ? ` (${left > 0 ? "expires in" : "expired"} ${span})` : ""}`,
    refreshNone: () => "  refresh: none",
    refreshValidIn: (s) => `valid in ${s}`,
    refreshValid: () => "valid",
    refreshExpired: () => "EXPIRED — a login is needed",
    refreshExpiresIn: (s) => `expires in ${s}`,
    refresh: (parts) => `  refresh: present${parts ? ` (${parts})` : ""}`,
    refusedSince: (since, reason) => `  a refusal stands since ${since}: ${reason}`,
    lock: (p) => `  lock: ${p}`,
    grantLog: () => "  grant.log, latest:",
    latestNotAsked: () =>
      "latest release: the bridge has not asked about releases yet (it will in a couple of seconds after the session starts; by hand — the update subcommand)",
    latestUnknown: (why, ago) =>
      `latest release: unknown (${why ?? "no reason"}), asked ${ago} min ago`,
    latestBehind: (latest, v, downloaded, ago) =>
      `latest release: v${latest} — THIS FILE IS BEHIND (v${v}); downloaded to the home: ${downloaded || "nothing"}; asked ${ago} min ago`,
    latestCurrent: (latest, ago) =>
      `latest release: v${latest}, this file is not behind; asked ${ago} min ago`,
    pluginMissing: (registry) => `Claude Code: the verstak plugin is not installed (${registry})`,
    entryNotFound: () => "no bridge entry found in the manifest",
    entryFound: (name) => `entry "${name}" → the bridge from the plugin`,
    unreadable: (p) => `${p} is unreadable`,
    pluginLine: (key, v, scope, entry, path) =>
      `Claude Code: plugin ${key} v${v} (${scope}) — ${entry}; ${path}`,
    claudeUnreadable: (p) => `Claude Code: ${p} is unreadable`,
    codexNoManifest: () => "no manifest",
    codexManifest: (v, hit) =>
      `v${v}, ${hit ? "the bridge entry is in the manifest" : "no bridge entry in the manifest"}`,
    codexPlugin: (plugin, market, word, dir) =>
      `Codex: plugin ${plugin}@${market} — ${word}; ${dir}`,
    codexNoPlugin: (cache) => `Codex: no verstak plugin in the cache (${cache})`,
    claudeEntry: (name, cmd, args) => `Claude Code: entry "${name}" → ${cmd} ${args}`,
    claudeNoManual: () =>
      "Claude Code: no manual bridge entry in the user config (the standard one is in the plugin)",
    ocNoPlugin: (copy) => `OpenCode: no plugin (${copy}) — establish-mcp places it on connect`,
    ocNoPackaged: (copy) =>
      `OpenCode: the plugin ${copy} is installed; there is no plugin next to this delivery file, nothing to compare with`,
    ocSame: (copy) => `OpenCode: the plugin ${copy} — the same build as in the delivery`,
    ocDiffers: (copy, packaged) =>
      `OpenCode: the plugin ${copy} — DIFFERENT bytes, update from the delivery: cp "${packaged}" ${copy}`,
    codexHome: (h) => `Codex: home ${h}`,
    codexDoorOpen: (door) => `Codex: the app-server door is open (${door})`,
    codexDoorNever: () =>
      "Codex: there is no door and there will not be — the home is longer than the unix socket limit; a short home is needed for the daemon and sessions",
    codexDoorNone: (door) =>
      `Codex: no door (${door}) — the app-server daemon is not up; without it the frame is delivered by watchdog-exit`,
    codexManual: (has) =>
      `Codex: ${has ? "there is a manual bridge entry in config.toml" : "no manual bridge entry in config.toml (the standard one is in the plugin)"}`,
    daemonOn: () =>
      "machine daemon: the thin bridge is on — the default (the switch is VERSTAK_BRIDGE_DAEMON=0 in the bridge environment)",
    daemonOff: () =>
      "machine daemon: off — the bridge runs full (the switch is set in this process environment: VERSTAK_BRIDGE_DAEMON=0 or VERSTAK_BRIDGE_NO_DAEMON)",
    daemonNeverUp: (dir) => `  never started: the seam directory ${dir} does not exist`,
    daemonGrant: (dir) => `  grant directory: ${dir} — one daemon per directory`,
    daemonSocket: (s) => `  entrance, socket: ${s}`,
    fallbackNone: () =>
      "  no session goes around the daemon (the full bridge in its own process — the fallback path or the switch)",
    fallbackCount: (n) =>
      `  sessions around the daemon (the full bridge in its own process — the fallback path or the switch): ${n} — the daemon does not see them nor count them in "sessions"`,
    fallbackOne: (pid, build, since, cwd, why) =>
      `    pid ${pid}, build ${build}, since ${since}, directory ${cwd}: ${why}`,
    daemonAnswers: (pid, build, other, v, sessions, path) =>
      `  answers: pid ${String(pid)}, build ${build}${other ? ` — DIFFERENT from this file (v${v})` : ""}, sessions ${String(sessions ?? "?")}${path ? `, file ${path}` : ""}`,
    daemonUnsafe: (why) =>
      `  the entrance is not private: ${String(why)} — the thin bridge will go full`,
    daemonSilent: (socket, why) => `  socket: ${String(socket)} — not answering (${String(why)})`,
    thisFile: (p) => `this file: ${p}`,
  },
};
