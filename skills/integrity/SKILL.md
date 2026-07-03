---
name: integrity
description: "Use this skill for a transformation's integrity — right after a bianhua is created (telos accepted by the owner) or on request: 'integrity check', 'impact analysis', 'what will this change touch', 'проверь бяньхуа на целостность', 'что затронет это превращение', 'кого заденет' — and for the reverse claim-audit when a prose artifact claims graph-backed leverage: 'is this backed by the graph', 'claim audit', 'подкреплено ли графом', 'не театр ли'. Forward: propagate the telos, pose clustered «is this affected?» samshayas on the wavefront. Reverse: verify each structural claim is carried by real edges, report claimed-but-unwired. Distinct from assembly (map from the field) and design (paths from goals). Needs the nks_* MCP tools."
---

# NKS Integrity — the transformation's wavefront

A bianhua is a HOLISTIC change — cross-holon by definition. Its map shows what *drives* it (anga); it is silent about what it will *touch*. This skill makes the wavefront visible: every implicated part of the graph gets an explicit question — «is this affected? design the adaptation» — so the transformation cannot honestly close while its impact is unexamined.

Three entries:

- a bianhua was just created and its telos accepted by the owner (assembly step 5 and design Phase 4 hand off here) — the forward protocol below;
- the user asks to check an existing bianhua for integrity / impact — the same forward protocol;
- a prose artifact claims graph-backed leverage and must be verified — the **claim-audit** mode (Mode 3 below).

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
- nodes already under a prior «is … affected?» samshaya of this bianhua (`nks_search(q="", anga_of=<bianhua>)` and read the anchors).

A re-run of the integrity pass adds only the **new** wavefront — it never duplicates questions.

### 4. Cluster and present — the owner accepts

Group the remainder by *shared adaptation*: per estafeta, per holon, per kriya-family. One samshaya per cluster; a node gets its own question only when its adaptation is clearly distinct. A vimarsha legitimately anchors to several nodes — pass one anchor via `vimarsha_of` and add the rest with `nks_arrow(action="link", arrow_type="vimarsha_of")`.

**Present the candidate list to the user first** (AskUserQuestion when interactive), each with its why-implicated. Do not spray vimarshas unilaterally — the wavefront is a hypothesis until the owner nods.

### 5. Pose the integrity questions

For each approved cluster:

```
nks_add_vimarsha(genre="samshaya",
  name="<emoji> Is <X> affected by transformation «<bianhua>»?",   # pose in the realm's language
  vimarsha_of=<first anchor>, posed_by=...,
  epistemic_mode="anumita", ontic_mode="vartamana", volitive_mode="chanda")
→ extra anchors: nks_arrow(action="link", arrow_type="vimarsha_of", ...)
→ nks_arrow(action="link", arrow_type="anga", source=<new>, target=<bianhua>,
   sense="integrity front: the transformation cannot close until answered")
→ optional: nks_arrow(action="link", arrow_type="posed_to", source=<new>, target=<steward-karta>,
   sense="addressed to the steward of the affected contour")
```

The `posed_to` **arrow** (optional) addresses the question to the **karta** who stewards the affected contour — a svatantra/adhikarin who can answer; never a `pratibimba` (an image can't answer).

Description states: what the telos implies for these nodes, and **what counts as an answer** — «not affected» (close visarjana, with the reason recorded) or «affected» (design the adaptation — **design** skill; the new work `arose_from` this question).

### 6. Report

`nks_orient(lens="bianhua", focus=<seq>)` — the drivers now include the integrity front. Tell the user what was attached and what was consciously left out.

## Mode 3 — claim-audit: is the claimed carried by the graph

The forward pass asks "what will the transformation touch?". The reverse pass asks the mirror question: **does the graph carry what the prose claims?** Run it whenever an artifact *claims* graph-backed leverage — a rendered roadmap, a report, a summary, a telos citing capabilities: «direction D is driven by karta X», «D grows out of capability Y», «flow A feeds B», «the risk is covered». Node-grained detectors cannot catch this failure: each node is individually legal; the lie lives in the mismatch between text and structure.

1. **Extract the claims.** From the artifact, list every statement that asserts structure: ownership (a karta drives/owns X), figure-on-ground (a direction extends a capability), flow (A produces what B consumes), risk coverage («mitigated by…»), anchoring («tracked in the graph»).
2. **Verify each claim read-only.** Ownership → the karta carries real `actor`/`steward` edges to the named deeds (`nks_look`; a zero-edge karta is theater). Extension → a driving kriya reaches the capability via `upadhi`/`context` (`lens="topology"`). Flow → the estafeta exists (`lens="trace"`). Coverage → the risk carries `addressed_by` or a conscious-acceptance mode. Anchoring → the vimarsha has `vimarsha_of` into the claimed contour.
3. **Report claimed-but-unwired, pair by pair.** Each unbacked claim gets one of two fates, chosen with the owner: **wire it** (the claim was true but unrecorded — hand the missing edges to weaving) or **weaken the prose** (the claim was theater — the artifact overstates the graph). Never leave prose overstating the graph, and never wire edges solely to make prose true.

The audit itself writes nothing; it produces the claims × verdicts table. Same acceptance discipline as the wavefront: the owner picks each fate.

## Noise discipline

- One samshaya per cluster, not per node; a justification in every description — a question whose reader can't name the next move is noise by definition.
- Idempotent re-runs (step 3).
- **Never a new bianhua out of this pass.** If the wavefront reveals what looks like *another* transformation — that is an assembly observation: carry it to the user (a bianhua's name and telos are the owner's acceptance surface).

## What it is NOT

- **Not assembly** — assembly discerns the map from the field; integrity walks outward from one declared telos.
- **Not design** — integrity poses the «is this affected?» questions; clusters answered «affected» are handed to design.
- **Not weaving** — it does not repair structure; it marks where structure will have to move.
- **Not a tension detector** — it runs from a telos, not from structural signals.
