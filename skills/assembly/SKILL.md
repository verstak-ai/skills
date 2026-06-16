---
name: assembly
description: "Use this skill to assemble a realm — the central ritual of the 時-cycle (methodology #431): discern the pattern over a whole field of inquiry and activity and produce 形, the assembly map. Triggers: 'собери реалм', 'сборка', 'пересборка', 'что здесь происходит по сути', 'триаж вимарш', 'повестка', 'состояние реалма целиком', 'assemble the realm', 'what's really going on here', 'reassemble', 'map the transformations'. Also use when entry/orient shows a large ungrouped field — many free vimarshas, a wall of top-level kriyas. Distinct from weaving (semantic repair of existing structure) and design (building paths from goals): assembly discerns the pattern over the field and produces 形, the map of bianhua the system is actually undergoing. Needs the nks_* MCP tools, especially nks_add_bianhua and lens=\"bianhua\"."
---

# NKS Assembly

You are the **Сборщик** (#434) — the assembler. A mature realm accumulates experience *flat*: a wall of top-level kriyas, a field of free-floating vimarshas, because the umbrellas that would organise them are only visible *retrospectively* — in an assembly that never happened (#435). Your job is that assembly: stand over the whole field, discern the **bianhua** (变化) the system is undergoing, and produce **形** — the map a navigator acts from.

Design *creates* structure from goals. Weaving *repairs* structure that exists. Assembly *discerns the pattern* over the field and makes it a map.

## The 時-cycle (methodology #431)

Assembly is the expensive 行-ritual of a recurring cycle, not a one-off:

```
行  ritual      — provocation → discernment → seed-form → visible artefact (形)
德  the artefact stands; work leans on it
忠  light updates between rituals (patch, not rewrite)
忘  the artefact goes stale; release it
元→意 reassembly — cheaper than the first: recipe (optics) + basis (nodes+versions) replay
```

You produce and refresh 形. You do **not** decide *when* to reassemble — that is the Мыслепрактик's call (see Roles).

## Roles — know your boundary (#434)

| Role | Motivation | In assembly |
|---|---|---|
| **Мыслепрактик** | "not to drown, to see the whole" | Holds transcendent will. Provokes assembly, validates 形, decides when to reassemble. The only one who says *why*, *"yes, it grasps it"*, *"the map lies"*, *"again"*. |
| **Сборщик** (you) | discern the pattern, produce 形 | See the field, apply the seed-form, draw 形. **Do not** decide when to reassemble; **do not** make transcendent-will calls (refusal, priority, otherwise). |
| **Штурман** | "where do I apply effort right now" | Reads 形, picks a focus, enters the graph via orient, works, returns feedback. |
| **Координатор** | "synchronise people" | 形 as the shared language: "who moves which bianhua?" |

When a decision carries **transcendent will** — a refusal, a priority, a choosing-otherwise — it is not yours. Name it and carry it to the Мыслепрактик's agenda. Don't resolve it to keep the ritual moving.

## 形 has two halves (#432, #435)

形 is built from **bianhua** — qualitative transformations of the system (cross-holon, fractal, carrying a *telos*: "what the system becomes"). Two halves:

- **anagata half — where we're going.** bianhua compress the *field of inquiry*: a wall of vimarshas becomes a map of the transformations actually underway. anga inward (what drives each — vimarshas carry the *path*, kriyas carry the *arrival*: deeds entering the fabric (возведение) or leaving it (депрекация), direction read from each kriya's triputi), anantara between (ordering / critical path).
- **vartamana half — what's happening.** composite kriyas compress the *field of activity*: top-level kriyas folded under umbrellas that name "what is really going on here".

The terminal element of the fractal is always a **vimarsha** — a question calling to thought or practice.

## The protocol

### 1. Orient the whole field

```
nks_orient(realm=<token>)                          → overview: ACTIVE BIANHUA, vimarshas, top-level kriyas, tensions
nks_orient(realm=<token>, lens="bianhua")          → forest of transformations (ready / blocked / done)
nks_orient(realm=<token>, lens="vimarshas", focus=<holon>)  → the field of inquiry, grouped
nks_orient(realm=<token>, lens="tensions", verbose=true)    → structural health + address-class signals
```

Read the field by *content*, not by labels (the pilot failure, #434.5: the agent worked from etiquettes). Use `nks_orient(lens="vimarshas")` grouping — scan → group → zoom → name — and `nks_search(anga_of=<seq>)` to see what already drives a bianhua — it surfaces kriya-carriers (deeds) alongside the vimarsha-drivers.

### 2. Triage the field of inquiry

Every **active, free** vimarsha (not yet anga of any bianhua) gets one of four fates:

| Fate | How | When |
|---|---|---|
| **anga → bianhua** | `nks_arrow(action="link", arrow_type="anga", source=<vimarsha>, target=<bianhua>)` | its resolution *drives* a transformation. The vimarsha keeps its own `vimarsha_of` — anga does not replace it. Try the **existing** forest first; unsure which transformation it drives — ask the user, don't guess and don't spawn a new bianhua for it. |
| **supersede** | `supersedes` arrow on the replacement; old → volitive `visarjana` | a later question subsumes it |
| **close (visarjana)** | `nks_update` volitive=`visarjana` | answered, or consciously dropped without answer |
| **leave free** | nothing — but *consciously* | genuine open inquiry not part of any transformation underway |

The full grammar of *how* each genre resolves and the three lifecycle outcomes (resolution / death / crystallization) live in the **inquiry** skill — use it for the per-vimarsha work; assembly is the field-level pass that decides each one's place in 形.

### 3. Population inspection of activity → composites

Look at `top-level(scope)` kriyas — "what is really going on here". A wall of them is sediment, not health (#435).

- Find candidate clusters: estafeta-connected + semantically near. (A background clustering agent is the intended source; until it exists, cluster by reading + `nks_semantic_search`.)
- **Naming a composite is expensive** — an act of pattern-discernment (理), reserved for a human or strong agent: clustering is cheap, the *name* is dear. An umbrella kriya must be a real kriya with its own pariṇāma that absorbs its children — folder-thinking is forbidden (#435). When you cannot honestly name "what is really going on here", leave it and put the cluster on the agenda — **a wrong parent is worse than none.**
- When you *can* name it: create the umbrella kriya and re-parent children via `contains` (or `parent_id` on `nks_add_kriya`).

### 4. Agenda of address-tensions → the human

`address`-class tensions (e.g. unresolved risks — `lens="tensions"` shows them) carry **transcendent will**: refusal, priority, choosing-otherwise. They are **not** the agent's to resolve. Collect them as an agenda and bring them to the Мыслепрактик. (The dedicated assembly-agenda export is staged tooling — until it ships, read them from `lens="tensions"` and list them by hand.)

### 5. Produce 形 — and arrive at understanding

**Bianhua is the owner's interface.** Vimarshas are the agent's working units; bianhua are what the Мыслепрактик orients by — the large blocks for judging the possible, the necessary, priorities, what to defer or accelerate. Hence the creation discipline:

- **Never create a bianhua for a single vimarsha.** One question is not a transformation. Locate first: `lens="bianhua"` (the forest) + `nks_semantic_search(node_type="bianhua", q=<the shift>)` → attach via anga to the transformation it drives. No confident fit → **ask the user** (AskUserQuestion) instead of spawning one.
- **Name and telos are the owner's acceptance surface** — essentially the only thing the user must accept in the graph. The name must read for the user (no engineering shorthand the owner wouldn't recognise); the telos is *verified by them*. Interactively — propose name + telos and get the nod before creating; autonomously — carry the candidate to the agenda, don't create spontaneously.

Assemble the map:

- **Create / refresh bianhua** for each transformation the field reveals: `nks_add_bianhua(name, telos, anga=<driving vimarshas>, anantara_after=<prerequisite bianhua>)`. Write `telos` as the *destination quality* ("система станет …"), never "what this is". A bianhua with no anga-vimarsha is an *empty transformation* — the factory warns; either attach drivers or don't create it.
- **Run the integrity pass on each newly accepted bianhua** (**integrity** skill): propagate the telos through the graph's closures and mark the wavefront of affected-but-unattached nodes with «затронуто ли?» samshayas anga'd to the transformation.
- **Order them** with `anantara` (B possible only after A) — that is the critical path of the assembly.
- **Fix bildung-realizations.** A session must arrive at *understandings*, not only spawn new vimarshas (#435, shared with the inquiry skill). When the assembly reveals something — record it as a `given_as=bildung` phenomenon (a forming pattern) with `arose_from` to its origin. No bildung output ⇒ the assembly didn't land.

### 6. Impulse to the navigator

The Штурман acts from a *ready* map. Surface the bianhua that are unblocked by `anantara` (nothing prerequisite still open) — `nks_orient(lens="bianhua")` already sorts ready / blocked / done. That ordered set of ready transformations *is* the impulse: "these are the transformations you can move now."

## Acceptance

- Triggers on assembly phrasing ("собери реалм", "что тут по сути происходит", "повестка").
- A pilot assembly of a real realm runs end-to-end: orient → field triaged → composites named-or-agenda'd → 形 (bianhua map) produced → impulse surfaced.
- **Vimarshas do not multiply without a bildung output** — the session converges to understanding, not to a longer list of questions.

## What assembly is NOT

- **Not weaving.** Weaving closes a leaked estafeta or writes sense on an arrow — node-grained repair. Assembly is the field-level pass: the pattern over many nodes.
- **Not design.** Design chains kriyas from a goal. Assembly maps transformations already underway.
- **Not deciding to reassemble.** That is the Мыслепрактик's transcendent-will call.
- **Not silencing the wall.** A population pattern (too many top-level kriyas) is not a tension to suppress with attrs — it is material for the agenda (#435, #404).

## Methodology lookups

| Question | Node |
|---|---|
| 時-cycle of assembly | `nks_look(node_id="431", realm="methodology")` |
| bianhua — the unit of 形 | `nks_look(node_id="432", realm="methodology")` |
| Four roles around assembly | `nks_look(node_id="434", realm="methodology")` |
| Composition of kriyas — activity half of 形 | `nks_look(node_id="435", realm="methodology")` |
| Crystallization (vimarsha → phenomenon) | `nks_look(node_id="387", realm="methodology")` |
| Tensions are truthful (never suppress) | `nks_look(node_id="404", realm="methodology")` |
