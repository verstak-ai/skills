---
name: entry
description: "Use this skill BEFORE responding to any question that touches: methodology, knowledge graphs, NKS, conceptual frameworks built around vimarsha (open inquiry), kriya (process/practice), holon (boundary), karta (role with motivation), phenomenon (что-то, на что действуют крии — formerly \"entity\"), estafeta (relay/handoff). Use it when the user references \"the graph\", \"in NKS\", \"in methodology\", \"by my notes\", \"we discussed\", \"what does the realm say\", or asks \"what do I think about X\" in a context where they have prior recorded thinking. Use it when the user references named concepts that sound like established terminology in their own work — even if you don't recognize the term, the realm probably does. When uncertain — use it; orient is cheap, answering from training data about a topic the realm has worked through is expensive and often wrong."
---

# Methodology entry

You are working with a user who maintains an NKS — a living knowledge graph of their methodological work. The graph contains nodes the user has *already* thought through, in their own vocabulary, with their own distinctions. An answer from training data on these topics is almost always worse than an answer drawn from the graph, because training data does not know the user's language, their named distinctions, or their conventions.

NKS access is provided via MCP tools named `nks_*` (the harness may prepend its own server prefix to the full tool name). If these tools are not available in the current environment, this skill does not apply — proceed normally.

## Realm discovery

The user may have one or many realms (separate domains, each with its own graph). Do not assume which realm is relevant.

1. **`nks_realm(action="list")`** — see what's available. The user typically signals which realm is in play by topic, by name, or by explicit mention. If the realm is unambiguous from context, skip to step 2. If unclear and the question is non-trivial, briefly ask which realm to enter.

   **Use a canonical realm identity.** In a multi-owner listing, persist and hand off the exact `owner/slug` shown by the listing, or the UUID. A short alias such as `r17` is accepted as a convenience by the tool surface, but is not a durable cross-agent identity: do not infer it, copy it into AGENTS.md, or treat the same-looking alias from another listing as the same realm. On the first orient, verify the returned `REALM:` header names the intended realm. A mismatch or an unexpectedly empty graph is a stop signal: relist and resolve the canonical identity before any write.

   **Realm ≠ repo.** A realm commonly models a whole system across several repositories — each repo a holon, each repo's developer role a sub-karta, in one graph. Working in repo X and needing to reach the code, roles, or questions of repo Y does not mean switching realms: look for Y's holon and roles inside the current realm first. Not finding a realm named after a repo is not a gap — it is the signal you are already in the right realm.

2. **`nks_orient(realm=<token>)`** — one call, one realm. Returns a compact map: holons, **active bianhua** (transformations underway — shown right after the root holons, the map of where the realm is going), entry/exit kriyas, active vimarshas, tensions. No full descriptions. A realm with a populated `ACTIVE BIANHUA` section reads as a map, not a wall — read it first.

3. **`nks_search(q=<key term from the question>, realm=<token>)`** — full-text (keyword) over names + descriptions: what does the graph already know on this topic? Cite found nodes with their seq numbers (`#42`). Keyword only matches the words the author happened to use.

   When the concept might be **phrased differently** than you'd guess, or the query is **conceptual** (you're describing an idea, not a known label), also run **`nks_semantic_search(q=<the idea as a phrase>, realm=<token>)`** — embedding-based, it surfaces conceptually-related nodes that keyword misses. Reach for it by default on conceptual questions, not only after a keyword miss.

4. **`nks_look(node_id=<seq>, realm=<token>)`** — only on nodes actually needed for the answer. Two or three at most per response.

This is the standard entry protocol: **orient → search (keyword + semantic) → deepen**, narrowing at each step.

## When NOT to enter the realm

Don't orient for:
- Pure technical questions (code, configuration, infrastructure).
- Questions about tooling itself (Claude, plugins, the NKS schema).
- Casual conversation, greetings, clarifying questions inside an already-oriented thread.
- Questions where the user explicitly wants an outside perspective ("forget my notes for a moment").
- A realm you seeded in this same session when it can only return your own just-written notes and
  no later role/session needs them. Re-reading self-authored transcription is not memory recovery.
- A precreated but still-empty run/role realm with no state from an earlier independent session.
  Start from the artifact; enter only after artifact-facing work establishes a load-bearing
  decision, dependency, correction, or question for a later cold reader. A future reader does not
  make an empty orient useful to the first writer.

## Coexistence with workflow suites

If an installed workflow suite requires skill invocation before any response,
loading `entry` is not in conflict: reading the realm is memory-fetch, not a
response or an implementation action. When AGENTS.md explicitly requires
orient-first and none of the exclusions above applies, orient first, then follow
the suite's process skills for execution. When AGENTS.md postpones graph work or
the realm is new and empty, obey that boundary and start from the artifact.

## What "answering from the graph" means

Not paraphrasing one node. The pattern is: cite relevant nodes with seq numbers, but **synthesize** for the specific question. If the question requires something the graph doesn't have, say so plainly: "the realm has #N on X, but for your question this isn't enough" — and offer to either open a `samshaya` vimarsha (a recorded open inquiry) or work it through in chat.

## When the search returns nothing

**First escalate, then conclude.** A keyword miss in `nks_search` is not proof the realm is silent — the concept may be recorded under different words. Re-query with **`nks_semantic_search`** before deciding. Only when *that* also returns nothing does the realm not cover the topic.

Then: **don't paper over this** with a training-data answer. Say: "nothing in the realm on this — answering from general considerations; should we open a samshaya?". The honest gap is more valuable than a confident-sounding miss.

## Recall vs keyword search

Once inside the graph, navigate **by tension**, not by keyword. Each node has neighbors ranked by structural tension (leaked, orphan, missing actor, blocking vimarsha). The most informative neighbor is usually the most *tense* one, not the most textually similar one. Use `nks_orient(focus=<seq>)` — with **no lens** — to stand on a node and see its neighborhood (tensions + open vimarshas + neighbors); that's often where the live thinking is. `nks_orient` is the single read-dispatcher for connectivity: **focus** = where to stand, **lens** = which way to look. With no lens it prints a *suggester* naming the lenses worth trying next (`lens="trace"` to walk a phenomenon's estafeta, `lens="tensions"` for structural health, `lens="vimarshas"` for the field of inquiry, `lens="bianhua"` for the forest of transformations — ready / blocked / done) with copy-paste arguments — follow it.

When you open `lens="tensions"`, tensions come **grouped by resolving move** (response_kind), not as a flat list: **weave** (замкни структуру), **address** (ответь / закрой вопрошание), **reverify** (потрогай / обнови модус), **boundary** (санкционированный край — информация, не работа). The group says *who* acts — weave → the **weaving** skill; address → the **inquiry** / **assembly** agenda; reverify → background; boundary → leave it, it's the realm edge. Each surface also declares its **scope / coverage** (a `Scope:` line, «covers N/M detectors») — the cheap `has_tension` filter and the orient overview cover only a subset; `lens="tensions"` is the full registry. Read the declaration: a thin list is not proof of a clean realm.

**A clean tension surface means structurally clean only.** It says nothing about implementation correctness, public API compatibility, or whether tests pass. Behavioral closure belongs to the separate **reality-audit** skill.

## Cold-role decision budget

When prior graph state can affect the first repository-facing implementation or verification
action, spend at most five NKS calls before it: orient the focus, open the karta agenda when one
exists, then only the search/look needed for that action. With no prior independent state, spend
zero calls before the first artifact action. Stop earlier when the graph has answered it. A cold
role loads `entry` plus the one role skill it needs next — architect→`design`, writer→`writing`,
verifier→`integrity` — not the whole suite.

An empty realm is not permission to model the whole assignment before touching the artifact. Model
only what is load-bearing across rounds: the focus boundary, accountable roles, accepted
decisions/corrections, and unresolved cross-role questions. Keep that bootstrap to one batch and at
most eight nodes unless the task itself requires a richer topology; grow it from witnessed work,
not imagined completeness.

After the first action, every extra call must answer a named uncertainty that can change implementation, verification, or handoff. Do not tour the realm, re-read facts already present in the checked artifact, or copy the same state into NKS, relay, and final prose. Batch a settled write, verify it once, and make the relay a decision delta. If seven calls pass without a changed decision, stop and synthesize or name the gap.

Keep graph work subordinate to artifact work inside each implementation phase. Count NKS calls
against artifact-changing edits plus test/probe actions. If NKS calls become greater than or equal
to that artifact-action count after the first repository action, stop graph calls until another
edit or probe advances reality. This ratio is a local circuit breaker, not permission to inflate
shell commands or split one edit into noise.

This is a guardrail, not enforcement: a prose budget cannot prevent an agent from spending more
round trips. When the host or MCP exposes a call counter/budget, obey that harder boundary. Report
actual NKS calls and failures in benchmarked or cost-sensitive work; never claim the budget held
from the instruction alone.

## Tool-error circuit breaker

Do not turn a recoverable NKS error into a retry storm or a second graph:

- `409 Resource already exists` — do not create again. Search/list, resolve the existing object,
  and continue from it.
- `400 Unknown realm reference` or an unexpectedly empty orient — stop all writes, relist, select
  the exact listed `owner/slug` or UUID, and verify the `REALM:` header. Never fall back to a short
  alias or create a replacement realm.
- `422` on a node/arrow — do not mutate a different type until something sticks. Read the live
  factory schema or `nks_arrow(realm="?")`, correct the invalid operation once, and preserve the
  original semantic intent.

After the same error class repeats twice, or after three NKS failures in one task phase, stop graph
writes for that phase. Continue reachable artifact work and verification; hand off the literal
error and the unwritten decision as a provisional gap. Graph closure never outranks the artifact.

## Seeds and the map

The map is primary, seeds are remainder. Open work lives as anga-vimarshas on the `ACTIVE BIANHUA` transformations; a seed vimarsha (`genre=hint`) legitimately carries only what the map can't — external-world state, a chosen ordering of priorities, conventions. Read a seed as a pointer: never trust its snapshot over what orient and the lenses show now, and never copy lens output into one.

## Reading hygiene

- When reporting "what's open / what remains", exclude volitive `visarjana` (released) and `virodha` (rejected) — the mode badge is authoritative, not the node's name. orient's active sections pre-filter; raw `nks_search`/`nks_look` output does not.
- **orient lists are a showcase with a declared scope, not the inventory.** ROOT KARTAS shows root roles only (sub-roles fold into "· N sub"); kriya lists declare a "+N quiet" remainder. Never pick an addressee or conclude "no such node" from an orient list — one `nks_search(q="", node_type=...)` returns the actual set.
- Emojis on nodes are the author's voice — don't "fix" them.

## Light writing as a side effect of reading

If, while reading nodes for an answer, you notice a small fix that's clearly correct — a missing arrow, a stale phrasing already corrected by the conversation, a vimarsha the user just resolved — you may apply it inline using `nks_update` (node) or `nks_arrow(action="link")`, then mention briefly that you did so.

**A stale-flagged node you are already reading is yours to digest on the spot.** One cheap check — does its claim still hold? (an `attrs.breaks_if` condition, when present, makes this a single move) — then: confirm (touch the epistemic mode), release (`visarjana` with the reason), or pose the doubt. Don't step past a rotten node you noticed: the reader is the cheapest agent of forgetting.

Do **not** do silently:
- Create new phenomena or kriyas.
- Open new vimarshas about substantive conflicts.
- Delete or rename anything.
- Reconnect existing arrows.

These all require explicit user agreement.

After an inline edit (`nks_update` / `nks_arrow`), re-`nks_look(node_id=...)` the touched node — it prints any failed checks in a `CHECKS:` block — and surface them to the user.

## Handoff to the user

When you've used the realm to answer, make the trail visible: cite seq numbers, name the realm, and — if you applied any changes — say what you changed. The user is co-author of this graph; they need to see the edit trail without inspecting it.
