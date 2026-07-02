# verstak-ai/skills
Agent-facing NKS skill bundles (Claude Code skills), including `verstakify` — the skill that bootstraps any repo to this `AGENTS.md` standard.

## What this project is
- **Nature**: `library` — reusable Claude Code skill bundles consumed by agents in other repos. Relaxed vs production: content is prose + methodology, so there are no behavioural tests. The gates are (1) human review of the `SKILL.md` diff plus the skills' own discipline and (2) a lightweight CI that validates the frontmatter contract and bundle sync (`make check`). Breakage is otherwise silent, not loud (see Production statement) — CI catches the one mechanical class (malformed frontmatter / drifted bundles).
- **NKS realm**: `nks-dev` — every session starts with `nks_orient` here.
- **Focus holon**: `#844 «📦 verstak-ai/skills (скиллы агента)»`.
- **Stack**: Markdown `SKILL.md` files under `skills/<name>/`, packaged into derived `<name>.skill` zip bundles via `make build`. Distributed as a Claude Code plugin marketplace (`verstak@verstak-ai`), versioned by semver in `.claude-plugin/plugin.json`. No runtime, no dependencies; the CI format gate stays dependency-free (pure Node + bash, `.github/workflows/ci.yml`). Releases are automated by the one third-party Action — release-please (`.github/workflows/release-please.yml`).
- **Production statement**: skills install into agents' `~/.claude/skills/` and shape how every agent works with NKS. A wrong instruction — e.g. a reference to a tool that nks-mcp has dropped — silently degrades every agent that loads the skill; there is no crash, only methodology drift. The consumer is the agent, not a human user. Keeping skills in sync with the nks-mcp tool surface is the core maintenance obligation.

## Persistence rules
State lives in the **repo** or in **NKS** — nowhere else.
- **Repo**: `skills/<name>/SKILL.md` (source of truth), the derived `<name>.skill` bundles, `README.md`, conventions.
- **NKS** (`nks-dev`): design decisions, open questions (vimarshas), hand-offs, hints — the thinking around the skills. Don't restate NKS in the repo; link to the vimarsha/holon.
- **`skills/<name>/SKILL.md` is the source of truth.** The `<name>.skill` zips are derived build artifacts (committed for download/claude.ai); the installed copy in `~/.claude/skills/` is derived too. Never treat a hand-edited bundle or installed copy as canonical — edit the source dir and run `make build`.
- Fetch state; never reconstruct it from memory.

## Session lifecycle
- **Start:** `nks_orient(realm="nks-dev", focus_holon="844")`; orient by the ACTIVE BIANHUA map (`lens="bianhua"` for the forest) — open work lives as anga-vimarshas on transformations; a `genre=hint` seed, if any, is a pointer for what the map doesn't carry. The `entry` skill runs the protocol.
- **Every push → update NKS:** thread shipped skill changes into holon #844 — concretely, update the **skill phenomena** (the `given_as=vollzug` nodes under #844, «Скилл <name>», #845…): each description matches the shipped `SKILL.md` state, a new skill gets a new phenomenon (+ its applying kriya, pattern of #924–#927). Advance the map — close (visarjana) the vimarshas the push resolved, keep open work attached via `anga`. A thin `genre=hint` is left only for what the graph can't carry (pointer, not payload — methodology #131), never by default.
- **Keep git refs out of NKS** — no SHAs, branch names, or PR numbers in nodes.
- **Skill ↔ tool sync is the recurring driver:** when nks-mcp renames or drops a tool (zontik #833 waves), the matching skill edits land here, ideally in the same atomic unit of time.

### Branch discipline
One branch through to its merge — commit follow-ups into it, don't chain new branches before it merges. After merge: `git checkout main && git pull`, delete the merged branch, update NKS (#844 + close resolved vimarshas).

## Working principles
1. **Think before editing.** Orient in nks-dev; read the bianhua map. Inspect the real source in `skills/<name>/SKILL.md` — not the derived `.skill` zip, not the installed copy, not assumptions.
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

Releases are automated (release-please) — there is no local release command; see **Git workflow → Releasing**.

The pre-commit hook (`.githooks/pre-commit`) rebuilds and stages the `.skill` bundles on every commit, so committed zips never drift from source. Run `make hooks` once per clone to enable it. The only automated gate is **format**, not behaviour: `make validate` parses each `SKILL.md` frontmatter (catching malformed YAML such as an unescaped quote in a `description`) and `make check-bundles` confirms each `<name>.skill` contains a `<name>/` tree byte-identical to its source. Both run in GitHub CI on every push/PR (`.github/workflows/ci.yml`). The substance of a skill — whether its prose and tool references are right — is still gated by human review of the diff.

## Project structure
- `skills/<name>/SKILL.md` — **source of truth**, one dir per skill (`entry`, `writing`, `design`, `weaving`, `inquiry`, `assembly`, `integrity`, `methodology-work`, `verstakify`); `references/*.md` optional (`verstakify` ships `references/agents-template.md`).
- `*.skill` — derived zip bundles (committed for manual / claude.ai install). Build output of `make build`; do not hand-edit.
- `.claude-plugin/marketplace.json` — plugin marketplace manifest (`verstak@verstak-ai`); `metadata.version` mirrors the plugin version.
- `.claude-plugin/plugin.json` — the `verstak` plugin manifest; its `version` is what Claude Code reads to detect updates (bumped by release-please, never by hand).
- `Makefile`, `scripts/build-skills.sh`, `.githooks/pre-commit` — the build.
- `scripts/validate-skills.mjs` (frontmatter contract + version contract, pure Node), `scripts/check-bundles.sh` (bundle ↔ source sync), `.github/workflows/ci.yml` — the format gate.
- `release-please-config.json`, `.release-please-manifest.json`, `.github/workflows/release-please.yml` — release automation. `CHANGELOG.md` + `version.txt` are release-please's outputs (`version.txt` is its `simple`-strategy bookkeeping — the authoritative version is `plugin.json`; all three move together on release).
- `README.md` — short human-facing pointer.
- `.claude/` — local Claude Code settings (`settings.local.json` is gitignored).
- `tmp/` — scratch dir (no longer gitignored; `.gitignore` now ignores `.DS_Store` only — keep scratch out of commits yourself).

## Code conventions
- **`SKILL.md` frontmatter**: `name:` (kebab, matches the skill dir) + `description:` carrying explicit trigger phrases — that description is what routes the skill, so keep triggers concrete.
- **Skill names are bare** — no `nks-`/`verstak-` prefix. The `verstak` plugin namespaces them (`/verstak:<skill>`), so a prefix would only stutter. Trade-off: flat installs (`npx skills`, manual unzip) drop skills into `~/.claude/skills/<name>/` under the bare name and can collide there — the plugin is the canonical, collision-proof channel (see NKS #844).
- **Source of truth = `skills/<name>/SKILL.md`.** Edit it directly, then `make build` to regenerate the `<name>.skill` zip (which must contain `<name>/SKILL.md`, not a bare `SKILL.md`, or it won't install). New skill → add a `skills/<name>/` dir and list it in `.claude-plugin/marketplace.json`.
- **Tool references must be live.** Any `nks_*` tool a skill names must exist in the current nks-mcp surface. Dropped tools (`nks_validate`, `nks_reflect`) must not appear; shipped behavior (validate-on-create → `CHECKS:` in the create response) belongs in create-flow guidance. See nks-dev #849 / #833.
- **Terminology**: `phenomenon` for the typed primitive, `node` for the generic; `kriya`/`holon`/`karta`/`vimarsha` per the realm ontology. Don't reintroduce retired terms.
- **Test discipline**: CI validates **format only** (`make check` — frontmatter parseability + bundle sync); it does not check substance. Substance review is still manual: read the diffed `SKILL.md` and confirm every tool name against the live surface. When adding/renaming a skill, the new dir must be listed in `marketplace.json` or `make validate` fails.
- **Frontmatter must be parseable YAML.** `description` values are double-quoted; **escape any inner quote as `\"`** (an unescaped `"` terminates the scalar early — the exact bug `make validate` guards). Keep frontmatter flat and single-line — only `name` and `description` keys.
- **The plugin version drives updates — release-please owns it.** The version lives in `.claude-plugin/plugin.json` (Claude Code's highest-precedence source); an install only refreshes when that string *changes*, so shipping skills without a bump silently strands every install on the cached copy. Don't hand-edit the version anywhere — release-please computes it from the Conventional Commit history and bumps `version.txt`, `plugin.json`, and `marketplace.json`'s `metadata.version` together in its release PR. `make validate` still guards the invariant: `plugin.json` ↔ `marketplace.json` in sync, semver, and no stray `version` in the marketplace plugin entry (`plugin.json` wins, so a duplicate there is a silent-drift trap).

## What to update when
- `AGENTS.md` — repo conventions, structure, or the skill set change.
- `skills/verstakify/` (`SKILL.md` + `references/agents-template.md`) — when improving the bootstrap protocol/template for all future repos.
- NKS (`nks-dev`, #844) — every push: update the skill phenomena («Скилл <name>», vollzug under #844) to the shipped state, close resolved vimarshas.
- Releases — nothing manual: a `feat:`/`fix:` commit merged to `main` makes release-please open/refresh a release PR; merging that PR ships the version bump. `chore:`/`docs:` don't trigger a release, so a user-facing skill change must land under `feat:`/`fix:` to reach installs.

## Git workflow
- **Conventional commits** (`feat:`/`fix:`/`chore:`/`docs:`…). Branches `feat/…`, `fix/…`, `chore/…`; PR titles same format.
- **No co-author trailer.**
- **Format gate**: run `make check` before committing (CI runs the same on every push/PR). It catches malformed frontmatter and drifted bundles, not substance — still review the `SKILL.md` diff by eye.
- **Definition of done**: change committed and merged to `main` on `github.com/verstak-ai/skills` (direct push or PR, per the user's call); the user signals the merge. On merge, update NKS #844 — close resolved vimarshas, advance the bianhua they drive.
- **Releasing (automated)**: releases run on Conventional Commits via release-please — no manual bump, no manual tag. Merging `feat:`/`fix:` commits to `main` makes release-please open/refresh a **release PR** that bumps the version (`version.txt` + `plugin.json` + `marketplace.json`) and updates `CHANGELOG.md`; merging that release PR tags `vX.Y.Z` and cuts a GitHub Release. A skill change reaches installs only once its release PR is merged — batch changes, then ship the release PR. Users update via `/plugin marketplace update verstak-ai` → `/reload-plugins`.
- **Never** `--force` or `git reset --hard` without explicit instruction.
