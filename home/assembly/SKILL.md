---
name: assembly
description: "Assemble the graph: see the pattern over the field of inquiry and activity, name the transformations (bianhua) the system goes through and draw their map; check a transformation's telos. Triggers: 'assemble the graph', 'reassemble', 'what is really going on here', 'agenda', 'big picture', 'I'm drowning', 'is this transformation reached?', 'close the transformation'; many free vimarshas, a wall of top-level kriyas. Needs the verstak_* tools."
---

# assembly — seeing the pattern and drawing the map

**Use when:** orient shows an ungrouped field — many free vimarshas, a wall of top-level kriyas; a transformation arrived or the map went stale; the work calls for stepping back to see the pattern (failure 5, `verstak`'s `The method fails in five ways`). The central ritual of the time cycle (時): seeing the pattern over the field of inquiry and activity and producing the assembly map. Phrases: "assemble the graph", "reassemble", "what is really going on here", "the agenda", "map the transformations".

A mature graph accumulates experience flat: the umbrellas that would organise it are visible only in hindsight. Your work is that hindsight: distinguish the **bianhua** (qualitative transformations the system is going through) and produce **the map, 形**, which the navigator — whoever decides where to put effort now — acts from.

## The 時 cycle

The ritual (provocation → seeing → seed form → the visible map) produces a map that then stands and is relied on; light updates patch it between rituals, never rewrite it; it grows stale and is released. Reassembly is cheaper than the first assembly: the recipe (seed form, filters, lenses) and the basis (nodes and versions) are reproducible.

You produce and refresh the map; you don't decide *when* to reassemble. **The graph's owner** provokes assembly, validates the map ("that captures it", "the map is lying") and decides when to reassemble; an owner-level move (step 4) goes on their agenda.

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

Every free vimarsha that calls (no transformation's `anga`) gets one fate: `anga` to the transformation its resolution moves, supersession, ending, or deliberately left free — per-vimarsha moves: **inquiry**. Try the existing forest first; unsure which transformation it moves → ask the user, never guess or spawn one. A vimarsha that is a one-off task underneath gets none of these (**inquiry**, "An assignment is not a vimarsha").

### 3. Population inspection of activity → composites

A wall of `top-level(scope)` kriyas is sediment: writing a kriya rarely asks "what does this belong to?", the most compressing axis.

- Find clusters by relay connectivity and semantic closeness (`verstak_semantic_search`).
- **Naming a composite is seeing a pattern** — for a person or a strong agent. The umbrella is a real kriya whose before/after absorbs its children's, with its own coarse link (**writing**, Decision 5); no folders. Can't name it → the agenda: **a wrong parent is worse than none.**
- **Name the middle level, don't "split"** — a wall is undistinguished width, not a child count. By kind of fan: a phenomenon with many actions → an umbrella kriya, or the phenomenon's parts and kinds; a role with many actions → an umbrella kriya by the same actor, or a sub-role (`group` to the senior role) where refining the action changed the motivation; an anchor with many vimarshas → the transformation they move, or a too-coarse anchor (move the question to the exact node); a holon with many phenomena → a nested holon or a whole-phenomenon; a transformation with many parts → a sub-transformation. The surface prints this as a count of actions with no enclosing one — same call.
- Named → create the umbrella and re-parent the children via `contains` (or `parent_id` on `verstak_add_kriya`).

### 4. The agenda → to the user

Tensions whose move is to answer or end a question (e.g. unresolved risks) carry the owner's will: refusal, priority, choosing otherwise, accepting the unwanted. Gather them from the lens into the agenda for the graph's owner.

**Accepted items are a population signal.** The unwanted in `upeksha` says nothing singly; its *growth* shows "good enough" accruing faster than fixes. Bring number, rate and radius (actions through it), not a list. No accepted group in the lens → `verstak_search(q="", volitive_mode="upeksha", context_holon=<holon>)`, growth from creation dates. Items accepted by an agent rather than the owner are their own line.

**The mass question is the agenda's top line — and in silence, the only one.** Uniform tensions converging on one neighbour are one undistinguished thing: bring "what is not distinguished here?" with the remarks passers-by left (**weaving**), in one message. Ask for **a decision, not reading** — three expected words get answered, a list gets put off; the answer clears the mass in canon, graph and writer at once. Not folded into one row by the lens → judge it yourself. With no outside call, bring only this (**autonomous**, "Silence is a mandate to assemble").

### 5. Produce 形 — and arrive at understanding

**The transformation is the owner's interface** — vimarshas and cases are the agent's units. Its name and telos are about the only thing the owner must accept in the graph. You may create it yourself as your assumption (its modes and the owner's acceptance: **writing**, Decision 1, the bianhua paragraph). Propose name and telos: in conversation only while the user answers now; otherwise a card to the owner in the case (**collaborate**, `Asking the user`), the transformation itself carrying the agenda. Never one for a single vimarsha: `lens="bianhua"` + `verstak_semantic_search(node_type="bianhua", q=<the shift>)` → attach as `anga`; no confident match → ask the user (in text only if they answer now, else a card in the case: **collaborate**, `Asking the user`), naming the transformations you see and why none fits.

Then build the map:
- **Create** (as a proposal, above) **or refresh** each transformation the field reveals: `verstak_add_bianhua(name, telos, anga=<driving vimarshas>, anantara_after=<prerequisites>)`; `telos` = "the system becomes …". No anga-vimarsha → empty (the factory warns): attach drivers or don't create it.
- **Run integrity** on each freshly accepted transformation (**integrity**).
- **Order** with `anantara` (B only after A) — the critical path.
- **Record an emerging pattern** you actually told apart: a phenomenon with `given_as=bildung`, `arose_from` its source. An accurately kept whole or an open question is a legitimate result too (**inquiry**, §6).

### 6. Impulse for the navigator

The navigator — whoever reads the map to pick where to put effort now — takes the bianhua not blocked by `anantara` (`lens="bianhua"` sorts ready / blocked / done): that *is* the impulse.

Read progress truthfully: parts accepted as is are unanswered — a transformation of only those stands still. `upeksha` on the transformation itself is a kind error — release it or restore its will. "It has arrived" is a behavioural claim: check it on the canonical carrier before proposing to end it (**reality-audit**), not by the map agreeing with itself. Next moment: the user accepted a telos → **integrity**; a transformation may have reached its telos → `Telos check and re-assembly`.

## Telos check and re-assembly

Ordinary leading and integration bring you here, not the user's word (`verstak`, `Agent moments`). Parts keep arriving after the promised quality is already there, so a tally of unfinished parts never says whether a transformation is done. **Judge the telos, not the count.**

**Two scales of one move:**
- **Light telos check** — one transformation, after a substantial result lands on it, after its child transitions (sub-transformations, carrier kriyas) are accepted, or after its intent changed: `verstak_orient(realm, lens="bianhua", focus=<bianhua>)`.
- **Bounded field review** — the field of transformations overloads: batches of 3–5 related transformations, each batch brought to its outcomes before the next.

### 1. Restore the promise and today's grounds

Say in one line what quality the telos promised, and what stands today on what ground (`verstak`, `Say what a claim stands on`). Sort every open part: a **substantial gap** in that quality; **maintenance** that keeps it up (continues as active kriyas); a **defect** (its own vimarsha's fate, **inquiry**); a **new wish** (not this telos). Only a substantial gap keeps the transformation going. The number of parts, its age and an "unfinished" warning call you to look; they don't decide the outcome. Reached is a behavioural claim (Protocol, step 6). **Sign:** you can name the promised quality, its present ground and each open part's class.

### 2. Facts to the steward, the decision to the owner

A missing fact about a holon's state goes to its steward (**architect**, step 2). Need, acceptance of the quality and limits are the owner's: an `ask` card in the transformation's case (none → open one on it, `verstak`, `One-off task`), form `choice`, each option's cost in its `context`, a recommendation with its ground (**collaborate**, `Asking the user`). The options:

| Outcome | The graph after `ack` |
|---|---|
| reached | the transformation `atita`, then 4–5 below |
| absorbed by a named successor | live parts move by `anga` to the successor; this one `visarjana`, the successor named in `reasoning` — `supersedes` joins only vimarshas |
| no longer needed | `visarjana`, the owner's reason in `reasoning` |
| continues to an end sign | stays under way; the end sign is the answer condition of a driving vimarsha |
| deferred with a return condition | modes unchanged (not `upeksha`, above); the condition in its seed (**writing**, Decision 5) |

The answer counts once you `ack` it and the graph changes (`verstak`, `Waiting on an answer`); unanswered, the transformation stays as it was. Narrowing the telos until "reached" fits is a rename only the owner makes (**writing**, Decision 4); a risk is never accepted on their behalf (**inquiry**, §5).

### 3. Volume to a bounded reader

Reading parts and seeds in bulk, then weaving the decision into them, goes to a subagent on its own satellite bridge and case (`verstak`, `Work goes to subagents`); you hold the decision and the acceptance, and take back short fates, versions and grounds — not bodies.

**Type and genre before a body.** Before reading an unfamiliar number, establish its type and genre from a list without bodies — `verstak_search(realm, q="", anga_of=<bianhua>, include_description=false)`; an unknown type is no licence to read. A `hint` goes to the reading subagent. Compose single and batch reads from metadata you already hold, never from numbers in someone's report: every number's type and genre checked before the batch runs. A title such as "contract", "spec" or "door" doesn't tell the genre; the guard written in a brief doesn't show it was kept.

**Seeds.** A served seed is released with its historical links kept (**inquiry**, §3, `hint`); a fragment is not saved as a new vimarsha each. A substantial remainder is kept after a duplicate search (**writing**); an idea explicitly deferred is not a served seed to throw away.

### 4. Weave — not optional

The decision is a work event: landed, moved, released (**weaving**, `Ways into weaving`), plus:
- **The whole sample**, paged by `offset` until a short page — not the first screen.
- **Each remainder's fate by meaning** (**inquiry**, §2). A question that stays open leaves the finished transformation's `anga`, keeping its subject (`vimarsha_of`) and addressee (`posed_to`).
- **Neighbours' false expectations removed** — nodes and seeds still waiting on what is now settled; **dependencies checked** — each transformation waiting on this one by `anantara`: free to start now, or re-pointed when this one was released.
- **Reached becomes the meaning of its kriyas:** their descriptions and their `anga` with `sense` show which quality became active, why they arose and which transformation they served — not merely work off the agenda. Active kriyas continue; reaching fixes no defect and raises no carrier's mode — each moves on its own evidence (**weaving**, `Carrier transitions are acts, not tensions`).
- **Three acts, kept apart:** witnessing reached (`atita`), releasing the will (`visarjana`), closing the case. "Close" stands in for none.
- **Remainders spawn no transformation by themselves** (Protocol, step 5).

### 5. Re-read against the owner's decision

Read back states, links and semantic edits — yours and the subagent's — against the acked answer: the reached quality reads as the meaning of the kriyas that carry it, not only as the parent's terminal mode. Graph acceptance doesn't replace observing the system's behaviour (**reality-audit**). Then end your share in the case (`verstak`, `Case laws`); another notification is not the next substantive move.

**Counter-cases:** a substantial promised quality unconfirmed → don't propose "reached" for tidiness; a large coherent transformation is not split for the count (Protocol, step 3, "name the middle level"); an unanswered card decides nothing; a standalone risk isn't fixed by closing its parent.
