---
name: on-duty
description: "Use this skill for the duty cycle in a verstakified repo: 'заступай на вахту', 'вахта', 'разгребай инбокс', 'on duty', 'stand watch', 'sweep the inbox', or an autonomous session where AGENTS.md names an agent karta. Also for one transformation: 'продвигай bianhua', 'доведи превращение', 'drive the bianhua'. Loop: orient → agenda → work per repo ritual → reality-audit before verified closure → wire decision deltas into other doers' inboxes → weave → wait or escalate owner decisions. Composes entry, inquiry, integrity, reality-audit, writing, and weaving; NKS carries non-reconstructable decision state between wakes. Needs nks_* MCP tools and a verstakified AGENTS.md."
---

# NKS On-Duty — the watch

An agent in a verstakified repo has an identity: the **agent karta** named in AGENTS.md, steward of the repo's contour. Its inbox — incoming `posed_to` vimarshas on that karta — is where other doers (human and agent) put work that expects *this* doer to act. This skill is the closed loop that drains it: take what is workable, ship it, wire the relay to whoever depends on it, wait consciously, repeat.

The loop is **stateless by design**: the repository/artifact is the canonical implementation state;
the graph carries only non-reconstructable decision deltas, ownership, dependencies, and open
questions needed by a later doer. Every exit point — a wait, a crash, a context death — must leave
both surfaces consistent enough that a fresh session re-enters through the inbox and artifact and
continues. If resuming would require unpersisted session memory, you have left the rails.

## 0 · Identity and orientation

- Run the **entry** protocol: `nks_orient(realm=<AGENTS.md realm>, focus=<focus holon>)`; read the ACTIVE BIANHUA map.
- Open the agenda: `nks_orient(realm=…, focus=<agent-karta-seq>)` — the doer's agenda: your род, the open `posed_to` queue (answered items fold away), the boundaries you steward with their transformation and tension counters.
- No agent karta in AGENTS.md → this skill does not apply; tell the user the repo needs a verstakify pass (the steward slot).

## 1 · Select

From the open queue (the mode badge is authoritative — visarjana/virodha are done, upeksha is parked; the agenda pre-filters, raw edge lists do not):

| Take | Skip — and say why in the report |
|---|---|
| **in-mandate**: the work lives in your stewarded contour and needs no transcendent will | out-of-mandate → escalate (step 6) |
| **actionable**: you can state what would discharge it | under-specified → update it with the question you need answered, addressed back to its poser |
| **unblocked**: not waiting on another doer's part | blocked → ensure the upstream vimarsha exists and is current (step 4); it waits, not you |

Order: items that **unblock another doer first** (someone's inbox waits on you — read it from the relay: who is posed_to on dependents, which bianhua stall), then newest first. Ranking comes from structure, never from urgency stamps.

Work **one coherent cluster at a time**: vimarshas that touch the same files/contour ride one branch and one PR; unrelated ones wait for the next turn of the loop.

## 1b · Mode: driving a bianhua

When the user names a transformation — "продвигай bianhua #N через инбокс", "доведи превращение" — the same loop runs scoped to its **arrival**:

- **Map first**: `nks_orient(lens="bianhua", focus=<N>)` — telos, anga drivers with resolved marks, touched holons. Check the forest for `anantara`: an open predecessor means this bianhua is blocked — surface that instead of pushing work into it.
- **The queue is the anga.** Your picks: open anga of N in your mandate — `nks_search(q="", posed_to=<your-karta>, anga_of=<N>)` (the filters combine), then the unassigned remainder. The mode's core invariant: **no open anga without an inbox** — an anga living in another doer's contour gets a relay vimarsha (anchored, `posed_to`, "Answered when:") into *their* inbox; an unassigned anga in your contour you take.
- **Work raises new drivers**: a question that must be answered for this telos → pose it and anga-attach it (writing); it joins the queue at once.
- **Exit changes**: the cycle ends at arrival — every anga discharged or consciously parked/escalated, integration merged, and every required behavioral claim reality-audited. The bianhua's own closure is the **owner's acceptance**: propose it with the claim-verdict evidence; map N/N and integration green are inputs, never a correctness verdict. Never close it yourself.
- Report progress each tact from the map's resolved count.

## 2 · Work

Each vimarsha names its own flow — follow *it*, not a generic one: a code defect → fix + tests per the AGENTS.md gates; a question → answer it (**inquiry**: `addressed_by`, close); a design ask → the **design** skill; graph repair → **weaving**. Repo ritual is law: branch discipline, quality gate, conventional commits — all from AGENTS.md. Commit, push; open the PR when the repo's flow says PR. Never merge your own PR unless AGENTS.md explicitly sanctions it. A PR awaiting review is a git-surface expectation — do **not** mirror it as a vimarsha to the owner; only when the un-merged branch blocks another doer's anga does the relay vimarsha say so.

## 3 · Integrate locally

If AGENTS.md documents a local integration surface (dev backend, preview server, a make target) — restart or rebuild it and verify the change actually runs; the loop's claim is "shipped and running", not "pushed". Only what AGENTS.md documents: never invent restarts, never touch shared or production surfaces from this loop.

Before closing or relaying `verified`, run the separate **reality-audit** skill over the accepted requirements/hints. Freeze claims independently of the implementor report; check their public boundaries, falsifiers, and fresh evidence. A correction invalidates affected claims and their dependents until rerun. Required `provisional`, `contradicted`, or `blocked` claims keep the work open unless the owner consciously accepts the exception.

## 4 · Wire the relay

The step most loops forget — and the reason the graph sits between agents at all:

- **Downstream** — another doer depends on what you shipped: make the change land in *their* inbox. Either a new vimarsha (anchored in their contour, `posed_to` their karta) or an **update to the vimarsha they already watch**. An update is a **decision delta, not a ping or work log**: changed claim/verdict, evidence pointer, and what is now possible. Do not duplicate the graph, relay, and final report. A content-free "ping" invites ping-pong livelock.
- **Upstream** — you depend on someone: make sure a *current* vimarsha sits in the blocker's inbox stating (a) exactly what you need and (b) what counts as an answer. An explicit **"Answered when: …"** line in the description is what lets the other agent recognize it can discharge you.
- Both directions follow **writing** discipline: anchor (`vimarsha_of` into the addressee's territory) **and** inbox edge (`posed_to`, found via the `steward` arrow — never from the orient showcase). One without the other is invisible.

### Integration merges — only when granted

Merging is off by default (step 2). When the user or AGENTS.md **explicitly grants merge rights** for the integration, the merge order is **agreed through inboxes, never guessed**: the chain of relay vimarshas *is* the order — each states whose part lands first ("Answered when: upstream branch merged, integration green"). Merge your branch only when your upstream vimarsha is discharged; then update the downstream doer's vimarsha with the delta ("merged, integration green" — states of the world, never SHAs/branch names in nodes) so their turn arrives. Across whole transformations the same ordering is `anantara`.

## 5 · Close

- Every resolved vimarsha leaves by an **inquiry** door: `addressed_by` → `visarjana`; crystallize what became standing knowledge. Never leave answered-but-open items — a swept inbox that is not closed re-litigates itself next session.
- **Weave the wake.** Every tact ends with a weaving pass over what it touched: `nks_orient(lens="tensions", focus=<touched holon>)` — close the lifecycles the change opened, write sense on new arrows, reconnect what a new distinction moved (the **weaving** skill). Weave-class tensions are yours to fix before sleeping; address-class go to the agenda. A tact that ships code but leaves the graph torn is not closed.
- Run the repo's push→NKS ritual (phenomena to shipped state, map advanced) per AGENTS.md.

## 6 · Escalate

Transcendent will is not yours (inquiry's boundary): refusal, ordering across questions, scope or telos changes, production and money risk, anything AGENTS.md marks owner-only. Pose it to the **owner karta** (主 in AGENTS.md), anchored where the decision lives, with its own "Answered when:" — then keep working whatever does not depend on it.

## 7 · Wait — or don't

Before waiting, check the queue: is there a next item that does **not conflict** with in-flight work (different contour, different files, no shared branch)? Yes → loop to step 1.

Genuinely waiting on another doer:

| Capability (per AGENTS.md or documented public tooling) | Move |
|---|---|
| A webhook can wake you (e.g. a karta webhook on your inbox) | **verify it is actually armed** (list/inspect — don't assume), then sleep until fired; arm a bounded fallback re-check too if the harness allows — a webhook whose sender died sleeps forever |
| Timers only | sleep the time you would honestly give the other side for its integration part — **never more than 30 minutes** — then re-enter at step 0 |
| Neither (interactive session, no timer) | report state to the user and end the turn — the graph holds; the next watch ("заступай на вахту") re-enters cleanly |

Waking up = **step 0 again** (orient → agenda), never "resume from memory": the world moved while you slept.

## Invariants

- **Repo and graph carry different durable state.** Every exit leaves both consistent; a dead
  session resumes from the inbox plus artifact, without reconstructable repo facts copied into NKS.
- **Updates are deltas**, never bare pings.
- **Every expectation is a vimarsha** — anchored, `posed_to`, with "Answered when:". No side-channel dependencies.
- **One cluster in flight.** No multi-front sprawl inside one loop turn.
- **In bianhua mode, no open anga without an inbox** — assignment is visible in the graph, arrival is proposed to the owner, never self-declared.
- **Every tact weaves its wake** before the loop sleeps or ends.
- **Repo ritual is law.** Gates, branches, PR rules from AGENTS.md; never `--force`; never merge your own PRs without sanction.
- **A direct user instruction interrupts the loop.** The inbox serves the user, not the other way around.
- **Report at every pause**: what was swept, what shipped, what waits on whom, what was escalated.

## What on-duty is NOT

- Not **assembly** (the realm-wide pass) and not bare **inquiry** — it composes inquiry per item and adds the repo work, the relay, and the wait.
- Not a mandate expander: the inbox says what is *asked*; the stewarded contour says what is *yours*.
- Not a scheduler of other agents: you wire vimarshas into their inboxes; when they run is their loop's business.

## Acceptance

- From a cold session, the loop reaches "inbox drained, or every remaining item consciously waiting / escalated / skipped-with-reason" without human input.
- Every wait is represented in the graph — an updated vimarsha in someone's inbox — *before* the agent sleeps.
- A second agent reading only the graph can tell what this agent shipped, what it waits for, and what it asks.
