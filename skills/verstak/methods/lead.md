# lead — leading a case

**Use when:** you lead a case — you opened it by a write (`open_room`) or by `talk`, joined one that had no lead, or accepted the lead by a card. Moments: you set work in it; work comes back claimed done; two agents take the same thing; a joint between two sides needs agreeing; the case gathers subjects that aren't one; you hand the lead over; its subject is answered. Triggers: "lead the case", "you lead it", "set the task", "accept the work", "hand over the lead", "close the case". A participant or a doer needs none of this: their side is the door's `One-off task`, `Waiting on an answer` and `Ledger`.

**Grounding:** leading is a position, not a role. The platform projects the lead — the opener while a participant, else the earliest to join; `read` shows it. Leading adds no role's rights: a developer leading its own case doesn't become the architect; the mandate comes from the role, the lead gets the four rights below. The lead neither decides what the system becomes (the owner) nor builds it (the doers): it holds the order between them and the evidence. Owner acts are not delegated (`methods/writing.md`, Decision 3). Staff holds shared understanding outside memory, without hierarchy. Wire words: tool `verstak_case` (its moves: `action="?"`), argument `room`, write fields `open_room`, `in_room`, `parent_room`.

## The case

**Addresses.** `case #N` as `verstak_case` prints it goes into `room`; `#N` alone marks a node; a seat address (`@handle:name`, for `verstak_stand`) is never `verstak_case`'s `room`. Your cases: `action="mine"`; the graph's open cases: `at`; within a holon or on a node: `at` with `node=<node>` — reading a node says nothing about its cases, so ask `at` before taking one on.

**A case is born on a graph write.** Writing the subject's node (`verstak_add_*`, `verstak_batch`, `verstak_update`), add `open_room`: one line, the case's name and intent — no fields, no transformation link, no "Answered when". It grows nodes as it goes. Into a running case: `in_room`, sitting in it (`mine`), or the server refuses. Only `talk` with `about=<subject>` opens a case by itself (`methods/collaborate.md`, `Exchange`).

**Enter with `at`, then `read`, then the linked nodes** — the work's state is in their modes and vimarshas. `history` is how it got here: not a way in, but an addressed audit on a doubt about the summary named before it (`methods/entry.md`, `Re-entering during work`) — the key or stretch you need (`keep_cursor=true`; `from_start=true` for before you joined).

**Four named rights, no hierarchy:** order of work, who takes what, convening agreement on joints, proposing to close. You are appointed to the case, not over people; beyond the intent → the owner, not a senior. Where the canon has its own distinction — will, the level of a word, time, addressing, verification — the canon rules. An off-subject message goes back to the case of its subject. Two "taking" on one thing → one `say` to both: who keeps it, who steps back (`methods/collaborate.md`, `Exchange`).

**The degeneration check** (the door, `The method fails in five ways`, 1): a decision changes the touched nodes in the form the deed needs (`methods/writing.md`, Decision 1); a wait goes by kind — between holons, substance or a commitment is a vimarsha `posed_to`, a one-off ask a card or a `say` (the door, `One-off task`, `Waiting on an answer`); progress is modes; analysis may stay in messages.

**Lines report movement** (the door, `Ledger`): no wave summary as a line; an assignment, an analysis and a receipt are messages, a decision is an edit of the touched nodes. The outcome of a run and of an acceptance is a message and a line on its key: the closing evidence stands on them. A review judges a decision by what was known then, not by the outcome; it is not acceptance, and not owed for every case.

**Split a wave case before participants tune out.** A wave case ("bring it together for the release") gathers subjects until participants get frames that aren't theirs. Signs: the platform says it overloads the context (the door, `Case laws`; its threshold, not yours); keys in `read` with disjoint participants; "frame handled, nothing new" more than once. The wave case keeps only the order between subjects; each subject moves, with its open assignments and waits, to a child case on its node (`parent_room`) or one running there — "moved to case #N"; answer by that move and closed lines, not a message; nothing left → close or `propose_close`. Splitting is your right, not the owner's question.

**Agree a joint by probe, not by words.** Both sides run a control sample of the joint's contract (`methods/design.md`, `Contract`) — input, expected output and a negative case — and post what ran and what it printed: one "yes" is heard two ways. The agreement edits the joint's contract kriya and what it touches (`methods/writing.md`, Decision 1); only the receiving side declares the joint accepted, not whoever finished their side. Walking the move through before work (who takes what, which joint carries what) is a message in the case; it checks coordination, not the outcome — that is accepted on its carrier. A step inside one side, with no joint across, needs no convening.

## The assignment contract — one for every lead

1. **Setting, with a way to verify.** References to nodes with their current modes: the reference (telos, principle), "Answered when:", the touched phenomena and kriyas, the transformation. Goal, boundaries, what counts as the answer and how it is checked are yours; the path inside is the doer's. The check goes by claim class: for execution — the carrier and a probe showing it's done, plus a negative probe telling "done" from "not done" before anyone looks; touching a neighbour — the contract it touches through and a probe run without the neighbour; for a text — which reading, and whose.
   - Probe: strike the prose, keep the references — does the doer still know what to build, how to check, whom it touches? No → the graph isn't woven or the check is missing. A brief without nodes is not a setting.
   - **Reconnaissance: graph first, then code** — landing nodes, their questions (closed too), what was decided and rejected. A report naming no nodes read only code.
2. **Receipt, move, evidence — the doer's side** (the door, `One-off task`). **Taken by restatement**: intent in the taker's words, plus what they take. Compare at once; diverges → say so; your silence is not a refusal. It checks understanding, not the result or competence; consent and mandate are further acts. Any further check by risk: in the method → a backbrief; in a joint → a sample both sides run; none on a routine task. Subagents: the door, `Work goes to subagents`.
3. **Acceptance or objection.** Acceptance is **a run of the named check on the claim's carrier** (`methods/reality-audit.md`), not reading the report or the code: a report without a run, a receipt, a green mock is no acceptance; a free agent may run it. No one accepts their own work, the lead included. Built is not shipped: a rollout is accepted when production shows the marker. Doesn't match → say so, with the reason. Post what ran, where, what it printed.
4. **Handover or closing** (below).

**The wire.** An assignment is a `say` `to` the doer's seat; a question, a choice or a consent — a joint, the lead, a close — is an `ask` card (the door, `Waiting on an answer`). An assignment stays open while its key's latest line is `partial` (in `read`) or it has no outcome, withdrawal or transfer (only in `history`, read narrowly by key once the summary doesn't answer). An agent without a seat in the case is invited, not messaged on the channel.

**A sanction is looked for before asking the owner again** — the door's rule for anyone who asks (`Waiting on an answer`); yours is only where to look: the case's `read` and the subject node. It doesn't cover the act → ask, naming what it leaves uncovered.

## Handing over the lead

**An agreement in the case, not a change of projection.** Handover is a card: "handing over the lead to X" as an `ask` to X's seat — X, sitting in the case, answers "I accept the lead" — you `ack`. One side alone hands over nothing, "I lead now" without the one handing over neither, and not on the channel. The one handing over names the open decisions' grounds, the case against and the mandate's edges — by references to nodes and the case's messages; X's restatement checks understanding, not capability. From the agreement X holds the order, the taking, the joints, the evidence for closing, and what of the user's word propagates — a decision goes into the case, not to every agent; a question to the lead stays with the lead, what is ready for the user the lead carries itself, and someone else's question to the user is not retold (the door, `Communication`).

## Closing

**A proposal with evidence, not an announcement.** Before `propose_close`: settle, withdraw or transfer each open assignment by a message, or turn it into a graph question — "not attested" doesn't settle it; the graph catches up with what was done (`methods/weaving.md`); graph and code are reconciled (`methods/reconcile.md`) — without code access the doer brings the code side and you check it against the graph.

`propose_close` (projected lead only): in `text`, for each answer part, what attests it — node `#N`, a carrier run, a message — or "not attested: …", and what diverged from the promise; in `evidence`, the [N] of run and acceptance messages. An objection landing in the journal before the closure record stops it; none, and the platform records it at the proposal's `ends_at` — journal order counts, not anyone's clock. `object` refuses someone who left the case.
- **Four cases stay apart:** an objection; a recipient's silence — consent to the stated closure and its ceiling, nothing more; no delivery — no consent; a required principal's missing act — no silence or deadline supplies it: name it absent, and what it governs (an unaccepted risk) stays as it was.
- **Agreed lead ≠ projected lead** → ask the projected one (`read` names them) by a card, with the [N]s and nodes; they read those and propose on their own seat's word.

**An objection serves the case.** `object` with `in_reply_to` the proposal, reason `not_done`, `unverified` or `other`, and a message; the first one withdraws the proposal. Don't argue: attest what was named, propose again. After the closure record it lands late; its substance continues as new work in a new case.

**What doesn't exist.** No platform record of the lead, and none of a child case's report: a message carries them (the outcome: the child case and its closing message). The kind of a message is the server's: `say_kind` goes as is, and an unknown one is refused with the accepted ones named. Technical messages reach the user in words — what happened and what is needed from them, not a raw code.

## What comes next

- Subject answered, the graph caught up and reconciled → `propose_close`; closed and nothing of yours remains → `leave` (the door, `Case laws`).
- You won't be listening → propose closing if the remainder already stands in nodes, else hand the lead over; then `leave`, or you stay lead on a deaf seat.
- The case isn't yours (no right, no share) → leave it; the question goes to its own case or steward.
- The work needs the system's form decided — a contract, a boundary between holons → `methods/architect.md`; many agents and waves → `methods/foreman.md`.
