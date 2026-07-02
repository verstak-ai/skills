# verstak setup (agent-executable)

You are a coding agent setting up **verstak** for your user. Execute the steps below
autonomously, in order. The only thing you ask the user for is their **graph token** —
never invent, guess, or reuse one. Report the result of each step.

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

Ask the user for their graph token (it comes with the early-access invite). Do not
proceed with a made-up value; a wrong token fails on first contact with the server.

<!-- TODO(owner): confirm the public MCP URL + auth header shape before merging -->

**Claude Code:**

```sh
claude mcp add --transport http nks https://mcp.verstak.ai/mcp \
  --header "Authorization: Bearer $VERSTAK_TOKEN"
```

**Cursor** — merge into `.cursor/mcp.json` (project) or `~/.cursor/mcp.json` (global):

```json
{ "mcpServers": { "nks": {
    "url": "https://mcp.verstak.ai/mcp",
    "headers": { "Authorization": "Bearer ${VERSTAK_TOKEN}" } } } }
```

**Codex** — add to `~/.codex/config.toml`:

```toml
[mcp_servers.nks]
url = "https://mcp.verstak.ai/mcp"
bearer_token_env_var = "VERSTAK_TOKEN"
```

**Any other agent:**

```sh
npx add-mcp https://mcp.verstak.ai/mcp --header "Authorization: Bearer ${VERSTAK_TOKEN}"
```

Store the token where your harness expects env vars; do not hard-code it into files
that get committed.

## 3. Restart

Tell the user installation is done and ask them to restart the session so the new
skills and connection are picked up. This is the end of what you can do here.

## 4. First session: verstakify

In the fresh session, the user says `verstakify` (or `/verstak:verstakify` with the
Claude Code plugin). The agent then verifies the connection (`nks_orient` returns a
realm list), brings the repo to the verstak standard (`AGENTS.md` + session rituals),
and seeds the graph with the structure the codebase already shows.

## Troubleshooting

- **401 / auth error** → the token is wrong or expired. Re-ask the user; do not retry
  with variations.
- **`nks_*` tools not visible** → the MCP config loads on session start: restart the
  session (or reload MCP config) and verify again.
- **Skill name collision on flat installs** → another skill pack already uses a bare
  name like `design`. Rename that directory, or use the Claude Code plugin channel,
  which namespaces everything under `verstak`.
