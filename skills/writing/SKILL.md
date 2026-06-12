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

**bianhua is an assembly-level type, not a routine write.** You create one when a *set* of inquiries is really one qualitative shift the system is undergoing ("search becomes semantic", "becomes multi-jurisdictional") — that's the **assembly** skill's work, not single-node writing. If you can't name "the system will be X, which it isn't yet", you don't have a bianhua. See Decision 5 for its arrows.

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

Every description is **future-facing**: it states what IS — the resolved, the asked — not how it was discussed. No dates, no people's names (attribution lives in `attrs.posed_by`), no git refs (SHAs/branches/PRs), no DONE journals — history lives in `nks_history` and git. Done work changes the graph itself (modes, arrows, descriptions); it is not appended as a log.

## Decision 5: Arrows

Arrowless = orphan = invisible.

### Kriya (four questions)

1. **Consumes?** → `ahara` to phenomenon. ahara = DESTRUCTION. Just read → upadhi.
2. **Produces?** → `utpatti` to phenomenon. Can't name utpatti? Stop — you don't understand the kriya.
3. **Who acts?** → `actor` to karta.
4. **Context?** → `upadhi` to phenomenon. `attrs.mutable=true` if modified.
5. **Belongs to what?** → search for a candidate parent kriya before writing top-level (locate-before-write). `nks_semantic_search(q=<what this kriya is part of>)`; on a real hit, pass `parent_id=<seq>` (creates a `contains` edge from parent). **No coercion** — a wrong parent is worse than none (#435); when you can't honestly name the umbrella, stay top-level consciously. The most compressing axis is the one factories never forced — ask it yourself.

Plus: `next` (sense = praśna — yes/no question). `contains` for sub-steps.

Realm-inlet kriyas: `attrs.boundary="init"` waives ahara requirement.

### Phenomenon

- `context` → holon. **Only phenomenon → holon.** Kriya/karta/vimarsha → holon is forbidden.
- `derived_from`, `specifies` → phenomenon-to-phenomenon lineage.
- Expectations depend on given_as — see `references/given_as.md`.

### Vimarsha

- `vimarsha_of` → node(s) this question is about.
- `arose_from` → observation origin.
- Genre determines lifecycle: risk → may `realized_as` sachverhalt. hint → read and close.
- A **hint is a pointer, not a payload** (methodology #131): it carries only what orient and the lenses can't show — external-world state, chosen priorities, conventions. Work-in-flight belongs on the bianhua map via `anga`, not in a seed.

### Bianhua

- `anga` (part→whole): a vimarsha (or sub-bianhua) → the bianhua it *drives*. Pass `anga=<refs>` on `nks_add_bianhua`, or `nks_arrow(action="link", arrow_type="anga", source=<vimarsha>, target=<bianhua>)` later. The driving vimarsha keeps its own `vimarsha_of` — anga does not replace it. A bianhua with zero anga-vimarshas is an *empty transformation* — the factory warns.
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

## Batch ordering (nks_batch)

1. Phenomena first
2. Kriyas second (referencing phenomena)
3. Cross-cutting arrows last

### Inline-arrow form (workaround — bug #981 live)

Inline `arrows` on the factories currently has sharp edges (#981): an old key like `edge_type` is accepted then fails with `Invalid arrow type "undefined"` (it blames the value, not the unknown key); some forms leak a raw `Cannot read properties of undefined (reading 'trim')` TypeError. The canonical shape is the same as `arrow_link` — `{arrow_type, target, sense?, direction?}` — but until #981 ships, the **reliable** pattern is:

> Create the node **without** inline arrows, then add a separate `arrow_link` (with a `temp:N` ref to the just-created node) **in the same atomic batch**.

`anga`/`anantara` on `nks_add_bianhua` are the exception — pass them as `anga=`/`anantara_after=` (their own params), not in `arrows`.

## Scope

This skill: the act of writing. Not covered:
- **Design** → design
- **Weaving** → weaving
- **Methodology work** → methodology-work
- **Reading** → entry
