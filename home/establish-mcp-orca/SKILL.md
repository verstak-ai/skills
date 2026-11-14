---
name: establish-mcp-orca
description: "Reference for the establish-mcp skill: teaching your own Orca to raise an agent by invitation — the mapping the owner sets, reading the bridge's demands, the dry plan, the spawned_for pair, one permitted launch and its stop. Load when establish-mcp points here; not a task of its own."
---

# Teaching your own Orca to raise an agent by invitation

## Switching on automatic raising without an agent

For the user, at their own terminal. The bridge is `~/.verstak-bridge/verstak-bridge.mjs`; its daemon is already alive while any harness session with the bridge is open. It needs Orca with the repository's project set up, and the invitation's subject holon carrying the `repository` attribute (or the role's copy named in the description's `homes`, `minding-launcher`).

1. See what lies: `node ~/.verstak-bridge/verstak-bridge.mjs orchestra status`.
2. A dry tact — what would be raised now, launching nothing and not asking Orca:

   ```sh
   node ~/.verstak-bridge/verstak-bridge.mjs orchestra step --dry-run --realm @owner/slug
   ```

   Per invitation, "would launch: orca agent launch …" or "would refuse: code" (the codes — **establish-mcp**, `The bridge orchestrator`). The copy Orca would name is shown as a placeholder. The graph must lie inside the machine's boundary: named by an earlier `on`, or the graph of an agent alive on the machine now; otherwise the refusal `outside_boundary`.
3. Switch on — one command; typed at a terminal, it is the machine's consent itself (no variable, no restart):

   ```sh
   node ~/.verstak-bridge/verstak-bridge.mjs orchestra on --realm @owner/slug \
     --launcher mac --model anthropic/claude-opus-5-5 --limit 2
   ```

   `--launcher` is the launcher's name, at most 64 characters (longer is refused): roles will call agents by it. No description of that name in mind → the command writes one under the holon of working with agents (the one holding the `slice:agents` cards; not exactly one found → at mind's root, and the answer says so) (`--model` any number of times, `--limit` agents at once, 1 by default, `--host` the machine's name, without it any machine of the account answers); one there → taken as it lies, edited in mind. Without `--launcher` — only the flag and the boundary.
4. Check: `… orchestra status` — "on" and the boundary; the tact runs by itself once a minute, `… orchestra step` runs one now.
5. Stop one agent — `node ~/.verstak-bridge/verstak-bridge.mjs stop <seat> --realm @owner/slug`: the orchestrator sees the order, closes the Orca tab and frees the slot in `limit`.
6. Switch off — `… orchestra off`: clears the flag and a terminal's consent (the consent of `VERSTAK_ORCHESTRA=1` lives while the variable is in the daemon's environment); raised agents live out their own path. The next switch-on is again from a terminal if a terminal gave the consent; with `VERSTAK_ORCHESTRA=1` in the daemon's environment it passes without one.

## The bound of the check

The recipe describes the CLI of **Orca 1.4.242**. This is the manual path: a launcher of your own, or Orca step by step. The automatic one is the bridge orchestrator (**establish-mcp**, `The bridge orchestrator`): it checks the commands and flags Orca declares before a launch (its version only printed). A dry plan is no check of a launch. A line in a brief claims no invitation on its own: only a bridge that knows the `spawned_for` pair takes it — its field is named by the description of the `verstak_stand` tool in this session. No field → the bridge is old: tell the user an `update` is needed, don't update it yourself.

The project mapping is set by the Orca's owner. The agent changes no settings, registers or clones no project itself, updates no home delivery and restarts no one else's session for a probe. The first launch takes a separate test case and a permitted checkout.

**Codex under Orca on macOS** may fail to control its app-server (the sign: an error naming `socketPath` on `codex app-server daemon stop`): an Orca and Codex limit, not the bridge's; don't change the user's configuration for it.

## 1. Read your own surface

```sh
orca --version
orca agent-context --json
orca project list --json
orca project setups --json
```

From the schema you need `agent launch` with `agent`, `worktree`, `model`, `prompt`, `json`, and `surface` for a separate surface. This version's `agent launch` has no `--dry-run`: no such flag makes a safe trial launch. A dry move calls neither `agent launch` nor `worktree create`.

The owner sets a one-to-one mapping:

- the demand's `repository` → an exact `project.id` from Orca's list;
- one ready local setup of that project → an existing absolute checkout;
- the permitted harness and model → the values of `--agent` and `--model`.

Equal project names do not tell repositories apart. An SSH host alias and the repository's public address may differ: keep the explicit mapping, never a heuristic that blurs it. A repository URI is not a local path or a command. A missing or ambiguous project, a setup not ready or a model not permitted means a refusal, never creating what is missing.

## 2. Read the demands, build the plan

```sh
node BRIDGE orchestra demands --realm @owner/slug
```

BRIDGE is the installed bridge's path (**establish-mcp**, `What lives on the machine`); the graph is the one explicitly chosen. It needs a successful exit and `complete=true` with no errors. Reading takes no invitation, carries out no stop and moves no cursor; `raised` is no stop order. An incomplete answer is never an empty queue.

For one chosen `start` row write down the graph, the role, `room` (the case's UUID), `invite` (the entry's number **within that case**), the project and checkout, and the model. The dry plan holds the `command` and an `argv` array, the brief and the whole `spawned_for` pair; it executes nothing.

The initial brief for OpenCode is one line: the mark, the pair, a space, the brief.

```text
verstak/spawned_for: {"invite":7,"room":"11111111-1111-4111-8111-111111111111"} First: join the case …
```

This shows the form, not a real invitation: put the pair from a fresh demand. The plugin takes a pair only after its own mark `verstak/spawned_for:`; a multi-line `--prompt` the OpenCode terminal puts into its input as a paste it never sends — the pair on a first line of its own only where the input is sent whole. Keep the whole line short — the orchestrator keeps its own within 220 characters, since a longer single line was seen pasted and never sent: after the pair only the join call, `First: verstak_case(action="join", realm="<graph>", room="<room>").`. The graph, the role, the subject's references, the bound of permitted actions and the observable outcome go into the case, as its assignment the agent reads on joining. The agent must have register confirm this pair and join the case **before work**; refused → it does not work and does not get round the refusal with another name or `take`.

A launcher of your own that passes a separate session's environment passes the same JSON as `VERSTAK_SPAWNED_FOR`. Never set it in the environment of a server shared by all agents. The explicit way is the `verstak_stand` field, by its description; a raw channel connect carrying the pair is refused — never a way around the check. A bare invitation number, a printed case number in place of the UUID, a partial pair or conflicting sources are refused before any seat is taken. This Orca's CLI has no flag passing environment: don't invent one.

The first line counts only for a truly new session. The plugin reads the prior context before admitting the input; a nonempty or unavailable context admits no new launch basis. Reloading the plugin does not make the current input initial. For an existing session, don't try to swap its basis with a new brief. Two different bases submitted at once are never chosen between at random: work is refused. If the first attempt's connect has already gone out, it may have created a seat; only a seat proven to be this attempt's own and fresh is taken off. Uncertainty or a failed removal is reported as such, never passed off as a clean-up.

**The bound of a final refusal.** The ban after an invitation is refused lives in the current bridge session; it is not kept as a lasting ban on the harness session. The sign of a dangerous repeat: after a refusal already received, a new bridge process starts (a crash, a daemon switch, a harness restart) with the old `VERSTAK_SPAWNED_FOR` still in its environment — it can read that pair again. After a final refusal remove the variable from the launch environment and don't restart the launch with the same pair. Removing it guards against a repeat; it grants no right to go on working without an invitation — a further raise needs a new permitted call. The recipe itself changes no user configuration.

Secrets go into neither the brief nor argv, the environment, a URL or the output: the sign-in to the graph stays with the bridge in its protected files. The invitation pair is not an access token. The caller passes the arguments as a separate array, with no shell concatenation, no `eval` and no executing a printed line.

## 3. One permitted launch — a move of its own

Only after the pair's support is checked (the `spawned_for` field in the `verstak_stand` description, `The bound of the check`), the dry plan checked and the owner's permission given, call `orca agent launch` with the chosen `--agent`, `--worktree path:…`, `--model`, `--prompt` and `--json`. Never the main checkout with someone else's work in it. Don't start a second agent on an answer timeout: Orca's schema describes `--retry-launch` to continue the same operation after an ambiguous outcome.

The Orca command's success is only the harness's launch. A raise by invitation succeeded on three witnesses: the server confirmed `spawned_for` with the same pair, the seat listens, the agent joined the right case. On `spawned_for_claimed`, `spawned_for_held` or an unknown invitation, don't repeat register without a basis and don't stand in for the claim with an attribute or a separate `taken`. Don't stop a competing holder so the probe wins.

## 4. Stop exactly the test agent

Send the regular stop order to the test seat's exact id: `verstak_channel(action="stop")` or `node BRIDGE stop <seat id> --realm @owner/slug`. Take the address from the observed seat, never derive it from the repository. Keep the `order_id` and check the order's outcome: a word sent is not a confirmed stop of the harness. Never replace the order with killing a PID, closing every terminal or taking off neighbouring seats.

After the cycle name the exact Orca version, the invitation pair, the project and checkout, the register receipt, the join and the stop's outcome. A cold check repeats the named way on the kept carrier; only its result counts as a check of the launch. One successful launch does not attest automatic repetition, every harness, or a crossing between graphs.
