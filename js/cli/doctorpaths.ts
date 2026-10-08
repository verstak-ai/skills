// A second path to the same server beside the bridge (graph @nks/nks-dev, node #6728):
// an http entry in a harness config is a TODO line; a claude.ai connector is seen only
// in the connection history, which outlives removal, so it is a line without TODO.
// OpenCode entries are reported by opencode-config.ts.
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

import { CONNECTOR_PATTERN, HARNESS, type HarnessWords } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import { graphServer, projectRoot } from "./subagents.ts";

type Out = (s: string) => void;

const hw = (): HarnessWords => words(HARNESS);

const readJson = (p: string): Record<string, unknown> | null => {
  try {
    return JSON.parse(readFileSync(p, "utf8")) as Record<string, unknown>;
  } catch {
    return null;
  }
};

const httpEntries = (servers: unknown): [string, string][] =>
  Object.entries((servers ?? {}) as Record<string, { url?: unknown }>)
    .filter(([, v]) => typeof v?.url === "string" && graphServer(v.url))
    .map(([n, v]) => [n, String(v.url)]);

const say = (out: Out, where: string, name: string, url: string, remove: string): void =>
  out(hw().secondPath(where, name, url, remove));

// A claude.ai connector has no address on disk, only the name it was connected under.
const CONNECTOR_RE = CONNECTOR_PATTERN;

function claudeCode(out: Out): void {
  const file = join(homedir(), ".claude.json");
  const cfg = readJson(file);
  if (!cfg) return;
  for (const [n, url] of httpEntries(cfg.mcpServers))
    say(out, `Claude Code (${file})`, n, url, `claude mcp remove "${n}" --scope user`);
  const projects = (cfg.projects ?? {}) as Record<string, { mcpServers?: unknown }>;
  for (const [dir, p] of Object.entries(projects))
    for (const [n, url] of httpEntries(p?.mcpServers))
      say(
        out,
        `Claude Code (${file}, ${dir})`,
        n,
        url,
        `cd "${dir}" && claude mcp remove "${n}" --scope local`,
      );
  const mcp = join(projectRoot(), ".mcp.json");
  for (const [n, url] of httpEntries(readJson(mcp)?.mcpServers))
    say(out, `Claude Code (${mcp})`, n, url, hw().deleteFrom(mcp));
  const ever = Array.isArray(cfg.claudeAiMcpEverConnected) ? cfg.claudeAiMcpEverConnected : [];
  for (const c of ever.map(String).filter((c) => CONNECTOR_RE.test(c)))
    out(hw().connector(c, file));
}

/** `[mcp_servers.<name>]` with `url = "…"` in a Codex config.toml, without a full TOML parse. */
function codexHttp(text: string): [string, string][] {
  const found: [string, string][] = [];
  let section: string | null = null;
  for (const line of text.split("\n")) {
    const head = /^\s*\[mcp_servers\.(?:"([^"]+)"|([^\]\s.]+))\]\s*$/.exec(line);
    if (head) section = head[1] ?? head[2] ?? null;
    else if (/^\s*\[/.test(line)) section = null;
    const url = /^\s*url\s*=\s*"([^"]+)"/.exec(line)?.[1];
    if (section && url && graphServer(url)) found.push([section, url]);
  }
  return found;
}

export function secondPathReport(out: Out, codexHomes: string[]): void {
  claudeCode(out);
  for (const home of codexHomes) {
    const file = join(home, "config.toml");
    if (!existsSync(file)) continue;
    let text: string;
    try {
      text = readFileSync(file, "utf8");
    } catch {
      continue;
    }
    for (const [n, url] of codexHttp(text))
      say(out, `Codex (${file})`, n, url, `codex mcp remove "${n}"`);
  }
}
