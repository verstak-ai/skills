# align — aligning a repository to the AGENTS.md contract

**Use when:** the user says "align this repo", "verstak align", "set up AGENTS.md", "update AGENTS.md", "bring this project up to standard"; unasked, at the door's `Alignment` step: `AGENTS.md` missing, unstamped, stamped with a date or below this file's contract; a frontmatter hole naming a case (round 2); an `AGENTS.md` line contradicting the method or retelling it.

**Grounding:** knowledge passed forward sits where the next session meets it and points rather than copies. `AGENTS.md` holds repository facts and the way into the graph and the door. Decisions go on nodes, the conversation in the alignment case.

You produce `AGENTS.md` (read every session), `REALITY.md` (carriers, read before a behavioural claim and in `verifier`/`reviewer` briefs), a `CLAUDE.md` pointer, ritual hooks and a quality gate. Both files are *derived views*: a projection of sources (code, manifests, CI, graph) plus thin authored judgment, held to **density** (every line changes what the agent does) and **accuracy** (every derived line re-checked against its source this run); a dense false line is worse than a verbose one.

Templates: `templates/agents-template.md` and `templates/reality-template.md`. Fill the `<…>` slots, drop optional rows that don't apply, strip every `<!-- … -->` note and angle bracket. The template carries **repository facts only**; its first paragraph loads the `verstak` skill, so even a harness without a start hook reaches the door. Generic code work (before code, reviews, after merge, working principles) is `methods/code-work.md`, read through the door: never project it into `AGENTS.md`.

**Contract: `2`.** Step 7 stamps it into every `AGENTS.md`. Raise it by one only when a change here or in the templates makes an already generated file *wrong* (a section or file added, renamed or removed; a ritual changed; a tool name gone) — never for wording. The door's description carries the same number; a mismatch is a delivery defect (`methods/feedback.md`). A date, no stamp or a `verstakify: contract N` stamp ranks as the door's `Alignment` step says.

**Check the installed delivery first** — every run, and before concluding a method's instruction is wrong:

```
cat ~/.claude/plugins/cache/*/*/*/.claude-plugin/plugin.json   # what you are running
gh release view --repo verstak-ai/skills --json tagName         # what exists
node ~/.verstak-bridge/verstak-bridge.mjs --version             # which build the bridge copy carries
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
1. **Addresses.** Graph and role from the user, the window's paste line, or an existing `AGENTS.md`. No graph named → `verstak_realm(action="list")`, what is recorded about the repo, colleagues; still unclear → a question of principle, never a guessed name. The owner role is the `svatantra` role (the owner, holding the initiative) of the person whose keys you hold (`verstak_me(action="kartas")`); a list showing roles you yourself stand in means the binding is off — leave a hole, ask in the case. `kartas` sees only bound roles, so before creating one: `verstak_search(q="", node_type="karta", manifested_as="svatantra")`, the owner's has a `handle` attr matching `verstak_me(action="whoami")`; can't tell → one question to the session's user.
2. **The repository's holon.** `origin` → `host/org/repo` → `verstak_search(q="", node_type="holon", attrs_filter="repository:<value>")`. None → `verstak_add_holon` (`contains` from the root or the repositories holon) with `attrs.repository` and `open_room` for the alignment case. One repository, one holon. Found but the attr is missing → write it (`verstak_update`); different → don't overwrite: the same `org/repo` on another host is an alias (suggest switching `origin`; search `attrs_filter="repository:*org/repo*"`), anything else a fork or mirror — the user decides. A forge's "Not found" for the canonical name may only mean a private repo.
3. **The repository's role.** `verstak_search(q="", node_type="karta", steward_of=<holon>)`; none → `verstak_add_karta` (`manifested_as=adhikarin` — acting under a mandate; motivation distils what the repo ships) with `steward` to the holon. One role per repository.
4. **Frontmatter and files** (form: Step 7). Graph and code → `derived`; a recorded answer → `agreed: <who>`, a neighbouring holon's agent included; unresolved → empty value, source `not agreed — case #N`. The user being away doesn't make an authored slot a hole. Until carriers are resolved, `REALITY.md` holds the template heading and "Carriers not yet established; alignment case #N. Until they are, behavioural claims are not accepted."
5. **The alignment case** on the holon: an open one (`verstak_case(action="at", node=<holon>)`) → lead it; none → `open_room` on the holon's write or a `verstak_update` of it, titled in at most 64 characters: "Align <repo> to contract N". Register under the repository role and join before your first entry (the door, Survey). `designer` gets a child case (`open_room` with `parent_room`) in its launch line; its conduct is its role body (`references/align-delegation.md`). First message: "I have questions about the project I'm responsible for — answer them, or tell me who can." **The questionnaire, plan and progress never go into the graph** — only structure (holon, role) and gotchas as rules.
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
- **Cross-project memory** — template default, `derived: template default`, no question; missing `@handle/mind` → `methods/minding.md`. Never create or ask about a global instructions file.
- **Feedback reflection** (`methods/feedback.md`) — default **yes**, `derived: template default`, no question; **no** only on a recorded answer. The slot is all you write: `methods/code-work.md`, `After merge`, reads it.
- **Workflow suite** — only when a coercive one is found (its skills or plugin-cache directory; today superpowers): **full interop** (recommended: `references/align-superpowers-interop.md` plus the spec-write hook), **prose only**, or **skip** — its design sessions won't reach the graph.

### Step 2 — Bootstrap the graph
- The focus holon is the project boundary: design it with `methods/design.md` before round 1's `verstak_add_holon`; its `repository` attr (form: Step 2) is set on creation and refresh.
- **The agent role is the steward** of the focus holon — not a senior role, or orienting on the holon won't find who acts there. No owner role found → create and bind it the same way. Both seqs into the frontmatter.
- Every arrow gets a `sense`, so the next reader grasps this corner without opening the repo.
- **Holon + steward are the root of the integration scope** (`methods/code-work.md`, `Before code`); `AGENTS.md` lists no shared surfaces.

### Step 3 — Quality gate (the strictest the accepted mandate allows)
Per item: the strictest option for the stack, the trade-off in one line, the source per Step 1. A relaxation needs an accepted constraint calibrated by cost of breakage, recorded per tool; no grounds → a question of principle. **Tightening** a relaxed gate: measure first (run at the proposed strictness, count failures); it may go as a separate branch.
- **Linter**, strictest (`@typescript-eslint/strict`; Ruff `E,F,B,I,N,UP,RUF`; broad `golangci-lint`; `clippy -- -D clippy::pedantic`).
- **Formatter**, auto-fix (Prettier, `ruff format`, `gofumpt`, `rustfmt`); **type checker** strict (`tsc --strict`, `mypy --strict` / `pyright --strict`); all three in a pre-commit hook on staged files.
- **Tests** (unit for libraries; + integration for services; + e2e for UI; coverage threshold for production) → "Code conventions".
- **CI**: lint + type check + tests on every push, failing on warnings; mandatory for `production`.
- **The gate is one call** (`npm run gate`, `make check`, `just check`); `AGENTS.md` names it, CI calls the same. A hand-assembled gate drops a step and still ends green; if unavoidable, record why and what checks its completeness.
- **CI parity**: every check that can fail gates the PR (codegen, schema/doc generation, image build, migrations); an irreducible gap is a gotcha.

### Step 4 — Hooks
**The deliverable is rituals, not a file.** Wire *each* harness's surface in the working tree per `references/align-harness-surfaces.md` (Codex hooks live in `CODEX_HOME`, outside it — not wired). No surface → say which ritual isn't automated. Never guess a config format.

**A hook costs context**: one line plus a pointer to a door section or method, fired by the event itself; skip it if the line arrives another way (a tool description, the door); never teach the opposite rule (punishing a legitimate question to the user). Only the memory guard blocks.

Claude Code: `.claude/settings.json`, committed. **Merge, never overwrite** — other suites' entries stay. Envelope, escaping and filters: **byte for byte from `references/align-hooks.md`**, tested on its samples — an undoubled backslash mutes a filter forever behind `|| true`. A harness flagging the write as self-modification: write anyway, name it, read back that it landed. The hooks:
- **`SessionStart`** → load the `verstak` skill first, every session, before any action, and do the door's `Start` with the repo's addresses (graph, focus holon, agent and owner role seqs). Don't retell the start protocol.
- **`PostToolUse`/Bash — push** (`git push` succeeded, by outcome) → a push shipped nothing: self-review with the vocabulary pass, then cold review (`methods/code-work.md`).
- **`PostToolUse`/Bash — merge** (a forge merge merged the PR, or `git checkout main && git pull`) → the after-merge acts (`methods/code-work.md`, `After merge`); the message names its exception too (work tasked by another agent: seed and delivery modes only).
- **`PreToolUse` `Write|Edit|MultiEdit|NotebookEdit` — memory guard**: a path in the project-memory directory → **block** (exit 2, routing message on stderr). Both harnesses' refusals carry the route filled from the slots: the graph by name, the persistence section by its heading in this `AGENTS.md`, the personal graph; a bare ban is a projection defect.
- **`PostToolUse` `Write|Edit` — spec-write** (full interop only): a design/spec-looking path → design is recorded in the graph.
- **Branch freshness** — offer a pre-push hook (`references/align-hooks.md`).

OpenCode: a plugin in `.opencode/plugins/` from the template in `references/align-harness-surfaces.md`. The greeting's slots are filled from the frontmatter. From the repo root run `node ~/.verstak-bridge/verstak-bridge.mjs check-rituals` every run: exit 1 → each line names plugin, problem, fix — rewrite from the template, rerun, report. Checker missing → check against the reference yourself; say it didn't run.

Self-check: the four base hooks present; retired ones of yours (a `Stop` guard, a writing-moment pointer on write tools) removed; spec-write **iff** interop is `full`; `SessionStart` calls `Start`, not `entry`, with real addresses; `check-rituals` clean; no one else's entry lost.

### Step 5 — Repository hygiene
- Commit `.claude/settings.json`, ignore `.claude/settings.local.json` (under a broad `.claude/` ignore add `!.claude/settings.json`); check `git check-ignore -v .claude/settings.json .claude/settings.local.json`.
- **Tracked secrets/env**: `git ls-files '.env*' '*secret*' '*local*'`; a real one tracked → "Code conventions": `git update-index --skip-worktree <file>`, never `git add -A` / `commit -a`.
- Project-memory directory (`~/.claude/projects/<encoded-path>/memory/`): **evacuate, then freeze** — decisions → the graph; rituals → `AGENTS.md`; gotchas → per `Layout`; branch state → git and the PR; servers, dated debts → the project graph; the user's own facts → `methods/minding.md`; preferences → Step 1. Then `MEMORY.md` becomes a one-line stub ("state lives in the repo or the graph — see AGENTS.md, Persistence"). A stub over unread content destroys it.
- **Forge CLI — derive, don't assume GitHub**: `git remote -v` → `gh`, `fj` (Forgejo/Codeberg), `glab`, `tea` (Gitea); check installed and logged in; name it in "Git workflow" with the PR-watch command. Unknown host → ask.
- Content sections may be empty on day one, never `TBD`. **No `HANDOVER.md`**: evacuate it (git, the PR, the case, node modes) and delete it. The root `README.md` is short, for people.

### Step 6 — Delegation subagent roles
Doctrine, file templates and the satellite entry: `references/align-delegation.md`; never `AGENTS.md` prose.
- Claude Code, always: `.claude/agents/` `reader`, `searcher` (middle tier), `worker`, `designer`, `reviewer`, `verifier` (top tier) — aliases `sonnet`/`opus`, nothing on `haiku`. `verifier` and `reviewer` even with no runtime: they make `REALITY.md` and review executable. `searcher` is read-only; its candidates are accepted only after checking the node's neighbourhood. No role writes to the graph.
- OpenCode: the same six in `.opencode/agents/`, `mode: subagent`, model **pinned** per file from the user's setup (ask or read `opencode.json`), never copied from the reference; the top tier only Claude Opus or GPT-6.1 Sol.
- The satellite entry is one `node -e` form for every OS — copy it verbatim; no machine path.
- **Merge**: another suite's same-named agent → fold in or rename yours (`verstak-reader`); your earlier projection → rewrite the body above `## This repo` and carry that heading's tail as is: the repository's own lines (gate command, review canon, edit bans) live only there; an old file without the heading → sort by content, restore lost lines from the file's history; someone else's body → leave it.
- Self-check: files parse; each Claude Code file has its own `verstak-sub-<role>` entry (no shared entry, no `sh -c`); `doctor` from the repo root shows no `TODO:` lines; no body allows graph writes or acts on the shared bridge; an old `weaver` of yours deleted; pinned models exist; each `## This repo` tail identical before and after the run.
- A role projected this run may not be callable until restart — say so, and run this run's cold review as a generic subagent briefed with the role body, on a top-tier model only (a call parameter where the harness gives one; else the session's model if it is one; else no cold review — say so).

### Step 7 — Finalize
- Body → **`AGENTS.md`** (Codex and OpenCode read it natively); carriers → **`REALITY.md`**. **`CLAUDE.md`** by `git config core.symlinks`: symlinks work → `ln -s AGENTS.md CLAUDE.md`; not (Windows) → a byte-for-byte copy regenerated every run and listed in "What to update when", or a one-line `@AGENTS.md` (no backticks: a code span disables the import). Don't redo a working pointer. Codex's root→cwd merge, `AGENTS.override.md`: `references/align-harness-surfaces.md`.
- **Legacy config**: sections the template no longer has (`Session lifecycle`, reviews, branches, principles, integration scope, external surfaces, the feedback-reflection region) → delete, `methods/code-work.md` and the door own them; a repo fact inside (hook paths, forge) → its slot; a deliberate deviation → `Local overrides` with its reason. Other content with no slot → "Code conventions" or `Local overrides`; a Reality table in `AGENTS.md` moves to `REALITY.md` row by row, its dated observations to graph nodes; a substantive `CLAUDE.md` merges in and becomes the pointer; `Layout` files keep their content, links checked; `nks_*` names become `verstak_*`.
- Interop (full or prose-only): a `## Workflow-suite interop (superpowers)` section after `Local overrides`, the deployable part of `references/align-superpowers-interop.md`, stamped `*(interop: <full|prose-only> — verified against superpowers@<version> — re-check on suite upgrade)*`.
- **Accuracy pass** over **the whole artifact**: every derived line against its source; a line with no source is authored judgment (keep) or a guess (cut). **Density pass**: does the line change what the agent does? Canon blocks stay byte for byte.
- **Stamp**: the template's last line with this file's contract and today's date; overwritten on refresh, never two.
- **Frontmatter**: YAML from the first-line `---` to the closing `---`; flat pairs `'Graph': '@owner/slug (rN)'`, `'Graph — source': 'derived'`; slot names exactly as in the template, each with a ` — source` key valued `derived` / `agreed: <who>` / `not agreed — case #N`; single-quoted strings, inner quotes doubled; `Agreement` a case or `none`. An old frontmatter table moves over without losing values or sources. No harness service keys (e.g. `paths`). Check with a YAML parser; read `CLAUDE.md` against `AGENTS.md`.
- **Gotchas** live where `Layout` says: by default graph nodes on the holon, referenced as `(graph, #N)`; a `Layout` naming `GOTCHAS.md` keeps them as lines there, a node optional.
- **`REALITY.md`**: each carrier recorded, owner-confirmed, or marked `(proposed — case #N)`; reachability checked or bounded by Ceiling; no dated measurements; the `AGENTS.md` "Reality" section has no table rows.
- No `not agreed` without a case number, no `<…>` in a value, no `<!-- … -->` left.
- **Every skill and method name** in the projected files resolves on the repo's install channel — check the live registry: an uncallable name goes silent. A body shipped to several harnesses names tool calls, no invocation syntax.
- **Hand over**: a roadmap teaser (`methods/product-roadmap.md`, quick mode), the updated files, the open slots (case #N, on whom, waiting for what); round 2 continues without the user. Questions of principle go separately with the sources you checked — or say there are none. On an assignment, report to the case lead. Next: the alignment lands by `methods/code-work.md` (its own branch, reviews, after merge).
