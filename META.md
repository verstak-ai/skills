# `<project-name>`
`<one line: what this project is and who it serves>`
> 🛠 **SETUP — read once, then strip.** This file is a fill-in template for a
> project's `AGENTS.md`. Three registers live here:
> - **Body sections** (`##` headings below) — copy-forward into the finished
>   `AGENTS.md`. Already terse; keep them terse.
> - **`<…>` placeholders** — SLOTS. Replace with project specifics, delete the
>   angle brackets.
> - **`> 🛠 SETUP` callouts** (like this) and the whole `## Bootstrap` section
>   — instructions to *you, the bootstrapping agent*. **Delete every one of
>   them from the finished `AGENTS.md`.**
>
> Walk the `## Bootstrap` checklist (idempotent — in a mature repo, fix only
> what fails its self-check), fill the slots, strip all SETUP, then rename to
> `AGENTS.md` (plus `CLAUDE.md` symlink for Claude Code — see Step 7).
>
> **META vs output — don't confuse them.** This template is *bootstrap
> scaffolding*: read once during setup, so it's allowed to be detailed,
> explanatory, and complete — don't over-trim it. The finished `AGENTS.md` is
> the opposite: a config the agent reads *every session*, so it must be dense
> (the output contract below). Keep META thorough; make the output terse.
> 🛠 **SETUP — output contract. This is the point of the template; obey it.**
> The produced `AGENTS.md` is a config the agent reads every session, not a
> document a human reads once. Write it that way:
> 1. **Imperative, addressed to the agent.** "Orient before coding," not "the
>    agent should orient."
> 2. **Density rule:** every line must change what the agent *does*. If
>    deleting a line wouldn't change behavior, delete it. It should read like a
>    checklist, not an essay — no motivation, no aphorisms, no victory laps.
> 3. **No design rationale, no duplication of NKS.** The *why* behind a
>    decision lives in NKS (vimarshas) — link, don't restate. AGENTS.md is a
>    `reference` artifact (shabda); narrative in it sets up a second source of
>    truth that drifts from NKS and misleads future agents. Keep a terse
>    `(why: …)` clause *only* for an
>    invariant a future agent would otherwise violate — a code-level gotcha or
>    non-obvious constraint, never a design justification.
> 4. **Tables and bullets over paragraphs.** One directive per bullet.
> 5. **No length target** — but a section that runs to paragraphs is almost
>    always carrying rationale that belongs in NKS. Move it there.
## What this project is
- **Nature**: `<production | research | sandbox | one-off | library>`. If not
  `production`, list which working principles are relaxed and why. No explicit
  relaxation = full production discipline (agents lean lenient by default).
- **NKS realm**: `<slug>` — every session starts with `nks_orient` here.
- **Focus holon**: `<#seq «name»>`, or `focus: realm root` if the whole realm
  is in scope.
- **Stack**: `<language + primary frameworks, one line>`.
- **Production statement**: `<one paragraph: what ships, to whom, where, cost
  of breakage. Sandbox/research: state that breakage is cheap, what the
  project is for, and when it stops being cheap.>`
## Persistence rules
State lives in the **repo** or in **NKS** — nowhere else. Local agent memory
(`~/.claude/projects/<encoded-path>/memory/`, conversation summaries, `/tmp`,
machine-local files) is **forbidden for project state**, even when convenient:
it breaks flow reproducibility and silently prevents working from a second
machine or with another agent.
- **Repo**: code, configs, conventions, code-level gotchas, branch state — the
  artifact itself.
- **NKS**: methodology, design decisions, open questions (vimarshas), plans,
  hand-offs, lessons, hints — the thinking around it. Don't restate NKS content
  in the repo; link to the vimarsha or holon.
- **Fetch state; never reconstruct it from memory.** No source for a "we
  decided…"? Stop and read NKS or the repo before acting.
- **Local project-memory dir holds exactly one file**: a stub that (a) forbids
  using local project memory and (b) points to the repo files + NKS realm
  where project state actually lives. Anything else found there → move to its
  real home (AGENTS.md / HANDOUT.md / NKS), reset the stub.
- Global *user* preferences (language, working style) are agent-scoped and
  persist separately — this rule is about *project* state.
## Session lifecycle
NKS = the work (structure, open questions, what's next). Git = how it got here
(SHAs, branches, PRs). **Keep git refs out of NKS** — no SHAs, branch names,
PR numbers, or "shipped/merged" in nodes (go stale on rebase).
- **Start of session:** orient in NKS — the realm named in *What this project
  is*, focus holon if set; read the latest `genre=hint` seed before acting. The
  `methodology-entry` skill runs the protocol.
- **Every push → update NKS.** Two moves, both required:
  - **Match reality.** Record what positions the change in the target system:
    architecture, module APIs, supply/delivery, user experience, integration
    with neighbouring code. Repo-only mechanics — lockfile churn, internal
    refactors with no outside impact, commands, file moves — stay in git, not
    NKS.
  - **Handle the hint seed that drove this push.** Close it if the work it
    framed is done; edit it (strip done history, keep what's still open) if
    partial; leave a *new* `genre=hint` only if work continues into the next
    session — not by default.

  `nks-weaving` / `nks-design` carry the *how* (closing vimarshas, threading
  the holon).
- A `SessionStart` hook and a post-`git push` hook in
  `.claude/settings.json` (committed) automate these reminders — verify both
  wired.
### After a green push: self-review
Quality gate green and the iteration done → re-read your diff for: bugs,
fragile spots, weak error handling, DRY/SOLID violations, repeated patterns,
missing or useless tests, files over 150 lines. Fix in the **same branch** and
push again, or state plainly that nothing surfaced. Don't fake findings.
### Branch discipline
One branch through to its merge — commit follow-ups into it, don't chain new
branches before it merges. After the branch merges (however this project merges
— see *Definition of done*), clean up locally:
1. `git checkout main && git pull`.
2. Delete the merged branch (`git branch -d <name>`); prune others now on
   `main`.
3. Update NKS: change is on `main`, not a branch — thread shipped state into
   the holon, close vimarshas the merge resolved (`nks-weaving`).
4. Confirm cleanup is done before the next task.
> 🛠 SETUP — keep this section merge-signal-agnostic. *How* the project learns a
> branch merged (user says so / PR merged / CI) and the rest of its merge flow
> belong in the *Definition of done* slot under *Git workflow*, not here.
## Working principles
> 🛠 SETUP — these bias toward caution (production defaults). Relax explicitly
> in *What this project is*, never silently.
1. **Think before coding.** State assumptions; ask when uncertain — name
   *what's* unclear, not just "which option". Surface competing
   interpretations; push back when a simpler approach or false premise is
   visible. Check repo + NKS before writing; fetch, don't recall. Hit the
   live system before trusting a type, a name, or a doc (*pratyaksha before
   shabda*).
2. **Simplicity first.** Minimum code for the task. No speculative features, no
   abstractions for single-use code, no error handling for impossible cases.
   Validate at boundaries; trust internal invariants. 200 lines that could be
   50 → rewrite.
3. **Surgical changes.** Touch only what the task needs. Don't reformat or
   refactor adjacent code. Match existing style; the linter is authoritative.
   Remove only the dead code your change created; flag the rest, don't delete.
4. **Goal-driven execution.** Tasks → verifiable goals. Bugs: pin with a
   failing test before patching (no ad-hoc curl/bash debugging). Multi-step:
   state plan as `step → verify` pairs, loop until each passes. Runtimes (UI,
   service, integration): verify in the real environment (browser, real API,
   downstream system), not just unit tests. Close vimarshas your change
   resolves (`visarjana`).
5. **Methodology check on open-ended asks.** Tasks framed as *discuss / think
   through / figure out / research / design / plan / analyse / investigate /
   explore / "what do you think"* — anything beyond "do X concretely" — query
   the `methodology` realm before answering (multiple queries; one miss ≠
   absent). Without this the dialogue defaults to recall instead of method,
   and methodology rarely surfaces unprompted. The `methodology-entry` skill
   runs the protocol.
## NKS ↔ repo: where things live
| Concern                                | Repo            | NKS                      |
|----------------------------------------|-----------------|--------------------------|
| Code, configs, lockfiles               | ✓               |                          |
| Commands, conventions, gotchas, stack  | ✓ (AGENTS.md)   |                          |
| Current branch state, how to verify    | ✓ (HANDOUT.md)  |                          |
| Gaps in external systems we depend on  | ✓ (MISSING_*.md)|                          |
| Methodology, ontology                  |                 | ✓ (methodology realm)    |
| Design decisions, open questions       |                 | ✓ (vimarshas)            |
| Plans, task lists, session hand-offs   |                 | ✓ (project realm)        |
| Lessons, hints to next session         |                 | ✓ (`genre=hint`)         |
| Commit history, PRs, SHAs              | git             | (never NKS)              |
> 🛠 SETUP — `HANDOUT.md` and `MISSING_*.md` are optional. Keep those two rows
> only if the project actually uses them; drop them otherwise.
## Stack
`<versions + critical libraries the one-liner in *What this project is* doesn't
already cover; lockfiles carry the rest. Omit this section entirely if the
one-liner says enough.>`
## Commands
`<table: build / test / lint / dev / format. Lint runs zero-warning where the
stack supports it.>`
## Project structure
`<top-level dirs, one line each. Path aliases here too. Keep readable, not
exhaustive.>`
## Code conventions
`<only what the linter doesn't enforce:>`
- `<naming / import style / forbidden patterns + why-forbidden>`
- **Test discipline**: `<unit | unit+integration | +e2e; coverage threshold
  for production>`.
- **Gotchas**: `<runtime traps types/linter miss — hook return shapes, async
  races, env-specific behavior, library quirks. One paragraph each.>`
## What to update when
- `AGENTS.md` — commands, structure, conventions, or stack change.
- `HANDOUT.md` — current branch state shifts (branch, what's runnable/blocked).
  Not a changelog (that's commits + NKS).
- `MISSING_*.md` — a need surfaces that an upstream/downstream system doesn't
  satisfy yet.
- NKS (project realm) — every push (see *Session lifecycle*).
## Git workflow
- **Conventional commits** (`feat:`/`fix:`/`chore:`/`refactor:`/`docs:`/
  `test:`). Branches `feat/…`, `fix/…`, `chore/…`. PR titles same format.
- **No co-author trailer** unless the user asks.
- **Local gate**: a pre-commit hook (Husky / lefthook / pre-commit) runs linter
  + formatter (+ typecheck) on staged files — or, if the project has none, run
  them manually before pushing. CI enforces them regardless.
- **Definition of done**: `<the project's merge flow + how it learns a branch
  merged — e.g. PR into main, `gh pr checks <n> --watch` green, zero-conflict
  merge; or a manual "merged" announcement. Branch discipline points here for
  the signal, so fill this in.>`
- **Never** `--no-verify`, `--force`, `--no-gpg-sign`, or `git reset --hard`
  without explicit user instruction.
> 🛠 SETUP — worked example of the target register. A *bad* (narrative) and
> *good* (AI-first) fill of the same `## Code conventions` entry:
>
> - ❌ "We try to be careful about state because this is a demo and the store
>   is the only place data lives, so it's important that components read it
>   correctly when the persona changes, otherwise the demo can look broken."
> - ✅ "Persona-scoped UI reads role via `use-acting-context`; re-check render
>   on persona switch. (why: store is the only data source — a stale read
>   shows wrong-role data.)"
>
> The good version is a directive + one invariant clause. The bad version is
> three sentences of rationale that belong in an NKS vimarsha, not here.
---
## Bootstrap (delete this whole section after self-check passes)
> 🛠 SETUP — checklist for the first sessions in a fresh repo. Idempotent: in a
> mature repo, run each self-check against current state and act only on
> failures; report what's still outstanding. Don't assume a fresh repo just
> because this section is present.
### Step 1 — Settle with the user (do first)
Don't silently pick defaults. Confirm in conversation, then write into
*What this project is*:
- **Nature** (and, if not `production`, which principles are relaxed + why).
- **NKS realm name** (create if missing).
- **Stack**.
- **Quality gate** (propose strictest, see Step 3).
### Step 2 — NKS bootstrap
- [ ] Realm exists. If not: agree a name with the user, then `nks_create_realm`.
- [ ] If the project has structure beyond the realm itself, a focus holon
      exists (named after the project's boundary, `contains`-linked from the
      realm root), and its `#seq` is in *What this project is*. Design the
      boundary with `nks-design`, create with `nks_add_holon`.
### Step 3 — Quality gate (propose strictest, user confirms)
For each: propose the strictest sensible option for the stack, one-line
trade-off, await confirmation. Default strict; relaxations need an explicit
ask, calibrated to cost-of-breakage from *What this project is* and recorded
there per-tool.
- [ ] **Linter**, max strict (e.g. `@typescript-eslint/strict`; Ruff
      `E,F,B,I,N,UP,RUF`; `golangci-lint` broad; `clippy -- -D
      clippy::pedantic`).
- [ ] **Formatter**, auto-fix on save + pre-commit (Prettier, `ruff format`,
      `gofumpt`, `rustfmt`).
- [ ] **Type checker**, strict, if the stack has one (`tsc --strict`, `mypy
      --strict`/`pyright --strict`).
- [ ] **Pre-commit hook**: linter + formatter + typecheck on staged files.
- [ ] **Test framework + discipline** (unit for libraries; +integration for
      services; +e2e for UI; coverage threshold for production). Record the
      discipline in *Code conventions*.
- [ ] **CI**: lint + typecheck + tests on every push, fails on warnings.
      Mandatory for `production`.
Write commands into *Commands*, discipline into *Code conventions*.
### Step 4 — Hooks
Two hooks in `.claude/settings.json` (committed — project-wide rituals, every
agent on every clone needs them) keep the rituals automatic. **Generate them
for this project — write the JSON yourself, no verbatim copy needed:**
- **`SessionStart`** → reminder to orient in NKS before acting (skill
  `methodology-entry`), naming *this* realm slug and focus holon.
- **`PostToolUse`** with `"matcher": "Bash"` → when the command contains `git
  push`, reminder to update NKS (match reality + handle the driving hint
  seed) and run the after-green-push self-review.
Each hook runs a shell `command` that echoes the hook envelope to stdout. The
settings nesting (`event → array → {"hooks":[{"type":"command","command":…}]}`)
is the easy part to get wrong, so here's the shape (with placeholder reminder
text):
```json
{ "hooks": { "SessionStart": [ { "hooks": [ { "type": "command",
  "command": "echo '{\"hookSpecificOutput\":{\"hookEventName\":\"SessionStart\",\"additionalContext\":\"<orient reminder: realm + focus holon>\"}}'" } ] } ] } }
```
The `PostToolUse` entry adds `"matcher": "Bash"` and gates the echo on the
command: `jq -r '.tool_input.command // ""' | grep -q 'git push' && echo '<envelope>' || true`.
Self-check:
- [ ] both hooks present;
- [ ] `SessionStart` names the real realm slug + focus holon, not a placeholder.
### Step 5 — Permissions allow-list (optional)
Two layers, both shaped `"permissions": { "allow": [...] }`, merged alongside
`hooks` (don't overwrite):
- **Team base** in `.claude/settings.json` (committed, same file as the hooks).
  The repetitive *safe* commands this project actually uses, so no one
  re-grants them: NKS read/write MCP tools and the NKS skills, non-destructive
  `git`, and the stack's build/test/lint commands.
- **Personal extensions** in `.claude/settings.local.json` (gitignored —
  see Step 6). Anything machine-specific or agent-specific; extend ad-hoc.

Never pre-grant in either layer (ask per-use): `rm`, `git reset --hard`,
`git push --force`, `git branch -D`; `nks_delete_*` / `nks_revert` /
`nks_invert`; `nks_create_realm` / `nks_delete_realm` / `nks_admin`; and bash
`cat`/`find`/`grep`/`ls`/`sed`/`awk`/`head`/`tail` (Read/Glob/Grep/Edit cover
those).
> 🛠 The NKS MCP server prefix is environment-specific — confirm the real tool
> names (run `nks_list_realms`) before hard-coding any `mcp__…__nks_*` entry; a
> copied prefix often won't match and silently does nothing.
### Step 6 — Repo hygiene
- [ ] `.gitignore` tracks `.claude/settings.json` and ignores
      `.claude/settings.local.json`. If `.claude/` is broadly ignored, add an
      explicit un-ignore: `!.claude/settings.json` (and keep
      `.claude/settings.local.json` ignored). Verify with `git check-ignore -v
      .claude/settings.json .claude/settings.local.json`.
- [ ] Local project-memory dir (`~/.claude/projects/<encoded-path>/memory/`)
      holds only the prohibition stub. Move any survivors into AGENTS.md /
      HANDOUT.md / NKS, then write/refresh the stub: forbid using local
      project memory, point at the repo files + NKS realm where state lives.
      Reason in stub: reproducibility + multi-machine work.
- [ ] *Stack*, *Commands*, *Project structure*, *Code conventions* hold real
      content proportional to maturity. Empty is fine day one; `TBD` is not.
- [ ] `HANDOUT.md` exists if feature-branch work is in flight. Skip for
      early-stage or prose-only repos.
- [ ] `README.md` is short, human-facing, and doesn't duplicate AGENTS.md.
### Step 7 — Finalize
- [ ] On every bootstrap push, NKS reflects the change (vimarshas opened/closed,
      driving hint seed closed/edited or a new one left only if work continues).
- [ ] **Density pass**: for each line of the body, ask "does this change what
      the agent does?" Cut narrative, motivation, and design rationale
      (rationale → NKS). The file should read like a config, not an essay.
- [ ] **Strip every `> 🛠 SETUP` callout** from the body.
- [ ] Rename `META.md` → `AGENTS.md`, then create the Claude Code compat
      symlink: `ln -s AGENTS.md CLAUDE.md`. Verify with `readlink CLAUDE.md`
      (`AGENTS.md` is the vendor-neutral canonical name; Claude Code reads
      `CLAUDE.md` and follows symlinks). If `AGENTS.md` or a regular-file
      `CLAUDE.md` already exists (legacy): use META as scaffold, fold
      existing content into matching slots, preserve project-specific content
      with no slot (move to *Code conventions* or a new section), then end
      with `AGENTS.md` as the file + `CLAUDE.md` as the symlink. One source
      per concern — don't leave duplicate body sections.
- [ ] Delete this whole `## Bootstrap` section (from the `---` divider down), or
      compress to one line: `bootstrap completed YYYY-MM-DD`.
