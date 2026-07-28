# verstak-ai/skills

Agent-facing skill bundles for working with **NKS** (Nyāya Knowledge System) — a method of
structured inquiry over a directed graph — and for verifying the implementations that agents
produce. They teach an agent how to read, write, design, and weave an NKS graph through the
`nks_*` MCP tools, then test behavioral claims at the canonical public boundary.

## Skills

| Skill | What it does |
|---|---|
| **entry** | Orientation & reading protocol — enter a realm, search, deepen. |
| **writing** | Node-writing discipline — naming (正名), modes, edges. |
| **design** | Projecting systems — backward chaining, forward weaving, risk analysis. |
| **weaving** | Semantic completion of an existing graph — close lifecycles, fix tensions. |
| **inquiry** | The life of a vimarsha — anchor, resolve, close, park, crystallize, attach to a bianhua. |
| **assembly** | The 時-cycle ritual — discern the bianhua a realm is undergoing and produce 形, the assembly map. |
| **integrity** | Wrap a bianhua in integrity — propagate a transformation's impact wavefront and surface what it touches. |
| **reality-audit** | Terminal implementation check — rebuild the canonical deliverable and exercise exact acceptance falsifiers before claiming done. |
| **intake** | Bring external word (шабда) into a realm — map form→type, mode by kind (#104), dedup, anchor, verify by пратьякша. Source-independent. |
| **on-duty** | Stand watch — the agent's autonomous duty cycle: drain the doer's inbox, wire dependencies into other doers' inboxes, weave the wake, wait consciously (webhook / bounded re-check). Scoped mode drives one bianhua to arrival. |
| **methodology-work** | Working on the methodology realm itself. |
| **verstakify** | Bootstrap a repo to the verstak `AGENTS.md` standard — generate `AGENTS.md` (+ `CLAUDE.md` pointer: `@AGENTS.md` import, Windows-safe), wire the NKS session rituals, set the quality gate. |
| **product-roadmap** | Build a product roadmap for a product you maintain on GitHub — one repo or many (an org / repo-set treated as one product) — by modelling it as a verified ground, harvesting its issues + PRs, and assembling the directions it's actually under. Composes verstakify + intake + assembly. |

## Install

### Fastest: hand the setup to your agent

Paste this prompt into the agent you already run (Claude Code, Cursor, Codex):

```
Set up verstak for me: fetch https://raw.githubusercontent.com/verstak-ai/skills/main/SETUP.md
and execute all steps autonomously, asking me for my token when needed.
```

[`SETUP.md`](SETUP.md) is the agent-executable installer — plain markdown, read it first
if you like. Manual paths below.

### Claude Code plugin (recommended)

```sh
/plugin marketplace add verstak-ai/skills
/plugin install verstak@verstak-ai
```

All skills install together under the `verstak` plugin (invoke explicitly as
`/verstak:design`, etc.; model-driven invocation works automatically).

**Updating.** `verstak-ai` is a third-party marketplace, so — unlike the official Anthropic
marketplace — it does **not** auto-update. Anything not from the official marketplace must be
updated manually:

```sh
/plugin marketplace update verstak-ai
/reload-plugins
```

Or enable auto-update once: `/plugin` → **Marketplaces** → `verstak-ai` → **Enable auto-update**
(then it refreshes and updates the plugin at startup).

### Portable install (other agents, claude.ai)

For Claude Code, prefer the plugin above — it namespaces the skills (`/verstak:design`) and
keeps them isolated. The methods below install **flat** into a shared skills directory under
the bare skill names (`design`, `writing`, …), so they can clash with other skills of the same
name — rename the target directory if that happens. They don't affect the plugin install.

**npx** (Claude Code, Cursor, Codex, …):

```sh
npx skills add verstak-ai/skills --all --agent claude
```

`--agent claude` lands skills in `~/.claude/skills/` (what Claude Code scans), not the default
`~/.agents/skills/`.

**claude.ai / manual:** each `*.skill` is a committed zip bundle (`<name>/SKILL.md`). Upload it
as a Skill in claude.ai, or unzip into your skills directory:

```sh
unzip design.skill -d ~/.claude/skills/
```

## Layout & build

- `skills/<name>/SKILL.md` — **source of truth.**
- `*.skill` — committed **derived** bundles. Never hand-edit; run `make build` (or just commit
  with the hook enabled via `make hooks`, which rebuilds them on every commit).
- `.claude-plugin/marketplace.json` — plugin marketplace manifest.
