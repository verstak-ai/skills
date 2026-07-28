# verstak setup (agent-executable)

You are a coding agent setting up **verstak** for your user. Execute the steps below
autonomously, in order, and report the result of each one.

Expect approval prompts. Your harness may gate or refuse any command below — that is a
permission decision, not a broken step, and nothing in this file can override it. Asking
and waiting is part of a normal run, not a dead end; see **Troubleshooting**.

verstak is two parts:

1. **Skills** — plain-markdown method bundles from this repo (readable before install).
2. **Graph MCP server** — the remote NKS reasoning graph at
   `https://nks.lab.mirari.ru/mcp`, exposed as `nks_*` tools.

## 0. Detect your harness

Identify which agent you are running as — Claude Code in a terminal, Claude Desktop,
Cursor, Codex, or other — and follow that path below. If you cannot tell, ask the user.

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
The plugin bundles it (`.mcp.json` in the plugin root) as **`plugin:verstak:nks`** — use
that name in every `claude mcp` command; `claude mcp list` prints it with its status.

**The login is yours to start.** Nothing triggers it on its own — the server sits at
`needs authentication` until you run:

```sh
claude mcp login plugin:verstak:nks
```

The command needs a TTY to wait for the browser; in a shell without one, wrap it:

```sh
script -q /dev/null claude mcp login plugin:verstak:nks      # macOS / BSD
script -qec "claude mcp login plugin:verstak:nks" /dev/null  # Linux (util-linux)
```

Run it in the background if your harness would otherwise block on it, and read its output:
the command prints the authorization URL before it waits. If no browser opens, hand that
URL to the user — it is single-use and bound to the waiting process, so do not re-run the
login while they still have it open. A session hosted inside the desktop app behaves the
same as a terminal here; nothing is pressed in the app's own UI.

Then verify:

```sh
claude mcp list    # plugin:verstak:nks: https://nks.lab.mirari.ru/mcp (HTTP) - ✔ Connected
```

That line proves the login completed, not that the tools reached a session — MCP config
is read at session start. Ask for the restart (step 3), and confirm now from one fresh
non-interactive session — `nks_me` names you, `nks_orient` returns a realm list:

```sh
claude -p "Call nks_me and print its result." --allowedTools "mcp__plugin_verstak_nks__nks_me"
```

(The tool name is the server name with each `:` turned into `_`, prefixed `mcp__`.)

**Claude Desktop and claude.ai: the plugin adds the server, but leaves it unauthorized.**
The authorize button is not in the app's own Connectors settings, and there is nothing to
paste: it sits on a **Connectors tab inside the verstak plugin's own page**, and appears
only once the plugin is installed. Walk the user through it:

> Open **Customize → Plugins** and find the **verstak** plugin. Press **Install** if you
> haven't yet, then open its **Connectors** tab and press the authorize button there —
> **Connect** only shows up after the install.

This flow is more reliable on **claude.ai** than in the desktop app, and a plugin
installed on claude.ai is not picked up until the desktop app is restarted.

Afterwards the `nks_*` tools arrive already authorized, and you continue at step 3.

**Claude Code without the plugin:**

```sh
claude mcp add --transport http nks https://nks.lab.mirari.ru/mcp
```

**Cursor** — merge into `.cursor/mcp.json` (project) or `~/.cursor/mcp.json` (global):

```json
{ "mcpServers": { "nks": { "url": "https://nks.lab.mirari.ru/mcp" } } }
```

OAuth login triggers on first use in Cursor. In Claude Code it does not — an unauthorized
server publishes no tools, so there is no first use to trigger it; run the login
explicitly, under a pty as above.

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

- **A command was refused, or is waiting on approval** → a permission decision, not an
  installation failure. Do not rephrase the command and do not switch to a different
  install path — a flat install is another product, not a workaround. Say which step you
  are on, the exact command, and what approving it does; then stop and wait. On approval,
  re-run that command and continue — steps that already succeeded are not repeated.
- **Claude Desktop / claude.ai: `nks_*` tools visible but unauthorized** → expected; the
  plugin does not authorize its own server. Authorize on the plugin's own **Connectors**
  tab as in step 2 — not in the app's Connectors settings, and no URL is pasted anywhere.
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
