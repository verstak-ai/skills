---
name: inquiry
description: "Use this skill for the LIFE of a vimarsha and work with the FIELD of inquiry — not posing one (that's writing), but moving it through its lifecycle: anchoring, resolving, closing, parking, superseding, crystallizing, or attaching it to a bianhua. Triggers: 'разбери вимарши', 'поле вопрошания', 'закрой вимаршу', 'запаркуй вимаршу', 'разреши вопрошание', 'триаж вимарш', 'work the field of inquiry', 'close/park this vimarsha', 'resolve the question', or a high dangling-vimarsha count in orient. Distinct from writing (which poses a vimarsha — genre, name-question) and from assembly (the realm-wide field pass): this skill is the per-vimarsha and field work of carrying questions to a resolution. Needs the nks_* MCP tools."
---

# NKS Inquiry

A vimarsha is not a sticky note. It is a recorded *tension with reality* that must eventually be discharged — resolved, released, or crystallized into form. **writing** poses the question; **this** skill carries it through its life and works the field as a whole.

The symptom this skill fixes: realms accumulate **dangling** vimarshas — unanchored, unresolved, invisible to the agents who could discharge them. A field of free questions that never converges to understanding is a realm that thinks but never *learns*.

## 1. Anchoring is mandatory

An unanchored vimarsha is an **invisible** vimarsha — it surfaces in no `lens="vimarshas"`, propagates to no node. Every vimarsha needs two arrows:

- **`vimarsha_of`** → the node(s) the question is *about*. Without it the question floats.
- **`arose_from`** → the observation it was *seen from* (a node, an incident, a prior vimarsha). Without it the question has no origin to trace back to.

A vimarsha carrying an **expectation** (a `posed_to` arrow to a karta, anga to a bianhua) needs the anchor doubly: agents discover work by orienting on a *holon*, and neither `anga` nor `posed_to` scopes a vimarsha into anyone's contour — without `vimarsha_of` into the addressee's territory it is invisible there and will never be done. Minimum anchor — the holon where the expected work lives; better — the precise phenomenon or kriya within it. (The `unanchored` detector fires post-hoc; don't rely on it — anchor at posing time.) `posed_to` is the live **inbox edge** to a karta — so an addressee can poll "my open questions"; forbidden to a `pratibimba` (an image can't answer), and it never substitutes for `vimarsha_of`.

The mirror failure is just as real: `vimarsha_of` **without** `posed_to` on a question that *expects another doer to act* — anchored, visible in the territory, in no one's inbox; a delegation degraded to a note-into-the-void. If you expect someone to act, name them: the 能 who stewards the holon where the work lives (**writing** Decision 2b — find it via the `steward` arrow or `nks_search(q="", node_type="karta")`, never from orient's root-kartas showcase), never a `pratibimba`.

If you find a dangling vimarsha (orient flags them), the first move is almost always to anchor it, then triage.

## 2. The lifecycle — three outcomes

A vimarsha is *live* while it holds an open tension. It leaves the live field by exactly one of three doors:

| Outcome | What happens | How |
|---|---|---|
| **Resolution** | the question is answered by an acting/deciding graph node | `addressed_by` arrow (vimarsha → kriya, karta, or vimarsha) + volitive `visarjana` |
| **Death** | consciously dropped *without* an answer — it was wrong, moot, or superseded | volitive `visarjana`, with a reasoning line saying *why* it dies unanswered |
| **Crystallization** | the insight becomes a standing form | a `given_as` phenomenon `arose_from` the vimarsha, then volitive `visarjana` once the form faithfully carries it |

Plus two non-terminal moves:

- **Supersede** — a later question subsumes this one: `supersedes` arrow on the replacement, old → `visarjana`.
- **Park** — needed, not now: volitive `upeksha`, set **consciously**. Park is a *mode*, never `attrs.parked=true` (suppression is an anti-pattern).

> All of these are **modes and arrows**, never attrs. `nks_update(... volitive_mode=...)` moves the mode; `nks_arrow(action="link", ...)` creates addressed_by / supersedes / arose_from. The live arrow matrix permits `addressed_by` only to a kriya, karta, or vimarsha — never to a phenomenon. A standing-form answer is crystallization: phenomenon `arose_from` vimarsha, then close the vimarsha without inventing an addressed_by edge. Re-check `nks_arrow(realm="?")` before teaching or automating another target shape. Every update/delete/reconnect mutation needs the edge or node `basis_version` from a fresh `nks_look`; a new link does not.

When closure changes more than one member of the terminal triputi, send the final epistemic, ontic,
and volitive modes together in one `nks_update` with one fresh `basis_version`. Do not walk a node
through ceremonial intermediate updates such as `vartamana` and then `atita`. Create any required
answer edge/form first, then perform at most that one terminal node update.

Do not run a field-wide inquiry sweep merely because an implementation round is ending. Re-run the
affected old requirements' tests in the artifact; then, if a durable decision changed, make at
most one terminal batched graph handoff. Inquiry hygiene never consumes the verification tail.

This limit scopes **inquiry closure at the end of a round** — how many calls the field's own
discharge may spend. It is not a cap on the graph work a round owes elsewhere: structural modelling
separately required by `writing` or the repo's push ritual is its own obligation, batched into the
same handoff where possible but never waived because the closure quota was spent.

## 3. Genre sets the character of resolution

The genre you posed under (writing) determines what *counts* as discharging it:

| Genre | Resolved by |
|---|---|
| **samshaya** ("is this correct?") | removing the uncertainty — a decision, a found node, a check. visarjana once settled. |
| **risk** ("what could go wrong?") | mitigation kriya, or a grundsatz invariant, or *conscious acceptance* (→ upeksha with reasoning). On materialization → `realized_as` the sachverhalt that occurred. |
| **prati-paksha** ("I disagree / counter-thesis") | an evaluation-decision: the proposal is taken, reshaped, or declined — then visarjana. |
| **vyabhichara** ("case the rule misses") | a repair that removes the defect, or a refined rule. |
| **hetu-dosha** ("reasoning is flawed") | the argument is corrected or withdrawn. |
| **semantic-drift** ("term has drifted") | the term is re-fixed (正名) and the drifted usages reconciled. |
| **hint** ("future agent: read this") | read → executed → closed. A hint that's been acted on is done. Keep it thin — pointer, not payload: only what orient/lenses can't show; edit in place, close once its content has grown into the graph. |

If you can't say what would discharge a vimarsha, its genre may be wrong — re-check it (that's a **writing** decision).

## 4. Inquiry and transformation (bianhua)

A vimarsha is either **part of a transformation** or **free inquiry** — decide which, consciously:

- **anga of a bianhua** — its resolution *drives* a qualitative transformation the system is undergoing. Attach it: `nks_arrow(action="link", arrow_type="anga", source=<vimarsha>, target=<bianhua>)`. The vimarsha keeps its `vimarsha_of` (its real subject); `anga` is additional — it says "my resolution moves this transformation toward completion." Genre sets the character of involvement: samshaya removes a blocking uncertainty, risk protects the bianhua, vyabhichara fixes a defect in it, prati-paksha's evaluation moves it. **Attach to the existing forest** (`lens="bianhua"`); a single vimarsha never justifies a new bianhua — when no transformation fits and you're unsure, ask the user instead of creating one (a bianhua's name and telos are the owner's acceptance surface — assembly skill).
- **free inquiry** — a genuine open question not part of any transformation underway. Leave it free — but *consciously*, not by neglect.

A bianhua's anga are not only questions: `nks_search(anga_of=<bianhua>)` and the `lens="bianhua"` focus surface **kriya-carriers** beside the vimarsha-drivers. A vimarsha-anga is the *path* (its resolution moves the change); a kriya-anga is the *arrival* — the deed that constitutes it. Read its direction from the kriya's own triputi (no `anga_kind`): a **возведение** enters the fabric (`anagata→vartamana`, `chanda`/`adhimoksha`), a **депрекация** leaves it (`vartamana→atita`, `virodha`). So a transformation can be carried forward by a deed done, not only a question answered — a finished kriya stays anga'd as the arrival (отдача долга), and its `resolved` (from its triputi) counts toward the bianhua's progress.

Building the map *from* the field — clustering vimarshas into bianhua, ordering transformations — is the **assembly** skill. This skill decides each vimarsha's fate; assembly does the realm-wide pass.

## 5. Escalation — what is yours, what is not

| You decide it yourself (weave-near) | You carry it to the agenda (address) |
|---|---|
| anchoring a dangling vimarsha | refusing a proposal |
| closing an answered question | setting priority across questions |
| parking with conscious reasoning | choosing-otherwise against the recorded direction |
| attaching a driver to a bianhua | anything carrying **transcendent will** |

Decisions with transcendent will — refusal, priority, choosing-otherwise — are **not** the agent's. Surface them; don't resolve them to clear the field. (This is the same boundary the **assembly** skill draws between Сборщик and Мыслепрактик.)

## 6. The session must arrive at understanding

The principle that governs the whole skill: **a session should converge to bildung-understandings, not only spawn more vimarshas**. Triaging a field that ends with more open questions than it started — and no crystallized insight — has not landed. Before you close a field-work session, ask: *what did we now understand that we didn't?* Record it (crystallize — see outcome 3). A field that only grows is a realm that never learns.

## Acceptance

- The dangling field of a real realm can be triaged end-to-end *by this skill alone*, without reaching for the methodology text.
- Every triage outcome is expressible as exactly one move from sections 2–5: anchor, resolve, kill, crystallize, supersede, park, anga, or escalate.

## What inquiry is NOT

- **Not posing** a vimarsha — genre, name-as-question, arose_from at birth → **writing**.
- **Not the realm-wide map** — clustering vimarshas into bianhua, ordering, producing 形 → **assembly**.
- **Not suppression** — `visarjana`/`upeksha` are *conscious closures with reasoning*, never a way to silence a tension you don't want to see.
