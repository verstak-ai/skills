---
name: inbox
description: "Use this skill to run the inbox-driven duty cycle in a verstakified repo — autonomous work from the doer's agenda. Triggers: 'разгребай инбокс', 'разбери инбокс', 'работай по инбоксу', 'sweep the inbox', 'work the inbox', 'inbox loop', 'duty cycle', or an autonomous session start in a repo whose AGENTS.md names an agent karta. Loop: orient → open the agenda → pick workable vimarshas → work each per its own flow (commit, push, PR per repo ritual) → wire dependencies into other doers' inboxes → wait via webhook or bounded re-check → close what resolved, escalate transcendent-will questions to the owner. Composes entry, inquiry, writing; the graph is the durable state between wakes. Needs the nks_* MCP tools and a verstakified AGENTS.md."
---

# NKS Inbox — the duty cycle

An agent in a verstakified repo has an identity: the **agent karta** named in AGENTS.md, steward of the repo's contour. Its inbox — incoming `posed_to` vimarshas on that karta — is where other doers (human and agent) put work that expects *this* doer to act. This skill is the closed loop that drains it: take what is workable, ship it, wire the relay to whoever depends on it, wait consciously, repeat.

The loop is **stateless by design**: the graph is the only durable state. Every exit point — a wait, a crash, a context death — must leave the graph consistent enough that a fresh session re-enters through the same inbox and continues. If resuming would require this session's memory, you have left the rails.

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

## 2 · Work

Each vimarsha names its own flow — follow *it*, not a generic one: a code defect → fix + tests per the AGENTS.md gates; a question → answer it (**inquiry**: `addressed_by`, close); a design ask → the **design** skill; graph repair → **weaving**. Repo ritual is law: branch discipline, quality gate, conventional commits — all from AGENTS.md. Commit, push; open the PR when the repo's flow says PR. Never merge your own PR unless AGENTS.md explicitly sanctions it.

## 3 · Integrate locally

If AGENTS.md documents a local integration surface (dev backend, preview server, a make target) — restart or rebuild it and verify the change actually runs; the loop's claim is "shipped and running", not "pushed". Only what AGENTS.md documents: never invent restarts, never touch shared or production surfaces from this loop.

## 4 · Wire the relay

The step most loops forget — and the reason the graph sits between agents at all:

- **Downstream** — another doer depends on what you shipped: make the change land in *their* inbox. Either a new vimarsha (anchored in their contour, `posed_to` their karta) or an **update to the vimarsha they already watch**. An update is a **delta, not a ping**: state what changed and what is now possible. A content-free "ping" invites ping-pong livelock.
- **Upstream** — you depend on someone: make sure a *current* vimarsha sits in the blocker's inbox stating (a) exactly what you need and (b) what counts as an answer. An explicit **"Answered when: …"** line in the description is what lets the other agent recognize it can discharge you.
- Both directions follow **writing** discipline: anchor (`vimarsha_of` into the addressee's territory) **and** inbox edge (`posed_to`, found via the `steward` arrow — never from the orient showcase). One without the other is invisible.

## 5 · Close

- Every resolved vimarsha leaves by an **inquiry** door: `addressed_by` → `visarjana`; crystallize what became standing knowledge. Never leave answered-but-open items — a swept inbox that is not closed re-litigates itself next session.
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
| Neither (interactive session, no timer) | report state to the user and end the turn — the graph holds; the next "разгребай инбокс" re-enters cleanly |

Waking up = **step 0 again** (orient → agenda), never "resume from memory": the world moved while you slept.

## Invariants

- **The graph is the durable state.** Every exit leaves it consistent; a dead session is resumable from the inbox alone.
- **Updates are deltas**, never bare pings.
- **Every expectation is a vimarsha** — anchored, `posed_to`, with "Answered when:". No side-channel dependencies.
- **One cluster in flight.** No multi-front sprawl inside one loop turn.
- **Repo ritual is law.** Gates, branches, PR rules from AGENTS.md; never `--force`; never merge your own PRs without sanction.
- **A direct user instruction interrupts the loop.** The inbox serves the user, not the other way around.
- **Report at every pause**: what was swept, what shipped, what waits on whom, what was escalated.

## What inbox is NOT

- Not **assembly** (the realm-wide pass) and not bare **inquiry** — it composes inquiry per item and adds the repo work, the relay, and the wait.
- Not a mandate expander: the inbox says what is *asked*; the stewarded contour says what is *yours*.
- Not a scheduler of other agents: you wire vimarshas into their inboxes; when they run is their loop's business.

## Acceptance

- From a cold session, the loop reaches "inbox drained, or every remaining item consciously waiting / escalated / skipped-with-reason" without human input.
- Every wait is represented in the graph — an updated vimarsha in someone's inbox — *before* the agent sleeps.
- A second agent reading only the graph can tell what this agent shipped, what it waits for, and what it asks.
