# `<project-name>`
`<one line: what this project is and who it serves>`

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
  real home (AGENTS.md / HANDOVER.md / NKS), reset the stub.
- Global *user* preferences (language, working style) are agent-scoped and
  persist separately — this rule is about *project* state.

## Session lifecycle
NKS = the work (structure, open questions, what's next). Git = how it got here
(SHAs, branches, PRs). **Keep git refs out of NKS** — no SHAs, branch names,
PR numbers, or "shipped/merged" in nodes (go stale on rebase).
- **Start of session:** orient in NKS — the realm named in *What this project
  is*, focus holon if set; orient by the ACTIVE BIANHUA map (`lens="bianhua"`
  for the forest) — open work lives as anga-vimarshas on transformations; a
  `genre=hint` seed, if any, is a pointer for what the map doesn't carry. The
  `entry` skill runs the protocol.
- **Every push → update NKS.** Two moves, both required:
  - **Match reality.** Record what positions the change in the target system:
    architecture, module APIs, supply/delivery, user experience, integration
    with neighbouring code. Repo-only mechanics — lockfile churn, internal
    refactors with no outside impact, commands, file moves — stay in git, not
    NKS.
  - **Advance the map.** Close (visarjana) the vimarshas this push resolved;
    keep open work attached via `anga` to the bianhua it drives. A thin
    `genre=hint` seed is left only for what the graph can't carry —
    external-world state, chosen priorities; pointer, not payload
    (methodology #131) — never by default.

  `weaving` / `design` carry the *how* (closing vimarshas, threading
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
   the holon, close vimarshas the merge resolved (`weaving`).
4. Confirm cleanup is done before the next task.

## Working principles
1. **Think before coding.** State assumptions; ask when uncertain — name
   *what's* unclear, not just "which option". Surface competing
   interpretations; push back when a simpler approach or false premise is
   visible. Check repo + NKS before writing; fetch, don't recall. Hit the
   live system before trusting a type, a name, or a doc.
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
   absent). The `entry` skill runs the protocol.

## NKS ↔ repo: where things live
| Concern                                | Repo            | NKS                      |
|----------------------------------------|-----------------|--------------------------|
| Code, configs, lockfiles               | ✓               |                          |
| Commands, conventions, gotchas, stack  | ✓ (AGENTS.md)   |                          |
| Current branch state, how to verify    | ✓ (HANDOVER.md) |                          |
| Gaps in external systems we depend on  | ✓ (MISSING_*.md)|                          |
| Methodology, ontology                  |                 | ✓ (methodology realm)    |
| Design decisions, open questions       |                 | ✓ (vimarshas)            |
| Plans, task lists, session hand-offs   |                 | ✓ (project realm)        |
| Lessons, hand-offs                     |                 | ✓ (graph first; thin `genre=hint` for off-map remainder) |
| Commit history, PRs, SHAs              | git             | (never NKS)              |
<!-- HANDOVER.md and MISSING_*.md rows are optional — keep them only if the project uses those files; drop them otherwise. -->

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
- `HANDOVER.md` — current branch state shifts (branch, what's runnable/blocked).
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
  merged — e.g. PR into main, gh pr checks <n> --watch green, zero-conflict
  merge; or a manual "merged" announcement. Branch discipline points here for
  the signal, so fill this in.>`
- **Never** `--no-verify`, `--force`, `--no-gpg-sign`, or `git reset --hard`
  without explicit user instruction.
