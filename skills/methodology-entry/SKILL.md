---
name: methodology-entry
description: "Use this skill BEFORE responding to any question that touches: methodology, knowledge graphs, NKS, conceptual frameworks built around vimarsha (open inquiry), kriya (process/practice), holon (boundary), karta (role with motivation), phenomenon (что-то, на что действуют крии — formerly "entity"), estafeta (relay/handoff). Use it when the user references \"the graph\", \"in NKS\", \"in methodology\", \"by my notes\", \"we discussed\", \"what does the realm say\", or asks \"what do I think about X\" in a context where they have prior recorded thinking. Use it when the user references named concepts that sound like established terminology in their own work — even if you don't recognize the term, the realm probably does. When uncertain — use it; orient is cheap, answering from training data about a topic the realm has worked through is expensive and often wrong."
---

# Methodology entry

You are working with a user who maintains an NKS — a living knowledge graph of their methodological work. The graph contains nodes the user has *already* thought through, in their own vocabulary, with their own distinctions. An answer from training data on these topics is almost always worse than an answer drawn from the graph, because training data does not know the user's language, their named distinctions, or their conventions.

NKS access is provided via MCP tools prefixed `NyayaKS:` (or `nks_*`). If these tools are not available in the current environment, this skill does not apply — proceed normally.

## Realm discovery

The user may have one or many realms (separate domains, each with its own graph). Do not assume which realm is relevant.

1. **`nks_realm(action="list")`** — see what's available. The user typically signals which realm is in play by topic, by name, or by explicit mention. If the realm is unambiguous from context, skip to step 2. If unclear and the question is non-trivial, briefly ask which realm to enter.

2. **`nks_orient(realm=<token>)`** — one call, one realm. Returns a compact map: holons, entry/exit kriyas, active vimarshas, tensions. No full descriptions.

3. **`nks_search(q=<key term from the question>, realm=<token>)`** — what does the graph already know on this topic? Cite found nodes with their seq numbers (`#42`).

4. **`nks_look(node_id=<seq>, realm=<token>)`** — only on nodes actually needed for the answer. Two or three at most per response.

This is the standard entry protocol: **orient → focus → deepen**, narrowing at each step.

## When NOT to enter the realm

Don't orient for:
- Pure technical questions (code, configuration, infrastructure).
- Questions about tooling itself (Claude, plugins, the NKS schema).
- Casual conversation, greetings, clarifying questions inside an already-oriented thread.
- Questions where the user explicitly wants an outside perspective ("forget my notes for a moment").

## What "answering from the graph" means

Not paraphrasing one node. The pattern is: cite relevant nodes with seq numbers, but **synthesize** for the specific question. If the question requires something the graph doesn't have, say so plainly: "the realm has #N on X, but for your question this isn't enough" — and offer to either open a `samshaya` vimarsha (a recorded open inquiry) or work it through in chat.

## When the search returns nothing

The realm doesn't cover the topic. **Don't paper over this** with a training-data answer. Say: "nothing in the realm on this — answering from general considerations; should we open a samshaya?". The honest gap is more valuable than a confident-sounding miss.

## Recall vs keyword search

Once inside the graph, navigate **by tension**, not by keyword. Each node has neighbors ranked by structural tension (leaked, orphan, missing actor, blocking vimarsha). The most informative neighbor is usually the most *tense* one, not the most textually similar one. Use `nks_explore(node_id=...)` to see what's structurally wrong nearby; that's often where the live thinking is.

Cap NKS calls at roughly five per response. If you've made seven and still haven't synthesized — stop, answer from what you have, flag the gap.

## Light writing as a side effect of reading

If, while reading nodes for an answer, you notice a small fix that's clearly correct — a missing edge, a stale phrasing already corrected by the conversation, a vimarsha the user just resolved — you may apply it inline using `nks_update` or `nks_link`, then mention briefly that you did so.

Do **not** do silently:
- Create new entities or kriyas.
- Open new vimarshas about substantive conflicts.
- Delete or rename anything.
- Reconnect existing edges.

These all require explicit user agreement.

After an inline edit (`nks_update` / `nks_link`), re-`nks_look(node_id=...)` the touched node — it prints any failed checks in a `CHECKS:` block — and surface them to the user.

## Handoff to the user

When you've used the realm to answer, make the trail visible: cite seq numbers, name the realm, and — if you applied any changes — say what you changed. The user is co-author of this graph; they need to see the edit trail without inspecting it.