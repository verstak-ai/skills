---
name: minding
description: "The user's mind in the graph — the personal realm @<handle>/mind; this skill is its memory: recall and write by reflex, not ritual. RECALL when the user's own field is in play: 'вспомни', 'что ты знаешь обо мне', 'что у меня есть', 'что на мне', 'где задеплоено', 'какой реалм', 'do you remember', 'what's on my plate'. WRITE when a fact concerns the user, matters later, and has no project-realm home: 'запомни', machines, deployments, people, dated facts, cross-project findings. 'заведи мне память' / 'verstakify me' → bootstrap; reconcile on request. In verstakified repos only the session-routing question dies (AGENTS.md names the realm) — recall and the write reflex stay armed. Needs the nks_* MCP tools."
---

# Minding — the user's mind in the graph

`@<handle>/mind` holds what belongs to the user and travels with them: contours, live realms and their purpose, machines and deployments, the people of their contexts, dated facts, lessons from finished work. This skill is that realm's **memory** — recall and write, **by reflex, not by ritual**. Both reflexes key to the **question, not the session**: a verstakified repo kills only the routing case (AGENTS.md names the session's realm) — everything else fires from any session.

## Two reflexes

| Reflex | Fires when | Move |
|---|---|---|
| **RECALL** | the user asks ('вспомни', 'что ты знаешь…'); the task needs a user holding (a deploy target, a machine trait, a person's rhythm, an expiry); nothing names the realm in play; the "what's on me" ask | §1 — map-level or fact-level read; the agenda ask → §4 |
| **WRITE** | a fact concerns the user, will matter later, and has no project-realm home | §1b: route it to `@<handle>/mind` per the skeleton — never to harness-local memory |

Bootstrap (§3) and reconcile (§2) run on explicit request only.

## The address

```
nks_me(action="whoami")            → handle
nks_orient(realm="@<handle>/mind") → the contour map
```

- The address is a **convention in this skill**, not a fact in the world. Never scan `nks_realm(action="list")` for "this user's personal realm". *(why: a runtime search is the guessing this skill removes.)*
- `Realm not found: "@<handle>/mind"` **is the answer** — no contour yet → §3. Do not fall back to listing realms.
- Handle is stable: re-read it once per session, not per call.
- A personal contour already living under a **different slug** is settled at bootstrap, once: move it to `mind`, or leave a **stub at `@<handle>/mind`** — one `key:true` landmark naming the real address (a cold session then pays one extra orient).

## §1 Recall

Two depths, priced separately:

1. **Map-level** — which realm owns this, what do I have, which contour: one `nks_orient(realm="@<handle>/mind")`, no lens. It returns: root holons = contours; `attrs.key=true` landmarks = live-realm cards + routing rules; ACTIVE BIANHUA = the person's own transformations. Answer from the map, or name the realm and hand to **entry**. Ceiling: 2 calls.
2. **Fact-level** — a *specific* remembered fact (a path on a box, a person's rhythm, an expiry): **search first, skip the orient** — `nks_search(realm="@<handle>/mind", q=<term>)`, plus `nks_semantic_search` when the memory may be worded differently than the ask. Lexical `q` is AND-matched and stem-sensitive: one or two short terms **in the realm's language** («caddy», «домен») — a multi-word query silently misses cards that carry every word but one. Read the mode badge before trusting the hit: `atita` is a *former* fact, `anagata` a planned one. Deeper reads follow **entry**'s protocol (orient → search → look), run inside this realm. Ceiling: 3 calls, then answer with what you have.

Two rules at either depth: two contours claim the question → ask one line naming both, never pick silently; **a miss is an answer** — "этого в памяти нет" beats a confident invention, and a miss the user corrects is the write reflex's cue (§1b).

## §1b The write reflex

The graph twin of "worth remembering, nowhere to put it": about the user + useful later + no project realm owns it → it goes here. Shapes are in `references/personal-realm.md` — machines and deployments (§7), people (§2b), dated facts (§7), lessons (§8), findings serving several contours.

Three-way routing, in order: a fact about **this** project → its realm or AGENTS.md (the repo's persistence rules); a fact about **another** contour → anchored in *that* contour's realm, `posed_to` its steward (**inquiry**: anchor where the addressee orients, not where you stand); a fact about the **user** that no project owns → here. Two guards on the last branch: never what a call answers (Storage rule below); never a second copy of a project realm's content.

**The routing runs both directions** — where a fact belongs is where to look for it: a deploy target, a machine trait, a person's rhythm, a cross-project lesson are *read* from `@<handle>/mind` mid-repo-work exactly because that is where they are written. And a write is preceded by a read anyway: locate the card before adding to it.

## §2 Reconcile

Consolidation of the memory. Run on request, on a new realm / machine / job, or when the map is visibly behind. **Never on recall's cadence.** *(why: a reconcile-priced recall gets skipped, and then the session guesses.)*

1. **Observe** — `nks_realm(action="list")` · `nks_me(action="kartas")` · `nks_org(action="list")`.
2. **Diff and classify** every row:

   | Verdict | Move |
   |---|---|
   | in the world, not in the map | classify: contour + what it's for, or fold under a disposable class (§ Storage) |
   | in the map, not in the world | **crystallize, then release** — ask what the contour proved; if there is an answer, write it as a `grundsatz`/`bildung` with `arose_from` to the card, *then* `nks_update(volitive_mode="visarjana")` / ontic `atita`, reason stated |
   | in both | leave it |

   *(why crystallize first: an archived realm is never re-read. Release without it deletes the only part of a finished contour that had long value.)*

3. **Wire identity** — for every live realm where the person holds a role: `nks_update(realm=<R>, node_id=<karta>, user="me", basis_version=<v>)`, or `user="me"` at creation. Only kartas the person actually stands behind. *(why: the link is a claim about reality — and §4 sees nothing else.)*
4. **Sweep** (§4).
5. **Report what changed and what you left out.** A silent reconcile reads as "all fine".

Idempotent — a re-run touches only what moved.

## §3 Bootstrap

Audit each concern against its source and classify **absent / stale / correct** (same machinery as **verstakify**). Do not branch on "does the realm exist".

| Concern | Kind | Absent → |
|---|---|---|
| what realms/roles/orgs exist | derived | never write it down |
| what each live realm is for; contours; what's dead | authored | ask the user |
| machines, deployments, checkouts | authored | ask the user |
| routing and disposable-class rules | authored | propose, user confirms |

Then fill `references/personal-realm.md` and run §2 once, so the first map is born verified.

**When not to build one** (provisional threshold): **all three** of ≤3 realms, a single contour, no organizations → say so and stop. *(why: an unreconciled map answers fast and wrong; a bootstrap run on everyone is a rite, not a tool.)*

## §4 Agenda across all realms

```
nks_me(action="kartas")                                    → [(realm, karta-seq)]
nks_search(realm=<R>, q="", posed_to=<seq>,
           volitive_mode="chanda,adhimoksha,upeksha,virodha",
           limit=100)                                      → open items, per realm
```

Three rules make a sweep honest:

- **The filter is part of the call.** The `volitive_mode` CSV keeps answered and released rows (`visarjana`) off the wire entirely.
- **Two kinds of closed rows survive it — drop them on read:** rows rendered with the 🌅 sunset badge (closed by their carrier), and `virodha` rows of any genre except risk (a refused question is closed; a risk in `virodha` is *live* — that is its active mode).
- **Read the "N of M" header.** Past `limit` the page truncates — and a truncated agenda looks complete. Page on until N = M.

The person's standing in a realm is a karta bound via `user` — typically the **主 (owner) karta**; agent kartas the person runs bind the same way. That binding *is* the cross-realm identity. A standing webhook armed on a bound karta (`nks_admin(action="add_webhook", node_id=<karta>, …)`) turns this pull-sweep into push: the graph wakes you instead.

**Sweep `@<handle>/mind` too** — a duty you posed to your own 主 karta lives nowhere else.

Cost = number of **live** contours, not accesses. Kartas without the `user` link do not appear at all — §2.3 is the precondition, not an optimization.

Never stored. *(why: a saved agenda states yesterday's obligations with today's confidence.)*

## Storage rule

**Store only what no call can answer** — minus secrets, which are unanswerable *and* still never stored.

| Never store | Store (authored) |
|---|---|
| realm list, access, roles, org membership | what each live realm is **for**; when to route there |
| which kartas the person holds | contour of each realm; what's dead or dormant |
| the §4 agenda | routing and naming rules |
| anything a tool returns on demand | machines, deployments, checkouts, per-machine tool surfaces |
| a second copy of a project realm's content | the people of each contour, and what is open with them |
| secrets — credentials, tokens, keys | dated facts: expiries, renewals, review cycles |
| prose restating what orient already shows | external word serving **more than one** contour (a finding, a benchmark, a diagnosis belonging to no single project); lessons crystallized out of retired contours (§2) |

- **Classes, not cards.** Disposable realms (benchmark runs, experiments) get **one** grundsatz naming the pattern — never a card each. *(why: the rule outlives its population.)*

### People and dated facts

- **A person is a karta** — the role they play *in your contour*, with its motivation. Bind it: `user=<their sub>` when they are on the platform (**writing** Decision 2b), `manifested_as="agantuka"` 客 when they answer on their own time from beyond your boundary. What is open with them is a vimarsha `posed_to` that karta, not a note *about* them.
- **A date is an attr, not prose** — an expiry, a renewal, a review cycle is a `sachverhalt` carrying its timestamp in `attrs` (**writing**, Decision 4); a recurring duty is a kriya. `attrs.parked_until` and `attrs.wake_condition` carry "not now, wake me then" and are honoured by the staleness detectors — use them instead of writing a date into a description.

## Limits

- **Cross-realm arrows do not exist.** Everything `@<handle>/mind` says about another realm is prose and attrs, never an edge. No propagation, no `anga` across realms.
- **Not a hub.** §4's unity comes from iteration, not structure. Keep the realm thin so it doesn't pretend otherwise.
- **Recall is only as honest as the last §2.**

## Seams

| Skill | Seam |
|---|---|
| **entry** | one-directional: minding names the realm and hands over; **entry stays self-contained**. |
| **verstakify** | a verstakified repo names its realm in AGENTS.md → the routing question dies there; user-field recall stays, and the memory-guard moment (a blocked local-memory write) is where the write reflex routes user-scoped facts here. Same audit machinery; verstakify binds the owner karta memory's §4 sweeps. |
| **on-duty** | §4 is the cross-realm view of the inboxes that **on-duty** works through one realm at a time. |
| **assembly** | the person's own transformations, if mapped, are an assembly at the scale of a life — owner accepts each telos. |
| **intake** | classifying a newly appeared realm is external word entering under provenance — and this contour is where word serving *several* contours lands, instead of the realm that happened to be open. |
| **inquiry** | crystallization is the §2 release move: a finished contour leaves a form behind, not just an absence. |

## Acceptance

- Map-level recall answers in ≤2 calls, or asks one question naming the candidates; fact-level reaches a stored fact in ≤3 calls, search-first.
- A recall miss is reported as a miss — and offered as a write.
- `Realm not found` is read as routing (→ §3), not as failure.
- In a verstakified repo the session-routing question never fires; user-field recall and writes still run there.
- §2 is idempotent and reports what it dropped.
- After §3, `nks_me(action="kartas")` returns a karta for every live realm where the person holds a role.
- Nothing derivable was written into the realm.
- On a user who doesn't need one: says so, stops.

## What minding is NOT

- **Not a session ritual** — nothing routes through it by protocol; it fires by its triggers or not at all.
- **Not the harness's memory feature** — no MEMORY.md, no local files; the graph is the carrier, and user-facts routed here are exactly the ones that must survive a machine change.
- **Not `entry`** — that orients inside a given realm, used by every agent already told where to go.
- **Not an index of the access surface** — it stores the authored remainder.
- **Not a scheduler** — §4 says what awaits; what to do with it belongs to the person and **on-duty**.
