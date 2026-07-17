---
name: writing
description: "Use this skill when writing nodes into an NKS graph — creating phenomena, kriyas, vimarshas, holons, or kartas. Triggers: 'запиши', 'зафиксируй', 'добавь узел', 'создай крию', 'create phenomenon', 'create entity', 'add to graph', 'nks_add', 'положи в граф', or whenever the agent is about to call any nks_add_* tool or nks_batch with creates. Also when unsure which node type, given_as, or modes to pick. Use even for single-node writes — one wrong type propagates through the graph. Distinct from design (plans paths from goals), weaving (repairs existing structure), and methodology-work (evolves methodology itself)."
---

# NKS Writing

You are about to write a node into the graph. Every node you write will be navigated by future agents, linked to other nodes, traced through estafetas. A wrong type, a lazy name, a mechanical mode — each one degrades the graph for everyone downstream.

Five decisions, in order. Do not skip ahead.

## Before anything: realm and cross-realm

Every NKS tool call requires `realm=<token>`. Confirm which realm you're writing into before the first call.

**Cross-realm arrows do not work.** `nks_arrow(action="link", source="739", target="29")` resolves both seq numbers inside the current realm. If #29 in your realm is not the node you mean — you just created a wrong arrow. For cross-realm references, use text in the sense ("see <realm> #29") — never arrows.

## Decision 1: What type of node?

| If it… | Type | Tool |
|---|---|---|
| **does something** — transforms, produces, consumes | **kriya** | `nks_add_kriya` |
| **is acted upon** — thing, state, concept, seed, method, or rule that some kriya consumes / produces / conditions | **phenomenon** | `nks_add_phenomenon` |
| **asks a question** — doubt, risk, counter-thesis | **vimarsha** | `nks_add_vimarsha` |
| **draws a boundary** — separates inside from outside | **holon** | `nks_add_holon` |
| **names a role with a motivation** | **karta** | `nks_add_karta` |
| **transforms the system qualitatively** — a cross-holon becoming with a *telos* ("what the system becomes") | **bianhua** | `nks_add_bianhua` |

**bianhua is an assembly-level type, not a routine write** — the **assembly** skill's work. Test: "the system will be X, which it isn't yet" — can't say it → not a bianhua. Never for a single vimarsha: locate the existing transformation first (`lens="bianhua"`, `nks_semantic_search(node_type="bianhua")`); unsure → ask the user. Vimarshas the agent writes for itself; **bianhua are the owner's interface** — the name must read for the user, the telos is verified by them. See Decision 5 for its arrows.

A phenomenon does not exist on its own — it exists *for* a kriya (noema for noesis). If no kriya consumes, produces, or conditions it, you are about to write an orphan.

**A method is half a node.** `vollzug` 行 *is* conduct — a way of acting, reified into a noun. The reification is legal, and it is exactly where activity hides: a method-phenomenon whose `description` narrates the protocol is legal, `CHECKS`-clean, and carries **zero tension** — no detector can tell a modeled method from a narrated one, because absence of a model is invisible from inside the model. So a vollzug (and a grundsatz) obliges you: **name the kriya that runs it**, and if the method has phases, they are `contains`-children of *that kriya* — never prose in the phenomenon's description. One-line test: does the description carry an arrow, a numbered step, or the word "then"? You are narrating an activity. Model it.

### Traps

**Phenomenon in kriya disguise.** "Token creation" is the act. "⚙️ Access token" is what the act produces. Test: does the name carry a before/after? → kriya. Does it name what *stands* through that before/after? → phenomenon.

**Kriya in phenomenon disguise.** "⚙️ Authentication flow" — if it transforms state, it's a kriya. A noun on a kriya is a smell, not a license.

**Activity reified into a method-noun.** The subtlest trap, because the type is *right*: a skill, a recipe, an idiom really is a vollzug phenomenon. The error is stopping there — parking the protocol in its description instead of modeling the kriya that runs it and the steps it runs through. Unlike the two traps above, nothing here looks wrong: the name is a proper noun, the given_as is correct, the node validates. Test: if the description tells you *how to do it*, the doing belongs in a kriya. The phenomenon **names** the method; it never **replaces** it.

**Task in kriya disguise.** The mirror of the trap above — read them as a pair. Not everything that *gets done* is a kriya. "Build the API", "Integrate Authentik" are project activities: one-off, no repeating estafeta, a different ahara/utpatti every run. Test: imagine it performed many times — same ahara and same utpatti each time? → kriya. Different each time? → a task, and it lives in a tracker, not here. The kriyas *inside* it are real: "Serving an HTTP request" (ahara request, utpatti response, actor API server) repeats on every request.

Together the last two traps hold the kriya boundary from both sides: **not everything done is a kriya, but everything that is a kriya must be modeled as one — never narrated inside a phenomenon.** Over-correcting either way costs the same: tasks masquerading as kriyas, or activity flattened into nouns.

**Karta vs phenomenon.** Gated by the operational test — *can you address a vimarsha to it and get an answer?* No → not a karta (a machine → ding-phenomenon; a theory/method/principle → sinn/vollzug/grundsatz). The full gate and the four karta kinds live in **Decision 2b**.

**Holon vs phenomenon(sinn).** "📦 Auth contour" — what's inside, outside? Can't answer → probably phenomenon(sinn). Holons-as-folders are an anti-pattern.

## Decision 2: given_as (phenomenon only)

How does this phenomenon give itself? See `references/given_as.md` for the full decision tree.

| Ask yourself | given_as |
|---|---|
| Can I point at it outside the graph? (file, container) | **ding** 物 |
| State of affairs — before/after of a kriya? | **sachverhalt** 勢 |
| Named concept — what-is-it? | **sinn** 名 |
| Seed — something becoming? | **bildung** 理 |
| Method — "this is how"? | **vollzug** 行 |
| Principle — "this is how it must be"? | **grundsatz** 法 |

**Critical:** vollzug/grundsatz cannot be ahara or utpatti — API 422. Applied via upadhi only.

## Decision 2b: manifested_as (karta only)

`manifested_as` is **required on every karta** — the mode-of-manifestation (āvirbhāva), parallel to given_as. Run the gate first, then pick the kind.

**Gate — can you address a vimarsha to this doer and get an answer?**
- **No — it acts but can't answer** (cron, worker, CI, process): **not a karta.** Make a ding-phenomenon, wire it to a kriya as `upadhi`.
- **No — it doesn't act, it stands as theory / method / principle** (Erikson, Nyāya, a how-to): **not a karta.** Make a sinn / vollzug / grundsatz phenomenon (entered via **intake**).
- **Yes → karta.** Which kind?

| The doer… | manifested_as | Example |
|---|---|---|
| answers, and **decides itself** whether to act (gives adhimoksha/virodha) | **svatantra** 主 | product owner, architect — stewards **root** holons |
| answers, but takes its **impulse from another** — discriminates and acts, doesn't originate | **adhikarin** 能 | nks-api dev, a Claude-agent responsible for a holon — stewards **concrete** holons |
| **won't answer** — needed as actor on kriyas, its path is *modelled*, not lived | **pratibimba** 象 | CJM-persona, "the becoming self" |
| answers, but **on its own time** — its 時-cycle isn't synced with the realm | **agantuka** 客 | regulator, external counterparty, the market |

**Addressing by kind** (where a `posed_to` arrow may point): **主** — strategic questions ("do we take this?", "what's the priority?"); you don't assign it tasks, it assigns them. **能** — work questions and tasks; find the addressee by the `steward` arrow (who stewards the holon your question lives in); out of its scope → escalate to 主. **象** — **never** `posed_to`; use only as actor for path-modelling, decisions about its path go to the 主/能 who designs it. **客** — `posed_to` is allowed, but don't expect a fast answer; its actor-edges cross the boundary and tracing stops there by design.

**Finding the addressee.** Never pick one from orient's ROOT KARTAS line — it shows root roles only (sub-roles fold into "· N sub"), and a name that merely contains your keyword is not the role: an 象-image often carries the system's name, while the 能 who answers for its code is a sub-role of a developer archetype. List the real set — `nks_search(q="", node_type="karta")` — or follow the `steward` arrow from the holon where the work lives. Every karta row carries its род glyph (主/能/象/客); 象 is never an addressee. And roles for another repo live in the *same* realm as sub-kartas — don't go hunting for a realm named after the repo.

Traps:
- **A person's name is not a karta.** "Дмитрий" → "Product owner" — the role, not the person.
- **One external entity is often two nodes**: Stripe-API (ding-phenomenon, a machine) and Stripe-account-manager (**agantuka** karta). Split by addressability.
- **A modus (Сборщик, Ткач, Explorer) is a sub-karta via `group`, not a separate type** — `manifested_as` is inherited from the parent role.
- Only **svatantra / adhikarin** may `steward` a holon; a `pratibimba` / `agantuka` does not answer for a boundary.

## Decision 3: Modes

Three axes, each required. The tool descriptions on each factory already list enum values and contextual questions — read them. The principle here:

**Each mode is a question you answer, not a box you check.**

See `references/modes.md` for the self-check and stable triads.

The critical trap: **upeksha is not a default.** anagata + upeksha = "this will exist in the future and I don't care." Almost always wrong for projected nodes. anagata + chanda or adhimoksha is more honest.

## Decision 4: Name and description

### Naming (正名)

| Type | Grammar | Example | Anti-example |
|---|---|---|---|
| kriya | Verbal noun | 🔄 Аутентификация | "Build the API" |
| phenomenon | Noun | ⚙️ Токен доступа | "Token creation" |
| holon | Boundary name | 📦 Контур авторизации | "📦 Папка auth" |
| karta | Role name | 👤 Проектирующий | "Дмитрий" |
| vimarsha | The question | 🕮 CXDB — холон или сущность? | "Проблема" |

🔥 for sachverhalt-incidents by convention.

### Description (the body)

The body is addressed by its **per-type name** on every surface — the name you *read* is the name you *write*, on create and update. `nks_look` renders it under that heading; the factories and `nks_update` / batch-update accept it under that name. Pass the per-type name **or** `description`, never both — a guard rejects double-passing.

| Type | Body param | `nks_look` heading |
|---|---|---|
| bianhua | `telos` | TELOS |
| kriya | `essence` | ESSENCE |
| karta | `motivation` | MOTIVATION |
| phenomenon · vimarsha · holon | `description` | DESCRIPTION |

What goes in it, by type:

- **Kriya** (`essence`): pariṇāma — "Before: X. After: Y." If it reads like a task list, rewrite.
- **Phenomenon** (`description`): what it IS, and which kriyas consume / produce / condition it. If you can't name any such kriya, you don't yet know what you're writing.
- **Vimarsha** (`description`): the question. What would count as an answer?
- **Holon** (`description`): what principle separates inside from outside. nks_add_holon enforces 4 questions — answer them.
- **Karta** (`motivation`): what drives the role. nks_add_karta requires it.
- **Bianhua** (`telos`): the destination quality — "the system becomes …" (see Decision 5).

**Timelessness — a guard, not a nicety.** Every description states what IS — the resolved, the asked — never how it came to be discussed. The body is read *out of time*: a future agent meets it with no session around it, so a chronicle in the body is noise to everyone but the writer.

- **Out of the body:** dates, session markers, people's names (attribution → `attrs.posed_by`), git refs (SHAs/branches/PRs), and DONE/changelog journals. History lives in `nks_history` and git; done work changes the graph *itself* — modes, arrows, descriptions — it is not appended as a log.
- **Violation smells:** "now" / «теперь», "after we…" / «после того как», "in this session", a date in prose, a «✅ done» tail, any narration of what was wrong *before*.
- **Where time is legitimate:** a `phenomenon(given_as=sachverhalt)` — an incident/state — carries its timestamp in `attrs`, not the prose; `shabda` (quoted external testimony) is dated by its nature; a closed vimarsha reads as archive (its body froze at closure). Everywhere else: tenseless.

## Decision 5: Arrows

Arrowless = orphan = invisible.

### Kriya (six questions)

1. **Consumes?** → `ahara` to phenomenon. ahara = DESTRUCTION. Just read → upadhi.
2. **Produces?** → `utpatti` to phenomenon. Can't name utpatti? Stop — you don't understand the kriya.
3. **Who acts?** → `actor` to karta.
4. **Context?** → `upadhi` to phenomenon. `attrs.mutable=true` if modified.
5. **Belongs to what?** → search for a candidate parent kriya before writing top-level (locate-before-write). `nks_semantic_search(q=<what this kriya is part of>)`; on a real hit, pass `parent_id=<seq>` (creates a `contains` edge from parent). **No coercion** — a wrong parent is worse than none; when you can't honestly name the umbrella, stay top-level consciously. The most compressing axis is the one factories never forced — ask it yourself.

6. **Made of what steps?** → `contains` to sub-kriyas. If the pariṇāma names phases — "through five decisions", "four phases", a `→` chain — those phases are children: one sub-kriya each, with its own pariṇāma, ahara/utpatti, actor. **Can't name the steps? Stop — you have a label, not a model of the activity.** This is the mirror of question 2: utpatti proves you understand *what the kriya does*; the steps prove you understand *how it unfolds*. Question 5 decomposes upward (whose part am I?), this one downward (what am I made of?) — 5 without 6 leaves a black box neatly filed under a parent. A leaf kriya is legitimate: a single tool call has no phases. A kriya whose body *promises* phases and contains none is not a leaf — it's a narration.

A phase whose actor is **not** the actor of the parent — an owner accepting a telos, a goal, a gate — is its own kriya, not a bullet in the parent's body: one kriya, one actor (see the decomposition rule in **weaving**).

Plus: `next` (sense = praśna — yes/no question). `contains` for sub-steps.

Realm boundary is topological: a kriya at the realm edge is legal without ahara — no detector demands it, no marker waives it. `attrs.boundary="init"` survives only as a positive inlet-consumer marker, never as a tension-silencer.

### Phenomenon

- `context` → holon. **Only phenomenon → holon.** Kriya/karta/vimarsha → holon is forbidden.
- `derived_from`, `specifies` → phenomenon-to-phenomenon lineage.
- Expectations depend on given_as — see `references/given_as.md`.

### Karta

- `steward` → holon: who answers for this boundary. Only a **svatantra** (root holons) or **adhikarin** (concrete holons) karta may steward; a pratibimba / agantuka may not. An `adhikarin` acting with no `steward` edge is a warning — it works but answers for nothing.
- `group` → senior karta (sub-role); `actor` is incoming — from every kriya this role performs.

### Vimarsha

- `vimarsha_of` → node(s) this question is about. **Anchor every vimarsha — one carrying an expectation (`posed_to`, anga to a bianhua) doubly so**: agents discover work by orienting on a holon, and neither anga nor posed_to scopes the vimarsha into anyone's contour — unanchored, it is invisible to the addressee and will never be done. Minimum — the holon where the expected work lives; better — the precise phenomenon/kriya within it.
- `posed_to` → karta: the **inbox edge** — address the inquiry to a doer who can answer, so they can poll "my open questions" (`nks_search(posed_to=<karta>)`). **It is an arrow to a karta node, not a field** — create it inline (`arrows: [{arrow_type:"posed_to", target:<karta>}]`) or via `nks_arrow(action="link", arrow_type="posed_to", …)`. **Forbidden to a pratibimba** (an image can't answer). Choose the target per Decision 2b — the 能 who stewards the holon your question is in, the 主 for strategic scope. It does not replace `vimarsha_of`: the inbox edge alone places the question in no one's holon-orientation. **The mirror failure is just as real:** `vimarsha_of` without `posed_to` on a question that *expects another doer to act* is a delegation degraded to a note-into-the-void — anchored, visible in the territory, in no one's inbox. A delegating vimarsha is not finished until the inbox edge is set. **No urgency stamps:** ranking a queue is the queue owner's act, never the poser's — don't set priority attrs or fill a priority-shaped tool param (volition graduates `chanda → adhimoksha`; an affordance in a tool schema is not a mandate).
- **`vimarsha_of` (о ЧЁМ) vs `anga` (куда двигаю) — don't collapse them.** `vimarsha_of` names the *subject*: the present, as-is node the doubt is *about*. `anga` names the *becoming* the answer drives: the bianhua, the future telos. The trap is the pull toward the answer — dropping the **actor** or the **work's destination** into `vimarsha_of` when they belong on `anga`. Meta-move: answer two questions separately — «about WHAT is the doubt?» (→ `vimarsha_of`), then «which becoming does the answer drive?» (→ `anga`). One vimarsha legitimately carries both.
- `arose_from` → observation origin.
- Genre determines lifecycle: risk → may `realized_as` sachverhalt. hint → read and close.
- A **hint is a pointer, not a payload**: it carries only what orient and the lenses can't show — external-world state, chosen priorities, conventions. Work-in-flight belongs on the bianhua map via `anga`, not in a seed.

### Bianhua

- `anga` (part→whole): a constituent → the bianhua it *drives*. Three carrier kinds — a **vimarsha**, a **sub-bianhua**, or a **kriya**. Pass `anga=<refs>` on `nks_add_bianhua`, or `nks_arrow(action="link", arrow_type="anga", source=<ref>, target=<bianhua>)` later. The carrier keeps its own anchoring (a vimarsha its `vimarsha_of`) — anga is additional. A bianhua with zero anga is an *empty transformation* — the factory warns. Acyclic tree: one anga-parent per source.
- **kriya as anga-carrier**: a vimarsha-anga carries the *path* (a question whose resolution moves the change); a kriya-anga carries the *arrival* — the deed that itself constitutes the transformation. Two readings, **inferred from the kriya's own triputi, never a separate field** (there is no `anga_kind`): a **возведение** is a deed entering the fabric (kriya ontic `anagata→vartamana`, volitive `chanda`/`adhimoksha`); a **депрекация** is a deed leaving it (`vartamana→atita`, `virodha`). **A completed kriya still links** — finishing the deed is the debt repaid (отдача долга), not a block; no 422 on a done carrier. Each kriya-anga counts toward the bianhua's progress, its `resolved` read from the carrier's triputi.
- `anantara` (ordering): bianhua → the bianhua that must complete first. `anantara_after=<refs>`. Acyclic; sets the critical path.
- `telos` is the description: write the *destination quality* ("the system becomes …"), rendered as `TELOS:` in `nks_look`. No given_as, no `context`, no ahara/utpatti/upadhi on a bianhua (422). The lifecycle and field work belong to the **inquiry** and **assembly** skills.

### Sense on arrows

Every arrow carries a sense explaining WHY.

- `next` → praśna. ✓ "Path built — where can it break?" ✗ "Go to next step."
- `upadhi` → why this phenomenon matters HERE.
- `ahara` → what consumed and why.

## After writing

1. **Read the `CHECKS:` block the create response prints.** The factory self-validates — no separate call needed. Clean? Move on. Fix warnings first. Note: `not_orphan` on a fresh phenomenon is expected until a kriya picks it up (ahara/utpatti/upadhi) — a `context` arrow to a holon does NOT clear it. Wire it to a kriya. **A nudge in the response is a work item, not an FYI**: "Not attached to any transformation — check the map" means run the check it names (`lens="bianhua"`) and either attach or surface the decision to the user explicitly — never relay the line in passing and move on.
2. **Phenomenon with ahara/utpatti**: `nks_orient(lens="trace", focus=<seq>)` — lifecycle connected?
3. **Kriya**: actor, ahara, utpatti phenomena all exist? And — if the pariṇāma names phases — are they `contains`-children, or still prose? `nks_look` renders them as `HOW`; an empty `HOW` under a body that promises steps is a black box, and it is silent: nothing will flag it for you.
4. **Method phenomenon (vollzug / grundsatz)**: does a kriya apply it via `upadhi`, and are that kriya's steps modeled? A method nobody runs is a dead recipe; a method whose running isn't decomposed is a description pretending to be a model.
5. **Release what you replaced.** Locate-before-write looks for duplicates *before* the write; this is its mirror *after*: if the new node supersedes an existing one, draw `supersedes` new→old, migrate the old node's load (`key:true`, anchors, upadhi consumers that should move), and close it (`visarjana`). A successor that doesn't release its predecessor leaves a live duplicate canon — the forward wave updates references and strands the old node under the retired term.

## Operational reminders

**reasoning.** Every write tool accepts `reasoning="..."`. Use it.

**basis_version.** Every `nks_update`, `nks_arrow` (delete/reconnect/update), and `nks_delete_node` requires it. Read → write → re-read on conflict.

**Cross-realm.** Text references in descriptions. Never arrows.

## Vimarsha genres

| You want to say… | Genre |
|---|---|
| "What could go wrong?" | **risk** |
| "Is this correct?" | **samshaya** |
| "Case the rule misses" | **vyabhichara** |
| "I disagree" | **prati-paksha** |
| "Reasoning is flawed" | **hetu-dosha** |
| "Term has drifted" | **semantic-drift** |
| "Future agent: read this" | **hint** |

Can't pick one → two questions tangled. Separate.

## Starting triples & closure — carrier canon

Each род (type × given_as × genre) has **one axis that carries liveness** (U1); the others only qualify. The `nks_add_*` factories print the **canonical STARTING TRIPUTI** for the род and `nks_look` glosses the carrier per node — **read them; don't stamp a divergent triple.** The trap the canon fixes: **`virodha` does NOT uniformly mean "closed" — it is polarized by род (U3):**

- **risk** — `virodha` is the *live* mode: an active risk *stands* in virodha. It closes only via `visarjana` ∨ `addressed_by` ∨ `realized_as`, never by virodha itself.
- **kriya / karta / phenomenon(vollzug)** — `virodha` = **депрекация** (deprecation): a live tension "we want to retire this", not a closure. Closes at `atita` (kriya/karta also `nashta`) ∨ `visarjana`.
- **samshaya / prati-paksha / hint** — here `virodha` *is* a closure (отказ — refusal).

And projected work is born `anagata` in the *project* triad, never the "ready" `pramanita/vartamana/upeksha` (that lies the deed already runs) — the **design** skill owns those starting modes.

## Batch ordering (nks_batch)

**Load the factory schemas before a create-batch.** `nks_batch` wraps the `nks_add_*` factories but does **not** relax their discipline — every create op is validated against its factory's full schema. In a deferred-tool environment the batch loads without them, so composing a factory-create batch blind means learning each required param one `422` per round-trip. Before you batch: `tool_search` and read the schema of every `nks_add_*` you'll call. The **first** create of an unfamiliar node type is safer as a single factory call than buried in a megabatch — and don't pack heavy multi-paragraph descriptions into a megabatch.

Order within the batch:

1. Phenomena first
2. Kriyas second (referencing phenomena)
3. Cross-cutting arrows last

### Inline-arrow form

Inline `arrows` on the factories take the same canonical shape as `arrow_link`, with the new node as the implicit source: `{arrow_type, target, sense?, direction?, quantifier?, attrs?, <modes>}`. Only `arrow_type` and `target` are required; `direction` flips the orientation when the new node is the *target* rather than the source. The factory **validates the form strictly**: an unknown key — e.g. the pre-rename `edge_type` — is rejected with a named error pointing at `arrow_type`, and a missing `target` says so. No silent acceptance, no raw TypeError — you learn the form before the first write, not by decoding a stack trace.

Two patterns, both first-class:
- **Inline `arrows`** — for edges that *originate at the new node* (a vimarsha's `vimarsha_of`, a phenomenon's `context`). Pass them in the create op.
- **Separate `arrow_link` with `temp:N`** — for edges *between two nodes created in the same batch*, or pointing *into* the new node. Reference each created node by its 0-based `temp:N` index; a `temp:N` must point at a lower-indexed create op.

**A kriya's constitutive `ahara`/`utpatti` must stay inline.** The factory validates each `add_kriya` against its *own* inline `arrows` at create time — a consume/produce edge deferred to a trailing `arrow_link` is not counted, and the kriya fails ("a kriya must declare ahara or utpatti"). Put `ahara`/`utpatti` in the create op's `arrows`; when the consumed/produced phenomenon is created in the same batch, order it earlier and reference it inline by `temp:N` — inline arrows resolve `temp:N` just like `arrow_link` does. Only genuinely cross-cutting edges (`next`, an `upadhi` to a pre-existing node) belong in trailing `arrow_link`s.

`anga`/`anantara` on `nks_add_bianhua` are the exception — pass them as their own `anga=` / `anantara_after=` params, never in `arrows`.

## Scope

This skill: the act of writing. Not covered:
- **Design** → design
- **Weaving** → weaving
- **Methodology work** → methodology-work
- **Reading** → entry
