# The personal graph — the mind skeleton

The shape `methods/minding.md` fills at bootstrap (§3) and keeps true at reconcile (§2): **a set of nodes to build**, so that one `verstak_orient(realm="mind")` prints a routing answer with no lens and no follow-up. The overview prints **root holons**, **`attrs.key=true` landmarks** and **`ACTIVE BIANHUA`** — those three channels carry everything recall needs. Enter through minding's `Personal memory before reading or writing` before any read here.

## 1 · The graph

The address is always `mind`, used only once the `personal_mind` sign shows this account's own graph present: without one of its own, a bare `mind` can resolve to another's. Whether the graph exists — the `personal_mind` sign of `verstak_me(action="readiness")`; MCP renders signs as text: use the printed key, state and `lacks`, not an assumed JSON envelope. `unknown` with reason `realm_unreadable` and no artifact is no absence. A missing graph is established only when `state=missing` and `lacks` includes `mind_realm`; missing roles alone mean the graph exists.

Only that established absence permits `verstak_realm(action="create", slug="mind", name="Personal memory")`, from the personal identity, with no organization owner. Prefer the user's chosen name when available; no handle is required. The platform provisions the user-bound owner role. A successful identity read alone proves neither graph creation nor settlement. On a conflict (409), timeout or uncertain outcome, reread readiness before retrying; a repeat create is not an idempotent ensure, and a name conflict need not mean mind exists. If still absent, resolve the naming conflict before a new create; a permissions refusal stays a refusal. After success reread readiness. Owned by the user personally, never transferred to an organization (no team variant).

## 2 · The user's role

One **owner role** (`svatantra` 主) bound to the user:

```
verstak_add_karta(realm=…, name="👤 role name in the user's words",
  motivation=what drives them across all their areas — not a job title,
  manifested_as="svatantra", user="me",
  epistemic_mode="pratyakshita", ontic_mode="vartamana", volitive_mode="upeksha")
```

Created without asking, only after an established gap and a successful search: name `👤 Memory owner`, motivation "the user's memory across all their areas"; refined when the graph is filled. First reuse the platform-provisioned role through `verstak_me(action="kartas")` and `verstak_search(realm="mind", q="", node_type="karta")`. `user="me"` binds identity without a handle. A fitting role keeps its name and authorship.

An existing mind can lack its user's role after the platform's once-per-account settlement. Repeating `whoami` does not restore it then: establish the missing binding through the successful reads above and explicitly create the role with this section's `verstak_add_karta` call and `user="me"`. Reread roles and readiness; the next pass reuses the role found. An uncertain create outcome requires reading before another write. A missing role never means recreating the graph.

The **assistant's role**, when the companion runtime needs one, is unbound to a user: `manifested_as="adhikarin"`, `attrs={"persona":"companion"}`, named `🤖 Assistant`, motivation "remembers and recalls what is the person's own across their areas". This attribute distinguishes the operational companion role for assistant receive/loop; it is neither evidence nor a prerequisite of onboarding. Personal mind and the current person's bound role suffice for the structural sign. For runtime provisioning only, search first with `verstak_search(realm="mind", q="", node_type="karta", attrs_filter="persona:companion")` and read the matching role; reuse one that fits, never create a second. If absent, create through `verstak_add_karta` with those fields, no `user`, and modes `pratyakshita`, `vartamana`, `upeksha`. An unknown write outcome requires rereading before retry. Reread readiness after provisioning; report the actual outcome, not success inferred from a create receipt. Give the user's role a `steward` arrow to each holon it is responsible for. **Don't** recreate the user's project-graph roles here — `verstak_me(action="kartas")` returns them; a copy drifts.

**Legacy cleanup is by provenance.** Old minding text wrote a `key:true` redirect landmark carrying a mind address; old onboarding and this reference wrote the companion role attribute, which the runtime still consumes. Only a record demonstrated by its creation history to be a locator or progress marker is a cleanup candidate. Stop its writer and reader first, inspect the exact record and its other content, then remove only the proven service field with a versioned merge patch (`null` for that key), preserving all other fields. A pure redirect node may be removed only after its provenance and lack of authored content or consumers are established. Do not delete by a key's spelling, sweep user graphs or strip operational `persona` attributes. Uncertain provenance means no deletion; report the unresolved record privately. Receipts live in the platform's readiness API outside attrs; they are not copied into profile or graph properties.

## 2b · The people in the user's life

Each person is **the role they play in your area**, with their own motivation (a name is not a role; `methods/writing.md`, Decision 2b):

- `manifested_as="agantuka"` 客 by default — they answer on their own time from beyond the user's boundary (relative, friend, client, counterparty, doctor). `svatantra` only for a person who works in this graph themselves (`methods/writing.md`, Decision 2b); `adhikarin` is an agent's kind, never a person's.
- `user=their sub` when on the platform (the `sub` `verstak_admin(action="list_members")` prints) — that's how the graph knows it's the same person met in a project graph.
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
  attrs={"key": true, "address": "full address from the listing", "state": "live|dormant"},
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
  epistemic_mode="anumita", ontic_mode="vartamana", volitive_mode="chanda")   # adhimoksha once the user confirms
```

The rule outlives its population; in a graph-heavy area it is what keeps §1 cheap.

## 6 · The map's own lifecycle — two kriyas

A `ding` with only a `context` arrow, or a `grundsatz` nothing applies, carries a standing orphan tension, and constant red teaches the owner to ignore tensions. Two kriyas close it:

- **🧭 Classifying a newly appeared graph** — actor: the owner role; `utpatti` → the graph cards; `upadhi` → the routing and disposable-class rules (clears the `declarative_grundsatz` tension). Ontic `vartamana`: runs on every reconcile.
- **🍂 Releasing a departed graph** — `ahara` → the graph cards; `anagata`, with the will as it actually stands: a planned end, not a placeholder that closes the cycle.

Dated `sachverhalt` nodes (§7) are woven the same way. No muting attributes; the procedure stays in the method.

## 7 · The local setup — `ding` with a closed lifecycle

Machines, servers, deployments, checkouts: each a `ding` in the workstation area, produced and consumed by kriyas (provisioning / decommissioning); an open lifecycle means it was written as a note, not modelled. Machines here are the user's own; a server that exists for one project belongs to that project's graph.

Record only what doesn't survive a machine change and can't be read off the current machine: addresses, host roles, what is deployed where by what path. Never credentials or anything you wouldn't commit. Only the machine's own traits — a project's deploy onto it lives in that project's repository.

**Tool surfaces** too — which harness runs where, which browser is paired where, which host has no GUI; not this session's own, which is derivable.

**Dated facts as attributes**: an expiry, a renewal, a review cycle is a `sachverhalt` with its timestamp in `attrs` (`methods/writing.md`, Decision 4), or a kriya when it recurs. "Needed, but not now" is `upeksha` (`methods/inquiry.md`): woken by a change at its anchor, not a date.

## 7b · Working preferences — the agents slice

A standing preference of the user's own goes under its area's holon with its present meaning, conditions and ground, after a search for the earlier card. One about how agents work with the user (how to report, ask, plan; what to bring and what not) carries `attrs` `{"slice":"agents"}`: a root session reads that slice at its start, and an unlabelled preference never reaches the agent. A one-off request is not a standing preference.

## 8 · Lessons — from a piece of work, and the forgetting layer

A lesson's kind follows what the yield is: a method of the user's own → `vollzug`; an observed case → `sachverhalt`; a pattern taking shape → `bildung`; a binding principle (`grundsatz`) only by the user's act, never on your inference. A refinement goes into the node it sharpens, and no new lesson is owed: a substantial piece of work may yield nothing (`methods/minding.md`, §1b). A lesson keeps the conditions it held under; one success there is one observation, not a method proven in general.

A finished area is the other occasion. Nobody opens an archived graph; what the area *proved* is lifted out before its form is released (`methods/minding.md`, §2), with `arose_from` to the graph's card and `context` to its area. A closed area's holon stays, ontic `atita`: the boundary stops being in effect, not deleted. Two tests: could it change a decision in *another* area; would you want it on day one of a project? Neither — release without it and say so.

## 9 · The user's own transformations — optional

How the user changes across graphs lives here as bianhua. **The owner accepts every name and telos** (`methods/assembly.md`). Drivers only from *this* graph (no arrows between graphs; others named in prose). Skip on the first pass.

## 10 · What never goes in

- the graph list, access, roles, organization membership; which roles the user holds — derivable;
- a stored cross-graph agenda (`methods/minding.md`, §4);
- **a dossier on a person** — the role, binding and open matters are modelled (§2b); a judgement of a person is not a node;
- a project's rules and process — AGENTS.md or the project graph, set by whoever holds them (the user's own working preference, a development one too, is theirs and does go in);
- a copy of a project graph's content.

Nothing leaves here either (`methods/minding.md`, "Privacy").
