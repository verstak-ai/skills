// Delivery update is a property of the bridge itself (graph @nks/nks-dev, nodes #4509, #4504):
//   • home against self at every start: a newer own copy that is a release build (#6650)
//     goes home (with the OpenCode plugin next to it); a newer home copy is run instead
//     (cli/main.ts), so whichever file the harness starts, the newest runs;
//   • every six hours ask GitHub releases what is fresh; if something is, download the
//     bridge, the OpenCode plugin and SETUP.md home and say so by notification and a tool
//     answer line — skills are updated by the harness channel and the human must be told;
//   • the update subcommand (cli/update.ts) — the same on demand, without the cache.
// Freshness comes only from the delivery repository's releases, never from the graph server.
import { spawn } from "node:child_process";
import { existsSync, lstatSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  BRIDGE_FILE,
  BRIDGE_NAME,
  BRIDGE_SKILL,
  envName,
  LOGGERS,
  PLUGIN_COPY_FILE,
  PLUGIN_FILE,
  RELEASES,
  SKILL_SET,
  UPDATE,
} from "../delivery/index.ts";
import { homeBridgePath } from "../shared/home.ts";
import { words } from "../shared/lang.ts";
import { scoped } from "../shared/scope.ts";
import { compareVersions } from "../shared/semver.ts";
import { devBuildIn, releaseBuild, VERSION, versionIn } from "../shared/version.ts";
import { isProductionServer } from "./config.ts";
import { RateLimitError, resolveTag, writeAtomic } from "./releases.ts";
import { SKILLS_ROOT_ENV, skillsRoot } from "./skillset.ts";
import { emit, log } from "./streams.ts";

const uw = () => words(UPDATE);

export const RAW_URL =
  process.env[envName("BRIDGE_RAW_URL")]?.trim() ||
  `https://raw.githubusercontent.com/${SKILL_SET}`;
export const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;
/** A failed check without a named reset is retried after this, not after six hours. */
export const FAILED_RETRY_MS = 15 * 60 * 1000;
/**
 * Retry after a failure: not before a floor (the machine clock may run ahead of GitHub's
 * reset) and with a per-bridge spread so bridges do not hit the API in one second.
 * The variables are for probes only.
 */
const envMs = (name: string, dflt: number): number => {
  const v = Number(process.env[name]);
  return process.env[name]?.trim() && Number.isFinite(v) && v >= 0 ? v : dflt;
};
export const RETRY_FLOOR_MS = envMs(envName("BRIDGE_RETRY_FLOOR_MS"), 60_000);
export const RETRY_JITTER_MS = envMs(envName("BRIDGE_RETRY_JITTER_MS"), 60_000);
/** Probes and CI: neither touch home nor go to the network. */
export const updatesDisabled = (): boolean => !!process.env[envName("BRIDGE_NO_UPDATE")];

export const selfPath = (): string => fileURLToPath(import.meta.url);
export const opencodePluginPath = (): string =>
  join(homedir(), ".config", "opencode", "plugins", PLUGIN_COPY_FILE);
export const setupPathOf = (authDir: string): string => join(authDir, "SETUP.md");
export const latestPathOf = (authDir: string): string => join(authDir, "latest.json");

const isSymlink = (path: string): boolean => {
  try {
    return lstatSync(path).isSymbolicLink();
  } catch {
    return false;
  }
};

const readBytes = (path: string): Buffer => {
  try {
    return readFileSync(path);
  } catch {
    return Buffer.alloc(0);
  }
};
const readText = (path: string): string => readBytes(path).toString("utf8");
const versionOf = (path: string): string | null => versionIn(readText(path));

export interface HomeSync {
  /** The home copy is newer — run this file. */
  reexec?: string;
  /** What this start put home. */
  copied: string[];
}

/**
 * Home against self. Own version strictly newer (or no home) and own build a release —
 * own copy goes home; strictly older — home wins and is returned for a restart; an equal
 * version is decided by channel: a release replaces an explicit dev build, anything else
 * stays (between releases bytes differ by hash, and a hash has no order).
 */
export function syncHome(self = selfPath()): HomeSync {
  const out: HomeSync = { copied: [] };
  const home = homeBridgePath();
  let mine: Buffer;
  try {
    mine = readFileSync(self);
  } catch {
    return out;
  }
  if (!versionIn(mine.toString("utf8"))) return out; // not a delivery build — no sync
  if (self === home) return out;
  if (isSymlink(home)) return out; // a home pointed by hand at a working copy is not ours
  const homeVersion = versionOf(home);
  const cmp = homeVersion ? compareVersions(VERSION, homeVersion) : 1;
  // Only a release build refreshes home (graph @nks/nks-dev, node #6650): a working-copy
  // build is "newer" but unaccepted. At an equal version a release replaces an EXPLICIT
  // dev build; an unmarked home is a pre-mark release (7.2.7 and earlier), left alone.
  const healsDev = cmp === 0 && devBuildIn(readText(home)) && !mine.equals(readBytes(home));
  if ((cmp > 0 || healsDev) && releaseBuild()) {
    writeAtomic(home, mine);
    out.copied.push(home);
    const plugin = opencodePluginPath();
    const packaged = join(dirname(self), PLUGIN_FILE);
    if (existsSync(plugin) && existsSync(packaged)) {
      const fresh = readFileSync(packaged);
      if (!readFileSync(plugin).equals(fresh)) {
        writeAtomic(plugin, fresh);
        out.copied.push(plugin);
      }
    }
  } else if (cmp < 0 && homeVersion) {
    out.reexec = home;
  }
  return out;
}

/**
 * Restart with a fresher copy: same runtime, args and stdio, signals forwarded, exit code
 * back. The loop guard is an env variable: the child never restarts again.
 */
export function reexec(path: string, argv: string[]): void {
  log(uw().reexecNewer(versionOf(path) ?? "?", VERSION, path));
  // Home lies outside the skill set: this copy's set root goes to it by env (graph @nks/nks-dev, node #6226).
  const root = skillsRoot();
  const child = spawn(process.execPath, [path, ...argv], {
    stdio: "inherit",
    env: {
      ...process.env,
      [envName("BRIDGE_REEXEC")]: "1",
      ...(root ? { [SKILLS_ROOT_ENV]: root } : {}),
    },
  });
  for (const sig of ["SIGTERM", "SIGINT", "SIGHUP"] as const) {
    process.on(sig, () => child.kill(sig));
  }
  child.on("exit", (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
  child.on("error", (e) => {
    log(uw().restartFailed(e.message));
    process.exit(1);
  });
}

export interface Latest {
  checked_at: number;
  version: string | null;
  tag: string | null;
  /** What this check downloaded home. */
  downloaded: string[];
  error?: string;
  /** Refusal by an exhausted GitHub API limit: pointless to ask before this (epoch ms). */
  rate_limited_until?: number;
  /** Refusal by a GitHub API limit (primary or secondary), reset named or not. */
  rate_limited?: boolean;
}

export function readLatest(authDir: string): Latest | null {
  try {
    return JSON.parse(readFileSync(latestPathOf(authDir), "utf8")) as Latest;
  } catch {
    return null;
  }
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      accept: "application/vnd.github+json, text/plain, */*",
      "user-agent": `${BRIDGE_NAME}/${VERSION}`,
    },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(words(RELEASES).httpFrom(res.status, url));
  return res.text();
}

/** Download a release home: the bridge (only over an older home), the OpenCode plugin (if installed), SETUP.md. */
export async function downloadRelease(
  tag: string,
  version: string,
  authDir: string,
): Promise<string[]> {
  const written: string[] = [];
  const base = `${RAW_URL}/${tag}`;
  const bridge = await fetchText(`${base}/skills/${BRIDGE_SKILL}/scripts/${BRIDGE_FILE}`);
  const got = versionIn(bridge);
  if (got !== version) throw new Error(uw().versionMismatch(got ?? "?", version));
  const home = homeBridgePath();
  const current = versionOf(home);
  if (!isSymlink(home) && (!current || compareVersions(version, current) > 0)) {
    writeAtomic(home, bridge);
    written.push(home);
  }
  const plugin = opencodePluginPath();
  if (existsSync(plugin)) {
    const fresh = await fetchText(`${base}/skills/${BRIDGE_SKILL}/scripts/${PLUGIN_FILE}`);
    if (readFileSync(plugin, "utf8") !== fresh) {
      writeAtomic(plugin, fresh);
      written.push(plugin);
    }
  }
  const setup = await fetchText(`${base}/SETUP.md`);
  writeAtomic(setupPathOf(authDir), setup);
  written.push(setupPathOf(authDir));
  return written;
}

/**
 * When a recorded check stops being an answer: a success after six hours; a failure is
 * not "checked" — a limit holds until its reset, any other failure a quarter hour.
 */
export function checkExpiresAt(latest: Latest): number {
  if (!latest.error) return latest.checked_at + CHECK_INTERVAL_MS;
  if (latest.rate_limited_until) return latest.rate_limited_until;
  return latest.checked_at + FAILED_RETRY_MS;
}

/**
 * What is fresh: from the cache while valid (checkExpiresAt), otherwise from releases
 * (resolveTag). Something fresh is downloaded home in the same move. A network failure
 * is no bridge error: it is cached as a word and retried soon.
 */
export async function checkLatest(authDir: string, force = false): Promise<Latest | null> {
  const cached = readLatest(authDir);
  if (!force && cached && Date.now() < checkExpiresAt(cached)) return cached;
  const latest: Latest = { checked_at: Date.now(), version: null, tag: null, downloaded: [] };
  try {
    const tag = await resolveTag(force);
    latest.tag = tag;
    latest.version = tag ? tag.replace(/^v/, "") : null;
    if (latest.version && compareVersions(latest.version, VERSION) > 0) {
      latest.downloaded = await downloadRelease(tag as string, latest.version, authDir);
    } else if (force && tag) {
      // On demand the installer is always taken: install steps may change without a new bridge build.
      writeAtomic(setupPathOf(authDir), await fetchText(`${RAW_URL}/${tag}/SETUP.md`));
      latest.downloaded = [setupPathOf(authDir)];
    }
  } catch (e) {
    latest.error = (e as Error).message;
    if (e instanceof RateLimitError) {
      latest.rate_limited = true;
      if (e.resetAt) latest.rate_limited_until = e.resetAt;
    }
  }
  try {
    writeAtomic(latestPathOf(authDir), JSON.stringify(latest, null, 2));
  } catch {
    /* home not writable — said by the line, no cache */
  }
  return latest;
}

/** The lag line the agent must pass to the human; null — the delivery is fresh or unknown. */
export function staleNotice(latest: Latest | null, authDir: string): string | null {
  if (!latest?.version || compareVersions(latest.version, VERSION) <= 0) return null;
  const self = String(process.argv[1]);
  const bridgeWord = latest.downloaded.some((p) => p === homeBridgePath())
    ? uw().bridgeDownloaded()
    : latest.error
      ? uw().downloadFailed(latest.error, self)
      : isSymlink(homeBridgePath())
        ? uw().homeSymlink()
        : versionOf(homeBridgePath()) &&
            compareVersions(versionOf(homeBridgePath()), latest.version) >= 0
          ? uw().bridgeAlreadyHome()
          : uw().bridgeNotHome(self);
  const m = skillMoves();
  return uw().stale(
    VERSION,
    latest.version,
    bridgeWord,
    m.claude,
    m.flat,
    m.pi,
    m.codex,
    setupPathOf(authDir),
  );
}

/** Skill-set update moves per harness channel — one copy for the lag line and doctor. */
export const skillMoves = () => ({
  claude: uw().moveClaude(),
  flat: uw().moveFlat(),
  pi: uw().movePi(),
  codex: uw().moveCodex(),
});

const N = scoped(() => ({ pending: null as string | null })); // one line per session

/** The lag line for the first tool answer — given once. */
export function takeNotice(): string | null {
  const n = N.pending;
  N.pending = null;
  return n;
}

/** The lag line into this session's next tool answer, without a notification (the session just opened). */
export function pendNotice(notice: string): void {
  N.pending = notice;
}

/** Tell the session about the lag: an MCP notification now and a line in the next tool answer. */
export function tellNotice(notice: string): void {
  N.pending = notice;
  emit({
    jsonrpc: "2.0",
    method: "notifications/message",
    params: { level: "warning", logger: LOGGERS.bridge, data: { kind: "stale", text: notice } },
  });
}

/**
 * Background release check: a couple of seconds after start, then every six hours, only
 * for a bridge on a production server (another server — another delivery) and never under
 * BRIDGE_NO_UPDATE. `tell` — whom: the full bridge its session; the machine daemon each
 * of its sessions, and it updates itself (daemon.ts). `onChecked` — after every check.
 */
export function startFreshnessWatch(
  authDir: string,
  serverUrl: string,
  tell: (notice: string) => void = tellNotice,
  onChecked: () => void = () => {},
): void {
  if (updatesDisabled()) return;
  const explicit = !!process.env[envName("BRIDGE_RELEASES_URL")]?.trim();
  if (!explicit && !isProductionServer(serverUrl)) {
    log(
      `releases not watched: ${serverUrl} is not a production address — another instance is another delivery`,
    );
    return;
  }
  let retry: ReturnType<typeof setTimeout> | null = null;
  let told: string | null = null;
  const spread = Math.floor(Math.random() * RETRY_JITTER_MS); // per bridge
  const tick = async (): Promise<void> => {
    const latest = await checkLatest(authDir);
    if (retry) clearTimeout(retry);
    retry = null;
    if (latest?.error) {
      // A failure is not "checked": retry after the limit reset or a quarter hour, not on
      // the six-hour beat (+1 s: the reset is named in seconds), above the floor, spread.
      const wait = Math.min(
        CHECK_INTERVAL_MS,
        Math.max(RETRY_FLOOR_MS, checkExpiresAt(latest) - Date.now() + 1000) + spread,
      );
      retry = setTimeout(() => void tick(), wait);
      retry.unref();
    }
    onChecked();
    const notice = staleNotice(latest, authDir);
    if (!notice) return;
    if (latest?.error && notice === told) return; // a short retry of the same failure does not repeat the word
    told = notice;
    log(notice);
    tell(notice);
  };
  const delay = Number(process.env[envName("BRIDGE_UPDATE_DELAY_MS")] ?? 2000);
  setTimeout(() => void tick(), Number.isFinite(delay) ? delay : 2000).unref();
  setInterval(() => void tick(), CHECK_INTERVAL_MS).unref();
}
