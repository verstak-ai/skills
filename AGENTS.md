# verstak-ai/skills
Agent-facing NKS and implementation-verification skill bundles (Claude Code skills), including `verstakify` — the skill that bootstraps any repo to this `AGENTS.md` standard.

## What this project is
- **Nature**: `library` — reusable Claude Code skill bundles consumed by agents in other repos. Relaxed vs production: content is prose + methodology, so there are no behavioural tests. The gates are (1) human review of the `SKILL.md` diff plus the skills' own discipline and (2) a lightweight CI that validates the frontmatter contract and bundle sync (`make check`). Breakage is otherwise silent, not loud (see Production statement) — CI catches the one mechanical class (malformed frontmatter / drifted bundles).
- **NKS realm**: `r5` (`@alari/nks-dev`) — every session starts with `nks_orient` here. `r5` is the immutable short id and survives a rename; never pass the bare slug `nks-dev` (deprecated, ambiguous across owners). Verify the `REALM:` header on the first orient.
- **Focus holon**: `#844 «📦 verstak-ai/skills (скиллы агента)»`.
- **Agent karta**: `#931 «👨‍💻 Разработчик в verstak-ai/skills»` — adhikarin, steward of #844. Your inbox: `nks_orient(realm="r5", focus="931")` at session start (self-locate fallback: `nks_me(action="kartas")`).
- **Owner karta**: `#1226 «👑 Владелец продукта»` (svatantra 主) — out-of-mandate questions go there as `posed_to` vimarshas.
- **Stack**: Markdown `SKILL.md` files under `skills/<name>/`, packaged into derived `<name>.skill` zip bundles via `make build`. Distributed as a Claude Code plugin marketplace (`verstak@verstak-ai`), versioned by semver in `.claude-plugin/plugin.json` — bumped **automatically on every merge to `main`** (feat→minor, feat!/BREAKING→major, else patch; `.github/workflows/version-bump.yml`, never by hand). No runtime, no dependencies; CI is a dependency-free format gate (pure Node + bash) — see `.github/workflows/ci.yml`.
- **Production statement**: skills install into agents' `~/.claude/skills/` and shape how every agent works with NKS. A wrong instruction — e.g. a reference to a tool that nks-mcp has dropped — silently degrades every agent that loads the skill; there is no crash, only methodology drift. The consumer is the agent, not a human user. Keeping skills in sync with the nks-mcp tool surface is the core maintenance obligation.

## Persistence rules
State lives in the **repo** or in **NKS** — nowhere else.
- **Repo**: `skills/<name>/SKILL.md` (source of truth), the derived `<name>.skill` bundles, `README.md`, conventions.
- **NKS** (`r5`): design decisions, open questions (vimarshas), hand-offs, hints — the thinking around the skills. Don't restate NKS in the repo; link to the vimarsha/holon.
- **`skills/<name>/SKILL.md` is the source of truth.** The `<name>.skill` zips are derived build artifacts (committed for download/claude.ai); the installed copy in `~/.claude/skills/` is derived too. Never treat a hand-edited bundle or installed copy as canonical — edit the source dir and run `make build`.
- Fetch state; never reconstruct it from memory.

## Session lifecycle
- **Start:** `nks_orient(realm="r5", focus="844")`; orient by the ACTIVE BIANHUA map (`lens="bianhua"` for the forest) — open work lives as anga-vimarshas on transformations; a `genre=hint` seed, if any, is a pointer for what the map doesn't carry. The `entry` skill runs the protocol. Then open your agenda: `nks_orient(realm="r5", focus="931")` — incoming `posed_to` vimarshas are your inbox; pick up or explicitly defer each before starting repo work.
- **Every push → update NKS:** thread shipped skill changes into holon #844. Advance the map — close (visarjana) the vimarshas the push resolved, keep open work attached via `anga`. A thin `genre=hint` is left only for what the graph can't carry (pointer, not payload — methodology #131), never by default.
- **Every skill is a pair — map both halves, and map the kriya by steps.** The **phenomenon** (`given_as=vollzug`, «Скилл <name>», #845…) carries the method as an artefact: it names *what the method is* and how kriyas touch it (what applies it, what it composes), and does **not** retell the protocol — a phenomenon description that reads as a summary of `SKILL.md` is transcription, not modelling. The **applying kriya** (#924…) carries the method as it runs, and is decomposed **step by step**: one sub-kriya per protocol phase (`contains`-child) with its own pariṇāma, `ahara`/`utpatti`, `actor`, `next` into each tool-kriya it calls (MCP contour — #296 `nks_orient`, #309 `nks_search`, #859 `nks_arrow`…), and `upadhi` to any skill it composes (e.g. on-duty's close → weaving #848). A phase whose actor is **not** the agent — owner acceptance of telos, goal, or gate — is its own kriya (#1583, #1619, #1658, #1678): one kriya, one actor. New skill → new phenomenon + applying kriya, decomposed the same way; a changed protocol → the sub-kriyas move with it. The applying kriya and its `contains`-children are the **traversable model** — the protocol is represented as structure (steps, inputs, actors, edges), never as prose copied from the file; the obligation is that the pair *corresponds to* the shipped `SKILL.md`, which stays the source of truth.
- **Why the step-map is load-bearing:** it is the instrument for steering skill development. A tool rename's blast radius, a skill's real composition, and the method's correspondence-or-drift against the **methodology** canon become graph traversals instead of re-readings of prose — mismatch surfaces as a structural tension, not as a hunch. Prose in `SKILL.md` stays the source of truth; the graph is the model of that truth, and a model you can't query can't steer anything.
- **Keep git refs out of NKS** — no SHAs, branch names, or PR numbers in nodes.
- **Skill ↔ tool sync is the recurring driver:** when nks-mcp renames or drops a tool (zontik #833 waves), the matching skill edits land here, ideally in the same atomic unit of time.

### Branch discipline
One branch through to its merge — commit follow-ups into it, don't chain new branches before it merges. After merge: `git checkout main && git pull`, delete the merged branch, update NKS (#844 + close resolved vimarshas).

## Working principles
1. **Think before editing.** Orient in `r5`; read the bianhua map. Inspect the real source in `skills/<name>/SKILL.md` — not the derived `.skill` zip, not the installed copy, not assumptions.
2. **Surgical changes.** Touch only the skill steps the task needs. Match each bundle's existing register and terminology. Don't mass-rewrite a bundle for one fix unless asked.
3. **Sync over invention.** A skill instruction must match the live nks-mcp tool surface — verify tool names exist before writing them into a skill.
4. **Terminology is load-bearing.** Skills teach vocabulary to every downstream agent. Use the realm's current terms (`phenomenon`, not the retired `entity`); a typed primitive (target of given_as / ahara / upadhi / context) is a `phenomenon`, a generic graph object is a `node`.

## NKS ↔ repo: where things live
| Concern | Repo | NKS |
|---|---|---|
| `skills/<name>/SKILL.md` (source of truth) + derived `.skill` bundles | ✓ | |
| `.claude-plugin/marketplace.json`, build (`Makefile`, `scripts/`, `.githooks/`) | ✓ | |
| README, conventions | ✓ (AGENTS.md) | |
| Design decisions, open questions | | ✓ (vimarshas) |
| Plans, hand-offs | | ✓ (bianhua map + anga-vimarshas on #844; thin `genre=hint` only for off-map remainder) |
| Commit history, SHAs, PRs | git | (never NKS) |

## The bootstrap template lives in the `verstakify` skill
The fill-in `AGENTS.md` skeleton for future repos is `skills/verstakify/references/agents-template.md`; the bootstrap protocol is `skills/verstakify/SKILL.md`. **This** repo's own config is `AGENTS.md` (the file you are reading). Edit the template/protocol to improve bootstrapping for all future repos — don't confuse them with this file.

## Stack
Markdown `skills/<name>/SKILL.md` (+ optional `skills/<name>/references/*.md`) per skill — **edit these directly, they are plain files and fully greppable.** Each is packed into a derived `<name>.skill` zip (top-level `<name>/` dir containing `SKILL.md`) by `make build`. No code, no lockfiles. The only "code" is the build + format-validation scripts (`scripts/*.sh`, `scripts/*.mjs`), run by `make` and CI.

## Commands
Edit the source under `skills/<name>/` directly — no unzip dance. The `<name>.skill` zips are regenerated, not hand-edited.

| Task | Command |
|---|---|
| Find / search across skills | `grep`/`Grep` over `skills/` (it's plain text) |
| Edit a skill | edit `skills/<name>/SKILL.md` |
| Rebuild the `.skill` bundles | `make build` (deterministic; or auto via the pre-commit hook) |
| Enable the auto-rebuild hook | `make hooks` (sets `core.hooksPath -> .githooks`) |
| Verify a bundle's contents | `unzip -l <name>.skill` |
| Run the CI gate locally | `make check` (= `make validate` + `make check-bundles`) |
| Validate skill frontmatter only | `make validate` (pure Node, no deps) |
| Check committed bundles ↔ source | `make check-bundles` |

The pre-commit hook (`.githooks/pre-commit`) rebuilds and stages the `.skill` bundles on every commit, so committed zips never drift from source. Run `make hooks` once per clone to enable it. The only automated gate is **format**, not behaviour: `make validate` parses each `SKILL.md` frontmatter (catching malformed YAML such as an unescaped quote in a `description`) and `make check-bundles` confirms each `<name>.skill` contains a `<name>/` tree byte-identical to its source. Both run in GitHub CI on every push/PR (`.github/workflows/ci.yml`). The substance of a skill — whether its prose and tool references are right — is still gated by human review of the diff.

## Project structure
- `skills/<name>/SKILL.md` — **source of truth**, one dir per skill (`entry`, `writing`, `design`, `weaving`, `inquiry`, `assembly`, `integrity`, `reality-audit`, `intake`, `on-duty`, `methodology-work`, `verstakify`, `product-roadmap`); `references/*` optional (`verstakify`, `writing`, `product-roadmap` ship them).
- `*.skill` — derived zip bundles (committed for manual / claude.ai install). Build output of `make build`; do not hand-edit.
- `.claude-plugin/marketplace.json` — plugin marketplace manifest (`verstak@verstak-ai`); `metadata.version` mirrors the plugin version. No component lists — the plugin's skills auto-discover from `skills/` (`strict: true`, plugin.json authoritative).
- `.claude-plugin/plugin.json` — the `verstak` plugin manifest; its `version` is what Claude Code reads to deliver updates (bumped by `version-bump.yml` on every merge, never by hand).
- `scripts/bump-version.mjs` + `.github/workflows/version-bump.yml` — the automatic per-merge version bump + `vX.Y.Z` tag.
- `Makefile`, `scripts/build-skills.sh`, `.githooks/pre-commit` — the build.
- `scripts/validate-skills.mjs` (frontmatter contract, pure Node), `scripts/check-bundles.sh` (bundle ↔ source sync), `.github/workflows/ci.yml` — the format gate.
- `README.md` — short human-facing pointer.
- `.claude/` — local Claude Code settings (`settings.local.json` is gitignored).
- `tmp/` — scratch dir (no longer gitignored; `.gitignore` now ignores `.DS_Store` only — keep scratch out of commits yourself).

## Code conventions
- **`SKILL.md` frontmatter**: `name:` (kebab, matches the skill dir) + `description:` carrying explicit trigger phrases — that description is what routes the skill, so keep triggers concrete.
- **Skill names are bare** — no `nks-`/`verstak-` prefix. The `verstak` plugin namespaces them (`/verstak:<skill>`), so a prefix would only stutter. Trade-off: flat installs (`npx skills`, manual unzip) drop skills into `~/.claude/skills/<name>/` under the bare name and can collide there — the plugin is the canonical, collision-proof channel (see NKS #844).
- **Source of truth = `skills/<name>/SKILL.md`.** Edit it directly, then `make build` to regenerate the `<name>.skill` zip (which must contain `<name>/SKILL.md`, not a bare `SKILL.md`, or it won't install). New skill → add a `skills/<name>/` dir — it ships via plugin auto-discovery; never add component lists (`skills`, `commands`, …) to `marketplace.json`/`plugin.json` — a second copy of the truth drifts, and the format gate fails it.
- **No realm seq-references in skills.** Skills ship to users who (almost certainly) have no access to `methodology`/`nks-dev`, and seq numbers are realm-instance-specific — a `#N` or `nks_look(node_id=…, realm="methodology")` in a skill is dead weight or a wrong pointer downstream. Name concepts by name; keep syntax placeholders (`#42`, `#N`, GitHub `#123`) only. Exception: `methodology-work` may reference the methodology realm operationally (name/attr-based search, not seqs) — the skill presupposes that realm.
- **Tool references must be live.** Any `nks_*` tool a skill names must exist in the current nks-mcp surface. Dropped tools (`nks_validate`, `nks_reflect`) must not appear; shipped behavior (validate-on-create → `CHECKS:` in the create response) belongs in create-flow guidance. See nks-dev #849 / #833.
- **Terminology**: `phenomenon` for the typed primitive, `node` for the generic; `kriya`/`holon`/`karta`/`vimarsha` per the realm ontology. Don't reintroduce retired terms.
- **Test discipline**: CI validates **format only** (`make check` — frontmatter parseability + bundle sync); it does not check substance. Substance review is still manual: read the diffed `SKILL.md` and confirm every tool name against the live surface. The skill set ships by auto-discovery from `skills/`; `make validate` fails if a manifest re-introduces a component list.
- **Frontmatter must be parseable YAML.** `description` values are double-quoted; **escape any inner quote as `\"`** (an unescaped `"` terminates the scalar early — the exact bug `make validate` guards). Keep frontmatter flat and single-line — only `name` and `description` keys.

## What to update when
- `AGENTS.md` — repo conventions, structure, or the skill set change.
- `README.md` — the skill table, whenever the skill set changes (new/renamed/retired skill).
- `DERIVATION.md` — the skills ← canon re-projection map (+ the four-layer language contract): walk it after any methodology-canon change; extend it when a new canon landmark gets projected into a skill.
- `skills/verstakify/` (`SKILL.md` + `references/agents-template.md`) — when improving the bootstrap protocol/template for all future repos.
- `skills/verstakify/references/superpowers-interop.md` — when superpowers renames its skills/paths/gates (re-verify checklist inside).
- `skills/verstakify/references/delegation.md` — when Claude Code / OpenCode agent-file surfaces change (dirs, frontmatter keys, model aliases/inheritance; re-verify checklist inside).
- NKS (`r5`, #844) — every push: bring **both halves** of every touched skill to the shipped state — the phenomenon («Скилл <name>», vollzug) and its applying kriya with its step-by-step sub-kriyas (tool `next`-edges and composition `upadhi` included) — and close resolved vimarshas.

## Git workflow
- **Conventional commits** (`feat:`/`fix:`/`chore:`/`docs:`…). Branches `feat/…`, `fix/…`, `chore/…`; PR titles same format.
- **No co-author trailer.**
- **Format gate**: run `make check` before committing (CI runs the same on every push/PR). It catches malformed frontmatter and drifted bundles, not substance — still review the `SKILL.md` diff by eye.
- **Definition of done**: change committed and merged to `main` on `github.com/verstak-ai/skills` (direct push or PR, per the user's call); the user signals the merge. On merge, update NKS #844 — close resolved vimarshas, advance the bianhua they drive.
- **Never** `--force` or `git reset --hard` without explicit instruction.
