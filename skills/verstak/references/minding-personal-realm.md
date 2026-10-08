# The personal graph — the `@handle/mind` skeleton

The shape `methods/minding.md` fills at bootstrap (§3) and keeps true at reconcile (§2): **a set of nodes to build**, so that one `verstak_orient(realm="@handle/mind")` prints a routing answer with no lens and no follow-up. The overview prints **root holons**, **`attrs.key=true` landmarks** and **`ACTIVE BIANHUA`** — those three channels carry everything recall needs.

## 1 · The graph

`verstak_realm(action="create", slug="mind", name=…)` — named in the user's words, else their handle; renamed later with `verstak_realm(action="update", name=…)`. Owned by the user personally, never transferred to an organization (no team variant).

## 2 · The user's role

One **owner role** (`svatantra` 主) bound to the user:

```
verstak_add_karta(realm=…, name="👤 role name in the user's words",
  motivation=what drives them across all their areas — not a job title,
  manifested_as="svatantra", user="me",
  epistemic_mode="pratyakshita", ontic_mode="vartamana", volitive_mode="upeksha")
```

Created without asking (by the door, or by minding on `Realm not found`): name `👤 handle`, motivation "the user's memory across all their areas"; refined when the graph is filled. `user="me"` makes the user findable from outside. Give the role a `steward` arrow to each holon it is responsible for. **Don't** recreate the user's project-graph roles here — `verstak_me(action="kartas")` returns them; a copy drifts.

## 2b · The people in the user's life

Each person is **the role they play in your area**, with their own motivation (a name is not a role; `methods/writing.md`, Decision 2b):

- `manifested_as="agantuka"` 客 by default — they answer on their own time from beyond the user's boundary (relative, friend, client, counterparty, doctor). `svatantra` / `adhikarin` only for people acting in the user's own rhythm.
- `user=their sub` when on the platform (`verstak_admin(action="search_users")`) — that's how the graph knows it's the same person met in a project graph.
- What's open with them is a vimarsha `posed_to` their role: the relationship is carried by what passes between you.
- **Groups** — a group role, also `agantuka` (`👥 Family`, `👥 Studio clients`), with a shared motivation and a `group` arrow from each member. A group names a distinction the user makes, not a catalogue; groups nest, a role can sit in several, and a sub-role (a reviewer under a team lead) gets a `group` arrow to the senior role.
- **Search first** — `verstak_search(realm=…, q=name or role, node_type="karta")`.

A project's people live in its graph; here, those who cross areas or belong to none.

## 3 · Areas

An area is a **boundary**, not a folder: it answers the four holon questions — what question it frames, what's inside and outside, how fast it changes, who acts in it. A subject area of the user's life always answers them; here they sharpen the name, not decide whether to create it. The first fact from a missing area finds or creates its holon (a sub-holon via `contains` if it belongs to an existing one), and the fact goes under it, not the root.

Propose areas from the user's life, not from this list:

| Area | Inside | Rhythm |
|---|---|---|
| 🏢 work / client projects | that organization's graphs and repos | the organization's cadence |
| 🜂 own product | what the user owns and steers | daily |
| 🏠 personal | own projects without outside obligations | irregular |
| 💻 workstation | machines, checkouts, deployments, tool surfaces | when setup changes |
| 🧪 experiments | disposable, measurable, closed on the spot | per run |

**Workstation** pays off first: it is the only home for facts that otherwise die with one machine.

## 4 · Live graphs — one `ding` each, `attrs.key=true`

A graph has an address outside itself, so it is a `ding` (a thing you can point at):

```
verstak_add_phenomenon(realm=…, name="🗂 graph name", given_as="ding",
  description=WHAT it is for and when to route a question here,
  attrs={"key": true, "address": "@owner/slug", "state": "live|dormant"},
  arrows=[{arrow_type:"context", target:area, volitive_mode:…}],
  epistemic_mode="pratyakshita", ontic_mode="vartamana", volitive_mode="upeksha")
```

`key: true` puts the card in the overview, which *is* the routing table. The description is **routing-shaped** (which questions belong there, in the user's words), not a content summary. No card for a graph the user only reads, a disposable-class graph (§5), or a deleted one (release its card: `atita`, with the reason).

## 5 · Disposable classes — one rule, not N cards

```
verstak_add_phenomenon(realm=…, given_as="grundsatz", attrs={"key": true},
  name="⚖️ Graphs matching PATTERN are disposable",
  description="PATTERN marks throwaway graphs — benchmark runs, experiments.
    Never route a question there, never index them one by one, close them on the spot.",
  epistemic_mode="pramanita", ontic_mode="vartamana", volitive_mode="adhimoksha")
```

The rule outlives its population; in a graph-heavy area it is what keeps §1 cheap.

## 6 · The map's own lifecycle — two kriyas

A `ding` with only a `context` arrow, or a `grundsatz` nothing applies, carries a standing orphan tension, and constant red teaches the owner to ignore tensions. Two kriyas close it:

- **🧭 Classifying a newly appeared graph** — actor: the owner role; `utpatti` → the graph cards; `upadhi` → the routing and disposable-class rules (clears the `declarative_grundsatz` tension). Ontic `vartamana`: runs on every reconcile.
- **🍂 Releasing a departed graph** — `ahara` → the graph cards; `anagata` + `upeksha`: the deferred end-of-life closure.

Dated `sachverhalt` nodes (§7) are woven the same way. No muting attributes; the procedure stays in the method.

## 7 · The local setup — `ding` with a closed lifecycle

Machines, servers, deployments, checkouts: each a `ding` in the workstation area, produced and consumed by kriyas (provisioning / decommissioning); an open lifecycle means it was written as a note, not modelled. Machines here are the user's own; a server that exists for one project belongs to that project's graph.

Record only what doesn't survive a machine change and can't be read off the current machine: addresses, host roles, what is deployed where by what path. Never credentials or anything you wouldn't commit. Only the machine's own traits — a project's deploy onto it lives in that project's repository.

**Tool surfaces** too — which harness runs where, which browser is paired where, which host has no GUI; not this session's own, which is derivable.

**Dated facts as attributes**: an expiry, a renewal, a review cycle is a `sachverhalt` with its timestamp in `attrs` (`methods/writing.md`, Decision 4), or a kriya when it recurs. "Needed, but not now" is `upeksha` (`methods/inquiry.md`): woken by a change at its anchor, not a date.

## 8 · Lessons from finished areas — the forgetting layer

Nobody opens an archived graph; what the area *proved* is lifted out before its form is released (`methods/minding.md`, §2). A lesson is a `grundsatz` (a principle that now binds) or a `bildung` (a pattern taking shape), with `arose_from` to the graph's card and `context` to its area. A closed area's holon stays, ontic `atita`: the boundary stops being in effect, not deleted. Two tests: could it change a decision in *another* area; would you want it on day one of a project? Neither — release without it and say so.

## 9 · The user's own transformations — optional

How the user changes across graphs lives here as bianhua. **The owner accepts every name and telos** (`methods/assembly.md`). Drivers only from *this* graph (no arrows between graphs; others named in prose). Skip on the first pass.

## 10 · What never goes in

- the graph list, access, roles, organization membership; which roles the user holds — derivable;
- a stored cross-graph agenda (`methods/minding.md`, §4);
- **a dossier on a person** — the role, binding and open matters are modelled (§2b); a judgement of a person is not a node;
- preferences affecting how development runs or what it produces — AGENTS.md or the project graph;
- a copy of a project graph's content.

Nothing leaves here either (`methods/minding.md`, "Privacy").

## Re-verification checklist (for the method's maintainers)

One call per line, when the server surface changes:

- [ ] `verstak_me(action="whoami")` prints the handle; `action="kartas"` returns cross-graph roles as `#seq · realm-slug`.
- [ ] `user="me"` exists on `verstak_add_karta` and `verstak_update` (minding §2 step 3).
- [ ] `verstak_realm(action="list")` and `verstak_org(action="list")` keep their shape.
- [ ] `@owner/slug` resolves, and an unknown address fails with a readable `Realm not found` naming it.
- [ ] The orient overview still prints `attrs.key=true` landmarks (§4, §5); if not, the routing table needs another home.
