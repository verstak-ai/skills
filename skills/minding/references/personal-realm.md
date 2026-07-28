# The personal realm — skeleton for `@<handle>/mind`

The shape `minding` fills at bootstrap (§3) and keeps true at reconcile (§2). Not a
document to paste: a **node set to build**, designed so that a single
`nks_orient(realm="@<handle>/mind")` prints the routing answer with no lens and no
follow-up call.

That design goal governs every choice below. The overview prints **root holons**,
**`attrs.key=true` landmarks**, and **ACTIVE BIANHUA** — so those three channels
carry everything recall needs, and nothing else needs to be cheap.

## 1 · The realm

`nks_realm(action="create", slug="mind", name=<the person's own words>)`.

Owner is the user, always personal — never transferred to an organization. An org
has no personal contour; a team-scoped variant is deliberately out of scope.

## 2 · The doer

One **svatantra 主** karta, bound to the human identity:

```
nks_add_karta(realm=…, name="👤 <role name in the user's words>",
  motivation=<what drives them across all contours — not a job title>,
  manifested_as="svatantra", user="me",
  epistemic_mode="pratyakshita", ontic_mode="vartamana", volitive_mode="upeksha")
```

`user="me"` is the point: it is what makes the person findable from outside this
realm. Give it a `steward` edge to each contour holon it answers for.

Do **not** re-create the roles the person holds in project realms — those live
there and come back from `nks_me(action="kartas")` in one call. Duplicating them
here creates a second source of truth that drifts.

## 2b · The people of your contours

Personal connections are part of what a contour holds — the collaborators,
counterparties, clients and household of that boundary. Model each as the
**role they play in your contour**, with its own motivation (a person's name is
still not a karta — **writing** Decision 2b):

- `user=<their sub>` when they are on the platform (`nks_admin(action="search_users")`
  finds it) — that binding is what lets the graph know it is the same person you
  meet in a project realm;
- `manifested_as="agantuka"` 客 for anyone who answers on their own time from
  beyond your boundary — a client, a counterparty, a regulator. `svatantra` /
  `adhikarin` only for those inside your rhythm;
- what is open with them is a vimarsha `posed_to` that karta — the relationship is
  carried by what passes between you, not by a description of the person;
- `group` to a senior role when someone is a sub-role of another (a reviewer within
  a team lead's contour).

The people of a *project* live in the project's realm; here belong those who cross
contours or belong to no project at all.

## 3 · Contours — root holons

A contour is a **boundary**, not a folder: it must answer the four holon
questions (what question it frames, what is inside/outside, its rhythm of change,
who acts in it). If a proposed contour can't answer them, it isn't one — fold it
into a neighbour.

Propose from the person's actual life, never from this list. A common shape:

| Contour | Inside | Rhythm |
|---|---|---|
| 🏢 employment / client work | realms and repos owned by that organization | the org's cadence |
| 🜂 own product | what the person owns and directs | daily |
| 🏠 personal | own projects, no external obligation | irregular |
| 💻 workplace | machines, checkouts, deployments, tool surfaces | changes on setup events |
| 🧪 experiments | disposable, measurable, retired on sight | per run |

The **workplace** contour is the one that pays for itself first: it is the only
home for facts that otherwise live on one machine and die with it.

## 4 · Live realms — one `ding` each, `attrs.key=true`

A realm is addressable outside the graph, so it is a `ding`.

```
nks_add_phenomenon(realm=…, name="🗂 <realm name>", given_as="ding",
  description=<what it is FOR, and when to route a question here>,
  attrs={"key": true, "address": "@owner/slug", "state": "live|dormant"},
  arrows=[{arrow_type:"context", target:<contour holon>, volitive_mode:…}],
  epistemic_mode="pratyakshita", ontic_mode="vartamana", volitive_mode="upeksha")
```

`key: true` is what puts the card in the orient overview — that is the routing
table. Keep the description **routing-shaped**: what question belongs here, in
the words the person would use, not a summary of the realm's contents (which
orient on *that* realm already gives, and which would go stale here).

Never a card for: a realm the person can read but doesn't work in; a realm of a
disposable class (§5); a realm that is gone (release it instead — `atita`, with
the reason).

## 5 · Disposable classes — one rule, not N cards

```
nks_add_phenomenon(realm=…, given_as="grundsatz", attrs={"key": true},
  name="⚖️ Realms matching <pattern> are disposable",
  description="<pattern> marks throwaway realms — benchmark runs, experiments.
    Never route a question there, never index them individually, retire on sight.",
  epistemic_mode="pramanita", ontic_mode="vartamana", volitive_mode="adhimoksha")
```

The rule outlives its population; forty cards don't. This is the single highest-
leverage node in a realm-heavy contour: it is what keeps §1 cheap.

## 6 · The map's own lifecycle — two kriyas

Every card and rule above is a phenomenon, and the graph's health rules expect
phenomena wired to the deeds that produce and consume them: a `ding` with only a
`context` arrow, or a `grundsatz` nothing applies, carries a standing orphan
tension — and a realm that greets every orient with red tensions trains its owner
to ignore the one signal this suite says never to suppress.

Two kriyas — the reconcile practice modelled where it acts — close everything
honestly:

- **🧭 Classification of an appeared realm** — actor: the 主 karta; `utpatti` →
  the realm cards (each card is born by this deed); `upadhi` → the routing and
  disposable-class rules it applies (which also clears `declarative_grundsatz`).
  Ontic `vartamana`: it runs on every reconcile.
- **🍂 Release of a gone realm** — `ahara` → the realm cards; kept parked,
  `anagata` + `upeksha`: the deferred end-of-life closure design P1 asks for.

Dated sachverhalts (§7) wire the same way — produced by classification, consumed
by release or by their own discharge kriya. No attrs, no suppression: this is
minding §2 as an instance living in the realm it maintains; the procedure itself
stays in the skill.

## 7 · Local setup — `ding` with a closed lifecycle

Machines, servers, deployments, checkouts: each a `ding` in the workplace
contour, each **born and consumed by a kriya** (provisioning / teardown) — an
unclosed lifecycle here is the usual sign that a machine was recorded as a note
instead of modelled.

Record only what does not survive a machine change and cannot be read from the
machine you are on: addresses, roles of hosts, where a thing is deployed and by
what path. Never credentials, never tokens, never anything you would not put in
a repository.

**Tool surfaces belong here too** — which harness runs where, which browser is
paired on which machine, which host has no GUI at all. What is available in *this*
session is derived and must not be written down; what is true of a machine you are
not sitting at is knowledge that exists nowhere else and is re-discovered
empirically, badly, on every move.

**Dated facts belong here too, as attrs.** A certificate expiry, a subscription
renewal, a review cycle: a `sachverhalt` with its timestamp in `attrs` (never in
the prose — **writing**, Decision 4), or a kriya when the duty repeats. For "needed,
but not yet": the park itself stays a conscious volitive act (`upeksha` —
**inquiry**), and `attrs.parked_until` / `attrs.wake_condition` bound the silence
in time — the staleness detectors then resume when the date arrives, instead of
never.

## 8 · Lessons from retired contours — the forgetting layer

When a realm is archived, everything in it becomes unread: nobody opens an
archived realm again. The one part with long value — what the contour *proved* —
has to be lifted out before the form is released (SKILL.md §2).

A lesson is a `grundsatz` (it now binds) or a `bildung` (it is still forming),
with `arose_from` to the realm card it came from, and `context` to the contour the
realm belonged to. When a whole contour retires, its holon stays with ontic
`atita` — a boundary that held once is not deleted; it stops being in force.

This is what separates a contour that learns from an index that forgets. Two
tests before writing one: could it change a decision in a *different* contour, and
would you have wanted it on the day the project started? If neither — release
without it, and say so.

## 9 · The person's own transformations — optional

If the person wants their cross-realm becoming mapped, it lives here as bianhua
and shows up in ACTIVE BIANHUA. **Owner accepts every name and telos** (assembly
skill) — and note the ceiling: a personal bianhua can only carry drivers that
live in *this* realm, because cross-realm arrows do not exist. Other realms are
named in prose.

Skip this half on the first pass. The index and the setup earn their keep
immediately; a second map does not, until the first one is being read.

## 10 · What never goes in

- the realm list, access levels, roles, org membership — derived, re-read live;
- which kartas the person holds — `nks_me(action="kartas")`;
- a stored cross-realm agenda — derived every time (SKILL.md §4);
- **a dossier on a person** — a description of what someone is *like*. The role,
  the binding and what is open with them are modelled (§2b); an assessment of the
  human is not a node;
- harness preferences and agent working style — those belong to the harness's own
  instruction surface, not to a realm about the person's holdings;
- anything that would be a second copy of a project realm's content.

## Re-verify checklist (for maintainers of this skill)

Re-check when the nks-mcp surface changes; each row is one call.

- [ ] `nks_me(action="whoami")` still prints the handle, and `action="kartas"` still
      returns cross-realm kartas addressed as `#seq · <realm-slug>`.
- [ ] `user="me"` still exists on `nks_add_karta` and `nks_update` (the binding is
      what §2 and SKILL.md §2.3 rest on).
- [ ] `nks_realm(action="list")`, `nks_org(action="list")` unchanged in shape.
- [ ] The realm address form `@owner/slug` still resolves, and an unknown address
      still fails with a legible `Realm not found` naming the address — SKILL.md §1
      reads that specific error as "not bootstrapped".
- [ ] The orient overview still prints `attrs.key=true` landmarks — §4 and §5
      depend on that channel; if it stops, the routing table needs another home.
