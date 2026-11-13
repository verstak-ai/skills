---
verstak:
  graph: r5
  holon: 844
  agent_role: 8498
  contract: 15
  stamp: 2026-11-13
---
# `verstak-ai/skills`
The `verstak` skill — one door and its methods, `align` among them, which bootstraps any repo to this standard — plus the bundled `verstak-bridge`; consumed by agents in other repos.

## Project
- **Nature**: library — a reusable skill corpus consumed by agents in other repos; relaxed vs production: the prose has no behavioural tests (gate = format + surface lint, substance by human review of the diff); the bundled verstak-bridge is the exception and carries a behavioural suite (make test)
- **Cost of breakage**: a wrong instruction (e.g. a tool the surface dropped) silently degrades every agent that loads the skill; keeping the corpus in sync with the tool surface is the core maintenance obligation
- **Consumers**: agents in other repos that load the installed skill every session; they learn of breakage only as method drift, never a crash; the bridge's failures land on a human whose browser login went nowhere
- **Stack**: Markdown skill corpus (one door, methods, references, templates) packed into verstak.skill; the bridge in TypeScript under js/ (the sibling core + our delivery layer), built by esbuild into dependency-free files; Node + bash for build and gate; Claude Code plugin marketplace versioned by release-please
- **Gate**: make check (validate + check-bundles + check-surface + check-core + lint + format-check + typecheck + check-js + test); CI runs the same targets
- **Layout**: code map: docs/STRUCTURE.md (no component READMEs: anything under skills/verstak/ ships in the bundle); traps: graph nodes on #844
- **Feedback reflection**: yes — default
- **Workflow-suite interop**: none

**Load the `verstak` skill first, every session, before any action**, and do the door's `Start` with the addresses above. Code work follows its `methods/code-work.md`. This file holds only this repository's own facts; a line contradicting the method → the door, `Start`, `Alignment`.

**Refused tools:** `AskUserQuestion` (Claude Code) and `question` (OpenCode) — the blocking question tool (why, and how to ask instead: `methods/collaborate.md`, `Asking the user`): ask in words someone answering now, and a question that outlives the turn as an `ask` card in the case. Held, not by this line alone, by: whatever the harness — `.claude/settings.json` `permissions.deny` and the `question` policy in `.opencode/opencode.json`; where the Claude Code plugin is loaded — the verstak plugin's hook; where the delivered OpenCode plugin is loaded — its refusal of `question`.

Owned there, not restated here: start and the #8498 inbox (door, `Start`), branch and worktree, self- and cold review, the after-merge acts, asking in prose never a picker (`methods/code-work.md`), ending questions by axis (`methods/inquiry.md`).

## Persistence
- State lives in the repo or the graph. The harness's built-in memory is forbidden entirely; what a finished piece leaves behind — scratch, worktrees, caches, cases you no longer owe a move — is cleaned up with it (`methods/code-work.md`, `Cleanup`). Only committed files and the project graph configure agents.
- The memory directory (`~/.claude/projects/-Users-...-skills/memory/`) does not exist here; don't create it — not for a project fact, a preference or a note on working style. The harness's own memory instruction says it exists and invites a `project` category; this file overrides it, and the `PreToolUse` guard in `.claude/settings.json` blocks the write (exit 2). Where a fact goes: the door, `Routes`, Keep — here work state and questions are vimarshas in `r5`, this project's servers and dated duties are `r5` nodes with the date in `attrs`.
- `skills/verstak/` is the source of truth. `verstak.skill`, `~/.claude/skills/` and the plugin cache are derived: never read one as the method or edit it.
- The start, push and merge hooks and the guard sit in `.claude/settings.json` for the transition (`Local overrides`); add beside other suites' entries. Hook text is English.

## Where things live
| Concern | Home |
|---|---|
| Skill source, bridge, build, manifests, conventions | repo (`skills/verstak/`, `scripts/`, `.claude-plugin/`), this file |
| Gotchas | graph nodes on #844 |
| Branch state, work in flight | git + PR with the case number; node modes and the transformation's seed (`methods/writing.md`, Decision 5) |
| Decisions, plans, questions of substance | `r5`: nodes, vimarshas `anga` to the transformations on #844 |
| The model of each shipped method | `r5`: its pair (below) |
| One-off tasks, conversation | a case |
| Commit history, PRs, SHAs | git, never the graph |

No `HANDOVER.md`.

## Graph work here
- **Every method is a pair in `r5`, mapped by steps.** The **phenomenon** (`given_as=vollzug`, "Method NAME", #845…) names what the method is and how kriyas touch it — never a summary of the method file. The **applying kriya** (#924…) is the method as it runs: one `contains`-child per protocol phase, each with its own pariṇāma, `ahara`/`utpatti`, `actor`, `next` into each tool-kriya it calls (#296, #309, #859…) and `upadhi` to each method it composes (autonomous's close → weaving #848).
- A phase whose actor is not the agent — owner acceptance of a telos, goal or gate — is its own kriya (#1583, #1619, #1658, #1678): one kriya, one actor.
- New method → a new pair, decomposed the same way; a changed protocol → its sub-kriyas move with it. The pair corresponds to the shipped file, which stays the source of truth. (why: the step map steers skill development — a tool rename's blast radius, a method's real composition and its drift from the methodology canon become traversals, and a mismatch surfaces as a tension, not a hunch.)
- **Releasing a vimarsha** (`visarjana`) is yours only when the answer stands as a node, the repo shows it, and reality shows it as far as reachable (where not, the user's word, asked for). Short of all three, prepare the release and present it to #1226. Each node's `Carrier:` line names the mode that closes it.
- **Skill ↔ tool sync is the recurring driver:** a tool renamed or dropped on the surface (the #833 waves) → the matching skill edits land here in the same unit of time.

## Reality
Before saying "works", or switching a mode or ending a question on a claim about execution, read your claim class's row in `REALITY.md` (other changes name their own grounds and the rightful act); it goes whole into a `verifier` or `reviewer` brief. First row: Format — `make check` against the committed `verstak.skill` and `skills/verstak/`. Its Ceiling (whether a reader of a skill then acts differently) is never closed as verified.

## Shared surfaces
Touching one obliges checking the others. Found by graph traversal, not by grep — a rule with several consumers looks like one ordinary node.

| Surface | Consumers | Note |
|---|---|---|
| `skills/verstak/templates/agents-template.md` | every repo align will ever bootstrap | changing a section changes configs already generated — that is what the contract counter is for |
| Frontmatter contract (`scripts/validate-skills.mjs`) | the one `SKILL.md` door | three keys and no others; methods, references and templates have no frontmatter |
| Client output limit (`scripts/validate-skills.mjs`, section 5) | OpenCode, which cuts every tool's output at 2000 lines / 51 200 bytes: the skill tool on the door, the read tool on methods, references and templates; the read tool also cuts each line at 2000 characters | the tail past the cut never reaches the model; a line over 2000 characters in the door, a method, reference or template is split into paragraphs at sentence boundaries; an overgrown file is recomposed — mechanics verbatim into `references/` with a mandatory pointer in place — never trimmed; `SKILL_OUTPUT_SIZES=1` prints the sizes (#7597) |
| `methods/assistant.md`'s `## Map`, every method but `product-roadmap`, the door and the references and templates they point to, their descriptions in `scripts/build-home.mjs` | the verstak.ai conversation home, which reads `home/` by name and lifts the Map into its prompt | one `## Map` heading, at most 1500 code points; `load_skill` opens one file by name and the home reads no other, so every pointer becomes a catalogue name (a method **X**, a reference or template `X`, the door `verstak`) or a rewrite in `build-home.mjs`, else the build fails; a new reference or template a method points to joins the catalogue there and in `HOME_SKILLS` (`scripts/validate-skills.mjs`) |
| `collaborate` address-line contract | this skill + the bridge that relays a human onto an agent's channel | deliberately duplicated: neither side can read the other's copy, so drift is caught by meaning alone |
| grundsatz nodes in #844 (writing/placement rules) | several applying kriyas each, via `upadhi` | a duplicate principle grows here unseen — one rule under two nodes with disjoint consumers, fixed on one and stale on the other |
| Sibling delivery (holon #1506) | its own deployment, on a separate graph instance | a realm address hardcoded in a skill does not survive the crossing |
| The bridge core `js/{bridge,shared,opencode,extension,watchdog,cli}` | the sibling delivery, which owns it; our build | copied byte for byte, pinned by `js/core.lock`; a core change lands upstream with its suite and comes here by `scripts/sync-core.sh` |
| The export set of `js/delivery/index.ts` | every core file (it imports the layer by this one path) | a missing or reshaped export is a `make typecheck` error in the core; a new core export lands here in the same sync |
| The skill layout: `js/delivery/product.ts` (`BRIDGE_SKILL`, `BRIDGE_FILE`, `PLUGIN_FILE`, `SKILL_STAMP_MASK`), the output paths in `js/build.mjs`, `js/tests/built.mjs`, `scripts/check-outputs-frozen.sh`, `.mcp.json`, `hooks/hooks.json` (the onboarding and rituals hooks' paths), `.codex-plugin/plugin.json`, `SETUP.md` | the core's set recognition (`verstak/SKILL.md` + `verstak/scripts/verstak-bridge.mjs`), self-update downloads, doctor, the plugin's MCP entry, installers | one layout named in several places; moving the bridge moves all of them, and bridges already released keep fetching their own path |

## Stack
- Distributed as a Claude Code plugin marketplace (`verstak@verstak-ai`) and a Codex plugin of the same name, semver in `.claude-plugin/plugin.json`, bumped by **release-please** from the Conventional Commits on `main` (feat → minor, feat!/BREAKING → major, else patch): merging its release PR writes the version, tags `vX.Y.Z` and cuts a GitHub Release with a `CHANGELOG.md` entry. Never by hand.
- No runtime dependencies: every shipped file is dependency-free. The bridge is TypeScript under `js/` — the sibling delivery's core copied as is plus our English delivery layer `js/delivery/` — built by esbuild with a dev-only toolchain and the only lockfile in `js/` (Node 22, `.nvmrc`; never at the root: Claude Code runs `npm ci` on a plugin whose root carries one).
- The committed JS outputs (`skills/verstak/scripts/verstak-bridge.mjs`, `skills/verstak/scripts/opencode-plugin.js`, `extensions/verstak.js`, `hooks/onboard.mjs`, `hooks/rituals.mjs`) are a **release build**, written only by the release job (`make build-release` in `bundle-sync`); a working copy builds dev into `dist/dev/`, which the tests run.
- CI: format and surface lint for the corpus, the JS ladder (core boundary, lint, format, types, release-build check) and behaviour for the bridge — `.github/workflows/ci.yml`.

## Commands
Edit the source under `skills/verstak/` directly — no unzip dance.

| Task | Command |
|---|---|
| Search the corpus | `grep` over `skills/` (plain text) |
| Rebuild the bundle and `home/` | `make build` (dev JS build into `dist/dev/`, then `verstak.skill` and `home/`; the pre-commit hook does it) |
| Enable the pre-commit hook, once per clone | `make hooks` (`core.hooksPath -> .githooks`) |
| Install the JS toolchain, once per clone | `make deps` (`npm ci` in `js/`) |
| Inspect the bundle | `unzip -l verstak.skill` |
| Full gate | `make check` (its targets: `Project`, Gate) |
| Frontmatter, inventories, links, banned text | `make validate` |
| Bundle ↔ source | `make check-bundles` |
| Corpus ↔ surface snapshot (offline): tool names, enum values, argument names in one-line `verstak_TOOL(…)` calls — not which action takes which argument, nor value shapes | `make check-surface` |
| Core boundary and pin | `make check-core` (no delivery name in the core; the core equals `js/core.lock`) |
| Sync the core from the sibling | `scripts/sync-core.sh SIBLING_REPO_DIR REF` |
| Dev build of the shipped JS | `make build-js` (→ `dist/dev/`, ignored) |
| Release build onto the committed paths | `make build-release` (the release job's; `make check-js` checks the release mark and embedded versions against `js/delivery/version.ts`) |
| Bridge behaviour (offline, local fake graph + OAuth server) | `make test` (builds `dist/dev`, then `js/tests/*.test.mjs`) |
| Refresh the surface snapshot: from the asset nks-mcp tags on each release (versioned, via `fj`); fallback — the live server (network + authorized grant, through the bundled bridge) | `make surface-asset V=X.Y.Z`; fallback `make surface` |

`make validate` also bans Cyrillic and the retired delivery name in every tracked text file except `CHANGELOG.md`.

## Project structure
The code map: `docs/STRUCTURE.md`.

## Code conventions
- Graph references: `(graph @nks/nks-dev, node #N)` in scripts, tests and this file. **Never under `skills/`**: skills ship to users without access to this graph or `methodology`, and seqs are instance-specific — name concepts by name; keep only syntax placeholders (`#42`, `#N`, GitHub `#123`). The built outputs under `skills/verstak/scripts/` and `extensions/` keep the core's code comments as they are: the sibling's source, not our prose.
- **`SKILL.md` frontmatter**: `scripts/validate-skills.mjs` is the contract — read it before adding a key; it fails on what the loaders reject silently (a quoted `slash`, `<` or `>` in the description, which drops the whole plugin at claude.ai). The description routes the skill: explicit trigger phrases.
- **One skill, `verstak`**: `/verstak:verstak` from the plugin, `/verstak` from a flat install; methods are selected by the door. New method → `methods/NAME.md` without frontmatter, routed from the door, plus its graph pair; never component lists in `marketplace.json`/`plugin.json`.
- **Prose is the product**: touch only the steps the task needs; match the file's register and terminology; no mass rewrite for one fix (`methods/code-work.md`, Surgical changes, applied to prose).
- **Tool references must be live**: every `verstak_*` name a method writes exists on the current surface; dropped tools don't appear; shipped behaviour (validate-on-create → `CHECKS:`) belongs in create-flow guidance (graph @nks/nks-dev, #849, #833).
- **Verify before asserting a limit**: "there is no way to do X" is a claim about your toolbox — check it, then ask whoever demonstrably does it (sibling roles on live channels answer in minutes). Merged is not deployed; a tool's description can lag its platform — behaviour wins, and the gap goes to that surface's owner.
- **Prefer the stable door to the retold detail.** A renamed name or parameter drifts loudly — `make check-surface` finds it; a claim about behaviour (when a call refuses, what a flag does) drifts silently. Point at the door that always answers — `action="?"`, the tool's description, the hints in its output — and retell only what you will keep true.
- **A `references/*.md` file is read when something goes wrong, not while doing the step**: the actual call and the first-try trap belong in the method body; the reference carries full shape, failure table, per-harness detail. (why: witnessed twice — the socket-holding call sat only in `references/collaborate-channel.md`, and no doer opened it while connecting.)
- **Skill prose instructs, never moralises**: a rule is the question worth asking plus its checkable signs. Where a rule can be over- or under-applied, say which error costs more.
- **Terminology is load-bearing**: `phenomenon` for the typed primitive (target of `given_as`/`ahara`/`upadhi`/`context`), `node` for the generic; `kriya`/`holon`/`karta`/`vimarsha` per the realm ontology; no retired terms (`entity`).
- **Test discipline**: the corpus is gated on format and surface consistency, plus a text-contract test for the minding carriers (`js/tests/minding-contract.test.mjs`) that pins phrases — rewording one updates the test in the same commit; it checks text presence, not behaviour. Its substance is human review of the diff — behavioural claims are what no lint sees. Repository hook commands have a shell-syntax and fixture-event probe (`js/tests/hook-projection.test.mjs`), not a claim about a live harness loading them. For the bridge, a core behaviour change is the sibling's (`Shared surfaces`, the core row); ours is the delivery layer and the build: a change there lands in `js/tests/` in the same commit, seen red first on the old code (`VERSTAK_BRIDGE_PATH=OLD_COPY make test`).

## What to update when
- `AGENTS.md` — repo conventions change; `docs/STRUCTURE.md` — the layout changes (its `one skill (…)` line is linted against the tree).
- `REALITY.md` — a carrier appears, changes or turns out unreachable; dated measurements go to the graph.
- `js/core.lock` and the core — when the sibling delivery's core moves: `scripts/sync-core.sh`, then `make check` (`Shared surfaces`, the core and export rows).
- `fixtures/surface.json` — the tool surface renames, drops or adds a name, parameter or enum: the refresh row in `Commands`, review the diff, commit.
- `README.md` — the skill and method tables, whenever the set changes.
- `DERIVATION.md` — walk it after any methodology-canon change; extend it when a new canon landmark is projected into a skill.
- `methods/align.md` + `templates/agents-template.md` — improving the bootstrap for all future repos; a change that makes generated files wrong raises the contract.
- `references/align-superpowers-interop.md`, `references/align-delegation.md`, `references/align-harness-surfaces.md` — when superpowers, the harnesses' agent-file surfaces, or where a harness reads instructions and fires automation change (re-verify checklists: `DERIVATION.md`, Extra sync obligations).
- `methods/collaborate.md` — when the bridge that relays a human onto an agent's channel changes its address line (`re #SEQ vVERSION`; `Shared surfaces`, the `collaborate` row): a field added, dropped or renamed lands here in the same breath.
- `r5`, #844 — every merge: both halves of every touched method to the shipped state (`Graph work here`), then the after-merge acts (`methods/code-work.md`, `After merge`).

## Git workflow
- Conventional commits (`feat:`, `fix:`, `chore:`, `docs:`…); branches `feat/…`, `fix/…`, `chore/…`; PR titles likewise.
- **The PR title is the only commit that reaches `main`**: merges are squashes, so release-please reads the title alone. Give it the **highest** type the branch carries (any `feat:` → a `feat:` PR) and write it as the changelog line. (why: witnessed — four `feat:` commits shipped as a patch under a `fix:` title.)
- PR body: one or two lines in English and the case number. No co-author trailer.
- The gate is one call: `make check`; CI runs the same targets on every PR and on pushes to `main` (`.github/workflows/ci.yml`). Pre-commit rebuilds and stages `verstak.skill`; the prose has no linter, formatter or type check — review the `SKILL.md` diff by eye.
- One branch and one PR per batch, in its own worktree `.worktrees/<branch>`, **from a freshly fetched `origin/main`**, naming the remote every time (`methods/code-work.md`, `Branch and worktree`): squash merges mean a branch off a merged branch replays work already on `main` and the PR conflicts with itself — sharpest right after a merge. In a worktree `git checkout main` fails (the primary clone holds it); branch deletion belongs to that clone. An abandoned tree — branch merged or deleted on the forge, copy clean — is removed by any agent of the repo; uncommitted or unmerged work is named to its holder.
- Self-review here reads prose: does a line instruct into a refusal the surface makes; does a rule scold where it should name the checkable sign; is a step's obligation stated or only implied; did a fix to one node's wording leave the same wording on a sibling.
- **Never push to `main`.** Push your branch and open its PR yourself (`gh pr create`), without asking or offering it as a choice; follow-ups go into the open PR.
- Forge CLI `gh`. Follow the PR in the background and fix red in the branch (`methods/code-work.md`, `Branch and worktree`); keep your channel's socket open while you wait. **Done**: merged to `main` on `github.com/verstak-ai/skills` via its PR — `gh pr view N --json state` or the merge hook tells you. **The agent merges its own PRs** (the owner's word, 2026-10-09): on green CI and after review by the batch's tier (`methods/code-work.md`, `Cold review`); the release PR too. **Releases go in waves**: several changes into one release PR, not one per change; its frozen candidate gets the full review of `Cold review`, the skill bodies read by different model families, each finding numbered by a skill-body criterion (below), and a separate Fable reading of the corpus for coherence, integrity, harmony and needless repeats, briefed by the touched nodes, their arrows and the criteria, never by the expected verdict; every Fable finding is fixed or explicitly answered before the tag. (why: graph @nks/nks-dev, node #10442.) Never `--admin`, never past a red check.
- **Skill-body criteria** (graph @nks/nks-dev, node #8077, adapted): 1 faithful to the canon (a rule traces to a methodology or delivery node; `DERIVATION.md`); 2 faithful to the tool surface; 3 channels kept apart — the call contract in the tool's description, the method's when and why in the skill, no transcribed surface; 4 one norm, one home, no repeating layer; 5 each step's obligation stated; 6 no dead weight — no ban without a signal, the retired removed whole; 7 the corpus doesn't teach two things about one (door, methods, tool descriptions); 8 routing and triggers reach the right method; 9 every file within the client output limit (Shared surfaces); 10 testable by behaviour where a key method has a probe; 11 English per the language contract (`DERIVATION.md`); 12 complete inventory — methods on disk, the door and `README.md` agree. 3, 7, 8 and 12 are judged over the whole corpus.
- Never `--no-verify`, `--force`, `--no-gpg-sign`, `git reset --hard` without explicit instruction.

## Role file tails
#### all roles
- Graph tools here carry the sibling deployment's prefix, not `verstak_` (`Local overrides`, Graph access): read it off your tool list (the tool ending in `_orient`); each `verstak_X` your body names is that prefix plus `X`, and that is this repository's own bridge, not another's — stand, join and write through it.

#### designer, worker
- Skill prose is edited in `skills/verstak/`; run `make check` before reporting. Never hand-edit `verstak.skill`, `home/` or the built JS outputs: `make build` regenerates the bundle and `home/`, the pre-commit hook stages them, and the release job writes the JS outputs.
- Prose here is the product: no wholesale rewrite for one fix; match the register and terminology of the file you edit.

#### reader
- The source of truth is `skills/verstak/`. Never read `verstak.skill`, `home/`, `~/.claude/skills/` or the plugin cache and report it as the method: all are derived, and an installed copy is routinely releases behind.

#### reviewer
- Prose is the product: read the diff with the self-review questions of `AGENTS.md`, Git workflow, and check every row of `AGENTS.md`, Shared surfaces, the diff touches.

#### verifier
- Format: `make check` against the committed `verstak.skill` and `skills/verstak/`; a green source tree with a stale bundle is a fail.

## Local overrides
- **Graph access:** `r5` lives on the sibling deployment and is reached through that deployment's bridge and door; its tools carry that deployment's prefix instead of `verstak_`. Read the prefix off your own tool list: the tool whose name ends in `_orient` (and `_case`, `_stand`, `_look`…) — whatever stands before that suffix replaces `verstak_` in every call the door and methods name. No such tool listed → the bridge isn't connected: `methods/establish-mcp.md`. Names written into `skills/` stay `verstak_*`.
- **This repository's own start, push and merge hooks stay** in `.claude/settings.json` for the transition (`methods/align.md`, Step 4): the Claude Code delivery installed here now carries `hooks/rituals.mjs`, but the transition's live sign in a scratch repository needs a `claude` login on this machine (graph @nks/nks-dev, node #10157); once seen, take them off and keep the memory guard.
- **OpenCode rituals come from the delivery**: no `.opencode/plugins/verstak-rituals.js` here; from 3.27.0 the delivered plugin speaks the start, guard, push and merge by the cover, before it an OpenCode session here gets none. `js/tests/reposigns.test.mjs` pins this repository as aligned in both harnesses (the cover names graph, holon and role).
- **Full-gate exception — this repository only**: by the owner's grant (graph @nks/nks-dev, node #864), retain the full `make check` locally and for PR/main CI, without affected-module selection or a result cache; repeating checks across local/CI is allowed. Revisit when a measurement shows a substantial CI-cost increase. This grants no exception to other repositories.
- **Shared surfaces** are listed although the method lists none: their consumers sit where a traversal from #844 doesn't reach — another graph's copy of a contract, a separate instance.
