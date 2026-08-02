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

Authentication uses **OAuth exclusively**. Start the browser flow yourself, wait for its
callback, and finish setup in the same run. Do not substitute a different authentication
scheme. If the harness cannot complete MCP OAuth, report that literal blocker instead of
claiming the installation succeeded.

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

**Codex** (global install, all skills, Codex only):

```sh
npx --yes skills add verstak-ai/skills --global --agent codex --skill '*' --yes
```

**Cursor** uses the same flat installer with its own harness target:

```sh
npx --yes skills add verstak-ai/skills --global --agent cursor --skill '*' --yes
```

For another supported agent, replace `cursor` with that installer's agent id. Do not
combine `--all` with `--agent`: `--all` also selects every supported agent. Do not omit
`--global`, or the skills may land only in the current project.

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
non-interactive session using the current read-only identity call:

```sh
claude -p 'Call nks_me(action="whoami") and print its result.' \
  --allowedTools "mcp__plugin_verstak_nks__nks_me"
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

**Codex:** inspect the existing entry before changing it:

```sh
codex mcp get nks
```

If it is absent, add it:

```sh
codex mcp add nks --url https://nks.lab.mirari.ru/mcp
```

If it already has that URL, keep it. If the name exists with another URL, stop and
report the conflict instead of overwriting the user's server. `Auth: OAuth` in
`codex mcp list` describes server capability; it does not prove that a credential is
present. Start OAuth explicitly and wait for the command to exit:

```sh
codex mcp login nks
```

The command prints a single-use browser URL and listens on its localhost callback. Let
the browser flow finish; do not re-run login while that URL is open. Success is exit code
0 with `Successfully logged in to MCP server 'nks'.`

The current session will not gain tools loaded after it started, so verify through one
fresh, ephemeral, read-only Codex session. The allowlist and approval override apply only
to the two read-only NKS tools used by this command:

```sh
codex exec --ephemeral --skip-git-repo-check --sandbox read-only \
  -c 'approval_policy="never"' \
  -c 'mcp_servers.nks.enabled_tools=["nks_me","nks_realm"]' \
  -c 'mcp_servers.nks.default_tools_approval_mode="approve"' \
  'Verification only. Call nks_me(action="whoami") and nks_realm(action="list"). Do not call shell or any other tools. Report the authenticated identity and the number of realms.'
```

Setup is verified only when that command exits 0, prints the authenticated identity, and
returns a realm count. Then continue to step 3.

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

## 3. Restart

Tell the user installation is done and ask them to restart the session so the new
skills and connection are picked up. This is the end of what you can do here.

## 4. First session: verstakify

In the fresh session, the user says `verstakify` (or `/verstak:verstakify` with the
Claude Code plugin). The agent then verifies identity with
`nks_me(action="whoami")`, discovers realms with `nks_realm(action="list")`, orients into
the selected realm, brings the repo to the verstak standard (`AGENTS.md` + session
rituals), and seeds the graph with the structure the codebase already shows.

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
  in on top of it — `claude mcp logout plugin:verstak:nks` for the plugin, or
  `codex mcp logout nks` for Codex — then run the matching OAuth login once. If it still
  fails, report the exact OAuth error and stop. If you are reinstalling the Claude plugin
  too, log out *before* removing it, or the qualified server name stops resolving.
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
