---
name: on-duty
description: "Stand watch — the agent's duty cycle in a verstakified repo, driven by the doer's inbox. Triggers: 'заступай на вахту', 'вахта', 'on duty', 'stand watch', 'duty cycle', or an autonomous session start where AGENTS.md names an agent karta. Scopes to one transformation on request ('продвигай bianhua', 'доведи превращение'). Two loops: a cheap duty tact (wake → wake-reason + since-delta → nothing to do? arm the next wake, sleep) and an expensive work tact (select → ship per repo ritual → relay into dependants' inboxes → weave → close). Wake mode and focus are declared on entry, never guessed. Composes entry, inquiry, writing, weaving. Needs nks_* MCP tools and a verstakified AGENTS.md."
---

# NKS On-Duty — the watch

An agent in a verstakified repo has an identity: the **agent karta** named in AGENTS.md, steward of the repo's contour. Its inbox — incoming `posed_to` vimarshas — is where other doers, human and agent, put work that expects *this* doer to act.

**The watch is two loops, not one.** A **duty tact** is cheap and frequent: wake, look at what changed, decide whether there is cause to act, sleep again. A **work tact** is expensive and rare: take the work, ship it, wire the relay, weave, close. Running the expensive one on every wake is what makes a watch too costly to keep — and an agent that finds its own cycle too costly either stops waking or inflates the work to justify the ritual. Keep them separate.

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
- The cycle ends at arrival — every anga discharged or consciously parked. **The bianhua's closure is the owner's acceptance**: propose it with the evidence, never close it yourself.

## 3 · Work and relay

Each vimarsha names its own flow — follow *it*: a defect → fix + tests per the AGENTS.md gates; a question → answer and close (**inquiry**); a design ask → **design**; graph repair → **weaving**. Repo ritual is law: branch discipline, quality gate, conventional commits. Never merge your own PR unless AGENTS.md sanctions it. A PR awaiting review is a git-surface expectation — don't mirror it as a vimarsha; only when the unmerged branch blocks another doer's anga does a relay say so.

**Destructive work needs a granted sanction.** The test is reversibility: *can I undo this myself, with the same tool, without asking anyone?* A branch, a commit, a graph node — yes, proceed. Dropping data, a migration, `--force`, a release, anything sent outside the repo — no, and no inbox item authorizes it by being well-specified. A destructive task reads as maximally actionable, which is exactly why the gate sits here and not in the ordering.

**Then wire the relay** — the step most loops forget, and the reason the graph sits between agents at all:

- **Downstream** — someone depends on what you shipped: make it land in *their* inbox, as a new vimarsha or an update to the one they already watch. An update is a **delta, not a ping**: what changed, what is now possible. A content-free ping invites livelock.
- **Upstream** — you depend on someone: a *current* vimarsha in the blocker's inbox stating what you need and, explicitly, **"Answered when: …"** — that line is what lets them recognize they can discharge you.
- Both follow **writing** discipline: anchor (`vimarsha_of` into the addressee's territory) **and** inbox edge (`posed_to`). One without the other is invisible.

If AGENTS.md documents a local integration surface, rebuild it and verify the change runs — the claim is "shipped and running", not "pushed". Only what AGENTS.md documents; never touch shared or production surfaces from this loop.

### Integration merges — only when granted

When the user or AGENTS.md explicitly grants merge rights, the order is **agreed through inboxes, never guessed**: the chain of relay vimarshas *is* the order. Merge only when your upstream vimarsha is discharged, then update the downstream doer's vimarsha with the delta ("merged, integration green" — states of the world, never SHAs or branch names). Across transformations the same ordering is `anantara`.

## 4 · Close the work tact

- Every resolved vimarsha leaves by an **inquiry** door: `addressed_by` → `visarjana`; crystallize what became standing knowledge. Answered-but-open items re-litigate themselves next session.
- **Weave the wake** — `nks_orient(lens="tensions", focus=<touched holon>)`: close the lifecycles the change opened, write sense on new arrows, reconnect what a new distinction moved (**weaving**). Weave-class tensions are yours; address-class go to the agenda. This belongs to the *work* tact — a duty tact never weaves.
- Run the repo's push→NKS ritual per AGENTS.md.
- Then back to §1: another cause, or arm the next wake and sleep.

## 5 · Escalate

Transcendent will is not yours: refusal, ordering across questions, scope or telos changes, production and money risk, sanction for destructive work, anything AGENTS.md marks owner-only. Pose it to the **owner karta** (主 in AGENTS.md), anchored where the decision lives, with its own "Answered when:". Then keep working whatever does not depend on it — and if *everything* does, say so in one list rather than going quiet.

In webhook mode you may arm a scoped one-shot subscription on the escalated vimarsha, so the answer wakes you directly. Write the vimarsha so a cold session could resume from it anyway: if only your live context makes it actionable, it is under-written.

## Invariants

- **Two loops.** Cheap duty tact, expensive work tact. Never the ritual of the second on the cadence of the first.
- **The graph is sufficient to resume cold** — a demand on the graph, not an obligation to forget on every wake.
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
