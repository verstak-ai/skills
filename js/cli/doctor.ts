// doctor: which build is installed and whether it works. It only reads; every line is
// a fact observed here and now, with its path. The one exception is the satellite probe
// of the subagents section: it runs the bridge itself, which writes what a bridge writes.
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { BUILD } from "../bridge/build.ts";
import { now } from "../bridge/clock.ts";
import {
  CFG,
  isProductionServer,
  parseArgs,
  serverChoicePath,
  setConfig,
} from "../bridge/config.ts";
import { errorMessage } from "../bridge/errors.ts";
import { readFallbacks } from "../bridge/fallback.ts";
import { discoverMeta } from "../bridge/oauth/discovery.ts";
import { probeDaemon } from "../bridge/probe.ts";
import { grantLogPath, loadGrantState, loadStore, storePath } from "../bridge/store.ts";
import { daemonWanted } from "../bridge/thin.ts";
import { refreshHours, tokenUsable } from "../bridge/tokens.ts";
import { readLatest } from "../bridge/update.ts";
import {
  CLIENTS,
  DOCTOR,
  type DoctorWords,
  PLUGIN_COPY_FILE,
  PLUGIN_FILE,
  PLUGIN_NAME,
} from "../delivery/index.ts";
import { homeBridgePath } from "../shared/home.ts";
import { words } from "../shared/lang.ts";
import { escapeRe } from "../shared/regex.ts";
import { seamRunDir } from "../shared/seam-entrance.ts";
import { compareVersions } from "../shared/semver.ts";
import { VERSION, versionIn } from "../shared/version.ts";
import { codexCopies } from "./codexcache.ts";
import { type Launch, launchReport, openCodeRuntimeWord } from "./doctornode.ts";
import { secondPathReport } from "./doctorpaths.ts";
import { skillsReport } from "./doctorskills.ts";
import { BRIDGE_FILE_RE, PLUGIN_KEY_RE, PRODUCT_RE } from "./installnames.ts";
import { openCodeMcpEntries } from "./opencode-config.ts";
import { subagentsReport } from "./subagents.ts";

const out = (s: string): void => {
  process.stdout.write(s + "\n");
};

const dw = (): DoctorWords => words(DOCTOR);

const hashOf = (buf: Buffer): string => createHash("sha256").update(buf).digest("hex").slice(0, 8);

const seconds = (ms: number): string => `${Math.round(ms / 1000)}s`;

const ENTRY = escapeRe(PLUGIN_NAME);
/** A hand-written bridge entry in the Codex config.toml, as a table or a dotted key. */
const CODEX_ENTRY_RE = new RegExp(
  `^\\s*\\[mcp_servers\\."?${ENTRY}"?\\]|^\\s*mcp_servers\\."?${ENTRY}"?\\s*=`,
  "m",
);

function homeCopyReport(): void {
  const home = homeBridgePath();
  let self: Buffer | null = null;
  try {
    self = readFileSync(fileURLToPath(import.meta.url));
  } catch {}
  if (!existsSync(home)) {
    out(dw().homeNone(home));
    return;
  }
  const bytes = readFileSync(home);
  if (self && bytes.equals(self)) {
    out(dw().homeSame(home));
    return;
  }
  const v = versionIn(bytes.toString("utf8"));
  out(
    dw().homeDiffers(home, v ?? "?", hashOf(bytes), self ? fileURLToPath(import.meta.url) : null),
  );
}

/** Where the bridge took its server address from. */
export function serverSourceWord(): string {
  switch (CFG.serverSource) {
    case "argument":
      return dw().srcArgument();
    case "env":
      return dw().srcEnv();
    case "file":
      return dw().srcFile(serverChoicePath(CFG.authDir));
    default:
      return dw().srcDefault(serverChoicePath(CFG.authDir));
  }
}

/** Whether the bridge follows the delivery releases at this address. */
export const freshnessWord = (url: string): string =>
  isProductionServer(url) ? dw().freshProd() : dw().freshOther();

async function serverReport(): Promise<void> {
  out(dw().server(CFG.serverUrl, serverSourceWord()));
  out(`  ${freshnessWord(CFG.serverUrl)}`);
  let res: Response;
  try {
    res = await fetch(CFG.serverUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: "doctor", method: "ping" }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch (e) {
    out(dw().unreachable(errorMessage(e)));
    return;
  }
  res.body?.cancel?.();
  const www = res.headers.get("www-authenticate");
  const note = www
    ? dw().wantsOAuth()
    : res.status >= 400 && res.status < 500
      ? dw().noTokenProbe()
      : "";
  out(dw().answers(res.status, note));
  try {
    const meta = await discoverMeta(www);
    out(`  OAuth: token endpoint ${meta.as.token_endpoint}`);
    out(`  resource: ${meta.resource}`);
  } catch (e) {
    out(`  OAuth discovery: ${errorMessage(e)}`);
  }
}

async function patReport(): Promise<void> {
  out(dw().grantPat(String(CFG.patSource)));
  let res: Response;
  try {
    res = await fetch(CFG.serverUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
        authorization: `Bearer ${CFG.pat}`,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "doctor",
        method: "initialize",
        params: {
          protocolVersion: "2025-06-18",
          capabilities: {},
          clientInfo: { name: CLIENTS.doctor, version: "1" },
        },
      }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch (e) {
    out(dw().patCheckFailed(errorMessage(e)));
    return;
  }
  res.body?.cancel?.();
  if (res.status === 401) out(dw().patRejected());
  else if (res.ok) out(dw().patAccepted(res.status));
  else out(dw().patOther(res.status));
  const path = storePath();
  if (existsSync(path)) out(dw().patStore(path));
}

function grantReport(): void {
  const path = storePath();
  out(dw().grant(path));
  if (!existsSync(path)) {
    out(dw().noStore());
    return;
  }
  const store = loadStore();
  const t = store.tokens;
  if (!t?.access_token) {
    out(dw().noTokens());
  } else {
    const usable = tokenUsable(t);
    const left = t.expires_at ? t.expires_at - now() : null;
    out(dw().access(usable, left, left !== null ? seconds(Math.abs(left)) : ""));
    const hours = refreshHours(t);
    if (!t.refresh_token) out(dw().refreshNone());
    else {
      const parts: string[] = [];
      if (hours.nbf)
        parts.push(
          now() < hours.nbf ? dw().refreshValidIn(seconds(hours.nbf - now())) : dw().refreshValid(),
        );
      if (hours.exp)
        parts.push(
          now() >= hours.exp
            ? dw().refreshExpired()
            : dw().refreshExpiresIn(seconds(hours.exp - now())),
        );
      out(dw().refresh(parts.join(", ")));
    }
  }
  if (store.client?.client_id) out(`  client_id: ${store.client.client_id}`);
  const st = loadGrantState();
  if (st.refused_since)
    out(dw().refusedSince(new Date(st.refused_since).toISOString(), st.reason ?? ""));
  for (const suffix of [".auth-pending", ".refreshing"]) {
    if (existsSync(path + suffix)) out(dw().lock(path + suffix));
  }
  const logPath = grantLogPath();
  if (existsSync(logPath)) {
    const lines = readFileSync(logPath, "utf8").trim().split("\n").slice(-3);
    out(dw().grantLog());
    for (const l of lines) out(`    ${l}`);
  }
}

/** The latest release as the bridge's check cache knows it, without the network. */
function latestReport(): void {
  const latest = readLatest(CFG.authDir);
  if (!latest) {
    out(dw().latestNotAsked());
    return;
  }
  const ago = Math.round((Date.now() - latest.checked_at) / 60_000);
  if (!latest.version) out(dw().latestUnknown(latest.error, ago));
  else if (compareVersions(latest.version, VERSION) > 0)
    out(dw().latestBehind(latest.version, VERSION, latest.downloaded.join(", "), ago));
  else out(dw().latestCurrent(latest.version, ago));
}

// A regular install of this delivery carries the bridge entry inside the
// plugin manifests — Claude Code's plugin .mcp.json, the mcpServers object of
// the Codex manifest — not in the user's own config; and the Codex home is not
// always ~/.codex. Reading only the user configs reported "no entry" on a
// healthy install (graph @nks/nks-dev, node #4279).
function claudePluginReport(): void {
  const registry = join(homedir(), ".claude", "plugins", "installed_plugins.json");
  if (!existsSync(registry)) return;
  try {
    const reg = JSON.parse(readFileSync(registry, "utf8")) as {
      plugins?: Record<string, { installPath?: string; version?: string; scope?: string }[]>;
    };
    const mine = Object.entries(reg.plugins ?? {}).filter(([k]) => PLUGIN_KEY_RE.test(k));
    if (!mine.length) {
      out(dw().pluginMissing(registry));
      return;
    }
    for (const [key, installs] of mine) {
      for (const inst of installs) {
        const manifest = inst.installPath ? join(inst.installPath, ".mcp.json") : "";
        let entry = dw().entryNotFound();
        if (manifest && existsSync(manifest)) {
          try {
            const m = JSON.parse(readFileSync(manifest, "utf8")) as {
              mcpServers?: Record<string, { command?: string; args?: string[] }>;
            };
            const hit = Object.entries(m.mcpServers ?? {}).find(([, v]) =>
              (v.args ?? []).some((a) => BRIDGE_FILE_RE.test(a)),
            );
            if (hit) {
              entry = dw().entryFound(hit[0]);
              launches.push({
                who: `Claude Code ${key}`,
                harness: "claude",
                command: hit[1].command ?? "",
              });
            }
          } catch {
            entry = dw().unreadable(manifest);
          }
        }
        out(
          dw().pluginLine(
            key,
            inst.version ?? "?",
            inst.scope ?? "?",
            entry,
            inst.installPath ?? "",
          ),
        );
      }
    }
  } catch {
    out(dw().claudeUnreadable(registry));
  }
}

function codexHomes(): string[] {
  const homes = [
    process.env.CODEX_HOME?.trim() || "",
    join(homedir(), ".codex"),
    ...(process.platform === "darwin"
      ? [join(homedir(), "Library", "Application Support", "orca", "codex-runtime-home", "home")]
      : []),
  ].filter(Boolean);
  return [...new Set(homes)].filter((h) => existsSync(h));
}

function codexPluginReport(home: string): void {
  const cache = join(home, "plugins", "cache");
  if (!existsSync(cache)) return;
  let found = 0;
  for (const { market, plugin, dir } of codexCopies(home)) {
    const manifest = join(dir, ".codex-plugin", "plugin.json");
    let word = dw().codexNoManifest();
    if (existsSync(manifest)) {
      try {
        const m = JSON.parse(readFileSync(manifest, "utf8")) as {
          version?: string;
          mcpServers?: Record<string, { command?: string; args?: string[] }>;
        };
        const hit = Object.values(m.mcpServers ?? {}).find((v) =>
          (v.args ?? []).some((a) => BRIDGE_FILE_RE.test(a)),
        );
        word = dw().codexManifest(m.version ?? "?", !!hit);
        if (hit)
          launches.push({
            who: `Codex ${plugin}@${market}`,
            harness: "codex",
            command: hit.command ?? "",
          });
      } catch {
        word = dw().unreadable(manifest);
      }
    }
    found++;
    out(dw().codexPlugin(plugin, market, word, dir));
  }
  if (!found) out(dw().codexNoPlugin(cache));
}

// Commands of the bridge stdio entries found by the harness report, checked against PATH (doctornode.ts).
const launches: Launch[] = [];

export function harnessReport(): void {
  launches.length = 0;
  claudePluginReport();
  const claude = join(homedir(), ".claude.json");
  if (existsSync(claude)) {
    try {
      const cfg = JSON.parse(readFileSync(claude, "utf8")) as {
        mcpServers?: Record<string, { command?: string; args?: string[] }>;
      };
      const entries = Object.entries(cfg.mcpServers ?? {}).filter(([, v]) =>
        (v.args ?? []).some((a) => PRODUCT_RE.test(a)),
      );
      if (entries.length) {
        for (const [name, v] of entries) {
          out(dw().claudeEntry(name, v.command ?? "", (v.args ?? []).join(" ")));
          launches.push({
            who: `Claude Code «${name}»`,
            harness: "claude",
            command: v.command ?? "",
            entry: name,
          });
        }
      } else out(dw().claudeNoManual());
    } catch {
      out(dw().claudeUnreadable(claude));
    }
  }
  // OpenCode: the delivery plugin lies as a copy in the plugins directory.
  const opencodeDir = join(homedir(), ".config", "opencode");
  if (existsSync(opencodeDir)) {
    const copy = join(opencodeDir, "plugins", PLUGIN_COPY_FILE);
    const packaged = join(dirname(fileURLToPath(import.meta.url)), PLUGIN_FILE);
    if (!existsSync(copy)) out(dw().ocNoPlugin(copy));
    else if (!existsSync(packaged)) out(dw().ocNoPackaged(copy));
    else if (readFileSync(copy).equals(readFileSync(packaged))) out(dw().ocSame(copy));
    else out(dw().ocDiffers(copy, packaged));
    if (existsSync(copy)) out(openCodeRuntimeWord());
  }
  openCodeMcpEntries(out);
  for (const codexHome of codexHomes()) {
    out(dw().codexHome(codexHome));
    codexPluginReport(codexHome);
    const door = join(codexHome, "app-server-control", "app-server-control.sock");
    if (existsSync(door)) out(dw().codexDoorOpen(door));
    else if (Buffer.byteLength(door) > 100) out(dw().codexDoorNever());
    else out(dw().codexDoorNone(door));
    const codex = join(codexHome, "config.toml");
    if (existsSync(codex)) {
      const text = readFileSync(codex, "utf8");
      out(dw().codexManual(CODEX_ENTRY_RE.test(text)));
    }
  }
  launchReport(out, launches);
  secondPathReport(out, codexHomes());
}

/** The machine daemon of this grant directory: mode, socket, pid, build, sessions. */
async function daemonReport(): Promise<void> {
  out(daemonWanted() ? dw().daemonOn() : dw().daemonOff());
  out(dw().daemonGrant(CFG.authDir));
  const fallbacks = readFallbacks(CFG.authDir);
  if (!fallbacks.length) out(dw().fallbackNone());
  else {
    out(dw().fallbackCount(fallbacks.length));
    for (const f of fallbacks) out(dw().fallbackOne(f.pid, f.build, f.since, f.cwd, f.why));
  }
  // No seam directory means no daemon was ever raised, and a probe would create it.
  if (!existsSync(seamRunDir(CFG.authDir))) {
    out(dw().daemonNeverUp(seamRunDir(CFG.authDir)));
    return;
  }
  const d = await probeDaemon(["--auth-dir", CFG.authDir]);
  if (d.ok) {
    out(dw().daemonSocket(d.socket));
    out(
      dw().daemonAnswers(
        d.pid,
        d.build,
        !d.build.startsWith(`v${VERSION}+`),
        VERSION,
        d.sessions,
        d.path,
      ),
    );
  } else if (d.unsafe) out(dw().daemonUnsafe(d.why));
  else out(dw().daemonSilent(d.socket, d.why));
}

export async function runDoctor(argv: string[]): Promise<void> {
  setConfig(parseArgs(argv));
  out(dw().title(BUILD));
  out(dw().thisFile(fileURLToPath(import.meta.url)));
  out(`node: ${process.version}`);
  homeCopyReport();
  latestReport();
  await daemonReport();
  await serverReport();
  if (CFG.pat) await patReport();
  else grantReport();
  harnessReport();
  skillsReport(out, codexHomes());
  await subagentsReport(out);
}
