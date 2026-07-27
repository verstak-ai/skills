---
name: whoami
description: "The user's memory in the graph — the personal realm @<handle>/me. Works like memory: by reflex, not as a session ritual. READ when the user's own field is in play and nothing names the realm: 'где я', 'какой реалм', 'мои реалмы', 'что у меня есть', 'что на мне', 'где задеплоено', 'whoami', 'my realms', 'what's on my plate', 'where is X deployed'. WRITE when a fact concerns the user, matters later, and has no project-realm home: machines, deployments, people, dated facts, cross-project findings. 'заведи личный реалм' / 'verstakify me' → bootstrap; reconcile on request. In verstakified repos the read reflex is silent (AGENTS.md names the realm) — the write reflex stays armed: user-facts born there still route here. Needs the nks_* MCP tools."
---

# Whoami — the user's memory in the graph

`@<handle>/me` holds what belongs to the user and travels with them: contours, live realms and their purpose, machines and deployments, the people of their contexts, dated facts, lessons from finished work. Treat it exactly like memory — **by reflex, not by ritual**. No agent is required to pass through it, and `entry` is self-contained — it knows nothing of this skill. In a verstakified repo the **read** reflex never fires (AGENTS.md already names the realm; the steward has no routing question) — but the **write** reflex stays armed everywhere: a user-fact born during repo work has no other home.

## Two reflexes

| Reflex | Fires when | Move |
|---|---|---|
| **READ** | the user's own field is in play and nothing names the realm — "which realm owns this?", "what do I have?", "what's on me?", "where is X deployed?" | §1: one orient of `@<handle>/me`; answer, run the §4 sweep if the ask is "what's on me", or hand the named realm to **entry** |
| **WRITE** | a fact concerns the user, will matter later, and has no project-realm home | §1b: route it to `@<handle>/me` per the skeleton — never to harness-local memory |

Bootstrap (§3) and reconcile (§2) run on explicit request only.

## The address

```
nks_me(action="whoami")            → handle
nks_orient(realm="@<handle>/me")   → the contour map
```

- The address is a **convention in this skill**, not a fact in the world. Never scan `nks_realm(action="list")` for "this user's personal realm". *(why: a runtime search is the guessing this skill removes.)*
- `Realm not found: "@<handle>/me"` **is the answer** — no contour yet → §3. Do not fall back to listing realms.
- Handle is stable: re-read it once per session, not per call.
- A personal contour already living under a **different slug** is settled at bootstrap, once: move it to `me`, or leave a **stub at `@<handle>/me`** — one `key:true` landmark naming the real address (a cold session then pays one extra orient). Never resolved by search at runtime.

## §1 The read reflex

1. Resolve the address (above).
2. `nks_orient(realm="@<handle>/me")` — one call, no lens. It returns: root holons = contours; `attrs.key=true` landmarks = live-realm cards + routing rules; ACTIVE BIANHUA = the person's own transformations.
3. Answer from the map — or name the realm and hand to **entry**.
4. Two contours claim the question → ask one line naming both. Do not pick silently.

Ceiling: 2 calls. If the reflex needs more, the realm is built wrong — fix the realm (§2), not the reflex.

## §1b The write reflex

The graph twin of "worth remembering, nowhere to put it": about the user + useful later + no project realm owns it → it goes here. Shapes are in `references/personal-realm.md` — machines and deployments (§7), people (§2b), dated facts (§7), lessons (§8), findings serving several contours.

Three-way routing, in order: a fact about **this** project → its realm or AGENTS.md (the repo's persistence rules); a fact about **another** contour → anchored in *that* contour's realm, `posed_to` its steward (**inquiry**: anchor where the addressee orients, not where you stand); a fact about the **user** that no project owns → here. Two guards on the last branch: never what a call answers (Storage rule below); never a second copy of a project realm's content.

## §2 Reconcile

Consolidation of the memory. Run on request, on a new realm / machine / job, or when the map is visibly behind. **Never on the read reflex's cadence.** *(why: a reconcile-priced read gets skipped, and then the session guesses.)*

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

**When not to build one** (provisional threshold, held as an open question in the design): **all three** of ≤3 realms, a single contour, no organizations → say so and stop. *(why: an unreconciled map answers fast and wrong; a bootstrap run on everyone is a rite, not a tool.)*

## §4 Agenda across all realms

```
nks_me(action="kartas")                                  → [(realm, karta-seq)]
nks_search(realm=<R>, q="", posed_to=<seq>)              → per realm
```

The person's standing in a realm is their **主 (owner) karta** bound via `user` — that binding *is* the cross-realm identity. A standing webhook armed on those kartas (`nks_admin(action="add_webhook", node_id=<karta>, …)`) turns this pull-sweep into push: the graph wakes you instead.

**Sweep `@<handle>/me` too**, not only project realms — a duty you posed to your own 主 karta lives nowhere else. *(why: an agenda missing what you addressed to yourself looks complete and isn't.)*

Raw `posed_to` search does not pre-filter closedness — drop closed rows by carrier: `visarjana` always, `virodha` for every genre but risk (a risk *lives* in virodha).

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

Both are ordinary graph citizens — model them, don't route around them.

- **A person is a karta** — the role they play *in your contour*, with its motivation. Bind it: `user=<their sub>` when they are on the platform (**writing** Decision 2b), `manifested_as="agantuka"` 客 when they answer on their own time from beyond your boundary. What is open with them is a vimarsha `posed_to` that karta, not a note *about* them.
- **A date is an attr, not prose** — an expiry, a renewal, a review cycle is a `sachverhalt` carrying its timestamp in `attrs` (**writing**, Decision 4); a recurring duty is a kriya. `attrs.parked_until` and `attrs.wake_condition` carry "not now, wake me then" and are honoured by the staleness detectors — use them instead of writing a date into a description.

## Limits

- **Cross-realm arrows do not exist.** Everything `@<handle>/me` says about another realm is prose and attrs, never an edge. No propagation, no `anga` across realms.
- **Not a hub.** §4's unity comes from iteration, not structure. Keep the realm thin so it doesn't pretend otherwise.
- **The read reflex is only as honest as the last §2.**

## Seams

| Skill | Seam |
|---|---|
| **entry** | one-directional: whoami names the realm and hands over; **entry stays self-contained and never references back** — the reflex fires on its own or not at all. |
| **verstakify** | a verstakified repo names its realm in AGENTS.md → the read reflex is silent there; the memory-guard moment (a blocked local-memory write) is where the write reflex routes user-scoped facts here. Same audit machinery; verstakify binds the owner karta whoami's §4 sweeps. |
| **on-duty** | §4 is the cross-realm view of the inboxes that **on-duty** works through one realm at a time. |
| **assembly** | the person's own transformations, if mapped, are an assembly at the scale of a life — owner accepts each telos. |
| **intake** | classifying a newly appeared realm is external word entering under provenance — and this contour is where word serving *several* contours lands, instead of the realm that happened to be open. |
| **inquiry** | crystallization is the §2 release move: a finished contour leaves a form behind, not just an absence. |

## Acceptance

- The read reflex answers in ≤2 calls, or asks one question naming the candidates.
- `Realm not found` is read as routing (→ §3), not as failure.
- In a verstakified repo the read reflex stays silent; a user-scoped fact born there still lands in `@<handle>/me`.
- §2 is idempotent and reports what it dropped.
- After §3, `nks_me(action="kartas")` returns a karta for every live realm where the person holds a role.
- Nothing derivable was written into the realm.
- On a user who doesn't need one: says so, stops.

## What whoami is NOT

- **Not a session ritual** — nothing routes through it by protocol; it fires by its triggers or not at all.
- **Not `entry`** — that orients inside a given realm, is used by every agent already told where to go, and does not know this skill exists.
- **Not an index of the access surface** — it stores the authored remainder.
- **Not a local-config generator** — no harness file is read or written.
- **Not a scheduler** — §4 says what awaits; what to do with it belongs to the person and **on-duty**.
