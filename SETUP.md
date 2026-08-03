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

Authentication uses **OAuth exclusively** — never substitute another scheme. *Who*
performs it depends on the surface, and getting that wrong is the most common way a run
fails:

- **Terminal Claude Code, Codex, Cursor** — the login is yours. Start the browser flow,
  wait for the callback, finish in the same run. A "this session is non-interactive"
  notice is about a missing TTY only; the `script` wrapper in step 2 supplies one, so run
  it rather than handing the login back.
- **Claude Desktop, claude.ai** — the authorization is a click in the app's own UI, and it
  is the user's to make. No CLI command, deep link, or SDK call presses it. Do **not** run
  `claude mcp login` here: it authorizes the terminal binary's credential store, which the
  app never reads, so you would report success over a connector that is still dark.

Report the literal blocker rather than claiming an install succeeded.

## 0. Detect your harness

Identify which agent you are running as — Claude Code in a terminal, a session hosted
inside the Claude Desktop app, Cursor, Codex, or other — and follow that path below.

For Claude Code the split that matters is terminal vs. desktop-hosted, and it is one
check: `echo "$CLAUDE_CODE_ENTRYPOINT"`. The value `claude-desktop` means your session
is hosted by the Claude Desktop app — take the **Claude Desktop** path in step 2;
anything else (e.g. `cli`) is a plain terminal session. macOS backup signal:
`__CFBundleIdentifier` = `com.anthropic.claudefordesktop`. If you cannot tell, ask
the user.

## 1. Install the skills

**The plugin is the way in, and this one CLI install serves every Claude Code surface** —
terminal and desktop-hosted alike. Run it whatever step 0 detected; the surfaces diverge
only at step 2, over who authorizes the connector. It namespaces every skill under
`verstak`, so nothing collides, and it carries the graph server with it. Everything else
on this page is for harnesses that have no plugin channel.

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

**Cursor / any other supported agent** (original flat install):

```sh
npx skills add verstak-ai/skills --all
```

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

If something tells you this session is non-interactive: that is about a missing TTY only.
Wrap the login in `script`, as above, and run it. Do not hand the login back to the user.

Run it in the background if your harness would otherwise block on it, and read its output:
the command prints the authorization URL before it waits. If no browser opens, hand that
URL to the user — it is single-use and bound to the waiting process, so do not re-run the
login while they still have it open.

This path authorizes the **terminal CLI only**. MCP credentials are scoped per surface:
a token minted by `claude mcp login` lands in the terminal binary's store, and the
desktop app never reads it. If step 0 detected a desktop-hosted session, do not take
this path for your own surface — the login would succeed, `claude mcp list` would say
`Connected`, and your host app would still show the server unauthorized. Use the
**Claude Desktop** flow below instead.

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

**Claude Desktop: step 1 already installed the plugin. Only the connector's
authorization is left, and it is the user's click — walk them through it, do not script
around it.** The Customize/connector surface syncs through the claude.ai account, not
from the CLI's `~/.claude`, and nothing in a shell reaches it. Your whole job here is
detection (step 0), the walkthrough, and verification after the restart:

> Open **Customize**, find the **nks** connector, and press **Connect**. The OAuth
> consent opens in the browser and returns you to the app.

Then ask for the restart (step 3).

Afterwards `claude mcp list` shows **two** entries for the same URL. That is the correct
end state, not a half-finished install:

```text
claude.ai nks:      https://nks.lab.mirari.ru/mcp - ✔ Connected
plugin:verstak:nks: https://nks.lab.mirari.ru/mcp (HTTP) - ! Needs authentication
```

The claude.ai-account connector is the live one, and it is what publishes the `nks_*`
tools. The plugin-bundled `plugin:verstak:nks` stays unauthenticated on this surface
permanently — leave it alone. Its tools are namespaced by the connector's own id, not by
the plugin name, so do not look for `mcp__plugin_verstak_nks__*` and do not conclude from
its status line that the setup failed. **Verify by calling `nks_me(action="whoami")` from
a fresh session** — check for working tools, never for a status line.

**claude.ai (web): the same UI route**, on the same plugin page. A plugin installed on
claude.ai is not picked up by the desktop app until that app restarts — which also
makes claude.ai the fallback when the desktop's Connect button misbehaves (see
Troubleshooting).

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
  Seen in the wild: `claude plugin install` blocked by an auto-mode permission
  classifier on the first attempt — same handling, approve and re-run.
- **Desktop: `plugin:verstak:nks` still says `Needs authentication` after a successful
  setup** → expected, and permanent. The plugin does not authorize its own bundled
  server; the connector that works is the separate `claude.ai nks` entry. Two entries
  against the same URL is the normal end state (step 2). Judge the install by whether
  `nks_me(action="whoami")` answers, not by that line.
- **Desktop: Connect button greyed out or missing** → known upstream behavior for
  plugin-bundled OAuth servers. Do the Connect on **claude.ai** instead, then restart the
  desktop app to pick it up.
- **Terminal says `Connected`, desktop shows unauthorized** → not a broken install. MCP
  credentials are per surface: the terminal login authorized the terminal binary's store,
  which the desktop app never reads. Authorize the desktop through its own path (step 2,
  Claude Desktop).
- **`Couldn't register with nks's sign-in service` (may cite an `ofid_…` reference)** →
  a rate limit on the sign-in service, most often tripped by disconnecting and
  reconnecting straight away. **Wait a minute, press Connect again.** Nothing is broken
  and nothing needs reinstalling.
- **`Couldn't connect` immediately, without ever showing a login page** → the sign-in
  service was never reached, so this is not something the install can fix. Retry once; if
  it repeats, report it with the exact message — it is a server-side problem. (A login
  page that appears and *then* fails is a different fault; say which one you saw.)
- **Credential suddenly wiped (401s, empty token, no refresh token in the store)** →
  refresh-rotation race: several Claude binaries (terminal CLI, desktop-bundled engine,
  parallel sessions) share one credential entry, and whichever refreshes second presents
  an already-rotated refresh token, killing the token family. Do not probe the same
  server from several binaries around token expiry. Recover with
  `claude mcp logout plugin:verstak:nks`, then one login from the surface you actually
  use.
- **Plugin installed on claude.ai, invisible in the desktop app** → restart the app.
- **401 / auth error, or an OAuth login that will not complete** → try the login once
  more (`/mcp` → authenticate, or restart the session); on Claude Desktop, the Customize
  step in step 2. If it repeats, clear the stored credential instead of logging
  in on top of it — `claude mcp logout plugin:verstak:nks` for the plugin, or
  `codex mcp logout nks` for Codex — then run the matching OAuth login once. If it still
  fails, report the exact OAuth error and stop. If you are reinstalling the Claude plugin
  too, log out *before* removing it, or the qualified server name stops resolving.
- **`claude mcp login nks` → no such server** → with the plugin the server is
  `plugin:verstak:nks`. Run `claude mcp list` and copy the name from there.
- **`stdin isn't a terminal, so authentication can't be completed here`** → your shell has
  no TTY, not a broken login. Re-run it under `script` as in step 2; the localhost
  callback finishes the flow without any input. **Terminal path only** — on a
  desktop-hosted session there is no login for you to run in the first place.
- **`nks_*` tools not visible** → the MCP config loads on session start, so restart the
  session and verify again. Tools stay invisible in the session that authorized the
  server — expected, not a failed login.
- **Skill name collision on flat installs** → another skill pack already uses a bare
  name like `design`. Rename that directory, or use the Claude Code plugin channel,
  which namespaces everything under `verstak`.
