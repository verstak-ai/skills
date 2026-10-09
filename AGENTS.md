---
'Nature': 'library — a reusable skill corpus consumed by agents in other repos; relaxed vs production: the prose has no behavioural tests (gate = format + surface lint, substance by human review of the diff); the bundled verstak-bridge is the exception and carries a behavioural suite (make test)'
'Nature — source': 'derived'
'Graph': '@nks/nks-dev (r5)'
'Graph — source': 'derived'
'Focus holon': '#844 "📦 verstak-ai/skills (agent skills)"'
'Focus holon — source': 'derived'
'Repository': 'github.com/verstak-ai/skills — the holon''s repository attr, from origin'
'Repository — source': 'derived'
'Agent role': '#931 "👨‍💻 Agent skill-repository developer" — adhikarin, steward of the holon (also of the sibling delivery holon #1506); inbox verstak_orient(focus="931")'
'Agent role — source': 'derived'
'Owner role': '#1226 "👑 Product owner" — svatantra, the posed_to address for out-of-mandate questions'
'Owner role — source': 'derived'
'Stack': 'Markdown skill corpus (one door, methods, references, templates) packed into verstak.skill; the bridge in TypeScript under js/ (the sibling core + our delivery layer), built by esbuild into dependency-free files; Node + bash for build and gate; Claude Code plugin marketplace versioned by release-please'
'Stack — source': 'derived'
'Gate': 'make check (validate + check-bundles + check-surface + check-core + lint + format-check + typecheck + check-js + test); CI runs the same targets'
'Gate — source': 'derived'
'Consumers': 'agents in other repos that load the installed skill every session; they learn of breakage only as method drift, never a crash; the bridge''s failures land on a human whose browser login went nowhere'
'Consumers — source': 'derived'
'Cost of breakage': 'a wrong instruction (e.g. a tool the surface dropped) silently degrades every agent that loads the skill; keeping the corpus in sync with the tool surface is the core maintenance obligation'
'Cost of breakage — source': 'derived'
'Reality': 'REALITY.md at the root — read when needed (the Reality section below)'
'Reality — source': 'derived'
'Layout': 'code map: the Project structure section (no component READMEs; anything under skills/verstak/ ships in the bundle); traps: graph nodes on #844'
'Layout — source': 'derived'
'Cross-project memory': 'personal graph @handle/mind — never a global instructions file or the memory directory'
'Cross-project memory — source': 'derived: template default'
'Feedback reflection': 'yes — default'
'Feedback reflection — source': 'derived: template default'
'Workflow-suite interop': 'none'
'Workflow-suite interop — source': 'derived'
'Agreement': 'none'
'Agreement — source': 'derived'
---
# `verstak-ai/skills`
The `verstak` skill — one door and its methods, `align` among them, which bootstraps any repo to this standard — plus the bundled `verstak-bridge`; consumed by agents in other repos.

**Load the `verstak` skill first, every session, before any action**, and do the door's `Start` with the addresses above; its `Cross-cutting norms` apply here. Code work follows its `methods/code-work.md`. This file holds only this repository's own facts; a line contradicting the method → the door, `Start`, `Alignment`.

Owned there, not restated here: start and the #931 inbox (door, `Start`), branch and worktree, self- and cold review, the after-merge acts, asking in prose never a picker (`methods/code-work.md`), ending questions by axis (`methods/inquiry.md`).

## Persistence
- State lives in the repo or the graph. The harness's built-in memory is forbidden entirely; a temp directory is scratch, cleaned up with each finished piece, as are worktrees and cases you no longer owe a move (the door, `Case laws`). Only committed files and the project graph configure agents.
- The memory directory (`~/.claude/projects/-Users-...-skills/memory/`) does not exist here; don't create it — not for a project fact, a preference or a note on working style. The harness's own memory instruction says it exists and invites a `project` category; this file overrides it. The `PreToolUse` memory guard blocks writes (exit 2). Where a fact goes: the door, `Routes`, Keep — here work state and questions are vimarshas in `r5`, this project's servers and dated duties are `r5` nodes with the date in `attrs`.
- `skills/verstak/` is the source of truth. `verstak.skill`, `~/.claude/skills/` and the plugin cache are derived: never read one as the method or edit it.
- Rituals (start, push, merge, memory guard) are wired in `.claude/settings.json`; add beside other suites' entries. Hook text is English.

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
Before saying "works", switching a mode or ending a question, read your claim class's row in `REALITY.md`; it goes whole into a `verifier` or `reviewer` brief. First row: Format — `make check` against the committed `verstak.skill` and `skills/verstak/`. Its Ceiling (whether a reader of a skill then acts differently) is never closed as verified.

## Shared surfaces
Touching one obliges checking the others. Found by graph traversal, not by grep — a rule with several consumers looks like one ordinary node.

| Surface | Consumers | Note |
|---|---|---|
| `skills/verstak/templates/agents-template.md` | every repo align will ever bootstrap | changing a section changes configs already generated — that is what the contract counter is for |
| Frontmatter contract (`scripts/validate-skills.mjs`) | the one `SKILL.md` door | three keys and no others; methods, references and templates have no frontmatter |
| `methods/assistant.md`'s `## Map`, the `assistant`, `minding` and `widgets` methods, their descriptions in `scripts/build-home.mjs` | the verstak.ai conversation home, which reads `home/` by name and lifts the Map into its prompt | one `## Map` heading, at most 1500 code points; the home sees no door, method or reference, so a new pointer in these methods needs a rewrite in `build-home.mjs` or the build fails |
| `collaborate` address-line contract | this skill + the bridge that relays a human onto an agent's channel | deliberately duplicated: neither side can read the other's copy, so drift is caught by meaning alone |
| grundsatz nodes in #844 (writing/placement rules) | several applying kriyas each, via `upadhi` | a duplicate principle grows here unseen — one rule under two nodes with disjoint consumers, fixed on one and stale on the other |
| Sibling delivery (holon #1506) | its own deployment, on a separate graph instance | a realm address hardcoded in a skill does not survive the crossing |
| The bridge core `js/{bridge,shared,opencode,extension,watchdog,cli}` | the sibling delivery, which owns it; our build | copied byte for byte, pinned by `js/core.lock`; a core change lands upstream with its suite and comes here by `scripts/sync-core.sh` |
| The export set of `js/delivery/index.ts` | every core file (it imports the layer by this one path) | a missing or reshaped export is a `make typecheck` error in the core; a new core export lands here in the same sync |
| The skill layout: `js/delivery/product.ts` (`BRIDGE_SKILL`, `BRIDGE_FILE`, `PLUGIN_FILE`, `SKILL_STAMP_MASK`), the output paths in `js/build.mjs`, `js/tests/built.mjs`, `scripts/check-outputs-frozen.sh`, `.mcp.json`, `SETUP.md` | the core's set recognition (`verstak/SKILL.md` + `verstak/scripts/verstak-bridge.mjs`), self-update downloads, doctor, the plugin's MCP entry, installers | one layout named in several places; moving the bridge moves all of them, and bridges already released keep fetching their own path |

## Stack
- Distributed as a Claude Code plugin marketplace (`verstak@verstak-ai`), semver in `.claude-plugin/plugin.json`, bumped by **release-please** from the Conventional Commits on `main` (feat → minor, feat!/BREAKING → major, else patch): merging its release PR writes the version, tags `vX.Y.Z` and cuts a GitHub Release with a `CHANGELOG.md` entry. Never by hand.
- No runtime dependencies: every shipped file is dependency-free. The bridge is TypeScript under `js/` — the sibling delivery's core copied as is plus our English delivery layer `js/delivery/` — built by esbuild with a dev-only toolchain and the only lockfile in `js/` (Node 22, `.nvmrc`; never at the root: Claude Code runs `npm ci` on a plugin whose root carries one).
- The committed JS outputs (`skills/verstak/scripts/verstak-bridge.mjs`, `skills/verstak/scripts/opencode-plugin.js`, `extensions/verstak.js`) are a **release build**, written only by the release job (`make build-release` in `bundle-sync`); a working copy builds dev into `dist/dev/`, which the tests run.
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
| Full gate | `make check` = `validate` + `check-bundles` + `check-surface` + `check-core` + `lint` + `format-check` + `typecheck` + `check-js` + `test` |
| Frontmatter, inventories, links, banned text | `make validate` |
| Bundle ↔ source | `make check-bundles` |
| Corpus ↔ surface snapshot (offline) | `make check-surface` |
| Core boundary and pin | `make check-core` (no delivery name in the core; the core equals `js/core.lock`) |
| Sync the core from the sibling | `scripts/sync-core.sh SIBLING_REPO_DIR REF` |
| Dev build of the shipped JS | `make build-js` (→ `dist/dev/`, ignored) |
| Release build onto the committed paths | `make build-release` (the release job's; `make check-js` checks the release mark and embedded versions against `js/delivery/version.ts`) |
| Bridge behaviour (offline, local fake graph + OAuth server) | `make test` (builds `dist/dev`, then `js/tests/*.test.mjs`) |
| Refresh the surface snapshot (network + authorized grant, through the bundled bridge) | `make surface` |

`make validate` also bans Cyrillic and the retired delivery name in every tracked text file except `CHANGELOG.md`.

## Project structure
- `skills/verstak/SKILL.md` — **source of truth**, one skill (`verstak`); the door selects plain Markdown methods.
- `skills/verstak/methods/*.md` — methods list (`align`, `architect`, `assembly`, `assistant`, `autonomous`, `code-work`, `collaborate`, `design`, `entry`, `establish-mcp`, `feedback`, `foreman`, `inquiry`, `intake`, `integrity`, `minding`, `product-roadmap`, `reality-audit`, `reconcile`, `weaving`, `widgets`, `writing`).
- `skills/verstak/references/*.md`, `skills/verstak/templates/*` — supporting material without frontmatter. `templates/agents-template.md` + `methods/align.md` bootstrap other repos; this file is this repo's own config — don't confuse them.
- `skills/verstak/scripts/verstak-bridge.mjs` — the stdio↔https OAuth bridge with its daemon, watchdogs and doctor; `skills/verstak/scripts/opencode-plugin.js` — the OpenCode plugin. Both derived from `js/`, never edited by hand.
- `js/` — the bridge's single source: the core `js/{bridge,shared,opencode,extension,watchdog,cli}` (the sibling delivery's, pinned by `js/core.lock`), our delivery layer `js/delivery/` (product names and the skill layout, protocol keys, version, server prose `patterns/`, English `words/`), `js/build.mjs`, the dev toolchain (`package.json`, lockfile, `tsconfig.json`, eslint, prettier).
- `extensions/verstak.js` — the built pi extension (pi loads `extensions/`).
- `.mcp.json` — the plugin's MCP server `verstak`: the bundled bridge, `node ${CLAUDE_PLUGIN_ROOT}/skills/verstak/scripts/verstak-bridge.mjs`.
- `verstak.skill` — the only derived bundle (a top-level `verstak/` tree), committed for manual install.
- `home/` — the verstak.ai conversation home's flat home catalogue (`assistant`, `minding`, `widgets`): `home/NAME/SKILL.md`, generated by `make build` (`scripts/build-home.mjs`) from `skills/verstak/methods/NAME.md` with frontmatter added and every pointer into the rest of the skill rewritten — derived, never edited. Outside `skills/`, so plugin auto-discovery never ships it.
- `.claude-plugin/plugin.json` — its `version` is what Claude Code reads to deliver updates. `.claude-plugin/marketplace.json` — `metadata.version` and the plugin entry's `version` mirror it (`make validate` fails on divergence); no component lists, skills auto-discover from `skills/`.
- `release-please-config.json`, `.release-please-manifest.json`, `.github/workflows/release-please.yml` — releases; `CHANGELOG.md` is written by them.
- `Makefile`, `scripts/build-skills.sh`, `js/build.mjs`, `.githooks/pre-commit` — the build. `scripts/validate-skills.mjs`, `scripts/check-bundles.sh`, `scripts/check-surface.mjs` + `fixtures/surface.json` (refreshed by `scripts/export-surface.mjs`), `scripts/check-core.mjs` + `scripts/check-core-lock.mjs` (core boundary and pin), `scripts/check-outputs-frozen.sh` (the committed outputs change only in the release PR; wired once the first release ships them), `.github/workflows/ci.yml` — the gate.
- `js/tests/` — `node:test` suites: `bridge.test.mjs` drives the built bridge over stdio (full bridge and machine daemon), `fake-server.mjs` stands in for an OAuth-protected MCP server and answers the consent the test gives on the human's behalf; `core-gate`, `delivery-words`, `delivery`, `coexist` test the core boundary and pin, the dictionaries' shape, the version and names, and a second product built from the same core. Black box: they run `dist/dev`, or any copy named by `VERSTAK_BRIDGE_PATH`.
- `DERIVATION.md` — the skills ← canon re-projection map and the four-layer language contract. `SETUP.md` — the agent-executable installer. `README.md` — short, for people.
- `REALITY.md` — claim carriers. `CLAUDE.md` — a **symlink** to this file: one file answers every harness; keep it a symlink.
- `.claude/settings.json` — committed rituals; `settings.local.json` is ignored. `.claude/agents/` — delegation roles; their `description` routes them, so it stays trigger-shaped.
- `.gitignore` — `.DS_Store`, `.impeccable/`, `.claude/settings.local.json`, `dist/` (the dev build), `node_modules/`. Scratch is **not** ignored: keep working files out of the tree.

## Code conventions
- Graph references: `(graph @nks/nks-dev, node #N)` in scripts, tests and this file. **Never under `skills/`**: skills ship to users without access to this graph or `methodology`, and seqs are instance-specific — name concepts by name; keep only syntax placeholders (`#42`, `#N`, GitHub `#123`). The built outputs under `skills/verstak/scripts/` and `extensions/` keep the core's code comments as they are: the sibling's source, not our prose.
- **`SKILL.md` frontmatter** is parseable, flat, single-line YAML with three keys and no others: `name` (kebab, matches the dir), `description` (double-quoted, inner quotes escaped `\"`, explicit trigger phrases — it routes the skill), optional `slash: true` (plain boolean; quoted `"true"` fails). No `<` or `>` in a description: the claude.ai plugin loader rejects the whole plugin. `scripts/validate-skills.mjs` is the contract — read it before adding a key.
- **One skill, `verstak`**: `/verstak:verstak` from the plugin, `/verstak` from a flat install; methods are selected by the door. New method → `methods/NAME.md` without frontmatter, routed from the door, plus its graph pair; never component lists in `marketplace.json`/`plugin.json`.
- **Inspect the real source** before editing: `skills/verstak/`, not the zip, not an installed copy. Touch only the steps the task needs; match the file's register and terminology; no mass rewrite for one fix.
- **Tool references must be live**: every `verstak_*` name a method writes exists on the current surface; dropped tools don't appear; shipped behaviour (validate-on-create → `CHECKS:`) belongs in create-flow guidance (graph @nks/nks-dev, #849, #833).
- **Verify before asserting a limit**: "there is no way to do X" is a claim about your toolbox — check it, then ask whoever demonstrably does it (sibling roles on live channels answer in minutes). Merged is not deployed; a tool's description can lag its platform — behaviour wins, and the gap goes to that surface's owner.
- **Prefer the stable door to the retold detail.** A renamed name or parameter drifts loudly — `make check-surface` finds it; a claim about behaviour (when a call refuses, what a flag does) drifts silently. Point at the door that always answers — `action="?"`, the tool's description, the hints in its output — and retell only what you will keep true.
- **A `references/*.md` file is read when something goes wrong, not while doing the step**: the actual call and the first-try trap belong in the method body; the reference carries full shape, failure table, per-harness detail. (why: witnessed twice — the socket-holding call sat only in `references/collaborate-channel.md`, and no doer opened it while connecting.)
- **Skill prose instructs, never moralises**: a rule is the question worth asking plus its checkable signs. Where a rule can be over- or under-applied, say which error costs more.
- **Terminology is load-bearing**: `phenomenon` for the typed primitive (target of `given_as`/`ahara`/`upadhi`/`context`), `node` for the generic; `kriya`/`holon`/`karta`/`vimarsha` per the realm ontology; no retired terms (`entity`).
- **Test discipline**: the corpus is gated on format and surface consistency only; its substance is human review of the diff — behavioural claims are what no lint sees. For the bridge, a core behaviour change is the sibling's: it lands upstream with its suite and arrives by `scripts/sync-core.sh`. Ours is the delivery layer and the build: a change there lands in `js/tests/` in the same commit, seen red first on the old code (`VERSTAK_BRIDGE_PATH=OLD_COPY make test`).

## What to update when
- `AGENTS.md` — repo conventions, structure or the method set change; the inventory lines are linted against the tree.
- `REALITY.md` — a carrier appears, changes or turns out unreachable; dated measurements go to the graph.
- `js/core.lock` and the core — when the sibling delivery's core moves: `scripts/sync-core.sh`, then `make check`; a new or reshaped export in its `delivery/index.ts` lands in ours in the same commit.
- `fixtures/surface.json` — the tool surface renames, drops or adds a name or enum: `make surface`, review the diff, commit.
- `README.md` — the skill and method tables, whenever the set changes.
- `DERIVATION.md` — walk it after any methodology-canon change; extend it when a new canon landmark is projected into a skill.
- `methods/align.md` + `templates/agents-template.md` — improving the bootstrap for all future repos; a change that makes generated files wrong raises the contract.
- `references/align-superpowers-interop.md`, `references/align-delegation.md`, `references/align-harness-surfaces.md` — when superpowers, the harnesses' agent-file surfaces, or where a harness reads instructions and fires automation change (re-verify checklists inside).
- `methods/collaborate.md` — when the bridge that relays a human onto an agent's channel changes its address line (`re #SEQ vVERSION`): the contract lives there and here, and neither side can read the other's — a field added, dropped or renamed lands here in the same breath.
- `r5`, #844 — every merge: both halves of every touched method to the shipped state (phenomenon, applying kriya and its step sub-kriyas with `next` and `upadhi` edges), then what the merge settled, ended by axis.

## Git workflow
- Conventional commits (`feat:`, `fix:`, `chore:`, `docs:`…); branches `feat/…`, `fix/…`, `chore/…`; PR titles likewise.
- **The PR title is the only commit that reaches `main`**: merges are squashes, so release-please reads the title alone. Give it the **highest** type the branch carries (any `feat:` → a `feat:` PR) and write it as the changelog line. (why: witnessed — four `feat:` commits shipped as a patch under a `fix:` title.)
- PR body: one or two lines in English and the case number. No co-author trailer.
- The gate is one call: `make check`; CI runs the same targets on every push and PR. Pre-commit rebuilds and stages `verstak.skill`; the prose has no linter, formatter or type check — review the `SKILL.md` diff by eye.
- **Branch from a freshly fetched `origin/main`**, naming the remote every time: `git fetch origin && git worktree add DIR -b BRANCH origin/main`. Squash merges mean a branch off a merged branch replays work already on `main` and the PR conflicts with itself — sharpest right after a merge. In a worktree `git checkout main` fails (the primary clone holds it); branch deletion belongs to that clone.
- Self-review here reads prose: does a line instruct into a refusal the surface makes; does a rule scold where it should name the checkable sign; is a step's obligation stated or only implied; did a fix to one node's wording leave the same wording on a sibling.
- **Never push to `main`.** Push your branch and open its PR yourself (`gh pr create`), without asking or offering it as a choice; follow-ups go into the open PR.
- Forge CLI `gh`. Follow the PR: `gh pr checks N --watch`, fix red in the branch, keep your channel's socket open while you wait. **Done**: merged to `main` on `github.com/verstak-ai/skills` via its PR — `gh pr view N --json state` or the merge hook tells you. **The agent merges its own PRs** (the owner's word, 2026-10-09): on green CI and after review by agents in proportion to the change — a few lines of prose: self-review and the gate; code, protocols, the align template: a cold reviewer. **Releases go in waves**: several changes into one release PR, not one per change; the release PR is the agent's to merge too. Never `--admin`, never past a red check.
- Never `--no-verify`, `--force`, `--no-gpg-sign`, `git reset --hard` without explicit instruction.

## Local overrides
- **Graph access, until the verstak bridge ships:** `r5` lives on the sibling deployment and is reached through that deployment's bridge and door; its tools carry that deployment's prefix instead of `verstak_`. Read the prefix off your own tool list: the tool whose name ends in `_orient` (and `_case`, `_stand`, `_look`…) — whatever stands before that suffix replaces `verstak_` in every call the door and methods name. No such tool listed → the bridge isn't connected: `methods/establish-mcp.md`. Names written into `skills/` stay `verstak_*`.
- **Role files**: `.claude/agents/` still holds the contract-1 `reader`, `worker`, `verifier`; the six roles with their satellite entries are projected with the bridge PR. Until then brief a missing role as a generic subagent with its body from `references/align-delegation.md`.
- **Shared surfaces** are listed although the method lists none: their consumers sit where a traversal from #844 doesn't reach — another graph's copy of a contract, a separate instance.

*(verstak align: contract `2`, stamped `2026-10-07` — re-run when the installed
verstak skill names a higher contract, or when the sources this file derives from
have moved since that date.)*
