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
| `onboarding` | Lead a person with no working graph to working on their own, one step at a time. |
| `product-roadmap` | Derive product directions from verified ground and GitHub issues. |
| `reality-audit` | Exercise acceptance falsifiers against the canonical deliverable. |
| `reconcile` | Compare code and graph in both directions. |
| `weaving` | Complete an existing graph's semantics. |
| `widgets` | Render live graph views where the harness supports them. |
| `writing` | Write typed nodes, modes and meaningful edges. |

## Install

### Hand setup to your agent

```text
Install the verstak skill for me through your harness's own channel: in Claude Code the plugin
(`claude plugin marketplace add verstak-ai/skills`, then `claude plugin install verstak@verstak-ai`),
in Codex the plugin (`codex plugin marketplace add https://github.com/verstak-ai/skills`, then
`codex plugin add verstak@verstak-ai`), in pi `pi install git:github.com/verstak-ai/skills`, in Claude Desktop chat I upload
`verstak.skill` from the latest release, elsewhere flat — `npx skills add verstak-ai/skills
--all --global`. Then, in a new session, do "/verstak connect the graph"
(`/verstak:verstak connect the graph` under the Claude Code plugin).
```

The installed skill's `establish-mcp` method connects the graph on the word "/verstak
connect the graph" (`/verstak:verstak` under the Claude Code plugin). [`SETUP.md`](SETUP.md)
is the per-harness reference — read it, don't fetch it to execute. Manual paths by harness
follow.

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

### Codex plugin

```sh
codex plugin marketplace add https://github.com/verstak-ai/skills
codex plugin add verstak@verstak-ai
```

The skill and the bridge arrive with the plugin (the MCP entry in its manifest); the bridge
holds its own grant, so no Codex login is needed. Coming from the manual path, first
`codex mcp remove verstak` and `npx skills remove verstak --global`: a leftover
`[mcp_servers.verstak]` entry overrides the plugin's server, and plugin updates then bring
no new bridge. Hearing a live channel needs the
app-server daemon recipe in [`SETUP.md`](SETUP.md), the Codex branch.

### Portable install

```sh
npx skills add verstak-ai/skills --all --agent claude
```

This installs `verstak` flat into `~/.claude/skills/`. For manual installation:

```sh
unzip verstak.skill -d ~/.claude/skills/
```

Use a local agent harness that can run the stdio bridge; the browser app cannot. The
bridge is the only path to the graph: connecting the server directly as a harness
connector does not work and is not supported.

## Layout & build

- `skills/verstak/SKILL.md` — the door, with skill frontmatter.
- `skills/verstak/methods/*.md` — methods, without frontmatter.
- `skills/verstak/references/*.md` and `templates/*.md` — supporting material, without frontmatter.
- `skills/verstak/scripts/verstak-bridge.mjs`, `opencode-plugin.js` — the stdio-to-HTTP OAuth bridge and the OpenCode plugin, built from `js/` (the shared core plus the English delivery layer); `extensions/verstak.js` — the pi extension. Never edited by hand.
- `verstak.skill` — the only committed derived bundle; contains the complete `verstak/` tree.
- `home/` — the verstak.ai conversation home's flat catalogue: `assistant`, `minding`, `onboarding` and `widgets` as standalone `SKILL.md` files, generated from their methods; not part of the plugin.
- `.claude-plugin/` — Claude Code plugin and marketplace metadata.
- `.codex-plugin/`, `.agents/plugins/` — Codex plugin manifest and marketplace.

Run `make deps` once for the `js/` toolchain, `make build` to regenerate the bundle and `home/`, `make check` for the full local gate,
or `make hooks` to rebuild automatically before commits. `make surface` refreshes
the snapshot from the graph server through the bundled bridge when it is reachable.
