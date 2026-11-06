// The hooks of `prepare` (graph @nks/nks-dev, node #9319): the memory guard merged into the
// repository's .claude/settings.json beside every other entry. Start, push and merge are carried
// by the delivery's own hooks (section RITUALS) and never written here; a repository holding
// such a hook of its own in any form (hookkinds.ts) has it named to the model — the transition
// takes it off, until then the delivery keeps silent on that kind. A guard prepare wrote that
// differs from the current text — other addresses, the words of an earlier delivery — is stale
// and rewritten in place; a guard of the person's own, inline or not, is kept. A script prepare cannot read as a guard holds its own back and is named to the model.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { PREPARE, type PrepareAddr, type PrepareLeft } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import {
  cmd,
  type Entry,
  hooksOf,
  KNOWN,
  knownOf,
  type RiteKind,
  type Settings,
} from "./hookkinds.ts";
import { opaque } from "./preparescripts.ts";

// The guard of references/hooks.md byte for byte around its message: a probe holds them equal.
const GUARD_HEAD =
  'p=$(jq -r \'(.tool_input.file_path // .tool_input.notebook_path // "") | split([92] | implode) | join("/")\'); [ -n "$p" ] || exit 0; case "$p" in /*) ;; *) p="$PWD/$p" ;; esac; m=$(cd -P "$HOME/.claude/projects" 2>/dev/null && pwd -P | tr \'[:upper:]\' \'[:lower:]\'); mem() { k=$(printf \'%s\' "$1" | tr \'[:upper:]\' \'[:lower:]\'); case "$k" in */.claude/projects/*/memory|*/.claude/projects/*/memory/*) return 0 ;; esac; [ -n "$m" ] && case "$k" in "$m"/*/memory|"$m"/*/memory/*) true ;; *) false ;; esac; }; r=; s=$p; n=0; x=0; while [ -n "$s" ]; do c=${s%%/*}; s=${s#"$c"}; s=${s#/}; case "$c" in \'\'|.) continue ;; ..) r=${r%/*}; continue ;; esac; if [ -L "$r/$c" ]; then n=$((n+1)); l=$(readlink "$r/$c"); if [ $n -gt 40 ] || [ -z "$l" ] || mem "$r/$c"; then x=1; break; fi; case "$l" in /*) r= ;; esac; s=$l/$s; else r=$r/$c; fi; done; { [ $x = 1 ] || mem "$p" || mem "$r"; } && { ';
const GUARD_TAIL = " >&2; exit 2; } || exit 0";
const GUARD_MATCHER = "Write|Edit|MultiEdit|NotebookEdit";

/** Text inside a single-quoted shell word. */
const quoted = (t: string): string => `'${t.replace(/'/g, "'\\''")}'`;

const guardCommand = (graph: string): string =>
  `${GUARD_HEAD}echo ${quoted(words(PREPARE).guard(graph))}${GUARD_TAIL}`;

/** Whether prepare wrote a command: the guard's head and tail around one quoted message, any words. */
const written = (c: string): boolean => {
  const head = `${GUARD_HEAD}echo '`;
  const tail = `'${GUARD_TAIL}`;
  if (!c.startsWith(head) || !c.endsWith(tail) || c.length < head.length + tail.length)
    return false;
  return /^(?:[^']|'\\'')*$/.test(c.slice(head.length, c.length - tail.length));
};

/** The kinds the delivery carries: a repository's own one is named for the transition. */
const CARRIED: RiteKind[] = ["hook.start", "hook.push", "hook.merge"];

export interface Outcome {
  done: string[];
  kept: string[];
  left: PrepareLeft[];
  /** The cover's keys named twice, for cover.repeat. */
  repeated?: string[];
  /** The rituals the cover names that the delivery has not, for cover.rituals. */
  rituals?: string[];
  /** The standing hook prepare could not read as its kind, by the item held back for it. */
  named?: Partial<Record<PrepareLeft, string>>;
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

/**
 * The guard where it is missing or stale; addr null — no graph, none is written. Stale — a guard
 * prepare wrote whose text is not the current one: an earlier address or earlier words. Any other
 * guard — inline of the person's own or carried by a repository script — is the repository's: kept.
 */
function guard(root: string, s: Settings, addr: PrepareAddr | null, out: Outcome): boolean {
  const k = KNOWN["hook.guard"];
  const command = addr ? guardCommand(addr.graph) : undefined;
  const known = knownOf(root, s, "hook.guard");
  const stale = known.filter((h) => h.command !== command && written(cmd(h)));
  const unread = hooksOf(s, k.event, k.on).find((h) => opaque(root, cmd(h)));
  if (command && stale.length && !known.some((h) => h.command === command)) {
    for (const h of stale) h.command = command;
  } else if (known.length) {
    out.kept.push("hook.guard");
    return false;
  } else if (unread || !command) {
    out.left.push("hook.guard");
    if (unread) (out.named ??= {})["hook.guard"] = cmd(unread);
    return false;
  } else {
    const entry: Entry = { matcher: GUARD_MATCHER, hooks: [{ type: "command", command }] };
    s.hooks = s.hooks ?? {};
    (s.hooks[k.event] = s.hooks[k.event] ?? []).push(entry);
  }
  out.done.push("hook.guard");
  return true;
}

/**
 * Merge the guard, name the repository's own carried hooks. Unparsable — its path. A ritual the
 * cover switches off is neither written nor named: the delivery keeps silent on it anyway.
 */
export function prepareHooks(
  root: string,
  addr: PrepareAddr | null,
  out: Outcome,
  on: ReadonlySet<string>,
): string | null {
  const dir = join(root, ".claude");
  const path = join(dir, "settings.json");
  const s = load(path);
  if (!s) return path;
  const changed = on.has("guard") && guard(root, s, addr, out);
  const carried = CARRIED.filter((kind) => on.has(kind.slice("hook.".length)));
  for (const kind of carried) if (knownOf(root, s, kind).length) out.left.push(kind);
  // A start script prepare cannot read may be the repository's start hook: named for reading.
  const start = KNOWN["hook.start"];
  const unread = hooksOf(s, start.event, start.on).find((h) => opaque(root, cmd(h)));
  if (on.has("start") && !out.left.includes("hook.start") && unread) {
    out.left.push("hook.start");
    (out.named ??= {})["hook.start"] = cmd(unread);
  }
  if (changed) {
    mkdirSync(dir, { recursive: true });
    writeFileSync(path, `${JSON.stringify(s, null, 2)}\n`);
  }
  return null;
}
