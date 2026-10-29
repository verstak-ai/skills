# align — aligning a repository to the AGENTS.md contract

**Use when:** the user says "align this repo", "verstak align", "set up AGENTS.md", "update AGENTS.md", "bring this project up to standard"; unasked, at the door's `Alignment` step: `AGENTS.md` missing, unstamped, stamped with a date or below this file's contract; a repository bearing a sign of alignment but missing what align writes for the harness you run in (the door's Survey: Claude Code — the `SessionStart` entry, OpenCode — the rituals plugin; Codex and pi — cover and stamp only); a frontmatter hole naming a case (round 2); an `AGENTS.md` line contradicting the method or retelling it.

**Grounding:** knowledge passed forward sits where the next session meets it and points rather than copies. `AGENTS.md` holds repository facts and the way into the graph and the door. Decisions go on nodes, the conversation in the alignment case.

You produce `AGENTS.md` (read every session), `REALITY.md` (carriers, read before a behavioural claim and in `verifier`/`reviewer` briefs), a `CLAUDE.md` pointer, ritual hooks and a quality gate. Both files are *derived views*: a projection of sources (code, manifests, CI, graph) plus thin authored judgment, held to **density** (every line changes what the agent does) and **accuracy** (every derived line re-checked against its source this run); a dense false line is worse than a verbose one.

Templates: `templates/agents-template.md` and `templates/reality-template.md`. Fill the `<…>` slots, drop optional rows that don't apply, strip every `<!-- … -->` note and angle bracket. The template carries **repository facts only**; its first paragraph loads the `verstak` skill, so even a harness without a start hook reaches the door. Generic code work (before code, reviews, after merge, working principles) is `methods/code-work.md`, read through the door: never project it into `AGENTS.md`.

**Contract: `8`.** Step 7 stamps it into every `AGENTS.md`. Raise it by one only when a change here or in the templates makes an already generated file *wrong* (a section or file added, renamed or removed; a ritual changed; a tool name gone) — never for wording. The door's description carries the same number; a mismatch is a delivery defect (`methods/feedback.md`). A date, no stamp or a `verstakify: contract N` stamp ranks as the door's `Alignment` step says.

From contract 7: your six role files leave the index and go into `.gitignore` by name — the files stay on disk, others' agents untouched (Step 5); each file's repository tail moves into `AGENTS.md`, section `Role file tails`, and its model comes from the person's preferences (Step 6). Branch worktrees live inside the repository, in `.worktrees/` (ignored); abandoned trees and your trees' development caches are cleaned up (`methods/code-work.md`, `Branch and worktree`, `Cleanup`). Re-project `Git workflow` and `Persistence` from the template, and the tracked-secrets line of `Code conventions` (untrack and rotate; `skip-worktree` hides nothing).

From contract 6: the git and test rituals changed — one branch and PR per batch, review by the batch's tier, CI on the batch's PR and trunk, tests by the affected. Re-project `Git workflow` and `Test discipline` from the template; a line promising CI on every push, a light review on every finished branch, or a branch per item goes. Keeping a full gate instead of selection needs an explicit, applicable exception from the rule's principal in `Local overrides`; a cost measurement alone grants none. Re-project the push hook's text (Step 4) and the `reviewer` role body (`references/align-delegation.md`) above `## This repo`.

From contract 5: drop the cover's `Cross-project memory` slot and its source line — personal memory has no place in `AGENTS.md`.

From contract 4: re-project memory routing and guard messages through minding, with no constructed or stored personal address; refresh the ritual and delegation projections against their current references too. A changed counter calls an existing repository back; it does not prove that repository was re-aligned.

**Check the installed delivery first** — every run, and before concluding a method's instruction is wrong:

```
node ~/.verstak-bridge/verstak-bridge.mjs doctor          # what you are running: the bridge, each installed skill set against it
gh release view --repo verstak-ai/skills --json tagName   # what exists (doctor's "latest release" is a cache)
```

More than a patch behind → update, restart the harness sessions, then run the arc: a stale method's config inherits its defects.

## Audit → classify → act
Existence doesn't prove accuracy. Audit each concern against its source: **absent** → derive it (an authored slot without a checkable source goes to the alignment case); **stale** → re-project; **correct** → leave it. Check the *almost right* config in Step 7's accuracy pass.

### Source of truth per concern
| Concern | Source of truth | How to check |
|---|---|---|
| Versions, dependencies | `package.json` / `pyproject.toml` / `go.mod` / `Cargo.toml` + lockfile | read |
| build/test/lint/dev commands | scripts, `Makefile`/`Justfile`, CI workflow | read; `--help` or a dry run where cheap |
| Quality gate | linter config, `tsconfig`, CI yaml | read |
| Layout: code map, environment traps | the `Layout` slot | Default: a file map in each component's README (the run writes none; meanwhile "Project structure" holds it and the first to touch the component moves it), gotchas in the graph. A section *instead of* READMEs only where a README beside shipped outputs is forbidden. An existing `GOTCHAS.md`: a hole until Step 1, files untouched |
| Project structure, path aliases | file system + bundler config; component READMEs | glob / list; the "component → README" table by the files existing |
| Nature, consumers, cost of breakage, relaxations | the graph, the code, what agents say; accepted constraints are kept | Step 1 order; changing the mandate or cost of breakage without grounds is a question of principle |
| Reality carriers (`REALITY.md`) | proposed from the graph and the delivery path the code shows; confirmed by the owner when not already recorded | the carrier is reachable; unknown → Ceiling, never an invented carrier |
| Design decisions, why-clauses, open questions | the graph — linked, not copied | `verstak_orient` / `verstak_search`, then `verstak_look` on each hit and its arrows |
| Branch state | git + forge | `git status` / `log`; the forge CLI |
| Gotchas | authored; home per `Layout` | sanity check only — don't derive or move them |
| Graph canon blocks | a rule node with `attrs.prose_for_repos` | `verstak_search(realm=<graph>, q="", attrs_filter="prose_for_repos:**")`; byte for byte where `attrs.prose_anchor` says (none → `Local overrides`), only the repo's own tail below; applicability by `attrs.scope`, else by meaning; doubt → Step 1 order |

Derived facts are re-projected every run; authored judgment (gotchas, why-clauses, nature, carriers) is kept and sanity-checked.

## Output contract — density and accuracy
1. **Imperative**: "orient before code", not "the agent should".
2. **Every line changes what the agent does**, or it goes.
3. **No rationale, no retelling of the graph, the door or a method** — link. `(why: …)` only for an invariant the agent would otherwise break.
4. **Tables and bullets**, one directive each; a section grown into paragraphs carries rationale — move it to the graph.

Orchestration mechanics (gate chains, model routing) are out of scope; delegation is role files (Step 6).

## Procedure
Idempotent: in a mature repo, run every self-check, act only on failures, report the rest.

## Two rounds
**Who runs the alignment.** The graph work — holon, role, attrs, the alignment case — is yours. The bulk file projection may go to a `designer` subagent on its own satellite bridge; none available → project it yourself. Whoever launched the run leads the alignment case. The run doesn't wait for the user to be present or confirm.

**Round 1 · Stand up — no questions, under a minute, any repository.** What resolves quickly goes into the file with its source; the rest is a hole held in the case; then round 2 without waiting.
1. **Addresses.** Graph and role from the user, the window's paste line, or an existing `AGENTS.md`. No graph named → `verstak_realm(action="list")`, what is recorded about the repo, colleagues; still unclear → a question of principle, never a guessed name. **No working graph at all**, or none of the three signs of alignment (the door's Survey) → `methods/onboarding.md` first; this round resumes at step 2 once it hands back. No person present → stop before step 2; the hand-over says onboarding waits for them. The owner role is the `svatantra` role (the owner, holding the initiative) of the person whose keys you hold (`verstak_me(action="kartas")`); a list showing roles you yourself stand in means the binding is off — leave a hole, ask in the case. `kartas` sees only bound roles, so before creating one: `verstak_search(q="", node_type="karta", manifested_as="svatantra")` in the chosen graph and read fitting candidates. A role is the person's by its user binding, never a handle, name or attribute match. An unbound candidate needs the person's confirmation before `user="me"` is written; can't tell → one question to the session's user, or the alignment case when they are absent.
2. **The repository's holon.** `origin` → `host/org/repo` → `verstak_search(q="", node_type="holon", attrs_filter="repository:<value>")`. None → `verstak_add_holon` (`contains` from the root or the repositories holon) with `attrs.repository` and `open_room` for the alignment case. One repository, one holon. Found but the attr is missing → write it (`verstak_update`); different → don't overwrite: the same `org/repo` on another host is an alias (suggest switching `origin`; search `attrs_filter="repository:*org/repo*"`), anything else a fork or mirror — the user decides. A forge's "Not found" for the canonical name may only mean a private repo.
3. **The repository's role.** `verstak_search(q="", node_type="karta", steward_of=<holon>)`; none → `verstak_add_karta` (`manifested_as=adhikarin` — acting under a mandate; motivation distils what the repo ships) with `steward` to the holon. One role per repository.
4. **Frontmatter and files** (form: Step 7). Graph and code → `derived`; a recorded answer → `agreed: <who>`, a neighbouring holon's agent included; unresolved → empty value, source `not agreed — case #N`. The user being away doesn't make an authored slot a hole. Until carriers are resolved, `REALITY.md` holds the template heading and "Carriers not yet established; alignment case #N. Until they are, behavioural claims are not accepted."
5. **The alignment case** on the holon: an open one (`verstak_case(action="at", node=<holon>)`) → lead it; none → `open_room` on the holon's write or a `verstak_update` of it, titled in at most 64 characters: "Align <repo> to contract N". Take your seat under the repository role and join before your first entry (the door, Survey). `designer` gets a child case (`open_room` with `parent_room`) in its launch line; its conduct is its role body (`references/align-delegation.md`). First message: "I have questions about the project I'm responsible for — answer them, or tell me who can." **The questionnaire, plan and progress never go into the graph** — only structure (holon, role) and gotchas as rules.
6. **Of Step 4, only `SessionStart` and the memory guard**; the `MEMORY.md` stub only over an empty or missing memory directory — a non-empty one waits for round 2 (Step 5), the freeze line pointing at the case meanwhile.

Report in the alignment case (resolved, open) — also when started from another case, naming it there. Then the Step 7 handover.

**Round 2 · Finish — on your own, without blocking.** Each later start reads the `Agreement` case as the door's `Alignment` step says and resolves slots in Step 1 order without re-asking. An agent's answer is signed with its name, not re-confirmed by the user. The full arc (Steps 1, 3–6) runs without the user; an unresolved slot holds only what depends on it. All resolved → `Agreement` = `none` and `propose_close` with the filled slots as evidence if you lead; else a message to the lead.

### Step 1 — Resolve the slots
Read the graph, the code and the old config; don't pick defaults silently. Record value and source for **Nature** (not `production` → what is relaxed and why), the **graph**, `Stack`, the **gate**. Keep accepted authored constraints. The user is usually absent, so every "agree / ask / confirm" means:
1. **Do everything that doesn't depend on the answer** — audit, derivable facts, gate, hooks.
2. **Graph and code, then sibling agents of neighbouring holons.** What stays open is a message in the one alignment case, never a node or a case per slot: `verstak_case(action="invite")` those who know and `say` the question.
3. **Only the residue of principle goes to the user, through the case lead**: changing the mandate, an accepted constraint or the cost of breakage; choosing or creating the graph; confirming a reality carrier not already recorded; a source conflict you can't resolve. A missing answer alone is not. Name what you checked and whom you asked. The lead `invite`s the user's seat; no seat → their role with the holon (`karta=<owner role>`, `holon=<repository holon>`); nothing reachable → the question waits, the work goes on.
4. **A hole, not a guess**: value `''`, source `'not agreed — case #N'`, `Agreement` names the case.

Write each answer at once; slots don't wait for each other.

**Old questionnaire.** `Agreement` or a hole names a node (`#N`) → `verstak_look`: named answers → `agreed: <who>`; open ones → holes held in the case. Release the node (`visarjana`, reasoning "moved to case #N"); not yours → message its author.

Also settle:
- **Shared mutable build/test state** (database, fixed port, dev server, global cache, cloud sandbox) → per-lane isolation as gotchas: agents run branches concurrently in separate worktrees.
- **Reality** → `REALITY.md`. Push each claim class to its *canonical carrier*: the built artifact, not the sources; the live endpoint, not the handler; a clean install, not a warm cache. Recorded in the graph or a named answer → write it; new → propose it in the alignment case and write the row with `(proposed — case #N)` after its class until the owner confirms. No reachable observation → *Ceiling* with the reason. `AGENTS.md` gets a "Reality" pointer naming the first row.
- **No personal memory in `AGENTS.md`** — no slot, no rule: where the user's own lives and when it is read are the door's (the start slice) and `methods/minding.md`'s; an older cover's personal-memory slot and its source line go on this run. Establish personal memory through minding's entry (`realm="mind"`). Never construct or persist its address, create or ask about a global instructions file.
- **Feedback reflection** (`methods/feedback.md`) — default **yes**, `derived: template default`, no question; **no** only on a recorded answer. The slot is all you write: `methods/code-work.md`, `After merge`, reads it.
- **Workflow suite** — only when a coercive one is found (its skills or plugin-cache directory; today superpowers): **full interop** (recommended: `references/align-superpowers-interop.md` plus the spec-write hook), **prose only**, or **skip** — its design sessions won't reach the graph.

### Step 2 — Bootstrap the graph
- The focus holon is the project boundary: design it with `methods/design.md` before round 1's `verstak_add_holon`; its `repository` attr (form: Round 1, step 2) is set on creation and refresh.
- **No working graph** → never `verstak_realm(action="create")` from here: `methods/onboarding.md` asks the area, continues a graph the person was invited to, creates one only on their word, then hands back.
- **The agent role is the steward** of the focus holon — not a senior role, or orienting on the holon won't find who acts there. No owner role found → `methods/onboarding.md`, step 3: explained, proposed with a name and motivation from the repository, bound on the person's word — never asked for bare. Both seqs into the frontmatter.
- Every arrow gets a `sense`, so the next reader grasps this corner without opening the repo.
- **Holon + steward are the root of the integration scope** (`methods/code-work.md`, `Before code`); `AGENTS.md` lists no shared surfaces.

### Step 3 — Quality gate (the strictest the accepted mandate allows)
Per item: the strictest option for the stack, the trade-off in one line, the source per Step 1. A relaxation needs an accepted constraint calibrated by cost of breakage, recorded per tool; no grounds → a question of principle. **Tightening** a relaxed gate: measure first (run at the proposed strictness, count failures); it may go as a separate branch.
- **Linter**, strictest (`@typescript-eslint/strict`; Ruff `E,F,B,I,N,UP,RUF`; broad `golangci-lint`; `clippy -- -D clippy::pedantic`).
- **Formatter**, auto-fix (Prettier, `ruff format`, `gofumpt`, `rustfmt`); **type checker** strict (`tsc --strict`, `mypy --strict` / `pyright --strict`); all three in a pre-commit hook on staged files.
- **Tests** (unit for libraries; + integration for services; + e2e for UI; coverage threshold for production) → "Code conventions". Name how the gate runs only the affected modules and their direct compositions and reuses results by content (`methods/code-work.md`, `Tests and CI`); missing → say so in the slot and close the gap in the batch, unless an explicit exception from the rule's principal covers this repository. Record its scope in `Local overrides`; measuring cost is evidence for a request, not permission.
- **CI**: lint + type check + tests on the batch's PR and on trunk, not on every branch push, failing on warnings; mandatory for `production`. Read the triggers from the CI yaml; don't write the slot from the rule.
- **The gate is one call** (`npm run gate`, `make check`, `just check`); `AGENTS.md` names it, CI calls the same. A hand-assembled gate drops a step and still ends green; if unavoidable, record why and what checks its completeness.
- **CI parity**: every check that can fail gates the PR (codegen, schema/doc generation, image build, migrations); an irreducible gap is a gotcha.

### Step 4 — Hooks
**The deliverable is rituals, not a file.** Wire *each* harness's surface in the working tree per `references/align-harness-surfaces.md` (Codex hooks live in `CODEX_HOME`, outside it — not wired). No surface → say which ritual isn't automated. Never guess a config format.

**A hook costs context**: one line plus a pointer to a door section or method, fired by the event itself; skip it if the line arrives another way (a tool description, the door); never teach the opposite rule (punishing a legitimate question to the user). Only the memory guard blocks.

Claude Code: `.claude/settings.json`, committed. **Merge, never overwrite** — other suites' entries stay. Envelope, escaping and filters: **byte for byte from `references/align-hooks.md`**, tested on its samples — an undoubled backslash mutes a filter forever behind `|| true`. A harness flagging the write as self-modification: write anyway, name it, read back that it landed. The hooks:
- **`SessionStart`** → load the `verstak` skill first, every session, before any action, and do the door's `Start` with the repo's addresses (graph, focus holon, agent and owner role seqs). Don't retell the start protocol.
- **`PostToolUse`/Bash — push** (`git push` succeeded, by outcome) → self-review with the vocabulary pass; choose the review tier for the finished batch (`methods/code-work.md`, `Cold review`). Copy the shell-safe push envelope from `references/align-hooks.md`, `Push reminder envelope`, then parse the assembled command with `/bin/sh -n` before installing it.
- **`PostToolUse`/Bash — merge** (a forge merge merged the PR, or `git checkout main && git pull`) → the after-merge acts (`methods/code-work.md`, `After merge`); the message names its exception too (work tasked by another agent: seed and delivery modes only).
- **`PreToolUse` `Write|Edit|MultiEdit|NotebookEdit` — memory guard**: a path in the project-memory directory → **block** (exit 2, routing message on stderr). Both harnesses' refusals name the project graph and this `AGENTS.md`'s persistence section, and route personal content through minding's entry without a personal address; a bare ban or a constructed mind locator is a projection defect.
- **`PostToolUse` `Write|Edit` — spec-write** (full interop only): a design/spec-looking path → design is recorded in the graph.
- **Branch freshness** — offer a pre-push hook (`references/align-hooks.md`).

OpenCode: a plugin in `.opencode/plugins/` from the template in `references/align-harness-surfaces.md`. The greeting's slots are filled from the frontmatter. From the repo root run `node ~/.verstak-bridge/verstak-bridge.mjs check-rituals` every run: exit 1 → each line names plugin, problem, fix — rewrite from the template, rerun, report. Checker missing → check against the reference yourself; say it didn't run.

Self-check: the four base hooks present; retired ones of yours (a `Stop` guard, a writing-moment pointer on write tools) removed; spec-write **iff** interop is `full`; `SessionStart` calls `Start`, not `entry`, with real addresses; `check-rituals` clean; no one else's entry lost. Exercise each memory guard without executing a write: the Claude Code shell command receives tool-input JSON for a forbidden memory path and an allowed repository path, exits 2/0 respectively; for OpenCode, load the projected plugin in an isolated Node process, call `setup` with a fake context for this directory, capture `tool.hook("execute.before", callback)`, then call that callback with `tool="write"`, `sessionID` and `input.path` for both paths — rejection/resolution respectively. Stub the event stream empty and session reads to that directory; never call the real write tool. Both refusals route personal content through minding and contain no constructed or stored mind address. This checks the projected guard, not a live harness loading it; presence of an older hook does not pass.

### Step 5 — Repository hygiene
- Commit `.claude/settings.json`; ignore `.claude/settings.local.json`, `.worktrees/` (branch worktrees) and your six role files by name in `.claude/agents/` and `.opencode/agents/` (a projection on the machine with the person's model, Step 6; others' agents in those directories untouched); under a broad `.claude/` ignore add `!.claude/settings.json`. Your role files already tracked → `git rm --cached` by the same names; the files stay on disk. Check `git check-ignore -v .claude/settings.json .claude/settings.local.json .worktrees/x .claude/agents/reviewer.md .opencode/agents/reviewer.md`, and that `git ls-files` names none of your six.
- **Tracked secrets/env**: `git ls-files '.env*' '*secret*' '*local*'`; a real one tracked → untrack it (`git rm --cached <file>`, then ignore it) and rotate the secret: history still holds it, and rewriting history is the owner's word. `git update-index --skip-worktree` only keeps local edits out of commits — it hides nothing. "Code conventions": never `git add -A` / `commit -a`.
- Project-memory directory (`~/.claude/projects/<encoded-path>/memory/`): **evacuate, then freeze** — decisions → the graph; rituals → `AGENTS.md`; gotchas → per `Layout`; branch state → git and the PR; servers, dated debts → the project graph; the user's own facts and working preferences → `methods/minding.md`; the project's rules and process → Step 1. Then `MEMORY.md` becomes a one-line stub ("state lives in the repo or the graph — see AGENTS.md, Persistence"). A stub over unread content destroys it.
- **Forge CLI — derive, don't assume GitHub**: `git remote -v` → `gh`, `fj` (Forgejo/Codeberg), `glab`, `tea` (Gitea); check installed and logged in; name it in "Git workflow" with the PR-watch command. Unknown host → ask.
- Content sections may be empty on day one, never `TBD`. **No `HANDOVER.md`**: evacuate it (git, the PR, the case, node modes) and delete it. The root `README.md` is short, for people.

### Step 6 — Delegation subagent roles
Doctrine, file templates and the satellite entry: `references/align-delegation.md`; never `AGENTS.md` prose.
- Claude Code, always: `.claude/agents/` `reader`, `searcher` (middle tier), `worker`, `designer`, `reviewer`, `verifier` (top tier); nothing on `haiku`. `verifier` and `reviewer` even with no runtime: they make `REALITY.md` and review executable. Only `designer` may update many nodes touched by an already made decision, on its own satellite bridge with the launcher's check (`references/align-delegation.md`, rule 6); the other roles are read-only. `searcher` candidates are accepted only after checking the node's neighbourhood.
- OpenCode: the same six in `.opencode/agents/`, `mode: subagent`.
- **The person chooses each role's model; role files are a projection on the machine.** Each tier's model comes from the person's preferences about working with agents in their personal memory (**minding**, the agents slice) — not from `opencode.json`, a default alias or an id in the reference. No such preference → ask them by a card (through whoever launched you) and record the answer by **minding**; until then, set no pin. The norm of the choice: Haiku for no role; the top tier only Claude Opus or GPT-6.1 Sol. Your files with their pins stay out of git (Step 5); their repository tail lives in `AGENTS.md` (`references/align-delegation.md`, "The repository tail").
- The satellite entry is one `node -e` form for every OS — copy it verbatim; no machine path.
- **Merge**: another suite's same-named agent → fold in or rename yours (`verstak-reader`); your earlier projection → rewrite the body from the current block and put the tail from `AGENTS.md` under `## This repo` (`references/align-delegation.md`, "The repository tail"); an old file without the heading → sort by content, restore lost lines from the file's history; someone else's body → leave it.
- Self-check: files parse; each Claude Code file has its own `verstak-sub-<role>` entry (no shared entry, no `sh -c`); `doctor` from the repo root shows no `TODO:` lines; only `designer`'s body allows graph writes — the assigned update of many touched nodes, on its own satellite bridge with the launcher's check — and no body acts on the shared bridge; an old `weaver` of yours deleted; pinned models are the person's choice and exist; your six are out of the index and `git check-ignore` catches them; every line under each file's `## This repo` and every frontmatter key beyond the block stands in `AGENTS.md`, `Role file tails`, and is back in the file after the run.
- A role projected this run may not be callable until restart — say so, and run this run's cold review as a generic subagent briefed with the role body, on a top-tier model only (a call parameter where the harness gives one; else the session's model if it is one; else no cold review — say so).

### Step 7 — Finalize
- Body → **`AGENTS.md`** (Codex and OpenCode read it natively); carriers → **`REALITY.md`**. **`CLAUDE.md`** by `git config core.symlinks`: symlinks work → `ln -s AGENTS.md CLAUDE.md`; not (Windows) → a byte-for-byte copy regenerated every run and listed in "What to update when", or a one-line `@AGENTS.md` (no backticks: a code span disables the import). Don't redo a working pointer. Codex's root→cwd merge, `AGENTS.override.md`: `references/align-harness-surfaces.md`.
- **Legacy config**: sections the template no longer has (`Session lifecycle`, reviews, branches, principles, integration scope, external surfaces, the feedback-reflection region, the `Cross-project memory` slot and its source) → delete, `methods/code-work.md` and the door own them; a repo fact inside (hook paths, forge) → its slot; a deliberate deviation → `Local overrides` with its reason. Other content with no slot → "Code conventions" or `Local overrides`; a Reality table in `AGENTS.md` moves to `REALITY.md` row by row, its dated observations to graph nodes; a substantive `CLAUDE.md` merges in and becomes the pointer; `Layout` files keep their content, links checked; `nks_*` names become `verstak_*`.
- Interop (full or prose-only): a `### Workflow-suite interop (superpowers)` section after `Local overrides`, the deployable part of `references/align-superpowers-interop.md`, stamped `*(interop: <full|prose-only> — verified against superpowers@<version> — re-check on suite upgrade)*`.
- **Accuracy pass** over **the whole artifact**: every derived line against its source; a line with no source is authored judgment (keep) or a guess (cut). **Density pass**: does the line change what the agent does? Canon blocks stay byte for byte.
- **Stamp**: the template's last line with this file's contract and today's date; overwritten on refresh, never two.
- **Frontmatter**: YAML from the first-line `---` to the closing `---`; flat pairs `'Graph': '<the address verbatim from verstak_realm(action="list")> (rN)'`, `'Graph — source': 'derived'`; slot names exactly as in the template, each with a ` — source` key valued `derived` / `agreed: <who>` / `not agreed — case #N`; single-quoted strings, inner quotes doubled; `Agreement` a case or `none`. An old frontmatter table moves over without losing values or sources. No harness service keys (e.g. `paths`). Check with a YAML parser; read `CLAUDE.md` against `AGENTS.md`.
- **Gotchas** live where `Layout` says: by default graph nodes on the holon, referenced as `(graph, #N)`; a `Layout` naming `GOTCHAS.md` keeps them as lines there, a node optional.
- **`REALITY.md`**: each carrier recorded, owner-confirmed, or marked `(proposed — case #N)`; reachability checked or bounded by Ceiling; no dated measurements; the `AGENTS.md` "Reality" section has no table rows.
- No `not agreed` without a case number, no `<…>` in a value, no `<!-- … -->` left.
- **Every skill and method name** in the projected files resolves on the repo's install channel — check the live registry: an uncallable name goes silent. A body shipped to several harnesses names tool calls, no invocation syntax.
- **Hand over**: a roadmap teaser (`methods/product-roadmap.md`, quick mode), the updated files, the open slots (case #N, on whom, waiting for what); round 2 continues without the user. Questions of principle go separately with the sources you checked — or say there are none. A run entered from onboarding → its steps 5–6 (`methods/onboarding.md`) follow the hand-over. On an assignment, report to the case lead. Next: the alignment lands by `methods/code-work.md` (its own branch, reviews, after merge).
