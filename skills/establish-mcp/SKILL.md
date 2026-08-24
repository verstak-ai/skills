---
name: establish-mcp
description: "Reaching the NKS graph when the harness cannot: nks_* MCP tools are absent, MCP registration fails, or the native OAuth experience keeps failing the user. Ships and raises verstak-bridge — a stdio to streamable-HTTP MCP bridge with the full OAuth flow that never answers the harness with silence. Triggers: 'подключи граф', 'подними мост', 'nks тулы недоступны', 'mcp не подключается', 'oauth не проходит', 'oauth отваливается', 'connect to the graph', 'set up NKS MCP', 'raise the bridge', 'MCP tools missing', tool calls timing out while the server is alive, or a harness whose MCP config takes only command plus args. Composes entry (which needs the tools this skill provides) and verstakify (which wires registration into a repo)."
---

# Establish MCP — reaching the graph when the harness cannot

Every other skill in this delivery assumes the `nks_*` MCP tools are already in
the session. This one exists for when they are not — or when they are there in
name and fail in use. Its job ends where entry's begins: a session whose first
`nks_orient` call answers.

The server is remote (streamable HTTP + OAuth); nothing of it installs on the
user's machine. What installs is this delivery — and it carries its own
transport for harnesses that need one: `scripts/verstak-bridge.mjs`, beside this
file.

## First: which case is this?

Work down the ladder; stop at the first row that fits. Native support is
preferred when it works — the bridge is the fallback, and there are two distinct
reasons to fall back: the harness *cannot* do https+OAuth MCP, or it can and the
experience keeps failing the user anyway.

1. **The harness config accepts a remote entry** (a `url` / `httpUrl` /
   `serverUrl` field, or `type: "http"` / `"remote"` / `"streamableHttp"`) **and
   the harness has an auth verb** — a login command (`/mcp`, `codex mcp login`,
   `opencode mcp auth`), an Authenticate button, a connectors UI. → Register
   natively — at user scope, same rule as step 3 below — and stop. The bridge enters only if case 4 develops.
2. **A remote entry exists, but no auth verb anywhere** — the docs show manual
   `Authorization` headers instead. → The OAuth flow will not happen natively.
   Raise the bridge.
3. **The config takes only `command` + `args`** — stdio-only harness. → Raise
   the bridge; there is no native path.
4. **Native registration exists but the experience fails the user** — repeated
   browser re-auth, calls hanging while the server is alive on other surfaces,
   401 loops after idle. → Offer the bridge; its token keepalive and per-request
   deadline exist precisely for this.

When a row is uncertain, resolve it by probe, not by reading more docs:
configure the native entry and watch the first call. A `401` followed by an
opened browser is native support working; a `401` followed by silence is row 2.

## Raising the bridge

1. **Copy the script out of the delivery.** The installed copy of this skill
   lives at a versioned path that changes on every release — config must never
   point into it. Copy to a stable home:

   ```sh
   mkdir -p ~/.verstak-bridge
   cp "$SKILL_DIR/scripts/verstak-bridge.mjs" ~/.verstak-bridge/
   ```

   (`$SKILL_DIR` = this skill's base directory, printed when the skill loads.)
   Re-run the copy after a delivery update — the installed skill is the source,
   the copy is derived.

2. **The bridge already knows the product instance.** With no URL argument it
   points at `https://nks.lab.mirari.ru/mcp`. Pass a URL (or `VERSTAK_BRIDGE_URL`)
   only when the user works against another instance or a fork — take it from
   them or the repo's AGENTS.md, never guess a non-default one.

3. **Register the bridge as an ordinary stdio MCP server — at USER scope, not
   project scope.** The graph is the user's own contour and follows them across
   every repository; a project-scoped entry loses it in the first directory
   over. So the registration goes into the harness's user-level config (the
   file in the home directory), never the per-project one — project scope only
   when the user explicitly asks for it. The generic shape:

   ```json
   { "command": "node", "args": ["/home/USER/.verstak-bridge/verstak-bridge.mjs"] }
   ```

   In Claude Code that is
   `claude mcp add --scope user nks -- node ~/.verstak-bridge/verstak-bridge.mjs`
   (the default scope is project-local — pass `--scope user` explicitly; this
   path is also useful when the native http entry misbehaves — case 4). Append
   the server URL as one more arg only for a non-default instance. Use the
   absolute home path, not `~`, in JSON configs that do not expand it.

4. **First call authorizes.** The bridge answers the first `401` by opening the
   browser for the OAuth flow (discovery, client registration, PKCE — all
   automatic). Headless session: set `VERSTAK_BRIDGE_NO_BROWSER=1`; the bridge
   prints the authorize URL on stderr for the user to open anywhere. Tokens
   land in `~/.verstak-bridge/` (0600) and refresh themselves from then on — also
   while idle, so an unused session does not decay into a dead grant.

5. **Verify by calling, not by config.** Restart the harness's MCP layer and
   run one real tool call (`nks_realm(action="list")` or an orient). The bridge
   is connected when the call answers; anything less is not done.

## What the bridge guarantees — and how to read its errors

The bridge never answers the harness with silence: every request either gets
the server's response or a JSON-RPC error naming `verstak-bridge` and the reason.
There is no long-lived upstream connection to die half-open — each request is
its own POST with a deadline.

**Many agents, one grant, one flow.** Dozens of local agents may each run their
own bridge process; they all share one token store, and a refresh completed by
any of them serves the rest. When the grant is dead and a browser is needed,
exactly one instance runs the flow; every call on every agent meanwhile answers
immediately with the SAME authorize URL — whichever surface the human happens to
be looking at, one click heals the whole machine. No call ever hangs waiting for
a human.

What decides who runs it is the **loopback callback port**, not the note beside
the token store: the instance that binds the port owns the flow, and the note
only carries its URL for the others to show. So a bridge killed mid-flow — an
ephemeral harness process reaped, a crash, a `SIGKILL` — hands the flow on
cleanly: the next instance finds nothing listening, takes over, and publishes a
URL of its own. Asked to leave while a flow is pending, a bridge stays up until
the click lands, because that click is not repeatable. If you are ever unsure
whether an authorize URL is still live, read the port out of its `redirect_uri`
and look for a listener: `lsof -iTCP:PORT -sTCP:LISTEN` on macOS/Linux,
`netstat -ano | findstr :PORT` on Windows — where this defect was first seen. An
open port is the whole claim; a URL published without one costs the human a
login for nothing.

| You see | It means | Move |
|---|---|---|
| error mentions `upstream unreachable` / `no answer within` | network or server down; the bridge is fine | retry; if it persists, the server side needs attention — not the bridge |
| error mentions `authorization failed` | the OAuth flow itself failed | read the bridge's stderr in the harness's MCP logs; re-run the call to retrigger the flow |
| error mentions `session recovery failed` | server restarted and refused re-initialize | restart the harness's MCP connection |
| error mentions `callback port … is held by another process` | something unrelated to the bridge sits on the loopback redirect port | find it (`lsof -iTCP:PORT`, or `netstat -ano | findstr :PORT`) and stop it; the port is derived from the server URL, so the bridge cannot move off it |
| calls hang with no error at all | the harness is not talking to this bridge | check which process the config actually launched |

Knobs, when the defaults pinch: `--timeout` ms per request (default 120000),
`--auth-dir`, `--no-browser`, `--debug` (verbose stderr), env
`VERSTAK_BRIDGE_CLIENT_ID` (skip dynamic registration), `VERSTAK_BRIDGE_SCOPE`.

## First aid when the session is on mcp-remote

A harness still bridged by `mcp-remote` (npx) fails in a known shape: every
`nks_*` call times out while the server is alive on its other surfaces. That is
the half-dead bridge — the process answers the harness on stdio while its TCP
to the server is gone, and it neither errors nor reconnects.

Diagnose and clear it:

```sh
ps aux | grep mcp-remote                      # candidate pids
lsof -nP -p PID | grep ESTABLISHED            # a live bridge has one to :443
kill PID                                      # only the ones WITHOUT established TCP
```

The harness respawns fresh bridges and the next call goes through. Leave alive
ones alone — a working bridge may stand among the corpses. Then propose
switching to `verstak-bridge` (this delivery owns it, versions it, and its failure
mode is a visible error instead of this silence).
