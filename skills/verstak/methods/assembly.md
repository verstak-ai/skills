# assembly — seeing the pattern and drawing the map

**Use when:** orient shows an ungrouped field — many free vimarshas, a wall of top-level kriyas; a transformation arrived or the map went stale; the work calls for stepping back to see the pattern (failure 5, the door's `The method fails in five ways`). The central ritual of the time cycle (時): seeing the pattern over the field of inquiry and activity and producing the assembly map. Phrases: "assemble the graph", "reassemble", "what is really going on here", "the agenda", "map the transformations".

A mature graph accumulates experience flat: the umbrellas that would organise it are visible only in hindsight. Your work is that hindsight: distinguish the **bianhua** (qualitative transformations the system is going through) and produce **the map, 形**, which the navigator acts from.

## The 時 cycle

The ritual (provocation → seeing → seed form → the visible map) produces a map that then stands and is relied on; light updates patch it between rituals, never rewrite it; it grows stale and is released. Reassembly is cheaper than the first assembly: the recipe (seed form, filters, lenses) and the basis (nodes and versions) are reproducible.

You produce and refresh the map; you don't decide *when* to reassemble.

## Roles

| Role | Motivation | In assembly |
|---|---|---|
| **The graph's owner** | "don't drown, see the whole" | provokes assembly, validates the map ("that captures it", "the map is lying"), decides when to reassemble |
| **Assembler** (you) | see the pattern, produce the map | draws the map; an owner-level move (step 4) goes on the owner's agenda |
| **Navigator** | "where to put effort now" | reads the map, picks a focus, works, feeds back |
| **Coordinator** | "keep people in sync" | uses the map as shared language: "who is moving which transformation?" |

## 形 has two halves

- **`anagata` — where we're heading.** Transformations, each with a `telos` ("what the system is becoming"), compress the *field of inquiry*: `anga` inward (vimarshas the *path*, kriyas the *arrival*), `anantara` between (order, critical path).
- **`vartamana` — what is going on.** Composite kriyas compress the *field of activity*: top-level kriyas folded under umbrellas that name what is really happening.

The fractal ends in a **vimarsha**. 变 is a visible break, 化 an imperceptible becoming-other: kriya-anga carry the breaks (practices switched on and off); vimarshas carry thinking and the gradual becoming (a kriya whose before/after changes in place keeps its part as a vimarsha on it). **A transformation is a difference in the fabric of actions**: one that resolved every vimarsha but changed no kriya was only thought through, and without kriya-anga its completion can't be falsified.

## Protocol

### 1. Orient over the whole field

```
verstak_orient(realm=<token>)                                  → overview: ACTIVE BIANHUA, vimarshas, top-level kriyas, tensions
verstak_orient(realm=<token>, lens="bianhua")                  → the forest (ready / blocked / done)
verstak_orient(realm=<token>, lens="vimarshas", focus=<holon>) → the field of inquiry, grouped
verstak_orient(realm=<token>, lens="tensions", verbose=true)   → structural health + questions for the owner
```

Read by content, not labels: scan → group → zoom → name over the `lens="vimarshas"` grouping; `verstak_search(anga_of=<seq>)` shows the kriyas and vimarshas already moving a bianhua.

### 2. Triage the field of inquiry

Every free vimarsha that calls (no transformation's `anga`) gets one fate: `anga` to the transformation its resolution moves, supersession, ending, or deliberately left free — per-vimarsha moves: `methods/inquiry.md`. Try the existing forest first; unsure which transformation it moves → ask the user, never guess or spawn one. A vimarsha that is a one-off task underneath gets none of these (`methods/inquiry.md`, "An assignment is not a vimarsha").

### 3. Population inspection of activity → composites

A wall of `top-level(scope)` kriyas is sediment: writing a kriya rarely asks "what does this belong to?", the most compressing axis.

- Find clusters by relay connectivity and semantic closeness (`verstak_semantic_search`).
- **Naming a composite is seeing a pattern** — for a person or a strong agent. The umbrella is a real kriya whose before/after absorbs its children's, with its own coarse link (`methods/writing.md`, Decision 5); no folders. Can't name it → the agenda: **a wrong parent is worse than none.**
- **Name the middle level, don't "split"** — a wall is undistinguished width, not a child count. By kind of fan: a phenomenon with many actions → an umbrella kriya, or the phenomenon's parts and kinds; a role with many actions → an umbrella kriya by the same actor, or a sub-role (`group` to the senior role) where refining the action changed the motivation; an anchor with many vimarshas → the transformation they move, or a too-coarse anchor (move the question to the exact node); a holon with many phenomena → a nested holon or a whole-phenomenon; a transformation with many parts → a sub-transformation. The surface prints this as a count of actions with no enclosing one — same call.
- Named → create the umbrella and re-parent the children via `contains` (or `parent_id` on `verstak_add_kriya`).

### 4. The agenda → to the user

Tensions whose move is to answer or end a question (e.g. unresolved risks) carry the owner's will: refusal, priority, choosing otherwise, accepting the unwanted. Gather them from the lens into the agenda for the graph's owner.

**Accepted items are a population signal.** The unwanted in `upeksha` says nothing singly; its *growth* shows "good enough" accruing faster than fixes. Bring number, rate and radius (actions through it), not a list. No accepted group in the lens → `verstak_search(q="", volitive_mode="upeksha", context_holon=<holon>)`, growth from creation dates. Items accepted by an agent rather than the owner are their own line.

**The mass question is the agenda's top line — and in silence, the only one.** Uniform tensions converging on one neighbour are one undistinguished thing: bring "what is not distinguished here?" with the remarks passers-by left (`methods/weaving.md`), in one message. Ask for **a decision, not reading** — three expected words get answered, a list gets put off; the answer clears the mass in canon, graph and writer at once. Not folded into one row by the lens → judge it yourself. With no outside call, bring only this (`methods/autonomous.md`, "Silence is a mandate to assemble").

### 5. Produce 形 — and arrive at understanding

**The transformation is the owner's interface** — vimarshas and cases are the agent's units. Its name and telos are about the only thing the user must accept in the graph, and it is created only after that nod: interactively, propose both in your answer; autonomously, in a vimarsha `posed_to` the owner role (the agenda). Never one for a single vimarsha: `lens="bianhua"` + `verstak_semantic_search(node_type="bianhua", q=<the shift>)` → attach as `anga`; no confident match → ask in plain text, naming the transformations you see and why none fits.

Then build the map:
- **Create** (once accepted) **or refresh** each transformation the field reveals: `verstak_add_bianhua(name, telos, anga=<driving vimarshas>, anantara_after=<prerequisites>)`; `telos` = "the system becomes …". No anga-vimarsha → empty (the factory warns): attach drivers or don't create it.
- **Run integrity** on each freshly accepted transformation (`methods/integrity.md`).
- **Order** with `anantara` (B only after A) — the critical path.
- **Record the emerging pattern**: a phenomenon with `given_as=bildung`, `arose_from` its source. No `bildung` ⇒ the assembly didn't land (`methods/inquiry.md`, §6).

### 6. Impulse for the navigator

The bianhua not blocked by `anantara` (`lens="bianhua"` sorts ready / blocked / done) *is* the impulse.

Read progress truthfully: parts accepted as is are unanswered — a transformation of only those stands still. `upeksha` on the transformation itself is a kind error — release it or restore its will. "It has arrived" is a behavioural claim: check it on the canonical carrier before proposing to end it (`methods/reality-audit.md`), not by the map agreeing with itself. Next moment: the user accepted a telos → `methods/integrity.md`.
