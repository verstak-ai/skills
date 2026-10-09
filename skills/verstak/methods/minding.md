# minding — the user's memory in the graph

**Use when:** a durable fact about the user surfaces mid-task and serves no single project (their machines, expiries, people, lessons) → write it; a task needs such a fact (a deploy target, a machine trait, someone's rhythm, a deadline) → recall it. Or the user asks: "do you remember", "what do you know about me", "what do I have", "what's on my plate", "where is it deployed"; "remember this" (→ write); "set up my memory" (→ bootstrap). Never route these facts into the harness's own memory. What mind holds is never retold outside it.

`@handle/mind` is the user's personal graph: the areas of their life and work, their live graphs and what each is for, machines, people, dated facts, lessons. Recall and write **by reflex, not by ritual** — memory is holding and bringing back, both acts, not a store. Both key to the **question, not the session**: an aligned repository settles only which graph the session works in.

## Two reflexes

| Reflex | Fires when | Move |
|---|---|---|
| **Recall** | the user asks; the task needs something about the user; nothing names the graph in play; "what's on me" | §1; the agenda → §4 |
| **Write** | the fact concerns the user, will matter later, and no project graph owns it | §1b — into `@handle/mind` under its area's holon; a person as a guest role in a group; never harness-local memory |

Every user gets `@handle/mind` and their own role in it without being asked (`references/minding-personal-realm.md` §1–2): created by the door when the user has no graph, by `methods/align.md` when aligning, by this method on `Realm not found`. Filling (§3) and reconciling (§2) happen on request.

## The address

```
verstak_me(action="whoami")            → handle (once per session)
verstak_orient(realm="@handle/mind")   → the map of holons
```

- The address is **a convention**, not something to discover: don't scan `verstak_realm(action="list")` for a personal graph.
- `Realm not found: "@handle/mind"` **is an answer**: create the graph and role (reference §1–2) without asking; filling waits for a request. Don't fall back to listing graphs.
- A personal graph under **another slug** is settled once, at bootstrap: move it to `mind`, or leave a **stub at `@handle/mind`** — one `key:true` landmark carrying the real address.

## §1 Recall

1. **Map level** — which graph owns this, what do I have: one `verstak_orient(realm="@handle/mind")`, no lens. Root holons are the areas; `attrs.key=true` landmarks are the live-graph cards and routing rules; `ACTIVE BIANHUA` shows the user's own transformations. Answer from the map, or name the graph and hand over to `methods/entry.md`. Ceiling: 2 calls.
2. **Fact level** — a specific fact (a path on a machine, a rhythm, an expiry): **search first, skip the orient** — `verstak_search(realm="@handle/mind", q=term)`, plus `verstak_semantic_search` when the wording may differ. Lexical `q` is AND-matched and stem-sensitive: one or two short terms in the graph's own wording. Read the mode badge before trusting a hit: `atita` is a former fact, `anagata` a planned one. Ceiling: 3 calls, then answer with what you have.

Two areas claim the question → ask in one line naming both. **A miss is an answer** ("that isn't in memory"); a corrected miss is the cue to write (§1b).

## §1b The write reflex

About the user + useful later + serves no single project → here. Shapes: `references/minding-personal-realm.md` — machines (§7), people (§2b), dated facts (§7), lessons (§8).

**Whose fact is it?** — where agents misroute most. Infrastructure that exists for **this project** (servers, pipeline, dated duties) is the project graph's, however long it outlives the repo; here goes only the user's **own**. A card carries only its subject's traits: a project's deploy procedure is not a trait of the machine. Route in order:

1. **This** project → its graph, or AGENTS.md.
2. **Another** area → that area's graph, `posed_to` its steward (anchor where the addressee orients — `methods/inquiry.md`).
3. **The user**, no project owns it → here — never what a call can answer (Storage rule), never a copy of a project graph's content.

**Routing runs both ways**: what was written here is *read* from here mid-repo-work. Every write starts with a read — find the card before adding.

**Where in mind — by reflex, not on request:**
- **A subject area gets a holon.** A fact from a new area (health, home, a language, a client field) goes under that area's holon, not the root. Search first (`verstak_search(realm="@handle/mind", q=area, node_type="holon")` plus semantic); not found → create it, as a sub-holon (`contains` from the parent) if it belongs to an existing area, named in the user's words.
- **A person gets a guest role** — `manifested_as="agantuka"` 客 (outside the user's boundary, answering on their own time), with the motivation they have *in the user's life*, not a dossier (reference §2b). Search first. Members point by `group` arrows to group roles (family, the studio's clients); groups nest. What's open with them is a vimarsha `posed_to` their role.

## §2 Reconcile

On request, on a new graph, machine or job, or when the map is visibly behind — never at recall's cadence.

1. **Observe** — `verstak_realm(action="list")` · `verstak_me(action="kartas")` · `verstak_org(action="list")`.
2. **Diff and classify:**

   | Verdict | Move |
   |---|---|
   | in the world, not on the map | classify: its holon and purpose — or fold it under a disposable class (Storage rule) |
   | on the map, not in the world | **crystallize, then release**: what did the area prove? Write it as a `grundsatz` (principle) or `bildung` (a pattern taking shape) with `arose_from` to the card, *then* `verstak_update(volitive_mode="visarjana")` or ontic `atita`, with the reason — nobody re-reads an archived graph |
   | in both | leave it |

3. **Wire identity** — in every live graph where the user holds a role: `verstak_update(realm=R, node_id=role, user="me", basis_version=v)`, or `user="me"` at creation. Only roles they actually stand behind; §4 sees nothing else.
4. **Sweep** (§4).
5. **Report what changed and what you left out.**

Idempotent: a re-run touches only what moved.

## §3 Bootstrap

Audit each concern against its source: **absent / stale / correct** (as in `methods/align.md`).

| Concern | Kind | If absent |
|---|---|---|
| which graphs, roles, organizations exist | derived | never write it down |
| what each live graph is for; areas; what is dead | authored | ask the user |
| machines, deployments, checkouts | authored | ask the user |
| routing rules, disposable classes | authored | propose; the user confirms |
| standing preferences | authored | personal ones (tone, window, form) go here; ones affecting how development runs go to AGENTS.md or the project graph; never into files outside the worktree (`methods/align.md`, Step 1) |

Fill the skeleton from the reference, then run §2 once. Mind is memory, not a workplace: project work goes to a project graph (the door's `Survey` table, "no project graph").

## §4 The agenda across all graphs

```
verstak_me(action="kartas")                                     → [(graph, role seq)]
verstak_search(realm=R, q="", posed_to=seq,
               volitive_mode="chanda,adhimoksha,upeksha,virodha",
               limit=100)                                       → what is open, per graph
```

- The `volitive_mode` filter keeps answered and released rows off the wire.
- Drop while reading: rows with the 🌅 sunset badge (ended by their carrier), and `virodha` rows of any genre except `risk` (a risk in `virodha` is being guarded — live).
- `upeksha` rows are a separate pile — accepted as is, woken by a change at their anchor, not by a read (`methods/inquiry.md`); list them apart and leave them.
- **Read the "N of M" header** and page until N = M: a cut agenda looks complete.
- **Sweep `@handle/mind` too** — duties posed to the user's own owner role live only there.

The user appears in each graph through one **owner role** (`svatantra` 主) bound via `user` — their cross-graph identity; unbound roles don't show (hence §2 step 3). Agent roles they run stay unbound. Read the role queue with `verstak_orient(focus=<role>)` on entry and on cause; a frame reaches its addressee and the case's participants, not every seat of the role. Cost scales with live areas. **Never store the agenda**: it would state yesterday's obligations with today's confidence.

## Privacy — mind doesn't leave

Don't retell mind's facts or structure (which holons, people, groups, cards exist) into project graphs, to other agents, into PRs, commits or any shared surface — not even that something is recorded. The user's other agents read it with their own access.

Do **rely** on it: the line is *acting on* versus *passing on*; shared text gets only what the work needs, no source cited. A fact the project needs as its own (its deadline, its server) goes into the project graph from the user's words or a project source, not copied from mind. Unsure → ask.

## Storage rule

**Store only what no call can answer** — minus secrets, never stored.

| Never store | Store (authored) |
|---|---|
| the graph list, access, roles, org membership | what each live graph is **for**; when to route there |
| which roles the user holds | each graph's area; what is dead or dormant |
| the §4 agenda | routing and naming rules |
| anything a tool returns on demand | the user's own machines and checkouts; tool surfaces per machine |
| a copy of a project graph's content | the people of each area and what is open with them |
| secrets — credentials, tokens, keys | dated facts: expiries, renewals, review cycles |
| prose retelling what orient shows | external findings serving **more than one** area; lessons crystallized in §2 |

**Classes, not cards**: disposable graphs (benchmark runs, experiments) get **one** `grundsatz` naming the pattern.

### People and dated facts

- **A person is a role** (§1b), bound with `user=their sub` when on the platform (`methods/writing.md`, Decision 2b).
- **A date is an attribute**: a `sachverhalt` (state of affairs) with its timestamp in `attrs` (`methods/writing.md`, Decision 4); a recurring duty is a kriya.

## Limits

- **No arrows between graphs**: what mind says about another graph is prose and attributes — no edges, no `anga` across graphs.
- **Not a hub**: §4's unity is iteration, not structure; keep the graph thin.
- **Recall is only as accurate as the last §2.**

## Acceptance

- Recall within its ceilings; a miss offered as a write; `Realm not found` read as routing.
- After §3, `verstak_me(action="kartas")` shows a role in every live graph the user holds one in.
- Nothing derivable written; new-area facts under their holon; people as guest roles in groups; nothing of mind outside it.

Next moment: a fact turns out to be one project's → that project's graph (`methods/writing.md`), not mind.
