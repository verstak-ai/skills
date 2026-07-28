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
authenticates two ways. Default is **OAuth** — a browser login you can start yourself, so
you never ask the user for a secret. They still approve it in their browser: that press is
the one part of this file nobody can do for them. When that is unavailable or refuses to
work, there is a **personal access token** the user makes in the web UI; it works
everywhere and is the answer to any authorization you cannot get past. Never invent,
guess, or reuse a token.

## 0. Detect your harness

Identify which agent you are running as — Claude Code in a terminal, Claude Desktop,
Cursor, Codex, or other — and follow that path below. If you cannot tell, ask the user.

Tell Claude Desktop apart from Claude Code before you start: the two install skills
identically but connect the server differently. Claude Code finishes the login on its own,
terminal or desktop-hosted; Claude Desktop and claude.ai need a press inside the app
(step 2).

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

**Claude Code + plugin from step 1: the server arrives configured, but not logged in.**
The plugin bundles it (`.mcp.json` in the plugin root) under the qualified name
**`plugin:verstak:nks`** — that name, not `nks`, is what every `claude mcp` command wants;
`claude mcp list` prints the exact one and the status beside it.

**An interactive terminal.** `/mcp` lists the server and completes the login there. Do not
assume you are here, and do not plan on triggering it with an `nks_*` call: an
unauthorized server publishes no tools, so there is nothing to call.

**Anywhere `/mcp` does not render** — a headless run, a cron job, a piped `-p` invocation,
a subagent, a session hosted inside the desktop app. Nothing opens on its own: the server
sits at `needs authentication` however many times you retry. Start the login yourself:

```sh
claude mcp login plugin:verstak:nks
```

**Give it a terminal or it will not wait.** Without one the command aborts —
`stdin isn't a terminal, so authentication can't be completed here` — even though the part
that matters needs no input at all: the browser redirects to a localhost callback the
command is already listening on, and only the paste-the-URL fallback wants stdin. A
pseudo-terminal is the whole fix, and the login then completes on its own:

```sh
script -q /dev/null claude mcp login plugin:verstak:nks      # macOS / BSD
script -qec "claude mcp login plugin:verstak:nks" /dev/null  # Linux (util-linux)
```

Run it in the background if your harness would otherwise block on it, and read its output:
the command prints the authorization URL before it waits. If no browser opens, hand that
URL to the user — it is single-use and bound to the waiting process, so do not re-run the
login while they still have it open.

This works from a session hosted inside the desktop app exactly as it does from a terminal
— the browser opens on its own, the user approves once, and the credential is readable by
both. Nothing has to be pressed in the app's own UI.

Then verify:

```sh
claude mcp list    # plugin:verstak:nks: <MCP_URL> (HTTP) - ✔ Connected
```

That line proves the login completed, not that the tools reached a session: MCP config is
read at session start, so a server authorized mid-session has none until the session comes
back. Ask for the restart (step 3) — but do not park the answer on it, or you end your turn
never knowing. Spawn one fresh non-interactive session and call there — `nks_me` names you,
`nks_orient` returns a realm list:

```sh
claude -p "Call nks_me and print its result." --allowedTools "mcp__plugin_verstak_nks__nks_me"
```

(The tool name is the server name with each `:` turned into `_`, prefixed `mcp__`.)

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

OAuth login triggers on first use in Cursor. In Claude Code it does not — an unauthorized
server publishes no tools, so there is no first use to trigger it; run
`claude mcp login nks` explicitly, under a pty as above.

**The token path — when OAuth is absent, cannot reach you, or will not go through.**
Two cases lead here. The first is structural: harnesses without MCP-OAuth support (CI,
autonomous VMs, any config with no browser login to run). The second is plain breakage:
the login never opens, never completes, or every `nks_*` call keeps coming back 401. Do
not grind on either and do not retry variations. A personal access token is a header, not
a session, so it authenticates from any process on any host — which makes it the one path
that behaves the same everywhere.

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
  Connectors-tab step above. If it repeats, clear the stored credential instead of logging
  in on top of it — `claude mcp logout plugin:verstak:nks`; if you are reinstalling too, do
  that *before* removing the plugin, or the name stops resolving. If it still fails, stop
  retrying and take the token path in step 2 — a PAT authenticates where OAuth won't, and
  asking the user for one is a shorter road than debugging their browser. If a token is
  already in play and still 401s, it is wrong or expired: ask for a fresh one, do not
  retry variations.
- **`claude mcp login nks` → no such server** → with the plugin the server is
  `plugin:verstak:nks`. Run `claude mcp list` and copy the name from there.
- **`stdin isn't a terminal, so authentication can't be completed here`** → your shell has
  no TTY, not a broken login. Re-run it under `script` as in step 2; the localhost
  callback finishes the flow without any input.
- **`nks_*` tools not visible** → the MCP config loads on session start, so restart the
  session and verify again. Tools stay invisible in the session that authorized the
  server — expected, not a failed login.
- **Skill name collision on flat installs** → another skill pack already uses a bare
  name like `design`. Rename that directory, or use the Claude Code plugin channel,
  which namespaces everything under `verstak`.
