# verstak setup (agent-executable)

You are a coding agent setting up **verstak** for your user. Execute the steps below
autonomously, in order, and report the result of each one.

verstak is two parts:

1. **Skills** — plain-markdown method bundles from this repo (readable before install).
2. **Graph MCP server** — the remote NKS reasoning graph, exposed as `nks_*` tools.

**The server address.** Throughout this file, `<MCP_URL>` means exactly:

```
https://nks.lab.mirari.ru/mcp
```

Substitute that literal string wherever `<MCP_URL>` appears below. The server
authenticates two ways. Default is **OAuth** — a browser login on first contact, so you
ask the user for nothing. When that is unavailable or simply refuses to work, there is a
**personal access token** the user makes in the web UI; it works everywhere and is the
answer to any authorization you cannot get past. Never invent, guess, or reuse a token.

## 0. Detect your harness

Identify which agent you are running as — Claude Code in a terminal, Claude Desktop,
Cursor, Codex, or other — and follow that path below. If you cannot tell, ask the user.

Tell Claude Desktop apart from terminal Claude Code before you start: the two install
skills identically but connect the server differently, and only one of them can finish
the login on its own (step 2).

## 1. Install the skills

**The plugin is the way in.** Use it wherever it exists — Claude Code, Claude Desktop,
claude.ai. It namespaces every skill under `verstak`, so nothing collides, and it
carries the graph server with it. Everything else on this page is for harnesses that
have no plugin channel.

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

**Claude Code (terminal) + plugin from step 1: nothing to configure.** The plugin
bundles the server (`.mcp.json` in the plugin root); the first `nks_*` call — or `/mcp`
— opens the OAuth login. Skip to step 3.

**Claude Desktop and claude.ai: the plugin adds the server, but leaves it unauthorized.**
Installing the plugin is still the right move — it just stops one press short. The
authorize button is not in the app's own Connectors settings, and there is nothing to
paste: it sits on a **Connectors tab inside the verstak plugin's own page**, and it
appears only once the plugin itself is installed. Two presses, in this order:
**Install**, then **Connect**. This is where people get stuck, so walk the user through
it instead of letting them hunt:

> Open **Customize → Plugins** and find the **verstak** plugin. Press **Install** if you
> haven't yet, then open its **Connectors** tab and press the authorize button there —
> **Connect** only shows up after the install.

Two things worth telling them up front: this flow is more reliable on **claude.ai** than
in the desktop app, and a plugin installed on claude.ai is not picked up until the
desktop app is restarted.

Afterwards the `nks_*` tools arrive already authorized, and you continue at step 3.

**Claude Code without the plugin:**

```sh
claude mcp add --transport http nks <MCP_URL>
```

**Cursor** — merge into `.cursor/mcp.json` (project) or `~/.cursor/mcp.json` (global):

```json
{ "mcpServers": { "nks": { "url": "<MCP_URL>" } } }
```

OAuth login triggers on first use in both.

**The token path — when OAuth is absent, or when it will not go through.** Two cases
lead here, and the second matters more than it looks. One is structural: headless agents
and harnesses without MCP-OAuth support (Codex-style configs, CI, autonomous VMs) have
no browser login to run. The other is plain breakage — the login never opens, never
completes, or every `nks_*` call keeps coming back 401. Do not grind on it and do not
retry variations: a personal access token works on every harness, including the ones
where OAuth is broken, so switch and move on.

The user creates the token in the web UI and gives it to you — never invent, guess, or
reuse one. Pass it as a Bearer header:

```sh
npx add-mcp <MCP_URL> --header "Authorization: Bearer ${VERSTAK_TOKEN}"
```

```toml
# Codex ~/.codex/config.toml
[mcp_servers.nks]
url = "<MCP_URL>"
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

- **Claude Desktop / claude.ai: `nks_*` tools visible but unauthorized** → expected; the
  plugin does not authorize its own server. Walk the user through **Customize → Plugins
  → verstak → Connectors** as in step 2 — the button is not in the app's Connectors
  settings, and no URL is pasted anywhere.
- **Plugin installed on claude.ai, invisible in the desktop app** → restart the app.
- **401 / auth error, or an OAuth login that will not complete** → try the login once
  more (`/mcp` → authenticate, or restart the session); on Claude Desktop, the
  Connectors-tab step above. If it still fails, stop retrying and take the token path in
  step 2 — a PAT authenticates where OAuth won't, and asking the user for one is a
  shorter road than debugging their browser. If a token is already in play and still
  401s, it is wrong or expired: ask for a fresh one, do not retry variations.
- **`nks_*` tools not visible** → the MCP config loads on session start: restart the
  session (or reload MCP config) and verify again.
- **Skill name collision on flat installs** → another skill pack already uses a bare
  name like `design`. Rename that directory, or use the Claude Code plugin channel,
  which namespaces everything under `verstak`.
