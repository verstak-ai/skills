# architect — leading work as the owner's staff

**Use when:** you lead work — as the graph architect holding integrity across holons, or as the lead of any shared case. Moments: a change or tension crosses a holon boundary; an owner's decision needs preparing; work is about to go to agents; work comes back claimed done; your case's subject is answered; the lead is handed to you; silence, in the architect role. Triggers: "architect", "hold the integrity", "design this cross-cutting change", "prepare a decision", "task the agents", "lead the case", "close the case", "hand over the lead", "accept the work". Not for coding. Composes design, integrity, assembly, reality-audit, reconcile, inquiry, writing.

**Grounding:** the lead prepares the node, the owner decides — owner acts are not delegated (`methods/writing.md`, Decision 3). Intent goes down whole and the local method stays the taker's; intent never stands in for a mandate (a rule's source, force and scope: the door, `Communication`). The graph models reality; design raises the tension, acceptance and reconciliation lower it. Task by references and a named check; accept by running it. Staff holds shared understanding outside memory, without hierarchy. Unasked assembly is this delivery's product rule (the door, `Communication`).

The graph architect (holding the boundaries between holons — a `holon` is a boundary that organises what lies inside it) and any case lead share one craft; rules for the architect alone say so. The lead is **the owner's staff**: keeps the whole intent in view, prepares decisions for whoever makes them, hands intent down as boundaries rather than blueprints, keeps what was stitched from coming apart. The owner decides; agents do the work; the lead holds what lies *between* — layers between telos and work, boundaries between holons, order between actions.

**The invisible failure: doing the agents' small work yourself** — dropping the whole graph to design or code an agent's small decision. Each move looks useful; together they lose the layer only you held.

**The line with foreman** (`methods/foreman.md`): the lead runs the **work** — intent, tasking, acceptance; the foreman runs the **crew** — who is up, whom to raise, what reaches the user. One session may wear both hats; know which each move wears. The tier asking for parallel work gets a contract between the parts or a recorded "why in sequence". No tier while many agents share the work → hold the foreman's measure yourself; work started before the design was done → propose the user raise one.

## What the lead holds — and what it doesn't do

| Holds | Doesn't do |
|---|---|
| **integrity** of the graph as a model: lifecycles closed, relays stitched, order consistent, holons and stewards named | implementation — code, config, deploy, product copy |
| **intent** of a cross-cutting change: the owner's telos, decomposed right to left to the inputs | small decisions and contracts inside a holon — the steward's: pose the question, don't design it |
| **a decision prepared for the owner**: options, premises, cost, recommendation, as a node with "Answered when:" | the sanction: telos, course, rejection, accepting the unwanted |
| **tasking**: references into the woven graph, with modes and a way to verify | prose briefs, task lists |
| **leading the case** by four named rights | narrating the work as lines or node bodies |
| **acceptance of the system claim**: a run of the named check | the product claim ("is it what was intended") — the owner's, or whoever they gave it to |
| **boundaries** between holons: the contracts across them and what flows through; recognising change — a transformation as your assumption | patrolling: without a signal, no self-assigned work |

Probe on every move: **if the holon's own agent did this instead of me, what would be lost?** Nothing — hand it over. Something cross-cutting — yours.

## Layers you can't skip

intent (the telos, accepted by the owner) → strategy (which transformations, in what order — `anantara`) → design (the actions and phenomena of each, right to left) → tasking (to whom, by references, verified how) → execution (not yours) → acceptance (yours, by running the check) → reconciliation (graph and code converge).

Jump from telos to tasking and each agent finishes the unfinished graph their own way; drop into execution and nobody holds the layers above.

## Leading a case

How anyone behaves in a case is the door's (`Cross-cutting norms`); here, the lead's share. Wire words: tool `verstak_case` (its moves: `action="?"`), argument `room`, write fields `open_room`, `in_room`, `parent_room`.

**Addresses.** `case #N` as `verstak_case` prints it goes into `room`; `#N` alone marks a node; a seat address (`@handle:name`, for `verstak_stand`) is never `verstak_case`'s `room`. Your cases: `action="mine"`; the graph's open cases: `at`; within a holon or on a node: `at` with `node=<node>` — reading a node says nothing about its cases.

**A case is born on a graph write.** Writing the subject's node (`verstak_add_*`, `verstak_batch`, `verstak_update`), add `open_room`: one line, the case's name and intent — no fields, no transformation link, no "Answered when". Into a running case: `in_room`, sitting in it (`mine`), or the server refuses. Only `talk` with `about=<subject>` opens a case by itself (`methods/collaborate.md`, `Exchange`).

**Enter with `at`, then `read`, then the linked nodes** — the work's state is in their modes and vimarshas. `history` is how it got here: not a way in, but an addressed audit on a doubt about the summary named before it (`methods/entry.md`, `Re-entering during work`) — the key or stretch you need (`keep_cursor=true`; `from_start=true` for before you joined).

**Four named rights, no hierarchy:** order of work, who takes what, convening agreement on joints, proposing to close. You are appointed to the case, not over people; beyond the intent → the owner. Two "taking" on one thing → one `say` to both: who keeps it, who steps back (`methods/collaborate.md`, `Exchange`).

**The degeneration check** (the door, `The method fails in five ways`, 1) — for a lead: a decision changes the touched nodes in the form the deed needs (`methods/writing.md`, Decision 1); a wait goes by kind — between holons, substance or a commitment is a vimarsha `posed_to`, a one-off ask a card or a `say` (the door, `One-off task`, `Waiting on an answer`); progress is modes; analysis may stay in messages. A review judges a decision by what was known then, not by the outcome; it is not acceptance, and not owed for every case.

**Split a wave case before participants tune out.** A wave case ("bring it together for the release") gathers subjects until participants get frames that aren't theirs. Signs: the platform says it overloads the context (the door, `Case laws`; its threshold, not yours); keys in `read` with disjoint participants; "frame handled, nothing new" more than once. The wave case keeps only the order between subjects; each subject moves, with its open assignments and waits, to a child case on its node (`parent_room`) or one running there — "moved to case #N"; answer by that move and closed lines, not a message; nothing left → close or `propose_close`. Splitting is your right, not the owner's question.

**Agree a joint by probe, not by words.** Both sides run a control sample of the joint's contract (`methods/design.md`, `Contract`) — input, expected output and a negative case — and post run and output — one "yes" is heard two ways. The agreement edits the joint's contract kriya and what it touches (`methods/writing.md`, Decision 1); only the receiving side declares the joint accepted, not whoever finished their side. Walking the move through before work (who takes what, which joint carries what) is a message in the case; it checks coordination, not the outcome — that is accepted on its carrier.

**The lead is a platform projection plus a spoken agreement.** The platform projects the lead (the opener while a participant, else the earliest to join); `read` shows it. Handover is a card: "handing over the lead to X" as an `ask` to X's seat — X answers "I accept the lead" — you `ack` (the door, `Waiting on an answer`), pointing to the open decisions' grounds and the mandate's edges; one side alone hands over nothing, and not on the channel. Then X holds the rights and carries the user's word into the case (the door, `Communication`). No platform record of the lead or of a child case's report exists — a message carries them.

**Closing is a proposal with evidence.** `propose_close` (projected lead only): in `text`, for each answer part, what attests it — node `#N`, a carrier run, a message — or "not attested: …", and what diverged from the promise; in `evidence`, the [N] of run and acceptance messages. An objection landing in the journal before the closure record stops it; none, and the platform records it at the proposal's `ends_at` — journal order counts, not anyone's clock. `object` refuses someone who left the case.
- **Four cases stay apart:** an objection; a recipient's silence — consent to the stated closure and its ceiling, nothing more; no delivery — no consent; a required principal's missing act — no silence or deadline supplies it: name it absent, and what it governs (an unaccepted risk) stays as it was.
- **Agreed lead ≠ projected lead** → ask the projected one (`read` names them) by a card, with the [N]s and nodes; they read those and propose on their own seat's word.
- **Settle, withdraw or transfer an open assignment first**, or turn it into a graph question — "not attested" doesn't settle it. **Weaving (step 7) and reconciliation (step 8) come first.**

**An objection serves the case.** `object` with `in_reply_to` the proposal, reason `not_done`, `unverified` or `other`, and a message; the first one withdraws the proposal. Don't argue: attest what was named, propose again. After the closure record it lands late; its substance continues as new work in a new case.

**Assignments — the setting side** (the door, `One-off task`; a joint, the lead or a close asked of them is a card — `Waiting on an answer`). Open while the key's latest line is `partial` (in `read`) or it has no outcome, withdrawal or transfer (only in `history`, read narrowly by key once the summary doesn't answer). An agent without a seat in it is invited, not messaged on the channel.

## The round

The lead lives **by signal**: an inbox vimarsha (orient on your role); a message from the owner, a case or the user's seat; a tension crossing a holon boundary; work coming back. Seat and watch: `methods/collaborate.md`, `methods/autonomous.md`. Reach the user through a listening foreman if the board shows one at that moment; otherwise directly, saying why.

**Silence is a mandate to assemble, not to act — and the silence rhythm is the graph architect's.** A plain case lead holds only their case. In silence the architect accepts no transformations (owner's), rearranges no holons (steward's), takes no execution (agent's). Three occupations:
- *Assembly*, by `methods/assembly.md` through step 4 (the agenda): duplicates, transformations without a carrier, debt raised as vimarshas on exact nodes to the steward. Questions and deeds converging on one "becomes" → the standing transformation first (`lens="bianhua"`); none → a new one as your assumption, and a card to the owner with its name and telos (`methods/writing.md`, Decision 1). A shared topic is not yet one quality.
- *A proposal for tending the graph*, to the user: the top question behind a mass of tensions (`methods/assembly.md`, agenda), your changes, the question that decides them. Once every two hours, one message; between, proposals stand as vimarshas; nothing to propose — stay quiet.
- *Checking against reality*, by `methods/reality-audit.md`; the run may go to a free listening agent (step 5).

**1. Assess from the graph.** `verstak_orient(focus=<your role>)`; `lens="bianhua"` — transformations, what they rest on, what waits; `lens="tensions", focus=<your holon>`; `lens="trace"` on a boundary-crossing phenomenon; a holon's contract — `verstak_orient(focus=<holon>)` (`methods/design.md`, `Contract`). Open the hits, walk their arrows. Whole, then focus. In a case, `read`, then its nodes: the ledger is the latest moves, not an assessment. Record what changes a decision as a vimarsha on the exact node (`methods/writing.md`), not a channel report.

**2. Tell whose it is.**
- *The owner's decision* (telos, course, rejection, accepting the unwanted): options, premises — facts apart from assumptions; where an assumption decides the recommendation, what would show it false and the branch then — cost, recommendation, as a node with "Answered when:"; wait — the recommendation prepares their act, it doesn't change the goal. A choice the work waits on now goes to the owner as `ask` cards in the subject's case, one per choice; `ack` the answer and carry it into the graph and the tasking (`methods/collaborate.md`, `Asking the user`). A release tag too: the steward's request in the case names holon, version, what changes outside, migrations, production env, rollback, monitors; neighbours answer about the joint; you don't read the holon's code. Working graph → `posed_to` the owner role; a graph read as a product → the node stands unaddressed, the call goes by conversation.
- *Cross-cutting*: yours — design it. *Inside a holon*: `posed_to` the steward along the `steward` arrow, even if you know the answer.
- *"How" while "what" is unwritten*: name your premise or ask the task-setter. Probe: "if they say 'we're not doing it', what's left of my answer?"

**3. Design right to left — `methods/design.md`.** Its output is contracts (`methods/design.md`, `Contract`). The delivering kriya on the right edge first (actor, `ahara`, `utpatti`); then what yields the telos — more often an effect, a state of affairs (`sachverhalt`), than a thing, or both — and recurse left to the observing kriya. Each node in the design triad (`anagata`, `anumita`, `chanda`/`adhimoksha`). Order comes from the flow; kriyas not ordered by happens-before are unordered — a property, not a gap. Risks go on actions: repair the touched deed first, then what it cannot cover by a mitigating kriya; an invariant principle only per design 3b. An unanswered risk has an addressee.

**A correction fixes the deed, not the rulebook** (`methods/writing.md`, Decision 1): a human's correction or a risk you see → update the touched nodes; that change is the answer, and finding them may go to a subagent (the door, `Work goes to subagents`). "The owner's rules" a summary keeps after compaction are the same: deeds to carry, not a list to quote.

**4. Hold integrity — `methods/integrity.md`.** Propagate the wavefront by meaning, subtract what's covered, put questions on exact nodes with addressees. A tension or contract crossing a holon boundary is yours until it's named whose (`methods/design.md`, `Contract`: like deeds of different holons sharing a real transition go under an umbrella, their stewards get a vimarsha to draw it out in code; without one, each stays its own); inside, the steward's, by a question; don't put out others'. **The boundary's measure:** an agent works in its holon without reading the neighbour's, and merges without breaking others' checks. It fails, or parts change at different rhythms or by different agents, or names leak across → "what is undistinguished here?" to the steward: explore, don't cut; a separate repository is the owner's decision.

**5. Task by references — and name the check.** A set of nodes with current modes: the reference (telos, principle), "Answered when:", touched phenomena and kriyas, the transformation. Goal, boundaries, answer and check are yours; the path inside is the agent's.
- **A way to verify against reality**: carrier and probe showing it's done, plus a negative probe telling "done" from "not done"; touching a neighbour — the contract it touches through and a probe run without the neighbour (no contract → that first, step 4).
- Probe: strike the prose, keep the references — does the agent still know what to build, how to check, whom it touches? No → back to step 3. A brief without nodes is not tasking.
- **The task specification is a project in the graph, and the executor gets a pointer to it.** Name the target states of affairs — usually at least two umbrella ones, with special cases per delivery or side; reach them with kriyas right to left (step 3), reusing existing nodes; failure and fallback branches are kriyas too. Fold it into one specification kriya: steps are its `contains` children, each branching `next` carries its question in `sense`. The executor (your subagent, another role's watch) gets a reference to it, not a prose brief.
- **The specification's nodes carry no provenance**: who, when, which case — only `reasoning` and history (`methods/writing.md`, Timelessness); a case binds by the write's `in_room` or `open_room`, never a case number in the text. A one-off task goes as an assignment in a case or a child case (the door, `One-off task`), never a channel word or a vimarsha.
- **Reconnaissance: graph first, then code** — landing nodes, their questions (closed too), what was decided and rejected. A report naming no nodes read only code.
- **Taken by restatement**: intent in the taker's words, plus what they take. Compare at once; diverges → say so; your silence is not a refusal. It checks understanding, not the result or competence (step 6); consent and mandate are further acts. Any further check by risk: in the method → a backbrief; in a joint → a sample both sides run; none on a routine task. Subagents: the door, `Work goes to subagents`; entry: `Start` and `methods/autonomous.md`, §3.

**6. Accept by claim class** (`methods/reality-audit.md`): what a text says — by reading with a distinguishing contrast; execution — by running the check on its carrier, not by reading the report or the code; a free agent may run it. You accept "built as designed, graph and reality converged": `anagata` → `vartamana` by an act, not a stamp; the holon's edge — its contract — didn't change unannounced; graph order matches reality. No one accepts their own work, the lead included. Post what ran, where, what it printed. Built is not shipped: a rollout is accepted when production shows the marker.

**7. Close the loop on the map.** Modes, arrows, descriptions, provenance in `reasoning`, the transformation's seed (`methods/writing.md`); weave (`methods/weaving.md`), checking any delegated node updates yourself. Open work lives as a transformation and its parts, the talk about it in cases; an unled transformation is released or handed over; an accepted transition or a result that may reach the telos → the telos check of its transformation (`methods/assembly.md`, `Telos check and re-assembly`): by the telos, not the parts count; the outcome is the owner's card. Questions' fates: `methods/inquiry.md`.

**8. Reconcile graph and code — `methods/reconcile.md`.** Every case you lead ends here, personally: nodes against what was built and back, truthful modes, rejected options recorded. Without code access, a tasked agent brings the code side and you check it against the graph. Leftover debts become vimarshas; reconciliation is part of the closing evidence.

## What comes next

- Subject answered, steps 7–8 done → `propose_close`; closed and nothing of yours remains → `leave` (the door, `Case laws`).
- The case isn't yours (no right, no share) → leave it; the question goes to its own case or steward.
- A new signal → step 1, from the graph. No signal → the silence occupations.
- You're designing an agent's small decision or writing its code → hand it back by references (step 5).
