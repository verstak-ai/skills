# verstak-ai/skills

Agent-facing skill bundles for working with **NKS** (Nyāya Knowledge System) — a method of
structured inquiry over a directed graph. These are Claude Code skills that teach an agent how
to read, write, design, and weave an NKS graph through the `nks_*` MCP tools.

## Skills

| Skill | What it does |
|---|---|
| **methodology-entry** | Orientation & reading protocol — enter a realm, search, deepen. |
| **nks-writing** | Node-writing discipline — naming (正名), modes, edges. |
| **nks-design** | Projecting systems — backward chaining, forward weaving, risk analysis. |
| **nks-weaving** | Semantic completion of an existing graph — close lifecycles, fix tensions. |
| **nks-methodology-work** | Working on the methodology realm itself. |

Plus `META.md` — a bootstrap template for a new repo's `AGENTS.md`.

## Install

### Claude Code plugin (recommended)

```sh
/plugin marketplace add verstak-ai/skills
/plugin install methodology@verstak-ai
```

All five skills install together under the `methodology` plugin (invoke explicitly as
`/methodology:nks-design`, etc.; model-driven invocation works automatically).

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
unzip nks-design.skill -d ~/.claude/skills/
```

## Layout & build

- `skills/<name>/SKILL.md` — **source of truth.**
- `*.skill` — committed **derived** bundles. Never hand-edit; run `make build` (or just commit
  with the hook enabled via `make hooks`, which rebuilds them on every commit).
- `.claude-plugin/marketplace.json` — plugin marketplace manifest.
