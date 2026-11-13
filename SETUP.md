# verstak setup — reference

A reference for installing **verstak**, for an agent and a person alike. The skill is
installed through the harness's own channel (step 1); the graph is connected by the
installed skill's `establish-mcp` method, led by the word "/verstak connect the graph".
Here are the per-harness branches and troubleshooting; when you walk them, go in order and
report the result of each step.

Expect approval prompts. Your harness may gate or refuse any command below — that is a
permission decision, not a broken step, and nothing in this file can override it. Asking
and waiting is part of a normal run, not a dead end; see **Troubleshooting**.

verstak is two parts:

1. **The skill** — one plain-markdown skill, `verstak` (a door and the methods it routes
   into), readable before install.
2. **verstak-bridge** — the stdio MCP bridge shipped inside that skill
   (`skills/verstak/scripts/verstak-bridge.mjs`). It is the only path to the graph
   server and publishes its `verstak_*` tools.

Sign-in is the bridge's own: OAuth through a local link it prints, or a personal token.
No harness login command and no connector button is involved.

## Quiet outside the repositories you choose

From release 3.37.0, installing verstak changes nothing in a repository you haven't chosen for it: no
invitation, the skill isn't loaded, no file is written, and nothing of that repository goes
into your personal memory. A repository is chosen by its `AGENTS.md` cover (the `align`
method writes it), or by asking for verstak in it. So some repositories can run on
verstak, some on another delivery, some on your own setup — verstak for your own projects,
say, while your employer's repositories stay untouched. One limit of this release: until
the shared bridge core's per-session opt-in ships, the harness still starts the bridge
process in every session — it lists its tools and may connect to the graph.

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

**Codex** — the plugin. It namespaces the skill under `verstak` and brings the bridge as
its MCP server (step 2):

```sh
codex plugin marketplace add https://github.com/verstak-ai/skills
codex plugin add verstak@verstak-ai
```

**Cursor, any other agent** (flat install; Codex without the plugin too):

```sh
npx skills add verstak-ai/skills --all --global
```

`--all` already means every skill to every harness (`--skill '*' --agent '*' -y`), so an
`--agent` appended to it only narrows it; `--global` is required — without it the skill
lands in the current repository. The content lands once in `~/.agents/skills/`, harness
directories get symlinks to it. With the Claude Code or Codex plugin on the same machine,
`--all` also puts a flat `verstak` beside the plugin's `verstak:verstak` (in
`~/.claude/skills/`, and in `~/.agents/skills/`, which Codex reads): name only your harness
instead — `--skill verstak --agent NAME --global -y`, as OpenCode below.

**OpenCode** — the skill flat, for OpenCode alone; the tools and the channel come with the
delivery's plugin (step 2, OpenCode):

```sh
npx skills add verstak-ai/skills --skill verstak --agent opencode --global -y
```

The skill lands in `~/.agents/skills/verstak/`, which OpenCode reads, and nothing is linked
into `~/.claude/skills/`, so a Claude Code plugin on the machine sees no second `verstak`.
Codex reads `~/.agents/skills/` too: beside the Codex plugin this copy still shows, and no
flat install avoids that.

**pi** — one command installs the skill and the `verstak` extension:

```sh
pi install git:github.com/verstak-ai/skills
```

The extension raises the bridge itself and registers the `verstak_*` tools; step 2 is not
needed for pi. Update: `pi update git:github.com/verstak-ai/skills`.

**Claude Desktop chat** — the user uploads `verstak.skill` from the root of the latest
release (`https://github.com/verstak-ai/skills/releases/latest` names the tag, the file is
`https://raw.githubusercontent.com/verstak-ai/skills/TAG/verstak.skill`; by hand: open the
latest release, its tag, `verstak.skill`, "Download raw file"; the tag commands are in step 2,
the Claude Desktop branch) in the app's skill settings. The bridge is placed
separately — step 2, "Bring up the bridge by hand".

## 2. Connect the graph server

### Claude Code with the plugin

The plugin carries an MCP entry (`.mcp.json` in the plugin root) named
**`plugin:verstak:verstak`**: not a remote server but **the bridge from the plugin
itself**, a stdio process `node …/skills/verstak/scripts/verstak-bridge.mjs` that Claude
Code raises at session start. Nothing to copy or register; a plugin update brings the new
bridge to the next session.

**Sign-in.** Until there is a grant, every `verstak_*` tool answers with an error carrying
the sign-in address (`http://127.0.0.1:PORT/login…`); the bridge also prints it on stderr
and tries to open a browser. The user opens it and signs in; the next call goes through.
The grant lands in `~/.verstak-bridge/` and the bridge refreshes it, idle too.

**First install, no grant on the machine:** the bridge may refuse the harness's connection
itself, so the session has no `verstak_*` tools to call. The same error, link included,
comes in the harness's notice that the server failed, and from a shell in
`claude mcp list`. Hand that link to the user. After they sign in, the session still holds
the failed connection: ask them to reconnect the server `plugin:verstak:verstak` in `/mcp`
(their move; `/reload-plugins` doesn't do it, a restart isn't needed). The sign: `verstak_*`
tools appear in this session.

Verify:

```sh
claude mcp list    # plugin:verstak:verstak: node …/verstak-bridge.mjs (stdio) - ✔ Connected
                   # (starts its own bridge: says the install works, not that this session has tools)
claude -p "Call verstak_me and print its result." --allowedTools "mcp__plugin_verstak_verstak__verstak_me"
```

(The tool name is the server name with each `:` turned into `_`, prefixed `mcp__`.) What
is installed and whether it works: the bridge's `doctor` subcommand, on the path
`claude mcp list` prints.

**A harness without stdio MCP servers** (the claude.ai web app and the like) cannot raise
the bridge. The fallback, for that case only, is the client's own MCP connector straight to
the server: the root `https://mcp.verstak.ai/`, OAuth fields left empty (the client finds
the authorization server itself); in claude.ai and Claude Desktop press Connect on the
Connectors tab after Install. It is a fallback because the bridge is what carries the
work: without it there is no seat and no authorship by seat, no channel or watchdog, no
self-update and no personal slice at the start. For work, use a harness that runs local
stdio MCP servers — Claude Code, Claude Desktop, Codex, OpenCode, pi, Cursor.

### Codex

The plugin (step 1) carries an MCP entry in its manifest: **the bridge from the delivery
itself**, a stdio process `node …/skills/verstak/scripts/verstak-bridge.mjs`. `codex mcp
list` shows `verstak`, `command node`, `Auth: Unsupported` — normal: the bridge holds its
own grant in `~/.verstak-bridge/`; skip `codex mcp login`. The first `verstak_*` call
without a grant answers with the sign-in address (the bridge also prints it and tries to
open a browser); after sign-in the next call goes through. Nothing to copy or register; a
plugin update brings the new bridge.

**Switching from the manual path:** remove the old entry and the flat skill —
`codex mcp remove verstak` and `npx skills remove verstak --global`. A `[mcp_servers.verstak]`
entry left in `config.toml` silently overrides the plugin's server (`codex mcp list` shows
only the manual one), so plugin updates bring no new bridge; a flat `verstak` skill sits
beside the plugin's `verstak:verstak`.

**Without the plugin**, after the flat install, register the bridge (copy it first —
"Bring up the bridge by hand" below); `codex mcp list` and sign-in behave the same:

```sh
codex mcp add verstak -- node "$HOME/.verstak-bridge/verstak-bridge.mjs"
```

**Non-interactive runs.** `codex exec` refuses approvals by default and MCP calls need
them: they fail with `MCP tool call requires approval, but approval policy is never` — the
tools are visible and not callable. Add `--approve-for-me`: approvals go through automatic
review in the workspace-write sandbox. The flag that also removes the sandbox is for
externally isolated environments only.

**Codex hears the channel through the app-server door.** A seat's frame enters a running
thread only if the thread lives under a local app-server daemon. The daemon starts from a
managed Codex install (`$CODEX_HOME/packages/standalone/current/codex`). Keep `CODEX_HOME`
short — a unix socket path is limited; a home inside `~/Library/Application Support/…` is
too long, so make a short home pointing at the real one — and start the daemon:

```sh
H="$HOME/.codex"                     # the real home
mkdir -p /tmp/cxh && ln -sfn "$H/packages" /tmp/cxh/packages && ln -sfn "$H/auth.json" /tmp/cxh/auth.json
cp "$H/config.toml" /tmp/cxh/config.toml
CODEX_HOME=/tmp/cxh codex plugin marketplace add https://github.com/verstak-ai/skills
CODEX_HOME=/tmp/cxh codex plugin add verstak@verstak-ai
CODEX_HOME=/tmp/cxh codex app-server daemon start
```

The plugin goes into the short home on its own: the real home's `plugins` directory is not
linked, and with the plugin `config.toml` carries no bridge entry — skip that step and
sessions under the daemon come up without `verstak_*` tools. (Without the plugin, the
`codex mcp add` entry rides in the copied `config.toml`; the two plugin lines are not
needed.) Codex sessions started with the same `CODEX_HOME` attach to the daemon; one
started with another home has no door, and the agent cannot fix that from inside — this
is the user's move before the session starts. `node "BRIDGE" doctor` under the same
`CODEX_HOME` says whether the door is open (`codex mcp get verstak` prints the bridge's
`cwd` and `args` — with the plugin the path is relative to that `cwd`; the home copy is
`~/.verstak-bridge/verstak-bridge.mjs`).

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
[ -n "$src" ] && [ -f "$src/verstak-bridge.mjs" ] || { echo "no OpenCode plugin in the installed skill — update it (step 1, OpenCode) and repeat"; false; }
cp "$src/verstak-bridge.mjs" ~/.verstak-bridge/verstak-bridge.mjs
cp "$src/opencode-plugin.js" ~/.config/opencode/plugins/verstak.js
```

OpenCode 2 loads file plugins from `~/.config/opencode/plugins/`. The plugin has no
imports, takes the bridge from `~/.verstak-bridge/verstak-bridge.mjs` (or
`VERSTAK_BRIDGE_PATH`) and runs it on OpenCode's own Bun — no Node needed. The two copies
are placed by hand once: the bridge's update (section 3) refreshes both files, but the
plugin only where it already lies. Whether a copy lags, `node "$src/verstak-bridge.mjs"
doctor` says (from the installed skill: only the file beside the reference can compare);
then repeat both copies.

**Sign-in.** Until there is a grant, the session has the `verstak_bridge` tool, which names
the sign-in address, and every `verstak_*` tool refuses with the same address. The address
is local to the OpenCode machine; from another machine use the sign-in-by-code page if the
error offers one, or `ssh -L PORT:127.0.0.1:PORT HOST`. After sign-in the tools come up by
themselves. Every installed skill becomes a `/` palette command. The plugin keeps a
directory with a held seat loaded; turn that off with `VERSTAK_KEEPALIVE_MS=0` in the
OpenCode service's environment. Verify, after restarting the OpenCode service so it loads
the plugin:

```sh
opencode run --format json "Call the verstak_me tool and print the person's name"
```

This is a model's turn: without a configured model it answers with a provider error, not
the graph. Then check by `node "$src/verstak-bridge.mjs" doctor` — the plugin and the bridge
of one build with the installed skill.

### Bring up the bridge by hand

For Claude Code or Codex without the plugin, Claude Desktop, Cursor and any other harness
with stdio MCP servers. Do not reach for `mcp-remote`: copy the bundled bridge out of the
versioned install path into the stable home:

```sh
mkdir -p ~/.verstak-bridge
src=$(find -L ~/.agents/skills ~/.claude -path '*verstak/scripts/verstak-bridge.mjs' 2>/dev/null | head -1)
cp "$src" ~/.verstak-bridge/verstak-bridge.mjs && echo "copied from $src"
```

`-L` carries weight: a global `npx skills` install keeps the content in `~/.agents/skills/`
behind symlinks, and `find` without `-L` does not enter them.

**Claude Desktop** puts no skill on disk, so `find` above finds nothing: take the bridge
from the latest release, never from `main` — the `releases/latest` redirect names its tag,
as the bridge itself reads it; afterwards the bridge updates itself (section 3):

```sh
TAG=$(curl -fsSI https://github.com/verstak-ai/skills/releases/latest | tr -d '\r' | sed -n 's|^[Ll]ocation: .*/releases/tag/||p')
mkdir -p ~/.verstak-bridge
curl -fsSL "https://raw.githubusercontent.com/verstak-ai/skills/$TAG/skills/verstak/scripts/verstak-bridge.mjs" -o ~/.verstak-bridge/verstak-bridge.mjs
```

On Windows, PowerShell (`curl.exe`, not the `Invoke-WebRequest` alias):

```powershell
$tag = (curl.exe -fsSI https://github.com/verstak-ai/skills/releases/latest | Select-String '/releases/tag/([^/\s]+)').Matches[0].Groups[1].Value
New-Item -ItemType Directory -Force "$HOME\.verstak-bridge" | Out-Null
curl.exe -fsSL "https://raw.githubusercontent.com/verstak-ai/skills/$tag/skills/verstak/scripts/verstak-bridge.mjs" -o "$HOME\.verstak-bridge\verstak-bridge.mjs"
(Get-Command node).Source    # the absolute node path, for the entry's command
```

**Claude Code without the plugin** (`--scope user`: the graph follows the user, not one
project):

```sh
claude mcp add --scope user verstak -- node "$HOME/.verstak-bridge/verstak-bridge.mjs"
```

**Codex without the plugin** — the command in its branch above. **Cursor** — merge into `~/.cursor/mcp.json`;
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

With no URL argument the bridge picks its delivery's server itself, or the address in
`~/.verstak-bridge/server` (`node ~/.verstak-bridge/verstak-bridge.mjs use URL`);
`VERSTAK_BRIDGE_URL` or a URL argument beats both. A connector to the server past the
bridge is only a browser client's fallback (section 2, `Claude Code with the plugin`). On the first call the bridge runs the OAuth
flow, keeps the grant fresh in `~/.verstak-bridge/` (idle too), and turns any upstream
failure into a visible error instead of a hang. Many agents on one machine share one grant:
one click signs in the whole machine. Needs Node 22+. Diagnosis and the decision ladder:
the `verstak` skill, its `establish-mcp` method.

A machine whose server speaks this delivery's protocol under another address or tool prefix
can change both build values in `~/.verstak-bridge/config.json` (in `VERSTAK_BRIDGE_AUTH_DIR`
when that is set): `{"server": "https://…/", "tool_prefix": "kit_"}`, either key optional.
The protocol keys (`verstak/structured`, `verstak/refusal`) stay fixed — a server of another
delivery is no target. `server` replaces the default address and stands below every source
above (argument, variable, `server` file); `tool_prefix` (lower case, ending in `_`) must be
the prefix that server's tools carry — the bridge publishes and intercepts its own tools
under it and names them so in its words; the skills keep writing `verstak_*`. `use` writes
`~/.verstak-bridge/server`, which beats config.json's `server`: delete that file to let
config.json apply. A bridge and its daemon read the file once at start: after editing it,
end the harness sessions or stop the daemon (`kill` the pid `doctor` prints under "machine
daemon"), or new bridges and the running daemon disagree on the prefix. `doctor` prints the
address, the prefix and where each came from. Bad JSON or a bad value is said on stderr and
the build value stands.

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
instead; every six hours it asks this repository's releases and, if there is a newer one,
downloads the bridge, the OpenCode plugin (if installed) and this file into the home, and
tells the agent with a `DELIVERY BEHIND` line in a tool response. On demand:

```sh
node ~/.verstak-bridge/verstak-bridge.mjs update
```

Where a plugin brings the bridge (Claude Code, Codex, pi), there may be no home copy: the path of
the running bridge is printed in the `[verstak-bridge]` block of a `verstak_stand`
response; call `update` and `doctor` by it.

The harness channel updates the skill. One exception: in OpenCode, a global flat set
(`~/.agents/skills`, installed from this repository, not on Windows) a minor or major release
behind the bridge is brought up by the bridge itself when a seat is taken or returns, through
`npx skills` at the release's exact commit, and checked file by file after (`SKILLS UPDATED`);
everywhere else the seat's answer only names the lag and the command (`SKILLS BEHIND`). After `update` repeat
step 1 of your branch (`/plugin marketplace update verstak-ai` and `/reload-plugins` in
Claude Code; your flat `npx skills add` command again;
`pi update git:github.com/verstak-ai/skills`; `codex plugin marketplace upgrade verstak-ai`,
then `codex plugin remove verstak@verstak-ai` and `codex plugin add verstak@verstak-ai`),
then restart the session: a bridge of the
previous build lives until its session ends. The person can just say "update" to the agent:
the `verstak` door runs this section from the fresh copy `update` places beside the grant.

**`SKILLS DELIVERY BLOCKED`** — an OpenCode catch-up was interrupted and left its writer gate,
the directory `~/.agents/.skill-catchup.lock`. Clear it by hand, in this order, with `VERSION` from
`node BRIDGE --version`: no `npx skills` process of this HOME is still running; the set reinstalled
at the bridge's own release; the whole set compared with that release byte for byte — `diff` must
print nothing; only then the gate removed and the seat taken again.

```sh
pgrep -fl "skills add"      # must print nothing
npx -y skills@1.7.6 add https://github.com/verstak-ai/skills/tree/vVERSION --skill verstak --agent opencode --global -y
d=$(mktemp -d) && git clone -q --depth 1 --branch vVERSION https://github.com/verstak-ai/skills "$d" && diff -r "$d/skills/verstak" ~/.agents/skills/verstak
rmdir ~/.agents/.skill-catchup.lock   # only after a silent diff
```

Never remove the gate before the reinstall and a silent `diff`: one checked file proves nothing of the rest.

## 4. Restart

Tell the user installation is done and ask them to restart the session so the skill and
the connection are picked up, then to start the new session with the `verstak` door
(`/verstak:verstak` with the Claude Code plugin). This is the end of what you can do here.

## 5. First session

In the fresh session the user calls the `verstak` door and says what they want in their
own words. The agent checks the connection — `verstak_realm(action="list")` answers with
the graphs — and the door leads from there. A repository they want on verstak they ask for
by name ("/verstak align this repo"): the `align` method brings it to the verstak standard
(`AGENTS.md` + session rituals) and seeds the graph with the structure the codebase already
shows. Nothing offers it unasked.

## 6. Optional: refuse the blocking question tool outside covered repositories

Not part of the install or its report: for the person reading this page, or when they ask
about the harness's picker or question tool. In a repository under the verstak cover, Claude
Code's `AskUserQuestion` is refused by the plugin's hook, and by `.claude/settings.json` once
`align` writes it on the way to contract 16; OpenCode's `question` by the delivered OpenCode
plugin and by the project policy `align` writes there. The agent asks by an `ask` card in the
case. Outside the cover neither plugin touches the tool or the harness's permission decision. To refuse it everywhere, the
person changes their own config — offered, changed only on their word, never by the plugin or
`align`:

- **Claude Code** — `"AskUserQuestion"` added to `permissions.deny` in `~/.claude/settings.json`,
  every other entry kept.
- **OpenCode** — `{"action":"tool.use","resource":"question:*","effect":"deny"}` added to
  `policies` in `~/.config/opencode/opencode.json` (or `opencode.jsonc`, comments kept), every other field and policy kept.

## Troubleshooting

- **A command was refused, or is waiting on approval** → a permission decision, not an
  installation failure. Do not rephrase the command and do not switch install paths. Say
  which step you are on, the exact command, and what approving it does; then wait. On
  approval re-run it and continue.
- **No `verstak_*` tools in the session** → right after the first sign-in: the user
  reconnects `plugin:verstak:verstak` in `/mcp`. Otherwise MCP config loads at session
  start: restart the session and check again. Then `node BRIDGE doctor` from the project directory — it names
  every mismatch with its fix.
- **Every call answers with a sign-in link** → no grant yet: give the link to the user,
  repeat the call after they sign in. One link per machine, valid while any bridge listens:
  don't reload an old tab, take the fresh link from the tool's answer (whole, on Windows).
- **The grant has expired** (`doctor`: `refresh: … EXPIRED — a login is needed`) → `doctor`
  prints no link: take it from any `verstak_*` call (in OpenCode the `verstak_bridge` tool),
  or, with no tools in the session, from the harness's notice that the server failed or
  `claude mcp list`.
- **Sign-in keeps failing** → a personal token (section 2); a token already set that still
  gets 401 is wrong or expired: ask for a fresh one.
- **The bridge cannot run here at all** → name what is missing instead of "doesn't work":
  Node 22+ (`node --version`; OpenCode needs none), a harness that runs stdio MCP servers,
  a browser for sign-in or a personal token. A browser client with connectors may meanwhile
  use one straight to the server — a fallback with its price (section 2, `Claude Code with the plugin`). Once
  fixed, walk this file again.
- **An error names `verstak-bridge` and a verdict** → do what it says; quote the build from
  `node BRIDGE --version` when reporting a breakage.
- **The bridge refuses the owner's role** → the user's own seat (`karta="me"`) is taken only
  with `VERSTAK_BRIDGE_OWNER_ROLE=1` in the environment the bridge starts from, set by the
  user; an agent doesn't set it and stands in an agent role.
- **The seat was taken (close 4000)** → another holds it and the bridge yields at once.
  Taking it back — `verstak_stand` with `take=true`, only on the user's word.
- **Skill name collision on flat installs** → another pack ships a skill named `verstak`.
  Rename that directory, or use the Claude Code or Codex plugin channel, which namespaces it.
