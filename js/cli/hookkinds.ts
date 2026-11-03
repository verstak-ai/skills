// The ritual hooks a repository's Claude Code settings carry of its own (graph @nks/nks-dev,
// node #9319, section RITUALS): each kind known in any form — inline or a script (#9331). The
// delivery's hooks keep silent on a kind the repository holds itself, and prepare names it for
// the transition; the settings file and its local twin are both read.
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { type PrepareLeft, PRODUCT } from "../delivery/index.ts";
import { knownHook, runsOn } from "./preparescripts.ts";

export type RiteKind = Extract<
  PrepareLeft,
  "hook.start" | "hook.guard" | "hook.push" | "hook.merge"
>;

export interface Hook {
  type?: string;
  command?: string;
}
export interface Entry {
  matcher?: string;
  hooks?: Hook[];
}
export type Settings = { hooks?: Record<string, Entry[]> } & Record<string, unknown>;

type On = (matcher?: string) => boolean;

/** Whether an entry's matcher runs on this target: a session's source or a tool's name. */
const covers = (m: string | undefined, target: string): boolean =>
  !m || m === "*" || runsOn(m, target);
const onAny =
  (...targets: string[]): On =>
  (m) =>
    targets.some((t) => covers(m, t));

/**
 * Each kind: its event, how a command of it is known, the matchers it is held on — where the
 * delivery speaks (hooks/hooks.json): start on startup, resume and clear, push and merge on Bash.
 */
export const KNOWN: Record<RiteKind, { event: string; known: (c: string) => boolean; on: On }> = {
  "hook.start": {
    event: "SessionStart",
    known: (c) => c.toLowerCase().includes(PRODUCT),
    on: onAny("startup", "resume", "clear"),
  },
  "hook.guard": {
    event: "PreToolUse",
    known: (c) => /\.claude\W{0,4}projects/.test(c) && /memory/i.test(c),
    on: (m) => ["Write", "Edit"].every((t) => covers(m, t)),
  },
  "hook.push": {
    event: "PostToolUse",
    known: (c) => c.includes("git(?: -C [^ ]+)* push"),
    on: onAny("Bash"),
  },
  "hook.merge": {
    event: "PostToolUse",
    known: (c) => c.includes("gh pr merge"),
    on: onAny("Bash"),
  },
};

export const hooksOf = (s: Settings, event: string, on: On = () => true): Hook[] =>
  (s.hooks?.[event] ?? []).filter((e) => on(e.matcher)).flatMap((e) => e.hooks ?? []);
export const cmd = (h: Hook): string => h.command ?? "";

/** The hooks of this kind that read as it, inline or by their script; target — on it alone. */
export const knownOf = (root: string, s: Settings, kind: RiteKind, target?: string): Hook[] => {
  const k = KNOWN[kind];
  const on = target === undefined ? k.on : onAny(target);
  return hooksOf(s, k.event, on).filter((h) => knownHook(root, cmd(h), k.known));
};

function read(path: string): Settings {
  try {
    const s: unknown = JSON.parse(readFileSync(path, "utf8"));
    return s && typeof s === "object" && !Array.isArray(s) ? (s as Settings) : {};
  } catch {
    return {};
  }
}

/** The ritual kinds the repository's own settings hold on this target (source or tool name). */
export function standingRites(root: string, target: string): Set<RiteKind> {
  const files = ["settings.json", "settings.local.json"].map((f) => read(join(root, ".claude", f)));
  const kinds = Object.keys(KNOWN) as RiteKind[];
  return new Set(kinds.filter((k) => files.some((s) => knownOf(root, s, k, target).length > 0)));
}
