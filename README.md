# verstak-ai/skills

Agent-facing skill bundles for working with **NKS** (Nyāya Knowledge System) — a method of
structured inquiry over a directed graph. These are Claude Code skills that teach an agent how
to read, write, design, and weave an NKS graph through the `nks_*` MCP tools.

## Skills

| Skill | What it does |
|---|---|
| **entry** | Orientation & reading protocol — enter a realm, search, deepen. |
| **writing** | Node-writing discipline — naming (正名), modes, edges. |
| **design** | Projecting systems — backward chaining, forward weaving, risk analysis. |
| **weaving** | Semantic completion of an existing graph — close lifecycles, fix tensions. |
| **methodology-work** | Working on the methodology realm itself. |

Plus `META.md` — a bootstrap template for a new repo's `AGENTS.md`.

## Install

### Claude Code plugin (recommended)

```sh
/plugin marketplace add verstak-ai/skills
/plugin install methodology@verstak-ai
```

All five skills install together under the `methodology` plugin (invoke explicitly as
`/methodology:design`, etc.; model-driven invocation works automatically).

**Updating.** `verstak-ai` is a third-party marketplace, so — unlike the official Anthropic
marketplace — it does **not** auto-update. Anything not from the official marketplace must be
updated manually:

```sh
/plugin marketplace update verstak-ai
/reload-plugins
```

Or enable auto-update once: `/plugin` → **Marketplaces** → `verstak-ai` → **Enable auto-update**
(then it refreshes and updates the plugin at startup).

### npx

```sh
npx skills add verstak-ai/skills --all --agent claude
```

`--agent claude` lands skills in `~/.claude/skills/`, which Claude Code scans — **not** the
default `~/.agents/skills/`.

### Manual (`.skill` bundle)

Each `*.skill` is a committed zip bundle (`<name>/SKILL.md`). Upload it as a Skill in
**claude.ai**, or unzip into your Claude Code skills directory:

```sh
unzip design.skill -d ~/.claude/skills/
```

## Layout & build

- `skills/<name>/SKILL.md` — **source of truth.**
- `*.skill` — committed **derived** bundles. Never hand-edit; run `make build` (or just commit
  with the hook enabled via `make hooks`, which rebuilds them on every commit).
- `.claude-plugin/marketplace.json` — plugin marketplace manifest.
