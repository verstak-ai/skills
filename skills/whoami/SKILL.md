---
name: whoami
description: "Stand the person up in the graph — the entry point ABOVE the realms. Answers three questions before any realm is entered: where am I (which contour, which realm owns this question), what is mine (live realms, people, machines, deployments, what is dead), what is on me (everything addressed to this person in every realm at once). Triggers: 'где я', 'какой реалм', 'мои реалмы', 'что у меня есть', 'что на мне сейчас', 'что где задеплоено', 'заведи личный реалм', 'whoami', 'which realm is this', 'my realms', 'what's on my plate', 'where is X deployed', 'verstakify me'. Also when a session opens with no realm named by the user or by AGENTS.md. Two tacts: bearings (one orient) and reconcile (diff live access, wire identity, sweep inboxes). The person's contour lives in @<handle>/me. Needs the nks_* MCP tools."
---

# Whoami — the person's contour above the realms

Three questions, answered before any single realm is entered:

| Question | Answered from | Cost |
|---|---|---|
| **Where am I?** — which contour, which realm owns this question | the contour map (§1) | 1–2 calls |
| **What's mine?** — live realms and what each is for; the people of each contour; machines and deployments; what's dead or disposable | the same call | 0 extra |
| **What's on me?** — everything addressed to this person, across every realm | derived by sweep (§4) | 1 + N calls |

`entry` orients *inside* a realm and assumes the realm is given. This is what gives it.

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

**When not to build one:** ≤3 realms, one contour, no organizations → say so and stop. *(why: an unreconciled map answers fast and wrong; a bootstrap run on everyone is a rite, not a tool.)*

## §4 Agenda across all realms

```
nks_me(action="kartas")                                  → [(realm, karta-seq)]
nks_search(realm=<R>, q="", posed_to=<seq>)              → per realm
```

**Sweep `@<handle>/me` too**, not only project realms — a duty you posed to your own 主 karta lives nowhere else. *(why: an agenda missing what you addressed to yourself looks complete and isn't.)*

Cost = number of **live** contours, not accesses. Kartas without the `user` link do not appear at all — §2.3 is the precondition, not an optimization.

Never stored. *(why: a saved agenda states yesterday's obligations with today's confidence.)*

## Storage rule

**Store only what no call can answer.**

| Never store (derived) | Store (authored) |
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
- **§1 is only as honest as the last §2.**

## Seams

| Skill | Seam |
|---|---|
| **entry** | whoami names the realm; entry orients inside it. Entry's realm-discovery defers here. |
| **verstakify** | repo contour ↔ person contour, same audit machinery. A verstakified repo names its realm → §1 unnecessary that session. |
| **on-duty** | §4 is the cross-realm view of the inboxes on-duty works one realm at a time. |
| **assembly** | the person's own transformations, if mapped, are an assembly at the scale of a life — owner accepts each telos. |
| **intake** | classifying a newly appeared realm is external word entering under provenance — and this contour is where word serving *several* contours lands, instead of the realm that happened to be open. |
| **inquiry** | crystallization is the §2 release move: a finished contour leaves a form behind, not just an absence. |

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
