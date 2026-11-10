# establish-mcp — connecting and maintaining the bridge

**Use when:** the session has no `verstak_*` tools, or they fail on transport (not connected, an OAuth sign-in link, a dead token, silence); a machine's first sign-in; switching server instance; `DELIVERY BEHIND` appears in a reply; asked which bridge version is installed. Triggers: "connect the graph", "bring up the bridge", "verstak tools unavailable", "MCP won't connect", "OAuth isn't going through", "sign in with a token", "PAT instead of OAuth", "connect OpenCode", "update the bridge", "turn the orchestrator on"; agents should raise themselves through the user's Orca — turning the bridge orchestrator on and checking it. **Not when** any `verstak_*` call has answered on substance, unless the task is maintenance — an update, the installed version, switching instance (`Updating`, `Server: use`), the orchestrator (`The bridge orchestrator`) — or Codex under Orca ("Codex under Orca", "Orca as a launcher", the app-server door missing): a refusal from the graph itself (no such node, no permission, a 422) is not transport, and graph tools from another delivery don't need this method.

**Grounding:** a record's author is attested by the seat that wrote it, not by a name in the text; the bridge holds that seat binding and the grant, so without it writes go out without an author. The rest of transport is product mechanics.

Installs `verstak-bridge` (the stdio bridge; OAuth or a personal token) — the only path to the graph. Connecting is done when a `verstak_me` or `verstak_orient` call has answered in the session. Maintaining a bridge that already answers goes by its own section below: an update ends only with a restart and a check of the new build — an answer from the old bridge doesn't finish it.

## What lives on the machine

The server is remote; the machine holds only this delivery and its transport, **`verstak-bridge`**: `scripts/verstak-bridge.mjs` in the `verstak` skill directory (below, BRIDGE). One file: the stdio MCP bridge, the seat watchdogs, the service subcommands (`node BRIDGE --help`). It holds the grant (refreshed while idle, one sign-in per machine) and the seat binding.

Plugins bring it up themselves (Claude Code as the plugin's MCP entry `verstak`, Codex as the MCP entry `verstak` of the plugin `verstak@verstak-ai`, pi as a package extension, OpenCode as the delivery's plugin); elsewhere it is a stdio entry pointing at the home copy. Finding BRIDGE, in order: the home copy `~/.verstak-bridge/verstak-bridge.mjs` (a harness-raised bridge puts it there); the path in `claude mcp list` / `codex mcp get verstak` (its `args` relative to its `cwd`); the `[verstak-bridge]` block of a `verstak_stand` response; `$SKILL_DIR/scripts/verstak-bridge.mjs`.

## First move — `doctor`

**Your own Orca as an agent launcher:** the automatic path is `The bridge orchestrator` below; the manual recipe — read `references/establish-mcp-orca.md` whole before setting it up or launching.

```sh
node ~/.verstak-bridge/verstak-bridge.mjs doctor      # or: node BRIDGE doctor
```

Changes nothing. Run it from the project directory: it reports the build, the server and the grant, the harness config entries, and a "subagents" section for the project's agent files. **Do what it says**: every mismatch comes with its fix command. Quote the build from its first line (`vX.Y.Z+hash`) when discussing a breakage.

## No bridge or no entry — install it

Per-harness steps are in `SETUP.md` — at `~/.verstak-bridge/SETUP.md` (placed by `node BRIDGE update`) or at the root of `github.com/verstak-ai/skills`. Follow it; the standard path is the plugin, then a new session. What to decide yourself:

- **Without the plugin**: copy the bridge to the stable home (never point a config inside a versioned install path) and register it as a stdio server in the harness's **user** config — the graph follows the user across repositories. Generic entry: `{ "mcpServers": { "verstak": { "command": "node", "args": ["/abs/path/.verstak-bridge/verstak-bridge.mjs"] } } }` — absolute path, `~` isn't expanded. Node 22+.
- **Claude Desktop** has no bridge file on disk and you have no shell there: dictate the `SETUP.md` steps to the user — the bridge from the latest release, never from `main` (`TAG=$(curl -fsSI https://github.com/verstak-ai/skills/releases/latest | tr -d '\r' | sed -n 's|^[Ll]ocation: .*/releases/tag/||p')`, then `curl -fsSL --create-dirs "https://raw.githubusercontent.com/verstak-ai/skills/$TAG/skills/verstak/scripts/verstak-bridge.mjs" -o ~/.verstak-bridge/verstak-bridge.mjs`; on Windows the `SETUP.md` PowerShell recipe with `curl.exe`), the `claude_desktop_config.json` entry, a restart.
- **OpenCode** takes the delivery's plugin (`scripts/opencode-plugin.js` → `~/.config/opencode/plugins/verstak.js`), never an `mcp` entry — that renames the tools and mixes sessions. It runs the bridge on OpenCode's Bun (no Node); until sign-in, the `verstak_bridge` tool names the sign-in address. `doctor` names a stray `mcp` entry → the user removes it.
- **Codex**: `codex mcp list` showing `verstak`, `command node`, `Auth: Unsupported` is normal — the bridge holds its own grant; skip `codex mcp login`. Under `codex exec`, MCP calls are refused with `approval policy is never` until approved: the tools are visible but not callable; the sandbox-removing bypass is for externally isolated environments only. Hearing on a seat (`watchdog-codex`, run from the session's shell) needs a door the user prepares before the session (`SETUP.md`); `doctor` says whether it is open. Its exit 2 and holding it: `methods/collaborate.md`, `Choosing the watchdog`.

**Verify with a call, not the config**: restart the harness's MCP layer, call `verstak_me` or `verstak_realm(action="list")`. An answer means connected; anything less means not.

## Sign-in

**OAuth.** The first call without a grant fails with the bridge's own link, `http://127.0.0.1:PORT/login`, and the bridge tries to open a browser. Give the link to the user; repeat the call after they sign in. One link per machine, local to it, valid while any bridge listens. No browser: `VERSTAK_BRIDGE_NO_BROWSER=1` or `--no-browser`.

**By code**, if the server supports it, the same error carries a second link (`… or sign in from another device: LINK (code …, valid until … UTC …)`): give it whole with the expiry; any device works, and the bridge collects the grant. Every call returns the same code until expiry; after it, pass on the new one. The error says `no sign-in by code: …` → the sign-in server has no client for it: the operator's move, pass it on. Otherwise: `ssh -L PORT:127.0.0.1:PORT HOST` and the local link, or a token. The grant lands in `~/.verstak-bridge/` and refreshes itself.

**A personal token** — for headless machines, CI, or repeated sign-in failures. The user issues it in the graph's web interface; never invent, guess or borrow one.

```sh
mkdir -p ~/.verstak-bridge && (umask 077; printf '%s\n' "$VERSTAK_TOKEN" > ~/.verstak-bridge/token)
node ~/.verstak-bridge/verstak-bridge.mjs doctor      # reports whether the token is accepted
```

`VERSTAK_BRIDGE_TOKEN` in the bridge's environment beats the file. A token means no browser; rejected → a new one from the user into the source the error names; removed → back to OAuth. Never into a harness config or a URL.

## Server: `use`

Default: `https://mcp.verstak.ai/`. Another instance: `node ~/.verstak-bridge/verstak-bridge.mjs use URL` — written to `~/.verstak-bridge/server`, picked up by the argument-less plugin entry; `VERSTAK_BRIDGE_URL` or a URL argument beats it. Below all of them, `~/.verstak-bridge/config.json` (`{"server": URL, "tool_prefix": "kit_"}`) replaces the build's default address and tool prefix for that machine; the tools then carry that prefix instead of `verstak_`. doctor prints the address and the tool prefix, each with its source, and says when the `server` file shadows config.json's `server` (delete the file to let config.json apply). Each address keeps its own grant: a new address means a new sign-in. Never guess an instance — the user or the repo's AGENTS.md names it.

## Updating

On `mcp.verstak.ai` the bridge updates itself and reports a newer release as a `DELIVERY BEHIND` line in tool responses — pass it on. After `use URL` it checks only on demand: `node ~/.verstak-bridge/verstak-bridge.mjs update` — fresh bridge, OpenCode plugin (if installed) and `SETUP.md` into the home, plus next steps: skills update through the harness channel per `SETUP.md`; then **restart sessions** (an old bridge lives until its session ends). Installed build: `node BRIDGE --version`.

## The bridge orchestrator — agents raised by themselves

The machine's bridge daemon raises an agent through the user's Orca on a role's invitation into a case and extinguishes it once the case empties. The live cycle (invitation → raise → join → stop) is observed in the sibling delivery's runs, not yet in this delivery's: say so when you rely on it (`REALITY.md`). It needs three things, each the user's choice:

1. **A launcher description** in their personal mind (`slice:orchestra`) — written by **minding** (`Agents raised by themselves`), or by the user with the same switch-on command carrying `--launcher <name> --model <id>` (item 3; a description of that name already there is taken as it lies). Without one the daemon raises nothing.
2. **The machine's consent** — the user's alone: `orchestra on` typed by them at a terminal, or `VERSTAK_ORCHESTRA=1` in the daemon process's environment. An agent's shell (no terminal) gives none — never get round it: don't fake a terminal, don't write to the daemon's socket, don't set the variable in a profile. `orchestra off` clears the flag and a terminal's consent; the variable's consent lives while it is in the daemon's environment.
3. **Switching on**: `node BRIDGE orchestra on --realm @owner/slug` — the boundary of their graphs by full address (the short `rN` is refused); without `--realm` the boundary is the graphs of the machine's live agents; a new graph in the boundary needs the same consent as switching on (item 2). The refusal "the machine has not admitted the orchestrator" is item 2: name the command to the user, never get round it yourself. Off — `orchestra off`; it extinguishes none it raised.

Switching on for a user without an agent: `references/establish-mcp-orca.md`, `Switching on automatic raising without an agent`. From then the daemon runs its tact itself. **Checking** — `node BRIDGE orchestra status` (the flag, the boundary, the last tact's outcome and its lines "<graph> case <id> invite N: code"); `orchestra step --dry-run` — what a tact would raise (the launch argv) or with which code it would refuse, doing nothing and not asking Orca; `orchestra step` — one tact now. What the invitation must be to raise anyone — the door, `Case laws`, a role called in. The main codes and what they mean (the list is not the surface: a code not here → quote the status line to the user as printed, never guess its meaning):

- `launcher_missing`, `launcher_unknown`, `harness_missing`, `harness_not_offered`, `model_missing`, `model_not_offered` — the caller put what the description doesn't offer: correct the invitation (the door, `Case laws`, a role called in);
- `caller_not_allowed`, `caller_unknown` — the invitation was written by another account not named in the description's `callers`, or its author can't be established: only the machine bridge's own account raises; the user adds another to `callers` themselves (**minding**);
- `account_unknown` — the bridge did not recognise its own account: the tact raises nothing;
- `outside_boundary` — the invitation's graph is not in the orchestrator's boundary: the user widens it (item 3, with consent);
- `host_elsewhere (<machine>)` — the launcher is described for another machine: the invitation waits for its orchestrator, or correct `host` in the description;
- `harness_unsupported` — the harness isn't raised this way (only `opencode` for now);
- `no_checkout`, `ambiguous_checkout`, `checkout_absent` — the holon has no `repository`, or Orca knows not exactly one ready local copy of the project, or the directory is missing: Orca's owner sets the project up or puts a `checkouts` map into the description;
- `checkout_uncovered`, `checkout_other_seat`, `checkout_cover_unresolved` — the copy has no `AGENTS.md` cover, the cover names another graph or role than the invitation, or its `rN` isn't in the list of graphs: a raised agent seats only by the cover, so nothing launches. **align** aligns the copy;
- `limit_reached` — as many launched as allowed; the invitation waits for the next tact;
- `orca_version_unverified`, `orca_schema_unverified` — Orca's version or its commands aren't the ones the bridge knows: the tact launches nothing;
- `launch_exit_N` — Orca refused the launch; no retry, a new invitation is needed;
- `no_join` — the raised agent didn't join the case within 15 minutes: the daemon extinguishes it by a stop order; a new invitation is needed;
- `no_seat (cause_unseen), terminal_closed` — no seat stood within 15 minutes: the daemon closes the terminal it opened itself; only the harness's log knows the cause. In place of `terminal_closed` may come `no_terminal_handle` (Orca returned no terminal), `terminal_close_failed_N` (closing failed) or `terminal_runtime_unknown` (Orca named no runtime at launch) — then close the terminal in Orca yourself;
- `ended, terminal_closed` — the agent was stopped in order and the daemon closed its terminal; the variants after the comma are the same, plus `terminal_runtime_changed` (Orca restarted, the handle is stale — the daemon leaves it) or `terminal_show_failed_N`; closing is tried once, and terminals of launches whose Orca runtime the registry didn't keep are left alone — close them in Orca yourself;
- `stop_ordered_elsewhere`, `stopped_elsewhere` — the raised agent was stopped on demand (a person or an agent by a stop order, `verstak_channel` or `BRIDGE stop`), not by the orchestrator: the line waits for the order or ends at once, then `ended, terminal_closed`, and the `limit` slot is free;
- "the launcher description … in mind: code" — the description is broken, or two describe one launcher: correct it by **minding**.

The manual recipe (a launcher of your own, Orca step by step) — `references/establish-mcp-orca.md`, read whole before the move.

## When the bridge can't run

A harness without stdio MCP servers (the claude.ai browser app and the like), or no Node 22+ (except OpenCode) — no path to the graph: connecting the server directly as a harness connector does not work and is not supported. Tell the user plainly which is missing.

## Bridge errors

Every error names `verstak-bridge`, the build, the cause and a verdict: **do what it says**. "outcome unknown" after a write → re-read the target before repeating. Calls hanging with no error → the harness isn't talking to this bridge: compare `doctor` with the process the config launched. An error build older than the release → `update` and restart sessions first. Grant history: `~/.verstak-bridge/grant.log`.

What the bridge doesn't advise on its own:

- **`session recovery failed`** — the server restarted and rejected re-initialisation: reconnect the MCP server or start a new session.
- **`all candidate callback ports … are held`** — find the holder: `lsof -iTCP:PORT -sTCP:LISTEN` (Windows: `netstat -ano | findstr :PORT`). A bridge with an unfinished sign-in whose link nobody opened dies on `SIGTERM` (`pkill`); the sign-in survives and the next bridge reuses its code. If the link was opened, it waits up to five minutes for the click; only `kill -9` skips that, and the link must be reopened.
- **Every agent on the machine asks for sign-in at once** — old-build bridges are alive, skipping the shared update lock and killing the grant: `ps ax | grep -E 'verstak-bridge'` (plugin bridges carry the version in the path), then `update` and restart those sessions.
- **The browser says "the sign-in link is missing required parameters" after the password** (Windows) — an old bridge truncated the address: open the full link from the tool response, `http://127.0.0.1:PORT/login?k=…`, then `update`.

## Once the graph answers

Transport is not the work: back to the door's `Start` — orient before answering anything (`methods/entry.md`); in a repository, `methods/align.md`.
