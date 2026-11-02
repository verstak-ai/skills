// The hooks of `prepare` (graph @nks/nks-dev, node #9319): the start reminder and the memory
// guard merged into the repository's .claude/settings.json beside every other entry. A hook of
// the same kind written by a model is kept as it stands; one written by a run of prepare for
// other addresses is rewritten in place; push and merge are only recognized: their filters stay
// with the bootstrap (references/hooks.md).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { PREPARE, type PrepareAddr, type PrepareLeft, PRODUCT } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";

// The guard of references/hooks.md byte for byte around its message: a probe holds them equal.
const GUARD_HEAD =
  'p=$(jq -r \'(.tool_input.file_path // .tool_input.notebook_path // "") | split([92] | implode) | join("/")\'); [ -n "$p" ] || exit 0; case "$p" in /*) ;; *) p="$PWD/$p" ;; esac; m=$(cd -P "$HOME/.claude/projects" 2>/dev/null && pwd -P | tr \'[:upper:]\' \'[:lower:]\'); mem() { k=$(printf \'%s\' "$1" | tr \'[:upper:]\' \'[:lower:]\'); case "$k" in */.claude/projects/*/memory|*/.claude/projects/*/memory/*) return 0 ;; esac; [ -n "$m" ] && case "$k" in "$m"/*/memory|"$m"/*/memory/*) true ;; *) false ;; esac; }; r=; s=$p; n=0; x=0; while [ -n "$s" ]; do c=${s%%/*}; s=${s#"$c"}; s=${s#/}; case "$c" in \'\'|.) continue ;; ..) r=${r%/*}; continue ;; esac; if [ -L "$r/$c" ]; then n=$((n+1)); l=$(readlink "$r/$c"); if [ $n -gt 40 ] || [ -z "$l" ] || mem "$r/$c"; then x=1; break; fi; case "$l" in /*) r= ;; esac; s=$l/$s; else r=$r/$c; fi; done; { [ $x = 1 ] || mem "$p" || mem "$r"; } && { ';
const GUARD_TAIL = " >&2; exit 2; } || exit 0";
const GUARD_MATCHER = "Write|Edit|MultiEdit|NotebookEdit";

/** Text inside a single-quoted shell word. */
const quoted = (t: string): string => `'${t.replace(/'/g, "'\\''")}'`;

const startCommand = (a: PrepareAddr): string =>
  `echo ${quoted(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "SessionStart",
        additionalContext: words(PREPARE).start(a),
      },
    }),
  )}`;

const guardCommand = (graph: string): string =>
  `${GUARD_HEAD}echo ${quoted(words(PREPARE).guard(graph))}${GUARD_TAIL}`;

interface Hook {
  type?: string;
  command?: string;
}
interface Entry {
  matcher?: string;
  hooks?: Hook[];
}
type Settings = { hooks?: Record<string, Entry[]> } & Record<string, unknown>;

const hooksOf = (s: Settings, event: string): Hook[] =>
  (s.hooks?.[event] ?? []).flatMap((e) => e.hooks ?? []);

/** Whether a command is the one written for some address: each slot of the builder any address. */
const SLOT = "§";
const written = (c: string, build: (slot: string) => string): boolean =>
  new RegExp(
    `^${build(SLOT)
      .split(SLOT)
      .map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("[\\w./@-]*")}$`,
  ).test(c);

/**
 * Each hook kind: its event, how an entry of it is known, which known one prepare wrote, and the
 * entry to add — null while the cover lacks what it names.
 */
const KINDS: {
  item: PrepareLeft;
  event: string;
  known: (c: string) => boolean;
  ours?: (c: string) => boolean;
  make?: (a: PrepareAddr) => Entry | null;
}[] = [
  {
    item: "hook.start",
    event: "SessionStart",
    known: (c) => c.toLowerCase().includes(PRODUCT),
    ours: (c) => written(c, (s) => startCommand({ graph: s, holon: s, role: s })),
    make: (a) =>
      a.holon && a.role ? { hooks: [{ type: "command", command: startCommand(a) }] } : null,
  },
  {
    item: "hook.guard",
    event: "PreToolUse",
    known: (c) => c.includes(".claude/projects") && c.includes("memory"),
    ours: (c) => written(c, guardCommand),
    make: (a) => ({
      matcher: GUARD_MATCHER,
      hooks: [{ type: "command", command: guardCommand(a.graph) }],
    }),
  },
  { item: "hook.push", event: "PostToolUse", known: (c) => c.includes("git(?: -C [^ ]+)* push") },
  { item: "hook.merge", event: "PostToolUse", known: (c) => c.includes("gh pr merge") },
];

export interface Outcome {
  done: string[];
  kept: string[];
  left: PrepareLeft[];
  /** The cover's keys named twice, for cover.repeat. */
  repeated?: string[];
}

/** The settings file parsed, an empty one when absent; null — it does not parse. */
function load(path: string): Settings | null {
  if (!existsSync(path)) return {};
  try {
    const s: unknown = JSON.parse(readFileSync(path, "utf8"));
    return s && typeof s === "object" && !Array.isArray(s) ? (s as Settings) : null;
  } catch {
    return null;
  }
}

/** Merge the hooks; addr null — the cover has no graph, nothing is added. Unparsable — its path. */
export function prepareHooks(root: string, addr: PrepareAddr | null, out: Outcome): string | null {
  const dir = join(root, ".claude");
  const path = join(dir, "settings.json");
  const s = load(path);
  if (!s) return path;
  let changed = false;
  for (const k of KINDS) {
    const entry = addr && k.make?.(addr);
    const command = entry ? entry.hooks?.[0]?.command : undefined;
    const known = hooksOf(s, k.event).filter((h) => k.known(h.command ?? ""));
    const stale = known.filter((h) => h.command !== command && k.ours?.(h.command ?? ""));
    if (command && stale.length && !known.some((h) => h.command === command)) {
      for (const h of stale) h.command = command;
      out.done.push(k.item);
      changed = true;
    } else if (known.length) out.kept.push(k.item);
    else if (!entry) out.left.push(k.item);
    else {
      s.hooks = s.hooks ?? {};
      (s.hooks[k.event] = s.hooks[k.event] ?? []).push(entry);
      out.done.push(k.item);
      changed = true;
    }
  }
  if (changed) {
    mkdirSync(dir, { recursive: true });
    writeFileSync(path, `${JSON.stringify(s, null, 2)}\n`);
  }
  return null;
}
