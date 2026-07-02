---
name: intake
description: "Use this skill to bring EXTERNAL WORD into an NKS realm — the agent-facing form of шабда-intake (Нить 4 «Внешнее слово»). Triggers: 'впусти внешнее слово', 'засей граф из issue/доков', 'внеси issue в граф', 'intake', 'ingest issues into the graph', 'seed the realm from docs/README/conversation', 'bring external word into NKS', 'shabda intake'. Source-INDEPENDENT: GitHub issues, README/ADR/TODO, source code, a conversation, an RFC — the source enters through an ADAPTER, the intake discipline is one. The discipline: map each external item's FORM to a node type, set its epistemic mode BY KIND of source (kalpita only for unverified claims, pratyakshita for what you observe directly), mark provenance source_kind=shabda, dedup before writing, anchor each node to its source (arose_from), then verify by pratyaksha and graduate the mode. Distinct from writing (one node from a distinction you already hold), verstakify (projects derived config — no duplication of NKS), and product-roadmap (an applied skill that COMPOSES this layer with a GitHub adapter). Needs the nks_* MCP tools."
---

# NKS Intake

External word — an issue, a README, a chunk of source, a conversation, an RFC — is **шабда**: testimony with existence outside the graph. It is not yet yours. This skill brings it in **as a claim, never as a fact** — mapped to the right node type, marked by provenance, deduped, anchored, and then verified by direct observation (пратьякша).

The symptom this skill prevents: external word dumped *en masse as facts* floods the realm with authoritative-looking garbage and false tensions, breaking «the graph is a tension with reality» and «systems grow, not get built».

**Source-independence is the whole point.** The source is an *adapter*; the intake discipline below is one. `product-roadmap` composes this layer with a GitHub adapter; a future verstakify-засев or a docs-intake composes it with another. Do not bake a source into the discipline.

## The source adapter — its contract

Fetching external word is the adapter's job, not this skill's. Whatever the source (GitHub `gh`, file read, a conversation transcript), the adapter must hand the core, per item:

- **content** — the claim itself (title + trimmed body, or the prose chunk);
- **form** — what kind of utterance it is (bug / feature-request / RFC / design-doc / source-fact / decision), so the core can map it;
- **provenance** — a stable back-reference to the origin (issue URL, file path + symbol, "conversation 2026-…"), so each node can `arose_from` it;
- **authority** — who said it and how directly it can be checked (a drive-by issue vs. the owner's decision vs. code you can read now). This sets the epistemic mode (step 3).

If the adapter can't supply provenance for an item, that item is not intake-able — it would land unanchored and invisible.

## 1. Map the form to a node type

External word is heterogeneous; one item is not one node-shape. Map by **form**, with the agent's judgement (propose → confirm), never a blind import:

| External form | Node | Note |
|---|---|---|
| bug / breakage report | `risk` vimarsha, or a 🔥 sachverhalt-incident if it already fired | a report is a claim that something is wrong |
| feature / plan / direction | `bianhua` ("X станет Y") + driving vimarshas — **or** a `kriya` (anagata/chanda) if it's one deed | a single wish is not a transformation — locate the existing bianhua first (assembly), don't spawn one per item |
| RFC / design-discussion / open question | `samshaya` vimarsha | the question is the node |
| stated fact about the system | `phenomenon` (given_as by what it is) | subject to пратьякша before it's asserted |
| labels / tags | a hint to genre/holon, not a node | routing signal |

Naming, given_as, and the modes themselves are the **writing** skill's discipline — invoke it at each write. This skill decides *which* shape the external form takes.

## 2. Set the epistemic mode BY KIND — and mark provenance

This is the move agents get wrong. **`source_kind=shabda` is provenance** (this entered as external word) — orthogonal to **epistemic mode** (how well we know it). `kalpita` is *not* a blanket stamp; it is the mode of an **unverified claim**. By kind of source:

| Kind of external word | Epistemic | Why |
|---|---|---|
| issue / feature-request / RFC / design-doc | **kalpita** | a proposal/assertion, not yet checked |
| source code read directly, a release tag you see | **pratyakshita** | you witnessed it |
| retro / report of a real run | pratyakshita (atita) | observed past |
| briefing about a settled past | pramanita | confirmed |
| stale document contradicting reality | **badhita** | its ground has fallen |

Two consequences:

- **The owner's volition is not shabda-to-verify.** When the external word is a *decision, goal, or telos* from the realm's owner (the āpta for their own intent), it does not enter `kalpita` awaiting проверка — it lands at its **volitive** mode (`chanda`/`adhimoksha`), witnessed (`pratyakshita`). Only assertions *about a state of the world* take the kalpita-until-pratyaksha path.
- **`kalpita` is never permanent.** It is the entry state of the шабда→сверка→тезис thread; step 4 graduates it.

Model the node accordingly: `attrs.source_kind="shabda"`, the given_as the content warrants, the epistemic mode from the table.

## 3. Dedup before you write

Before each insert, `nks_semantic_search(q=<the claim as a phrase>, realm=…)` against the existing graph (the *ground*, not only the prior backlog). Near-zero distance = the realm already carries this — link or update, do not duplicate. Locate-before-write is mandatory: intake's failure mode is N near-identical nodes, one per restated issue.

## 4. Anchor every node to its source

An intake node with no origin is a rumour. Each one needs:

- **`arose_from`** → the provenance (the issue, the file, the conversation) — its traceable origin;
- its type's home: a vimarsha needs **`vimarsha_of`** into the contour it's about (the holon/phenomenon/kriya the claim touches); a phenomenon needs **`context`** → its holon.

Anchoring is the **inquiry** skill's law (an unanchored vimarsha is invisible) — honour it at intake time, not post-hoc.

## 5. Verify by пратьякша and graduate the mode

Intake is not done when the claim is written — it's done when it's been *reconciled with reality* (the сверка kriya). For each kalpita node, observe directly on the three levels: `nks_look` (recall — what's written), `nks_orient(lens="tensions")`/neighborhood (awareness — what pulls), `nks_orient(lens="trace")` (reflection — where it travels). Then graduate:

- **claim matches reality** → assert the thesis: `nks_update` the epistemic mode up (kalpita → pratyakshita/pramanita), or let it stand as confirmed;
- **claim contradicts reality** → that's a tension, not a fact: leave it `badhita`, or raise a `vyabhichara`/`samshaya` (сверка routes found counter-examples to vyabhichara, not samshaya), or fix the incident;
- **mode merely drifted** → update the recording mode.

A realm that ingests but never verifies is exactly the mass-dump failure with extra steps.

## 6. Selectivity is a guard, not a convenience

Never the whole tracker, never "all the docs". Declare the cut (open/labelled, a date bound, the high-signal subset), cap the volume, and **state what you dropped** — a silent cap reads as "ingested everything". Selectivity + the shabda modes + dedup are together the mitigation of the mass-dump failure; drop any one and the guard fails.

## After writing

Read the `CHECKS:` block each factory prints (orphan, missing anchor). A fresh intake phenomenon stays `not_orphan`-flagged until a kriya picks it up — wire it. Then `nks_orient(lens="trace", focus=<seq>)` on key phenomena: did the lifecycle connect?

## What intake is NOT

- **Not writing** — writing creates one node from a distinction *you already hold*; intake creates many from *external word*, with the шабда provenance and the сверка loop.
- **Not verstakify** — verstakify projects *derived config* (the AGENTS.md audit, "no duplication of NKS"); intake brings in *content*. Different acts; verstakify may *compose* intake to offer засев at the end of bootstrap.
- **Not product-roadmap** — that is an *applied* skill (GitHub adapter + present-state ground modelling + assembly + render) that **composes** this layer; intake is the base, not the pipeline.
- **Not a renderer / not a modeller of the present-state ground** — those belong to the consumer.
- **Not bound to GitHub** — issues are one adapter among many.
