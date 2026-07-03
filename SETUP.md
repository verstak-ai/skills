# verstak setup (agent-executable)

You are a coding agent setting up **verstak** for your user. Execute the steps below
autonomously, in order — the graph server authenticates via **OAuth** (browser login),
so on the default path you ask the user for nothing. Only the headless/no-OAuth
fallback needs their **graph token** — never invent, guess, or reuse one. Report the
result of each step.

verstak is two parts:

1. **Skills** — plain-markdown method bundles from this repo (readable before install).
2. **Graph MCP server** — the remote NKS reasoning graph, exposed as `nks_*` tools.

## 0. Detect your harness

Identify which agent you are running as — Claude Code, Cursor, Codex, or other — and
follow that path below. If you cannot tell, ask the user.

## 1. Install the skills

**Claude Code** (preferred — namespaced, collision-proof):

```sh
claude plugin marketplace add verstak-ai/skills
claude plugin install verstak@verstak-ai
```

(Inside an interactive session: `/plugin marketplace add verstak-ai/skills` then
`/plugin install verstak@verstak-ai`.)

**Cursor / Codex / any other agent** (flat install, ~70 harnesses supported):

```sh
npx skills add verstak-ai/skills --all
```

Add `--agent codex` (or `-a cursor`, …) to target a specific harness explicitly.

## 2. Connect the graph server

The server speaks **OAuth**: an interactive harness pointed at the URL opens a browser
login on first contact — no pre-shared token, nothing to paste.

<!-- Interim endpoint (owner-confirmed): nks.lab.mirari.ru is the live server today.
     It moves to the public domains (mcp.verstak.ai / mcp.mirari.ru) as production
     deploys land — this file is the single place to update. -->

> **Claude Code + plugin (step 1): nothing to configure.** The plugin bundles this
> server (`.mcp.json` in the plugin root); the first `nks_*` call (or `/mcp`) opens
> the OAuth login. Skip the rest of this step.

**Claude Code without the plugin:**

```sh
claude mcp add --transport http nks https://nks.lab.mirari.ru/mcp
```

**Cursor** — merge into `.cursor/mcp.json` (project) or `~/.cursor/mcp.json` (global):

```json
{ "mcpServers": { "nks": { "url": "https://nks.lab.mirari.ru/mcp" } } }
```

OAuth login triggers on first use in both.

**Fallback — headless agents and harnesses without MCP-OAuth support** (Codex-style
configs, CI, autonomous VMs): use a personal access token instead. Ask the user for
it (it comes with the early-access invite) — never invent one — and pass it as a
Bearer header, e.g.:

```sh
npx add-mcp https://nks.lab.mirari.ru/mcp --header "Authorization: Bearer ${VERSTAK_TOKEN}"
```

```toml
# Codex ~/.codex/config.toml
[mcp_servers.nks]
url = "https://nks.lab.mirari.ru/mcp"
bearer_token_env_var = "VERSTAK_TOKEN"
```

Store the token where your harness expects env vars; do not hard-code it into files
that get committed. The token never goes into the URL.

## 3. Restart

Tell the user installation is done and ask them to restart the session so the new
skills and connection are picked up. This is the end of what you can do here.

## 4. First session: verstakify

In the fresh session, the user says `verstakify` (or `/verstak:verstakify` with the
Claude Code plugin). The agent then verifies the connection (`nks_orient` returns a
realm list), brings the repo to the verstak standard (`AGENTS.md` + session rituals),
and seeds the graph with the structure the codebase already shows.

## Troubleshooting

- **401 / auth error** → on the OAuth path, re-run the login (`/mcp` → authenticate,
  or restart the session). On the token fallback the token is wrong or expired —
  re-ask the user; do not retry
  with variations.
- **`nks_*` tools not visible** → the MCP config loads on session start: restart the
  session (or reload MCP config) and verify again.
- **Skill name collision on flat installs** → another skill pack already uses a bare
  name like `design`. Rename that directory, or use the Claude Code plugin channel,
  which namespaces everything under `verstak`.
