// An mcp entry of this delivery beside the OpenCode plugin (graph @nks/nks-dev, node
// #5553, class #4283): its tools go namespaced and its bridge is shared by the
// service's sessions. Where the config lies and how it is read — surface #5559.
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

import { isProductionServer } from "../bridge/config.ts";
import { BRIDGE_NAME, HARNESS, type HarnessWords } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import { escapeRe } from "../shared/regex.ts";
import { PRODUCT_PATTERN } from "./installnames.ts";

/** A command part that runs this delivery's bridge: its file or its home copy. */
const BRIDGE_PART_RE = new RegExp(
  `(^|[\\\\/])${PRODUCT_PATTERN}[^\\\\/]*\\.mjs$|${escapeRe(BRIDGE_NAME)}`,
);

const hw = (): HarnessWords => words(HARNESS);

export function openCodeMcpEntries(out: (s: string) => void): void {
  const dirFiles = (d: string): string[] => [
    join(d, "opencode.json"),
    join(d, "opencode.jsonc"),
    join(d, ".opencode", "opencode.json"),
    join(d, ".opencode", "opencode.jsonc"),
  ];
  const upwards: string[] = [];
  // With the project layer disabled OpenCode reads no tree files, so they are not advised on.
  if (!process.env.OPENCODE_CONFIG_PROJECT_DISABLE)
    for (let d = process.cwd(); ;) {
      upwards.push(...dirFiles(d));
      const up = dirname(d);
      if (up === d) break;
      d = up;
    }
  // These variables showed no effect on `opencode mcp list` (#5559): read anyway, on the
  // safe side — an extra line is cheaper than silence about an entry the service takes.
  const files = [
    ...(process.env.OPENCODE_CONFIG ? [process.env.OPENCODE_CONFIG] : []),
    // Whether this directory belongs to the switchable project layer was not observed (#5559).
    ...(process.env.OPENCODE_CONFIG_DIR ? dirFiles(process.env.OPENCODE_CONFIG_DIR) : []),
    ...dirFiles(join(homedir(), ".config", "opencode")),
    ...upwards,
  ];
  // Two kinds of own entry: a local bridge of this delivery (namespaced tools, a bridge
  // shared by the service's sessions) and a native http entry on the production address
  // (around the bridge, no standing). A foreign server under a path with the product name is not ours.
  const kindOf = (v: unknown): "bridge" | "http" | null => {
    const e = (v ?? {}) as { command?: string | string[]; args?: string[]; url?: string };
    const parts = [
      ...(Array.isArray(e.command) ? e.command : e.command ? [e.command] : []),
      ...(e.args ?? []),
    ];
    if (parts.some((p) => BRIDGE_PART_RE.test(String(p)))) return "bridge";
    // Exactly two production addresses (#5040), decided by the shared predicate.
    if (e.url && isProductionServer(e.url)) return "http";
    return null;
  };
  // .jsonc allows comments and trailing commas. Two passes, both sparing string literals:
  // comments first, then a comma before a closing bracket — in one pass a comma separated
  // from the bracket by a comment would stay.
  const parse = (text: string): { mcp?: Record<string, unknown> } => {
    const STRING = '"(?:[^"\\\\]|\\\\.)*"';
    const noComments = text.replace(
      new RegExp(`${STRING}|/\\*[\\s\\S]*?\\*/|//[^\\n]*`, "g"),
      (m) => (m.startsWith('"') ? m : ""),
    );
    const noTrailing = noComments.replace(
      new RegExp(`${STRING}|,(\\s*[}\\]])`, "g"),
      (m, tail: string | undefined) => (m.startsWith('"') ? m : (tail ?? "")),
    );
    return JSON.parse(noTrailing) as { mcp?: Record<string, unknown> };
  };
  // The path that made the entry count as the bridge, so the reader can check: the match is by file name.
  const bridgePath = (v: unknown): string => {
    const e = (v ?? {}) as { command?: string | string[]; args?: string[] };
    const parts = [
      ...(Array.isArray(e.command) ? e.command : e.command ? [e.command] : []),
      ...(e.args ?? []),
    ].map(String);
    return parts.find((p) => BRIDGE_PART_RE.test(p)) ?? parts.join(" ");
  };
  let unreadable = 0;
  const sources: [string, string][] = [];
  for (const f of new Set(files)) {
    if (!existsSync(f)) continue;
    // An unreadable file on the way up must not drop the whole report.
    try {
      sources.push([f, readFileSync(f, "utf8")]);
    } catch {
      unreadable++;
      out(hw().ocUnreadable(f));
    }
  }
  if (process.env.OPENCODE_CONFIG_CONTENT)
    sources.unshift(["OPENCODE_CONFIG_CONTENT", process.env.OPENCODE_CONFIG_CONTENT]);
  let found = 0;
  for (const [file, text] of sources) {
    try {
      const cfg = parse(text);
      for (const [name, v] of Object.entries(cfg.mcp ?? {})) {
        const kind = kindOf(v);
        if (!kind) continue;
        found++;
        if ((v as { enabled?: boolean }).enabled === false) {
          out(hw().ocDisabled(name, file));
          continue;
        }
        out(kind === "bridge" ? hw().ocBridge(name, file, bridgePath(v)) : hw().ocHttp(name, file));
      }
    } catch {
      unreadable++;
      out(hw().ocUnreadable(file));
    }
  }
  // No clean report without a named reach: doctor walks up from ITS directory, so an
  // entry in another project tree was not seen (graph @nks/nks-dev, node #4279).
  if (!found) out(hw().ocNone(unreadable, process.cwd()));
}
