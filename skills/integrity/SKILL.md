---
name: integrity
description: "Use this skill right after a bianhua is created (telos accepted by the owner) or when the user asks to check a transformation's integrity or impact: 'проверь бяньхуа на целостность', 'что затронет это превращение', 'обвяжи превращение', 'кого заденет', 'integrity check', 'impact analysis'. It propagates the telos through the graph's semantic closures — estafetas (lens=trace), next-threads, contains-subtrees, upadhi-consumers — finds kriyas/phenomena/holons implicated in the holistic change but not yet attached to the bianhua, and, after the user approves the candidate list, poses clustered samshaya-vimarshas («затронуто ли это?») anchored to the affected nodes with anga to the bianhua. Distinct from assembly (discerns the map from the field) and design (builds paths from goals): integrity walks outward from a declared telos and makes the wavefront of the change visible. Needs the nks_* MCP tools."
---

# NKS Integrity — обвязка превращения

A bianhua is a HOLISTIC change — cross-holon by definition (methodology #432). Its map shows what *drives* it (anga); it is silent about what it will *touch*. This skill makes the wavefront visible: every implicated part of the graph gets an explicit question — «а не затронуто ли это? проведите дизайн» — so the transformation cannot honestly close while its impact is unexamined.

Two entries, one protocol:

- a bianhua was just created and its telos accepted by the owner (assembly step 5 and design Phase 4 hand off here);
- the user asks to check an existing bianhua for integrity / impact.

## Protocol

### 1. Stand on the transformation

`nks_orient(lens="bianhua", focus=<seq>)` → telos, anga-drivers, computed scope.

**Seed set** = anchors (`vimarsha_of` targets) of the existing anga-vimarshas + nodes the telos names explicitly.

### 2. Propagate the wavefront — semantic closure, not radius

From each seed, walk the closure that carries its responsibility — one closure per seed, never N-hop from everything:

| Seed type | Closure | How |
|---|---|---|
| phenomenon | its estafeta, both directions | `nks_orient(lens="trace", focus=<seq>)` |
| kriya | its next-thread + its ahara/utpatti/upadhi phenomena | `nks_orient(lens="topology", focus=<seq>, arrow_types="next")`, then trace the phenomena |
| holon | contains-subtree | `nks_orient(focus=<holon>)` |
| vollzug / grundsatz | upadhi-consumers — who applies the method/principle that is about to change | `nks_orient(focus=<seq>)` neighborhood |

Plus one **semantic pass** over the whole realm: `nks_semantic_search(q=<the telos as a phrase>)` — conceptually-near nodes that structure misses.

Collect pairs `(node, why-implicated)` — the justification is load-bearing, it goes into the vimarsha description.

### 3. Subtract the already-covered (idempotency)

- anchors of the bianhua's existing anga-vimarshas — already in the field;
- nodes already under a prior «затронуто ли …?» samshaya of this bianhua (`nks_search(q="", anga_of=<bianhua>)` and read the anchors).

A re-run of the integrity pass adds only the **new** wavefront — it never duplicates questions.

### 4. Cluster and present — the owner accepts

Group the remainder by *shared adaptation*: per estafeta, per holon, per kriya-family. One samshaya per cluster; a node gets its own question only when its adaptation is clearly distinct. A vimarsha legitimately anchors to several nodes — pass one anchor via `vimarsha_of` and add the rest with `nks_arrow(action="link", arrow_type="vimarsha_of")`.

**Present the candidate list to the user first** (AskUserQuestion when interactive), each with its why-implicated. Do not spray vimarshas unilaterally — the wavefront is a hypothesis until the owner nods.

### 5. Pose the integrity questions

For each approved cluster:

```
nks_add_vimarsha(genre="samshaya",
  name="<emoji> Затронуто ли <X> превращением «<bianhua>»?",
  vimarsha_of=<first anchor>, posed_by=...,
  epistemic_mode="anumita", ontic_mode="vartamana", volitive_mode="chanda")
→ extra anchors: nks_arrow(action="link", arrow_type="vimarsha_of", ...)
→ nks_arrow(action="link", arrow_type="anga", source=<new>, target=<bianhua>,
   sense="фронт целостности: пока не отвечено, превращение не закрыто")
→ optional: nks_arrow(action="link", arrow_type="posed_to", source=<new>, target=<steward-karta>,
   sense="адресовано стюарду задетого контура")
```

The `posed_to` **arrow** (optional) addresses the question to the **karta** who stewards the affected contour — a svatantra/adhikarin who can answer; never a `pratibimba` (an image can't answer, #460).

Description states: what the telos implies for these nodes, and **what counts as an answer** — «не затронуто» (close visarjana, with the reason recorded) or «затронуто» (design the adaptation — **design** skill; the new work `arose_from` this question).

### 6. Report

`nks_orient(lens="bianhua", focus=<seq>)` — the drivers now include the integrity front. Tell the user what was attached and what was consciously left out.

## Noise discipline

- One samshaya per cluster, not per node; a justification in every description — a question whose reader can't name the next move is noise by definition.
- Idempotent re-runs (step 3).
- **Never a new bianhua out of this pass.** If the wavefront reveals what looks like *another* transformation — that is an assembly observation: carry it to the user (a bianhua's name and telos are the owner's acceptance surface).

## What it is NOT

- **Not assembly** — assembly discerns the map from the field; integrity walks outward from one declared telos.
- **Not design** — integrity poses the «затронуто ли?» questions; clusters answered «затронуто» are handed to design.
- **Not weaving** — it does not repair structure; it marks where structure will have to move.
- **Not a tension detector** — it runs from a telos, not from structural signals.
