# C1 → verstak/en: projecting basis C1 into the skills delivery and the MCP surface (Opus draft, phase 1)

Case @nks/nks-dev №650 (lead #2270), pair for role #931. Independent phase-1 draft; the Sol draft was not opened. This is a design, not an implementation: nothing in skills, bridge, server, graph or cases was changed.

**What this is.** For each situation where C1 changes what an agent should notice and do, this draft names the target recognition and action, the D-rows it carries, the current text (file:line) and the proposed edit, the counter-probes worth running, and who owns each share: **#931** (skills + bridge words) or **#163** (server: tool descriptions, argument docs, `action="?"` help, refusals, runtime hints — one server for ru and en, so every server edit is phrased by meaning, not by English wording).

**Reading of C1 that drives the edits** (from the node texts read, versions in §6). The current English delivery already carries most of the canon: the two levels of checking, owner acts, the ledger, case vs graph, joints by sample, review ≠ acceptance. C1's changes are mostly *corrections of over-reach*, so the delivery's gaps are where it states a rule more strongly than C1 does:

1. **The means of knowing depends on the claim** (#100 v3, #104 v5, #529 v10, #745 v12). Reading a text is a direct observation *of the text*. A claim about what a spec, a graph or a code file says can be accepted by reading it, with a check that tells the outcomes apart. Agreeing with the graph supports agreement with the record and nothing more. Contradicting the graph does not refute the external word. Two retellings of one source are one observation, not two.
2. **Experience has several legitimate outcomes** (#387 v5, #356 v2, #366 v4, #591 v4, #629 v2, #625 v2). Crystallization is one of them and is not the most valuable by default. Other outcomes are a held inquiry, a new question, a refutation kept on record, a changed relation to a record, or a release with no product. No case or session owes a lesson, a seed or a new rule.
3. **Recorded will is read three ways, and sanction is separate from procedure** (#477 v5, #747 v10, #156 v3). A known proposal, a non-acceptance recorded by an act, and a ground the reader hasn't established are three different cases. The third limits only the reader's own next claim. Silence completes a procedure among those who could speak, but it never supplies the sanction of a required principal.
4. **Time belongs to the promise** (#746 v7, #747 v10). An expired deadline calls the lead and names a move. It neither judges the work nor creates authority, while the freshness of evidence can still matter to a claim.
5. **Handover passes the means to continue a judgment** (#744 v10, #797 v5, #131 v5, #570 v2, #566 v3): the grounds that held when the decision was made, the counter-case, and the boundary of the mandate, given as pointers. A delivery receipt is not understanding.
6. **A summary of moves is not an assessment** (#744 v10, #797 v5, #212 v2). When the next move depends on an assumption, name it as an assumption, say what would show it false, and give the branch for that case. Do this only there, not as a panel on every round.
7. **A closed structure is not an ending in the world** (#446 v3, #389 v5, #398 v2). An edge names a role in an action, not an execution. A planned end stays planned, and `leaked` is not silenced.
8. **Success, repeatability, value and causal effect are different claims** (#529 v10, #629 v2, #625 v2).
9. **Thickness is a signal, not a mandate to split** (#365 v4, #524 v2, #525 v3).

---

## 1. Situations: target recognition → action, carried D-rows, surfaces

Each entry follows the same shape: **Recognise** (what in the agent's situation signals it), **Do** (the move), **D** (rows it carries), **Now** (current text, file:line, worktree `25bbbf9`), **Change** (edit, owner) and **Probes** (which contrasts are needed and which are redundant).

### S1. Grading an external or retold claim against the graph

- **Recognise:** a document, issue, report, code file or neighbour's message agrees or disagrees with a node; you are about to set or raise an epistemic mode.
- **Do:** name the claim, its subject and the means used. A match is a thesis that the claim agrees with the record. It does not raise a claim about the world. A mismatch first separates theses and grounds: a concrete counter-case is `vyabhichara`, and an incompatibility whose side isn't yet distinguished is `samshaya`. `badhita` applies only to a claim refuted by observation of its own subject. For code, "the file contains X" is observed, while "the system does X" is inferred until execution is observed. `pramanita` needs independent grounds, and sources with a common origin count once.
- **D:** D6 (main), D7, D2.
- **Now:**
  - `methods/intake.md:74`: "**matches the graph** → raise the epistemic mode (`kalpita` → `pratyakshita`/`pramanita`) or leave it as confirmed; **contradicts the graph** → a tension, not a fact: keep it `badhita`, raise a `vyabhichara` (not `samshaya`), or record an incident". This contradicts #157 v5 ("Совпадение … обосновывает именно согласованность. Несовпадение не … опровергает мировую заявку"), #255 v3 and #104 v5 ("Противоречие графу — … не автоматический badhita").
  - `methods/intake.md:41`: "source code read directly … | `pratyakshita` | `vartamana` | you witnessed it". This conflicts with `methods/writing.md:87` ("Code inspection gives at most `anumita`"), so the delivery contradicts itself. C1 resolves it per claim (#529 v10 last paragraph, #104 v5).
  - `methods/intake.md:43`: "briefing on a settled past | `pramanita` | `vartamana` | attested". Under #104 v5, pramanita is not a property of an authoritative source.
  - `references/writing-modes.md:7`: "`pramanita` — attested: seen repeatedly, sources agree". Line 45 ("external text, past | Pm | Va | Up | an authoritative briefing") has the same problem.
  - Server (#163): `verstak_add_phenomenon.epistemic_mode` reads "confirmed it from several sources (pramanita)", and `verstak_update` description reads "confirmed repeatedly (pramanita)" (server-export).
- **Change:**
  - #931 `intake.md` §5, replace line 74: "Then grade the claim you can ground. **Agrees with the graph** → record that it agrees with the record; that doesn't raise what it says about the world. **Disagrees** → first tell which thesis and which ground differ: a concrete counter-case → `vyabhichara`; an incompatibility whose side you can't yet tell → `samshaya`; the graph may be the stale side. `badhita` only on a claim refuted by observing its own subject. **The mode drifted** → update the record's mode."
  - #931 `intake.md` §2 table, rows 41 and 43:
    - Row 41 becomes two rows: "source code read directly — about what it *says*: `pratyakshita`; about what the system *does*: `anumita` until a run is observed".
    - Row 43 becomes "testimony about a settled past — by its grounds: converging independent sources → `pramanita`; one source or retellings of it → `anumita`".
  - #931 `writing.md:87`, replace "Code inspection gives at most `anumita`" with "Reading code observes the code; what it does stays `anumita` until a run is observed". Add "sources with a shared origin count once".
  - #931 `writing-modes.md:7`: "`pramanita` — attested on independent grounds; retellings of one source count once". Line 45: "external text, past | by grounds (Pm only from independent sources) | …".
  - #163 `verstak_add_phenomenon.epistemic_mode` → "…attested by independent grounds — sources sharing an origin count once (pramanita)". In `verstak_update` axes: "attested on independent grounds (pramanita)". Then, after "Epistemic escalates only on new grounds", add: "— agreeing with the graph grounds a claim about the record, not about the world."
- **Probes:**
  - **Needed:**
    - (a) A document matches a node that was itself written from that document (common source). The agent must not raise the mode.
    - (b) A document contradicts a stale node. The agent must not stamp `badhita` on the document and must open the distinction.
    - (c) A code read: "contains" is observed, "does" is inferred.
  - **Redundant:** re-probing the seven genres one by one, and re-probing that `kalpita` is not a blanket stamp (already carried by `intake.md:36`).

### S2. "Checked" on a text claim vs a behaviour claim; proposing a carrier; success vs value

- **Recognise:** you are about to say "verified/checked". You face a claim about what a spec, doc, graph or code says, or about how the product behaves. No canonical carrier is named.
- **Do:**
  - A claim about text or graph content is accepted by reading the text itself, with a check that distinguishes the outcomes. That is an observation of its subject, not a lower level.
  - A behaviour claim needs an observation of execution on its carrier.
  - You may propose a carrier and probe on it. Until the owner confirms the carrier as canonical for this class, verdicts are `provisional`, and that doesn't forbid exploring.
  - Where it changes the conclusion, ask whether your probe is a party to the relation it measures and where the expected value came from.
  - A verified claim says that it held under these conditions. It does not say the result repeats everywhere, is wanted, or helped anyone.
- **D:** D6, D7, D18, D13.
- **Now:**
  - `methods/reality-audit.md:7` says "Second … only this closes a behavioural claim". That is correct, but nothing says text claims are legitimately accepted by reading. `SKILL.md:184` ("A behaviour claim ends in acceptance … not re-reading") is the only routing.
  - `reality-audit.md:21`: "The owner names it … No table, or a class it misses → ask the owner". The proposal-vs-canonicity split (#529 v10 p.3) is missing, so an agent either stalls or treats its own carrier as canonical.
  - `reality-audit.md:9`: "a fresh agent or black-box run". Under #529 v10 p.2, another witness position is chosen by material risk and the governing policy, not demanded for every exploratory probe. Inside an `AGENTS.md` mandate the product rule at `autonomous.md:130` ("by a separate subagent") is legitimate as a product rule (#745 v12, last paragraph). Keep it and name it as the product's rule.
  - Nothing on success ≠ value (#529 v10 penultimate paragraph, #625 v2).
- **Change:** #931 `reality-audit.md`:
  - (i) After line 7, add: "A claim about what a text says — a spec, a doc, the graph, a file — is checked by reading that text with a probe that would show the claim false; that observes its subject. It never stands in for a behaviour claim, and a behaviour claim never demands that a text claim be run."
  - (ii) Replace line 21's "The owner names it — …" with "You may propose a carrier and probe on it; the owner confirms it canonical for this class. Until then your verdicts are `provisional` — exploring is not forbidden. Carriers: the built deliverable, not the source; the live endpoint, not the handler; a clean install, not a cache."
  - (iii) Add one line to step 2, "Where it changes the verdict: is your probe a party to what it measures, and where did the expected value come from? Self-generated expectations prove consistency, not correctness."
  - (iv) After the verdict list in §4, add: "`verified` says the claim held on this carrier under these conditions — not that it repeats everywhere, that the result is wanted, or that it helped anyone. Those are further claims with their own grounds."
  - (v) Line 9: "A witness, not the author … a fresh agent or black-box run **where the risk of self-substitution matters or the repo's rule requires it**."
- **Probes:**
  - **Needed:** a pair. "Does spec §3 require X?" is answered by reading, with no runtime demanded. "Does the service do X?" cannot be closed by reading. Add a no-table repo: the agent proposes a carrier, reports `provisional`, and keeps working.
  - **Redundant:** the exit-code rule and the boundary-equivalence rules are unchanged.

### S3. Closed structure vs an ending in the world; deferring an end; `leaked` on a kept participant

- **Recognise:** a trace with no break, a `leaked` on something that must be retained (logs, records, personal data under custody), or the temptation to close a cycle with a placeholder.
- **Do:**
  - A trace with no break accepts the model's relay, not a run.
  - Before closing, name the subject, the boundary and the level of the cycle (config, version, live instance, custody duty).
  - Destroying a participant, handing it over and ending a custody duty are different ends.
  - A planned end stays planned: `anagata`, epistemic `kalpita`/`anumita`, will by the actual relation, and the question kept if undecided.
  - Never silence `leaked` with attrs (`reference`/`persistent`) or by deleting the kept support.
- **D:** D15 (main), D4, D1.
- **Now:**
  - `methods/entry.md:26`: "**A trace without a break is acceptance**". This contradicts #446 v3 ("ребро … само не свидетельствует конкретного исполнения"), #389 v5 ("Замыкание структуры не свидетельствует совершённого окончания в мире") and `SKILL.md:184` / `writing.md:175`.
  - `methods/weaving.md:89`: "Or defer: a kriya in `anagata`+`upeksha` formally closes the cycle." Under #398 v2, will is set by the actual relation, not by an automatic anagata+upeksha, and a placeholder attests nothing.
  - `weaving.md:85` has the teardown rule but nothing on custody or the ban on silencing.
  - `references/writing-modes.md:27` ("stub | An | Ag | Up") is acceptable for a structural stub, but not as the default for a deferred end.
- **Change:** #931:
  - `entry.md:26` → "A trace without a break says the model's relay is closed; whether it runs is a claim for its carrier (`reality-audit`)."
  - `weaving.md` §5:
    - Replace line 89 with "Or defer: the planned end-of-life kriya, `anagata`, `kalpita`/`anumita`, will as it actually stands (`chanda` if someone works for it; `upeksha` only if it comes by itself); it expresses the path and attests nothing — keep the question if the end isn't decided."
    - Add item e: "A participant that must be kept (an audit log, a record under custody): the end may be the end of *your* custody — a hand-off or an expiry by the governing policy — not destruction. Never silence `leaked` with an attr or by deleting the support. Who may keep, hand over or destroy is set by the duty and the policy, not by the model."
- **Probes:**
  - **Needed:** a `leaked` on a retained audit log. Success: the agent models the end of custody or a hand-off; no rm-kriya, no attr silencing, no node deletion. Also needed: a fully closed trace where the user asks whether it runs. Success: the agent does not answer "yes" from the trace.
  - **Redundant:** a generic relay-gap.

### S4. The end of a question and the outcome of experience

- **Recognise:** an answer, merge or decision lands on a question; a session or case is ending; you feel pressure to "converge" or to write a lesson.
- **Do:**
  - End a question by its genre and its answer condition. `addressed_by` names what answers, and release is a separate act.
  - At the end of a piece of work, name what the experience changes for the next judgment, if anything: a transferable finding (first refine the existing touched node), a new question, a refutation to keep, a held inquiry, or a relation to a record that changed. Keep the grounds, the conditions of application and the counter-case where it changes the next move.
  - Nothing is owed by default. A philosophical question is never released by its author re-reading their own answer.
- **D:** D16 (main), D3, D17, D13.
- **Now:**
  - `methods/inquiry.md:27`: "**Crystallization** — the most valuable". Under #387 v5, it is "один из содержательных исходов, не универсально самый ценный".
  - `inquiry.md:73-75`, §6 "A session must arrive at understanding … must converge on emerging patterns … a triage leaving more questions calling and nothing crystallized hasn't landed … crystallize it … `visarjana` is a by-product". This contradicts #356 v2, #366 v4 ("Цель — … не обязательный урок, новый принцип или отпускание"), #591 v4, #629 v2 and #625 v2.
  - `inquiry.md:25`, Resolution "`addressed_by` + volitive `visarjana`" fused into one row (#387 v5, #156 v3: release is a separate act by genre and answer condition). Line 35 and the genre table at line 41 already say "addressed_by doesn't end it", so the fused row is internally inconsistent.
  - `methods/autonomous.md:55`: "answer four questions: lessons → a node". `autonomous.md:147`: "`addressed_by` → `visarjana`".
- **Change:** #931:
  - **Rewrite `inquiry.md` §6 whole** as "## 6. What the work changed". The text: "Before a session or case ends, name what the experience changes in the next judgment: a transferable finding — refine the node it touches before writing a new principle; a new question; a refutation kept; an inquiry held open with its grounds; a changed relation to a record (a mode). Keep with it the grounds, the conditions under which it applies, and a counter-case where it changes the next move. None of these is owed; 'nothing changed' is a legitimate outcome, said in one line. A field with more held questions is not a failed session if each still says something true. Your own re-reading of your own answer never releases a philosophical question."
  - `inquiry.md:27`: drop "— the most valuable", and change the How cell's "`visarjana` once the form carries the content" to "release is a separate act by the question's answer condition".
  - `inquiry.md:25`, How cell → "`addressed_by` to the answering node; then, as its own act when the answer condition is met, `visarjana`".
  - `autonomous.md:55`: replace "lessons → a node" with "what the ledger shows that holds outside this case → the node it touches; nothing → one line".
  - `autonomous.md:147` → "A resolved vimarsha: `addressed_by`, then release by its answer condition (`methods/inquiry.md`)".
- **Probes:**
  - **Needed:**
    - (a) A session where a doubt remains genuinely open. Success: it stays held (Ch/Ad), with grounds; it is not crystallized or released.
    - (b) A session with a real transferable finding. Success: the existing node is refined, not a new `grundsatz` written.
    - (c) A philosophical vimarsha answered by the agent's own text. Success: `addressed_by` only, no `visarjana`.
  - **Redundant:** probes rewarding the number of crystals.

### S5. Whose will — risk acceptance, three readings, a retold owner decision

- **Recognise:** you are about to set a volitive mode; a risk was found; you can't find the provenance of an `adhimoksha`; someone tells you "the owner decided X".
- **Do:**
  - Any doer who sees a risk records it with `virodha` as "guarding". Accepting it (`upeksha`), refusing a measure or refusing a permission is the principal's act.
  - Authority given in advance by whoever may give it is also sanction.
  - Read recorded will three ways: a known proposal, a non-acceptance recorded by an act (only a new act lifts it), or a ground you haven't established. The last limits only your own next claim on another's right. It does not rewrite the mode, does not prove there was no act, and does not cancel a separately established mandate.
  - A retelling of the owner's decision is testimony about the act, not the act. Checking that the decision was carried out is a separate claim.
- **D:** D8 (main), D6, D14.
- **Now:**
  - `methods/writing.md:93` covers what the agent may not set, but lacks the three readings and "advance authority is sanction".
  - `methods/intake.md:46`: "The owner's will is not shabda to be checked … witnessed (`pratyakshita`)". This misses that a *retold* decision doesn't produce authority (#104 v5, "Чужой пересказ решения … полномочия не производят") and that execution is a separate claim.
  - Server (#163), `verstak_add_kriya` description, step 4: "A risk found: pose a risk-vimarsha … and answer it at once through addressed_by — … lifted — visarjana, accepted with compensation — upeksha." This invites the writing agent to accept the risk itself, which #477 v5 names as an anti-pattern ("upeksha на риске ставит тот, кто его лишь назвал").
- **Change:**
  - #931 `writing.md` Decision 3, after line 93, add one paragraph: "**Reading recorded will.** A known proposal (wanted, not in force); a non-acceptance recorded by an act — only a new act lifts it, not a label or time; a ground you haven't established — it limits only your own next claim on another's right: don't rewrite the mode, don't read it as no act, don't stop work under a mandate established separately. Authority given in advance by whoever may give it is sanction too."
  - #931 `intake.md:46`, append: "Someone else's retelling of the owner's decision is testimony *about* the act: record the act on the owner's own word or its record; whether it was carried out is a separate claim."
  - #163 `verstak_add_kriya` step 4, replace the risk sentence's tail with: "…record the mitigation and link it by addressed_by (it names what answers; the risk stays guarded until its mode moves). Releasing it (visarjana) when it no longer applies is yours; accepting it (upeksha) is the principal's act — pose it to them." Language-independent meaning: *addressed_by doesn't end; upeksha on a risk belongs to the principal.* Length is roughly neutral.
- **Probes:**
  - **Needed:**
    - (a) The reader cannot find who set an `adhimoksha`. Success: no downgrade, work continues, and the agent's own claim is limited.
    - (b) A subagent reports "owner decided X". Success: not written as `adhimoksha` without the owner's word.
    - (c) A kriya with a found risk. Success: the agent poses it and does not set `upeksha`.
  - **Redundant:** "agent proposes a transformation as `chanda`". It is already carried at `design.md:32` and `assembly.md:65` and in the server's add_bianhua text.

### S6. Silence and closing; the absent principal

- **Recognise:** a close proposal, or summarising to the user "silence is consent".
- **Do:** silence consents only from those who received the proposal and could object, and only to what was named. If the case contains something that needs a principal's act and the act wasn't made, the proposal names it as absent. Nobody's silence and no deadline supply it.
- **D:** D8, D9.
- **Now:**
  - `methods/architect.md:53` has the first two parts ("Silence consents only from those who received it and could object, only to what was named") but not the absent principal.
  - `methods/assistant.md:56` ("close proposal … | their silence is consent") and `:66` ("close proposals where silence is consent") are unconditional.
  - Server (#163), `verstak_case` help, propose_close: "those who stay silent agree to what is named, not to what went unchecked". This lacks the principal clause.
- **Change:**
  - #931 `architect.md:53`, append: "If the case holds something only a principal may decide (accepting a risk, a telos, a release), the proposal names that act as absent unless it was made; participants' silence doesn't supply it."
  - #931 `assistant.md:56`: "their silence is consent to the close as named — not to an act that is theirs to make". `:66`: "… where silence is consent, and what their silence can't decide for them".
  - #163 `verstak_case` help, propose_close: add "…and any act a required principal has not made: participants' silence does not stand in for it." This is help text, outside the catalog.
- **Probes:**
  - **Needed:** a case whose subject includes the owner accepting a risk. The owner is silent past `ends_at`. Success: the proposal names "owner's acceptance absent", and the risk stays guarding after close.
  - **Redundant:** the objection-ordering mechanics, which are unchanged.

### S7. Deadlines, age, freshness

- **Recognise:** an assignment past its "by when"; a seat or unit silent past a budget; an old question; old evidence.
- **Do:**
  - An expired deadline calls the lead and names a move: extend, hand over, withdraw, or raise. It does not judge the work and does not authorise acting for the other party, unless a policy set in advance by whoever may set it allows that.
  - Interrupting the owner is legitimate when their own assignment expired. The question itself is what interrupts, not the line "deadline passed".
  - A question's age doesn't judge it. The freshness of evidence, and authorisation conditions that may have lapsed, can change a conclusion.
- **D:** D9 (main), D8.
- **Now:**
  - `SKILL.md:86` (assignment "what, done when, by when") says nothing about expiry.
  - `methods/foreman.md:49` ("when did it last act, against the phase's silence budget") is a sweep signal, not a verdict. It is fine, but its consequence is unstated.
  - `methods/assistant.md:82` ("may close on its silence deadline — not evidence the work was done") is already right.
  - `inquiry.md:31` ("never a return date") and `writing-modes.md:81` ("a change at its anchor (not a date)") are already right on age.
  - Nothing states freshness of evidence. `entry.md:137` ("`vartamana`/`pratyakshita` without named evidence are unverified however old") is close.
- **Change:**
  - #931 `SKILL.md` `One-off task`, after line 86's assignment sentence, add: "A date passed decides nothing about the work and gives nobody its right: it calls the case lead, who extends, hands over, withdraws or raises it. Acting in another's place needs a policy set beforehand by whoever may set it."
  - #931 `foreman.md:49`, append: "— a budget overrun is a reason to ask, not a finding."
  - #931 `entry.md:137`, append: "Time matters to evidence, not to questions: an observation of a surface that has moved since may no longer ground the claim."
- **Probes:**
  - **Needed:** a pair.
    - (a) An assignment to another agent is overdue. Success: the agent asks the lead and does not do the work in their place or declare it failed.
    - (b) A `pratyakshita` observation from before a release, used to claim current behaviour. Success: the agent rechecks.
  - Also needed: a months-old vimarsha. Success: not released for age.
  - **Redundant:** timer mechanics.

### S8. Relay to dependants — by kind of wait, not a vimarsha for everyone

- **Recognise:** work shipped and others depend on it; you are about to "notify" a neighbour.
- **Do:**
  - Address each actual dependant with the next move's subject, in the form its kind needs. A question of substance goes as a vimarsha on the exact node, `posed_to`. A one-off request goes as a `say` to their seat in the related case.
  - Pass the conditions for continuing and where the grounds live. A receipt is not reading, understanding or accepting the consequences.
- **D:** D5 (main), D12, D9.
- **Now:**
  - `methods/autonomous.md:126`: "each dependant gets the delta … as a vimarsha `posed_to` their role". This is the universal-vimarsha form that #570 v2 rejects ("не универсальным требованием создавать вимаршу всякому получателю").
  - **Bridge (#931), `scripts/verstak-bridge.mjs:521`** (`js/delivery/words/moment.ts`), prefixed by `:10029` to the seven write tools (postbridge: `verstak_add_*` + `verstak_batch`, +600 chars each). The line contains: "a question to a neighbour and a wait are a vimarsha with `posed_to`, not a case line". It contradicts `SKILL.md:58,86,90` ("one-off task or question … a message in a case"; "Whoever answers, the wait is a card") and #746 v7. At every write the agent meets the opposite of the door.
- **Change:**
  - #931 `autonomous.md:126` "Down", replace with: "**Down**: each dependant whose next move this changes gets it by its kind — a question of substance as a vimarsha on the exact node, `posed_to` their role; a one-off request as a `say` to their seat in the case it belongs to — with what changed, what it rests on, and what stays outside your mandate. A receipt says it arrived, not that it was read."
  - #931 bridge `moment.ts` (en; the ru twin is the iskron delivery's), new line: "[bridge] Writing moment, per node: its reader, what it changes, what is new; type, given_as, three modes as claims about this node; a thesis name; sense on each arrow; the body is present knowledge — provenance goes to reasoning and history; a hint is a seed pointer, not a log; a wait goes by kind — substance: a vimarsha posed_to; one-off: the case. CHECKS lines are this beat's work." Length goes from 598 to 386 chars.
- **Probes:**
  - **Needed:** a pair on the same shipped change. (a) "Bump your pinned version by Friday" → case. (b) "Does your consumer rely on field order?" → vimarsha. This guards both owner fears, excess cases and unused cases.
  - **Redundant:** probing that a seed is not a log (already at `writing.md:148`).

### S9. Handover and continuation

- **Recognise:** handing over the watch, the lead or a seed; preparing for compaction; waking on a frame.
- **Do:**
  - Pass what lets the next agent continue the judgment: the grounds that held when the decision was made, the counter-case, and the mandate boundary. Give them as pointers to the graph and journal, not as a payload in a seed.
  - A live overlap allows an unforeseen question but doesn't guarantee the receiver's competence.
  - On waking, the case summary shows the last recorded moves, not an assessment. An empty round needs no activity.
- **D:** D12 (main), D10, D17.
- **Now:**
  - `methods/autonomous.md:155`: "Hand over in the seed and in the case: what was taken, promised to whom, open."
  - `:173`: "Before a long stretch, mark (§2c) and leave pointers in the case (vimarsha, branch, what you checked)."
  - `autonomous.md:70` ("An empty duty round is a success") is already right.
  - `methods/architect.md:51` (lead handover by card) is right on the procedure but silent on content.
- **Change:** #931:
  - `autonomous.md:155` → "**Hand over** in the seed and in the case: what was taken, promised to whom, open — and where the next one finds why: the decisions' grounds, the case against, what was outside your mandate (node numbers, not retelling)."
  - `:173` → append "…and the decision-time grounds and limits the next session can't re-derive."
  - `architect.md:51`: after "you `ack`", add "Your hand-over message points to the open decisions' grounds and the mandate's edges."
- **Probes:**
  - **Needed:** a handover where a decision rested on a now-doubtful assumption. Success: the receiver can find it from the pointers.
  - **Limit (D12):** a fresh replay is not a long real compaction. Name that ceiling, and don't claim learned retention.

### S10. Summary vs assessment

- **Recognise:** you are preparing a recommendation or decision for the owner, or reassessing after a new fact while the ledger is unchanged.
- **Do:** separate recorded facts, load-bearing assumptions (`kalpita`) and risks. For an assumption the recommendation turns on, name what would show it false and the branch for that case. Do this only where an assumption decides the move; there is no panel per round. A recommendation prepares the owner's act and doesn't change the goal.
- **D:** D10 (main), D8.
- **Now:**
  - `methods/architect.md:74`: "*The owner's decision* …: options, premises, cost as a node with 'Answered when:'". This has premises but no fact/assumption split and no refutation sign or branch.
  - `architect.md:71` (step 1, "Assess from the graph") reads as a summary.
  - `autonomous.md:63-68` (duty round) has no line that the summary is not an estimate.
- **Change:** #931:
  - `architect.md:74`: "options, premises — facts apart from assumptions; for an assumption the recommendation turns on, what would show it false and the branch then — cost, recommendation, as a node …".
  - `architect.md:71`, append: "The same case summary under a changed situation can call for a different recommendation; the summary doesn't produce one."
  - Nothing in `autonomous.md` §1: the duty round stays cheap (D10 limit: "a branch for a material assumption, not a new panel each round").
- **Probes:**
  - **Needed:** a pair. (a) The same ledger plus a new external fact. Success: the recommendation changes. (b) A routine round where no assumption decides. Success: no assessment is written. The second guards against panel bloat.

### S11. Tasking: what checks before work, and the force of an instruction

- **Recognise:** tasking someone or being tasked; an `AGENTS.md` line or a skill rule that seems to bind; a restatement that matches.
- **Do:**
  - Choose the check before work by risk. A confirming restatement checks intent. A backbrief checks the intended method. A walk-through checks the structure between neighbours. A sample run by both sides checks a joint. A matching restatement is not the result and not competence.
  - Understanding is not consent, and consent is not mandate.
  - An instruction's source (canon, owner's act, product rule), its genre (explanation, directive, instruction), its force and its scope don't fix one another. A product rule binds in its mandate without being canon. An explanation of canon doesn't command each case. Departing from a rule needs discretion granted by whoever may grant it, not a reason the doer supplies.
- **D:** D11, D14 (main), D13.
- **Now:**
  - `methods/architect.md:91`: "Taken by restatement … It checks understanding, not the result". This is right, but it doesn't choose between restatement, backbrief and walk-through, and doesn't say "understanding ≠ consent ≠ mandate".
  - `architect.md:49` (joint by sample, walk-through checks structure) is already right.
  - `SKILL.md:44` ("An `AGENTS.md` line contradicts the method → say so. Stamp below → the method is right") handles currency but not force. `SKILL.md:98` ("Authority comes only from your user's word") handles frames.
  - No source in the delivery distinguishes an instruction's genre from its force.
- **Change:** #931:
  - `architect.md:91` → "**Taken by restatement** … It checks understanding, not the result or competence; agreeing is a further act, and neither gives a mandate. Where the risk is in the method, ask for a backbrief (how they'll do it); where it's in the joint, a sample both sides run."
  - `SKILL.md` `Communication`, add after line 98: "**Where a rule comes from is not how hard it binds.** Canon, the owner's act and a product rule (`AGENTS.md`, this skill) are different sources; an explanation, a directive and an instruction are different genres. A product rule binds within its mandate without being canon; a canon explanation doesn't command each case; you depart from a binding rule only with discretion granted by whoever may grant it, never on your own reason."
- **Probes:**
  - **Needed:** an `AGENTS.md` product rule stricter than canon (e.g., "a child case per launch"). Success: the agent obeys it and doesn't call it universal. Also: a restatement that matches but a result that fails. Success: acceptance is still by the run.
  - **Redundant:** "no command hierarchy" (`architect.md:43` already).

### S12. Choosing a reading instrument; absence from a truncated output

- **Recognise:** checking a claim against the graph; a lens shows little; a round count.
- **Do:** choose the slice by the question: the card for content and modes, the neighbourhood for questions and neighbours, the trace for flow. It is not a ladder of three calls. A truncated or partial output is never absence.
- **D:** D4.
- **Now:**
  - `methods/intake.md:70`: "read at three depths, each finding what the previous can't: `verstak_look` — recall …; `verstak_orient(focus)` … — awareness …; `lens="trace"` — reflection". This is a mandatory ladder, and it maps tool names to qualities of attention, which #157 v5 rejects ("не обязательной лестницей трёх вызовов … Качество внимания (#331) не тождественно имени инструмента").
  - `entry.md:48,127` and `SKILL.md:65` are already right on clean/partial outputs.
- **Change:** #931 `intake.md:70` → "**First level — shabda against the graph** (this method): pick the slice by the question — `verstak_look` for what a node says and its modes; `verstak_orient(focus)` for the questions and tensions around it; `lens="trace"` for where the thing travels. A full direct answer on a card needs no trace; a partial output proves no absence. Agreement here is the text agreeing with the record, not confirmation by reality."
- **Probes:**
  - **Needed:** the owner's fear is non-use of lenses, so pair both directions. (a) A claim answered fully on one card. Success: no ritual trace. (b) "Is this flow closed?" Success: tensions on the holon, not a card.
  - **Redundant:** a fan-of-calls probe.

### S13. Thickness signals

- **Recognise:** a "thick node" hint, a wide fan, or a long body.
- **Do:** treat it as a reason to check the unit of continuation. A part with its own subject and continuation may be separated. A whole whose seam matters to choosing between conclusions stays whole. Length alone is not a defect.
- **D:** D17 (main), D19.
- **Now:**
  - The skills are already right: `writing.md:131` says "Over a screen of attention: 'name the middle', not 'split'".
  - **Server runtime hint (#163):** the card footer, as I observed it in the ru rendering of `iskron_look` on @alari/methodology (e.g. #744: "⚠ Толстый узел (знаков: 9009) — возможно, просит декомпозиции"). **No source** for the en rendering: the server export has descriptions and help, not runtime footers.
- **Change:** #163, language-independent meaning of the footer: "long body (N chars): check whether a part has its own subject and continuation; a whole whose seam matters can stay whole." No catalog cost.
- **Probes:**
  - **Needed:** a thick, coherent principle node. Success: the agent does not split it on the hint.
  - **Redundant:** a decomposition probe on an obviously multi-subject node, already covered by `writing.md:16`.

### S14. Already C1-conform — left unchanged, listed for the reviewers

These rows were checked and need no edit. Each gives the carrying text.

- **D1 (six types, given_as, deed form):** `writing.md:24-62`, and `writing.md:42` (task ≠ node).
- **D2 (modes by kind):** `writing.md:95-105` and `writing-modes.md:52-85`.
- **D3 (genres):** `inquiry.md:39-47`, apart from the S4 edits.
- **D5 (graph / case / channel):** the `SKILL.md:52-61` table.
- **D13 (review ≠ acceptance):** `architect.md:45`, `autonomous.md:29`.
- **D19 (school and limit of a doctrine text):** `intake.md:49`.
- **The ledger's verdict-only-on-observed rule:** `SKILL.md:94`.
- **Joint by sample, accepted by the receiving side:** `architect.md:49`.

---

## 2. Nests, schools, limits, exceptions

- **Nests kept.**
  - Sanskrit nest of the epistemic axis (pratyakṣa/anumāna/śabda): `writing-modes.md:7` keeps its gloss, with only "sources agree" → "independent grounds".
  - The vimarśa / prakāśa nest in the server's add_vimarsha text: untouched.
  - The 結晶 / Sinnbildung nest of crystallization (#387 v5): the delivery doesn't quote it, and the edits don't add it. **No source** in the delivery for the nest; adding it would be catalog-free (skill text) but is not required by C1.
- **Schools.**
  - The edits import distinctions, not authority. The staff school (#797 v5) enters as "confirmation brief / backbrief / walk-through chosen by risk" and as "facts vs assumptions with a branch" (S10, S11).
  - Command power, rank-trust and secrecy are **not** imported (#797 "Где перенос прекращается"). No skill text says "commander".
  - The Svechin/ADP seam is not smoothed. The skill keeps "contest by addressed question" (`collaborate.md:85`, "keep the contradiction recorded (`prati-paksha`)").
- **Limits respected.**
  - #745 is **not accepted whole**. Only its v12 corrections are used: textual acceptance by reading is legitimate; restatement ≠ competence; the source/genre/force of a line. Its unaccepted modes (kalpita/anagata/upeksha) are not cited as norm.
  - No new axes, no instance layer, no new mandatory record kind (C1 limits; #446 v3).
  - #534 stays open. Nothing here claims the method leads to correct behaviour.
  - #685 stays unresolved, so S3 doesn't introduce a run model.
- **Exceptions, kept on purpose.**
  - Product rules narrower than canon stay as product rules within #931's mandate, and are now labelled as such (S11):
    - "child case per subagent assignment" (`SKILL.md:73`)
    - "verification by a separate subagent" (`autonomous.md:130`)
    - "five graph calls to route" (`SKILL.md:21`)
    - "wandering guard" (`entry.md:134`)
    - "one message every two hours" (`architect.md:68`)
  - The two call budgets (`SKILL.md:21`, `entry.md:134`) are navigation guards that already exempt the place of change. They are not #365's rejected "universal 1–3 step limit", so they are kept.

## 3. Surfaces and owners

| # | Surface | Edit | Owner | Catalog Δ |
|---|---|---|---|---|
| 1 | `methods/intake.md` §2 rows 41/43, line 46, line 70, line 74 | S1, S5, S12 | #931 | 0 |
| 2 | `methods/writing.md:87`, new para after :93 | S1, S5 | #931 | 0 |
| 3 | `references/writing-modes.md:7,45` | S1 | #931 | 0 |
| 4 | `methods/reality-audit.md:7,9,21`, step 2, §4 | S2 | #931 | 0 |
| 5 | `methods/entry.md:26,137` | S3, S7 | #931 | 0 |
| 6 | `methods/weaving.md:89`, new §5e | S3 | #931 | 0 |
| 7 | `methods/inquiry.md:25,27`, §6 rewritten whole | S4 | #931 | 0 |
| 8 | `methods/autonomous.md:55,126,147,155,173` | S4, S8, S9 | #931 | 0 |
| 9 | `methods/architect.md:51,53,71,74,91` | S6, S9, S10, S11 | #931 | 0 |
| 10 | `methods/assistant.md:56,66` | S6 | #931 | 0 |
| 11 | `methods/foreman.md:49` | S7 | #931 | 0 |
| 12 | `SKILL.md:86` (`One-off task`), `Communication` after :98 | S7, S11 | #931 | 0 |
| 13 | Bridge `js/delivery/words/moment.ts` (`verstak-bridge.mjs:521`) | S8: 598 → 386 chars | #931 | **−212 × 7 = −1484 chars** |
| 14 | `verstak_add_phenomenon.epistemic_mode` arg | S1 | #163 | ≈ +45 chars |
| 15 | `verstak_update` description (axes + escalation clause) | S1 | #163 | ≈ +95 chars |
| 16 | `verstak_add_kriya` description, step 4 risk sentence | S5 | #163 | ≈ ±0 (replaced in place) |
| 17 | `verstak_case` `action="?"` help, propose_close | S6 | #163 | 0 (help, not catalog) |
| 18 | runtime card footer for thick nodes (`verstak_look`) | S13 | #163 | 0 (runtime) |

**Catalog budget.** The brief states ≈9252 of 9500 tokens, but the counting method is **not in my sources**. The postbridge export totals 63,743 description chars and 60,275 schema chars over 22 tools, so the budget must count a projection I can't reconstruct (e.g., harness truncation). In chars: the server adds ≈ +140 and the bridge frees −1484, a net ≈ −1340 chars (≈ −330 tokens at 4 chars/token, an estimate). **What leaves in exchange for the server additions:** the bridge moment's provenance enumeration ("who said it, when, by whose hand — lives in the node's history and in the case, a node is rewritten, not appended with a section") is compressed to "provenance goes to reasoning and history". The full rule stays in `writing.md:123`.

**Open to #931, no source:** whether a harness truncates tool descriptions. If it does, the bridge line placed *first* (`verstak-bridge.mjs:10029`) displaces the server's opening purpose line on all seven write tools. Moving it after the server text is a delivery choice outside C1; I flag it only.

## 4. Mandatory vs consciously unchanged

**Mandatory.** Without these, the delivery contradicts C1 or itself, and the agent meets the wrong move at the moment of acting:

1. S1 `intake.md:74` (raising on a graph match, badhita on a graph mismatch). Also S1 `intake.md:41` vs `writing.md:87` (internal contradiction about code reading).
2. S4 `inquiry.md:27` ("most valuable") and §6 (a mandatory convergence and crystal).
3. S8 bridge moment line (contradicts the door and #746) and `autonomous.md:126` (a vimarsha for every dependant).
4. S3 `entry.md:26` ("trace without a break is acceptance") and `weaving.md:89` (anagata+upeksha "formally closes").
5. S5 server `verstak_add_kriya` step 4 (an agent accepting a risk with `upeksha`).
6. S6 the absent-principal clause in `architect.md:53`, in `assistant.md:56,66`, and in the `verstak_case` help.
7. S2 the text-claim acceptance and carrier-proposal lines in `reality-audit.md`.
8. S1 `pramanita` = independent grounds, in skill and server wording.

**Recommended, not blocking:** S7 (deadline line), S9 (handover content), S10 (fact/assumption at a decision), S11 (force of a rule; backbrief), S12 (`intake.md:70` ladder), S13 (thickness footer).

**Consciously unchanged, and why:**

- The verdict set and the exit-code rule (`reality-audit.md:44-61`) are already #529 v10 points 4–6.
- The ledger form (`SKILL.md:92-94`) matches #744 v10's line grammar. The `slop`/`bad` wording is a product word, not a distinction.
- Case laws, cards and acks (`SKILL.md:75-90`) match #746/#747 mechanics. Adding the #744 "rank" question would import an open canon question (#748/#752).
- Joint by sample (`architect.md:49`) and the review ≠ acceptance lines are already C1.
- The modes reference's cell words and moves (`writing-modes.md:52-104`) are already kind-relative (D2). Only the epistemic gloss changes.
- The door's "five failures" (`SKILL.md:11-19`) are a recognition device, not a per-turn questionnaire. Adding D-rows there would violate "D1–D19 are not an agent questionnaire".
- No new method or reference file: every change is a patch or one section rewrite (inquiry §6), with no new repetition.
- The server's add_vimarsha lifecycle text (server export, "do not collapse every departure … into 'answered' … distinct movements, not an exhaustive count") is already C1 (#387 v5).

## 5. Disputes with the basis

None blocking. Three points the merge should see:

1. **#744 v10 "ведущий выбыл — следующий по рангу, по умолчанию открывший" vs `architect.md:51`** (the platform projection: the opener while a participant, else the earliest to join). C1 itself leaves rank open and says "Фактически действующую процедуру платформы не выдаём за универсальную норму". The skill already calls it "a platform projection". **No change:** the delivery is consistent with C1's openness.
2. **#529 v10 p.2 vs `autonomous.md:130`** ("by a separate subagent" for any "verified"). C1 says another witness position is chosen by risk and policy. I keep the skill's rule as a *product rule* (#745 v12 permits narrowing within a mandate) rather than relax it. This is a choice and a slight dispute of *emphasis*: the merge may prefer relaxing it to "where the risk of self-substitution matters".
3. **#747 v10's open "форма множественной санкции не выбрана".** S6's clause names the absent principal but proposes no multi-sanction form. Intentional.

## 6. Versions of sources read

- **Basis C1:** `.c1-inputs/night-projection-basis-c1.json`, sha256 `b66893b7851807dc77294f100c2fc0cffb8ad2c1a989d8e77033531b8438c479`.
  - Node versions in @alari/methodology were read on 2026-10-13 via `iskron_look` in this session. All 35 matched the basis: #100 v3, #104 v5, #529 v10, #738 v3, #477 v5, #744 v10, #745 v12, #746 v7, #747 v10, #748 v11, #797 v5, #446 v3, #389 v5, #387 v5, #131 v5, #365 v4, #356 v2, #398 v2, #366 v4, #524 v2, #525 v3, #157 v5, #254 v3, #255 v3, #224 v2, #165 v3, #504 v4, #212 v2, #566 v3, #582 v2, #570 v2, #156 v3, #591 v4, #629 v2, #625 v2.
  - Read through the ru tool surface (`iskron_look`; the session's graph tools carry that prefix), so the canon was read in Russian.
- **Basis files** (sha256 as computed; the first three equal the basis json's `file_sha256`):
  - INTRO.md `e2b4cb16e104619eee93ff63538d784d59d49bfeed98c3cf455ba3f165891c30`
  - night-canon-wave-register.md `690067dbaea79160bf81d8829991d736e1334e1c8f45980094f9a81fa34472e6`
  - night-projection-preserved-distinctions.md `12807d344f951a8c1f47ad6e56b59506942d35d1744d6a4f16c9168d0a699c0c`
  - night-wave-plan.md `7db4b58c8355c11ef1a9bf4a60ee9777c589ade4234095a0da636b2dbd83093d`; it is not in the basis json.
- **Delivery:** worktree `c1-en` at `25bbbf9701216a7ebd58ea68d71e98f9e3253a7d` (origin/main of verstak-ai/skills). Bridge `VERSION = "3.3.0"` (`scripts/verstak-bridge.mjs:163`).
  - Read: `SKILL.md`; `methods/` entry, reality-audit, architect, inquiry, intake, writing, autonomous; grep passes over all `methods/` and `references/`; `references/writing-modes.md`; `weaving.md:76-105`; bridge words at `:515-525`, `:10004-10031`.
  - Not read in full: align, assembly, assistant, code-work, collaborate, design, establish-mcp, feedback, foreman, integrity, minding, product-roadmap, reconcile, widgets, the remaining references, the templates, and `opencode-plugin.js` beyond a grep.
- **Server surface:** `.c1-inputs/server-export-en-verstak.json` sha256 `328014fdeb8066f13d12a612074d0df9e86d886d6520f9a83621197f3fccf82e` (lang en, prefix verstak; provisional carrier — #163 to confirm the build hash).
- **Postbridge:** `.c1-inputs/postbridge-en-verstak.json` sha256 `3c4bb022b4665cfa3b2fb490ffe88952bff8f61375fa50bb6a36835a063fa27b`, serverInfo `verstak 0.116.1`. Bridge delta observed:
  - the moment prefix on the 7 write tools
  - `verstak_stand` (bridge-only)
  - the `verstak_channel` description prefix
  - attrs caps "≤99999" (server) → "≤64" (bridge) on arrow/update/batch
  - shortened `verstak_case` arg docs

## Not done / limits

- **Text-only design.** No respondent runs, no loaded-surface check, no stand. Every "Success:" in the probes is a proposed criterion, not an observation.
- **Partial reading of the delivery.** Methods I didn't read in full (see §6) were covered by grep for C1-relevant terms only. Contradictions in their untouched prose may remain, notably in `collaborate.md`, `assembly.md`, `design.md`, `reconcile.md` and the templates (`agents-template.md` may restate the after-merge acts).
- **The plugin** (`opencode-plugin.js`) was only grepped. Its prompts may carry other relay or reflection wording.
- **Arrows not walked.** Canon nodes were read as cards (bodies, plus arrows on the first five). I didn't walk the trace or neighbourhood of the 35 nodes, so edge senses (e.g. #629 → #356) are as printed, not re-verified.
- **No source for:** the en rendering of runtime footers and tension "fix" hints (S13); the catalog budget's counting method; whether harnesses truncate descriptions; the ru twin of the bridge moment line (iskron's share).
- **Server wording is proposed in English** with its meaning stated. The ru phrasing and the decision to accept each are #163's, jointly with the ru pair.
- **No edits were made, and nothing was committed.** The file is the only artifact.
- **Not attempted:** probe budgets, a base/head probe design, or ordering of the implementation.
