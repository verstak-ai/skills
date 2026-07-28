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

One question decides this whole file: **are you the same client that will call the
`nks_*` tools?** The skills install identically everywhere; the graph server does not,
and the gap is not cosmetic. A login run by the wrong client succeeds — the browser
opens, the user approves, `claude mcp list` goes green — and leaves you exactly as
unauthorized as you were.

Ask the shell rather than guessing:

```sh
echo "entrypoint=${CLAUDE_CODE_ENTRYPOINT:-none} claudecode=${CLAUDECODE:-0}"
```

**`entrypoint=claude-desktop`** — you are hosted *inside* the Claude Code desktop app.
The `claude` binary in your shell is a different client with its own credential store,
often signed into a different account outright. OAuth cannot reach you: take the token
path in step 2 instead of spending a round trip discovering it.

**Any other entrypoint with `claudecode=1`** — terminal Claude Code. You and the `claude`
you can run are one client, and the login is yours to complete.

**Neither set** — Cursor, Codex, CI, or another agent entirely. Token path.

Claude Desktop and claude.ai are their own case: same skills, but the server is authorized
by a press inside the app (step 2). Whatever you conclude here, the verification at the
end of step 2 is what settles it.

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

**Look before you add.** `claude plugin list` tells you whether verstak is already here
and at what version. If it is, adding the marketplace again repairs nothing — refresh the
catalog and move the install onto it instead:

```sh
claude plugin marketplace update verstak-ai
claude plugin update verstak@verstak-ai
```

An install that is present and current is a finished step 1, not a reason to reinstall.
Go to step 2 and check the server, which is where a "broken verstak" almost always is.

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

**Terminal Claude Code, interactive.** The first `nks_*` call — or `/mcp` — opens the
browser login, and you are done. Do not assume you are here.

**Terminal Claude Code without a TTY** — a headless run, a cron job, a piped `-p`
invocation. Nothing opens on its own: the call comes back `needs authentication` and
stays there however many times you retry. Start the login yourself instead:

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
the command prints the authorization URL before it waits. If no browser can open where you
are, add `--no-browser` and hand that URL to the user. It is single-use and bound to the
waiting process — while they have it open, do not re-run the login, or you invalidate the
link they are on. One caveat before reaching for that flag: the redirect goes to
`localhost` on *their* machine, so if you are on a remote host this is the one moment the
flow genuinely wants stdin — they land on a dead port and paste the redirect URL back into
the waiting process. Same machine, same browser, and none of that applies.

**Hosted inside the desktop app, an IDE, Codex, Cursor, CI — anything step 0 did not call
the terminal client: do not run `claude mcp login` at all.** It will look like it worked.
A browser opens, the user approves, the command prints success, `claude mcp list` turns
green — and none of it is yours: the localhost callback is caught by the `claude` process
you spawned, and the token is filed in *that* client's store, under *that* client's
account. Repeating it changes nothing. Go straight to the token path below. It is not a
degraded route — being independent of any per-client credential store is precisely why it
is also what Codex and Cursor use.

Then verify — and this is the part that cannot be faked:

```sh
claude mcp list    # plugin:verstak:nks: <MCP_URL> (HTTP) - ✔ Connected
```

That line proves the *terminal CLI* is authorized. It says nothing about you. The check
that counts is a real call from your own session: `nks_orient` returns a realm list. If
the `nks_*` tools are still missing after a session restart while `claude mcp list` reads
Connected, you are not the client that holds the token — switch to the token path.

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

**The token path — when OAuth is absent, cannot reach you, or will not go through.**
Three cases lead here, and the middle one is the easiest to miss. The first is
structural: harnesses without MCP-OAuth support (Codex-style configs, CI, autonomous VMs)
have no browser login to run. The second is the wrong-client case from step 0 — the login
is available, it simply authorizes somebody else. The third is plain breakage: the login
never opens, never completes, or every `nks_*` call keeps coming back 401. Do not grind on any of them and do not retry variations. A personal access token is
a header, not a session, so it authenticates from any process on any host — which makes
it the one path that behaves the same everywhere.

The user creates the token in the web UI and gives it to you — never invent, guess, or
reuse one. Pass it as a Bearer header.

**Claude Code, terminal or desktop-hosted.** Add a header-authenticated entry beside the
plugin's. MCP *configuration* lives in `~/.claude.json` and every client on the machine
reads it; only OAuth *credentials* are per-client. That asymmetry is the whole reason this
reaches a desktop-hosted session when a login cannot:

```sh
claude mcp add --transport http --scope user nks-token <MCP_URL> \
  --header 'Authorization: Bearer ${VERSTAK_TOKEN}'
```

The single quotes are deliberate — they keep the placeholder out of the shell's hands, so
the literal `${VERSTAK_TOKEN}` lands in the config and Claude Code expands it at load
(`headers` is a supported expansion site). The token itself never enters the file.

One trap on macOS: an app launched from the Dock never reads your shell profile, so a
`VERSTAK_TOKEN` exported in `.zshrc` is invisible to the desktop app, the header expands
to nothing, and you get a clean 401 that looks like a bad token. Either put it where GUI
processes can see it — `launchctl setenv VERSTAK_TOKEN …`, then restart the app — or
accept the literal token in `~/.claude.json`, which is machine-local and never committed.

**Anything else:**

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
- **`claude mcp login nks` → no such server** → with the plugin the server is
  `plugin:verstak:nks`. Run `claude mcp list` and copy the name from there.
- **`stdin isn't a terminal, so authentication can't be completed here`** → your shell has
  no TTY, not a broken login. Re-run it under `script` as in step 2; the localhost
  callback finishes the flow without any input.
- **`nks_*` tools not visible** → the MCP config loads on session start, so restart the
  session (or reload MCP config) and verify again. Tools stay invisible in the session
  that authorized the server — expected, not a failed login.
- **`claude mcp list` reads Connected, but the session still says `needs authentication`**
  → the wrong-client signature, and the one failure retrying cannot fix. A desktop- or
  IDE-hosted agent ran the login, and the terminal CLI got authorized instead — possibly
  under a different account. Confirm with step 0 (`CLAUDE_CODE_ENTRYPOINT`) and take the
  token path; or, if the user would rather press a button than mint a token, have them
  open `/mcp` in an interactive session of that same app and authenticate there.
- **Skill name collision on flat installs** → another skill pack already uses a bare
  name like `design`. Rename that directory, or use the Claude Code plugin channel,
  which namespaces everything under `verstak`.
