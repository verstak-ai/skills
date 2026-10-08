// The satellite bridge entry form in an agent file, one for every OS: `node -e` builds
// the home bridge path from os.homedir(), with no shell and no machine path in the file
// (Claude Code does not expand variables in frontmatter args; Windows has no sh). `--`
// separates the bridge flags from node's, and splice puts the bridge path into argv[1],
// else the bridge misses `--satellite` in process.argv.slice(2) and stands as a session
// bridge. Verified live on macOS only (REALITY.md). The reference code is SATELLITE_CODE.
import { homedir } from "node:os";
import { basename } from "node:path";

import { HOME_DIR, SATELLITE_CODE } from "../delivery/index.ts";
import { homeBridgePath } from "../shared/home.ts";
import { escapeRe } from "../shared/regex.ts";
import { PRODUCT_PATTERN } from "./installnames.ts";

export const SATELLITE_ARGS = ["-e", SATELLITE_CODE, "--", "--satellite"];

export interface SatEntry {
  command: string;
  args: string[];
}

/**
 * Entry form kind: `eval` is the working `node -e`; the others are breakages or forms
 * the single form replaces.
 *  - eval-no-sep: `--satellite` without `--`, node takes it for its own flag;
 *  - eval-session: the bridge misses `--satellite` in its argv and stands as a session bridge;
 *  - eval-other: `node -e` with code other than the reference, not verified live;
 *  - shell: `sh -c` of the former contract, Windows has no sh;
 *  - path: the bridge path straight in args, a machine path in a shared file;
 *  - session: no `--satellite` at all.
 */
export type SatForm =
  "eval" | "eval-no-sep" | "eval-session" | "eval-other" | "shell" | "path" | "session";

const SHELLS = new Set(["sh", "bash", "zsh", "dash"]);
const cmdBase = (c: string): string =>
  basename(c.replace(/\\/g, "/"))
    .replace(/\.exe$/i, "")
    .toLowerCase();

/** A tool list by the bridge's rule (bridge/config.ts, parseArgs): comma-separated, trimmed, empty parts ignored. */
const isToolList = (v: string | undefined): v is string =>
  !!v && v.split(",").some((s) => s.trim().length > 0);

/** The bridge flag tail after `--satellite` that the ready block carries over: `--tools a,b,c`, from any form. */
export function toolsTail(e: SatEntry): string[] {
  const words = SHELLS.has(cmdBase(e.command))
    ? (e.args[e.args.indexOf("-c") + 1] ?? "")
        .split(/\s+/)
        .map((w) => w.replace(/^["']|["']$/g, ""))
    : e.args;
  const at = words.indexOf("--tools");
  const v = at >= 0 ? words[at + 1] : undefined;
  return isToolList(v) ? ["--tools", v] : [];
}

export function formOf(e: SatEntry): SatForm {
  const base = cmdBase(e.command);
  if (base === "node" && (e.args[0] === "-e" || e.args[0] === "--eval")) {
    const sep = e.args.indexOf("--", 2);
    if (sep < 0) return e.args.slice(2).includes("--satellite") ? "eval-no-sep" : "session";
    const after = e.args.slice(sep + 1);
    const spliced = /process\.argv\.splice\(\s*1\s*,\s*0\s*,/.test(e.args[1] ?? "");
    // Without splice process.argv = [node, ...after], and slice(2) loses the first bridge flag.
    if (!(spliced ? after : after.slice(1)).includes("--satellite")) return "eval-session";
    // Only the reference form counts as working. After --satellite: nothing or `--tools a,b,c` (bridge/narrow.ts).
    const tail = after.slice(1);
    const known =
      !tail.length || (tail.length === 2 && tail[0] === "--tools" && isToolList(tail[1]));
    return e.args[1] === SATELLITE_CODE && after[0] === "--satellite" && known
      ? "eval"
      : "eval-other";
  }
  if (SHELLS.has(base)) {
    const s = e.args[e.args.indexOf("-c") + 1] ?? "";
    return s.includes("--satellite") ? "shell" : "session";
  }
  return e.args.includes("--satellite") ? "path" : "session";
}

const P = PRODUCT_PATTERN;
const HOME_DIR_RE = new RegExp(escapeRe(HOME_DIR));
const EVAL_PATH_RE = new RegExp(`['"\`]([^'"\`]*${P}[^'"\`]*\\.mjs)['"\`]`);
const SHELL_PATH_RE = new RegExp(
  `"([^"]*${P}[^"]*\\.mjs)"|'([^']*${P}[^']*\\.mjs)'|(\\S*${P}\\S*\\.mjs)`,
);
const ARG_PATH_RE = new RegExp(`${P}[^\\\\/]*\\.mjs$`, "i");

const expandHome = (p: string): string =>
  p
    .replace(/^~(?=[\\/])/, homedir())
    .replace(/\$\{HOME\}|\$HOME|%USERPROFILE%|\$\{USERPROFILE\}|\$USERPROFILE/g, homedir());

/** The bridge path the entry will run, parsed from args as an array: a home with a space stays whole. */
export function bridgePathOf(e: SatEntry): string | null {
  const base = cmdBase(e.command);
  if (base === "node" && (e.args[0] === "-e" || e.args[0] === "--eval")) {
    const code = e.args[1] ?? "";
    if (/homedir\(\)/.test(code) && HOME_DIR_RE.test(code)) return homeBridgePath();
    const m = EVAL_PATH_RE.exec(code);
    return m ? expandHome(m[1]) : null;
  }
  if (SHELLS.has(base)) {
    const s = e.args[e.args.indexOf("-c") + 1] ?? "";
    const m = SHELL_PATH_RE.exec(s);
    const raw = m?.[1] ?? m?.[2] ?? m?.[3];
    return raw ? expandHome(raw) : null;
  }
  const arg = [e.command, ...e.args].find((a) => ARG_PATH_RE.test(a));
  return arg ? expandHome(arg) : null;
}

/**
 * The ready entry block in YAML block form, as the projection writes and doctor reads:
 * pasted instead of the former mcpServers and disallowedTools, it gives no TODO line on rerun.
 */
export function readyEntry(name: string, disallowed: string[], tail: string[] = []): string {
  return [
    "mcpServers:",
    `  - ${name}:`,
    "      type: stdio",
    "      command: node",
    `      args: [${[...SATELLITE_ARGS, ...tail].map((a) => JSON.stringify(a)).join(", ")}]`,
    `disallowedTools: ${disallowed.join(", ")}`,
  ].join("\n");
}
