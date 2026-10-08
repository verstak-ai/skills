# verstak-ai/skills

One agent-facing **verstak** skill for structured inquiry over a directed graph.
The door selects methods for reading, writing, designing and weaving through the
`verstak_*` MCP tools, then verifying behavioral claims at their canonical boundary.

## Skills

| Skill | What it does |
|---|---|
| **verstak** | The method's single door: selects the relevant method and connects the agent to the graph. |

## Methods

| Method | What it does |
|---|---|
| `align` | Bootstrap or refresh a repo's agent contract. |
| `architect` | Hold cross-cutting design and acceptance together. |
| `assembly` | Discern transformations and assemble the map. |
| `assistant` | Bring the person's agenda and decisions together. |
| `autonomous` | Work on a live channel through integration. |
| `code-work` | Carry implementation work through its gates. |
| `collaborate` | Agree and hand work across boundaries. |
| `design` | Project systems from goals and risks. |
| `entry` | Orient, search and deepen in a realm. |
| `establish-mcp` | Reach the graph through the shipped stdio-to-HTTP OAuth bridge. |
| `feedback` | Record reproducible experience about the method and tools. |
| `foreman` | Coordinate a crew of doers. |
| `inquiry` | Anchor, resolve, park or close an open question. |
| `intake` | Bring external word into the graph. |
| `integrity` | Trace a transformation's impact and dependencies. |
| `minding` | Recall and record user facts in their personal graph. |
| `product-roadmap` | Derive product directions from verified ground and GitHub issues. |
| `reality-audit` | Exercise acceptance falsifiers against the canonical deliverable. |
| `reconcile` | Compare code and graph in both directions. |
| `weaving` | Complete an existing graph's semantics. |
| `widgets` | Render live graph views where the harness supports them. |
| `writing` | Write typed nodes, modes and meaningful edges. |

## Install

### Hand setup to your agent

```text
Set up verstak for me: fetch https://raw.githubusercontent.com/verstak-ai/skills/main/SETUP.md
and execute all steps autonomously, asking me for my token when needed.
```

[`SETUP.md`](SETUP.md) is the agent-executable installer.

### Claude Code plugin (recommended)

```sh
/plugin marketplace add verstak-ai/skills
/plugin install verstak@verstak-ai
```

The single skill installs under the plugin; invoke `/verstak:verstak` or let the
agent select it. Third-party marketplaces do not auto-update by default:

```sh
/plugin marketplace update verstak-ai
/reload-plugins
```

Or enable auto-update in `/plugin` → **Marketplaces** → `verstak-ai`.

### Portable install

```sh
npx skills add verstak-ai/skills --all --agent claude
```

This installs `verstak` flat into `~/.claude/skills/`. For manual installation:

```sh
unzip verstak.skill -d ~/.claude/skills/
```

Use a local agent harness that can run the stdio bridge; the browser app cannot.

## Layout & build

- `skills/verstak/SKILL.md` — the door, with skill frontmatter.
- `skills/verstak/methods/*.md` — methods, without frontmatter.
- `skills/verstak/references/*.md` and `templates/*.md` — supporting material, without frontmatter.
- `skills/verstak/scripts/verstak-bridge.mjs` — the unchanged stdio-to-HTTP OAuth bridge.
- `verstak.skill` — the only committed derived bundle; contains the complete `verstak/` tree.
- `home/` — the verstak.ai conversation home's flat catalogue: `assistant`, `minding` and `widgets` as standalone `SKILL.md` files, generated from their methods; not part of the plugin.
- `.claude-plugin/` — Claude Code plugin and marketplace metadata.

Run `make build` to regenerate the bundle and `home/`, `make check` for the full local gate,
or `make hooks` to rebuild automatically before commits. `make surface` refreshes
the snapshot from `https://mcp.verstak.ai/` when that server is available.
