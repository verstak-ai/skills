---
name: writing
description: "Use this skill when writing nodes into an NKS graph — creating phenomena, kriyas, vimarshas, holons, or kartas. Triggers: 'запиши', 'зафиксируй', 'добавь узел', 'создай крию', 'create phenomenon', 'create entity', 'add to graph', 'nks_add', 'положи в граф', or any situation where the agent is about to call nks_add_phenomenon, nks_add_kriya, nks_add_vimarsha, nks_add_holon, nks_add_karta, or nks_batch with creates. Also triggers when the agent is unsure which node type to use, what given_as to pick, or which modes to set. Use this skill even for single-node writes — one wrong type propagates through the graph. Distinct from design (which plans paths from goals), weaving (which repairs existing structure), and methodology-work (which evolves methodology itself). This skill is about the act of writing: choosing the right type, name, modes, given_as, edges, and validating afterward."
---

# NKS Writing

You are about to write a node into the graph. Every node you write will be navigated by future agents, linked to other nodes, traced through estafetas. A wrong type, a lazy name, a mechanical mode — each one degrades the graph for everyone downstream.

Five decisions, in order. Do not skip ahead.

## Before anything: realm and cross-realm

Every NKS tool call requires `realm=<token>`. Confirm which realm you're writing into before the first call.

**Cross-realm edges do not work.** `nks_link(source_id="739", target_id="29")` resolves both seq numbers inside the current realm. If #29 in your realm is not the node you mean — you just created a wrong edge. For cross-realm references, use text in the description ("see methodology #29") — never edges.

## Decision 1: What type of node?

| If it… | Type | Tool |
|---|---|---|
| **does something** — transforms, produces, consumes | **kriya** | `nks_add_kriya` |
| **is acted upon** — thing, state, concept, seed, method, or rule that some kriya consumes / produces / conditions | **phenomenon** | `nks_add_phenomenon` |
| **asks a question** — doubt, risk, counter-thesis | **vimarsha** | `nks_add_vimarsha` |
| **draws a boundary** — separates inside from outside | **holon** | `nks_add_holon` |
| **names a role with a motivation** | **karta** | `nks_add_karta` |

A phenomenon does not exist on its own — it exists *for* a kriya (noema for noesis, methodology #18). If no kriya consumes, produces, or conditions it, you are about to write an orphan.

### Traps

**Phenomenon in kriya disguise.** "Token creation" is the act. "⚙️ Access token" is what the act produces. Test: does the name carry a before/after? → kriya. Does it name what *stands* through that before/after? → phenomenon.

**Kriya in phenomenon disguise.** "⚙️ Authentication flow" — if it transforms state, it's a kriya. A noun on a kriya is a smell, not a license.

**Karta vs phenomenon(vollzug).** "Reviewer" with motivation → karta. "Review process" (method, no motivation of its own) → phenomenon(vollzug).

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

### Description

- **Kriya**: pariṇāma — "Before: X. After: Y." If it reads like a task list, rewrite.
- **Phenomenon**: what it IS, and which kriyas consume / produce / condition it. If you can't name any such kriya, you don't yet know what you're writing.
- **Vimarsha**: the question. What would count as an answer?
- **Holon**: what principle separates inside from outside. nks_add_holon enforces 4 questions — answer them.
- **Karta**: motivation. nks_add_karta requires it as `motivation=`.

## Decision 5: Edges

Edgeless = orphan = invisible.

### Kriya (four questions)

1. **Consumes?** → `ahara` to phenomenon. ahara = DESTRUCTION. Just read → upadhi.
2. **Produces?** → `utpatti` to phenomenon. Can't name utpatti? Stop — you don't understand the kriya.
3. **Who acts?** → `actor` to karta.
4. **Context?** → `upadhi` to phenomenon. `attrs.mutable=true` if modified.

Plus: `next` (description = praśna — yes/no question). `contains` for sub-steps.

Realm-inlet kriyas: `attrs.boundary="init"` waives ahara requirement.

### Phenomenon

- `context` → holon. **Only phenomenon → holon.** Kriya/karta/vimarsha → holon is forbidden.
- `derived_from`, `specifies` → phenomenon-to-phenomenon lineage.
- Expectations depend on given_as — see `references/given_as.md`.

### Vimarsha

- `vimarsha_of` → node(s) this question is about.
- `arose_from` → observation origin.
- Genre determines lifecycle: risk → may `realized_as` sachverhalt. hint → read and close.

### Sense on edges

Every edge carries a description explaining WHY.

- `next` → praśna. ✓ "Path built — where can it break?" ✗ "Go to next step."
- `upadhi` → why this phenomenon matters HERE.
- `ahara` → what consumed and why.

## After writing

1. **Read the `CHECKS:` block the create response prints.** The factory self-validates — no separate call needed. Clean? Move on. Fix warnings first. Note: `not_orphan` on a fresh phenomenon is expected until a kriya picks it up (ahara/utpatti/upadhi) — a `context` edge to a holon does NOT clear it. Wire it to a kriya.
2. **Phenomenon with ahara/utpatti**: `nks_trace` — lifecycle connected?
3. **Kriya**: actor, ahara, utpatti phenomena all exist?

## Operational reminders

**reasoning.** Every write tool accepts `reasoning="..."`. Use it.

**basis_version.** Every `nks_update`, `nks_delete_*`, `nks_reconnect_edge` requires it. Read → write → re-read on conflict.

**Cross-realm.** Text references in descriptions. Never edges.

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

## Batch ordering (nks_batch)

1. Phenomena first
2. Kriyas second (referencing phenomena)
3. Cross-cutting links last

## Scope

This skill: the act of writing. Not covered:
- **Design** → design
- **Weaving** → weaving
- **Methodology work** → methodology-work
- **Reading** → entry
