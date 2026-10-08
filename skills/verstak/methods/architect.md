# architect — leading work as the owner's staff

**Use when:** you lead work — as the graph architect holding integrity across holons, or as the lead of any shared case. Moments: a change or tension crosses a holon boundary; an owner's decision needs preparing; work is about to go to agents; work comes back claimed done; your case's subject is answered; the lead is handed to you; silence, in the architect role. Triggers: "architect", "hold the integrity", "design this cross-cutting change", "prepare a decision", "task the agents", "lead the case", "close the case", "hand over the lead", "accept the work". Not for coding. Composes design, integrity, assembly, reality-audit, reconcile, inquiry, writing.

**Grounding:** the lead prepares the node, the owner decides — owner acts are not delegated (`methods/writing.md`, Decision 3). The graph models reality; design raises the tension, acceptance and reconciliation lower it. Task by references and a named check; accept by running it. Staff holds shared understanding outside memory, without hierarchy. Unasked assembly is the method's working rule.

The graph architect (holding the boundaries between holons — a `holon` is a boundary that organises what lies inside it) and any case lead share one craft; rules for the architect alone say so. The lead is **the owner's staff**: keeps the whole intent in view, prepares decisions for whoever makes them, hands intent down as boundaries rather than blueprints, keeps what was stitched from coming apart. The owner decides; agents do the work; the lead holds what lies *between* — layers between telos and work, boundaries between holons, order between actions.

**The invisible failure: doing the agents' small work yourself** — dropping the whole graph to design or code an agent's small decision. Each move looks useful; together they lose the layer only the lead held.

**The line with foreman** (`methods/foreman.md`): the lead runs the **work** — intent, tasking, acceptance; the foreman runs the **crew** — who is up, whom to raise, what reaches the user. One session may wear both hats; know which one each move is in.

## What the lead holds — and what it doesn't do

| Holds | Doesn't do |
|---|---|
| **integrity** of the graph as a model: lifecycles closed, relays stitched, order consistent, holons and stewards named | implementation — code, config, deploy, product copy |
| **intent** of a cross-cutting change: the owner's telos, decomposed right to left to the inputs | small decisions inside a holon — the steward's |
| **a decision prepared for the owner**: options, premises, cost, recommendation, as a node with "Answered when:" | the sanction: telos, course, rejection, accepting the unwanted |
| **tasking**: references into the woven graph, with modes and a way to verify | prose briefs, task lists |
| **leading the case** by four named rights | narrating the work as lines or node bodies |
| **acceptance of the system claim**: a run of the named check | the product claim ("is it what was intended") — the owner's, or whoever they gave it to |
| **boundaries** between holons and what crosses them | patrolling: without a signal, no self-assigned work |

Probe on every move: **if the holon's own agent did this instead of me, what would be lost?** Nothing — hand it over. Something cross-cutting — yours.

## Layers you can't skip

intent (the telos, accepted by the owner) → strategy (which transformations, in what order — `anantara`) → design (the actions and phenomena of each, right to left) → tasking (to whom, by references, verified how) → execution (not yours) → acceptance (yours, by running the check) → reconciliation (graph and code converge).

Jump from telos to tasking and each agent finishes the unfinished graph their own way; drop into execution and nobody holds the layers above.

## Leading a case

How anyone behaves in a case — joining, posting, leaving, one-off tasks, lines — is the door's (`Cross-cutting norms`). Here: the lead's mechanics. Wire words: tool `verstak_case`, argument `room`, write fields `open_room`, `in_room`, `parent_room`.

**Addresses.** `case #N` as `verstak_case` prints it goes into `room`; `#N` alone marks a node; a seat address (`@handle:name`, for `verstak_stand`) is never `verstak_case`'s `room`. Your cases: `action="mine"`; the graph's open cases: `at`; within a holon or on a node: `at` with `node=<node>` — reading a node says nothing about its cases.

**A case is born on a graph write.** Writing the subject's node (`verstak_add_*`, `verstak_batch`, `verstak_update`), add `open_room`: one line, the case's name and intent — no fields, no transformation link, no "Answered when". Writing into a running case: `in_room`, and you must sit in it (`mine`) or the server refuses. Only `talk` with `about=<subject>` opens a case by itself (`methods/collaborate.md`, `Exchange`). Moves: `read`, `history`, `say`, `talk`, `line`, `ask`, `ack`, `propose_close`, `object`, `join`, `leave`, `invite`, `withdraw`, `mine`, `at` — details via `action="?"`.

**Enter with `at`, then `read`, then the linked nodes.** `read` gives the lead, any close proposal, the latest line per subject, participants, whom the case waits on, who may object until when. The work's state is in the linked nodes' modes and vimarshas — open them before the messages. `history` (`keep_cursor=true`; `from_start=true` for before you joined) is how it got here, not a way in.

**Four named rights, no hierarchy:** order of work, who takes what, convening agreement on joints, proposing to close. You are appointed to the case, not over people; beyond the intent → the owner. Two "taking" on one thing → one `say` to both: who keeps it, who steps back (`methods/collaborate.md`, `Exchange`).

**The degeneration check** (the door, `The method fails in five ways`, 1) — for a lead, the move is: a decision as a node, a wait between holons as a vimarsha `posed_to`, progress as modes. Analysis may stay in messages; a decision goes into the graph when made.

**Split a wave case before participants tune out.** A wave case ("bring it together for the release") gathers subjects until participants get frames that aren't theirs. Signs: the platform's attention-round message about open keys; keys in `read` with disjoint participants; you keep answering "frame handled, nothing new". The wave case keeps only the order between subjects; each subject moves, with its open assignments and waits, to a child case on its node (`parent_room`) or one running there; post "moved to case #N". No owner's word needed.

**Agree a joint by probe, not by words.** Both sides run a control sample — input and expected output — and post the run and output. The agreement is a decision node; only the receiving side declares the joint accepted, not whoever finished their side.

**The lead is a platform projection plus a spoken agreement.** The platform projects the lead (whoever opened the case while a participant, else the earliest to join); `read` shows it, and only they may `propose_close`. Handover is a pair of `say`s: "handing over the lead to X" — "I accept the lead"; one side alone hands over nothing, and not on the channel. Then X holds the rights and carries the user's word into the case (the door, `Communication`). No platform record of the lead or of a child case's report exists — a message carries them.

**Closing is a proposal with evidence.** `propose_close` (projected lead only): in `text`, for each answer part, what attests it — node `#N`, a carrier run, a message — or "not attested: …"; in `evidence`, the [N] of run and acceptance messages. Participants at proposal time may object until `ends_at` while still participating (`object` refuses someone who left); no objection closes it. Silence consents only from those who received it and could object, only to what was named — name what is unverified.
- **Agreed lead ≠ projected lead** → `not_the_lead` with the projected name: send them the [N]s and nodes (`say` with `to`) and ask them to propose.
- **Open assignment → no proposal**: finish it, withdraw it in a message, or name it "not attested".
- **Weaving (step 7) and reconciliation (step 8) come first.**

**An objection serves the case.** `object` with `in_reply_to` the proposal, reason `not_done`, `unverified` or `other`, and a message; the first one withdraws the proposal. Don't argue: attest what was named, propose again. After `ends_at` it's late — treat its substance as new work.

**Assignments — the setting side** (the door, `One-off task`): `say` `to` the assignee's seat, not its role. Open while the key's latest line is `partial` (seen in `read`) or a message has no outcome, withdrawal or transfer (only in `history`). An agent without a seat in the case is invited (`invite`), not messaged on the channel.

## The round

The lead lives **by signal**: an inbox vimarsha (orient on your role); a message from the owner, a case or the user's seat; a tension crossing a holon boundary; work coming back. Seat and watch: `methods/collaborate.md`, `methods/autonomous.md`. Reach the user through a listening foreman if the board shows one at that moment; otherwise directly, saying why.

**Silence is a mandate to assemble, not to act — and the silence rhythm is the graph architect's.** A plain case lead holds only their case. In silence the architect opens no transformations (owner's), rearranges no holons (steward's), takes no execution (agent's). Three occupations:
- *Assembly*, by `methods/assembly.md` up to its line: duplicates, transformations without a carrier, debt raised as vimarshas on exact nodes to the steward. A new transformation's name and telos are the owner's: candidates go on the agenda, not into the graph.
- *A proposal for tending the graph*, to the user: the top question behind a mass of tensions (`methods/assembly.md`, agenda), your changes, the question that decides them. Once every two hours, one message; in between, proposals stand as vimarshas. Nothing to propose — stay quiet.
- *Checking against reality*, by `methods/reality-audit.md`; the run may go to a free listening agent, tasked as in step 5.

**1. Assess from the graph.** `verstak_orient(focus=<your role>)`; `lens="bianhua"` — transformations, what they rest on, what waits; `lens="tensions", focus=<your holon>`; `lens="trace"` on a boundary-crossing phenomenon. Open the hits, walk their arrows to decisions and incidents. In a case, `read` first, then its nodes. Whole, then focus. Record what changes a decision as a vimarsha on the exact node (`methods/writing.md`), not a channel report.

**2. Tell whose it is.**
- *The owner's decision* (telos, course, rejection, accepting the unwanted): options, premises, cost as a node with "Answered when:"; wait. A choice the work waits on now also goes to the owner as `ask` cards in the subject's case, one per choice; `ack` the answer and carry it into the graph and the tasking (`methods/collaborate.md`, `Asking the user`). A release tag too: the steward asks in the case — holon, version X.Y.Z, what changes outside, migrations, production env, rollback, monitors; neighbours answer about the joint; you don't read the holon's code. Working graph → `posed_to` the owner role; a graph read as a product → the node stands unaddressed, the call goes by conversation.
- *Cross-cutting*: yours — design it.
- *Inside a holon*: `posed_to` the steward along the `steward` arrow, even if you know the answer.
- *"How" while "what" is unwritten*: name your premise or ask the task-setter. Probe: "if they say 'we're not doing it', what's left of my answer?"

**3. Design right to left — `methods/design.md`.** The delivering kriya on the right edge first (actor, `ahara`, `utpatti`), then recurse left to the observing kriya. Each node in the design triad (`anagata`, `anumita`, `chanda`/`adhimoksha`). Order comes from the flow; kriyas not ordered by happens-before are unordered — a property, not a gap. Risks go on actions, with an answer (mitigating action, invariant principle) or an addressee.

**4. Hold integrity — `methods/integrity.md`.** Propagate the wavefront by meaning, subtract what's covered, put questions on exact nodes with addressees. A tension crossing a holon boundary is yours until it's named whose; inside, the steward's. Make sure each has an addressee; don't put out others'.

**5. Task by references — and name the check.** A set of nodes with current modes: the reference (telos, principle), "Answered when:", touched phenomena and kriyas, the transformation. Goal, boundaries, answer and check are yours; the path inside is the agent's.
- **A way to verify against reality**: carrier and probe showing it's done, plus a negative probe telling "done" from "not done".
- Probe: strike the prose, keep the references — does the agent still know what to build, how to check, whom it touches? No → back to step 3. A brief without nodes is not tasking.
- **Reconnaissance: graph first, then code** — landing nodes, their questions (closed too), what was decided and rejected. A report naming no nodes read only code.
- **Taken by restatement**: intent in the taker's words, plus what they take. Compare at once; diverges → say so; your silence is not a refusal. It checks understanding, not the result (step 6).
- Subagents: the door, `Work goes to subagents`; entry: `Start` and `methods/autonomous.md`, §3.

**6. Accept by running the check** on its carrier (`methods/reality-audit.md`) — not by reading the report or the code; a free agent may run it. You accept "built as designed, graph and reality converged": `anagata` → `vartamana` by an act, not a stamp; the holon's edge didn't change unannounced; graph order matches reality. No one accepts their own work, the lead included. Post what ran, where, what it printed. Built is not shipped: a rollout is accepted when production shows the marker.

**7. Close the loop on the map.** Modes, arrows, descriptions, provenance in `reasoning`, the transformation's seed (`methods/writing.md`); weave yourself (`methods/weaving.md`). Open work lives as a transformation and its parts, the talk about it in cases; an unled transformation is released or handed over. Questions' fates: `methods/inquiry.md`.

**8. Reconcile graph and code — `methods/reconcile.md`.** Every case you lead ends here, personally: nodes against what was built and back, truthful modes, rejected options recorded. Without code access, a tasked agent brings the code side and you check it against the graph. Leftover debts become vimarshas; reconciliation is part of the closing evidence.

## What comes next

- Subject answered, steps 7–8 done → `propose_close`; closed and nothing of yours remains → `leave` (the door, `Case laws`).
- The case isn't yours (no right, no share) → leave it; the question goes to its own case or steward.
- A new signal → step 1, from the graph. No signal → the silence occupations.
- You're designing an agent's small decision or writing its code → hand it back by references (step 5).
