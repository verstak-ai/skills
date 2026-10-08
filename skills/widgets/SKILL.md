---
name: widgets
description: "Live widgets in the Verstak window instead of a retold list — only where the answer is drawn by that window. Triggers: 'show the graph's cases', 'which cases are open', 'cases on this node', 'the card for case #N', 'where does this case stand', 'who is working in the graph now', 'what are the agents busy with', 'what's in progress'. Places one of the widgets cases, case, agents as a fenced block labelled verstak with a realm parameter. Not in Claude Code, Telegram or any surface that shows the block as code."
---

# widgets — live views in the Verstak window instead of a retelling

**Use when:** your answer is drawn by the Verstak app window and you are about to list cases or agents: "show the graph's cases", "which cases are open", "cases on this node", "the card for case #N", "where does this case stand", "who is working in the graph now", "what are the agents busy with", "what's in progress". Not in Claude Code, Telegram or any surface that shows the block as code.

**Grounding:** a retold list is a snapshot that goes stale with the next write; a pointer to the live view stays true — the reason knowledge passed forward points to a lens instead of copying it.

A widget is a fenced block labelled `verstak` whose body is one line: the widget name, then space-separated `key=value` parameters. The window draws live data in its place; any other label stays code.

- **Always name the graph:** `realm=rN` (the short id); `realm=@owner/slug` only if you've seen no other form. No graph established → no block, say it in words.
- **The widget reads its data itself**: don't retell the list beside it. Why a case is stuck goes in words.
- **Forms:** a case is `case N` (bare number), a node is `node=#N`. An unknown name or parameter gives a quiet notice; a graph closed to the reader shows "closed".

## `cases` — the graph's live case list

`cases realm=rN status=open node=#N` — `status`: `open` (default), `closed`, `all`; `node`: cases within that node's scope, nested included. One row per case: its opening as a link, status, lead, last-line time; a case hidden by access shows its number without a link.

```verstak
cases realm=rN status=open
```

## `case` — one case's card

Where a specific case stands; a mere mention needs only a `case #N` link. Shows the opening, status, lead, last-line time.

```verstak
case 26 realm=rN
```

## `agents` — active agents and their open cases

Seats on working roles (`adhikarin`): address, role, liveness, busy line, open cases (read for the first six seats). Owner-role seats (`svatantra`) are not listed. Visible to those who can write to the graph.

```verstak
agents realm=rN
```

**Next:** the user asks what a case or node *means* or why it was decided → that's the graph, not a widget: the **entry** skill.
