# verstak setup (agent-executable)

You are a coding agent setting up **verstak** for your user. Execute the steps below
autonomously, in order, and report the result of each one.

Expect approval prompts. Your harness may gate or refuse any command below — that is a
permission decision, not a broken step, and nothing in this file can override it. Asking
and waiting is part of a normal run, not a dead end; see **Troubleshooting**.

verstak is two parts:

1. **The skill** — one plain-markdown skill, `verstak` (a door and the methods it routes
   into), readable before install.
2. **verstak-bridge** — the stdio MCP bridge shipped inside that skill
   (`skills/verstak/scripts/verstak-bridge.mjs`). It is the only path to the graph
   server (`https://mcp.verstak.ai/` by default) and publishes its `verstak_*` tools.

Sign-in is the bridge's own: OAuth through a local link it prints, or a personal token.
No harness login command and no connector button is involved.

Report the literal blocker rather than claiming an install succeeded.

**Reporting to the user:** a progress report is two things — what is done, and the one
action that is theirs (a click on the sign-in link, an approval, a restart). Everything
else on this page is routing knowledge for *you*; bring it up only when the user asks
why something failed.

## 0. Detect your harness

Identify which agent you are running as — Claude Code (terminal or desktop-hosted),
Claude Desktop chat, Codex, OpenCode, pi, Cursor, or other — and follow that branch below.

## 1. Install the skill

Every harness has its own channel; none is the main one.

**Claude Code** — the plugin. It namespaces the skill under `verstak` and brings the
bridge as its MCP server (step 2).

```sh
claude plugin marketplace add verstak-ai/skills
claude plugin install verstak@verstak-ai
```

(Inside an interactive session: `/plugin marketplace add verstak-ai/skills` then
`/plugin install verstak@verstak-ai`.)

**Codex, OpenCode, Cursor, any other agent** (flat install):

```sh
npx skills add verstak-ai/skills --all --global
```

`--all` already means every skill to every harness; `--global` is required — without it
the skill lands in the current repository. The content lands once in `~/.agents/skills/`,
harness directories get symlinks to it.

**pi** — one command installs the skill and the `verstak` extension:

```sh
pi install git:github.com/verstak-ai/skills
```

The extension raises the bridge itself and registers the `verstak_*` tools; step 2 is not
needed for pi. Update: `pi update git:github.com/verstak-ai/skills`.

**Claude Desktop chat** — the user uploads `verstak.skill` (from the root of
`https://github.com/verstak-ai/skills`) in the app's skill settings. The bridge is placed
separately — step 2, "Bring up the bridge by hand".

## 2. Connect the graph server

### Claude Code with the plugin

The plugin carries an MCP entry (`.mcp.json` in the plugin root) named
**`plugin:verstak:verstak`**: not a remote server but **the bridge from the plugin
itself**, a stdio process `node …/skills/verstak/scripts/verstak-bridge.mjs` that Claude
Code raises at session start. Nothing to copy or register; a plugin update brings the new
bridge to the next session.

**Sign-in starts with the first call.** Until there is a grant, every `verstak_*` tool
answers with an error carrying the sign-in address (`http://127.0.0.1:PORT/login…`); the
bridge also prints it on stderr and tries to open a browser. The user opens it and signs
in; the next call goes through. The grant lands in `~/.verstak-bridge/` and the bridge
refreshes it, idle too.

Verify:

```sh
claude mcp list    # plugin:verstak:verstak: node …/verstak-bridge.mjs (stdio) - ✔ Connected
claude -p "Call verstak_me and print its result." --allowedTools "mcp__plugin_verstak_verstak__verstak_me"
```

(The tool name is the server name with each `:` turned into `_`, prefixed `mcp__`.) What
is installed and whether it works: the bridge's `doctor` subcommand, on the path
`claude mcp list` prints.

**A harness without stdio MCP servers** (the claude.ai web app and the like) cannot raise
the bridge, and there is no other path to the graph. Tell the user plainly: the graph
needs a harness that runs local stdio MCP servers — Claude Code, Claude Desktop, Codex,
OpenCode, pi, Cursor.

### Codex

After the flat install, register the bridge (copy it first — "Bring up the bridge by
hand" below):

```sh
codex mcp add verstak -- node "$HOME/.verstak-bridge/verstak-bridge.mjs"
```

`codex mcp list` then shows `verstak`, `command node`, `Auth: Unsupported` — normal: the
bridge holds its own grant; skip `codex mcp login`. The first `verstak_*` call without a
grant answers with the sign-in address.

**Non-interactive runs.** `codex exec` refuses approvals by default and MCP calls need
them: they fail with `MCP tool call requires approval, but approval policy is never` — the
tools are visible and not callable. Approve them through the harness's approval setting;
the flag that also removes the sandbox is for externally isolated environments only.

**Codex hears the channel through the app-server door.** A seat's frame enters a running
thread only if the thread lives under a local app-server daemon. The daemon starts from a
managed Codex install (`$CODEX_HOME/packages/standalone/current/codex`). Keep `CODEX_HOME`
short — a unix socket path is limited; a home inside `~/Library/Application Support/…` is
too long, so make a short home pointing at the real one — and start the daemon:

```sh
H="$HOME/.codex"                     # the real home
mkdir -p /tmp/cxh && ln -sfn "$H/packages" /tmp/cxh/packages && ln -sfn "$H/auth.json" /tmp/cxh/auth.json
cp "$H/config.toml" /tmp/cxh/config.toml
CODEX_HOME=/tmp/cxh codex app-server daemon start
```

Codex sessions started with the same `CODEX_HOME` attach to the daemon; one started with
another home has no door, and the agent cannot fix that from inside — this is the user's
move before the session starts. `node ~/.verstak-bridge/verstak-bridge.mjs doctor` under the
same `CODEX_HOME` says whether the door is open.

**The thread's sandbox is the user's move too.** `watchdog-codex`, run from the agent's
shell, connects to the bridge's local socket under `~/.verstak-bridge/standings/`; Codex's
default sandbox does not let it through. Start the thread with full access, or with a
sandbox that admits `~/.verstak-bridge`. Then the watchdog lives inside one command
(`node "BRIDGE" watchdog-codex KEY & sleep 90; kill %1`) — a separate `nohup … &` is killed
with its command. Holding the seat: the `verstak` skill, its `collaborate` method. Without
the daemon, `watchdog-exit` remains.

### OpenCode

Not an `mcp` entry in the config, but **the delivery's plugin**: an `mcp` entry would
rename every tool to `ENTRY.TOOL`, and its bridge is shared across sessions, so one
session's write could leave under another's seat. `node ~/.verstak-bridge/verstak-bridge.mjs
doctor`, run from the project directory, names a stray entry; the user removes it from the
file doctor names. Two files, both from the installed `verstak` skill:

```sh
mkdir -p ~/.verstak-bridge ~/.config/opencode/plugins
src=$(dirname "$(find -L ~/.agents/skills ~/.claude -path '*verstak/scripts/opencode-plugin.js' 2>/dev/null | head -1)")
[ -n "$src" ] && [ -f "$src/verstak-bridge.mjs" ] || { echo "no OpenCode plugin in the installed skill — update it (npx skills add verstak-ai/skills --all --global) and repeat"; false; }
cp "$src/verstak-bridge.mjs" ~/.verstak-bridge/verstak-bridge.mjs
cp "$src/opencode-plugin.js" ~/.config/opencode/plugins/verstak.js
```

OpenCode 2 loads file plugins from `~/.config/opencode/plugins/`. The plugin has no
imports, takes the bridge from `~/.verstak-bridge/verstak-bridge.mjs` (or
`VERSTAK_BRIDGE_PATH`) and runs it on OpenCode's own Bun — no Node needed. After a
delivery update repeat both copies; `node "$src/verstak-bridge.mjs" doctor` says whether a
copy lags.

**Sign-in.** Until there is a grant, the session has the `verstak_bridge` tool, which names
the sign-in address, and every `verstak_*` tool refuses with the same address. The address
is local to the OpenCode machine; from another machine use the sign-in-by-code page if the
error offers one, or `ssh -L PORT:127.0.0.1:PORT HOST`. After sign-in the tools come up by
themselves. Every installed skill becomes a `/` palette command. The plugin keeps a
directory with a held seat loaded; turn that off with `VERSTAK_KEEPALIVE_MS=0` in the
OpenCode service's environment. Verify:

```sh
opencode run --format json "Call the verstak_me tool and print the person's name"
```

### Bring up the bridge by hand

For Claude Code without the plugin, Codex, Claude Desktop, Cursor and any other harness
with stdio MCP servers. Do not reach for `mcp-remote`: copy the bundled bridge out of the
versioned install path into the stable home:

```sh
mkdir -p ~/.verstak-bridge
src=$(find -L ~/.agents/skills ~/.claude -path '*verstak/scripts/verstak-bridge.mjs' 2>/dev/null | head -1)
cp "$src" ~/.verstak-bridge/verstak-bridge.mjs && echo "copied from $src"
```

`-L` carries weight: a global `npx skills` install keeps the content in `~/.agents/skills/`
behind symlinks, and `find` without `-L` does not enter them.

**Claude Desktop** puts no skill on disk, so take the bridge from the delivery — `main`
carries the last release's build, and the bridge updates itself afterwards (section 3):

```sh
mkdir -p ~/.verstak-bridge
curl -fsSL https://raw.githubusercontent.com/verstak-ai/skills/main/skills/verstak/scripts/verstak-bridge.mjs -o ~/.verstak-bridge/verstak-bridge.mjs
```

On Windows, PowerShell (`curl.exe`, not the `Invoke-WebRequest` alias):

```powershell
New-Item -ItemType Directory -Force "$HOME\.verstak-bridge" | Out-Null
curl.exe -fsSL https://raw.githubusercontent.com/verstak-ai/skills/main/skills/verstak/scripts/verstak-bridge.mjs -o "$HOME\.verstak-bridge\verstak-bridge.mjs"
(Get-Command node).Source    # the absolute node path, for the entry's command
```

**Claude Code without the plugin** (`--scope user`: the graph follows the user, not one
project):

```sh
claude mcp add --scope user verstak -- node "$HOME/.verstak-bridge/verstak-bridge.mjs"
```

**Codex** — the command in its branch above. **Cursor** — merge into `~/.cursor/mcp.json`;
**Claude Desktop** — into `claude_desktop_config.json` (`~/Library/Application
Support/Claude/` on macOS, `%APPDATA%\Claude\` on Windows; restart the app); other
harnesses — their stdio server config:

```json
{ "mcpServers": { "verstak": { "command": "node", "args": ["/absolute/path/to/.verstak-bridge/verstak-bridge.mjs"] } } }
```

The path is absolute: `~` is not expanded there. On Windows write `C:\\Users\\NAME\\…` or
`C:/Users/NAME/…`. A windowed app does not see the shell's `PATH`: with Node under nvm and
the like, put the absolute node path in `command`. Put the entry in the harness's
**user-level** config, not the project one — the graph follows the user.

With no URL argument the bridge points at `https://mcp.verstak.ai/`, or at the address in
`~/.verstak-bridge/server` (`node ~/.verstak-bridge/verstak-bridge.mjs use URL`);
`VERSTAK_BRIDGE_URL` or a URL argument beats both. On the first call it runs the OAuth
flow, keeps the grant fresh in `~/.verstak-bridge/` (idle too), and turns any upstream
failure into a visible error instead of a hang. Many agents on one machine share one grant:
one click signs in the whole machine. Needs Node 22+. Diagnosis and the decision ladder:
the `verstak` skill, its `establish-mcp` method.

### A personal token

When there is no browser (CI, headless VMs), or sign-in does not open, does not finish,
or every call keeps returning 401. The user issues the token in the graph's web interface
and hands it to you — never invent, guess or reuse one. Give it to the bridge; everything
else stays as it was:

```sh
mkdir -p ~/.verstak-bridge && (umask 077; printf '%s\n' "$VERSTAK_TOKEN" > ~/.verstak-bridge/token)
node ~/.verstak-bridge/verstak-bridge.mjs doctor    # reports whether the server accepts the token
```

`VERSTAK_BRIDGE_TOKEN` in the bridge's environment beats the file. With a token the bridge
does no discovery, no browser and no update check, and reads a 401 as "token rejected".
Remove the token and the bridge returns to OAuth. Never put it in a committed file or a URL.

## 3. Update

The bridge updates itself: at each start it compares its version with the home copy
`~/.verstak-bridge/verstak-bridge.mjs` — a newer self goes into the home, a newer home runs
instead; periodically it asks this repository's releases and, if there is a newer one,
downloads the bridge, the OpenCode plugin (if installed) and this file into the home, and
tells the agent with a `DELIVERY BEHIND` line in a tool response. On demand:

```sh
node ~/.verstak-bridge/verstak-bridge.mjs update
```

Where a plugin brings the bridge (Claude Code, pi), there may be no home copy: the path of
the running bridge is printed in the `[verstak-bridge]` block of a `verstak_stand`
response; call `update` and `doctor` by it.

The bridge does not update the skill — the harness channel does. After `update` repeat
step 1 of your branch (`/plugin marketplace update verstak-ai` and `/reload-plugins` in
Claude Code; `npx skills add verstak-ai/skills --all --global` again;
`pi update git:github.com/verstak-ai/skills`), then restart the session: a bridge of the
previous build lives until its session ends.

## 4. Restart

Tell the user installation is done and ask them to restart the session so the skill and
the connection are picked up, then to start the new session with the `verstak` door
(`/verstak:verstak` with the Claude Code plugin). This is the end of what you can do here.

## 5. First session

In the fresh session the user calls the `verstak` door and says what they want in their
own words. The agent checks the connection — `verstak_realm(action="list")` answers with
the graphs — and the door leads from there: a repository without `AGENTS.md` gets the
`align` method, which brings it to the verstak standard (`AGENTS.md` + session rituals) and
seeds the graph with the structure the codebase already shows.

## Troubleshooting

- **A command was refused, or is waiting on approval** → a permission decision, not an
  installation failure. Do not rephrase the command and do not switch install paths. Say
  which step you are on, the exact command, and what approving it does; then wait. On
  approval re-run it and continue.
- **No `verstak_*` tools in the session** → MCP config loads at session start: restart the
  session and check again. Then `node BRIDGE doctor` from the project directory — it names
  every mismatch with its fix.
- **Every call answers with a sign-in link** → no grant yet: give the link to the user,
  repeat the call after they sign in. One link per machine, valid while any bridge listens.
- **Sign-in keeps failing** → a personal token (section 2).
- **An error names `verstak-bridge` and a verdict** → do what it says; quote the build from
  `node BRIDGE --version` when reporting a breakage.
- **Skill name collision on flat installs** → another pack ships a skill named `verstak`.
  Rename that directory, or use the Claude Code plugin channel, which namespaces it.
