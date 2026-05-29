# awesome-nks
Agent-facing NKS skill bundles (Claude Code skills) + the `META.md` bootstrap archetype for future repos.

## What this project is
- **Nature**: `library` — reusable Claude Code skill bundles consumed by agents in other repos. Relaxed vs production: no automated tests/CI (content is prose + methodology); the quality gate is human review of the `SKILL.md` diff plus the skills' own discipline. Breakage is silent, not loud (see Production statement).
- **NKS realm**: `nks-dev` — every session starts with `nks_orient` here.
- **Focus holon**: `#844 «Репозиторий awesome-nks (скиллы агента)»`.
- **Stack**: Markdown `SKILL.md` files packaged as zip `.skill` bundles. No build system, no runtime, no dependencies.
- **Production statement**: skills install into agents' `~/.claude/skills/` and shape how every agent works with NKS. A wrong instruction — e.g. a reference to a tool that nks-mcp has dropped — silently degrades every agent that loads the skill; there is no crash, only methodology drift. The consumer is the agent, not a human user. Keeping skills in sync with the nks-mcp tool surface is the core maintenance obligation.

## Persistence rules
State lives in the **repo** or in **NKS** — nowhere else.
- **Repo**: the `.skill` bundles (source of truth), `META.md`, `README.md`, conventions.
- **NKS** (`nks-dev`): design decisions, open questions (vimarshas), hand-offs, hints — the thinking around the skills. Don't restate NKS in the repo; link to the vimarsha/holon.
- **The `.skill` bundle in this repo is the source of truth — NOT the installed copy** in `~/.claude/skills/`. Installed copies are derived; never treat a hand-edited installed copy as canonical.
- Fetch state; never reconstruct it from memory.

## Session lifecycle
- **Start:** `nks_orient(realm="nks-dev", focus_holon="844")`; read the latest `genre=hint` seed before acting (the `methodology-entry` skill runs the protocol).
- **Every push → update NKS:** thread shipped skill changes into holon #844; handle the driving hint seed — close it if its skill-edits shipped, edit it if partial, leave a new `genre=hint` only if work continues.
- **Keep git refs out of NKS** — no SHAs, branch names, or PR numbers in nodes.
- **Skill ↔ tool sync is the recurring driver:** when nks-mcp renames or drops a tool (zontik #833 waves), the matching skill edits land here, ideally in the same atomic unit of time.

### Branch discipline
One branch through to its merge — commit follow-ups into it, don't chain new branches before it merges. After merge: `git checkout main && git pull`, delete the merged branch, update NKS (#844 + close resolved vimarshas).

## Working principles
1. **Think before editing.** Orient in nks-dev; read the hint seed. Inspect the real `.skill` source (unzip) — not the installed copy, not assumptions.
2. **Surgical changes.** Touch only the skill steps the task needs. Match each bundle's existing register and terminology. Don't mass-rewrite a bundle for one fix unless asked.
3. **Sync over invention.** A skill instruction must match the live nks-mcp tool surface — verify tool names exist before writing them into a skill.
4. **Terminology is load-bearing.** Skills teach vocabulary to every downstream agent. Use the realm's current terms (`phenomenon`, not the retired `entity`); a typed primitive (target of given_as / ahara / upadhi / context) is a `phenomenon`, a generic graph object is a `node`.

## NKS ↔ repo: where things live
| Concern | Repo | NKS |
|---|---|---|
| `.skill` bundles (source of truth) | ✓ | |
| META archetype, README, conventions | ✓ (AGENTS.md / META.md) | |
| Design decisions, open questions | | ✓ (vimarshas) |
| Plans, hand-offs, hints | | ✓ (#844 + `genre=hint`) |
| Commit history, SHAs, PRs | git | (never NKS) |

## META.md is an archetype — do not delete
`META.md` is the **bootstrap template for future repos' `AGENTS.md`** — fill-in slots, `> 🛠 SETUP` callouts, and a Bootstrap checklist. It is a reusable artifact, not this repo's config. **This** repo's config is `AGENTS.md` (the file you are reading). Never delete `META.md`, never trim it down to awesome-nks specifics, and don't treat its placeholder slots as live instructions.

## Stack
Markdown `SKILL.md` (+ optional `references/*.md`) per skill, zipped into `<name>.skill`. Zip internal layout: a single top-level `<name>/` directory containing `SKILL.md`. No code, no lockfiles, no CI.

## Commands
`.skill` files are zip archives — edit via unzip → edit → rezip. `tmp/` is gitignored as the scratch area.

> ⚠️ **A `.skill` is a binary zip — you cannot grep it.** `grep`/`Grep` over a raw `*.skill` finds nothing (it's compressed bytes). Always unzip every bundle into `tmp/` first, then search/read/edit the extracted `SKILL.md`. To scope a cross-skill change (e.g. a tool rename), extract all bundles into `tmp/` and grep there.

| Task | Command |
|---|---|
| Inspect a bundle | `unzip -o <name>.skill -d tmp/<name>` |
| Edit | edit `tmp/<name>/<name>/SKILL.md` |
| Repack | `rm -f <name>.skill && (cd tmp/<name> && zip -rq ../../<name>.skill <name>)` |
| Verify contents | `unzip -l <name>.skill` |

No build/test/lint — the artifact is prose.

## Project structure
- `*.skill` — one zipped bundle per skill (`methodology-entry`, `nks-writing`, `nks-design`, `nks-weaving`, `nks-methodology-work`).
- `META.md` — archetypal AGENTS.md bootstrap template (see above; do not delete).
- `README.md` — short human-facing pointer.
- `.claude/` — local Claude Code settings (`settings.local.json` is gitignored).
- `tmp/` — gitignored scratch for unzip/rezip.

## Code conventions
- **`SKILL.md` frontmatter**: `name:` (kebab, matches the bundle dir) + `description:` carrying explicit trigger phrases — that description is what routes the skill, so keep triggers concrete.
- **Source of truth = the `.skill` bundle.** When editing: unzip, edit `SKILL.md`, rezip preserving the `<name>/` root. (why: the archive must contain `<name>/SKILL.md`, not a bare `SKILL.md`, or it won't install.)
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
- **Definition of done**: change committed and merged to `main` on `github.com/fluencelabs/awesome-nks` (direct push or PR, per the user's call); the user signals the merge. On merge, update NKS #844 and close the driving hint.
- **Never** `--force`, `git reset --hard`, or delete `META.md` without explicit instruction.
