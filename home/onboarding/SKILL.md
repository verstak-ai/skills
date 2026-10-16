---
name: onboarding
description: "Lead a person with no working graph to working on their own, one step at a time: read the readiness signs from data, offer one step, do it with them, say the result and what it means, read again. Starts from the window's onboarding progress or the bot's button after sign-in, or on the person's word. Triggers: 'onboarding', 'start onboarding', 'help me get started', 'I don't know where to start', 'where do I begin', 'redo onboarding'. Not for a person who already works in their graph — help with their task instead. Needs the verstak_* tools."
---

# onboarding — from no working graph to working on one's own

**Use when:** the person has **no working graph** — `verstak_realm(action="list")` shows nothing but their `@handle/mind`, or only graphs owned by others or an organization while no `AGENTS.md` names one; it fires by itself, at session start or from the window's or bot's onboarding button, without a separate call. Or the person asks: an explicit "onboarding" or a redo runs whatever the signs; only words like "help me get started", "I don't know where to start" are gated by them — **while a lasting sign below is missing**.

**Not when:** every lasting sign below is met and the person says they don't know where to start. Decide by the lasting signs — a working graph, the person's role in it, and in a harness the repository's holon and agent role; a missing seat or hooks alone routes to Start or align, never to onboarding. They have a graph and know it; the words are about their task. Ask what they are working on now and help on the material that exists: open the node with `verstak_look`, walk the arrow the question needs, and run `verstak_orient(focus=<node>, lens=…)` there for a pattern; answer from what they show — "I don't see it", never "there is none". Explaining the graph to someone who has kept it for months is the failure here.

**Grounding:** a sign of readiness is reached when the person has made a meaningful move **and has been told its result and what it means**, in a form that invites the next move. An artifact without that word is half a sign: the graph exists, the person doesn't know it is theirs. The data shows the artifact; whether it was told lives only in the conversation. For choosing the step, an artifact present counts as met, and is shown with its meaning when a step touches it. So every step ends in a sentence to the person, not in a write.

One loop serves every entry: **read the signs → choose one step → do it with the person → say the result and its meaning → read again**. The table drives it, not a fixed sequence of screens; the harness branch below fixes only the order of its first four steps.

## Signs, read from data

Read for **this person** and **the chosen graph**: the account, handle and plan are the person's; roles, repositories and subject nodes belong to one graph. A role in another graph does not count here; `@handle/mind` is never a working graph; a graph the person can read is not yet a graph they chose.

| Sign | Read | Missing → step |
|---|---|---|
| a working graph | `verstak_realm(action="list")` (grouped by owner) minus `@handle/mind`; `verstak_me(action="whoami")` for the handle, `verstak_me(action="orgs")` for their organizations | **1 · Area and graph** |
| the repository's hooks | `.claude/settings.json` `SessionStart`, the OpenCode plugin naming the graph | **2 · Hooks** |
| the person's role in this graph | `verstak_me(action="kartas")` lists a `svatantra` role bound to them in **this** graph; an agent role is not theirs | **3 · The person's role** |
| the repository's holon and its agent role | `verstak_search(realm, q="", node_type="holon", attrs_filter="repository:<host/org/repo>")`; `verstak_search(realm, q="", node_type="karta", steward_of=<holon>)` | **4 · Holon and repository** |
| the agent can be heard | `verstak_channel(action="list", realm)` shows a seat on the agent role; a word delivered to it is the proof, not presence on the board | **5 · The agent's seat** |
| repositories already registered | `verstak_search(realm, q="", node_type="holon", attrs_filter="repository:*")` | show the list before step 3 (a person the graph is shared with — invited or their organization's — sees what they join) |
| subject nodes: an action, a phenomenon, a question, a transformation, a modelled participant | `verstak_search(realm, q="", node_type=…)` per type | one step on the person's own task |
| handle | `verstak_me(action="whoami")` | show it; a change is `verstak_me(action="set_handle")` on their word — full graph addresses follow the new handle |

**A failed read is "not established", never "absent".** An error, a refusal or a silent tool is not an empty list: say the read failed and read again; never create a graph, role or holon because a read failed. This method reads neither Telegram nor the plan: they are never reported missing, only explained in step 6.

## Choose the next step

1. Read the table from the top; the first missing sign is the candidate. In the harness branch the order below wins.
2. **Offer one step**, in the person's language: what you will do, what it leaves behind, what it is for, and the condition that matters (who will own it, whether it can be renamed). One step, not the tour.
3. The person goes on, refines or defers. A refinement changes the step, not the order; a deferral stops here (`Deferral and redo`).

Already present → reused, shown with its current value, never created again. The person who still doesn't understand gets the explanation again on what exists, not a second copy of the artifact.

## Accompany the chosen step

1. **Do it with the person** — their words for names, their choice where there is one; search before every create.
2. **Say the result and what it means**, explicitly: "Created the graph *X* — your place of work; everything the agents learn about this area goes there." A step that ended in a refusal or an unmet condition says what did not happen and why — no confirmation the data doesn't show.
3. Nodes you write on the person's word are written by you, never as the person. That you wrote the node doesn't make the step theirs — their move and the result you told them do.
4. **Read again** before the next choice: the reads above, not the previous answer. Switched graphs → every graph-scope sign is read afresh there.

## The home branch — a window or bot thread

In the Verstak window's or the bot's onboarding thread there is no repository and no harness, and the thread may start with no graph chosen — then the person's own rows are read and **1 · Area and graph** chooses one. Steps 0, 2, 4 and 5 below, and the table's rows for hooks, the repository's holon and the agent's seat, do not run there; the loop reaches **1 · Area and graph**, **3 · The person's role** and the subject steps, and the word about capabilities (6) comes once when they are done. Say plainly that a repository is connected from the agent in that repository — the harness branch — which finds the graph and role made here and reuses them.

## The harness branch — no working graph

The order is fixed: graph → hooks → the person's role → the standard align move → the agent's seat → the word about capabilities.

In a graph with no agent role yet (steps 1–3) you write without a seat: there is no role of yours to stand on, and the person's role is never one. The first seat is the agent role's, once align creates it (step 4).

**0 · Which repository.** Before anything is created: `git remote get-url origin` and the graphs found. Show the person both and ask whether this repository is the work they want a graph for. Signs it may not be: `origin`'s owner is neither their handle nor one of their organizations; an `upstream` remote (a fork); a tutorial, a client's or a sample repo by its README. No `origin` remote → ask which repository this is; the repository steps wait for the answer. A graph already listing this repository (the repositories read above, run on each listed graph) is the answer — continue there; several → ask which. Not this repository → no hooks, holon or `AGENTS.md` here; a graph for their area is still offered (step 1), and the repository steps wait for the repository they name. No person in the session (an autonomous start) → create nothing (the mind graph excepted); the greeting says onboarding is waiting for them.

**1 · Area and graph.** Ask what they will work on — the area, in their words, before graph and repository. Then:
- graphs owned by others or their organizations are listed → name them ("*X* is shared with you and already holds repositories *A*, *B*"); continuing there is the default, a graph of their own the exception they choose;
- none → offer `verstak_realm(action="create", name=<the area in their words>)`, named for the area rather than the repository;
- `@handle/mind` missing → create it unasked (**minding**); work never goes there.

Say what a graph is for them: their place of work, shared with their agents, the same in the window and the bot.

**2 · Hooks — the minimal align.** Wire the repository's ritual hooks now, with the graph's address: `SessionStart` and the memory guard. Align's round 1, step 6, refills `SessionStart` with the holon and role seqs; spec-write waits for its slot. Then the next session starts oriented even if this one stops here. Say so to the person.

**3 · The person's role.** Explain first, then propose: a graph keeps its co-authors (people working on it), agent roles, stakeholders and modelled personas (users, characters, customers); theirs is the first. Recommend naming it by their role in this area — product owner, author, researcher — though a name works too. Then:
- search: `verstak_search(realm, q="", node_type="karta", manifested_as="svatantra")`; a role whose `handle` attr equals their handle, unbound → bind it on their yes (`verstak_update(realm, node_id=<role>, user="me", basis_version=…)`);
- none → propose a name and a motivation drawn from what the repository does, and create it on their word: `verstak_add_karta(realm, name=…, motivation=…, manifested_as="svatantra", user="me", …)`.

Say what the role gives: agents address them through it, questions are posed to it, the window shows them as its holder.

**4 · Holon and repository — the standard align move.** The repository's holon with its `repository` attr, the agent role as its steward, the alignment case, `AGENTS.md`. Say what the holon is: the boundary of this repository's work in the graph, and where its agent will be found.

**5 · The agent's seat.** Readiness in the harness is an agent that can be heard, not bare tools. Once the agent role exists: one `verstak_stand(realm, karta=<agent role>, model=<model id>, room=<the person's seat address, if they gave one>)` — the method takes it itself; a harness taking the seat from `AGENTS.md` is not assumed. Tell the person where they will see the agent and how to ask it.

**6 · The word about capabilities** — after align's hand-over, once. Roughly: "You can connect Telegram — agents can then ask you questions and send you messages when you are away from your desk. You can connect several repositories to one graph — their agents talk to each other, divide duties and integrate. You can share the graph with another person and their agents, or create an organization. None of this is required — the skills work without it — but it is very convenient." It teaches; it asks nothing of them, and nothing here becomes a required step.

## Deferral and redo

- **Defer** → stop after the current step; nothing half-made is left (a graph without hooks is fine; a role proposed but not accepted is not written). The next start reads the signs again and continues from the first missing one.
- **Redo** ("onboarding" again, a re-run for testing) → the same steps with the current values shown and the explanations repeated; it creates nothing that exists. Two runs on one account end with one graph, one role of the person's, one holon per repository. A rename is their word: `verstak_realm(action="update", realm, name=…)`, `verstak_update` on the node.
- **Finishing these steps opens ordinary work**; it does not declare every sign met. The subject-node rows stay offers on the person's next task.
