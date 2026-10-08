# intake — letting external text into the graph

**Use when:** text from outside arrives — an issue, docs, a README, a post, a news item, someone else's analysis, a transcript — and must go into the graph, a case or another agent; decide which before writing (out of failure 3, the door's `The method fails in five ways`). Phrases: "ingest this", "seed the graph from these issues / docs", "add this issue", "record this post", "distribute this review across the cases", "intake". Not `writing` (a distinction you already hold), `assistant` (relaying the user's words verbatim), `feedback` (experience with the method), `align` (derived config); `product-roadmap` composes this method with a GitHub adapter.

External text is *shabda*: testimony, words whose existence lies outside the graph. It enters **as a claim, never as a fact** — mapped to the right node type, marked with provenance, deduplicated, anchored — and then checked. Text headed for a case or another agent is checked against the graph before the hand-over too (step 3). The line: **shabda → check → thesis**; the `given_as` flow is `ding` → `sachverhalt` → any. Text dumped in bulk as facts floods the graph with authoritative-looking noise and false tensions; systems grow, they aren't poured in.

**The source is an adapter; the discipline is one.** Don't weld a source into the discipline.

## The source adapter's contract

Fetching is the adapter's job (`gh`, a file read, a transcript). Per item it hands the core:

- **content** — the claim (title + trimmed body, or a fragment of prose);
- **form** — bug / feature request / RFC / design doc / fact from code / decision; the core maps by it;
- **provenance** — a stable back-link (issue URL, path + symbol, "conversation of 2026-…") for `arose_from`;
- **authority** — who said it and how directly it can be checked; it sets the epistemic mode (step 2).

No provenance → it doesn't get in. Cut along the distinctions the graph will carry, not the source's paragraphs: too fine gives many nodes, too coarse gives containers.

## 1. Map the form to a node type

Map by **form**, with judgement (propose → confirm), never as a blind import:

| External form | Node | Note |
|---|---|---|
| bug / breakage report | `risk` vimarsha, or a 🔥 `sachverhalt` incident if it already happened | a claim that something is wrong |
| feature / plan / direction | `bianhua` ("X becomes Y") + its leading vimarshas — **or** a `kriya` (`anagata`/`chanda`) if it is a single action | one wish is not a transformation: look for an existing one first (`methods/assembly.md`) |
| RFC / design discussion / open question | `samshaya` vimarsha | the node is the question itself |
| a stated fact about the system | `phenomenon` (`given_as` by what it is) | checked before it is affirmed |
| labels / tags | a hint for genre or holon, not a node | a routing signal |

Names, `given_as` and modes: `methods/writing.md`, at every write. This method decides *which* form the text takes.

## 2. Epistemic mode by kind of source — provenance separately

**`source_kind="shabda"` is provenance**, orthogonal to the **epistemic mode**. `kalpita` is not a blanket stamp; it is the mode of an **unchecked claim**:

| Kind of external text | Epistemic | Ontic | Why |
|---|---|---|---|
| issue / feature request / RFC / design doc | `kalpita` | by content (ahead → `anagata`) | not yet checked |
| source code read directly; a visible release tag | `pratyakshita` | `vartamana` | you witnessed it |
| retro / report of a real run | `pratyakshita` | `atita` | an observed past |
| briefing on a settled past | `pramanita` | `vartamana` | attested |
| an outdated document contradicting reality | `badhita` | was true, no longer → `atita`; never was → `vikalpa` | refuted; the record is kept — it teaches how not to think |

- **The owner's will is not shabda to be checked.** The graph owner's *decision, goal or telos* lands in its volitive mode (`chanda`/`adhimoksha`), witnessed (`pratyakshita`) — they are a reliable witness to their own intent. Supposed → observed is only for claims *about the world*.
- **`kalpita` is never permanent** — step 5 grades it.

Model: `attrs.source_kind="shabda"`; `given_as` by content (the document itself is a `ding`; name by content, not file: "⚙️ Briefing on the factory system prompt", not "factory-system-prompt.md"). A text carrying a doctrine → name the school and the limit of what it can claim.

## 3. Dedupe before writing — and before handing over

Before every insert: `verstak_semantic_search(q=<the claim as a phrase>, realm=…)` against the *ground*, not only an earlier backlog. Distance near zero → link or update, don't duplicate. The typical intake failure is N near-identical nodes, one per retold issue.

**Handing over is the same gate.** Before passing a review, feedback, email or retelling into a case or to a neighbour, check each point: search by meaning with several phrasings and read what turns up, per **entry** (`methods/entry.md`, `Answering a question from what is recorded`); the cases on the nodes found: `verstak_case(action="at", node=<node>)`. Each point gets one answer: "settled in #N", "open in #N with role X", "in progress in case #N", or "not in the graph — here is the question". Settled or in-progress points go back to whoever brought the text; only the open delta goes on, with links.

`verstak_case` doesn't search case text, so a word living only in a case isn't found by search: check the cases on the nodes found; no node for the subject → `verstak_case(action="at")` without `node` over the graph's open cases, and ask the lead of the matching one. Only then "not in the graph". "I'm only passing it on" doesn't waive the check: an unchecked point costs the recipient a move to say where it was settled.

## 4. Anchor every node to its origin

- **`arose_from`** → the provenance (issue, file, conversation). Provenance lives in this edge and `attrs`; who let it in, on whose word, goes in `reasoning` — the body carries the claim.
- The type's home: a vimarsha → **`vimarsha_of`** what it is about; a phenomenon → **`context`** its holon.

Anchor at intake, not afterwards (`methods/inquiry.md`, §1).

## 5. Check — and name the level

Intake ends when the claim is *checked*, and "checked" names its level (`methods/reality-audit.md`):

- **First level — shabda against the graph** (this method), read at three depths, each finding what the previous can't: `verstak_look` — recall (what is recorded); `verstak_orient(focus)` without a lens — awareness (what pulls: tensions, calling vimarshas, neighbours); `verstak_orient(lens="trace")` — reflection (where it travels). Agreement here is the text agreeing with the record, not confirmation by reality.
- **Second level — the graph against the world** — is not done here; witnessing on the canonical carrier carries it.
- **Shabda about an unreproducible past** can't be observed: testimony is checked against testimony — independent sources converge → `pramanita`; inference from documents while witnesses are silent → `anumita`; witnesses diverge → `vyabhichara`, not `badhita`. That is the kind's honest ceiling.

Then grade: **matches the graph** → raise the epistemic mode (`kalpita` → `pratyakshita`/`pramanita`) or leave it as confirmed; **contradicts the graph** → a tension, not a fact: keep it `badhita`, raise a `vyabhichara` (not `samshaya`), or record an incident; **the mode drifted** → update the record's mode.

## 6. Selectivity is a guard, not a convenience

Never the whole tracker, never "all the docs". Declare the slice (open / labelled, a date cutoff, a high-signal subset), cap the volume, and **say what was left out** — an unannounced slice reads as "let everything in". Selectivity, modes by source kind, dedupe and anchoring hold together; remove one and the guard falls.

## After writing

Read `CHECKS:` (orphan, missing anchor); a fresh phenomenon stays flagged `not_orphan` until a kriya picks it up — stitch it. Then `verstak_orient(lens="trace", focus=<seq>)` on the key phenomena: did the lifecycle connect? Next moment: the admitted items show a shared pattern → `methods/assembly.md`.
