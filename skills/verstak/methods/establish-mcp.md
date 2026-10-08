# establish-mcp — the transport to the graph

**Use when:** the session has no `verstak_*` tools, or they fail on transport (not connected, an OAuth sign-in link, a dead token, silence); a machine's first sign-in; switching server instance; `DELIVERY BEHIND` appears in a reply; asked which bridge version is installed. Triggers: "connect the graph", "bring up the bridge", "verstak tools unavailable", "MCP won't connect", "OAuth isn't going through", "sign in with a token", "PAT instead of OAuth", "connect OpenCode", "update the bridge". **Not when** any `verstak_*` call has answered on substance: a refusal from the graph itself (no such node, no permission, a 422) is not transport, and graph tools from another delivery don't need this method.

**Grounding:** a record's author is attested by the seat that wrote it, not by a name in the text; the bridge holds that seat binding and the grant, so without it writes go out without an author. The rest of transport is product mechanics.

Installs `verstak-bridge` (the stdio bridge; OAuth or a personal token) — the only path to the graph. Done when a `verstak_me` or `verstak_orient` call has answered in the session.

## What lives on the machine

The server is remote; the machine holds only this delivery and its transport, **`verstak-bridge`**: `scripts/verstak-bridge.mjs` in the `verstak` skill directory (below, BRIDGE). One file: the stdio MCP bridge, the seat watchdogs, the service subcommands (`node BRIDGE --help`). It holds the grant (refreshed while idle, one sign-in per machine) and the seat binding.

Plugins bring it up themselves (Claude Code as the plugin's MCP entry `verstak`, pi as a package extension, OpenCode as the delivery's plugin); elsewhere it is a stdio entry pointing at the home copy. Finding BRIDGE, in order: the home copy `~/.verstak-bridge/verstak-bridge.mjs` (a harness-raised bridge puts it there); the path in `claude mcp list` / `codex mcp list`; the `[verstak-bridge]` block of a `verstak_stand` response; `$SKILL_DIR/scripts/verstak-bridge.mjs`.

## First move — `doctor`

```sh
node ~/.verstak-bridge/verstak-bridge.mjs doctor      # or: node BRIDGE doctor
```

Changes nothing. Reports the build and Node, the home copy against this file, the latest release, the server address and its source, the server's answer, the grant (or the token, by a live handshake), the harness config entries (Claude Code, OpenCode, Codex), and "subagents": each project agent file's satellite-bridge entry plus a trial satellite launch (did it answer, will the API accept its tool schemas). Run it from the project directory. **Do what it says**: every mismatch comes with its fix command. Quote the build from its first line (`vX.Y.Z+hash`) when discussing a breakage.

## No bridge or no entry — install it

Per-harness steps are in `SETUP.md` — at `~/.verstak-bridge/SETUP.md` (placed by `node BRIDGE update`) or at the root of `github.com/verstak-ai/skills`. Follow it; the standard path is the plugin, then a new session. What to decide yourself:

- **Without the plugin**: copy the bridge to the stable home (never point a config inside a versioned install path) and register it as a stdio server in the harness's **user** config — the graph follows the user across repositories. Generic entry: `{ "mcpServers": { "verstak": { "command": "node", "args": ["/abs/path/.verstak-bridge/verstak-bridge.mjs"] } } }` — absolute path, `~` isn't expanded. Node 22+.
- **Claude Desktop** has no bridge file on disk and you have no shell there: dictate the `SETUP.md` steps to the user (download, `claude_desktop_config.json` entry, restart).
- **OpenCode** takes the delivery's plugin (`scripts/opencode-plugin.js` → `~/.config/opencode/plugins/verstak.js`), never an `mcp` entry — that renames the tools and mixes sessions. It runs the bridge on OpenCode's Bun (no Node); until sign-in, the `verstak_bridge` tool names the sign-in address. `doctor` names a stray `mcp` entry → the user removes it.
- **Codex**: `codex mcp list` showing `verstak`, `command node`, `Auth: Unsupported` is normal — the bridge holds its own grant; skip `codex mcp login`. Under `codex exec`, MCP calls are refused with `approval policy is never` until approved: the tools are visible but not callable; the sandbox-removing bypass is for externally isolated environments only. Hearing on a seat uses `node "BRIDGE" watchdog-codex KEY` from the session's shell, which needs a door the user prepares before the session (`SETUP.md`); `doctor` says whether it is open, otherwise the watchdog exits with code 2 — pass its message on and listen for `watchdog-exit`. Holding it: `methods/collaborate.md`.

**Verify with a call, not the config**: restart the harness's MCP layer, call `verstak_me` or `verstak_realm(action="list")`. An answer means connected; anything less means not.

## Sign-in

**OAuth.** The first call without a grant fails with the bridge's own link, `http://127.0.0.1:PORT/login`, and the bridge tries to open a browser. Give the link to the user; repeat the call after they sign in. One link per machine, local to it, valid while any bridge listens. No browser: `VERSTAK_BRIDGE_NO_BROWSER=1` or `--no-browser`.

**By code**, if the server supports it, the same error carries a second link (`… or sign in from another device: LINK (code …, valid until … UTC …)`): give it whole with the expiry; any device works, and the bridge collects the grant. Every call returns the same code until expiry; after it, pass on the new one. It needs a client registered on the sign-in server (`verstak-bridge`, or `VERSTAK_BRIDGE_DEVICE_CLIENT`, with the MCP address as audience); without one the error says `no sign-in by code: …` — that's the operator's move, pass it on. Otherwise: `ssh -L PORT:127.0.0.1:PORT HOST` and the local link, or a token. The grant lands in `~/.verstak-bridge/` and refreshes itself.

**A personal token** — for headless machines, CI, or repeated sign-in failures. The user issues it in the graph's web interface; never invent, guess or borrow one.

```sh
mkdir -p ~/.verstak-bridge && (umask 077; printf '%s\n' "$VERSTAK_TOKEN" > ~/.verstak-bridge/token)
node ~/.verstak-bridge/verstak-bridge.mjs doctor      # reports whether the token is accepted
```

`VERSTAK_BRIDGE_TOKEN` in the bridge's environment beats the file. A token means no browser; rejected → a new one from the user into the source the error names; removed → back to OAuth. Never into a harness config or a URL.

## Server: `use`

Default: `https://mcp.verstak.ai/`. Another instance: `node ~/.verstak-bridge/verstak-bridge.mjs use URL` — written to `~/.verstak-bridge/server`, picked up by the argument-less plugin entry; `VERSTAK_BRIDGE_URL` or a URL argument beats it. Each address keeps its own grant: a new address means a new sign-in. Never guess an instance — the user or the repo's AGENTS.md names it.

## Updating

On `mcp.verstak.ai` the bridge updates itself and reports a newer release as a `DELIVERY BEHIND` line in tool responses — pass it on. After `use URL` it checks only on demand: `node ~/.verstak-bridge/verstak-bridge.mjs update` — fresh bridge, OpenCode plugin (if installed) and `SETUP.md` into the home, plus next steps: skills update through the harness channel per `SETUP.md`; then **restart sessions** (an old bridge lives until its session ends). Installed build: `node BRIDGE --version`.

## When the bridge can't run

A harness without stdio MCP servers (the claude.ai browser app and the like), or no Node 22+ (except OpenCode) — no path to the graph. Tell the user plainly which is missing.

## Bridge errors

Every error names `verstak-bridge`, the build, the cause and a verdict: **do what it says**. "outcome unknown" after a write → re-read the target before repeating. Calls hanging with no error → the harness isn't talking to this bridge: compare `doctor` with the process the config launched. An error build older than the release → `update` and restart sessions first. Grant history: `~/.verstak-bridge/grant.log`.

What the bridge doesn't advise on its own:

- **`session recovery failed`** — the server restarted and rejected re-initialisation: reconnect the MCP server or start a new session.
- **`all candidate callback ports … are held`** — find the holder: `lsof -iTCP:PORT -sTCP:LISTEN` (Windows: `netstat -ano | findstr :PORT`). A bridge with an unfinished sign-in whose link nobody opened dies on `SIGTERM` (`pkill`); the sign-in survives and the next bridge reuses its code. If the link was opened, it waits up to five minutes for the click; only `kill -9` skips that, and the link must be reopened.
- **Every agent on the machine asks for sign-in at once** — old-build bridges are alive, skipping the shared update lock and killing the grant: `ps ax | grep -E 'verstak-bridge'` (plugin bridges carry the version in the path), then `update` and restart those sessions.
- **The browser says "the sign-in link is missing required parameters" after the password** (Windows) — an old bridge truncated the address: open the full link from the tool response, `http://127.0.0.1:PORT/login?k=…`, then `update`.

## Once the graph answers

Transport is not the work: back to the door's `Start` — orient before answering anything (`methods/entry.md`); in a repository, `methods/align.md`.
