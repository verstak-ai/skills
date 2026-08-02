---
name: on-duty
description: "Stand watch — the agent's duty cycle in a verstakified repo, driven by the doer's inbox. Triggers: 'заступай на вахту', 'вахта', 'on duty', 'stand watch', 'duty cycle', or an autonomous session start where AGENTS.md names an agent karta. Scopes to one transformation on request ('продвигай bianhua', 'доведи превращение'). Two loops: a cheap duty tact (wake → wake-reason + since-delta → nothing to do? arm the next wake, sleep) and an expensive work tact (select → mark intent → ship per repo ritual → relay → reconcile → weave → close). Wake mode and focus are declared on entry, never guessed. A behavioral claim is reality-audited before it closes or relays as verified. Composes entry, inquiry, design, integrity, reality-audit, collaborate, writing, weaving. Needs nks_* MCP tools and a verstakified AGENTS.md."
---

# NKS On-Duty — the watch

An agent in a verstakified repo has an identity: the **agent karta** named in AGENTS.md, steward of the repo's contour. Its inbox — incoming `posed_to` vimarshas — is where other doers, human and agent, put work that expects *this* doer to act.

**The watch is two loops, not one.** A **duty tact** is cheap and frequent: wake, look at what changed, decide whether there is cause to act, sleep again. A **work tact** is expensive and rare: take the work, ship it, wire the relay, weave, close. Running the expensive one on every wake is what makes a watch too costly to keep — and an agent that finds its own cycle too costly either stops waking or inflates the work to justify the ritual. Keep them separate.

**The two surfaces carry different durable state.** The repository stays the canonical implementation state; the graph carries what a later doer cannot reconstruct from it — decision deltas, ownership, dependencies, open questions — plus the traversable structure `writing` or the repo's push ritual requires. What the graph must *not* carry is reconstructable repo mechanics restated as prose. Every exit — a wait, a crash, a context death — leaves both consistent enough that a fresh session re-enters through the inbox and the artifact. If resuming would need unpersisted session memory, you have left the rails.

When three to five agents drive one feature, they hand vimarshas back and forth in minutes. The watch exists to make that exchange fast, so **the measure of a tact is how quickly whoever waits on you is unblocked** — not how much of the inbox got swept.

## 0 · Entering the watch — declare two things

**Wake mode** — how the next tact starts:

| Mode | Who schedules | Cadence | When idle |
|---|---|---|---|
| **webhook** | the graph wakes you on inbox change | event-driven | verify the hook is actually armed (list/inspect — a hook whose sender died sleeps forever), arm a bounded fallback too, sleep |
| **sleep-poll** | you | 5–10 min while a wave is live; longer when nobody waits on you | sleep again |
| **interactive** | the user | none | report state and end the turn — the user is the scheduler |

**Focus** — what this watch is for: the whole inbox, one transformation (§2b), or one holon/feature.

Neither is guessed silently. If the user didn't say, infer: a named transformation → that bianhua; work that just shipped → its contour; a live chat with no timer capability → interactive. **If inference fails, ask in one line naming the options** — a watch running in the wrong mode either burns tokens polling for nothing or falls asleep when a human was waiting for an answer.

The **mechanism** is the harness's, not this skill's. `sleep-poll` wants a self-paced recurring invocation — one that lets the tact choose its own delay rather than forcing a cadence on it. `webhook` wants the doer's channel registered as its own hook target plus a socket watcher **that reconnects**, because a socket is not durable and a watch gone deaf looks exactly like a quiet inbox. **Arm a bounded fallback wake even in webhook mode.** Per-harness surfaces live in verstakify's `harness-surfaces` reference; where a harness offers none of them, `interactive` is the honest mode — say so rather than claiming a watch nothing wakes.

Then, once per session: run the **entry** protocol and open the agenda — `nks_orient(realm=…, focus=<agent-karta-seq>)`. No agent karta in AGENTS.md → this skill does not apply; the repo needs a verstakify pass.

## 1 · The duty tact — cheap by construction

On every wake:

1. **The wake reason.** A webhook names the vimarsha that woke you — read *it* first, in context. That is why you are awake; the rest of the inbox is background.
2. **The delta.** `nks_orient(lens="vimarshas", since=<previous wake>)` — what changed since you slept. Not a re-orientation of the whole field.
3. **Cause to act?** Someone waits on you, a blocker cleared, a question landed. No → arm the next wake per the mode and sleep.

That is the whole tact: one or two calls. It does **not** re-read the field, does not weave, does not report. **An empty duty tact is a success** — the watch is being kept.

**Waking is not amnesia.** The graph must be sufficient to resume cold — that is a demand on the *graph*, so a crashed session restarts from the inbox alone. It is not a demand that a live session forget: on waking, read the delta and keep what you already hold. Re-deriving the world every five minutes is exactly how the loop becomes too expensive to run.

## 2 · The work tact — select

Only when a duty tact found cause.

**Read the field before picking, once per work session.** Clusters — items that ride one branch, one PR, one decision — are visible only *across* items, never from one. Skipping this is how a watch ships five disconnected PRs where one was right.

Order by:

1. **Someone waits on you** — read it from the relay: who is `posed_to` on dependents, which bianhua stall. In a wave this dominates everything else.
2. **Serves a committed bianhua** — `adhimoksha` on the map is the owner's live priority; it is already in the graph, so use it instead of inventing urgency.
3. **Fully specified** — its "Answered when" needs no decision from anyone.

Then judge each candidate:

| Verdict | Move |
|---|---|
| in-mandate, actionable, unblocked | take it |
| out-of-mandate (needs transcendent will) | escalate (§5) — and take the part that doesn't, rather than escalating the whole |
| under-specified | return it to its poser with the exact question, "Answered when: …" |
| blocked | **name the blocker first** — find the doer via the `steward` arrow or `nks_search(node_type="karta")`; "there is no addressee" is almost never true. Then ensure a current vimarsha sits in their inbox and move on: it waits, not you |
| the question itself is malformed | don't answer it as asked — supersede it with the question that should have been posed (**inquiry**), then answer that |

**Every refusal is an act in the graph, not a line in a report.** Update the vimarsha with why you passed. In an autonomous run there is no one to read a report, and without the record there is no bounce count — so a vimarsha bounced repeatedly can never be recognized as needing the owner. When you see from its history that it has come back several times, re-address it to the 主 karta: repeated bouncing means the question is wrong or the mandate is, and neither is fixed by another round.

## 2b · Focus: driving a bianhua

When the focus is a transformation, the same loop runs scoped to its **arrival**:

- **Map first**: `nks_orient(lens="bianhua", focus=<N>)` — telos, anga drivers with resolved marks, touched holons. An open `anantara` predecessor means this bianhua is blocked — surface that instead of pushing work into it.
- **The queue is the anga**: `nks_search(q="", posed_to=<your-karta>, anga_of=<N>)`, then the unassigned remainder. Invariant: **no open anga without an inbox** — an anga in another doer's contour gets a relay vimarsha into *their* inbox; an unassigned one in your contour you take.
- Work raises new drivers: a question that must be answered for this telos → pose it, anga-attach it, it joins the queue at once.
- The cycle ends at arrival — every anga discharged or consciously parked, integration merged, and every required behavioral claim reality-audited. **The bianhua's closure is the owner's acceptance**: propose it with the claim verdicts as evidence, never close it yourself. A full map and a green integration are inputs to that proposal, never a correctness verdict.

## 2c · Mark the intent — before the work leaves the graph

Once the work is chosen and **before the first change outside NKS**, the deeds you are about to do stand in the graph: each in the project triad — ontic `anagata`, epistemic no higher than `anumita`, volitive `chanda`/`adhimoksha` — and each volitional kriya `anga`-attached to the bianhua it constitutes. The starting-triple canon is **writing**'s, the projection is **design**'s; don't re-derive either here.

**Mark what you are about to do, not the whole design.** A deed you cannot state as a transition — this ahara, that utpatti — is not a node still missing detail; it is a signal that you don't yet know what you are about to build. Think, don't write more nodes.

The order is load-bearing for two reasons. **A graph written after the deed cannot be wrong** — and a record that cannot be wrong carries no knowledge. The projection is a claim; the flip in §4 is what turns it into evidence, and the divergence between what you marked and what shipped is the most informative thing a work tact produces. **And the map reads work in flight**: until the deeds stand in it, the bianhua shows nothing happening, so a second doer reads an idle transformation and either duplicates your work or waits on it.

Marking is not deciding. A telos, a scope, a new transformation stay the owner's (§5) — project *inside* what was already accepted.

## 3 · Work and relay

Each vimarsha names its own flow — follow *it*: a defect → fix + tests per the AGENTS.md gates; a question → answer and close (**inquiry**); a design ask → **design**; graph repair → **weaving**. Repo ritual is law: branch discipline, quality gate, conventional commits. Never merge your own PR unless AGENTS.md sanctions it. A PR awaiting review is a git-surface expectation — don't mirror it as a vimarsha; only when the unmerged branch blocks another doer's anga does a relay say so.

**Destructive work needs a granted sanction.** The test is reversibility: *can I undo this myself, with the same tool, without asking anyone?* A branch, a commit, a graph node — yes, proceed. Dropping data, a migration, `--force`, a release, anything sent outside the repo — no, and no inbox item authorizes it by being well-specified. A destructive task reads as maximally actionable, which is exactly why the gate sits here and not in the ordering.

**Then wire the relay** — the step most loops forget, and the reason the graph sits between agents at all:

- **Downstream** — someone depends on what you shipped: make it land in *their* inbox, as a new vimarsha or an update to the one they already watch. An update is a **delta, not a ping**: what changed, what is now possible. A content-free ping invites livelock.
- **Upstream** — you depend on someone: a *current* vimarsha in the blocker's inbox stating what you need and, explicitly, **"Answered when: …"** — that line is what lets them recognize they can discharge you.
- Both follow **writing** discipline: anchor (`vimarsha_of` into the addressee's territory) **and** inbox edge (`posed_to`). One without the other is invisible.
- The exchange itself — recognizing the boundary, finding the doer, waking them, waiting under a bound, converging or escalating — is **collaborate**. The two bullets above are its most common moves, not its whole lifecycle.

If AGENTS.md documents a local integration surface, rebuild it and verify the change runs — the claim is "shipped and running", not "pushed". Only what AGENTS.md documents; never touch shared or production surfaces from this loop.

**Before anything closes or relays as `verified`, run `reality-audit`.** It freezes each required claim independently of the implementor's report and carries it to one verdict against the canonical public surface. An owner correction invalidates the affected claims and their dependents until rerun. A required `provisional`, `contradicted` or `blocked` claim keeps the work open — unless the owner consciously accepts the named exception. A clean graph is not a verdict about behavior.

Two things bind even if you never open that skill, because they decide whether you *may* say the word at all. **Say which step you checked against**: reading the record — `look` / `orient` / `trace` — is one step and the graph is an instrument for observing the world, not the world; fresh observation on the canonical carrier is the other, and only the second closes a behavioral claim. "Verified" with no named step is not a result. **And *Reality*'s `Ceiling` classes never come back `verified`** — a claim class the owner recorded as having no reachable observation tops out at `provisional`, however the probe went.

### Integration merges — only when granted

When the user or AGENTS.md explicitly grants merge rights, the order is **agreed through inboxes, never guessed**: the chain of relay vimarshas *is* the order. Merge only when your upstream vimarsha is discharged, then update the downstream doer's vimarsha with the delta ("merged, integration green" — states of the world, never SHAs or branch names). Across transformations the same ordering is `anantara`.

**Something landing mid-tact is not an interrupt.** Sort arrivals by what they cost, not by how loud they are — **collaborate** carries the sort: answer it now if you already hold the answer, tell whoever is blocked on their channel that you are finishing, delegate a rebuild or a restart to a subagent or a background run, fold it into the cluster if it blocks the cluster. Only a direct user instruction preempts.

## 4 · Close the work tact

- Every resolved vimarsha leaves by an **inquiry** door: `addressed_by` → `visarjana`; crystallize what became standing knowledge. Answered-but-open items re-litigate themselves next session.
- **Reconcile the projection with what shipped** — for every node marked in §2c, one terminal update carrying the modes the evidence actually covers (`anagata→vartamana`, `anumita→pratyakshita`; a deprecation arrives at `atita`), and the body corrected to what was built rather than what was intended. **A mode flip is a claim**: flip only as far as the evidence reaches — `reality-audit` says how far — and where projection and artifact diverge, the artifact wins. That divergence is what the marking was for; note it on the node rather than quietly overwriting it.
- **Weave the wake** — `nks_orient(lens="tensions", focus=<touched holon>)`: close the lifecycles the change opened, write sense on new arrows, reconnect what a new distinction moved (**weaving**). Weave-class tensions are yours; address-class go to the agenda. This belongs to the *work* tact — a duty tact never weaves.
- Run the repo's push→NKS ritual per AGENTS.md.
- Then back to §1: another cause, or arm the next wake and sleep.

## 5 · Escalate

Transcendent will is not yours: refusal, ordering across questions, scope or telos changes, production and money risk, sanction for destructive work, anything AGENTS.md marks owner-only. The act itself is **collaborate** step 6 — the same exchange with the owner karta (主 in AGENTS.md) as addressee; don't re-derive it here. What the watch adds: keep working whatever does not depend on the answer, and if *everything* does, say so in one list rather than going quiet.

When the owner answers, the answer is not received until it is woven in — record it, carry what it changed, release the node, or re-ask on the same node when the reply doesn't settle it (**collaborate**, "When the answer comes back"). A decision left in the reply that carried it dies with the session that heard it.

In webhook mode, subscribe to the escalated vimarsha so the answer wakes you directly — **collaborate** step 6 carries the how. Write the vimarsha so a cold session could resume from it anyway: if only your live context makes it actionable, it is under-written.

## Surviving a compaction

A long work tact can outlive its own context window. The compaction is not the failure — an unmarked graph is.

- **Before the stretch.** §2c is what makes a compaction survivable: the deeds you are about to do already stand in the graph, so nothing structural lives only in the window. About to start something long that isn't marked? Mark it first.
- **What must never live only in the window.** Not the reasoning — the *pointers*: which vimarsha you are on, which branch carries the work, what you verified and against what. Those belong on the node.
- **After.** Treat it as a cold wake, not as continuity: re-read the vimarsha you were on, take the delta, and trust the graph and the artifact over recollection. A claim you can no longer point to evidence for is not verified — re-run the check instead of inheriting your own confidence.

## Invariants

- **Two loops.** Cheap duty tact, expensive work tact. Never the ritual of the second on the cadence of the first.
- **The graph is sufficient to resume cold** — a demand on the graph, not an obligation to forget on every wake.
- **Repo and graph carry different durable state.** The artifact is the implementation; the graph is what cannot be reconstructed from it. Never repo mechanics restated as prose.
- **A compaction is a cold wake.** Pointers live on the node, never only in the window.
- **An answer is not received until it is in the graph** — a human answers in words; the recording is yours.
- **Mark before you build, reconcile after.** A node born after the deed cannot be wrong, and a record that cannot be wrong is not knowledge.
- **`verified` is earned by evidence, never by narration** — reality-audited against the canonical surface before it closes or relays.
- **Wake mode and focus are declared, not guessed.**
- **Updates are deltas**, never bare pings.
- **Every expectation is a vimarsha** — anchored, `posed_to`, with "Answered when:". No side-channel dependencies.
- **Every refusal is recorded on the vimarsha**, so bounces can be counted.
- **Nothing irreversible without a granted sanction.**
- **One cluster in flight** — coherent for one review, not merely adjacent in the filesystem.
- **In bianhua focus, no open anga without an inbox**; arrival is proposed to the owner, never self-declared.
- **Repo ritual is law.** Never `--force`; never merge your own PR without sanction.
- **A direct user instruction interrupts the loop.** The inbox serves the user, not the other way around.

## Acceptance

The two loops are judged by different standards — one criterion for both is what lets a watch pass by doing nothing:

- **A duty tact succeeds when it costs almost nothing and the next wake is armed.** Finding no cause is a normal outcome. Failing to arm the next wake, or declining the mandate, is the failure — not an empty inbox.
- **A work tact succeeds when something moved**: shipped, relayed, escalated with a named addressee, or consciously parked with a reason on the node. A work tact that ends with only skips is a failure — either the field was misread or everything is blocked on the owner, and both are reportable, not silent.
- Every wait is represented in the graph *before* sleeping.
- A second agent reading only the graph can tell what this one shipped, what it waits for, and what it asks.

## What on-duty is NOT

- Not **assembly** (the realm-wide pass) and not bare **inquiry** — it composes inquiry per item and adds the repo work, the relay, and the wait.
- Not a mandate expander: the inbox says what is *asked*; the stewarded contour says what is *yours*.
- Not a scheduler of other agents: you wire vimarshas into their inboxes; when they run is their loop's business.
