# integrity — the wavefront: what a change or a transformation touches

**Use when:** a change touches more than one thing or an integration surface — out of failure 5 (the door, `The method fails in five ways`). By mode: a task integrates something ("integrate X with Y", "integration spec") — Mode 0; a material change is about to start, or a diff is under cold review ("integration scope", "cold review") — Mode 1; a telos was just accepted (`methods/assembly.md`, `methods/design.md`), or "what will this touch", "who does this affect", "impact analysis" — the Protocol; a prose artifact claims to be backed by the graph ("is this backed by the graph", "is this just theatre", "claim audit") — Mode 3.

A `bianhua` — a qualitative transformation — crosses `holon`s (boundaries) by definition. Its map shows what *drives* it (`anga`), not what it will *touch*. This method makes that wavefront visible: every implicated part of the graph gets an explicit "is this affected? design the adaptation", so the transformation can't be accomplished with its impact unexamined.

The law of the wave: every changed node has sources (the requirements on it) and consumers (the wave from it). An edit is an event on the relay, **not finished until its wave is examined** — each touched node established as unaffected or given an integration question — even when the node itself is fixed. Before an edit, look at the trace: who feeds this node, whom it feeds. Where the surface shows the wave at the edit (a trace, the `CHECKS:` block of a write), read it there; a heavy ritual in its place turns into theatre.

## Mode 0 — integration spec: the graph first

An integration hands something across a boundary while closing a lifecycle: born in one holon, consumed in another. So it starts with a specification taken from the graph — and **the specification is a graph cluster, not a document**.

1. **Scout the lifecycles.** `verstak_orient(lens="trace")` on the thing handed over, from each side: where it is born, who must consume it, where the relay breaks. Then the wavefront (Protocol below).
2. **Write in what is missing.** Phenomena and kriyas that don't exist yet go in with the design triad (`methods/writing.md`, Decision 3). The phenomenon handed across is the heart of the spec: its birth and consumption *are* the integration.
3. **Ask and weave as you go.** Questions to the neighbour go into the integration case (below). Implied links → `methods/weaving.md`. Decisions and changed situations go into the graph at once (→ door, `Cross-cutting norms`).
4. **Then the work, by the spec.** On the watch (`methods/autonomous.md`) its marked intent (§2c) is this spec. Refine it as you go; never drift from it unrecorded.
5. **Validate.** Delivery in CI; reconcile the marked intent with what shipped; report what was specified, done, and diverged. Then **another pair of eyes**: the steward of the adjacent surface (the `steward` arrows of the touched holons) accepts the interface, spec and report — not the code — by a card in the integration case.

Plan in the graph, act, reflect, kept moving by communication. Under-specifying costs more than over: an extra node is cheap, an unwritten requirement costs rounds on both sides of the boundary.

### The integration case

A vimarsha `posed_to` the neighbour's steward wakes no one: a role's queue is read with `verstak_orient(focus=<role>)` on entry and on cause. An integration that needs the other side now therefore runs as a case on the thing handed across; a vimarsha keeps only the substance a later reader needs. Talk, cards and `ack`: `methods/collaborate.md`, `Exchange` and `Asking the user`; leading and closing: `methods/architect.md`, `Leading a case`.

- **Opened** by the side starting the integration, **on the phenomenon handed across**: `open_room` on its write — its creation in step 2, or a `verstak_update` when it exists. First `verstak_case(action="at", node=<phenomenon>)`: a case already open there → join it, never a second. Your work already runs in a case → `parent_room`.
- **Called:** the steward role of each touched holon — `verstak_orient(focus=<holon>)` names it — your own side's too when it isn't your role. Someone stands for the role on the board → `invite` with `standing`; nobody → `verstak_case(action="invite", karta=<steward role>, holon=<their holon>)`, which waits until someone stands for it.
- **Cards**, an `ask` to the steward role, one subject each: the joint — the handed phenomenon's shape, who produces and who consumes it, by when — as `choice` with your recommendation; the neighbour's acceptance of spec, interface and report (step 5) as `yes_no`. `ack` the answer and write what it settled into the graph in the same move: the phenomenon, the consuming kriya and its modes, the vimarsha answered. Work handed across the line runs as the door's `One-off task`.
- **Closed** when both sides have integrated — each side's line on its key with the observed outcome — and the report of specified, done and diverged stands in the case; the remainder is in the graph (open vimarshas `posed_to` the role that answers, unshipped kriyas `anagata`), never only in the journal. Then the lead's `propose_close`.

## Mode 1 — integration scope of a change: before code and in cold review

**This mode only reads**; the Protocol writes and is not part of it — a cold reviewer never goes there.

No hand-written list of "shared surfaces" is needed: the repository's standing anchors — **its focus holon and steward role** — plus the nodes whose embodiment changes are enough. Everything else is derived afresh; a prose list goes stale and stands in for the traversal.

### 1. Name the input

- **Before code:** the work's case and its opening (or the leading vimarsha), plus the kriyas, phenomena or rules the change embodies. Behaviour not in the graph → `methods/design.md` first: a scope can't be derived from a retelling of intent.
- **In review:** the whole branch's diff against trunk, plus references to **every** graph node whose embodiment it changes. The diff doesn't replace the graph's connectivity; the author's retelling is not a reference.
- **Always:** the focus holon and its steward from `AGENTS.md` — the boundary, and the first address for whatever leads outward.

### 2. Derive the closure

Per node, the semantic closure of Protocol §2. Crossing a boundary continues the walk in the neighbouring holon and leads to its steward role. Then read the vimarshas that call on the touched nodes and holons.

The trace doesn't reach a consumer the code or task implies → a model defect, not a report line: `design` fills in kriyas and phenomena, `weaving` stitches edges. A new consumer appears in code and graph in the same move, the link in the edge, its reason in `sense`.

### 3. Classify the state of integration

Per touched lifecycle or neighbouring holon, one status:

- `ready` — the path is connected, no required vimarsha calls, the neighbour's named evidence is available;
- `question` — a vimarsha seeking an answer holds the decision;
- `wake` — a neighbouring holon's steward must answer or act;
- `graph-gap` — connectivity breaks, or the behaviour lives only in prose or code;
- `unknown` — not enough evidence; never raise to `ready` by inference from source code.

`ready` is only the evidence available here; behavioural readiness is accepted by `methods/reality-audit.md` on the carrier.

### 4. Two ways to run the same pass

- **The main agent** acts on the report: `graph-gap` → design/weaving; `question` → `methods/inquiry.md`; `wake` → a move in the integration case on the phenomenon crossing to that neighbour (Mode 0, `The integration case`; none open → open it): a card to its steward role, or a `say` `to` its seat already there. Then run the scope again.
- **A cold reviewer** is read-only: fixes nothing, writes nothing to the graph. Besides findings on the diff it returns an integration report — touched holons and steward roles, relays traversed and broken, vimarshas that call, neighbours' statuses, whom to wake and on which phenomenon its case belongs. Insufficient references or a broken trace → `NEEDS_CONTEXT`, not a stylistic approval.

The output is the decision for the current move and, where structure is incomplete, new nodes, edges and vimarshas — not a dependency document.

## Protocol

### 1. Stand on the transformation

`verstak_orient(lens="bianhua", focus=<seq>)` → telos, `anga` drivers, computed scope. **Seed set** = the anchors (`vimarsha_of` targets) of the existing `anga` vimarshas + the nodes the telos names.

### 2. Propagate the front — semantic closure, not radius

From each seed, the closure that carries its responsibility — never N hops from everything:

| Seed type | Closure | How |
|---|---|---|
| phenomenon | its relay, both directions | `verstak_orient(lens="trace", focus=<seq>)` |
| kriya | its `next` thread + its `ahara`/`utpatti`/`upadhi` phenomena | `verstak_orient(lens="topology", focus=<seq>, arrow_types="next")`, then trace the phenomena |
| holon | the `contains` subtree | `verstak_orient(focus=<holon>)` |
| `vollzug` / `grundsatz` | its `upadhi` consumers — who applies the method or principle | `verstak_orient(focus=<seq>)` |

Plus one **semantic pass**: `verstak_semantic_search(q=<the telos as a phrase>)` — nodes the structure misses. Collect pairs `(node, why it is implicated)`; the why goes into the vimarsha's description.

### 3. Subtract what is already covered (idempotence)

Drop anchors of this transformation's existing `anga` vimarshas and nodes already under an earlier "is … affected?" `samshaya` of it (`verstak_search(q="", anga_of=<bianhua>)`, then read the anchors). A re-run adds only the **new** front.

### 4. Cluster and present — the owner accepts

Group by *shared adaptation* — relay, holon, kriya family. One `samshaya` (doubt) per cluster; a node gets its own only when its adaptation is clearly distinct. Extra anchors via `verstak_arrow(action="link", arrow_type="vimarsha_of")`.

**Present the candidate list to the user first**, as text with each why. The front is a hypothesis until the owner agrees.

### 5. Pose the integrity questions

For each approved cluster:

```
verstak_add_vimarsha(genre="samshaya",
  name="<emoji> Is <X> affected by the transformation \"<bianhua>\"?",
  vimarsha_of=<first anchor>, posed_by=<short address: role, standing or name>,   # not prose; the why goes in reasoning
  epistemic_mode="anumita", ontic_mode="vartamana", volitive_mode="chanda")
→ extra anchors: verstak_arrow(action="link", arrow_type="vimarsha_of", ...)
→ verstak_arrow(action="link", arrow_type="anga", source=<new>, target=<bianhua>,
   sense="integrity front: the transformation cannot be accomplished until this is answered")
→ optional: verstak_arrow(action="link", arrow_type="posed_to", source=<new>, target=<steward role>,
   sense="addressed to the steward of the affected holon")
```

`posed_to` goes to the role stewarding the affected holon — `svatantra` or `adhikarin`, never `pratibimba`; it waits for that role's next orientation, so an answer needed now goes to the integration case (Mode 0). The description says what the telos means for these nodes and **what counts as an answer**: "not affected" (release with `visarjana`, reason recorded) or "affected" (design the adaptation by `methods/design.md`; the new work `arose_from` this question).

### 6. Report

`verstak_orient(lens="bianhua", focus=<seq>)` — the drivers now include the front. Tell the user what was attached and what was deliberately left out. Next moment: a node answers "affected" → `methods/design.md`; the edit ships → `methods/reality-audit.md`.

## Mode 3 — claim audit: does the graph carry what is claimed

The mirror of the forward pass: **does the graph carry what the prose claims?** Run it whenever an artifact — a rendered roadmap, a report, a summary, a telos citing capabilities — claims to rest on the graph. Node-level detectors can't catch this: every node is legal; the falsehood lives between text and structure.

1. **Extract the claims** that assert structure: ownership (a role drives X), figure on ground (a direction continues a capability), flow (A produces what B consumes), risk coverage ("mitigated by …"), anchoring ("tracked in the graph").
2. **Check each read-only.** Ownership → real `actor`/`steward` edges to the named actions (`verstak_look`; a role with zero edges is theatre). Continuation → a driving kriya reaches the capability via `upadhi`/`context` (`lens="topology"`). Flow → the relay exists (`lens="trace"`). Coverage → `addressed_by`, or deliberately accepted (`upeksha`). Anchoring → `vimarsha_of` into the claimed holon.
3. **Report claimed-but-unwired, pair by pair.** Each gets one fate, chosen with the owner: **wire it** (true but unrecorded — edges to weaving) or **weaken the prose** (theatre). Never leave prose overstating the graph; never wire edges only to make prose true.

The audit writes nothing; it produces a claims table — each claim carried or not carried by the graph (a first-level check, not a reality-audit verdict) — and the owner chooses each fate.

## Noise discipline

- One `samshaya` per cluster, with the justification in every description. A question whose reader can't name the next move is noise.
- Idempotent re-runs (Protocol step 3).
- **Never a new transformation out of this pass.** Something that looks like *another* transformation is an assembly observation: take it to the user.
