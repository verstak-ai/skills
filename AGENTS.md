# verstak-ai/skills
Agent-facing NKS skill bundles (Claude Code skills), including `verstakify` — the skill that bootstraps any repo to this `AGENTS.md` standard.

## What this project is
- **Nature**: `library` — reusable Claude Code skill bundles consumed by agents in other repos. Relaxed vs production: content is prose + methodology, so there are no behavioural tests. The gates are (1) human review of the `SKILL.md` diff plus the skills' own discipline and (2) a lightweight CI that validates the frontmatter contract and bundle sync (`make check`). Breakage is otherwise silent, not loud (see Production statement) — CI catches the one mechanical class (malformed frontmatter / drifted bundles).
- **NKS realm**: `nks-dev` — every session starts with `nks_orient` here.
- **Focus holon**: `#844 «📦 verstak-ai/skills (скиллы агента)»`.
- **Stack**: Markdown `SKILL.md` files under `skills/<name>/`, packaged into derived `<name>.skill` zip bundles via `make build`. Distributed as a Claude Code plugin marketplace (`verstak@verstak-ai`). No runtime, no dependencies; CI is a dependency-free format gate (pure Node + bash) — see `.github/workflows/ci.yml`.
- **Production statement**: skills install into agents' `~/.claude/skills/` and shape how every agent works with NKS. A wrong instruction — e.g. a reference to a tool that nks-mcp has dropped — silently degrades every agent that loads the skill; there is no crash, only methodology drift. The consumer is the agent, not a human user. Keeping skills in sync with the nks-mcp tool surface is the core maintenance obligation.

## Persistence rules
State lives in the **repo** or in **NKS** — nowhere else.
- **Repo**: `skills/<name>/SKILL.md` (source of truth), the derived `<name>.skill` bundles, `README.md`, conventions.
- **NKS** (`nks-dev`): design decisions, open questions (vimarshas), hand-offs, hints — the thinking around the skills. Don't restate NKS in the repo; link to the vimarsha/holon.
- **`skills/<name>/SKILL.md` is the source of truth.** The `<name>.skill` zips are derived build artifacts (committed for download/claude.ai); the installed copy in `~/.claude/skills/` is derived too. Never treat a hand-edited bundle or installed copy as canonical — edit the source dir and run `make build`.
- Fetch state; never reconstruct it from memory.

## Session lifecycle
- **Start:** `nks_orient(realm="nks-dev", focus_holon="844")`; read the latest `genre=hint` seed before acting (the `entry` skill runs the protocol).
- **Every push → update NKS:** thread shipped skill changes into holon #844; handle the driving hint seed — close it if its skill-edits shipped, edit it if partial, leave a new `genre=hint` only if work continues.
- **Keep git refs out of NKS** — no SHAs, branch names, or PR numbers in nodes.
- **Skill ↔ tool sync is the recurring driver:** when nks-mcp renames or drops a tool (zontik #833 waves), the matching skill edits land here, ideally in the same atomic unit of time.

### Branch discipline
One branch through to its merge — commit follow-ups into it, don't chain new branches before it merges. After merge: `git checkout main && git pull`, delete the merged branch, update NKS (#844 + close resolved vimarshas).

## Working principles
1. **Think before editing.** Orient in nks-dev; read the hint seed. Inspect the real source in `skills/<name>/SKILL.md` — not the derived `.skill` zip, not the installed copy, not assumptions.
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
| Plans, hand-offs, hints | | ✓ (#844 + `genre=hint`) |
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
- `skills/<name>/SKILL.md` — **source of truth**, one dir per skill (`entry`, `writing`, `design`, `weaving`, `inquiry`, `assembly`, `methodology-work`, `verstakify`); `references/*.md` optional (`verstakify` ships `references/agents-template.md`).
- `*.skill` — derived zip bundles (committed for manual / claude.ai install). Build output of `make build`; do not hand-edit.
- `.claude-plugin/marketplace.json` — plugin marketplace manifest (`verstak@verstak-ai`).
- `Makefile`, `scripts/build-skills.sh`, `.githooks/pre-commit` — the build.
- `scripts/validate-skills.mjs` (frontmatter contract, pure Node), `scripts/check-bundles.sh` (bundle ↔ source sync), `.github/workflows/ci.yml` — the format gate.
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

## What to update when
- `AGENTS.md` — repo conventions, structure, or the skill set change.
- `skills/verstakify/` (`SKILL.md` + `references/agents-template.md`) — when improving the bootstrap protocol/template for all future repos.
- NKS (`nks-dev`, #844) — every push: thread shipped skill state, close resolved vimarshas.

## Git workflow
- **Conventional commits** (`feat:`/`fix:`/`chore:`/`docs:`…). Branches `feat/…`, `fix/…`, `chore/…`; PR titles same format.
- **No co-author trailer.**
- **Format gate**: run `make check` before committing (CI runs the same on every push/PR). It catches malformed frontmatter and drifted bundles, not substance — still review the `SKILL.md` diff by eye.
- **Definition of done**: change committed and merged to `main` on `github.com/verstak-ai/skills` (direct push or PR, per the user's call); the user signals the merge. On merge, update NKS #844 and close the driving hint.
- **Never** `--force` or `git reset --hard` without explicit instruction.
