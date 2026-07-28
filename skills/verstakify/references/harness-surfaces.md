# Harness surfaces — where the rituals actually land

verstakify delivers **rituals** (orient at session start, push → update NKS,
memory stays out of local stores). Each harness fires them differently, and the
file paths are not interchangeable. Wire the surfaces of the harness in use;
never write a config for a format you're guessing.

| Harness | Reads | Pointer file needed | Automation surface |
|---|---|---|---|
| Claude Code | `CLAUDE.md` | **yes** — `CLAUDE.md` = `@AGENTS.md` | `.claude/settings.json` hooks |
| Codex CLI | `AGENTS.md` | no | `[hooks]` in `config.toml` |
| OpenCode | `AGENTS.md` | no | plugins in `.opencode/plugins/` |

Detect before choosing: `.claude/` or the plugin cache → Claude Code;
`opencode.json` / `.opencode/` → OpenCode; `.codex/` or `~/.codex/` → Codex. More
than one may be true — wire each present harness; the `AGENTS.md` body is shared.

## Claude Code

Reads `CLAUDE.md`, not `AGENTS.md` — hence the one-line pointer (`@AGENTS.md`
import; Step 7). Hooks live in `.claude/settings.json`, committed. Subagent role
files: `.claude/agents/` (see `delegation.md`). Hook JSON, events and the
memory-guard command are spelled out in Step 4 of the skill.

## Codex CLI

**Reads `AGENTS.md` natively — do not create a pointer file.** Discovery walks
from the project root down to the cwd and merges every `AGENTS.md` found, on top
of the user-global `~/.codex/AGENTS.md`. `AGENTS.override.md` is the local
override, taking precedence over `AGENTS.md` in the same directory — the natural
home for machine-local notes, and it must not be committed.

Hooks are declared under `[hooks]` in `config.toml` (project config, with
user-level overrides), as arrays of tables — a matcher group, then its commands:

```toml
[[PreToolUse]]
matcher = "^Bash$"

[[PreToolUse.hooks]]
type = "command"
command = "bash ./scripts/guard.sh"
command_windows = "powershell -File .\\scripts\\guard.ps1"
timeout = 10
statusMessage = "checking"
```

Events: `SessionStart`, `UserPromptSubmit`, `PreToolUse`, `PostToolUse`,
`PermissionRequest`, `PreCompact`, `PostCompact`, `SubagentStart`,
`SubagentStop`, `Stop`. Each command gets JSON on stdin carrying `session_id`,
`turn_id`, `transcript_path`, `cwd`, `hook_event_name`, `model`.

`SessionStart` also carries a **source** — `startup`, `resume`, `clear`,
`compact` — and the source is what `matcher` matches against. Orient-on-start
usually wants `startup` and `resume` only; matching all four re-fires the ritual
after every compaction.

Ritual mapping: orient → `SessionStart`; memory guard → `PreToolUse` matched on
the write tool; push → NKS → `PostToolUse` matched on the shell tool.

## OpenCode

**Reads `AGENTS.md` natively — no pointer file.** Additional rule files are
listed in `instructions` in `opencode.json` (project) or
`~/.config/opencode/opencode.json` (global), globs allowed — use it to reuse
existing rule files instead of copying them into `AGENTS.md`.

There is no hooks file. The equivalent is a **plugin**: a JS/TS file in
`.opencode/plugins/` (project) or `~/.config/opencode/plugins/` (global),
auto-loaded at startup. A plugin exports an async function returning handlers:

```js
export const MemoryGuard = async ({ project, client, $, directory, worktree }) => {
  return {
    "tool.execute.before": async (input, output) => {
      // throwing blocks the call — this is the guard mechanism
      if (input.tool === "write" && isLocalMemoryPath(output.args.filePath))
        throw new Error("local agent memory is forbidden for project state")
    },
    event: async ({ event }) => {
      if (event.type === "session.created") { /* orient reminder */ }
    },
  }
}
```

`tool.execute.before` / `tool.execute.after` wrap tool calls — **throwing from
`before` is how a guard blocks**, so the memory guard is a throw, not an exit
code. Everything else arrives through `event`, including `session.created`,
`session.idle`, `session.compacted`, `file.edited`, `permission.asked`.

Ritual mapping: orient → `event` on `session.created`; memory guard →
`tool.execute.before` with a throw; push → NKS → `tool.execute.after` on the
shell tool. Subagent role files: `.opencode/agents/` (see `delegation.md`).

## Re-verify checklist (maintainers)

Re-check on harness upgrades, like the interop reference:

- **Claude Code** — settings path, hook event names, `CLAUDE.md` import syntax.
- **Codex** — the `[hooks]` event list and TOML shape, `SessionStart` sources,
  the `AGENTS.md` / `AGENTS.override.md` filenames and their merge order.
- **OpenCode** — plugin directory names (`.opencode/plugins/`), the event list,
  whether `tool.execute.before` still blocks by throwing.
- A harness that gains or loses a surface changes what verstakify can promise —
  update the table first, then Step 4.
