---
name: writing
description: "Use this skill when writing nodes into an NKS graph — creating phenomena, kriyas, vimarshas, holons, or kartas. Triggers: 'запиши', 'зафиксируй', 'добавь узел', 'создай крию', 'create phenomenon', 'create entity', 'add to graph', 'nks_add', 'положи в граф', or any situation where the agent is about to call nks_add_phenomenon, nks_add_kriya, nks_add_vimarsha, nks_add_holon, nks_add_karta, or nks_batch with creates. Also triggers when the agent is unsure which node type to use, what given_as to pick, or which modes to set. Use this skill even for single-node writes — one wrong type propagates through the graph. Distinct from design (which plans paths from goals), weaving (which repairs existing structure), and methodology-work (which evolves methodology itself). This skill is about the act of writing: choosing the right type, name, modes, given_as, arrows, and validating afterward."
---

# NKS Writing

You are about to write a node into the graph. Every node you write will be navigated by future agents, linked to other nodes, traced through estafetas. A wrong type, a lazy name, a mechanical mode — each one degrades the graph for everyone downstream.

Five decisions, in order. Do not skip ahead.

## Before anything: realm and cross-realm

Every NKS tool call requires `realm=<token>`. Confirm which realm you're writing into before the first call.

**Cross-realm arrows do not work.** `nks_arrow(action="link", source="739", target="29")` resolves both seq numbers inside the current realm. If #29 in your realm is not the node you mean — you just created a wrong arrow. For cross-realm references, use text in the sense ("see methodology #29") — never arrows.

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

A phenomenon does not exist on its own — it exists *for* a kriya (noema for noesis, methodology #18). If no kriya consumes, produces, or conditions it, you are about to write an orphan.

### Traps

**Phenomenon in kriya disguise.** "Token creation" is the act. "⚙️ Access token" is what the act produces. Test: does the name carry a before/after? → kriya. Does it name what *stands* through that before/after? → phenomenon.

**Kriya in phenomenon disguise.** "⚙️ Authentication flow" — if it transforms state, it's a kriya. A noun on a kriya is a smell, not a license.

**Karta vs phenomenon(vollzug).** "Reviewer" with motivation → karta. "Review process" (method, no motivation of its own) → phenomenon(vollzug).

**Machine masquerading as karta — THE KARTA TEST.** A scheduled worker, a cron job, an automated pipeline *runs* — but carries no motivation of its own. Test: can you address a vimarsha to it, expecting an answer? **No → it is not a karta.** Model it as a ⚙️ phenomenon; the would-be `actor` edge becomes `upadhi`. Only an address-able doer — a role you could pose a question to and await a reply — is a karta. (The factory's `manifested_as` forces this decision up front — see Decision 3.)

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

## Decision 3: Modes

Three axes, each required. The tool descriptions on each factory already list enum values and contextual questions — read them. The principle here:

**Each mode is a question you answer, not a box you check.**

See `references/modes.md` for the self-check and stable triads.

The critical trap: **upeksha is not a default.** anagata + upeksha = "this will exist in the future and I don't care." Almost always wrong for projected nodes. anagata + chanda or adhimoksha is more honest.

### Karta also requires `manifested_as` — a 4th required field, karta-only (not a mode-axis)

How the doer is manifested. Run THE KARTA TEST first (Decision 1) — if it isn't a karta at all, you never reach this choice. Then pick one:

| `manifested_as` | 漢 | Who it is |
|---|---|---|
| **svatantra** | 主 | full, sovereign agency — the owner of a root holon |
| **adhikarin** | 能 | delegated, authorised office-holder — concrete holons (admin, maintainer, reviewer) |
| **pratibimba** | 象 | an image/model of a doer — **cannot** be a `posed_to` target |
| **agantuka** | 客 | a real doer beyond the boundary (external user, upstream maintainer) |

Only `svatantra`/`adhikarin` may `steward` a holon. **The trap:** surface-matching "autonomous-looking" automation to `svatantra`. Autonomy-of-execution (runs unattended, on a schedule) ≠ sovereign motivation — they are opposite axes. A cron job is the *least* sovereign thing in the realm: re-run the karta test and it falls out as a ⚙️ phenomenon, not a `svatantra` karta.

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

The body is addressed by its **per-type name** on every surface — the name you *read* is the name you *write*, on create and update (#1128). `nks_look` renders it under that heading; the factories and `nks_update` / batch-update accept it under that name. Pass the per-type name **or** `description`, never both — a guard rejects double-passing.

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
- **Bianhua** (`telos`): the destination quality — "система станет …" (see Decision 5).

**Timelessness (#440) — a guard, not a nicety.** Every description states what IS — the resolved, the asked — never how it came to be discussed. The body is read *out of time*: a future agent meets it with no session around it, so a chronicle in the body is noise to everyone but the writer.

- **Out of the body:** dates, session markers, people's names (attribution → `attrs.posed_by`), git refs (SHAs/branches/PRs), and DONE/changelog journals. History lives in `nks_history` and git; done work changes the graph *itself* — modes, arrows, descriptions — it is not appended as a log.
- **Violation smells:** «теперь», «после того как», «в этой сессии», a date in prose, a «✅ сделано» tail, any narration of what was wrong *before*.
- **Where time is legitimate:** a `phenomenon(given_as=sachverhalt)` — an incident/state — carries its timestamp in `attrs`, not the prose; `shabda` (quoted external testimony) is dated by its nature; a closed vimarsha reads as archive (its body froze at closure). Everywhere else: tenseless.

## Decision 5: Arrows

Arrowless = orphan = invisible.

### Kriya (four questions)

1. **Consumes?** → `ahara` to phenomenon. ahara = DESTRUCTION. Just read → upadhi.
2. **Produces?** → `utpatti` to phenomenon. Can't name utpatti? Stop — you don't understand the kriya.
3. **Who acts?** → `actor` to karta.
4. **Context?** → `upadhi` to phenomenon. `attrs.mutable=true` if modified.
5. **Belongs to what?** → search for a candidate parent kriya before writing top-level (locate-before-write). `nks_semantic_search(q=<what this kriya is part of>)`; on a real hit, pass `parent_id=<seq>` (creates a `contains` edge from parent). **No coercion** — a wrong parent is worse than none (#435); when you can't honestly name the umbrella, stay top-level consciously. The most compressing axis is the one factories never forced — ask it yourself.

Plus: `next` (sense = praśna — yes/no question). `contains` for sub-steps.

Realm boundary is topological (#978): a kriya at the realm edge is legal without ahara — no detector demands it, no marker waives it. `attrs.boundary="init"` survives only as a positive inlet-consumer marker, never as a tension-silencer.

### Phenomenon

- `context` → holon. **Only phenomenon → holon.** Kriya/karta/vimarsha → holon is forbidden.
- `derived_from`, `specifies` → phenomenon-to-phenomenon lineage.
- Expectations depend on given_as — see `references/given_as.md`.

### Vimarsha

- `vimarsha_of` → node(s) this question is about. **Anchor every vimarsha — one carrying an expectation (`posed_to`, anga to a bianhua) doubly so**: agents discover work by orienting on a holon, and neither anga nor posed_to scopes the vimarsha into anyone's contour — unanchored, it is invisible to the addressee and will never be done. Minimum — the holon where the expected work lives; better — the precise phenomenon/kriya within it.
- **`vimarsha_of` (о ЧЁМ) vs `anga` (куда двигаю) — don't collapse them.** `vimarsha_of` names the *subject*: the present, as-is node the doubt is *about*. `anga` names the *becoming* the answer drives: the bianhua, the future telos. The trap is the pull toward the answer — dropping the **actor** or the **work's destination** into `vimarsha_of` when they belong on `anga`. Meta-move: answer two questions separately — «про ЧТО сомнение?» (→ `vimarsha_of`), then «какую перемену двигает ответ?» (→ `anga`). One vimarsha legitimately carries both.
- `arose_from` → observation origin.
- Genre determines lifecycle: risk → may `realized_as` sachverhalt. hint → read and close.
- A **hint is a pointer, not a payload** (methodology #131): it carries only what orient and the lenses can't show — external-world state, chosen priorities, conventions. Work-in-flight belongs on the bianhua map via `anga`, not in a seed.

### Bianhua

- `anga` (part→whole): a constituent → the bianhua it *drives*. Three carrier kinds — a **vimarsha**, a **sub-bianhua**, or a **kriya**. Pass `anga=<refs>` on `nks_add_bianhua`, or `nks_arrow(action="link", arrow_type="anga", source=<ref>, target=<bianhua>)` later. The carrier keeps its own anchoring (a vimarsha its `vimarsha_of`) — anga is additional. A bianhua with zero anga is an *empty transformation* — the factory warns. Acyclic tree: one anga-parent per source.
- **kriya as anga-carrier**: a vimarsha-anga carries the *path* (a question whose resolution moves the change); a kriya-anga carries the *arrival* — the deed that itself constitutes the transformation. Two readings, **inferred from the kriya's own triputi, never a separate field** (there is no `anga_kind`): a **возведение** is a deed entering the fabric (kriya ontic `anagata→vartamana`, volitive `chanda`/`adhimoksha`); a **депрекация** is a deed leaving it (`vartamana→atita`, `virodha`). **A completed kriya still links** — finishing the deed is the debt paid (отдача долга), not a block; no 422 on a done carrier. Each kriya-anga counts toward the bianhua's progress, its `resolved` read from the carrier's triputi.
- `anantara` (ordering): bianhua → the bianhua that must complete first. `anantara_after=<refs>`. Acyclic; sets the critical path.
- `telos` is the description: write the *destination quality* ("система станет …"), rendered as `TELOS:` in `nks_look`. No given_as, no `context`, no ahara/utpatti/upadhi on a bianhua (422). The lifecycle and field work belong to the **inquiry** and **assembly** skills.

### Sense on arrows

Every arrow carries a sense explaining WHY.

- `next` → praśna. ✓ "Path built — where can it break?" ✗ "Go to next step."
- `upadhi` → why this phenomenon matters HERE.
- `ahara` → what consumed and why.

## After writing

1. **Read the `CHECKS:` block the create response prints.** The factory self-validates — no separate call needed. Clean? Move on. Fix warnings first. Note: `not_orphan` on a fresh phenomenon is expected until a kriya picks it up (ahara/utpatti/upadhi) — a `context` arrow to a holon does NOT clear it. Wire it to a kriya.
2. **Phenomenon with ahara/utpatti**: `nks_orient(lens="trace", focus=<seq>)` — lifecycle connected?
3. **Kriya**: actor, ahara, utpatti phenomena all exist?

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

## Starting triples & closure — carrier canon (#438)

Each род (type × given_as × genre) has **one axis that carries liveness** (U1); the others only qualify. The `nks_add_*` factories print the **canonical STARTING TRIPUTI** for the род and `nks_look` glosses the carrier per node — **read them; don't stamp a divergent triple.** The trap the canon fixes: **`virodha` does NOT uniformly mean "closed" — it is polarized by род (U3):**

- **risk** — `virodha` is the *live* mode: an active risk *stands* in virodha. It closes only via `visarjana` ∨ `addressed_by` ∨ `realized_as`, never by virodha itself.
- **kriya / karta / phenomenon(vollzug)** — `virodha` = **депрекация**: a live tension "we want to retire this", not a closure. Closes at `atita` (kriya/karta also `nashta`) ∨ `visarjana`.
- **samshaya / prati-paksha / hint** — here `virodha` *is* a closure (отказ).

And projected work is born `anagata` in the *project* triad, never the "ready" `pramanita/vartamana/upeksha` (that lies the deed already runs) — the **design** skill owns those starting modes (#53).

## Batch ordering (nks_batch)

**Load the factory schemas before a create-batch (#1003).** `nks_batch` wraps the `nks_add_*` factories but does **not** relax their discipline — every create op is validated against its factory's full schema. In a deferred-tool environment the batch loads without them, so composing a factory-create batch blind means learning each required param one `422` per round-trip. Before you batch: `tool_search` and read the schema of every `nks_add_*` you'll call. The **first** create of an unfamiliar node type is safer as a single factory call than buried in a megabatch — and don't pack heavy multi-paragraph descriptions into a megabatch.

Order within the batch:

1. Phenomena first
2. Kriyas second (referencing phenomena)
3. Cross-cutting arrows last

### Inline-arrow form

Inline `arrows` on the factories take the same canonical shape as `arrow_link`, with the new node as the implicit source: `{arrow_type, target, sense?, direction?, quantifier?, attrs?, <modes>}`. Only `arrow_type` and `target` are required; `direction` flips the orientation when the new node is the *target* rather than the source. The factory **validates the form strictly** (#981): an unknown key — e.g. the pre-rename `edge_type` (#512) — is rejected with a named error pointing at `arrow_type`, and a missing `target` says so. No silent acceptance, no raw TypeError — you learn the form before the first write, not by decoding a stack trace.

Two patterns, both first-class:
- **Inline `arrows`** — for edges that *originate at the new node* (a vimarsha's `vimarsha_of`, a phenomenon's `context`). Pass them in the create op.
- **Separate `arrow_link` with `temp:N`** — for edges *between two nodes created in the same batch*, or pointing *into* the new node. Reference each created node by its 0-based `temp:N` index; a `temp:N` must point at a lower-indexed create op.

`anga`/`anantara` on `nks_add_bianhua` are the exception — pass them as their own `anga=` / `anantara_after=` params, never in `arrows`.

## Scope

This skill: the act of writing. Not covered:
- **Design** → design
- **Weaving** → weaving
- **Methodology work** → methodology-work
- **Reading** → entry
