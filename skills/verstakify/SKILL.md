---
name: verstakify
description: "Use when the user asks to verstakify a repo — bootstrap or refresh its AGENTS.md / CLAUDE.md to the verstak standard, apply the NKS methodology conventions, or wire the session-lifecycle rituals (orient-in-NKS on start, push→update-NKS hooks, quality gate, permissions, CLAUDE.md pointer — @AGENTS.md import, Windows-safe). Triggers: \"verstakify\", \"verstakify this repo\", \"привести проект к стандарту\", \"завести/обновить AGENTS.md\", \"set up AGENTS.md\", \"bootstrap AGENTS\", \"apply the meta template\", \"наведи порядок в конфиге агента\". AGENTS.md is a derived view, not hand-written prose: each concern is audited against its source of truth and re-projected when stale, preserving authored judgment; fresh repos ask the user for the authored slots. Needs the nks_* MCP tools for the NKS steps."
---

# Verstakify

Bring the **current repo** to the verstak agent standard: a dense, AI-first
`AGENTS.md` (read every session, not by a human once) + a `CLAUDE.md` symlink,
the NKS session rituals wired as hooks, and a quality gate. You **generate** the
config from the skeleton — nothing is copied by hand and the user pastes no
template.

The real deliverable is **a trust interface**: a doc the agent can believe every
session — not a pretty dense file. `AGENTS.md` is a *derived view*, a projection
of sources that already hold the truth (code, `package.json`, CI config, the
filesystem, NKS) plus a thin layer of authored judgment (gotchas, why-clauses)
that lives nowhere else. So the contract has two co-equal halves: **density**
(every line changes behavior) and **accuracy** (every derived line re-checked
against its source *this run*). A dense false line is worse than a verbose one —
short and confident, the agent swallows it without resistance. Verify with the
same rigor you compress with.

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

## Audit → classify → act (not fresh-vs-existing)

A repo is never simply *fresh* or *configured* — it's a spectrum, and the trap is
"a file exists, therefore its facts are true." Don't branch on whether
`AGENTS.md` / `CLAUDE.md` / `.claude/` exists. Instead **audit every concern
against its source of truth and classify it**:

- **absent** — no claim yet → derive it from the source (or, for an authored
  slot with no checkable source, ask the user).
- **stale** — a claim exists but disagrees with its source → re-project from the
  source, overwriting the stale text. Do not carry it forward just because it was
  written down.
- **correct** — claim matches source → leave it.

Run this per concern using the source map below. "Fresh repo" is just
*everything absent*; a mature repo is a mix — and most dangerous when
*mostly-correct*, because the few stale lines hide among trusted ones (this is
why the verify pass is whole-artifact, Step 8). For authored slots with no
checkable source, *absent* → ask the user; never invent.

### Source of truth per concern
Each claim class has one authority. Verify there — don't recall:

| Concern | Source of truth | How to check |
|---|---|---|
| Versions, dependencies | `package.json` / `pyproject.toml` / `go.mod` / `Cargo.toml` + lockfile | read |
| Build/test/lint/dev commands | `package.json` scripts, `Makefile`/`Justfile`, CI workflow | read; run `--help`/dry-run where cheap |
| Quality gate (strictness, max-warnings) | linter config, `tsconfig`, CI yaml | read |
| Project structure, path aliases | filesystem + `tsconfig`/bundler config | glob / list |
| Nature, production statement, relaxations | the user (authored) | confirm in conversation |
| Design decisions, why-clauses, open questions | NKS | `nks_orient` / `nks_search` |
| Branch state, what's runnable | git + `HANDOVER.md` | `git status` / `log` |
| Gotchas | authored (past pain) | sanity-check only — don't auto-derive |

Two kinds of line, handled differently: **derived facts** (upper rows) are
re-projected from source every run — never preserved when stale; **authored
judgment** (lower rows — gotchas, why-clauses, nature) lives nowhere else —
preserve it, only sanity-check it against the code.

## The output contract — density and accuracy

`AGENTS.md` is read *every session*, so it must be both **dense** and **true** —
co-equal, not form-first. Accuracy is operationalized above (audit/classify each
concern against the source map) and below (verify pass, Step 8). The density half
is these five rules:
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

**Out of scope — orchestration mechanics.** `AGENTS.md` addresses one agent in
one session. Build-gating chains, sub-agent push verification, model-routing,
multi-lane coordination don't belong here — inlining them violates the density
rule for the solo reader. Home: a dedicated orchestration/scheduler skill or the
methodology realm — except the sub-agent delegation slice, which this skill
projects as role files (Step 7, `references/delegation.md`), never as AGENTS.md
prose. Link if needed, don't inline.

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

Also settle **who owns direction**: the realm's owner as a svatantra (主)
karta — created in Step 2 if missing. Out-of-mandate questions will be posed to
it as graph vimarshas (`posed_to`), not chat-only asks.

Also settle **shared mutable build/test state**: does build or test read or
mutate a shared resource — a database, a fixed port, a dev server, a global
cache, a cloud sandbox? If yes, capture per-lane isolation (per-branch
DB/schema, per-lane port, per-lane temp dir) as a gotcha: agents run branches
concurrently in separate worktrees, and a shared resource corrupts across lanes.
Skip when build/test has no shared mutable state.

Also settle **workflow-suite coexistence** (only when a coercive workflow suite
is detected — its skills appear in the skills list, or its dir exists in the
plugin cache, e.g. `~/.claude/plugins/`; today that means superpowers): tell
the user what was found and settle the mode:
1. **Full interop** (recommended) — AGENTS.md gets the interop subsection
   (from this skill's `references/superpowers-interop.md`) + the spec-write
   hook (Step 4);
2. **Prose-only** — the subsection, no spec-write hook;
3. **Skip** — no coexistence text (not recommended; note the risk: design
   sessions led by the suite won't persist to the realm by default).

### Step 2 — NKS bootstrap
- Realm exists? If not: agree a name, then `nks_realm(action="create")`.
- If the project has structure beyond the realm itself, a focus holon exists
  (named after the project's boundary, `contains`-linked from the realm root),
  and its `#seq` goes into *What this project is*. Design the boundary with the
  `design` skill, create with `nks_add_holon`.
- **The doer becomes a steward.** Create the repo's agent karta
  (`nks_add_karta`, `manifested_as=adhikarin`, motivation distilled from the
  Production statement) and draw its `steward` edge to the focus holon — an
  adhikarin without a steward edge is a live warning ("acts but answers for
  nothing"). Create the owner's svatantra karta if Step 1 found none. Record
  both seqs in *What this project is*. An agent can always re-find its kartas
  via `nks_admin(action="my_kartas")` — the doc slot is the fast path, not the
  only one.

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
- **CI parity**: any check that can *fail* must gate PRs, not just post-merge.
  Audit the workflows for jobs scoped to push-`main`/release only (codegen,
  schema/API-spec/docs generation, image or bundle build, migration check) — a
  post-merge-only check lets two individually-green PRs break `main` after merge.
  Tighten it to also run on PRs; record any gap you can't close now as a gotcha.

Write commands into *Commands*, discipline into *Code conventions*.

### Step 4 — Hooks
Three hooks in `.claude/settings.json` (committed — project-wide rituals, every
agent on every clone needs them), plus a conditional fourth — the spec-write
hook — **only when the Step-1 coexistence settle chose full interop** (the
settled mode is recorded in the AGENTS.md interop stamp, Step 8; no subsection
= no settle = three hooks). **Merge, never overwrite:** other suites may
already own entries in this file — add yours alongside theirs in the same
arrays; deleting another suite's hooks breaks its rituals. Generate the JSON for
*this* project — write it yourself:
- **`SessionStart`** → reminder to orient in NKS before acting (skill `entry`),
  naming *this* realm slug, focus holon **and agent karta**: open the doer's
  agenda (`nks_orient(realm, focus="<agent-karta-seq>")`) — incoming `posed_to`
  vimarshas are the session's inbox; pick up or explicitly defer each.
- **`PostToolUse`** with `"matcher": "Bash"` → when the command contains `git
  push`, reminder to update NKS (match reality + advance the bianhua map:
  close resolved vimarshas), **sweep the shipped contour** (flip the modes of
  every designed node the push realized — the whole contour, not only the nodes
  you touched — and close the design vimarshas the ship settled), **sweep the
  inbox** (visarjana the `posed_to` questions the work answered), run the
  after-green-push self-review, and: uningested design/spec docs on this
  branch → intake them (`intake` skill, then `design`) before closing.
- **`PostToolUse`** with `"matcher": "Write|Edit"` → the **memory-write hook**:
  when the written file path is inside the local project-memory dir, reminder
  to run the write-gate (classify: project fact → repo/NKS, memory keeps a
  pointer). This is the third layer of the gate — it fires at the exact moment
  the save-instinct does, when both AGENTS.md and the `MEMORY.md` gate line
  are far behind in the context. Exact JSON below.
- **`PostToolUse`** with `"matcher": "Write|Edit"` → the **spec-write hook**
  (full-interop mode only): when the written file path looks like a design/spec
  doc, reminder that the file is a draft view — the graph is the design record.
  Same envelope style, gated on `.tool_input.file_path` the way the push hook
  gates on the command text; exact JSON below.

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

The memory-write hook, same envelope style — the path is unambiguous
(`.claude/projects/<encoded>/memory/`), so false positives are near zero and
memory writes are rare, so it never spams:
```json
{ "matcher": "Write|Edit", "hooks": [ { "type": "command",
  "command": "jq -r '.tool_input.file_path // \"\"' | grep -qE '\\.claude/projects/[^/]+/memory/[^/]+\\.md$' && echo '{\"hookSpecificOutput\":{\"hookEventName\":\"PostToolUse\",\"additionalContext\":\"Memory write — run the gate (AGENTS.md, Persistence rules): a project fact (system property, decision, constraint, gotcha) belongs in repo/NKS, memory keeps at most a one-line pointer; agent/user-scoped style stays here. Dual-nature facts split: fact → repo/NKS, pointer → memory.\"}}' || true" } ] }
```
The spec-write hook (full-interop only), same gating style — a wide behavioral
glob; false positives are harmless for a non-blocking reminder, never promote
it to anything that gates work:
```json
{ "matcher": "Write|Edit", "hooks": [ { "type": "command",
  "command": "jq -r '.tool_input.file_path // \"\"' | grep -qE '(^|/)specs/[^/]+\\.md$|(^|/)docs/.*design[^/]*\\.md$' && echo '{\"hookSpecificOutput\":{\"hookEventName\":\"PostToolUse\",\"additionalContext\":\"A design draft was written; per AGENTS.md this file is a draft view — the graph is the design record. Intake it (intake skill, then design skill) in this session — do not defer to a push.\"}}' || true" } ] }
```
These entries merge into the same `PostToolUse` array as the git-push hook —
sibling objects, not replacements.

Self-check: all three base hooks present, and the spec-write hook present
**iff** the AGENTS.md interop stamp says `full` (absent stamp or `prose-only` →
it must NOT be wired — don't re-add it on refresh); `SessionStart` names the
real realm slug, focus holon and agent-karta seq, not placeholders; no
pre-existing hook entry from another suite was dropped by the merge.

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
push --force`, `git branch -D`; `nks_delete_node` / `nks_arrow(action="delete")` /
`nks_history(action="revert"|"invert")`; `nks_realm(action="create"|"delete")`;
`nks_admin` membership/ownership actions and `add_webhook`/`remove_webhook`
(its read-only `my_kartas` / `whoami` / `list_webhooks` / `my_usage` may sit in
the team allow-list); and bash `cat`/`find`/`grep`/`ls`/`sed`/`awk`/`head`/`tail`
(Read/Glob/Grep/Edit cover those).

The NKS MCP server prefix is environment-specific — confirm the real tool names
(`nks_realm(action="list")`) before hard-coding any `mcp__…__nks_*` entry; a
copied prefix often won't match and silently does nothing.

### Step 6 — Repo hygiene
- Commit `.claude/settings.json`; ignore `.claude/settings.local.json` via
  `.gitignore`. If `.claude/` is broadly ignored, add an explicit un-ignore:
  `!.claude/settings.json`. Verify with `git check-ignore -v
  .claude/settings.json .claude/settings.local.json`.
- **Tracked secret/env files**: run `git ls-files '.env*' '*secret*' '*local*'`.
  If a real env/secret file is tracked (not just an `.example`), warn in *Code
  conventions*: never stage local edits — `git update-index --skip-worktree
  <file>`, never `git add -A` / `commit -a` (an agent editing a tracked env file
  otherwise leaks it into the PR).
- Local project-memory dir (`~/.claude/projects/<encoded-path>/memory/`):
  audit it. Classify each file: **project state** (decisions, constraints,
  branch state, gotchas) → AGENTS.md / HANDOVER.md / NKS, leave at most a
  one-line pointer; **user/agent-scoped preferences** (working style,
  language) stay — they persist there by design (see *Persistence rules*).
  Then install the write-gate: the first line of the memory index
  (`MEMORY.md`) states the gate from *Persistence rules* — project facts →
  repo/NKS, memory keeps pointers; the harness's `project` memory category
  is overridden. Mark the line permanent (consolidation passes must not prune
  it). The index is loaded every session, so the gate meets the save-instinct
  at write time; the memory-write hook (Step 4) repeats it at the moment of
  the write (reason: reproducibility + multi-machine work).
- *Stack*, *Commands*, *Project structure*, *Code conventions* hold real content
  proportional to maturity. Empty is fine day one; `TBD` is not.
- `HANDOVER.md` exists only if feature-branch work is in flight.
- `README.md` is short, human-facing, and doesn't duplicate AGENTS.md.

### Step 7 — Subagent delegation roles
Project the delegation doctrine as **named role agents**, not as AGENTS.md
prose (orchestration mechanics stay out of AGENTS.md — the output contract
above). Doctrine + file templates: `references/delegation.md` (relative to
this skill).
- Always: `.claude/agents/reader.md` (cheap-tier recon) and
  `.claude/agents/worker.md` (mid-tier brief execution), model aliases
  `haiku`/`sonnet`.
- When the repo shows OpenCode use (`opencode.json` / `.opencode/` present, or
  the user says so): `.opencode/agents/reader.md` + `worker.md`,
  `mode: subagent`, model **pinned** per file — an unpinned OpenCode subagent
  inherits the invoking primary's model, so the pin is the point. Resolve
  current `provider/model-id`s from the user's setup (ask, or read
  `opencode.json` / the global config); never hardcode from the reference.
- The `description` fields are the delivery channel — they sit in the
  agent/task tool list every session, so the routing trigger fires without any
  skill load. Keep them trigger-shaped: when to use, what comes back, what NOT
  to trust it with.
- Judgment work (design, review, synthesis) gets no role file — it stays with
  the session model or a per-call top-tier override where the platform
  supports it.
- Self-check: role files parse (frontmatter); pinned models exist in the
  user's setup; AGENTS.md carries **no** inlined delegation doctrine (a
  pointer at most).

### Step 8 — Finalize
- Write the filled body to **`AGENTS.md`**, then create the Claude Code pointer:
  a one-line `CLAUDE.md` whose entire content is `@AGENTS.md` (no backticks in
  the file — a code span suppresses the import). This is the docs-recommended
  import: expanded at launch, identical to inline content, and it works
  everywhere — Windows checkouts get plain text where a symlink would break
  (`core.symlinks=false` is the default there). An existing
  `ln -s AGENTS.md CLAUDE.md` symlink is an acceptable POSIX equivalent — don't
  churn it. (`AGENTS.md` is the vendor-neutral canonical name; Claude Code reads
  `CLAUDE.md`, not `AGENTS.md`.)
- **Legacy config already present** (the common case): use the skeleton as the
  frame and fold existing content in *by line kind* — re-project derived facts
  from their source (don't carry a stale version, command, or path forward just
  because it was written down) but preserve authored judgment (gotchas,
  why-clauses, nature) that has no checkable source, sanity-checking it against
  the code. Project-specific content with no slot moves to *Code conventions* or a
  new section. End with `AGENTS.md` as the one file + `CLAUDE.md` as the pointer
  (the `@AGENTS.md` import, or a pre-existing symlink) — if a *content-bearing*
  `CLAUDE.md` exists, fold its content into `AGENTS.md` and replace the file
  with the pointer. One source per concern — no duplicate sections.
- If Step 1 settled full interop or prose-only: render the
  `### Workflow-suite interop (superpowers)` subsection at the end of
  `## Session lifecycle`, taking the section text from this skill's
  `references/superpowers-interop.md` (deployable part only — the maintainers'
  re-verify checklist stays in the reference). Stamp it with the plain trailing
  line `*(interop: <full|prose-only> — verified against superpowers@<version> —
  re-check on suite upgrade)*` — the stamp records the settled mode; Step 4 and
  refresh runs read it. On refresh runs, audit the subsection like any other AGENTS.md
  concern: source of truth = the reference file + the installed suite version.
- **Verify pass (co-equal with the density pass):** re-check every *derived* line
  against its source from the map — **whole-artifact, not just the lines you
  touched.** The most dangerous errors sit in untouched, settled-looking lines
  that drift silently because nothing challenges them. A claim you can't tie to a
  source is either authored judgment (keep it, recognize it as such) or a guess
  (cut it).
- **Density pass:** for every body line ask "does this change what the agent
  does?" Cut narrative, motivation, design rationale (rationale → NKS).
- Drift between runs is guaranteed — the doc goes stale the moment code changes.
  verstakify re-verifies only when re-run; an automatic "claimed vs actual" check
  hook (e.g. doc versions vs `package.json`) is a deliberate non-default —
  generic prose-vs-source parsing is brittle and would itself drift. Tracked as
  an open vimarsha in nks-dev; re-running verstakify is the current discipline.
- Confirm no `<…>` slot and no `<!-- … -->` note survived into `AGENTS.md`.
- On the bootstrap push, NKS reflects the change (vimarshas opened/closed,
  the bianhua map advanced).
- **Pass the baton.** End the bootstrap by offering the first visible value —
  a quick roadmap teaser (`product-roadmap` skill, quick mode) over the freshly
  bootstrapped repo. The newcomer's first wow should not wait for them to guess
  the next prompt.
