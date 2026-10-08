// doctor's subagents section: each project agent file has its own satellite bridge,
// and that bridge starts on this machine and hands out tools the API accepts. A
// breakage here is invisible: a subagent without a bridge just works without graph
// tools, and a schema the API rejects fails the whole run with a nameless 400. Each
// finding is a line with a ready action. The entry form is satform.ts.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { basename, delimiter, dirname, isAbsolute, join, resolve } from "node:path";

import { CFG, isProductionServer } from "../bridge/config.ts";
import { loadStore, storePath } from "../bridge/store.ts";
import { BRIDGE_NAME, envName, PLUGIN_NAME, PRODUCT, SUB_ENTRY_PREFIX } from "../delivery/index.ts";
import { homeBridgePath } from "../shared/home.ts";
import { escapeRe } from "../shared/regex.ts";
import { frontmatterText, parseFrontmatter, type YamlValue } from "./frontmatter.ts";
import { PRODUCT_PATTERN, PRODUCT_RE } from "./installnames.ts";
import { bridgePathOf, formOf, readyEntry, SATELLITE_ARGS, toolsTail } from "./satform.ts";
import { loginAdvice, probeSatellite } from "./satprobe.ts";
import { formWord, subWords as sw, todo } from "./subwords.ts";

type Out = (s: string) => void;

/** The OS the entry command is judged for; the variable is a probe seam (Windows on any machine). */
const PLATFORM_ENV = envName("DOCTOR_PLATFORM");
const platform = (): string => process.env[PLATFORM_ENV] || process.platform;

const BRIDGE_RE = new RegExp(
  `${escapeRe(BRIDGE_NAME)}|(^|[\\\\/"'\\s])${PRODUCT_PATTERN}[^\\\\/"'\\s]*\\.mjs`,
);
/** Graph server prefixes of the projection template, removed whenever none of our own were found. */
const TEMPLATE_PARENTS = [
  `mcp__${BRIDGE_NAME}`,
  `mcp__plugin_${PLUGIN_NAME}_${PRODUCT}`,
  `mcp__${PRODUCT}`,
];

interface Entry {
  name: string;
  ref: boolean; // a reference to a session config server, not an inline entry
  command: string;
  args: string[];
  env: Record<string, string>;
}

interface AgentFile {
  path: string;
  agent: string;
  scope: "project" | "user";
  fm: Record<string, YamlValue>;
}

const str = (v: YamlValue | undefined): string => (typeof v === "string" ? v : "");

function entriesOf(fm: Record<string, YamlValue>): Entry[] {
  const raw = fm.mcpServers;
  const pairs: [string, YamlValue][] = [];
  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (typeof item === "string") pairs.push([item, null]);
      else if (item && typeof item === "object" && !Array.isArray(item))
        for (const [k, v] of Object.entries(item)) pairs.push([k, v]);
    }
  } else if (raw && typeof raw === "object") pairs.push(...Object.entries(raw));
  return pairs.map(([name, v]) => {
    const spec = v && typeof v === "object" && !Array.isArray(v) ? v : {};
    const args = Array.isArray(spec.args) ? spec.args.map((a) => str(a)) : [];
    const env: Record<string, string> = {};
    if (spec.env && typeof spec.env === "object" && !Array.isArray(spec.env))
      for (const [k, e] of Object.entries(spec.env)) env[k] = str(e);
    return { name, ref: v === null, command: str(spec.command), args, env };
  });
}

const listOf = (v: YamlValue | undefined): string[] =>
  Array.isArray(v)
    ? v.map((x) => str(x).trim()).filter(Boolean)
    : str(v)
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);

function agentFiles(dir: string, scope: AgentFile["scope"]): AgentFile[] {
  if (!existsSync(dir)) return [];
  let names: string[];
  try {
    names = readdirSync(dir).filter((f) => f.endsWith(".md"));
  } catch {
    return [];
  }
  return names.sort().map((f) => {
    const path = join(dir, f);
    let fm: Record<string, YamlValue> = {};
    try {
      const text = frontmatterText(readFileSync(path, "utf8"));
      if (text !== null) fm = parseFrontmatter(text);
    } catch {}
    return { path, agent: str(fm.name) || basename(f, ".md"), scope, fm };
  });
}

/** Project root: the first directory up from cwd with agent files, else with .git, else cwd; home is not a project. */
export function projectRoot(): string {
  const home = resolve(homedir());
  let gitRoot: string | null = null;
  for (let d = process.cwd(); ;) {
    if (resolve(d) === home) break;
    if (existsSync(join(d, ".claude", "agents")) || existsSync(join(d, ".opencode", "agents")))
      return d;
    if (!gitRoot && existsSync(join(d, ".git"))) gitRoot = d;
    const up = dirname(d);
    if (up === d) break;
    d = up;
  }
  return gitRoot ?? process.cwd();
}

/** Where the command lies on this machine; null if not found. */
export function which(cmd: string, cwd: string): string | null {
  if (isAbsolute(cmd) || /[\\/]/.test(cmd)) {
    const p = resolve(cwd, cmd);
    return existsSync(p) ? p : null;
  }
  const exts =
    platform() === "win32"
      ? ["", ...(process.env.PATHEXT || ".COM;.EXE;.BAT;.CMD").split(";").filter(Boolean)]
      : [""];
  for (const dir of (process.env.PATH || "").split(delimiter).filter(Boolean)) {
    for (const ext of exts) {
      const p = join(dir, cmd + ext);
      try {
        if (statSync(p).isFile()) return p;
      } catch {}
    }
  }
  return null;
}

/** The address is a graph server: a production one or the one this machine's bridge looks at. */
export function graphServer(url: string): boolean {
  const norm = (u: string) => u.trim().replace(/\/+$/, "").toLowerCase();
  return isProductionServer(url) || norm(url) === norm(CFG.serverUrl);
}

/** Bridge servers the subagent inherits from its caller: their tools must go into disallowedTools. */
function parentBridges(root: string): string[] {
  const found = new Set<string>();
  const scan = (servers: unknown, prefix: (n: string) => string) => {
    if (!servers || typeof servers !== "object") return;
    for (const [n, v] of Object.entries(servers as Record<string, unknown>)) {
      const e = (v ?? {}) as { command?: string; args?: string[]; url?: string };
      const hay = [e.command ?? "", ...(e.args ?? [])].join(" ");
      if (BRIDGE_RE.test(hay) && !hay.includes("--satellite")) found.add(prefix(n));
      // A native http entry on the graph server gives the same graph tools, removed the same way.
      else if (typeof e.url === "string" && graphServer(e.url)) found.add(prefix(n));
    }
  };
  const readJson = (p: string): Record<string, unknown> | null => {
    try {
      return JSON.parse(readFileSync(p, "utf8")) as Record<string, unknown>;
    } catch {
      return null;
    }
  };
  const user = readJson(join(homedir(), ".claude.json"));
  if (user) {
    scan(user.mcpServers, (n) => `mcp__${n}`);
    const projects = (user.projects ?? {}) as Record<string, { mcpServers?: unknown }>;
    const key = root.replace(/\\/g, "/");
    for (const [k, p] of Object.entries(projects))
      if (k.replace(/\\/g, "/") === key) scan(p.mcpServers, (n) => `mcp__${n}`);
  }
  scan(readJson(join(root, ".mcp.json"))?.mcpServers, (n) => `mcp__${n}`);
  const registry = readJson(join(homedir(), ".claude", "plugins", "installed_plugins.json"));
  const plugins = (registry?.plugins ?? {}) as Record<string, { installPath?: string }[]>;
  for (const [key, installs] of Object.entries(plugins)) {
    const plugin = key.split("@")[0];
    if (!PRODUCT_RE.test(plugin)) continue;
    for (const inst of installs)
      if (inst.installPath)
        scan(
          readJson(join(inst.installPath, ".mcp.json"))?.mcpServers,
          (n) => `mcp__plugin_${plugin}_${n}`,
        );
  }
  return [...found];
}

/** Folder trust: in an untrusted folder a frontmatter server does not start, and no dialog says so. */
function trustLine(root: string): string | null {
  let cfg: { projects?: Record<string, { hasTrustDialogAccepted?: boolean }> };
  try {
    cfg = JSON.parse(readFileSync(join(homedir(), ".claude.json"), "utf8")) as typeof cfg;
  } catch {
    return null;
  }
  const keys = Object.entries(cfg.projects ?? {})
    .filter(([, p]) => p?.hasTrustDialogAccepted)
    .map(([k]) => k.replace(/\\/g, "/").replace(/\/+$/, ""));
  const here = root.replace(/\\/g, "/").replace(/\/+$/, "");
  const chain: string[] = [];
  for (let d = here; ;) {
    chain.push(d);
    const up = d.slice(0, d.lastIndexOf("/"));
    if (!up || up === d) break;
    d = up;
  }
  if (chain.some((d) => keys.includes(d))) return null;
  const near = keys.find((k) => chain.some((d) => d.toLowerCase() === k.toLowerCase()));
  if (near) return sw().trustNear(near, here);
  return sw().trustNone(here);
}

/** Whether the machine has a login for the probe satellite; otherwise a probe would only start a login nobody finishes. */
function hasGrant(): boolean {
  if (CFG.pat) return true;
  try {
    if (!existsSync(storePath())) return false;
    const t = loadStore().tokens;
    return Boolean(t?.access_token || t?.refresh_token);
  } catch {
    return false;
  }
}

interface Report {
  f: AgentFile;
  lines: string[];
  probe: Entry | null;
  names: string[];
}

export async function subagentsReport(out: Out): Promise<void> {
  const root = projectRoot();
  const userDir = join(homedir(), ".claude", "agents");
  // doctor is most often called from home: home is not a project, its agents are the user's.
  const atHome = resolve(root) === resolve(homedir());
  const project = atHome ? [] : agentFiles(join(root, ".claude", "agents"), "project");
  const shadowed = new Set(project.map((f) => f.agent));
  const user = agentFiles(userDir, "user");
  const claude = [...project, ...user.filter((f) => !shadowed.has(f.agent))];
  const opencode = [
    ...agentFiles(join(root, ".opencode", "agents"), "project"),
    ...agentFiles(join(root, ".opencode", "agent"), "project"),
  ];
  const osNote = process.env[PLATFORM_ENV] ? sw().osJudged(platform()) : platform();
  out(sw().header(root, osNote));
  if (!claude.length && !opencode.length) {
    const dirs = `${join(root, ".claude", "agents")}, ${userDir}, ${join(root, ".opencode", "agents")}`;
    out(sw().noFiles(dirs));
    return;
  }
  for (const f of user.filter((f) => shadowed.has(f.agent))) out(sw().shadowed(f.path, f.agent));

  const parents = parentBridges(root);
  const required = parents.length ? parents : TEMPLATE_PARENTS;
  const byName = new Map<string, string[]>();
  const reports: Report[] = [];
  for (const f of claude) {
    const lines: string[] = [];
    const expected = `${SUB_ENTRY_PREFIX}-${f.agent}`;
    const entries = entriesOf(f.fm);
    const ours = entries.filter((e) => BRIDGE_RE.test([e.command, ...e.args].join(" ")));
    const sat = ours.filter((e) => formOf(e) !== "session");
    let probeEntry: Entry | null = null;
    // The caller's bridges to remove: the file's former lines plus those found on the machine (or the template).
    const own = sat.map((e) => `mcp__${e.name}`);
    const disallowed = listOf(f.fm.disallowedTools).map((d) => d.replace(/__\*$/, ""));
    // The entry's tool set (`--tools`) rides into the ready block: replacing the form keeps it.
    const block = (name: string, e?: Entry) =>
      sw().withBlock(
        readyEntry(
          name,
          [...new Set([...disallowed, ...required])].filter((p) => p !== `mcp__${name}`),
          e ? toolsTail(e) : [],
        ),
      );
    const canonical = (e: Entry): Entry => ({
      name: sw().proposed(e.name),
      ref: false,
      command: "node",
      args: [...SATELLITE_ARGS, ...toolsTail(e)],
      env: e.env,
    });
    const refs = entries.filter((e) => e.ref && PRODUCT_RE.test(e.name));
    for (const r of refs) lines.push(sw().refEntry(r.name, block(expected)));
    if (!sat.length) {
      if (ours.length)
        lines.push(sw().formEntry(ours[0].name, formWord("session"), block(expected, ours[0])));
      else if (!refs.length) lines.push(sw().noEntry(block(expected)));
    }
    for (const e of sat) {
      byName.set(e.name, [...(byName.get(e.name) ?? []), f.path]);
      if (e.name === SUB_ENTRY_PREFIX) lines.push(sw().sharedName(f.agent));
      // The ready block carries its own name: the former shared name is not repeated in it.
      const name = e.name === SUB_ENTRY_PREFIX ? expected : e.name;
      const form = formOf(e);
      if (form !== "eval") {
        lines.push(sw().replaceEntry(e.name, formWord(form), block(name, e)));
        // Probe the proposed form, if the home bridge it calls exists.
        if (!probeEntry && existsSync(homeBridgePath())) probeEntry = canonical(e);
        continue;
      }
      if (!which(e.command, root)) {
        lines.push(sw().noCommand(e.name, e.command));
        continue;
      }
      const bridge = bridgePathOf(e);
      if (bridge && !existsSync(resolve(root, bridge))) {
        lines.push(sw().noBridge(bridge, homeBridgePath()));
        continue;
      }
      if (!probeEntry) probeEntry = e;
    }
    const need = required.filter((p) => !own.includes(p) && !disallowed.includes(p));
    if (sat.length && (need.length || !disallowed.length)) {
      const fix = [...new Set([...disallowed, ...required])]
        .filter((p) => !own.includes(p))
        .join(", ");
      lines.push(sw().callerBridges(need.join(", "), fix));
    }
    for (const o of own.filter((o) => disallowed.includes(o))) lines.push(sw().ownRemoved(o));
    reports.push({ f, lines, probe: probeEntry, names: sat.map((e) => e.name) });
  }
  for (const [name, files] of byName) {
    if (files.length < 2) continue;
    for (const r of reports.filter((r) => files.includes(r.f.path)))
      r.lines.push(sw().nameShared(name, files.length, files.join(", "), r.f.agent));
  }
  // Without a login a probe would only start a login nobody finishes: it is not run, and how to log in is said.
  const grant = hasGrant();
  let noGrantSaid = false;
  // One command, one probe: the same bridge bytes answer every file alike.
  const probed = new Map<string, { label: string; failed: boolean }>();
  for (const r of reports) {
    // The probe goes before the heading: a file is fine only if its lines and its probe are clean,
    // else the "rerun doctor until no TODO" loop would end on a broken subagent.
    const seen: string[] = [];
    if (r.probe && !grant) {
      r.lines.push(noGrantSaid ? sw().noGrantAgain() : sw().noGrant(loginAdvice()));
      noGrantSaid = true;
    } else if (r.probe) {
      const key = JSON.stringify([r.probe.command, r.probe.args, r.probe.env]);
      const first = probed.get(key);
      if (first) {
        if (first.failed) r.lines.push(sw().sameFailed(first.label));
        else seen.push(sw().sameProbe(first.label));
      } else {
        const res = await probeSatellite(r.probe.name, r.probe, root);
        probed.set(key, { label: r.probe.name, failed: res.findings.length > 0 });
        seen.push(...res.lines);
        r.lines.push(...res.findings);
      }
    }
    const where = r.f.scope === "user" ? sw().userScope() : "";
    const named = r.names.length
      ? sw().named(...(r.names as [string, ...string[]]))
      : sw().unnamed();
    out(`  ${r.f.path}${where}: ${named}${r.lines.length ? "" : sw().fine()}`);
    for (const l of seen) out(`    ${l}`);
    // The ready block goes as lines indented by six spaces: stripped of them, it is pasted into the frontmatter.
    for (const l of r.lines) {
      const [head, ...rest] = l.split("\n");
      out(`    ${todo()} ${head}`);
      for (const b of rest) out(`      ${b}`);
    }
  }
  if (claude.length) {
    const t = trustLine(root);
    if (t && project.length) out(`  ${todo()} ${t}`);
  }
  for (const f of opencode) {
    const keys = Object.keys(f.fm).filter((k) => k === "mcpServers" || k === "mcp");
    const keyNote = keys.length ? sw().ocKeys(keys.join(", ")) : "";
    out(sw().ocAgent(f.path, keyNote));
  }
}
