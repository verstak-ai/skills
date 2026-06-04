---
name: verstakify
description: "Use this skill when the user asks to verstakify a repo, bootstrap or refresh its AGENTS.md / CLAUDE.md to the verstak standard, apply the NKS methodology conventions to a project, or wire the session-lifecycle rituals (orient-in-NKS on start, push→update-NKS hooks, quality gate, permissions allow-list, CLAUDE.md symlink). Triggers: \"verstakify\", \"verstakify this repo\", \"привести проект к стандарту\", \"завести/обновить AGENTS.md\", \"set up AGENTS.md\", \"bootstrap AGENTS\", \"apply the meta template\", \"наведи порядок в конфиге агента\". Default path is an EXISTING repo — read its current CLAUDE.md/AGENTS.md and bring it to standard idempotently, fixing only what fails; fresh repos ask the user for the slots. Needs the nks_* MCP tools for the NKS steps."
---

# Verstakify

Bring the **current repo** to the verstak agent standard: a dense, AI-first
`AGENTS.md` (read every session, not by a human once) + a `CLAUDE.md` symlink,
the NKS session rituals wired as hooks, and a quality gate. You **generate** the
config from the skeleton — nothing is copied by hand and the user pastes no
template.

The body skeleton lives in `references/agents-template.md` (relative to this
skill). Read it; it is the set of `##` sections your finished `AGENTS.md` must
have, with `<…>` slots and a few `<!-- … -->` notes. Fill the slots, drop
optional rows/sections that don't apply, strip every `<!-- … -->` note, never
leave an angle bracket. The skeleton is *what to produce*; this file is *how*.

The skeleton deliberately *inlines* repo-agnostic agent-discipline (Working
principles, parts of Session lifecycle) into every generated `AGENTS.md` so the
file stands alone for agents with no NKS access. Keep it inline — don't replace
it with a pointer to the methodology realm even though it duplicates content
there. (Whether invariant discipline should instead live once in methodology
with a pointer is a deliberate open trade-off, tracked as a samshaya in nks-dev.)

## Two scenarios — detect first

Look for an existing `AGENTS.md`, `CLAUDE.md`, or `.claude/` before doing
anything.

- **Existing repo (the common path).** Some config already exists. Read it in
  full + skim the repo (stack, scripts, CI, `.gitignore`). **Idempotent:** run
  each Step's self-check against current state, fix only what fails, preserve
  every project-specific line — fold it into the matching skeleton section,
  never blow it away. Report what was already fine vs what you changed.
- **Fresh repo.** Little or no config. Walk Step 1 with the user — don't
  silently pick defaults for nature / realm / stack / quality gate.

## The output contract — the whole point

The produced `AGENTS.md` is a config the agent reads *every session*, not a
document a human reads once. Write it that way:
1. **Imperative, addressed to the agent.** "Orient before coding," not "the
   agent should orient."
2. **Density rule.** Every line must change what the agent *does*. If deleting a
   line wouldn't change behavior, delete it. Reads like a checklist, not an
   essay — no motivation, no aphorisms, no victory laps.
3. **No design rationale, no duplication of NKS.** The *why* behind a decision
   lives in NKS (vimarshas) — link, don't restate. `AGENTS.md` is a `reference`
   artifact (shabda); narrative in it sets up a second source of truth that
   drifts from NKS and misleads future agents. Keep a terse `(why: …)` clause
   *only* for an invariant a future agent would otherwise violate — a code-level
   gotcha or non-obvious constraint, never a design justification.
4. **Tables and bullets over paragraphs.** One directive per bullet.
5. **No length target** — but a section that runs to paragraphs is almost always
   carrying rationale that belongs in NKS. Move it there.

Worked example — same `## Code conventions` entry, bad (narrative) vs good
(AI-first):
- ❌ "We try to be careful about state because this is a demo and the store is
  the only place data lives, so it's important that components read it correctly
  when the persona changes, otherwise the demo can look broken."
- ✅ "Persona-scoped UI reads role via `use-acting-context`; re-check render on
  persona switch. (why: store is the only data source — a stale read shows
  wrong-role data.)"

The good version is a directive + one invariant clause. The bad version is three
sentences of rationale that belong in an NKS vimarsha.

## Procedure

Idempotent throughout: in a mature repo, run each self-check and act only on
failures; report what's still outstanding.

### Step 1 — Settle with the user (do first)
Don't silently pick defaults. Confirm in conversation, then write into *What this
project is*: **Nature** (and, if not `production`, which principles are relaxed +
why), **NKS realm name** (create if missing), **Stack**, **Quality gate**
(propose strictest — Step 3). For an existing repo, infer these from the repo and
the old config first, then confirm only what's ambiguous.

### Step 2 — NKS bootstrap
- Realm exists? If not: agree a name, then `nks_realm(action="create")`.
- If the project has structure beyond the realm itself, a focus holon exists
  (named after the project's boundary, `contains`-linked from the realm root),
  and its `#seq` goes into *What this project is*. Design the boundary with the
  `design` skill, create with `nks_add_holon`.

### Step 3 — Quality gate (propose strictest, user confirms)
For each: propose the strictest sensible option for the stack, a one-line
trade-off, await confirmation. Default strict; relaxations need an explicit ask,
calibrated to cost-of-breakage from *What this project is* and recorded there
per-tool.

**Tightening an existing gate is not free.** On a mature repo whose gate is
already relaxed, `max-warnings 0` is not a checkbox — it commits the user to a
refactor. Before proposing to tighten, *measure*: run the linter/typechecker at
the proposed strictness, count the failures, and show that cost. Tightening an
already-relaxed gate needs the same explicit ask as a relaxation — and may belong
in a follow-up branch, not the bootstrap.
- **Linter**, max strict (e.g. `@typescript-eslint/strict`; Ruff
  `E,F,B,I,N,UP,RUF`; `golangci-lint` broad; `clippy -- -D clippy::pedantic`).
- **Formatter**, auto-fix on save + pre-commit (Prettier, `ruff format`,
  `gofumpt`, `rustfmt`).
- **Type checker**, strict, if the stack has one (`tsc --strict`, `mypy
  --strict` / `pyright --strict`).
- **Pre-commit hook**: linter + formatter + typecheck on staged files.
- **Test framework + discipline** (unit for libraries; +integration for
  services; +e2e for UI; coverage threshold for production). Record in *Code
  conventions*.
- **CI**: lint + typecheck + tests on every push, fails on warnings. Mandatory
  for `production`.

Write commands into *Commands*, discipline into *Code conventions*.

### Step 4 — Hooks
Two hooks in `.claude/settings.json` (committed — project-wide rituals, every
agent on every clone needs them). Generate the JSON for *this* project — write it
yourself:
- **`SessionStart`** → reminder to orient in NKS before acting (skill `entry`),
  naming *this* realm slug and focus holon.
- **`PostToolUse`** with `"matcher": "Bash"` → when the command contains `git
  push`, reminder to update NKS (match reality + handle the driving hint seed)
  and run the after-green-push self-review.

Each hook runs a shell `command` that echoes the hook envelope to stdout. The
nesting (`event → array → {"hooks":[{"type":"command","command":…}]}`) is the
easy part to get wrong:
```json
{ "hooks": { "SessionStart": [ { "hooks": [ { "type": "command",
  "command": "echo '{\"hookSpecificOutput\":{\"hookEventName\":\"SessionStart\",\"additionalContext\":\"<orient reminder: realm + focus holon>\"}}'" } ] } ] } }
```
The `PostToolUse` entry adds `"matcher": "Bash"` and gates the echo on the
command: `jq -r '.tool_input.command // ""' | grep -q 'git push' && echo '<envelope>' || true`.
This matches the command *text*, so it will also fire on commands that merely
*mention* `git push` (an `echo`, a PR-body heredoc, this very hook's own
validation) — a known false-positive. Harmless for a non-blocking reminder, so
ship it as-is; just never promote this text-match to anything that gates work. To
cut the noise, also branch on `.tool_response` so the reminder fires only when
the push actually ran.
Self-check: both hooks present; `SessionStart` names the real realm slug + focus
holon, not a placeholder.

Heads-up: writing `.claude/settings.json` may be flagged by the harness as
self-modification and require explicit approval — surface the write for
confirmation rather than assuming it lands silently.

### Step 5 — Permissions allow-list (optional)
Two layers, both shaped `"permissions": { "allow": [...] }`, merged alongside
`hooks` (don't overwrite):
- **Team base** in `.claude/settings.json` (committed, same file as the hooks):
  the repetitive *safe* commands this project actually uses — NKS read/write MCP
  tools and the NKS skills, non-destructive `git`, the stack's build/test/lint.
- **Personal extensions** in `.claude/settings.local.json` (gitignored — Step
  6): machine- or agent-specific; extend ad-hoc.

Never pre-grant in either layer (ask per-use): `rm`, `git reset --hard`, `git
push --force`, `git branch -D`; `nks_delete_node` / `nks_delete_edge` /
`nks_history(action="revert"|"invert")`; `nks_realm(action="create"|"delete")` /
`nks_admin`; and bash `cat`/`find`/`grep`/`ls`/`sed`/`awk`/`head`/`tail`
(Read/Glob/Grep/Edit cover those).

The NKS MCP server prefix is environment-specific — confirm the real tool names
(`nks_realm(action="list")`) before hard-coding any `mcp__…__nks_*` entry; a
copied prefix often won't match and silently does nothing.

### Step 6 — Repo hygiene
- Commit `.claude/settings.json`; ignore `.claude/settings.local.json` via
  `.gitignore`. If `.claude/` is broadly ignored, add an explicit un-ignore:
  `!.claude/settings.json`. Verify with `git check-ignore -v
  .claude/settings.json .claude/settings.local.json`.
- Local project-memory dir (`~/.claude/projects/<encoded-path>/memory/`) holds
  only the prohibition stub. Classify each survivor before moving it: **project
  state** (decisions, branch state, gotchas) → AGENTS.md / HANDOVER.md / NKS;
  **user/agent-scoped preferences** (working style, language) are *not* project
  state — they persist separately by design (see *Persistence rules*), so leave
  them where they live, don't force them into the stub. Then write/refresh the
  stub: forbid using local project memory, point at the repo files + NKS realm
  where state lives (reason: reproducibility + multi-machine work).
- *Stack*, *Commands*, *Project structure*, *Code conventions* hold real content
  proportional to maturity. Empty is fine day one; `TBD` is not.
- `HANDOVER.md` exists only if feature-branch work is in flight.
- `README.md` is short, human-facing, and doesn't duplicate AGENTS.md.

### Step 7 — Finalize
- Write the filled body to **`AGENTS.md`**, then create the Claude Code compat
  symlink: `ln -s AGENTS.md CLAUDE.md`; verify with `readlink CLAUDE.md`.
  (`AGENTS.md` is the vendor-neutral canonical name; Claude Code reads
  `CLAUDE.md` and follows symlinks.)
- **Legacy config already present** (the common case): use the skeleton as the
  frame, fold existing `AGENTS.md`/`CLAUDE.md` content into matching sections,
  preserve project-specific content that has no slot (move to *Code conventions*
  or a new section). End with `AGENTS.md` as the one file + `CLAUDE.md` as the
  symlink — if a *regular-file* `CLAUDE.md` exists, replace it with the symlink
  after folding its content in. One source per concern — no duplicate sections.
- **Density pass:** for every body line ask "does this change what the agent
  does?" Cut narrative, motivation, design rationale (rationale → NKS).
- Confirm no `<…>` slot and no `<!-- … -->` note survived into `AGENTS.md`.
- On the bootstrap push, NKS reflects the change (vimarshas opened/closed,
  driving hint seed handled).
