---
name: intake
description: "Bring EXTERNAL WORD into an NKS realm — the agent-facing shabda-intake. Use whenever the user hands over ANY external text (a post, article, news item, forwarded message, quote, transcript) to be recorded into a realm, not only issues/docs/code. Triggers: 'запиши пост', 'внеси новость', 'добавь в летопись', 'record this post', 'log this news', 'впусти внешнее слово', 'засей граф из issue/доков', 'intake', 'shabda intake'. Source-independent: post, issue, docs, code, conversation enter through an adapter under one discipline — form to node type, epistemic mode by kind of source, provenance source_kind=shabda, dedup, anchor, verify. Distinct from writing (a node from a distinction you already hold), verstakify (derived config) and product-roadmap (composes this with a GitHub adapter). Needs the nks_* MCP tools."
---

# NKS Intake

External word — an issue, a README, a chunk of source, a conversation, an RFC — is **шабда**: testimony with existence outside the graph. It is not yet yours. This skill brings it in **as a claim, never as a fact** — mapped to the right node type, marked by provenance, deduped, anchored, and then verified by direct observation (пратьякша).

The symptom this skill prevents: external word dumped *en masse as facts* floods the realm with authoritative-looking garbage and false tensions, breaking «the graph is a tension with reality» and «systems grow, not get built».

**Source-independence is the whole point.** The source is an *adapter*; the intake discipline below is one. `product-roadmap` composes this layer with a GitHub adapter; a future verstakify seeding or a docs-intake composes it with another. Do not bake a source into the discipline.

## The source adapter — its contract

Fetching external word is the adapter's job, not this skill's. Whatever the source (GitHub `gh`, file read, a conversation transcript), the adapter must hand the core, per item:

- **content** — the claim itself (title + trimmed body, or the prose chunk);
- **form** — what kind of utterance it is (a report of breakage, a wish, an open question, an opinion, a stated fact, a decision), so the core can map it;
- **provenance** — a stable back-reference to the origin (issue URL, file path + symbol, "conversation 2026-…"), so each node can `arose_from` it;
- **authority** — who said it and how directly it can be checked (a drive-by issue vs. the owner's decision vs. code you can read now). This sets the epistemic mode (step 3).

If the adapter can't supply provenance for an item, that item is not intake-able — it would land unanchored and invisible.

## 1. Map the form to a node type

External word is heterogeneous; one item is not one node-shape. Map by **form** — kind of speech, not tracker category — with the agent's judgement (propose → confirm), never a blind import:

| External form | Node | Note |
|---|---|---|
| a report that something is broken | `risk` vimarsha, or a 🔥 sachverhalt-incident if it already fired | a report is a claim that something is wrong |
| a wish, plan, or direction | `bianhua` ("X becomes Y") + driving vimarshas — **or** a `kriya` (anagata/chanda) if it's one deed | a single wish is not a transformation — locate the existing bianhua first (assembly), don't spawn one per item |
| an open question | `samshaya` vimarsha | the question is the node |
| an opinion contesting an accepted account | `prati-paksha` vimarsha on the node it contests — **or** `vyabhichara` if it carries a counter-example | not a fact and not a question: a rival reading, anchored on what it argues against |
| a stated fact about the world | `phenomenon` (given_as by what it is) | subject to пратьякша before it's asserted |
| markers the source attaches (labels, tags, rubrics, hashtags) | a hint to genre/holon, not a node | routing signal |

Tracker words — bug, feature-request, backlog label — are one adapter's *rendering* of these rows, not forms of their own; a news item, a chronicle entry and a forwarded post map through the same six.

Naming, given_as, and the modes themselves are the **writing** skill's discipline — invoke it at each write. This skill decides *which* shape the external form takes.

## 2. Set the epistemic mode BY KIND — and mark provenance

This is the move agents get wrong. **`source_kind=shabda` is provenance** (this entered as external word) — orthogonal to **epistemic mode** (how well we know it). `kalpita` is *not* a blanket stamp; it is the mode of an **unverified claim**. By kind of source:

| Kind of external word | Epistemic | Why |
|---|---|---|
| someone's claim or proposal — an issue, a post, an article, an RFC | **kalpita** | asserted, not yet checked |
| source code read directly, a release tag you see | **pratyakshita** | you witnessed it |
| retro / report of a real run | pratyakshita (atita) | observed past |
| briefing about a settled past | pramanita | confirmed |
| stale document contradicting reality | **badhita** | its ground has fallen |

Two consequences:

- **The owner's volition is not shabda-to-verify.** When the external word is a *decision, goal, or telos* from the realm's owner (the āpta for their own intent), it does not enter `kalpita` awaiting verification — it lands at its **volitive** mode (`chanda`/`adhimoksha`), witnessed (`pratyakshita`). Only assertions *about a state of the world* take the kalpita-until-pratyaksha path.
- **`kalpita` is never permanent.** It is the entry state of the шабда→сверка→тезис (word → check → thesis) thread; step 4 graduates it.

Model the node accordingly: `attrs.source_kind="shabda"`, the given_as the content warrants, the epistemic mode from the table.

## 3. Dedup before you write

Before each insert, `nks_semantic_search(q=<the claim as a phrase>, realm=…)` against the existing graph (the *ground*, not only the prior backlog). Near-zero distance = the realm already carries this — link or update, do not duplicate. Locate-before-write is mandatory: intake's failure mode is N near-identical nodes, one per restated issue.

## 4. Anchor every node to its source

An intake node with no origin is a rumour. Each one needs:

- **`arose_from`** → the provenance (the post, the issue, the file, the conversation) — its traceable origin;
- its type's home: a vimarsha needs **`vimarsha_of`** into the contour it's about (the holon/phenomenon/kriya the claim touches); a phenomenon needs **`context`** → its holon.

**The provenance is a node, not an attribute.** Bring the artefact in as a **`ding` phenomenon** — the post, the document, the file, the URL — with `attrs {author, url/path, source_kind: "shabda"}`, and grow every node from that item `arose_from` it. Dissolved into its children's attributes a source has no lifecycle: it can't be argued with, can't go `badhita` when it turns out false, can't be found again when the next text from the same author arrives.

Anchoring is the **inquiry** skill's law (an unanchored vimarsha is invisible) — honour it at intake time, not post-hoc.

## 5. Verify by пратьякша and graduate the mode

Intake is not done when the claim is written — it's done when it's been *reconciled with reality* (the сверка kriya). For each kalpita node, observe directly on the three levels: `nks_look` (recall — what's written), `nks_orient(lens="tensions")`/neighborhood (awareness — what pulls), `nks_orient(lens="trace")` (reflection — where it travels). Then graduate:

- **claim matches reality** → assert the thesis: `nks_update` the epistemic mode up (kalpita → pratyakshita/pramanita), or let it stand as confirmed;
- **claim contradicts reality** → that's a tension, not a fact: leave it `badhita`, or raise a `vyabhichara`/`samshaya` (сверка routes found counter-examples to vyabhichara, not samshaya), or fix the incident;
- **mode merely drifted** → update the recording mode.

A realm that ingests but never verifies is exactly the mass-dump failure with extra steps.

### When пратьякша is unreachable

Observation of 1917 is impossible in principle, so by the letter above a `kalpita` claim about the past would never graduate. Check testimony against **independent sources** instead:

- **sources converge** → `pramanita`;
- **it follows from documents you can read now** → `anumita`, and it stays there — for the past anumita is terminal, not a way-station;
- **sources diverge** → `vyabhichara` (one carries a counter-example) or `prati-paksha` (a rival account), node left at the mode its evidence warrants. **Not `badhita`** — witnesses disagreeing is not a ground that has fallen.

Same branch for anything else out of reach: a closed system, a stated intent, a vendor's internals.

## 6. Selectivity is a guard, not a convenience

Never the whole source — not the whole tracker, not "all the docs", not the entire feed. Declare the cut (a date bound, a marker, the high-signal subset), cap the volume, and **state what you dropped** — a silent cap reads as "ingested everything". Selectivity + the shabda modes + dedup are together the mitigation of the mass-dump failure; drop any one and the guard fails.

## After writing

Read the `CHECKS:` block each factory prints (orphan, missing anchor). A fresh intake phenomenon stays `not_orphan`-flagged until a kriya picks it up — wire it. Then `nks_orient(lens="trace", focus=<seq>)` on key phenomena: did the lifecycle connect?

## What intake is NOT

- **Not writing** — writing creates one node from a distinction *you already hold*; intake creates many from *external word*, with the шабда provenance and the сверка loop.
- **Not verstakify** — verstakify projects *derived config* (the AGENTS.md audit, "no duplication of NKS"); intake brings in *content*. Different acts; verstakify may *compose* intake to offer засев at the end of bootstrap.
- **Not product-roadmap** — that is an *applied* skill (GitHub adapter + present-state ground modelling + assembly + render) that **composes** this layer; intake is the base, not the pipeline.
- **Not a renderer / not a modeller of the present-state ground** — those belong to the consumer.
- **Not bound to GitHub** — issues are one adapter among many.
