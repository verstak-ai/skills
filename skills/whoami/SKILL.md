---
name: whoami
description: "Stand the person up in the graph — the entry point ABOVE the realms. Answers three questions before any realm is entered: where am I (which contour, which realm owns this question), what is mine (live realms, machines, deployments, what is dead), what is on me (everything addressed to this person in every realm at once). Triggers: 'где я', 'какой реалм', 'мои реалмы', 'что у меня есть', 'что на мне сейчас', 'что где задеплоено', 'заведи личный реалм', 'whoami', 'which realm is this', 'my realms', 'what's on my plate', 'where is X deployed', 'verstakify me'. Also when a session opens with no realm named by the user or by AGENTS.md. Two tacts: bearings (one orient) and reconcile (diff live access, wire identity, sweep inboxes). The person's contour lives in @<handle>/me. Needs the nks_* MCP tools."
---

# Whoami — the person's contour above the realms

Three questions, answered before any single realm is entered:

| Question | Answered from | Cost |
|---|---|---|
| **Where am I?** — which contour, which realm owns this question | the contour map (§1) | 1–2 calls |
| **What's mine?** — live realms and what each is for; machines, deployments, checkouts; what's dead or disposable | the same call | 0 extra |
| **What's on me?** — everything addressed to this person, across every realm | derived by sweep (§4) | 1 + N calls |

`entry` orients *inside* a realm and assumes the realm is given. This is what gives it. The third question nothing else can answer: it needs to know who this person is in each realm, and only the identity link (§2.3) makes that readable.

## Two carriers

| Carrier | Holds |
|---|---|
| **This skill** | protocol, contour taxonomy, storage rule, reconcile procedure, realm skeleton (`references/personal-realm.md`) |
| **`@<handle>/me`** | this person's contours, what each live realm is for, routing rules, local setup |

No harness-local file participates (no global `CLAUDE.md`, no `~/.codex/AGENTS.md`). *(why: those differ per harness and die with the machine — the graph is the only carrier that travels.)*

## The address

```
nks_me(action="whoami")            → handle
nks_orient(realm="@<handle>/me")   → the contour map
```

- The address is a **convention in this skill**, not a fact in the world. Never scan `nks_realm(action="list")` for "this user's personal realm". *(why: a runtime search is the guessing this skill removes.)*
- `Realm not found: "@<handle>/me"` **is the routing answer** — no contour yet → §3. Do not fall back to listing realms.
- Handle is stable: re-read it once per session, not per call.

## §1 Bearings

Skip entirely when the realm is already named — by the user, or by a verstakified `AGENTS.md`.

1. Resolve the address (above).
2. `nks_orient(realm="@<handle>/me")` — one call, no lens. It returns: root holons = contours; `attrs.key=true` landmarks = live-realm cards + routing rules; ACTIVE BIANHUA = the person's own transformations.
3. Name the contour and the realm. Hand to **entry**.
4. Two contours claim the question → ask one line naming both. Do not pick silently.

Ceiling: 2 calls. If a tact needs more, the contour is built wrong — fix the realm (§2), not the tact.

## §2 Reconcile

Run on request, on a new realm / machine / job, or when the map is visibly behind. **Never on §1's cadence.** *(why: a reconcile-priced entry gets skipped, and then the session guesses.)*

1. **Observe** — `nks_realm(action="list")` · `nks_me(action="kartas")` · `nks_org(action="list")`.
2. **Diff and classify** every row:

   | Verdict | Move |
   |---|---|
   | in the world, not in the map | classify: contour + what it's for, or fold under a disposable class (§ Storage) |
   | in the map, not in the world | release — `nks_update(volitive_mode="visarjana")` or ontic `atita`, reason stated |
   | in both | leave it |

3. **Wire identity** — for every live realm where the person holds a role: `nks_update(realm=<R>, node_id=<karta>, user="me", basis_version=<v>)`, or `user="me"` at creation. Only kartas the person actually stands behind. *(why: the link is a claim about reality; it is also what makes §4 possible at all.)*
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

**When not to build one:** ≤3 realms, one contour, no organizations → say so and stop. *(why: an unreconciled map answers fast and wrong; a bootstrap run on everyone is a rite, not a tool.)*

## §4 Agenda across all realms

```
nks_me(action="kartas")                                  → [(realm, karta-seq)]
nks_search(realm=<R>, q="", posed_to=<seq>)              → per realm
```

Cost = number of **live** contours, not accesses — which is what the map buys. Kartas without the `user` link do not appear: unwired realms are invisible here, so §2.3 is the precondition, not an optimization.

Never stored. *(why: a saved agenda states yesterday's obligations with today's confidence.)*

## Storage rule

**Store only what no call can answer.**

| Never store (derived) | Store (authored) |
|---|---|
| realm list, access, roles, org membership | what each live realm is **for**; when to route there |
| which kartas the person holds | contour of each realm; what's dead or dormant |
| the §4 agenda | routing and naming rules |
| anything a tool returns on demand | machines, deployments, checkouts — what doesn't survive a machine change |

- **Classes, not cards.** Disposable realms (benchmark runs, experiments) get **one** grundsatz naming the pattern — never a card each. *(why: the rule outlives its population.)*
- Never credentials or tokens.

## Limits

- **Cross-realm arrows do not exist.** Everything `@<handle>/me` says about another realm is prose and attrs, never an edge. No propagation, no `anga` across realms.
- **Not a hub.** §4's unity comes from iteration, not structure. Keep the realm thin so it doesn't pretend otherwise.
- **§1 is only as honest as the last §2.**

## Seams

| Skill | Seam |
|---|---|
| **entry** | whoami names the realm; entry orients inside it. Entry's realm-discovery defers here. |
| **verstakify** | repo contour ↔ person contour, same audit machinery. A verstakified repo names its realm → §1 unnecessary that session. |
| **on-duty** | §4 is the cross-realm view of the inboxes on-duty works one realm at a time. |
| **assembly** | the person's own transformations, if mapped, are an assembly at the scale of a life — owner accepts each telos. |
| **intake** | classifying a newly appeared realm is external word entering under provenance. |

## Acceptance

- §1 answers in ≤2 calls, or asks one question naming the candidates.
- `Realm not found` routes to §3 without an error path.
- §2 is idempotent and reports what it dropped.
- After §3, `nks_me(action="kartas")` returns a karta for every live contour.
- Nothing derivable was written into the realm.
- On a user who doesn't need one: says so, stops.

## What whoami is NOT

- **Not `entry`** — that orients inside a given realm.
- **Not a realm router only** — routing is the cheapest of its three questions; holdings and the cross-realm agenda are the other two.
- **Not an index of the access surface** — it stores the authored remainder.
- **Not a local-config generator** — no harness file is read or written.
- **Not a scheduler** — §4 says what awaits; what to do with it belongs to the person and **on-duty**.
