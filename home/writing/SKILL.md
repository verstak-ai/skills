---
name: writing
description: "Write a node into the graph — phenomenon, kriya, vimarsha, holon, role, transformation: search first, then the type, given_as, modes and arrows. Use always before verstak_add_*, a verstak_batch that creates nodes, or a verstak_update that rewrites a body, and when the node type or modes are unclear. Triggers: 'record this', 'write this down', 'add a node', 'create a kriya', 'put it in the graph'. Needs the verstak_* tools."
---

# writing — how a node is written into the graph

**Use when:** you are about to write a node (search first); a decision, a question of substance, a transition or knowledge surfaced in a case or chat; always before any `verstak_add_*`, a `verstak_batch` that creates nodes, or a `verstak_update` that rewrites or extends a body; the node type, `given_as` or modes are unclear. A single write counts. Phrases: "record this", "write this down", "add a node", "create a kriya", "put it in the graph". Out of failures 1 and 3 (`verstak`, `The method fails in five ways`). Paths from goals: `design` (**design**); repairing existing structure: `weaving` (**weaving**).

Future agents navigate by what you write. Five decisions, in order.

## Before anything else

**The graph.** Every call takes `realm=`; confirm it first. **No cross-graph arrows**: `source` and `target` resolve inside the current graph. Name another graph in the body text.

**Novelty gate.** Before each create, answer three questions: (1) who will read this — a later role, a session, a class of request; (2) which decision, answer, check or handoff that reading changes; (3) what is new compared with the repository, the relay and the graph. No answers, no write. Get the third **by searching, not from memory**: `verstak_search` with words, `verstak_semantic_search` with the thought; open candidates with `verstak_look`. The same thing exists → edit or link it; don't create a second.

- **Transcription** — what artifacts already encode (requirements, logs, the code's algorithm, repository state). Skip it; point to the source.
- **Structure** — composition, blast radius, ownership boundaries, correspondence or drift between artifacts, the lasting delta of a decision. Write it even when it could be reconstructed by reading: reconstructed prose can't be traversed.

The gate never blocks a method's applying kriya with its phases as `contains` children — that is modelling. **A list inside a body hides things:** items of a `grundsatz` that different consumers pull on become `contains` children, each with its consumer.

**Sign:** before a batch or factory call, the three answers are stated per node. Each `CHECKS:` hint in the factory's response is carried out or declined in words — not restated.

## Decision 1: what changes — then which node type?

**A correction or decision changes the deed, not the rulebook.** Find the existing nodes it touches: the kriya where the decision is taken, its carriers, phenomena and open vimarshas. Update their bodies, arrows and modes (will, ontic, epistemic) as the change in the world requires; several new nodes may be needed together — a kriya, its phenomenon, a vimarsha — but not one principle per word. **Place**: the holon where the touched work runs — a search hit is a lead, not the place, and a shared canon is not edited by one repository's decision. **One thesis per node**: a thesis written into a body that has its own puller (a reader who would come for it alone) is its own node, linked by an arrow with `sense`. A ban said in a case changes nothing: nobody meets it at the moment of acting. Delegating the update of many touched nodes: `verstak`, `Work goes to subagents`. New nodes still pass the novelty gate.

| If it… | Type | Tool |
|---|---|---|
| **acts** — transforms, produces, consumes | `kriya` | `verstak_add_kriya` |
| **presents itself to an action** — a thing, state, concept, pattern taking shape, method, rule | `phenomenon` | `verstak_add_phenomenon` |
| **asks** — a doubt, a risk, a counter-thesis | `vimarsha` | `verstak_add_vimarsha` |
| **draws a boundary** — inside from outside | `holon` | `verstak_add_holon` |
| **names a role with a motivation** | `karta` | `verstak_add_karta` |
| **transforms the system qualitatively** — a becoming with a telos | `bianhua` | `verstak_add_bianhua` |

A **kriya** ("action") is a contestable claim about a transition — "given X, actor A produces Y" — not an instruction. A **phenomenon** is what presents itself to an action (the noema to the kriya's noesis); it exists *for* a kriya — if none consumes, produces or applies it, you are writing an orphan. A **vimarsha** is an open question holding a tension. A **holon** is a boundary, defined by the questions about its edge. A **karta** is a role with a motivation, not a person.

A **bianhua** (变化) is assembly-level (**assembly**), not a routine write. Test: "the system will become X, which it is not yet". Never one per vimarsha. Search first (`lens="bianhua"`, `verstak_semantic_search(node_type="bianhua")`): a duplicate transformation is worse than a missing one. You may create one as an assumption: `kalpita`/`anumita`, `anagata`, `chanda`; `adhimoksha` is only the owner's acceptance of its name and telos.

Traps:
- **Phenomenon disguised as a kriya.** "Token creation" is an act; "Access token" is what it produces. A name carrying a before/after is a kriya; what *persists* through it is a phenomenon.
- **Kriya disguised as a phenomenon.** "Authentication flow" transforms state — a kriya.
- **Role or phenomenon?** Can it answer a vimarsha? No → not a role (Decision 2b).
- **Holon or concept?** Can't say what's inside and outside → `sinn`, not a holon; a holon used as a folder is an anti-pattern.
- **A task disguised as a node** → `verstak`, `Cross-cutting norms` → `One-off task`. The graph gets what the task changes and the decision it produced.
- **A case disguised as a form.** The graph models the form — the kind of thing, the transition every run makes. Evidence of one case (this run, this payload, this ticket) lives on an accessible carrier with a reference to the form; a singleton act (a decision, an incident) is the limited exception. `derived_from` links forms, not an instance to its type; `ahara` versus `upadhi` follows consumption versus application, not type versus instance. A participant the work must keep (an audit log, an archive) is applied or handed over, not consumed.
- **An operational surface in the shadow.** A log target, metric, environment variable or config key another holon depends on is a phenomenon with consumers; unrecorded, nobody is woken when it changes.

## Decision 2: given_as (phenomena only)

`given_as` answers: **how does this present itself to the action that works with it?** Every phenomenon has one, set when it is written; leaving `given_as` out of a later partial update keeps the value it has. Independent of the modes. Nests, the decision tree and the arrow matrix: `writing-given-as`.

| Ask yourself | given_as | Meaning |
|---|---|---|
| Can I point at it outside the graph? (file, container, document) | `ding` 物 | a **thing**: the graph describes it, doesn't constitute it |
| Is it how things stand — a kriya's before or after? | `sachverhalt` 勢 | a **state of affairs**: exists only as an action's before or after |
| Is it a named meaning — "what this is"? | `sinn` 名 | a **concept**: whatness without thinghood |
| Is it a pattern taking shape, not yet a form? | `bildung` 理 | an **emerging pattern** (seed): seen, not yet followed; usually `anagata` |
| Is it a method — "a way to do it"? | `vollzug` 行 | a **way of proceeding**: a permission, not a constraint |
| Is it a principle — "how it must be", with no existing kriya to fix (below)? | `grundsatz` 法 | a **principle**: what the system can't stand without |

`vollzug` is HOW, `grundsatz` is WHY; `sinn` names what IS, `grundsatz` what MUST BE. **A method or principle is never `ahara`/`utpatti`** (the API refuses): it is applied — `upadhi` only.

**A new principle is the last resort:** only when there is no existing kriya to fix, and only together with its applying kriya and a carrier measured to work. A link to a consumer is not that measurement. Working carriers and the check: **design**, 3b; a nudge in a tool reply is not a carrier.

**`sinn` is the cheapest cell, so the easiest place to hide.** What a kriya goes *through* is a `ding` or `sachverhalt` with an `upadhi`; what it eats or produces is `ahara`/`utpatti`; `sinn` is for a concept that does nothing and nothing is done through. **A node isn't written until you've named what pulls on it** — which kriya breaks if it disappears? None → you're hiding a thing in a concept to avoid owning its lifecycle.

## Decision 2b: manifested_as (roles only)

Required on a role: how this actor is present as the origin of action. Gate first — **can you address a vimarsha to it and expect an answer?**

- No — it acts but won't answer (cron, worker, CI) → not a role: a `ding` phenomenon; where it does the work, the kriya applies a `vollzug` via `upadhi` in the actor's place.
- No — it doesn't act, it's a theory, method or principle → `sinn` / `vollzug` / `grundsatz`, brought in by `intake`.
- Yes → a role:

| The actor… | manifested_as | Example |
|---|---|---|
| answers and **decides for itself** whether to act | `svatantra` 主 (owner) | product owner; steward of root holons |
| answers, **takes its impulse from another**, acts itself | `adhikarin` 能 (capable one) | an agent on a holon, a steward of concrete holons; a person working in the graph (their role bound by `user`) is always `svatantra` |
| **won't answer** — its path is modelled, not lived | `pratibimba` 象 (depicted figure) | a customer-journey persona |
| answers **on its own clock**, from beyond the boundary | `agantuka` 客 (guest) | regulator, counterparty, vendor |

Addressing: 主 gets strategic questions ("do we take this on?"), never tasks; 能 gets working questions — find it by `steward` from the question's holon, go to 主 when it's outside that mandate; 象 is **never** a `posed_to` target; 客 may be asked, but slowly. Take the addressee from the actual set (`verstak_search(q="", node_type="karta")` or `steward`), not from the overview's roles (only those carrying a signal now) or a keyword match.

Traps: a person's name is not a role ("Product owner", not "Alex"); one external party is often two nodes (its API as `ding`, its account manager as 客); a working mode (Assembler, Weaver) is a sub-role via `group` and inherits the kind; only 主 or 能 steward a holon.

## Decision 3: modes

Three required axes. The factories print each axis's values and **the kind's starting triad** — read them. **Every mode is a claim about this node — a question you answer, not a box you tick.** Name a node's state with the cell word of its **carrying axis** ("seeking an answer", "holding the question", "accepted", "ahead", "practised", "in force"), never "open", "closed", "alive". Self-check, patterns, cell words, moves: `writing-modes`.

**Epistemic — how do we know:** supposed (`kalpita`), inferred (`anumita`), seen (`pratyakshita`), attested repeatedly and independently (`pramanita`), refuted and kept (`badhita`). Reading code observes the code; what it does stays `anumita` until a run is observed. A focused test with a recorded zero exit observes its own run (`pratyakshita`). `pramanita` needs independent grounds; sources with a shared origin count once, and agreement with the graph grounds only a claim about the record. Re-reading raises nothing.

**Ontic — how does it exist:** in effect (`vartamana`), ahead (`anagata`), past (`atita` — asserts past *being*; what never came about is `anagata` + `visarjana`), construct (`vikalpa` — never was so; only with `badhita`), lost (`nashta` — was and left no trace). `nashta` on an ideal kind (concept, seed, principle, bianhua, will-carried vimarsha) is a kind error: refute or release it. Whatever is being designed is born `anagata` — never `pramanita`/`vartamana`/`upeksha`; a principle, carried by will, is `vartamana` from its proposal (`chanda`). **A question takes its subject's ontic:** about something being designed (a flow, policy, risk) → `anagata`; about what runs now → `vartamana`.

**Volitive — the graph holders' stance toward what is written.** **`upeksha` is not a default**: `anagata` + `upeksha` says "it will happen and we don't care". `chanda` vs `upeksha`: **held up by intent or by mechanism?** Would it arise or continue if nobody insisted? Yes → `upeksha`; no → `chanda` (once a mechanism enforces it, switch). Decided → `adhimoksha`; let go → `visarjana`.

**Read the user's will from what they said.** "We need", "I want", "let's" → `chanda`; "decided", "we hold to this" → `adhimoksha`; "no", "remove it" → `virodha` by the kind's polarity; "let it go", "doesn't matter" → `visarjana`; "ok, so be it" → `upeksha`. Without their word you write *your* stance: `chanda` on what you propose. **On the owner's behalf you never set `adhimoksha`, a refusing `virodha`, acceptance of a telos, or `upeksha` on something unwanted (risk, defect, incident)** — unless the owner said it, or authority granted beforehand by whoever may grant it covers it; otherwise prepare the material and pose it to them. Recording a risk you found as `virodha` is guarding, not a refusal. The owner is whoever stands in the 主 role, not whoever's keys run. A decision the owner stated is carried into the touched nodes (Decision 1): who, when and their words in `reasoning`, changed knowledge in their bodies and arrows, the stance in their modes. `posed_by` is a short address (role, seat, name), not prose.

**Recorded will has three readings:** a known proposal; a non-acceptance recorded by an act — only a new act lifts it; a ground you haven't established. The last limits only your own next claim: it doesn't rewrite the mode, doesn't prove no act was made, and doesn't cancel a mandate established separately. A bare "the owner decided X" creates no `adhimoksha`; a report pointing to the owner's checkable word may ground recording that act, with its provenance.

**`virodha` is polarised by kind; ending follows the kind's carrying axis.**

| Kind | `virodha` means | What ends it |
|---|---|---|
| risk | the live mode (guarding) | `visarjana`; `upeksha` = accepted by its principal: ended as work, alive as a record. `addressed_by` to a mitigation ends nothing |
| counterexample, grounding defect, drift | constitutive while `vartamana` | `atita` (fixed), `vikalpa` (never was — via `badhita`), `nashta`, `visarjana` |
| kriya, role, method | deprecation, a live tension | — |
| doubt, counter-thesis, hint, seed | refusal | itself the ending |
| bianhua | set by a person | `visarjana` — also by a person |

On a doubt, counter-thesis or hint, `upeksha` is **accepted as is**: out of the queue, not answered, not counted toward the transformation. **A principle:** `chanda` (proposed), `adhimoksha` (in force by being held — the owner puts it there), `upeksha` (in force as given); its grounds are `derived_from`/`arose_from`, without them it's a tension. Not endings (`pramanita` on a seed, `atita` on a principle): `writing-modes`, "Polarity of virodha and ending".

## Decision 4: name and description

**The name** is a thesis about the node's nature (正名, "rectifying names") and an invitation: from the name alone, an agent in its own context should recognise the node matters to it. Ask who should stop here and with what intent, and use *their* word; the rest goes in the body. Over 64 characters, shorten; over 128 it's no longer a name. Anti-patterns: retelling the body; repeating a field ("Counter-thesis to …" when the genre says so); state or history; a node-type word as the name. Renaming is deliberate: your own names in the same move, others' with their agreement, owner-accepted names (a bianhua's telos, an umbrella kriya) only on the owner's word.

| Type | Grammar | ✓ | ✗ |
|---|---|---|---|
| kriya | a verbal noun | 🔄 Authentication | "Build the API" |
| phenomenon | a noun | ⚙️ Access token | "Token creation" |
| holon | a boundary's name | 📦 Authorization boundary | "📦 auth folder" |
| karta | a role's name | 👤 Designer | "Alex" |
| vimarsha | an inquiry, not necessarily a question | 🕮 CXDB — holon or phenomenon? | "Problem" |

A name starts with an emoji by meaning, not by type (🔥 marks incidents), or with a mark glyph — 法, 行, 名, 形, 变; without one the node is not written or renamed.

**The body** goes under the type's own field: `telos` (bianhua), `essence` (kriya), `motivation` (karta), `description` (the rest) — one, not both. A kriya: its before/after (pariṇāma), "Before: X. After: Y." (a task list → rewrite); a phenomenon: what it IS and which kriyas take it; a vimarsha: the question and **what counts as an answer**; a holon: the boundary's principle, the factory's four questions; a role: what drives it; a bianhua: "the system becomes …".

**Timelessness: provenance never goes in the body** — it says what the node is and how to use it. Provenance lives in `verstak_history` and each write's `reasoning`, short `attrs` keys (`posed_by`, `source`, a date), `arose_from`, and the case (→ `verstak`, `Case laws`). Change a node by **rewriting the body to current knowledge**, never by appending a dated section. Smells: "now", "in this session", a date, a signed section, a trailing "✅". Exceptions: a `sachverhalt` incident carries its time in `attrs`; external testimony is dated by nature. **A closed node is an archive** — don't rewrite its name or body; only a part instructing a future agent reads as live.

**`attrs` hold data, not prose:** a seq, handle, date, flag or enumerated word; a one-line condition only where the key *is* it (`breaks_if`). An observation is a vimarsha; a decision changes the graph in the form the deed needs (Decision 1), not necessarily a new node.

## Decision 5: arrows

Without arrows a node is invisible. **The connection lives in the arrow; its explanation lives in `sense`** — the hook the next reader decides by whether to follow. If the body names a consumer or condition, draw the arrow in the same move — every one.

**A fan is distinguished in steps, coarse before fine.** Many links of one kind are a debt only when it jumps straight from one to many with no middle level. The coarse link stands on an umbrella (a node applying the same means, or a phenomenon containing the children); each leaf's link names its own means. Example: an umbrella kriya for handlers has `upadhi` to the address family, which `contains` each address, which each handler eats (`ahara`). A real middle has its own link and its own before/after; an umbrella without one is a folder. Genus: kriya, holon — containment; phenomenon — containment, `specifies`; role — `group`; bianhua — part-of. Over a screen of attention: "name the middle", not "split".

**A kriya — four questions** (the factory refuses one with neither `ahara` nor `utpatti`):

1. **Consumes?** → `ahara` (consumed: its participation in this scope ends, not necessarily the thing); only reads or keeps → `upadhi`.
2. **Produces?** → `utpatti`. Can't name it → you haven't understood the kriya.
3. **Who acts?** → `actor` to the role. One kriya, one actor.
4. **In what context?** → `upadhi` (a condition or method relied on, not consumed); `attrs.mutable=true` if it changes it.

Fifth: **part of what?** Before writing at the top level, `verstak_semantic_search(q=<what is this part of>)`; on an honest hit pass `parent_id` — a wrong parent is worse than none. What can go wrong → a risk vimarsha. `next` is a line of work whose `sense` carries a needle-question (praśna); `contains` holds sub-steps.

**Edge kriyas** have one side in the world. Entry (inspection, reading a contract, measuring, accepting an order): `utpatti`, no `ahara`. Exit (acceptance, handover, publishing): `ahara`, no `utpatti` — "result accepted" is not a phenomenon; the actor is almost always 主 or 客. A lone `ahara` is complete if the actor received the thing; a lone `utpatti`, if the actor saw it. Don't extend past an exit; the "no `next`" nudge there is no debt. The edge lies in the external holon, via its phenomenon's `context`.

**Phenomenon:** `context` → holon (only from a phenomenon; a kriya belongs to a holon through its phenomena). `derived_from`, `specifies` — lineage; `contains` — whole and part. No `supersedes`: a thing's succession shows as its consumers moving over.

**Karta:** `steward` → holon (主/能 only; a steward anywhere up the `group` chain counts); `group` → senior role; `actor` comes in from kriyas.

**Vimarsha:** `vimarsha_of` → the exact node it's about, not its holon. `posed_to` → the addressee role (never 象); the surface resolves `me` (whose keys you hold), `agent` (this session's seat), `steward` (the anchor holon's steward), `realm-owner`. `posed_to` without `vimarsha_of` is in nobody's holon; `vimarsha_of` without `posed_to` on a question waiting for someone else is a note into the void. No urgency stamps. `vimarsha_of` (what it's about) and `anga` (what it moves) may both stand. `arose_from` → the observation; `addressed_by` → what answered (kriya, role, vimarsha, or phenomenon by `given_as`, never a seed). An answer is an arrow to the node it repaired or created, not a paragraph; the arrow ends nothing — release is a separate act, by the genre's carrying axis and its answer condition. **A wait goes by kind:** a vimarsha `posed_to` is for a question of substance or a commitment; a one-off ask or task waits in its case (`verstak`, `One-off task`, `Waiting on an answer`); a refused delivery doesn't change the kind. **A `hint` is a bianhua's seed, not a log:** needed only for a material continuation condition that neither the graph, its lenses nor reading the cases (`verstak_case(action="at", node=<subject>)`, `read`) can restore — meaning, invariants, the owner's word not yet woven in, what's next. A pointer, not a snapshot: live cases are read, not listed; a case number only where a material choice can't be recovered otherwise. Its absence is no failure. Edit in place, no dates; `addressed_by` can mark its growth, and its release is a distinct, kind-aware act under its answer condition.

**Bianhua:** `anga` (a limb — path or carrier) comes from a vimarsha, sub-bianhua or kriya: on creation the factory's `anga=` (an inline arrow leaves the new node, `anga` points into it), later `verstak_arrow(action="link", arrow_type="anga", source=<part>, target=<bianhua>)`. A carrier kriya's triad says whether it's being built (`anagata`→`vartamana`, `chanda`/`adhimoksha`) or deprecated (`vartamana`→`atita`, `virodha`); a finished one stays a paid part. `anantara_after=` — what completes first; acyclic. No `given_as`, `context` or flow arrows.

**Sense:** `next` → a needle-question, a yes/no question the next kriya answers ("The path is built — where can it break?", not "go on"); `upadhi` → why this phenomenon matters here; `ahara` → what is consumed and why.

## Vimarsha genres

| You want to say… | Genre | Grounding |
|---|---|---|
| "What could go wrong?" | `risk` | an unwanted consequence; looks forward |
| "Is this right?" | `samshaya` | doubt between two possibilities; looks at now |
| "A case the rule doesn't cover" | `vyabhichara` | a concrete counterexample |
| "I disagree — another thesis" | `prati-paksha` | the opposing side; a whole alternative, not a hole |
| "The reasoning is flawed" | `hetu-dosha` | a defect in the grounds; the conclusion may hold |
| "This term has drifted" | `semantic-drift` | meaning moved; about meaning, not truth |
| "Future agent: read this" | `hint` | an instruction with an addressee in time |

Can't pick → two questions are tangled. Can name where it breaks → `risk`; can't → `samshaya`.

## After writing

1. Read `CHECKS:` in the factory's response; fix warnings before moving on. The orphan check on a fresh phenomenon stays until a kriya takes it; `context` doesn't clear it.
2. The body names a connection with no arrow → draw it now, prose into `sense`.
3. A phenomenon with `ahara`/`utpatti` → `verstak_orient(lens="trace", focus=…)`: is the cycle connected?
4. A kriya → do its actor, `ahara` and `utpatti` exist?
5. You replaced a node → move anchors and consumers over and retire the predecessor by its carrying axis (`supersedes` only between vimarshas). An unreleased predecessor is a live duplicate.
6. `CHECKS`, a connected trace and legal arrows are graph integrity, not the truth of a behavioural claim (Decision 3).
7. **Next moment:** the write answered a question → end it by axis (**inquiry**); neighbours still describe the old shape → **weaving**.

## Operational

`reasoning="…"` on every write — why; it goes into the history. `basis_version` on update / delete / reconnect: read → write → on conflict, re-read. Rewriting a body → read it with `verstak_look(raw=true)` first (it prints the body alone; the version comes from the plain card): the plain card formats the body for the reader, and a rewrite composed from it writes that formatting back into the stored text. Batches: `writing-batch` — a kriya's `ahara`/`utpatti` inline in its create; phenomena before the kriyas that reference them. **A write that errored or timed out may have landed:** find it (`verstak_search`, `verstak_history(action="realm")`) before retrying.

**Probe a node address from another actor in the same move.** A number from a frame or message isn't an address until `verstak_look` answers; if it doesn't, say in words where the question stands. A failed read says nothing about the node's past. A single machine's state (a key, a file) never gets a node — ask in words.
