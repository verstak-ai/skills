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

### Manual (`.skill` bundle) — works today

Each `*.skill` is a zip bundle containing `<name>/SKILL.md`. Either:

- upload the bundle as a Skill in **claude.ai**, or
- unzip it into your Claude Code skills directory:
  ```sh
  unzip nks-design.skill -d ~/.claude/skills/
  ```

### Claude Code plugin & `npx skills` — in progress

The repo is migrating to the extracted `skills/<name>/SKILL.md` layout so it can be installed as:

- a **Claude Code plugin**:
  ```sh
  /plugin marketplace add verstak-ai/skills
  /plugin install methodology@verstak-ai
  ```
- via **npx**:
  ```sh
  npx skills add verstak-ai/skills --all --agent claude
  ```
  (`--agent claude` lands skills in `~/.claude/skills/`, which Claude Code scans — not the
  default `~/.agents/skills/`.)
