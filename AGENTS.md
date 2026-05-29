# verstak-ai/skills
Agent-facing NKS skill bundles (Claude Code skills) + the `META.md` bootstrap archetype for future repos.

## What this project is
- **Nature**: `library` — reusable Claude Code skill bundles consumed by agents in other repos. Relaxed vs production: no automated tests/CI (content is prose + methodology); the quality gate is human review of the `SKILL.md` diff plus the skills' own discipline. Breakage is silent, not loud (see Production statement).
- **NKS realm**: `nks-dev` — every session starts with `nks_orient` here.
- **Focus holon**: `#844 «📦 verstak-ai/skills (скиллы агента)»`.
- **Stack**: Markdown `SKILL.md` files under `skills/<name>/`, packaged into derived `<name>.skill` zip bundles via `make build`. Distributed as a Claude Code plugin marketplace (`methodology@verstak-ai`). No runtime, no dependencies, no CI.
- **Production statement**: skills install into agents' `~/.claude/skills/` and shape how every agent works with NKS. A wrong instruction — e.g. a reference to a tool that nks-mcp has dropped — silently degrades every agent that loads the skill; there is no crash, only methodology drift. The consumer is the agent, not a human user. Keeping skills in sync with the nks-mcp tool surface is the core maintenance obligation.

## Persistence rules
State lives in the **repo** or in **NKS** — nowhere else.
- **Repo**: `skills/<name>/SKILL.md` (source of truth), the derived `<name>.skill` bundles, `META.md`, `README.md`, conventions.
- **NKS** (`nks-dev`): design decisions, open questions (vimarshas), hand-offs, hints — the thinking around the skills. Don't restate NKS in the repo; link to the vimarsha/holon.
- **`skills/<name>/SKILL.md` is the source of truth.** The `<name>.skill` zips are derived build artifacts (committed for download/claude.ai); the installed copy in `~/.claude/skills/` is derived too. Never treat a hand-edited bundle or installed copy as canonical — edit the source dir and run `make build`.
- Fetch state; never reconstruct it from memory.

## Session lifecycle
- **Start:** `nks_orient(realm="nks-dev", focus_holon="844")`; read the latest `genre=hint` seed before acting (the `methodology-entry` skill runs the protocol).
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
| META archetype, README, conventions | ✓ (AGENTS.md / META.md) | |
| Design decisions, open questions | | ✓ (vimarshas) |
| Plans, hand-offs, hints | | ✓ (#844 + `genre=hint`) |
| Commit history, SHAs, PRs | git | (never NKS) |

## META.md is an archetype — do not delete
`META.md` is the **bootstrap template for future repos' `AGENTS.md`** — fill-in slots, `> 🛠 SETUP` callouts, and a Bootstrap checklist. It is a reusable artifact, not this repo's config. **This** repo's config is `AGENTS.md` (the file you are reading). Never delete `META.md`, never trim it down to awesome-nks specifics, and don't treat its placeholder slots as live instructions.

## Stack
Markdown `skills/<name>/SKILL.md` (+ optional `skills/<name>/references/*.md`) per skill — **edit these directly, they are plain files and fully greppable.** Each is packed into a derived `<name>.skill` zip (top-level `<name>/` dir containing `SKILL.md`) by `make build`. No code, no lockfiles, no CI.

## Commands
Edit the source under `skills/<name>/` directly — no unzip dance. The `<name>.skill` zips are regenerated, not hand-edited.

| Task | Command |
|---|---|
| Find / search across skills | `grep`/`Grep` over `skills/` (it's plain text) |
| Edit a skill | edit `skills/<name>/SKILL.md` |
| Rebuild the `.skill` bundles | `make build` (deterministic; or auto via the pre-commit hook) |
| Enable the auto-rebuild hook | `make hooks` (sets `core.hooksPath -> .githooks`) |
| Verify a bundle's contents | `unzip -l <name>.skill` |

The pre-commit hook (`.githooks/pre-commit`) rebuilds and stages the `.skill` bundles on every commit, so committed zips never drift from source. Run `make hooks` once per clone to enable it. No test/lint — the artifact is prose.

## Project structure
- `skills/<name>/SKILL.md` — **source of truth**, one dir per skill (`methodology-entry`, `nks-writing`, `nks-design`, `nks-weaving`, `nks-methodology-work`); `references/*.md` optional.
- `*.skill` — derived zip bundles (committed for manual / claude.ai install). Build output of `make build`; do not hand-edit.
- `.claude-plugin/marketplace.json` — plugin marketplace manifest (`methodology@verstak-ai`).
- `Makefile`, `scripts/build-skills.sh`, `.githooks/pre-commit` — the build.
- `META.md` — archetypal AGENTS.md bootstrap template (see above; do not delete).
- `README.md` — short human-facing pointer.
- `.claude/` — local Claude Code settings (`settings.local.json` is gitignored).
- `tmp/` — gitignored scratch.

## Code conventions
- **`SKILL.md` frontmatter**: `name:` (kebab, matches the skill dir) + `description:` carrying explicit trigger phrases — that description is what routes the skill, so keep triggers concrete.
- **Source of truth = `skills/<name>/SKILL.md`.** Edit it directly, then `make build` to regenerate the `<name>.skill` zip (which must contain `<name>/SKILL.md`, not a bare `SKILL.md`, or it won't install). New skill → add a `skills/<name>/` dir and list it in `.claude-plugin/marketplace.json`.
- **Tool references must be live.** Any `nks_*` tool a skill names must exist in the current nks-mcp surface. Dropped tools (`nks_validate`, `nks_reflect`) must not appear; shipped behavior (validate-on-create → `CHECKS:` in the create response) belongs in create-flow guidance. See nks-dev #849 / #833.
- **Terminology**: `phenomenon` for the typed primitive, `node` for the generic; `kriya`/`holon`/`karta`/`vimarsha` per the realm ontology. Don't reintroduce retired terms.
- **Test discipline**: none automated; review by reading the diffed `SKILL.md` and confirming every tool name against the live surface.

## What to update when
- `AGENTS.md` — repo conventions, structure, or the skill set change.
- `META.md` — only when improving the **archetype** for all future repos (never for awesome-nks specifics).
- NKS (`nks-dev`, #844) — every push: thread shipped skill state, close resolved vimarshas.

## Git workflow
- **Conventional commits** (`feat:`/`fix:`/`chore:`/`docs:`…). Branches `feat/…`, `fix/…`, `chore/…`; PR titles same format.
- **No co-author trailer.**
- **No local gate** (no code to lint) — review the `SKILL.md` diff before committing.
- **Definition of done**: change committed and merged to `main` on `github.com/verstak-ai/skills` (direct push or PR, per the user's call); the user signals the merge. On merge, update NKS #844 and close the driving hint.
- **Never** `--force`, `git reset --hard`, or delete `META.md` without explicit instruction.
