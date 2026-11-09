# Teaching your own Orca to raise an agent by invitation

## The bound of the check

The recipe describes the CLI of **Orca 1.4.242**. Its version and command schema were observed; a dry plan is no check of a launch. Until a separate live cycle is accepted, the plan's outcome stays `launch_verified=false`. A bridge and plugin that pass `spawned_for` must arrive together: a line in a brief claims no invitation on its own, and an older bridge does not become a new one because this reference exists.

The project mapping is set by the Orca's owner. The agent changes no settings, registers or clones no project itself, updates no home delivery and restarts no one else's session for a probe. The first launch takes a separate test case and a permitted checkout; an automatic cycle is a later, separate choice.

**The Orca/Codex limit on macOS.** By an operator's report, with `CODEX_HOME` inside `~/Library/Application Support/orca/codex-runtime-home/home` the `app-server-control` socket path reached 114 bytes against the Unix socket limit of 104: the app-server control does not work. The sign: an error naming `socketPath` on `codex app-server daemon stop`. A short symlink did not help: Codex resolves the path. In the same report Codex outside Orca with `~/.codex` works; MCP, skills and frames through `watchdog-exit` working proves nothing about the app-server control. This is an Orca/Codex limit, not the bridge's debt and no reason to change the user's configuration. It was not repeated here.

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
node BRIDGE orchestra demands --realm rN
```

BRIDGE is the installed bridge's path (`methods/establish-mcp.md`, `What lives on the machine`); the graph is the one explicitly chosen. It needs a successful exit and `complete=true` with no errors. Reading takes no invitation, carries out no stop and moves no cursor; `raised` is no stop order. An incomplete answer is never an empty queue.

For one chosen `start` row write down the graph, the role, `room` (the case's UUID), `invite` (the entry's number **within that case**), the project and checkout, and the model. The dry plan holds the `command` and an `argv` array, the brief and the whole `spawned_for` pair; it executes nothing.

The first line of the initial brief for OpenCode:

```text
spawned_for: {"invite":7,"room":"11111111-1111-4111-8111-111111111111"}
```

This shows the form, not a real invitation: put the pair from a fresh demand. Then name the graph, the role and the case, the subject's references, the bound of permitted actions and the observable outcome. The agent must have register confirm this pair and join the case **before work**; refused → it does not work and does not get round the refusal with another name or `take`.

A launcher of your own that passes a separate session's environment passes the same JSON as `VERSTAK_SPAWNED_FOR`. Never set it in the environment of a server shared by all agents. The explicit field of `verstak_stand` is an object `{invite, room}`, not a JSON string; the bridge connects without it, then passes the pair at register. A raw channel connect carrying the pair is refused: use `verstak_stand`, never a way around the check. A bare invitation number, a printed case number in place of the UUID, a partial pair or conflicting sources are refused before any seat is taken. This Orca's CLI has no flag passing environment: don't invent one.

The first line counts only for a truly new session. The plugin reads the prior context before admitting the input; a nonempty or unavailable context admits no new launch basis. Reloading the plugin does not make the current input initial. For an existing session, don't try to swap its basis with a new brief. Two different bases submitted at once are never chosen between at random: work is refused. If the first attempt's connect has already gone out, it may have created a seat; only a seat proven to be this attempt's own and fresh is taken off. Uncertainty or a failed removal is reported as such, never passed off as a clean-up.

**The bound of a final refusal.** The ban after an invitation is refused lives in the current bridge session; it is not kept as a lasting ban on the harness session. The sign of a dangerous repeat: after a refusal already received, a new bridge process starts (a crash, a daemon switch, a harness restart) with the old `VERSTAK_SPAWNED_FOR` still in its environment — it can read that pair again. After a final refusal remove the variable from the launch environment and don't restart the launch with the same pair. Removing it guards against a repeat; it grants no right to go on working without an invitation — a further raise needs a new permitted call. The recipe itself changes no user configuration.

Secrets go into neither the brief nor argv, the environment, a URL or the output: the sign-in to the graph stays with the bridge in its protected files. The invitation pair is not an access token. The caller passes the arguments as a separate array, with no shell concatenation, no `eval` and no executing a printed line.

## 3. One permitted launch — a move of its own

Only after the pair's support by the bridge, the plugin and the server is checked, the dry plan checked and the owner's permission given, call `orca agent launch` with the chosen `--agent`, `--worktree path:…`, `--model`, `--prompt` and `--json`. Never the main checkout with someone else's work in it. Don't start a second agent on an answer timeout: Orca's schema describes `--retry-launch` to continue the same operation after an ambiguous outcome.

The Orca command's success is only the harness's launch. A raise by invitation succeeded on three witnesses: the server confirmed `spawned_for` with the same pair, the seat listens, the agent joined the right case. On `spawned_for_claimed`, `spawned_for_held` or an unknown invitation, don't repeat register without a basis and don't stand in for the claim with an attribute or a separate `taken`. Don't stop a competing holder so the probe wins.

## 4. Stop exactly the test agent

Send the regular stop order to the test seat's exact id: `verstak_channel(action="stop")` or `node BRIDGE stop <seat id> --realm rN`. Take the address from the observed seat, never derive it from the repository. Keep the `order_id` and check the order's outcome: a word sent is not a confirmed stop of the harness. Never replace the order with killing a PID, closing every terminal or taking off neighbouring seats.

After the cycle name the exact Orca version, the invitation pair, the project and checkout, the register receipt, the join and the stop's outcome. A cold check repeats the named way on the kept carrier; only its result lifts `launch_verified=false`. One successful launch does not attest automatic repetition, every harness, or a crossing between graphs.
