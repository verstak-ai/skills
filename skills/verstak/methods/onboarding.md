# onboarding — from no working graph to working on one's own

**Use when:** the person has **no working graph** — `verstak_realm(action="list")` shows nothing but their `@handle/mind`, or only graphs owned by others or an organization while no `AGENTS.md` names one; or, in a git repository, none of the three signs of alignment is there — the `AGENTS.md` cover, align's start hook, align's stamp — whatever graphs the person has; it fires by itself, from the door's Survey or from `methods/align.md`, without a separate call. Or the person asks: an explicit "onboarding" or a redo runs whatever the signs; only words like "help me get started", "I don't know where to start" are gated by them — **while a lasting sign below is missing**.

**Not when:** every lasting sign below is met and the person says they don't know where to start. Decide by the lasting signs — a working graph, the person's role in it, and in a harness the repository's holon and agent role; a missing seat or hooks alone routes to Start or align, never to onboarding. They have a graph and know it; the words are about their task. Ask what they are working on now and help on the material that exists (`methods/entry.md`, then the method the task needs). Explaining the graph to someone who has kept it for months is the failure here.

**Grounding:** a sign of readiness is reached when the person has made a meaningful move **and has been told its result and what it means**, in a form that invites the next move. An artifact without that word is half a sign: the graph exists, the person doesn't know it is theirs. The data shows the artifact; whether it was told lives in the conversation, and in the readiness move once the step is confirmed there as understood. For choosing the step, an artifact present counts as met, and is shown with its meaning when a step touches it. So every step ends in a sentence to the person, not in a write.

One loop serves every entry: **read the signs → choose one step → do it with the person → say the result and its meaning → read again**. The table drives it, not a fixed sequence of screens; the harness branch below fixes only the order of its first four steps.

## Signs, read from data

Read for **this person** and **the chosen graph**: the account, handle and plan are the person's; roles, repositories and subject nodes belong to one graph. A role in another graph does not count here; `@handle/mind` is never a working graph; a graph the person can read is not yet a graph they chose.

Read the missing signs with `verstak_me(action="readiness", realm)` — the count, each sign with its state, receipt and next step, the artifacts' links; without `realm` the person's signs, with it that graph's; a sign it doesn't establish, read yourself as the table says. The count ("N of M") and a step's hint are retold from readiness, never composed. Confirm a step the person understood with `verstak_me(action="understood", key)`.

| Sign | Read | Missing → step |
|---|---|---|
| personal memory | `@handle/mind` readable, holding a `svatantra` role bound to the person and an `adhikarin` role with `persona=companion` | **0 · Personal memory**, unasked |
| a working graph | `verstak_realm(action="list")` (grouped by owner) minus `@handle/mind`; `verstak_me(action="whoami")` for the handle, `verstak_me(action="orgs")` for their organizations | **1 · Area and graph** |
| the repository's hooks (Claude Code, OpenCode; none elsewhere) | `.claude/settings.json` `SessionStart`, the OpenCode plugin (`references/align-harness-surfaces.md`) naming the graph | **2 · Hooks** |
| the person's role in this graph | `verstak_me(action="kartas")` lists a role bound to them in **this** graph, of whatever kind it is; the agent role and the assistant's `persona=companion` role are not theirs | **3 · The person's role** |
| the repository's holon and its agent role | `verstak_search(realm, q="", node_type="holon", attrs_filter="repository:<host/org/repo>")`; `verstak_search(realm, q="", node_type="karta", steward_of=<holon>)` | **4 · Holon and repository** |
| the agent can be heard | `verstak_channel(action="list", realm)` shows a seat on the agent role; a word delivered to it is the proof, not presence on the board | **5 · The agent's seat** |
| repositories already registered | `verstak_search(realm, q="", node_type="holon", attrs_filter="repository:*")` | show the list before step 3 (a person the graph is shared with — invited or their organization's — sees what they join) |
| subject nodes: an action, a phenomenon, a question, a transformation, a modelled participant | `verstak_search(realm, q="", node_type=…)` per type | one step on the person's own task (`methods/writing.md`, `methods/design.md`) |
| account, name and handle | `verstak_me(action="whoami")` | not a step: name it in the greeting, one line ("account: <name>, @<handle>"); nothing to confirm, the method never changes the handle itself — a change is `verstak_me(action="set_handle")` on their word, and full graph addresses follow the new handle |
| billing — a knowledge sign | never the plan; only `verstak_me(action="understood")` confirming the step was understood | explained in step 6 |

**A failed read is "not established", never "absent".** An error, a refusal or a silent tool is not an empty list: restore access (`methods/establish-mcp.md`) and read again; never create a graph, role or holon because a read failed. This method reads neither Telegram nor the plan: they are never reported missing, only explained in step 6.

## Choose the next step

1. Read the table from the top; the first missing sign is the candidate. In the harness branch the order below wins.
2. **Offer one step**, in the person's language: what you will do, what it leaves behind, what it is for, and the condition that matters (who will own it, whether it can be renamed). One step, not the tour.
3. The person goes on, refines or defers. A refinement changes the step, not the order; a deferral ("skip") leads on to the next missing sign (`Deferral and redo`).

Already present → reused, shown with its current value, never created again. The person who still doesn't understand gets the explanation again on what exists, not a second copy of the artifact.

## Accompany the chosen step

1. **Do it with the person** — their words for names, their choice where there is one; search before every create.
2. **Say the result and what it means**, explicitly: "Created the graph *X* — your place of work; everything the agents learn about this area goes there." A step that ended in a refusal or an unmet condition says what did not happen and why — no confirmation the data doesn't show. Once the person shows they understood, confirm the step with `understood` (`Signs, read from data`).
3. Nodes you write on the person's word are written by you, never as the person. That you wrote the node doesn't make the step theirs — their move and the result you told them do.
4. **Read again** before the next choice: the reads above, not the previous answer. Switched graphs → every graph-scope sign is read afresh there.

## 0 · Personal memory — in every branch

First, in the harness and the home branch alike, without asking (`methods/minding.md`): `@handle/mind` and its two roles, created together —
- the person's role: `manifested_as="svatantra"`, bound to them (`user="me"`);
- the assistant's role: `manifested_as="adhikarin"`, `attrs={"persona":"companion"}`, bound to no user, named "Assistant" or "Assistant of <handle>" — never the person's role's name, never a personal fact.

Take the personal graph by readiness's link (the `personal_mind` item's artifact link); never search for "mind" nodes or guess the graph's number. Create mind only on an established absence (`Realm not found` on its read); an unknown or empty handle, a failed read or a failed write is not absence: create nothing, never a copy. An existing mind, even an empty one, is reused and completed with whichever role is missing, keyed by graph and person: a repeat never adds a second user-bound role or a second `persona=companion` role; roles that already fit keep their names and authorship. In the home branch the companion does this with the person's key. A thread already running in mind shows the graph exists, not the step met: it is met only once readiness names nothing missing there.

The assistant's role missing → take a fitting existing one (`verstak_search(realm=<personal graph>, q="", node_type="karta", attrs_filter="persona:companion")`), never a second; none → create it with exactly this call, without `user` — without `attrs` the platform does not recognise it as the assistant:

```
verstak_add_karta(realm=<personal graph>, name="🤖 Assistant",
  motivation="remembers and recalls what is the person's own, across all their holons",
  manifested_as="adhikarin", attrs={"persona":"companion"},
  epistemic_mode="pratyakshita", ontic_mode="vartamana", volitive_mode="upeksha")
```

Then read readiness again. Only then tell the person plainly: their personal graph *@handle/mind* exists, and the assistant remembers and recalls through it what is theirs across projects — their machines, people, habits, their own environment. Work never goes there: a project's deployment, infrastructure and decisions go to that project's graph. A write that did not land is said as such: the assistant's role could not be created, and why.

Filling mind — areas, what each live graph is for, people, their machines and local setup — is not an onboarding step: only on the person's request (`methods/minding.md`). A mind holding both roles is minimal, not filled; never report it as filled. Its artifacts present and the person understanding them are checked apart.

## The home branch — a window or bot thread

In the Verstak window's or the bot's onboarding thread there is no repository and no harness, and the thread may start with no graph chosen — then the person's own rows are read and **1 · Area and graph** chooses one. The repository check, steps 2 and 5 below, step 4's repository half (align, the `repository` attr, the agent role, `AGENTS.md`), and the table's rows for hooks, the agent role and the agent's seat do not run there; step 0 does. The loop goes **0 · Personal memory** → **1 · Area and graph** → **3 · The person's role** → **the area's first holon** → the subject steps → the word about capabilities (6), which comes once when these are done and again only on an explicit redo — never every turn. The thread's first word, from the window's or the bot's button, is one of exactly two cases: a readiness sign's key — one Latin word, one of the item keys `verstak_me(action="readiness")` prints, in the form its `next.key` takes (e.g. `working_graph`) → lead from that step; anything else — the phrase ("Start onboarding", or the same in the person's language; the bot always sends the phrase) → run the loop from the start.

**The area's first holon** is not skipped: search for a holon that already covers the area (`verstak_search(realm, q=<the area>, node_type="holon")`) and reuse it, or create one on their word with `verstak_add_holon` — no `repository` attr needed. Say what it is: the boundary of their work in the graph. Offering a repository is a sentence here, not a step: a repository is bound to this holon later by the agent in that repository — the harness branch — which finds the graph, role and holon made here and reuses them.

You write under the companion's own seat, which the runtime gives it; the method takes no seat itself here. Nodes written on the person's word keep the agent's authorship; the person's authorship is never faked.

## The harness branch — no working graph

It also runs in a repository with none of the three signs of alignment, in any harness; the Claude Code plugin's start hook and the OpenCode plugin's first prompt say so in one line, but the signs decide, not the line. A sign present with the rest missing is align's, not this branch's.

The order is fixed: personal memory (step 0) → graph → initial hooks → the person's role → the standard align move → the agent's seat → the word about capabilities.

In a graph with no agent role yet (steps 1–3) you write without a seat: there is no role of yours to stand on, and the person's role is never one. The first seat is the agent role's, once align creates it (step 4); from then on the door's seat rule holds.

**Which repository.** Before step 1 creates anything: `git remote get-url origin` and the graphs found. Show the person both and ask whether this repository is the work they want a graph for. Signs it may not be: `origin`'s owner is neither their handle nor one of their organizations; an `upstream` remote (a fork); a tutorial, a client's or a sample repo by its README. No `origin` remote → ask which repository this is; the repository steps wait for the answer. A graph already listing this repository (the repositories read above, run on each listed graph) is the answer — continue there; several → ask which. Not this repository → no hooks, holon or `AGENTS.md` here; a graph for their area is still offered (step 1), and the repository steps wait for the repository they name. No person in the session (an autonomous start) → create nothing (the mind graph excepted); the greeting says onboarding is waiting for them.

**The person already has working graphs** (the branch ran on an unaligned repository) → one question before any first move: connect this repository to one of them (list them; `origin` and a holon whose `repository` attr names it are the hint) or start a new one. No answer, no graph created.

**1 · Area and graph.** Ask what they will work on — the area, in their words, before graph and repository. Then:
- graphs owned by others or their organizations are listed → name them ("*X* is shared with you and already holds repositories *A*, *B*"); continuing there is the default, a graph of their own the exception they choose;
- none → offer `verstak_realm(action="create", name=<the area in their words>)`, named for the area rather than the repository.

Say what a graph is for them: their place of work, shared with their agents, the same in the window and the bot.

**2 · Hooks — the initial form.** Right after the graph, before the person's role: the initial hooks need only the chosen graph, readable. Wire the ritual hooks of `methods/align.md`, Step 4, now, in their initial form — byte for byte from `references/align-hooks.md`, `Initial form`: `SessionStart` with only the graph's canonical address (`@owner/slug`), so the next start in this repository reads that graph and continues from the first missing sign; the push and merge reminders to write results back; the memory guard. Merge them into the harness's existing settings — others' entries stay. Role, agent role, holon and gate may still be missing: leave them out, never invent their seqs or a gate command, never call align complete. A repeat adds no duplicate entry and never replaces full hooks — align's — with the initial form; align later replaces the initial form with its full hooks, and spec-write waits for its slot. Then the next session starts oriented even if this one stops here. Say so to the person.

**3 · The person's role.** Explain first, then propose: a graph keeps its co-authors (people working on it), agent roles, stakeholders and modelled personas (users, characters, customers); theirs is the first. Recommend naming it by their role in this area — product owner, author, researcher — though a name works too. Then:
- search: `verstak_search(realm, q="", node_type="karta")`, any kind; one already bound to them is theirs and keeps its kind — never a second; one whose `handle` attr equals their handle, unbound → bind it on their yes (`verstak_update(realm, node_id=<role>, user="me", basis_version=…)`);
- none → propose a name and a motivation drawn from what the repository does. In their own working graph the kind is `svatantra`: they are its owner. In a graph that is someone else's, the kind their motivation shows: `adhikarin` — they act with their own judgment on an impulse delegated to them; `agantuka` — they answer from outside, in their own time; an invitation or an access level decides none of it. A short answer doesn't tell → keep talking about their work, no quiz on the names. Create it on their word: `verstak_add_karta(realm, name=…, motivation=…, manifested_as=<that kind>, user="me", …)`, modes per `methods/writing.md`;
- the right to write a role is not its kind: a Reader or Inquirer gets no role written through this method, and a refused write is the answer — never retried as another kind or another path. Say what they can do now; the sign stays unmet until a role is really bound.

Say what the role gives: agents address them through it, questions are posed to it, the window shows them as its holder.

**4 · Holon and repository — the standard align move.** `methods/align.md`, round 1 from step 2: the repository's holon with its `repository` attr, the agent role as its steward, the alignment case, `AGENTS.md`. The area's holon made in the window or the bot, with no `repository` attr, is reused — it takes the attr — never doubled. Say what the holon is: the boundary of this repository's work in the graph, and where its agent will be found.

**5 · The agent's seat.** Readiness in the harness is an agent that can be heard, not bare tools. Once the agent role exists: the seat align took on it is it; otherwise, or to add `model` and `room`, one `verstak_stand(realm, karta=<agent role>, model=<model id>, room=<the person's seat address, if they gave one>)` — the method takes it itself; a harness taking the seat from `AGENTS.md` is not assumed. Tell the person where they will see the agent and how to ask it.

**6 · The word about capabilities** — after align's hand-over, once. Roughly: "You can connect Telegram — agents can then ask you questions and send you messages when you are away from your desk. You can connect several repositories to one graph — their agents talk to each other, divide duties and integrate. You can share the graph with another person and their agents, or create an organization. None of this is required — the skills work without it." It teaches; it asks nothing of them, and nothing here becomes a required step.

Billing goes in the same word, from this text, never from the person's plan — an unknown plan still gets these conditions explained. Every skill and the whole method are free; what is metered is the agents' work in the graph — writes (a node or edge an agent creates or changes) and, separately, reads (orienting, browsing, search) — up to a monthly allowance. A paid plan raises both allowances; one pays when agents work in the graph every session and the free allowance runs short. In the interface you can connect your own model provider or pay for stronger models; skills and the method work on any model — connecting your own provider is free. Confirm it as understood with `understood`. Urging a purchase is the window's and the bot's, not this method's.

## Deferral and redo

- **Defer** ("skip") → go on to the next missing sign; the deferred step does not come back in this conversation, even when readiness names it next again. Say what stays missing and how to return ("say 'onboarding'"). Nothing half-made is left (a graph without hooks is fine; a role proposed but not accepted is not written). The next start reads the signs again and continues from the first missing one.
- **Redo** ("onboarding" again, a re-run for testing) → the same steps with the current values shown and the explanations repeated; it creates nothing that exists. Two runs on one account end with one graph, one role of the person's, one holon per repository. A rename is their word: `verstak_realm(action="update", realm, name=…)`, `verstak_update` on the node.
- **Three cases to tell apart**, each checked against the data:
  - a brand-new, empty working graph → step 2's initial hooks land in this session; waiting for a role or holon first is the failure;
  - an existing mind, empty or partial → reused and completed as step 0 says, never doubled, not counted as filled;
  - a second entry — a redo or a later start → the existing graph, the person's role and both roles in mind are shown and kept; nothing is recreated.
- **Finishing these steps opens ordinary work**; it does not declare every sign met. The subject-node rows stay offers on the person's next task.
