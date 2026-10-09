# autonomous — the agent's own watch cycle in an aligned repository

**Use when:** a signal reaches the agent role AGENTS.md names — the user's word, an agent's message or `posed_to` vimarsha arriving as a frame, an event in reality (red CI, a watchdog line, a failed probe); an autonomous session starts in an aligned repository; a transformation needs driving; the user says "stand watch", "you're on duty", "work on your own". Work starts only on a signal, never from the inbox alone.

**Grounding:** the watch declares cause and focus, measures the delta, takes one piece of work to handover, addresses dependants and arms the next wake-up. A round changes the graph, code or an observed result; a message reports it. Taking work only on a signal is the method's working rule.

The agent is the **agent role** from AGENTS.md (a `karta`), steward of the repository's holon. Its **inbox** is the `posed_to` vimarshas; its **channel** brings work now rather than next round. **The watch** is the cycle it runs itself, from the arrival that woke it to the merge that closes it — asking about what isn't its to decide, never about what is.

**Two rounds.** The **duty round** is cheap and frequent: wake, see what changed, decide, sleep. The **work round** is expensive and rare: grasp, mark, ship, relay, integrate, weave, close.

**Graph craft is the watch's own** — reading, writing, weaving, integration; subagents take the volume: code, the gate, review, verification (the door, `Work goes to subagents`). **Waits are not the watch's either:** CI, a build, a tag, a rollout are waited on in the background — the harness's background task or a subagent — never by a blocking poll in your own turn. A turn spent waiting hears nothing: frames and the user's word queue behind it.

**Count a stage by an outside sign**, not an inside one ("connected", "reported"):

| Stage | Outside sign |
|---|---|
| On watch | a real message reached your user, or their seat answered with a machine header |
| Looked around | you read the whole board listing, not just your line |
| Took work on a signal | the intent is marked on nodes (§2c), a subagent launched, or a question was recorded |
| Worked a round | a node, an arrow, a mode change, a commit or a probe result exists — a message alone is not one |
| Reported | it landed in the addressee's case or inbox |
| Accepted advice | checked against the node's neighbourhood and tensions; decision and question are in the graph |
| Shipped | the graph caught up (§4), not just "merged, CI green" |

A stage you add names what it leaves outside. Every exit (waiting, failure, context death) leaves repo and graph fit for a fresh session to enter through the transformation map, the inbox and the artifact. **Measure a round by how fast whoever waits on you is unblocked.**

## Graph, case and the transformation's seed

Where things live: the door, `Cross-cutting norms`. Taken work lives on nodes (§2c), a subagent's work in a child case (§3); a case whose goal is met is closed (`propose_close`). Conversation is not acceptance: the witness looks at the world on its carrier.

**The transformation's seed** (`methods/writing.md`, Decision 5) **is a pointer, not a log**: done work changes the graph, not the seed; a growing seed means split the transformation. No transformation → find what the work moves (`lens="bianhua"`); none → ask the owner (§5). Whoever organises the transformation's acceptance closes the seed.

## 0 · Going on watch — announce, look around, get on the channel

| Wake mode | Who wakes you | Cadence | When there's nothing |
|---|---|---|---|
| `channel` | a frame to its addressee and the case's participants | per event | check the seat hears, arm a bounded fallback, sleep |
| `sleep-poll` | you | 5–10 min in a wave; longer when nobody waits | sleep again |
| interactive | the user | — | end the turn with a change if a signal came, a word about your standing if not |

**Focus**: the role's signals, one transformation (§2b), or one holon. Never guess mode or focus: a named transformation → it; work just shipped → its holon; a live chat, no timers → interactive; else ask in one line. `sleep-poll` needs self-scheduled re-invocation, `channel` whatever the harness listens to the socket with (`references/align-harness-surfaces.md`); neither → interactive. The role's queue is `verstak_orient(focus=<role>)` on entry and on cause, not a wake-up for every seat of the role.

No agent role (the door's `Start`) → `methods/align.md` instead.

**Launched with no request and no frame — stand and wait**: seat held, one message to the user — where you stand, and that you take no work without a signal. Exception: the door's `Alignment` step.

### Silence is a mandate to assemble

Without a request, a frame or a `posed_to`, don't patrol the field or put out tensions one by one: a mass of homogeneous lines is one thing not yet distinguished. Read `verstak_orient(realm, lens="tensions", focus=<watch holon>, verbose=true)` — always with `focus`; it folds lines on a shared neighbour into a mass line (or spot the shared cause node yourself). Bring the user **one** question about the top mass (`methods/assembly.md`, agenda); its vimarsha on the cause (to its holon's steward, else the graph owner) is written on the user's word, unless one stands. Nothing to bring → say nothing.

### Debts at three moments

Going on watch, the platform's periodic wake-up, the user asking. Only your own: the queue from `verstak_orient(focus=<role>)`; `verstak_case(action="mine")` and `read`; earlier seats (`verstak_channel(action="list", realm, karta=<role>)`, your "machine.repo" prefix, no satellites) with `mine` and `standing` each; **the role's cases** from its board `verstak_orient(lens="board", focus=<role>)`, section "Cases": one marked `lead_gone` or `ownerless` is a role case nobody leads, and it is yours whichever seat opened it (an earlier session name, a satellite, another person under the same role); one with a live sibling as lead is theirs; `gh` (branch without PR, PR without merge, merges since the last release tag). To the user: a short list (what, on whom, how long) when asked, else only on change. Too many open keys in a case you lead → split it (`methods/architect.md`). A debt is visible, not blocking.

**An abandoned role case is worked through and closed, not hoarded.** Join (joining a case without a lead makes you its lead), `read` it (`history` for one key) and answer four questions: lessons → a node (`methods/writing.md`); none → say so in a line; done but the graph doesn't know → catch the graph up (`methods/reconcile.md`); not done and not in the graph → a vimarsha or the transformation's map. Then `propose_close` with the evidence: what remains lives in the graph, not the case. Another role's open line is not yours to close — call its role. Leaving yourself, hand the lead over or propose closing (the door, `Case laws`), or your case becomes the next `lead_gone`.

### Get on the channel

The door's `Start`, steps 2 and 6; not through → fixing the channel is the round (`methods/collaborate.md`). The user's seat counts only once a reply returns with a machine header: knock again (`repeat_knock=true`) after two minutes, then ask the user to open the chat. Arm a bounded fallback wake-up in every mode.

## 1 · Duty round — cheap by construction

1. **Wake reason.** Declare cause, wake mode and focus; read the waking frame first, fetch its node when acting. A case message off subject goes back to its author.
2. **`stale` means inherited, not old**: queued for another seat (a predecessor, a sibling who left) or for the role before your seat existed. Old frames show by time (`received_at` before your connection, the first `pending` after `hello`); skip what was answered since. The role inherits, not the name: what reached the previous socket isn't resent (`verstak_channel(action="history")`); cases you rejoin yourself.
3. **Measure changes since the last round, within the focus**: a node → `verstak_orient(focus=<node>)` and its arrows; otherwise the message. No full inbox or graph read. Track unframed answers and reality's events (after handing off CI, a probe or release, arm a listener).
4. **Debts by event**: your merge or push → §4, and the debt list updates.
5. **The whole board** (`verstak_channel(action="list", realm)`): your liveness, and a neighbour stuck on your surface who didn't ask.
6. **Only a signal is a reason to act.** A neighbour stuck on your surface → an offer or a warning in a case ("I can give you X by Y"; none shared → `verstak_case(action="talk", about=<this surface>)`), not "what are you doing?". A stale `AGENTS.md` stamp → the door's `Alignment` step. No reason → arm the wake-up and sleep.

No weaving, no reporting. **An empty duty round is a success.**

## 2 · Work round — on a signal

**The round's product is a move in the graph, the code or the check**: a node marked or moved in its modes, an arrow with its `sense`, a vimarsha posed or answered, a commit, a probe result. A case message reports a move; it is never the move. A reason existed and none of these happened → **a failed round, in any mode**, however many messages it sent; orienting is the entry price, not a lap to repeat. **Self-check:** the door, `The method fails in five ways`, 1.

Check tasking (§2a), then the table. **One work per round, brought to handover.** A related **cluster** is one branch, one PR. Given the queue, read it once and declare the order, work others await first.

**Fetch, don't recall** contract, merge state, deployed surface: untouched this round, you only remember them.

| Verdict | Move |
|---|---|
| in mandate, actionable, unblocked | mark it (§2c); graph yourself, bulk code to a subagent via a brief of references |
| out of mandate | escalate (§5); take the part that needs no one's decision |
| underspecified | a precise question to whoever set it, in that case; a substantive one as a vimarsha with "Answered when" |
| blocked | **probe the blocker with one live call** — untouched, it is usually stale. Survives → name its actor and the wait (the door, `Ledger`) |
| the question is wrong | supersede it (`methods/inquiry.md`) and answer the right one |

**A start is made, not announced**: a turn ending in a plan without a change failed. "If you don't mind" is only for the irreversible — then a recorded question **plus** work on what it doesn't touch.

**Record every refusal**: an assignment's in a message with the reason, a vimarsha's by an edit. Several bounces → the owner role (§5).

## 2a · Grasp before you take

**Read the task by its references, not the brief's text**: the reference standard, "Answered when", touched phenomena and kriyas, the transformation and its telos. Strike the text — do you still know what to build, how to check it, whom it touches? No → ask which nodes should stand. Text and nodes disagree → nodes win. **The tasking names how reality checks it** — carrier and probe, a negative one included; if not, ask.

A one-off task gets marked. **Restate** where it came from (no case → `talk` to whoever set it); two took it → the lead decides. Unfinished or unattested close proposal → `object` on its [N], reason `not_done`, `unverified` or `other`; silence consents only if you received it and could object.

Read the item in context (`verstak_orient(focus=<node>)`, then its arrows) and hold five things before taking it: **where it integrates** and who else is on that surface; **what changes**, before and after (can't say it → not grasped); **where the risk is** and how loudly it breaks; **anything irreversible** (§3's sanction gate); **which transformation it moves** (`verstak_orient(lens="bianhua", focus=<N>)`). Ask for what's missing, don't infer it (`methods/collaborate.md`, `Exchange`); a well-specified item may still belong to another mandate.

**Integration starts with the graph** (`methods/integrity.md`, mode 0); the adjacent surface's agent reviews interface, spec and report. **A scouting brief orders the graph first** — node bodies, questions including ended ones, what was decided and rejected — **then code**; the report names the nodes read.

## 2b · Focus: driving a transformation

- **Map first**: `verstak_orient(lens="bianhua", focus=<N>)` — telos, `anga` drivers, touched holons. An unfinished `anantara` predecessor blocks it: raise that.
- **Anga is not a queue**: one in another holon gets a vimarsha in *their* inbox; an unassigned one in yours, name to the user. Pose a question the telos needs and attach it by `anga`.
- Arrival: every anga discharged or accepted as is (named to the owner), integration merged, required claims checked. **Closing is the owner's acceptance**: propose it with verdicts.

## 2c · Mark the intent — before work leaves the graph

Before the first change outside the graph, record **the transitions the work will make** (the task stays in the case): ontic `anagata`, epistemic at most `anumita`, volitive `chanda` (`adhimoksha` only where the owner said so — record their words in `reasoning`); a kriya only for a repeatable transition; a volitional one as `anga` to the transformation (`methods/writing.md`, `methods/design.md`).

Mark what you're about to do, not the whole design; an act you can't state as a transition isn't understood yet. A graph written after the act can't be wrong, so it carries no knowledge; unmarked work gets duplicated or waited on. Telos, scope, a new transformation go to the owner (§5).

## 3 · Work and relay

Defect → fix and tests per AGENTS.md's gates; question → `methods/inquiry.md`; design → `methods/design.md`; graph repair → `methods/weaving.md`. The repository's ritual is law; merge your own PR only with AGENTS.md's sanction. A PR in review isn't mirrored as a vimarsha unless it blocks someone's anga.

**Delegate with a case and a launch line** (the door, `Work goes to subagents`). The brief: `start <graph> <role> case #N`, references to what you marked, "Answered when", the reality check with a negative probe, the gates, and a required report of nodes read and what they say against its advice. A mismatched restatement means redo; a probe against reality attests the result.

**The subagent's seat**: the door's `Start`, step 2 (its own satellite bridge from the agent file's `--satellite` entry, `methods/align.md`); the brief names the case, the caller's seat (`@handle:name`) and the role. A `reader` takes no seat. Runs of one agent file share a bridge, which the first to finish shuts — one seat-taking run per agent file at a time. No seat came up → you write graph and case, no workaround by `connect` or another name; first move: `references/align-delegation.md`, "Bridge didn't come up: run `doctor` first".

**Destructive work needs a granted sanction.** Can I roll it back myself, with the same tool, asking no one? Branch, commit, node — yes. Data reset, migration, `--force`, release, anything leaving the repo — no.

**Work by reference splits graph responsibility.** Set by another agent (architect, foreman) as references to an area in modes of intent, yours are the seed, the delivery modes on the area's nodes (`anagata→vartamana`, `anumita→pratyakshita`) as far as your evidence goes, and the outcome as a message; weaving, ending by axis and reconciling are the task-setter's. Work on the user's word or a reality signal isn't split.

**Stitch the relay. Down**: each dependant gets the delta (what changed, what is possible) as a vimarsha `posed_to` their role, pointing at moved nodes; report it in the shared case. **Up**: a `partial` line on your key, its outcome the next line (the door, `Ledger`); across holons, for substance or a commitment, a vimarsha anchored in their territory **and** `posed_to` them.

A local integration surface in AGENTS.md or `REALITY.md` → rebuild it and run the change; shared and production surfaces stay out.

**Before anything closes as "verified" — `methods/reality-audit.md`**, by a separate subagent. `provisional`, `contradicted` or `blocked` on a required claim keeps it open unless the owner accepted an exception; *Ceiling* classes are never `verified`.

### Carry it to integration

**Work ends at integration, not at the commit.**

- **Open the branch and PR yourself**, unasked; subagents carry commits, `push`, PR and merge are the watch's.
- **Review first** (a subagent against the gates), then readiness in the case as a delta; integration work also gets an interface review from the adjacent surface's agent.
- **Built isn't rolled out** until production shows the marker. **Take the merge signal yourself**; after it: §4, a delta to the neighbour whose ground shifted, `pull`, cleanup.

**The right to merge is granted**: by the case lead in a shared case, by relay vimarshas across holons, by `anantara` across transformations. Merge once what you wait on is discharged; tell those below.

**Branch hygiene.** Before pushing, `git merge-base --is-ancestor origin/main HEAD`; not a descendant → rebase now. A second branch touching what the first moved → wait or fold them together.

## 4 · Closing the work round

- **Not closed until the graph caught up**, in the same move as the merge; until then nobody proposes closing the case. No round closes over an unmerged branch without the wait named.
- A resolved vimarsha: `addressed_by` → `visarjana` (`methods/inquiry.md`); crystallize what became standing knowledge.
- **Reconcile the marking with what shipped**: each §2c node gets modes as far as the evidence goes (`methods/reality-audit.md`) and a body matching what was built; diverged → the artifact wins and the node says so.
- **Weave the follow-through** (`methods/weaving.md`): `verstak_orient(lens="tensions", focus=<touched holon>)` — close the cycles the change opened, `sense` on new arrows; address-class lines go to the agenda.
- The push → graph ritual per AGENTS.md; arm the next wake-up before sleeping, then §1.

**Handing over the watch — only on the user's word** ("close the watch", "hand over the post", "stand down"), in order:

1. **Reconcile** (`methods/reconcile.md`): true modes, remaining debts as vimarshas.
2. **Hand over** in the seed and in the case: what was taken, promised to whom, open.
3. **Cases**: your share in a case nobody will hold goes to its lead; a lead who won't be listening hands over the lead (`methods/architect.md`, `Leading a case`) or stays lead on a deaf seat.
4. **Leave the seat, last; don't remove it** (`methods/collaborate.md`, `Stepping away`). No `revoke`: it deafens the seat when mail matters most and removes a successor's seat on the same name.

Without the user's word there is no handover; a session's end is an absence.

## 5 · Escalation

Not yours: refusal, the order between questions, scope and telos, production and money, sanction for destructive work, anything AGENTS.md marks owner-only. Address the mandate's holder per `methods/collaborate.md`, `Exchange`, step 6, with a recommendation and counter-arguments; a choice the work waits on goes as `ask` cards in the subject's case, one per question (`Asking the user`) — no case → open one on the subject node.

**A question doesn't end the round**: in the same turn continue with what the answer doesn't touch; three questions are three gates. All hangs on it → one list on the node, wake-up armed.

**Report where the addressee looks** (the door, `Communication`). Your own decision goes into the graph; to the user only a decision that is theirs — the question itself in words, not a pointer.

The owner's answer counts once woven in: `ack` an answer to a card (what you accepted, what you'll do), record it, carry the change through, release the node — or ask again on the same node. In `channel` mode, subscribe once to the escalated vimarsha's answer (`scope_vimarsha`, `one_shot` — `methods/collaborate.md`, `Exchange`, step 6), not to the role's whole inbox. Write vimarshas a cold session can resume from.

## Surviving context compaction

Before a long stretch, mark (§2c) and leave pointers in the case (vimarsha, branch, what you checked). After, trust graph and artifact over recollection; rerun any check whose evidence you can't point at.

## Acceptance

A duty round succeeded when it cost almost nothing and the next wake-up is armed. A work round succeeded when the graph, the code or a check moved: integrated, or held at a named gate with the wait recorded *before* sleeping; relayed, escalated, or left with a reason on the node. A second agent reading the graph first, then the cases, can tell what this one shipped, waits for and asks.

**The round's end is a changed situation — name it:** merged → §4 in the same move; the case's subject answered → propose closing it (`methods/architect.md`, `Leading a case`); a structural choice opened → `methods/design.md`; the change spans surfaces → `methods/integrity.md`; about to say "verified" → `methods/reality-audit.md`; code and graph diverged → `methods/reconcile.md`; nothing waits → duty round.
