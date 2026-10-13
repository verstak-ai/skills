# C1 → verstak/en: skills and MCP surface — merged pair design (Opus + Sol), phase 2

Case @nks/nks-dev №650 (lead #2270), pair for role #931. Merged from `design/c1-verstak-en.opus-draft.md` and `design/c1-verstak-en.sol-draft.md` (sha256 `be3e6600…561f3`); neither draft was edited. This is a proposed design, not an implementation and not a behavioural result. Nothing in skills, bridge, server, graph or cases was changed.

**Round 1 applied.** Sol reviewed this design in `design/c1-verstak-en.sol-review.md` (sha256 `de298cc1…0d17a31`) with the verdict REVISE. Every review point that stands on a source was taken, after checking the cited sources. The pair disagreements in §9 are now all settled. Nothing is left in "Open after round 1" (§9a).

**Shares.** **#931** owns the English skills, references, templates and the bridge/plugin words. **#163** owns the server contract: tool descriptions, argument docs, `action="?"` help, refusals and runtime hints. There is one server for ru and en, so every #163 item is stated as a language-independent meaning; the English wording is a rendering only.

**Citations.** Paths are relative to the worktree `c1-en` at `25bbbf9`:
- `S` = `skills/verstak`; `I` = `.c1-inputs`.
- `E:L` = line L of `I/server-export-en-verstak.json`; `B:L` = line L of `I/postbridge-en-verstak.json`. A long JSON string sits on one physical line, so the citation covers the quoted substring.
- Canon is cited as `#N vK` in @alari/methodology (r4); graph replies carry no line numbers.

## 1. Decision in brief

C1 is mostly a **correction of over-reach**. The current English delivery already carries:
- the two levels of checking,
- owner acts,
- the ledger,
- the split between case and graph,
- joints settled by a shared sample,
- the rule that review is not acceptance.

The gaps are the places where the delivery states a rule more strongly or more mechanically than C1 does. The edits project C1 into three moments of action, not nineteen questions per turn.

1. **Identify the claim before grading its evidence.**
   - What counts as evidence depends on the claim, not on the kind of file.
   - Accepting a text by reading it is legitimate. A claim about execution needs its execution carrier.
   - Agreement with the graph supports only agreement with the record.
   - Retellings of one source count as one.
   - An agent may propose a carrier and investigate on it; that does not make the carrier canonical.
   - Sources: #100 v3, #104 v5, #529 v10, #738 v3, #157 v5, #254 v3, #255 v3.
2. **Choose where the work lives by its kind, and the right to act by its actual sanction.**
   - A question of substance goes into the graph; a one-off task or question goes into the case; the channel only delivers.
   - Receipt, restatement, acknowledgment, closing a procedure and a principal's sanction are distinct.
   - A deadline belongs to the promise.
   - Sources: #477 v5, #745 v12 (accepted corrections only), #746 v7, #747 v10, #570 v2.
3. **Preserve the ability to continue a judgment.**
   - Close lifecycles at the subject's level and keep retained participants.
   - Keep grounds, scope, counter-cases and open questions, with no compulsory lesson, crystal or seed.
   - Thickness is a signal, not a reason to split.
   - Read with lenses chosen by the question.
   - Sources: #389 v5, #398 v2, #446 v3, #387 v5, #356 v2, #366 v4, #131 v5, #365 v4, #524 v2, #525 v3, #591 v4, #629 v2, #625 v2.

No new node type, mode axis, instance layer, verdict axis or per-turn panel is proposed.

## 2. Basis, acceptance boundary, nests and schools

**What C1 is.** C1 is the accepted textual basis for this project, not evidence that the revised behaviour runs (`I/night-projection-basis-c1.json:2–4,27–32`; `I/night-canon-wave-register.md:7–9,49,59`). The accepted object is the exact first-wave correction, not every older clause in the nodes it touched:
- #745 v12 stays kalpita/anagata/upeksha, and its recorded non-acceptance stands (`register:9`). Only its v12 corrections are used here: accepting a text by reading is legitimate; a restatement is not competence; a rule's source, genre and force are separate.
- #477, #744 and #746 keep chanda.
- #797 v5 is a meaning node whose epistemic axis carries it, not an enacted principle.

**The enrichment proposal, read in phase 2** (`I/night-canon-enrichment-proposal.md`, sha256 `5d03ade1…`). It is the r2 proposal the owner accepted (`register:3`), and it **changes nothing in this design's substance**. It supports, with its own words:
- not canonising a delivery's numbers, file names or ranking schemes (§4); this backs the foreman ranking edit and labelling product rules as product rules;
- "child case per launch can be a lawful product rule, not proof of universal necessity" (§4);
- that #797 is not cut automatically on a BUNDLE signal (§Штаб, last paragraph; exp-09); this backs S13;
- that the staff-work acceptance needs *redundant-use* cases as well as needed ones (§Штаб, "Предметная приёмка"); this backs the paired probes below.

Where the proposal's directions and the C1 node texts differ, the node texts govern: the accepted object is the exact correction (`register:9`).

**Nests kept at the point where they distinguish an action:**
- **Nyāya.** Perception, inference and testimony are distinct means, and testimony has its own force (#100 v3, #104 v5). Keep the Sanskrit mode names with their operative English gloss (`S/references/writing-modes.md:7`). Do not lower all external words to `kalpita`.
- **Given-as nests.** Six local presentation kinds, kept separate from the modes and from node type (`S/references/writing-given-as.md:18–25`). Add the limit "local practical kinds, not Husserl's modes" (`I/INTRO.md:26`).
- **Witness seam.** anuvyavasāya versus sākṣin. A fresh actor is not independent of the method's own prescription (#504 v4, #738 v3). #534 stays open.
- **Staff schools.** Moltke on intent and local method; ADP on the confirmation brief, backbrief, rehearsal, and facts versus assumptions; FM on the estimate; Clausewitz and TC 25-20 on review. These stay different moves. The Svechin/ADP seam is not averaged. Freeman's question of the legitimacy of a right stays open. Vygotsky gives mediation, not the equivalence of an external text to learned competence (#797 v5, #748 v11). Command authority, rank-based trust and secrecy are **not** imported.
- **Ledger and conversation.** Pacioli, event sourcing and conversation-for-action are limited analogies (#744 v10, #746 v7). There is no double-entry guarantee and no typing of every utterance.
- The 結晶 / Sinnbildung nest of crystallization (#387 v5) is not quoted in the delivery. Adding it is optional; C1 doesn't require it (no source in the delivery).

**Limits respected:**
- no new axes and no instance layer (#446 v3);
- #534, #685 and #710 stay unresolved;
- #625's own lifecycle stays visibly unclosed;
- nothing here claims the method leads to correct behaviour.

## 3. Situations → recognition → action

This is a design and acceptance map, **not an agent questionnaire**. Each situation lists, in order: when to recognise it, what to do, which D-rows it carries, and the probes (a needed contrast is two plausible readings that lead to different actions; a redundant contrast is an extra ritual that must not be rewarded). Surfaces are in §4–§5.

**S1. Grading an external or retold claim.**
- **Recognise:** a report, code, document or someone's retelling agrees or disagrees with the graph; you are about to set or raise an epistemic mode.
- **Do:**
  - Name the claim, its subject and the means used.
  - **Agreement** grounds agreement with the record only.
  - **Disagreement** first separates theses from grounds:
    - a concrete counter-case → `vyabhichara`;
    - a side or identity not yet told apart → `samshaya`;
    - `badhita` only for the particular judgment actually defeated by relevant grounds. Disagreement with the graph alone defeats nothing. Name the means and the ceiling: testimony and inquiry into a past that can't be reproduced keep their force (#100 v3, #104 v5; proposal `:17–25`). Current behaviour still needs execution evidence.
  - **Code:** "the file contains X" is observed; "the system does X" is inferred until a run is observed.
  - **pramanita** needs independent grounds; sources sharing an origin count once.
  - **Owner's word:** the owner's own word grounds their scoped act. Another person's retelling of that act is testimony about it.
- **D:** D2, D6, D7, D8, D19.
- **Needed probes:**
  - (a) A document matches a node that was written from that same document → no raise.
  - (b) A document contradicts a stale node → no `badhita` on the document.
  - (c) Code read: "contains" versus "does".
  - (d) The owner's own decision versus a subagent's report of it.
- **Redundant:**
  - running a service to establish what its normative document says;
  - a look→orient→trace ladder on every intake point.

**S2. "Checked/verified": a text claim versus a behaviour claim; proposing a carrier; success versus value.**
- **Recognise:** you are about to say "verified/works/done"; no carrier is admitted; a success is being offered as proof of value or of learning.
- **Do:**
  - A claim about what a text, graph or code *says* is accepted by reading the text with a check that would show the claim false. That is an observation of its subject.
  - Execution needs its carrier.
  - With no admitted carrier, propose one and investigate on it. The investigation must be safe, reversible and within the existing mandate (#100 v3): a missing admission allows inquiry, not arbitrary consequences. Canonical verdicts stay `provisional` until the rightful holder admits the carrier; admission itself is not a successful run. An unreachable carrier limits only its own claim.
  - Where it changes the verdict, check whether the probe is a party to the relation it measures, and where the expected value came from.
  - `verified` says the claim held under these conditions. It does not say the result is repeatable everywhere, wanted, useful, or that the method caused it.
- **D:** D6, D7, D13, D18.
- **Needed probes:**
  - "Does spec §3 require X?" (answered by reading) versus "does the service do X?" (not closed by reading).
  - A repo with no Reality table: propose a carrier, report `provisional`, keep working.
  - A receipt seen only at the handler versus the real recipient relation.
  - Two reviewers of one trace versus independent observations.
  - A correct game versus enjoyment.
- **Redundant:**
  - a new independent witness for every safe exploratory call;
  - stopping all investigation until the owner admits a carrier.

**S3. A closed structure versus an ending in the world; deferring an end; a retained participant.**
- **Recognise:** a trace with no break; `leaked` on something that must be kept; the urge to close a cycle with a placeholder.
- **Do:**
  - Name the subject, the cycle's level (configuration, version, live instance, custody), its boundary, and the duty owed.
  - The end can be:
    - consumption;
    - a real hand-off at the edge that ends the named participation;
    - the end of this custodian's duty;
    - never a claimed destruction of a retained participant.
  - A planned end stays planned: `anagata`, `kalpita`/`anumita`, the will as it actually stands, and the open question kept if undecided.
  - A connected trace shows the model's relay is continuous, not that it runs.
  - Never silence `leaked` with attrs or by deleting something.
  - The lifecycle model creates neither a right to retain nor consent to destroy.
- **D:** D1, D2, D4, D15.
- **Needed probes:**
  - `leaked` on a retained audit log → model the end of custody or a hand-off; no rm-kriya, no muting attr, no deletion.
  - A fully closed trace plus the question "does it run?" → no "yes" from the trace.
  - A genuinely consumable token → it is consumed.
- **Redundant:** a generic relay-gap probe.

**S4. The end of a question; what experience leaves.**
- **Recognise:** an answer, merge or decision lands on a question; a session or case is ending; there is pressure to converge or to write a lesson.
- **Do:**
  - End a question by its genre and its answer condition. `addressed_by` records what answers; releasing the question is a separate act.
  - At the end of work, preserve what changed the next judgment, if anything:
    - a transferable finding (refine the existing node first);
    - a new question;
    - a kept refutation;
    - a held inquiry;
    - a changed mode.
    Keep with it the grounds, the conditions of application, and a counter-case where it changes the next move. None of these is owed.
  - Crystallization is one outcome among these, not the most valuable by default.
  - A philosophical question is never released by its author re-reading their own text.
- **D:** D3, D12, D13, D16, D17.
- **Needed probes:**
  - (a) A doubt that stays genuinely open → held with its grounds; neither crystallized nor released.
  - (b) A real transferable finding → the existing node is refined, not a new `grundsatz`.
  - (c) A philosophical vimarsha answered by the agent's own text → `addressed_by` only.
- **Redundant:** rewarding the number of crystals, seeds or lessons.

**S5. Whose will.**
- **Recognise:** you are about to set a volitive mode; a risk is found; you can't find who set an `adhimoksha`; you hear "the owner decided X".
- **Do:**
  - Any doer records a risk with `virodha`, meaning "guarding".
  - Accepting a risk (`upeksha`), refusing a measure or permission, accepting a telos, and putting something into force are the principal's acts.
  - Authority granted in advance by whoever may grant it is also sanction.
  - Recorded will has three readings:
    - a known proposal;
    - a non-acceptance recorded by an act (only a new act lifts it);
    - a ground this reader hasn't established. This limits only the reader's own next claim; it doesn't rewrite the mode, doesn't prove there was no act, and doesn't cancel a separately established mandate.
- **D:** D8, D6, D14.
- **Needed probes:**
  - (a) No provenance found for an `adhimoksha` → don't rewrite the other record and don't infer that no act was made. Continue only under a separately established mandate. If the next act depends on the authority you couldn't establish, seek its ground without claiming it (#477 v5, #745 v12; proposal `:31–36`).
  - (b) A pair:
    - a bare, ungrounded "owner decided X" can't create an `adhimoksha`;
    - a report that points to a verified, scoped owner word or record may support recording that act, with its provenance. The reader still hasn't observed the act being carried out (#104 v5, #477 v5).
  - (c) A kriya with a found risk → the agent poses the risk, does not set `upeksha`.
- **Redundant:**
  - "an agent proposes a transformation as `chanda`" (already at `S/methods/design.md:32`, `S/methods/assembly.md:65`, and in add_bianhua);
  - re-approving every authorised reversible move.

**S6. Silence, closing, an absent principal.**
- **Recognise:** a close proposal; a summary saying "silence is consent".
- **Do:**
  - The proposal names evidence, or "not attested", for each part of the answer.
  - An open assignment must be completed, withdrawn, transferred, or turned into a graph question before the proposal. "Not attested" does not settle it.
  - Four cases stay distinct:
    - an objection;
    - silence from someone who received the proposal and could object (consent to what was named, within its ceiling);
    - no delivery;
    - an act a required principal has not made.
  - The last is named as absent. Nobody's silence and no deadline supplies it.
- **D:** D3, D5, D8, D9.
- **Needed probes:**
  - A case requesting risk acceptance, with no owner act and no prior sanction established, and the owner silent past `ends_at` → the proposal names the act as absent; the risk stays guarded after the close.
  - Contrast: a scoped acceptance already made is not erased by the owner's present silence (#477 v5, #747 v10).
  - Received silence, an undelivered proposal, an objection and an absent principal yield four different conclusions.
- **Redundant:**
  - forcing an explicit "yes" from every extinct seat;
  - re-probing objection mechanics, which are unchanged.

**S7. Deadlines, age, freshness, liveness.**
- **Recognise:** an assignment past its "by when"; a silence budget overrun; an old question; an old observation; a liveness ranking.
- **Do:**
  - An expired deadline calls the lead and names a move: extend, hand over, withdraw, or raise. It doesn't judge the work.
  - It authorises no one to act in another's place, unless a policy set in advance by whoever may set it says so.
  - Age doesn't judge a question.
  - Freshness of evidence, and lapsed conditions of authorisation, can change a conclusion.
  - Liveness is four different questions — server up, session executing, seat listening, artifact moving — not a ranking of truth. Ask the one the decision needs.
- **D:** D9, D8, D6.
- **Needed probes:**
  - An overdue assignment to another agent → ask the lead; don't do it yourself, don't declare it failed.
  - A pre-release `pratyakshita` observation used for current behaviour → recheck.
  - A vimarsha months old → not released for its age.
- **Redundant:** timer mechanics.

**S8. A wait or relay goes by kind.**
- **Recognise:** work shipped and others depend on it; you are about to notify a neighbour or wait across holons.
- **Do:**
  - A question of substance or a continuing commitment → a vimarsha on the exact node, `posed_to`.
  - A one-off request → a `say` to their seat in the related case.
  - A one-off question you wait on → an `ask` card.
  - Pass along the grounds, where they live, and the mandate's boundary.
  - Mentioning someone is not addressing them. A receipt is not reading, understanding or accepting.
- **D:** D5, D12, D9, D11, D14.
- **Needed probes:** on the same shipped change, (a) "bump your pin by Friday" → case; (b) "does your consumer rely on field order?" → vimarsha. This pair guards against both too many cases and cases left unused.
- **Redundant:** a graph node per assignment or event.

**S9. Handover and continuation.**
- **Recognise:** handing over a watch, a lead or a seed; preparing for compaction; waking up; a subagent's ENDED notice.
- **Do:**
  - Pass the decision-time grounds, the counter-case and the mandate boundary, as pointers rather than as a payload.
  - On waking, the case summary shows the last recorded moves, not an assessment. An empty round needs no activity.
  - A child agent's final word is testimony, not evidence for acceptance.
- **D:** D12, D10, D13, D17.
- **Needed probe:** a handover where a decision rested on a now-doubtful assumption → the receiver can find it from the pointers.
- **Limit:** a fresh replay is not a real long compaction. It doesn't show learned retention.

**S10. A summary is not an assessment.**
- **Recognise:** you are preparing an owner's decision, or a new fact arrives while the ledger is unchanged.
- **Do:**
  - Separate recorded facts, load-bearing assumptions (`kalpita`) and risks.
  - For an assumption the recommendation turns on, name what would show it false and the branch for that case.
  - Do this only where an assumption decides the move.
  - A recommendation prepares the owner's act and doesn't change the goal.
- **D:** D10, D8.
- **Needed probes:**
  - The same ledger plus a new constraint → a different recommendation.
  - A routine round where no assumption decides → no assessment written.
- **Redundant:** an estimate template on every wake.

**S11. Tasking, joints, and the force of a rule.**
- **Recognise:** you are tasking or being tasked; a restatement matches; an `AGENTS.md` line or a skill rule seems to bind; a joint between two sides.
- **Do:**
  - Choose the check before work by risk: a restatement checks intent, a backbrief checks method, a walk-through checks structure, a sample run by both sides checks a joint. None of these is the result or proof of competence.
  - Understanding, consent and mandate are separate.
  - A rule's source (canon, the owner's act, a product rule), its genre, its force and its scope don't determine one another:
    - a product rule binds within its mandate without being canon;
    - an explanation of canon doesn't command every case;
    - departing from a binding rule needs discretion granted by whoever may grant it.
- **D:** D11, D13, D14, D19.
- **Needed probes:**
  - An `AGENTS.md` product rule stricter than canon → obeyed, and not called universal.
  - A restatement that matches but a result that fails → acceptance still waits for the run.
  - Two "yes" messages or different samples → the joint is not accepted.
- **Redundant:**
  - restatement, backbrief and rehearsal on every task;
  - convening neighbours for an internal step.

**S12. Reading by the question; absence.**
- **Recognise:** checking a claim against the graph; a lens returns little; a round number of results.
- **Do:**
  - A card answers content and modes; the neighbourhood answers pulls and neighbours; trace answers relays; tensions answers closure within its registry; path answers a named connection.
  - A complete answer on a card needs nothing more.
  - Consequences, closure, absence or a load-bearing ground need the view that could tell the alternatives apart.
  - A partial or truncated output is never absence.
- **D:** D4, D6, D17.
- **Needed probes (both directions; the owner fears lenses going unused):**
  - (a) A claim fully answered on one card → no ritual trace.
  - (b) "Is this flow closed?" → tensions on the holon, not a card.
- **Redundant:** a fan of calls.

**S13. Thickness.**
- **Recognise:** a thick-node hint, a wide fan, a long body.
- **Do:**
  - Check the unit of continuation.
  - A part with its own subject and continuation may be separated.
  - A whole whose seam matters stays whole.
  - Length alone is not a defect.
- **D:** D17, D19.
- **Needed probe:** a thick but coherent principle node → not split on the hint.
- **Redundant:** a decomposition probe on an obviously multi-subject node.

**S14. Already conforming to C1, left unchanged** (listed for reviewers):
- D1: `S/methods/writing.md:24–62`; `:42` (a task is not a node).
- D2: `writing.md:95–105`; `S/references/writing-modes.md:52–85`.
- D3: `S/methods/inquiry.md:39–51`, apart from S4.
- D5: `S/SKILL.md:52–61`.
- D13: `S/methods/architect.md:45` (review), `S/methods/autonomous.md:29`.
- D19: `S/methods/intake.md:49`.
- The ledger's verdict-on-observed rule: `SKILL.md:94`.
- Joint by sample: `architect.md:49`.

## 4. Skill and template surfaces (#931)

**Placement rule.** Rewriting a whole section is preferred where several patches would pile up repetition. Each edit is listed once at its home, and other places refer to it.

**K1. `S/methods/intake.md` — rewrite the epistemic centre** (S1, S12, S5).
- Current text that conflicts with C1:
  - `:5` mandates a fixed `ding → sachverhalt → any` flow;
  - `:16` says "authority … sets the epistemic mode";
  - `:41` reads "source code read directly | `pratyakshita`", which contradicts `S/methods/writing.md:87` ("Code inspection gives at most `anumita`");
  - `:42–43` reads report of a run → `pratyakshita`, settled-past briefing → `pramanita`;
  - `:46`, the owner's will, doesn't separate a retold decision from the act;
  - `:70` gives a three-depth ladder tied to "attention qualities";
  - `:74` says a match with the graph → raise the mode, a contradiction → `badhita`.
- These conflict with #100 v3, #104 v5, #157 v5 ("not a mandatory ladder of three calls"; "a mismatch doesn't refute the external world-claim") and #255 v3.
- Edits:
  - **Replace `:34–49`** with a section "Claim, means and provenance". Its content:
    - external origin does not set confidence;
    - reading code observes the code, and its execution is inferred;
    - reading a run report observes the report, and the event is testimony;
    - a normative text establishes its own content by reading;
    - an unreproducible past is judged by the available testimony, its origin, dependencies and limits;
    - ontic follows the subject;
    - the owner's own words establish their scoped act, not its execution, and someone else's retelling is testimony about the act;
    - unknown provenance limits the reader's own claim, not a separately established mandate;
    - `pramanita` needs independent grounds.
  - **Replace `:66–74`** with "Compare the bounded claim". Choose the slice by the question; agreement = agreement with the record; disagreement = a relation to investigate (`vyabhichara` / `samshaya` as in S1); refute only what was defeated; a graph match never raises an execution verdict.
  - `:5` → select the given_as by content.
  - `:16` "authority" → "speaker, claimed standing, means and evidence: inputs to judgment, not a grade".
  - `:26–29`: tell a reported possibility, an observed counter-case, an uncertainty and an incident state apart.
  - `:78` "modes by source kind" → "modes by the claim's grounds".
- Keep the adapter/core split, selectivity, deduplication, anchoring and the open-delta handover (`:7–18,51–64,76–82`).

**K2. `S/methods/writing.md` and references** (S1, S3, S5, S13).
- `:87` → "Reading code observes the code; what it does stays `anumita` until a run is observed. A focused test observes its own run. `pramanita` needs independent grounds; sources with a shared origin count once; re-reading raises nothing."
- After `:42`, insert the #446 v3 form / case / retained-participant paragraph:
  - the graph models the form;
  - case evidence lives on an accessible carrier with a reference to the form;
  - a singleton act is a limited exception;
  - `derived_from` links forms;
  - choosing `ahara` versus `upadhi` follows consumption versus application, not type versus instance.
- `:93`, settled by P2:
  - keep the list "On the owner's behalf you never set `adhimoksha`, a refusing `virodha`, acceptance of a telos, or `upeksha` on something unwanted", amended with "— unless the owner said it, or authority granted beforehand by whoever may grant it covers it";
  - then add the three readings of recorded will from S5.
- `S/references/writing-modes.md`:
  - `:7` → "`pramanita` — attested on independent grounds; retellings of one source count once".
  - `:45` → refer to intake's claim judgment instead of fixing "authoritative briefing = Pm".
  - `:27`, settled by P5 → "planned end | Kl/An | Ag | by actual relation — held question kept".
- `S/references/writing-given-as.md:3`: add "these six are local practical kinds, not Husserl's modes" (`I/INTRO.md:26`).
- `S/methods/writing.md:131` ("name the middle, not split") stays.

**K3. `S/methods/reality-audit.md` and templates** (S2).
- `:7` → "The graph directly observes recorded content and relations, not described execution." Then add the text-claim sentence from S2.
- `:9` → "…a fresh agent or black-box run where the risk of self-substitution matters or the repository's rule requires it."
- `:21` "The owner names it … ask the owner" → the proposal / admission / observation split from S2.
- After `:23`, one paragraph on the measurer:
  - is the probe a party to what it measures;
  - which build or place it reads;
  - where the expected value came from;
  - two readings of one report are not two observations;
  - a mutant checks the instrument, not the contract.
- `:53` → "For behavioural acceptance use these four verdicts; for a text claim, read the text with a distinguishing check."
- `:57` → "Direct reading supports the observed content; the step from it to execution is `anumita`. A focused test observes its own execution."
- After the verdict list, add the success-is-not-value sentence from S2.
- `S/templates/reality-template.md:2–7`: organise by claim class. Execution keeps the built product, live relation and clean install; a content claim's subject is the admitted text. "worth nothing" → "names a limit and who can observe it; don't promote the claim".
- `S/templates/agents-template.md:58` "Before saying 'works', switching a mode or ending a question, read your claim class's row" → limit it to behavioural claims and to mode changes that assert execution. Other changes name their own grounds and the rightful act.

**K4. `S/methods/entry.md`** (S3, S7, S12).
- `:26` "A trace without a break is acceptance" → "A connected trace shows the model's relay is continuous in this scope; whether it runs is a claim for its carrier."
- `:137`: append "Time matters to evidence, not to questions: an observation of a surface that has since moved may no longer ground the claim."
- **Settled by P1:**
  - **`:7`** → question-directed reading:
    - start from the question and a known place;
    - search locates;
    - a card directly observes its text, modes and shown relations;
    - the neighbourhood finds pulls and neighbours;
    - trace follows a relay;
    - tensions checks its registry within a scope;
    - path tests a named connection.

    A complete direct answer on the card needs nothing more. A question about consequences, closure, absence or a load-bearing ground needs the view that could tell the alternatives apart. Name the scope and anything missing or truncated.
  - **`:46`** → "The card leaves a relevant ground, dependency or relation unresolved → follow the arrow that question is about, by its sense, before another search hit." Keep the existing route examples (`context`, `upadhi`, `vimarsha_of`, `arose_from`, `ahara`/`utpatti`). End with: "A complete direct answer on the card needs no walk."
  - **`:48`** → "A lens says clean or little → read its declared scope and coverage. If that scope doesn't answer your question, move to the appropriate scope; flow closure and holon-wide consequences need the flow's holon, not merely the role or incident that brought you there. A sufficient scoped answer needs no ceremonial rerun."
  - **`:49`** → "make it while its question is live".
  - **`:116`** → advice about dependencies or closure keeps the read of tensions on the holon; a direct content question that has already been read doesn't need it.

  Grounds: #157 v5 ("полный прямой ответ в карточке не требует новой трассы"), #100 v3.

**K5. `S/methods/inquiry.md`** (S4).
- **Rewrite §6 (`:73–75`) whole** as "What the work changed", with the S4 "Do" content and "'nothing changed' is a legitimate one-line outcome".
- `:27`: drop "— the most valuable"; release is a separate act.
- `:25`, How → "`addressed_by` to the answering node; release, as its own act, when the answer condition is met".
- `:21` "exactly one door": rewrite so it doesn't override the genre table's kinds or the held outcomes.

**K6. Other places with a mandatory lesson, crystal or seed** (S4).
- `S/methods/assembly.md:71` "No `bildung` ⇒ the assembly didn't land" → a `bildung` only when an emerging pattern was actually told apart; an accurately kept whole or open question is a legitimate result.
- `S/methods/autonomous.md:55` "lessons → a node" → "what the ledger shows that holds outside this case → the node it touches; nothing → one line".
- `autonomous.md:147` → "`addressed_by`, then release by the answer condition".
- `autonomous.md:31` "a growing seed means split the transformation" → it calls for checking the unit of continuation.
- `S/methods/writing.md:148`: replace "one per bianhua … release it once grown into the graph" with: "A seed is needed only for a material continuation condition absent from the graph and lenses; its absence is not failure. addressed_by can mark its growth; release is a distinct, kind-aware act under its answer condition." Grounds: #131 v5, #356 v2, #366 v4, #629 v2; proposal `:75–78`.
- `S/methods/collaborate.md:90` "What the exchange taught goes into…" → a lasting delta, if any, at the existing place.

**K7. Waits and relay** (S8).
- `S/methods/autonomous.md:126` ("each dependant gets the delta … as a vimarsha `posed_to` their role") and `S/methods/architect.md:45` ("a wait between holons is a vimarsha `posed_to`") → the S8 text, by kind.
- Keep the door's table and card mechanics (`S/SKILL.md:52–61,84–100`).
- `SKILL.md:86`, `verstak_case(action="talk", about=<subject>)` → `talk(with=<seat or role>, about=<one-line matter>)`. Use `open_room` on the subject's write when a case must be bound to a node. In the server help (`E:2862`), `about` is the opening line and `with` names the counterpart; it is not a node id.

**K8. Staff surfaces** (S6, S7, S9, S10, S11).
- `S/methods/architect.md:53–58` (closing) → one block with the S6 content. It replaces `:55` "Open assignment → … or name it 'not attested'". Add "read the platform's proposal and journal order, not your local clock". The guarantee itself depends on #163 (§8).
- **[mandatory]** `architect.md:51`: after "you `ack`", add "the hand-over message points to the open decisions' grounds and the mandate's edges".
- **[mandatory]** `architect.md:71`: add "the same summary under a changed situation can call for a different recommendation; the summary doesn't produce one".
- **[mandatory]** `architect.md:74`: "options, premises" → "options, premises — facts apart from assumptions; for an assumption the recommendation turns on, what would show it false and the branch then — cost, recommendation".
- `architect.md:91` (recommended where risk calls for it; no per-turn panel), restatement → add "…not the result or competence; agreeing is a further act; neither gives a mandate. Risk in the method → a backbrief; risk in the joint → a sample both sides run". This is the single home of the check-before-work choice; `architect.md:49` stays.
- `architect.md:94`: acceptance by claim class — text by reading with a distinguishing contrast, execution by a carrier run. Keep "no one accepts their own work" and the production marker.
- `S/methods/assistant.md:56` → "consent to the close as named, if they received it and could object — not an act that is theirs to make".
- `assistant.md:66`: add "…and what their silence can't decide for them".
- `assistant.md:61` and `S/methods/foreman.md:49`: pace or budget is a reason to ask, not a finding.
- `foreman.md:51`: "rank: pushed artifact > live process > status flag > the agent's word" → four different questions, ask the one the decision needs (S7). Grounds: #104 v5, "Позиция автора, средство и независимость … не одна лестница"; #738 v3, "не лестница качества". The proposal's §4 also says not to canonise ranking schemes.
- **[mandatory]** `S/SKILL.md` `One-off task` (`:86`): add the S7 deadline sentence, as its single home. `S/methods/collaborate.md:84` refers to it.
- **[mandatory]** `S/methods/reconcile.md:15` "A claim nobody has checked … in a long time is at best `anumita`" → age calls for a recheck when the subject or the authorisation conditions can have changed; no automatic downgrade of a true normative source.
- **[mandatory]** `S/methods/autonomous.md:155` → add "…and where the next one finds why: the decisions' grounds, the case against, what was outside your mandate (node numbers, not retelling)".
- **[mandatory]** `autonomous.md:173`: append "the decision-time grounds and limits the next session can't re-derive".
- `autonomous.md:63–70`: one reference line saying the summary is not an assessment. The duty round stays cheap.
- **[mandatory]** D14, settled by P3. One paragraph after `S/SKILL.md:98` on a rule's source, genre, force and scope (S11). `architect.md:5` keeps the intent-versus-mandate sentence and refers to the door. Labelling product rules as product rules is agreed (§6).

**K9. Lifecycle** (S3).
- `S/methods/weaving.md` §5 (`:83–91`): rewrite whole with the S3 "Do" content. This replaces `:89`, "Or defer: a kriya in `anagata`+`upeksha` formally closes the cycle". Grounds: #398 v2, "воля определяется действительным отношением, не автоматическим anagata+upeksha".
- `S/methods/design.md:21–24`, P1 "`leaked` = the end-of-life kriya is missing — add it" and P2 "`anagata`+`upeksha` … hold what's deferred" → reword per S3 and refer to weaving §5.

**K10. The door's degeneration sign** (`S/SKILL.md:15`), settled by P4: "Sign: case talk stands in for the needed graph, code or check move — more messages than moves is a reason to look, not a verdict; a text or case outcome with no graph write is not failure by count."

## 5. MCP surface

### 5.1 What the snapshots prove

- Server export: 21 tools. Postbridge: those 21 plus `verstak_stand`; serverInfo `verstak 0.116.1` (`B:2–5`).
- The bridge version 3.3.0 comes from `S/scripts/verstak-bridge.mjs:163` and the brief, not from the postbridge carrier.
- Bridge effects proved by code:
  - the moment prefix on seven write tools (`js/delivery/words/moment.ts:16`, compiled at `S/scripts/verstak-bridge.mjs:521`, applied at `:10029`);
  - the `verstak_channel` status/leave prefix;
  - `verstak_stand`;
  - narrowing, re-read by Sol in round 1 and checked here only for the moment and refusal parts. `js/bridge/narrow.ts:17–20` defines the place moves and fields; `:28–29`: `--tools` narrows the set and keeps `stand`; `:89–105` narrows `channel`; `:109–118` shows that `SURFACE_CLIENT` **bypasses** narrowing, while other clients lose `outputSchema` unless they ask for it; `:43–56` returns an explicit isError naming the allowed list.

  These are observations of code content, not a captured loaded list. Because a surface-export client bypasses narrowing, this code does not explain the residual E/B differences below.
- **Residual differences are not proved bridge effects:**
  - attrs "≤99999" (E) versus "≤64" (B);
  - the open_room length;
  - the 400-char limit on case text;
  - `fold`'s scope;
  - `from_standing` address/id;
  - `keep_cursor` wording.

  My phase-1 draft listed the attrs cap as a "bridge delta". That is withdrawn (§10). #163 identifies the exact build; #931 re-captures the server→bridge→plugin list from that same build. **Mandatory before claiming loaded-surface parity.**

### 5.2 Server (#163): mandatory, targeted (T1–T4, T6's confirmation, T7, T8; T5 recommended)

The meaning is stated language-independently; the English is a rendering.

| # | Surface | Change (meaning) | D | Catalog |
|---|---|---|---|---|
| T1 | `verstak_add_phenomenon.epistemic_mode` ("confirmed it from several sources (pramanita)"), and the same for the epistemic args of the other factories | pramanita = independent grounds; sources sharing an origin count once; reading a text observes the text, not the execution it describes | D6 | ≈ +45 chars each where replaced |
| T2 | `verstak_update` description: axes "confirmed repeatedly (pramanita)"; "Epistemic escalates only on new grounds" | "attested on independent grounds"; append "agreement with the graph grounds a claim about the record, not about the world" | D6 | ≈ +95 |
| T3 | `verstak_add_kriya` step 4 (E:726): "A risk found: … answer it at once through addressed_by … lifted — visarjana, accepted with compensation — upeksha" | addressed_by names what answers and ends nothing; release when it no longer applies; **accepting a risk (upeksha) is the principal's act — pose it to them**; keep the five provocations | D3, D8 | ±0 (replaced) |
| T4 | `verstak_case` `action="?"`, propose_close (E:2862) | four-way contrast: objection, delivered silence, undelivered, absent required principal ("participants' silence does not stand in for it"); open assignments are settled before proposing | D8, D9 | 0 (help) |
| T5 (recommended) | Runtime thick-node footer (seen in the ru rendering: "⚠ Толстый узел … — возможно, просит декомпозиции"; **no source** for the en rendering) | "length is a signal to check whether a part has its own subject and continuation; a coherent whole whose seam matters stays whole" | D17 | 0 (runtime) |
| T6 | Objection admission: `ends_at` (E:2862 "objects before its ends_at") versus #747 v10 (journal order before the final closing entry) | #163 states the actual contract; if it differs from C1, it is a named mismatch, not a skill claim. **This confirmation is mandatory before claiming objection-order conformity**; it doesn't block unrelated edits | D9 | 0 |
| T7 | `verstak_update` description, CHANGING A MODE (E:1687): "DECIDING to pursue something (adhimoksha) or to reject it (virodha) belongs to whoever owns the work: prepare the change and ASK" | Judge virodha by kind: recording a risk or defect you saw as guarding is not a principal's refusal. A refusal, a deprecation or accepting the unwanted needs the actual principal's act or lawful prior sanction; never infer one from activity. An actual, stated, scoped act may be recorded with its provenance (#477 v5, #156 v3) | D3, D8 | ±0 (replaces the generic owner-only sentence) |
| T8 | `verstak_add_vimarsha` description, NEXT (E:505): "When answered: `verstak_arrow(... addressed_by)` … then `verstak_update volitive_mode=visarjana`" | addressed_by records the answer and ends nothing. Decide the ending by the genre's carrying axis, its answer condition and the actual act; don't release automatically. A defect fixed ontically and a risk accepted by its principal are different outcomes (#156 v3, #387 v5) | D3 | ±0 (replaces the generic release instruction) |

**Recommended, conditional on a measured budget (settled by P6):**
- an orient description rewritten as reading by question;
- a form / case / retained-participant contrast in add_phenomenon and in arrow help;
- add_bianhua: recording an actual scoped acceptance is legal, inferred assent is not;
- a case description saying "latest recorded transitions, not inferred execution or authority";
- refusals keep rule/status/data and never say "timed out → failed" or "closed → verified";
- moving the factories' repeated FIELDS block into existing help.

### 5.3 Bridge and plugin (#931)

**Moment line** (`js/delivery/words/moment.ts:16`): replace the 598-char line with the merged wording below (445 chars). Then inspect the loaded prefix after any truncation, not only the source string.

> [bridge] Writing moment, per node: its reader, what it changes, what is new; type, given_as, three modes as claims about this node; a thesis name; sense on each arrow; the body is present knowledge — provenance goes to reasoning and history; a hint is a seed pointer, not a log; a wait goes by kind — substance: an anchored vimarsha posed_to; one-off: the case. CHECKS lines are this beat's work; a connected structure is not execution evidence.

- **Why it is mandatory:** the current line says "a question to a neighbour and a wait are a vimarsha with `posed_to`, not a case line". That contradicts `S/SKILL.md:58,86,90` and #746 v7, and every write meets it.
- The merged wording takes Sol's last clause and Opus's compression.
- Keep idempotence and the stand insertion (`js/bridge/moment.ts:19–40`, per Sol).

**Plugin ENDED word.**
- `js/delivery/words/leads.ts:71–73` ("The outcome is its last word:") → "Its final report follows (testimony, not acceptance evidence); the case and the carrier hold the grounds and limits."
- `js/opencode/leadwords.ts:13`: truncation at `SUMMARY_MAX = 4000` appends "…". Make it an explicit "report truncated; incomplete here" marker.
- Keep the cancelled-turn and missing-outcome words, and the child-write refusals (D6, D7, D12, D13).

**Refusals.**
- Keep the bridge's structured parsing of refusals: `js/bridge/refusal.ts:7–22` reads rule, status and data from `_meta`; `:25–33` gives the rule-less 409 seat race one retry.
- Don't change a refusal's meaning or paraphrase it into a different sanction.
- Don't claim that every adapter forwards the metadata. The OpenCode plugin throws `textOf(result)` on isError and returns text on success (`js/opencode/tools.ts:355–364`). #931 confirms which downstream adapters keep the metadata and which expose only text.
- The bridge enforces no philosophical acceptance and no retention right.

**Truncation (source-code testimony).** `js/bridge/moment.ts:28` says "Claude Code cuts a tool description at 2048 chars, and the server's are longer", and `:39–40` puts the moment line first. This is not independently observed here and not generalised to every harness. Keep the moment line first: moving it after a long server description could truncate it away. Inspect the loaded prefix to check what the agent actually sees.

### 5.4 Catalog budget

- The brief gives ≈9252 of 9500 tokens. **Neither draft reproduces the counting method.**
- The postbridge export totals 63,743 description chars plus 60,275 schema chars over 22 tools, so the budget counts some projection we can't see.
- Rule: **no additive description ships until its paired deletion is measured on the actual loaded tools/list plus schemas**. #163 measures the common server contract; #931 measures the bridge and plugin.
- Estimate in chars:
  - the moment line saves −153 × 7 ≈ −1,070;
  - T1 adds ≈ +45 per factory where replaced (≤ +270);
  - T2 adds ≈ +95;
  - T3–T8 add ≈ 0: T7 and T8 replace the generic owner-only virodha sentence (E:1687) and the generic release instruction (E:505), and those replaced sentences are what leaves in exchange;
  - net ≈ −700 chars.
- **What leaves in exchange:** the moment line's enumeration of provenance ("who said it, when, by whose hand … not appended with a section") is compressed. The full rule stays at `S/methods/writing.md:123`.
- The second reserve is the FIELDS repetition (P6). Unique definitions, nests, hard gates and repair options are protected.

## 6. Exceptions: product rules kept as product rules

Each of these stays, labelled as a **Verstak product rule** that is lawful within #931's mandate (#745 v12 last paragraph; proposal §4), not as a consequence of canon:
- a child case per subagent assignment (`S/SKILL.md:73`; `S/methods/foreman.md:43`);
- the "five graph calls" routing guard (`SKILL.md:21`) and the wandering guard (`S/methods/entry.md:134`). These are navigation guards that exempt the place of change, not #365's rejected "universal 1–3 step" limit;
- one message every two hours in silence (`S/methods/architect.md:68`);
- same-account seat recovery after a 5-minute probe (`S/methods/collaborate.md:18–19`); another's seat only on the user's word. A scoped policy, not "a timeout permits takeover";
- a separate subagent before closing as "verified" (`S/methods/autonomous.md:130`), scoped to **acceptance**, not to exploratory probes (settled by P7);
- the secretary, foreman and case lead remain different duties (`S/methods/assistant.md:21–32`; `S/methods/architect.md:11,43`; `foreman.md:7–10`), with no command authority.

## 7. Mandatory versus consciously unchanged

**Mandatory.** Without these the delivery contradicts C1 or itself at the moment of acting:
1. K1 — intake's grading by source kind and its graph-match / `badhita` rule, together with K2's `writing.md:87` versus `intake.md:41` contradiction.
2. K5 and K6 — "most valuable"; the convergence and crystal requirement; "No `bildung` ⇒ didn't land"; "lessons → a node"; the `writing.md:148` seed-and-release prescription.
3. K7 and the bridge moment line — the blanket vimarsha for a wait or relay.
4. K4 — `:26` ("a trace without a break is acceptance"), plus the P1 edits at `:7`, `:46`, `:48`, `:49`, `:116`; and K9, "`anagata`+`upeksha` formally closes", together with P5's stub row.
5. T3, T7 and K2 `:93` (P2) — an agent accepting a risk with `upeksha`, and the generic owner-only virodha rule.
6. T8 and K5 — release as a separate act, decided by kind.
7. K8 closing, `assistant.md:56,66` and T4 — the absent principal; "not attested" does not settle an open assignment.
8. K8 staff minimum:
   - decisive assumptions (`architect.md:71,74`);
   - continuation grounds (`architect.md:51`, `autonomous.md:155,173`);
   - deadline ≠ verdict or authority (`SKILL.md:86`);
   - claim-relative freshness (`reconcile.md:15`);
   - the D14 paragraph in the door (P3).

   Grounds: #744 v10, #797 v5, #212 v2, #566 v3, #746 v7; proposal `:42–45,96–106`.
9. K10 — the degeneration sign (P4).
10. K3 — accepting a text claim, the proposed-carrier split (with safe, in-mandate investigation), and the templates' "every mode change" row.
11. T1 / T2 / K2 — `pramanita` means independent grounds; refutation is claim- and means-specific (S1).
12. §5.1 — reconcile the snapshots before any claim of parity; T6 confirmed before any claim of objection-order conformity.

**Recommended:**
- the backbrief and walk-through choice at `architect.md:91`, where risk calls for it (no per-turn panel);
- liveness as four questions (`foreman.md:51`) and pace as a reason to ask (`assistant.md:61`, `foreman.md:49`);
- K4 `:137`;
- the plugin ENDED word;
- T5;
- the conditional server items under P6.

**Consciously unchanged, and why:**
- **One English door with methods, not a mirrored ru skill set** (`S/SKILL.md:123–176`). The set of skills is a delivery design, not an effect of language.
- **Node types, given_as values, the seven genres, the three axes, endpoint rules and mode values.** D1–D3 change interpretation, not the richness of the enums.
- **The verdict set and the exit-code rule** (`S/methods/reality-audit.md:25–51`) are already #529 v10 points 4–6. Fail-closed stays.
- **The ledger grammar** (`S/SKILL.md:92–94`) matches #744 v10. `bad` versus `slop` is a product word.
- **Case laws, cards and acks, wire names.** Adding #744's open question of rank would import #748/#752.
- **Joint by sample, review is not acceptance:** already C1.
- **`writing-modes.md` cell words and moves** are already relative to kind.
- **The door's five failures as a recognition device** (`SKILL.md:11–19`), except P4's wording of failure 1. Adding D-rows there would turn D1–D19 into a questionnaire.
- **All lens types and the partial-output cautions** (`S/methods/entry.md:48,119,125–127,134–138`; `S/methods/weaving.md:20`).
- **No new method or reference file.**
- **The release boundary of the wave** (`I/night-wave-plan.md:17–23`): reviewed text → isolated branches and staging → base/head probes → owner. The separate stop-agent bridge wave carries none of this.

## 8. Open seams: neither draft decides them, nothing changes until the holder answers

- **#747 v10 "свидетель вне дела"** in its "Суд над решением и приёмка" paragraph versus the accepted correction, which draws the boundary at not being the author of the act rather than at being outside the case (`register:55`; #744 v10, #745 v12). Project the accepted correction; don't build on the older clause. The canon text itself is the methodologist's (#470) to reconcile, not this pair's.
- **Objection admission**, `ends_at` versus journal order (T6) — #163.
- **Mandatory principal sanction.** No mechanism appears in the provided exports (E:2862 has no form for principal approval), and none is proposed here. The server implementation was not read, so absence is not established. The skill names an absent act; the server doesn't detect consent.
- **#534 / #685 / #710** stay unresolved; **#625**'s lifecycle stays unclosed; **#507**, the naming of the check level on surfaces, stays open.

## 9. Pair disagreements — settled in round 1

Sol's answers are in `design/c1-verstak-en.sol-review.md` §1.

- **P1 — settled on Sol's counter.**
  - Phase-2 positions:
    - Opus: rewrite `entry.md:7` and `:116`, keep `:44–49` as is;
    - Sol: also make `:46` and `:48` conditional.
  - Sol's counter stands on source:
    - `:46` begins "You opened a node → follow the arrow … before the next search hit", with no exception for a card that answers the question;
    - `:48` declares a role, incident or card the wrong scope whenever a lens says little;
    - both contradict #157 v5 ("полный прямой ответ в карточке не требует новой трассы").
  - Adopted: the exact replacements are in K4. The trigger map and its route examples stay, so lens use is kept where the question needs it.
- **P2 — agreed:** keep #477 v5's list of narrow acts, add "unless the owner said it, or prior sanction by whoever may grant it", and add the three readings (K2).
- **P3 — agreed:** D14 has its home in the door after `SKILL.md:98`; `architect.md:5` keeps intent versus mandate and a reference (K8).
- **P4 — agreed:** the count is a reason to look, never a verdict (K10).
- **P5 — agreed:** the stub row is replaced by a planned end, with will by the actual relation (K2).
- **P6 — settled on Sol's counter.**
  - The targeted set stays, and the wide restructure stays recommended and budget-conditional.
  - Two existing contradictions became mandatory replacements:
    - **T7**, `verstak_update` "DECIDING … reject it (virodha) belongs to whoever owns the work … ASK" (E:1687);
    - **T8**, `verstak_add_vimarsha` NEXT, "when answered: addressed_by" followed by generic release (E:505).
  - Checked against the export: the two quoted sentences are present. Grounds: #477 v5, #156 v3, #387 v5. Each replaces text, so the catalog doesn't grow.
- **P7 — agreed:** the separate subagent for "verified" is a Verstak product rule for acceptance, not for exploration (§6).
- **P8 — agreed:** no change. Platform projection plus a spoken agreement; the open question of rank isn't filled; `architect.md:54` (agreed lead ≠ projected lead) is kept.
- **P9 — agreed:** name the absent principal's act; no form of plural sanction; no new server field.

### 9a. Open after round 1

None. Every point of Sol's review stands on a source I checked:
- `entry.md:46,48`;
- E:1687 and E:505;
- `js/bridge/moment.ts:28,39–40`;
- `js/bridge/refusal.ts:7–33`;
- `js/opencode/tools.ts:355–364`;
- `writing.md:148`.

I have no remaining disagreement to keep. Sol's narrow.ts line references (`:17–20,28–29,43–56,89–105,109–118`) and tools.ts lines other than 355–364 are taken on Sol's re-read.

## 10. Dropped or corrected in the merge

- **Opus §6 "Bridge delta observed: attrs caps ≤99999 → ≤64".** Withdrawn. This is not a proved bridge effect (§5.1, Sol's analysis).
- **Opus's bridge line (386 chars) and Sol's wording.** Neither is used verbatim; the merged line is in §5.3.
- **Opus S2 (iii), the measurer questions as a step-2 line.** Folded into K3's single paragraph after `:23`, Sol's placement, so it isn't duplicated.
- **Opus S11's backbrief at `architect.md:91` and Sol's at `:49`.** One home, `:91` (K8). `:49` already holds the joint sample.
- **Opus S7's deadline sentence and Sol's at `collaborate.md:84`.** One home at `SKILL.md:86`; `collaborate.md:84` refers to it.
- **Opus §2's "the 結晶 nest could be added".** Kept only as optional, with no source requiring it.
- **Sol §2 "the enrichment proposal: file not read".** Superseded: read in phase 2 (§2, §11).
- **Round 1 correction.** The phase-2 claim "nothing else was dropped" was too strong; Sol's review §2 named four items that had been weakened without a source-backed reason. All four are now restored:
  - the staff minimum is mandatory (K8, §7 item 8);
  - the `reconcile.md:15` freshness edit is mandatory;
  - the explicit `writing.md:148` seed-and-release replacement (K6);
  - T7 and T8.

  Also from round 1:
  - S5 and S6 probes and S2's exploration bounds (R3);
  - claim-specific refutation (R4);
  - truncation provenance (R5);
  - coherent mandatory statuses (R6).

  The only single-draft items still not mandatory are those §7 lists as recommended, each with its reason.
- **Citations verified.** I checked Sol's skill and code citations used in K-items against the worktree:
  - `entry.md:116`, `architect.md:45`, `assembly.md:71`, `collaborate.md:84,90`, `foreman.md:51`, `reconcile.md:15`, `SKILL.md:15`, `agents-template.md:58`, `assistant.md:61`, `design.md:21–24`, `reality-template.md`;
  - `js/delivery/words/moment.ts:16`, `leads.ts:71–73`, `js/opencode/leadwords.ts:6–14`;
  - the talk/`about` semantics and the `ends_at` wording at E:2862.

  In round 1 I re-read `js/bridge/moment.ts:25–40`, `js/bridge/refusal.ts:7–33` and `js/opencode/tools.ts:355–364`. `narrow.ts`, and tools.ts lines other than 355–364, stand on Sol's round-1 re-read (`sol-review.md` §3).

## 11. Source versions

- **Basis C1**, methodology workbench commit 026916c (per the brief; no checkout read). SHA-256 of the inputs, as computed:

| File under `I` | SHA-256 |
|---|---|
| night-projection-basis-c1.json | b66893b7851807dc77294f100c2fc0cffb8ad2c1a989d8e77033531b8438c479 |
| night-canon-enrichment-proposal.md | 5d03ade1bd1151be12564e6320e6611e954240f6babcfad918de25294a3e9d66 (= basis; read in full in phase 2) |
| INTRO.md | e2b4cb16e104619eee93ff63538d784d59d49bfeed98c3cf455ba3f165891c30 (= basis) |
| night-canon-wave-register.md | 690067dbaea79160bf81d8829991d736e1334e1c8f45980094f9a81fa34472e6 (= basis) |
| night-projection-preserved-distinctions.md | 12807d344f951a8c1f47ad6e56b59506942d35d1744d6a4f16c9168d0a699c0c (= basis) |
| night-wave-plan.md | 7db4b58c8355c11ef1a9bf4a60ee9777c589ade4234095a0da636b2dbd83093d |
| server-export-en-verstak.json | 328014fdeb8066f13d12a612074d0df9e86d886d6520f9a83621197f3fccf82e (provisional; #163 to confirm the build) |
| postbridge-en-verstak.json | 3c4bb022b4665cfa3b2fb490ffe88952bff8f61375fa50bb6a36835a063fa27b (serverInfo verstak 0.116.1) |

All four basis hashes now match their files.

- **Canon.** @alari/methodology r4; all 35 header versions matched C1 in both drafts' reads on 2026-10-13: #100 v3, #104 v5, #529 v10, #738 v3, #477 v5, #744 v10, #745 v12, #746 v7, #747 v10, #748 v11, #797 v5, #446 v3, #389 v5, #387 v5, #131 v5, #365 v4, #356 v2, #398 v2, #366 v4, #524 v2, #525 v3, #157 v5, #254 v3, #255 v3, #224 v2, #165 v3, #504 v4, #212 v2, #566 v3, #582 v2, #570 v2, #156 v3, #591 v4, #629 v2, #625 v2. The graph was not re-read in phase 2.
- **Delivery.** Worktree `c1-en` at `25bbbf9701216a7ebd58ea68d71e98f9e3253a7d`; bridge `VERSION = "3.3.0"` (`S/scripts/verstak-bridge.mjs:163`).
- **Drafts merged:**
  - `design/c1-verstak-en.opus-draft.md`, sha256 `688299c8ee399c08c53189b9e715c6d12cc4d1d31ea8c3606227107f3c720da6`;
  - `design/c1-verstak-en.sol-draft.md`, sha256 `be3e66002e27dcdb31bd717ee5f1de43311f279cebe951be6719899a922561f3`.
- **Round 1 review:** `design/c1-verstak-en.sol-review.md`, sha256 `de298cc1443c6e8711327130b44a41f334bcf34a8f3a7c3a1e9e243370d17a31`. It reviewed this file at `94135b30…980b64`. In that review Sol re-read #100 v3, #104 v5, #157 v5, #477 v5, #529 v10, #745 v12 and #747 v10, and all headers still matched C1; I didn't re-read the graph.
- **Re-read in round 1:**
  - `js/bridge/moment.ts:25–40`;
  - `js/bridge/refusal.ts:7–33`;
  - `js/opencode/tools.ts:355–364`;
  - the E:1687 `verstak_update` DECIDING passage;
  - the E:505 `verstak_add_vimarsha` NEXT passage.

## Not done / limits

- **Text-only design.** No respondent runs, no loaded-surface check, no stand, no tokenizer count. Every probe criterion is proposed, not observed.
- **Pair state.** P1–P9 are settled between the pair in round 1, which is textual agreement only. There is no architect approval, no independent review by new Opus/Sol, and no #163 confirmation, in particular for T6, T7, T8 and the build hash.
- **Partial reading.**
  - The union of the two drafts covers most of `methods/`. `align`, `code-work`, `establish-mcp`, `minding`, `product-roadmap`, `widgets`, most references and the full plugin were read by neither draft, or only grepped.
  - The canon was read as cards: no histories, no full edge fans, no atomic snapshot. Antecedent nodes named only in D/INTRO (#464, #465, #666, #680, #702, #713) were not read.
- **No source for:**
  - the en rendering of runtime footers and tension hints;
  - the catalog counting method;
  - harness truncation, beyond the bridge source's own testimony (`moment.ts:28`: Claude Code at 2048 chars), which is not observed here;
  - the server build and configuration behind the residual snapshot differences;
  - plugin-only tool schemas;
  - which downstream adapters keep refusal metadata (the OpenCode plugin exposes text: `tools.ts:355–364`);
  - the ru twins of the bridge and plugin words (the iskron delivery's share).
- **Server wording** is an English rendering of meanings. The ru phrasing and acceptance are #163's, together with the ru pair.
- **No skills, code, graph or cases were changed, and nothing was committed.** Not attempted: probe budgets, base/head probe design, or ordering of implementation.
