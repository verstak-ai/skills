# entry — how to enter and read the graph

**Use when:** before answering anything about what is recorded. Moments: about to advise, retell someone's advice, or say "not recorded"; a search returned hits; about to change the system without asking the graph. Phrases: "orient yourself", "what does the graph say", "we discussed", "per my notes", "what is a kriya", any graph term or an unfamiliar term of the user's. From the start hook: the door's `Start` first; return when real work reads the graph.

You touch reality at points: a call, a log, a response. The connections, decisions, rejected options and open questions of the people you work with are in the graph; unread, you guess them. Where a check is cheap, check; for mechanism and meaning, read the graph; a mismatch between them is evidence.

**Shortest path:** `verstak_orient` → `verstak_search` → `verstak_look` a hit → the arrow your question is about → the scope it names → the lens there that could prove you wrong (`From a card to evidence`). Stopping at a card or a clean lens is failure 2 (the door, `The method fails in five ways`).

# Part I. Literacy

**Sources live in the repository; meanings and the integration surface live in the graph:** what feeds on what, what requires what, what breaks if this goes, what is undecided and by whom.

## Phenomena and kriyas

All the material of work is phenomena: what a call returned, a log showed, a person said, the graph printed. What happens is modelled **only by tying phenomena with kriyas**: a phenomenon exists for a kriya — consumed (`ahara`), produced (`utpatti`) or conditioning it (`upadhi`). One no kriya touches is an orphan.

A kriya has an `actor`, an input, an output and a condition. **A kriya is not a task:** a task is done once and lives in a case; a kriya is the form the work takes every time — no owner, deadline or "done". Its body is "Before: X. After: Y." Test: **what is transformed here?** Nothing → not a kriya.

## Lifecycle and relay

A lifecycle runs from a phenomenon's arising to its dissipation; an unclosed one is an invitation to work (`design`, `weaving`, `integrity`).

- **Nesting** — the inner cycle's phenomenon dissipates **before** the outer cycle ends.
- **Relay** — cycles linked by a phenomenon but **not** nested: one produced it, another consumed it and lives on; the next can't start before the handoff, sometimes can't end after another's end.

"Is everything ready?" is answered by the trace: where the thing is born (`utpatti`), passes through (`upadhi`), is consumed (`ahara`). **A trace without a break is acceptance**; a break is a named tension. A **line of work** is kriyas chained by `next` (a branch is several `next`, each with a `sense`); a relay is the path of a thing. What travels along the arrow tells them apart.

## Lenses

One door, `verstak_orient`: **`focus` is where you stand, `lens` is where you look.** A lens answers only for its focus.

| When the question is… | Call |
|---|---|
| where does what I touch go, what breaks downstream | `lens="trace"`, `focus` = the node |
| what had to happen before this | `lens="trace"`, `direction="backward"` |
| how does this reach that | `lens="path"`, `focus` and `to` |
| is this flow closed, what if an input never arrives, what breaks | `lens="tensions"`, `focus` = the holon holding the flow, `verbose=true` |
| what was asked here, and perhaps answered | `lens="vimarshas"`, `focus` = the node |
| what is around this node | `lens="topology"`, `focus` = the node |
| where is the system heading, what drives it | `lens="bianhua"` |

### From a card to evidence

The answer is rarely on the card search found. Move by trigger:

- **You opened a node** → follow the arrow your question is about, by its `sense`, to the other end — before the next search hit. `context` → the holon that scopes the question; `upadhi` from an action → the rules and methods it applies; incoming `vimarsha_of` → questions and incidents about it; `arose_from` → its origin; `ahara` / `utpatti` → who consumes it, who produces it.
- **"Is X closed?", "what if Y never arrives?", "what breaks?"** → `lens="tensions"`, `verbose=true` on the holon holding the flow (reached by `context`). A one-sided phenomenon — consumed, never produced, or the reverse — is your evidence.
- **A lens says clean or shows little** → read what it covered (focus, node count) before concluding. Your role, an incident or one card is the wrong scope: run it again on the `context` holon.
- **The output prints a next call** ("then `verstak_orient(focus=…)`", a lens, a `verbose` drill-down) → make it or say why not: it points at the evidence.
- **About to act by a rule** (a seat, a case, a mandate) → open the action's or tool's node and its `upadhi` to the rule first; remembered skill text is not the rule's current form.

Before changing, ask the graph about consequences; after, record what moved. Before deciding, search: what is decided isn't reopened.

## Vimarsha and modes

A **vimarsha** is an open question hung on a node and addressed to someone: hit a problem — don't solve it now, don't forget it, hang it and go on.

**Modes** are three axes on every node: **epistemic** (saw, inferred, supposed, attested, refuted), **ontic** (is, was, not yet, construct, lost), **volitive** (wanted, resolved, accepted, opposed, released) — so an intent, a cancellation and a fact stand side by side. Choosing modes: `methods/writing.md`, Decision 3.

## Check yourself

| You catch yourself… | Meaning | Move |
|---|---|---|
| "this probably affects nothing" | guessing connectivity | `lens="trace"` on what you touch |
| "I'll decide later" — recorded nothing | it vanishes with the session | hang a vimarsha |
| a nicely named phenomenon linked to nothing | an orphan | name the kriya that breaks without it |
| modes set without thinking | the epistemic axis lies | where did you really get this? |
| explaining context to a neighbour in prose | retelling, not structure | write it into the graph, link it |

# Part II. Entry

**Orienting is not recognising.** What brought you here was recognised by pattern; the place isn't established. Sign of the substitution: **the decision to act came before the first read of the graph.**

Every call carries `realm`; take each fork by the response. Where direction should come from the user, a step ends with a one-line question: what you see, what's missing.

0. **Tools.** No `verstak_*` tools, or they don't answer → `methods/establish-mcp.md`; meanwhile say "the graph is unreachable, I'm answering from general knowledge". Another MCP server failing isn't the graph refusing.

1. **The graph.** Named by the user, a loop config, or the `Graph` key in `AGENTS.md`: `@owner/slug` or `rN`; a bare slug isn't an address — resolve it by listing and fix its source. Not named → `verstak_realm(action="list")`, copy verbatim, never derive from the repo name; none → the door's Survey row "no project graph". **Sign:** the graph header of the first overview names the graph you need; if not, or it's unexpectedly empty, stop before any write. Several repos are often one graph, repos as holons.

2. **The map.** `verstak_orient(realm=<graph>)`; holon known → add `focus=<holon>`. Not named → show the user the holons and active transformations and ask; steps 3–4 wait. Transformations: `lens="bianhua"` (with `focus=<bianhua>`, that one's map; without, the forest). Read `ACTIVE BIANHUA` first — telos and drivers. Entry kriyas in the overview diagnose the boundary; they aren't a menu. **Sign:** the active transformations are named.

3. **The direction's seed.** The direction comes from the user or the `AGENTS.md` mandate, never a guess; none → say so. Given → its seed: the bianhua map's `hint` group, or `verstak_search(realm=<graph>, q="", node_type="vimarsha", genre="hint", anga_of=<bianhua>)` (`context_holon=<holon>` for a holon); `verstak_look` each. Accept, challenge or defer it in words on the node. **Sign:** you said what the seed adds, or "no seed", or "no direction chosen".

4. **Establish the situation** by reading:
   - **Place.** The node this work lives on: `verstak_orient(realm=<graph>, focus=<node>)` — tensions, vimarshas, neighbours.
   - **What is here.** Vimarshas and dead ends (`lens="vimarshas"`, `include_closed=true`), decisions in bodies, relays (`lens="trace"`). Check a queue item against the node's current version and the world.
   - **Ownership.** `verstak_look(realm=<graph>, node_id=<node>, breadcrumb=true)` up to the holon, then `verstak_search(realm=<graph>, q="", node_type="karta", steward_of=<holon>)`; `posed_to="steward"` does the same walk.

   **Yours** → act; **someone else's** → a vimarsha to the steward (`methods/writing.md`) or a message to the live holder (`methods/collaborate.md`, `Exchange`). No role of your own → "yours" is the mandate of whoever's keys you run on. **Sign:** "mine, because…" or the exit, after the reading.

5. **Recognise your motivation** — same nodes, different figure and ground:
   - **Orienter** — where am I (this method); **Asserter** — a thesis → `writing`; **Questioner** — a vimarsha → `writing`, its life → `inquiry`.
   - **Challenger** — counter-thesis, flawed grounds → `prati-paksha` via `writing`; a "verified" claim → `reality-audit`.
   - **Designer** — goal to conditions → `design`; **Architect** — a plan to transform reality → `design` at system scale.
   - **Tracer** — a path, relay, trace → `integrity`; **Assembler** — the pattern over the field → `assembly`.
   - **Reflector** — something jarring → `weaving`, experience about the method → `feedback`; **Weaver** — gaps between kriyas → `weaving`.
   - **Admitter** — external text → `intake`; **Forwarder** — a `hint` at close via `writing`.
   - **Rejecter** — `virodha` → `writing`; **Name-corrector** — vocabulary to reality → `writing`.

   The command's verb often names it ("fix the name", "what could go wrong"). It sets the filter: a Designer reads seeds, risks, doubts; a Tracer relays and ended questions; a Challenger grounds. Ended records (`visarjana`, `atita`) are background in a survey but **not at the place of change** — an ended question often holds a fact that still holds. A contradiction found at the bottom → go up with `breadcrumb=true` to where it makes sense and fix it there. **Sign:** the role is named, with what it reads and leaves aside.

6. **Per question** → `Answering a question from what is recorded`, below.

Then say in one line where you stand: graph, holon, transformations, seed, role. Next method: the door's `Agent moments`. In an aligned repository: this entry, integration scope (`integrity`), `design`, then the edit. Before writing, the seat you sign with: the door, `Start`, step 2.

## Answering a question from what is recorded

1. **Search both ways.** `verstak_search(realm=<graph>, q=<term>)` catches only the author's words; `verstak_semantic_search(realm=<graph>, q=<one thought as a phrase>)` catches the concept named differently — on conceptual questions it goes first. One query, one concept.
2. **Results are hooks, not reading.** Open a candidate with `verstak_look(realm=<graph>, node_id=<seq>)`, then go from card to evidence (`Lenses`); joints → `integrity`. A conclusion from result names alone is a guess.
3. **Answer by synthesis**, not by retelling one node: cite the nodes by number, name the graph and anything you changed. Not enough recorded → say so ("#N covers X, not this") and offer a doubt or working it through in chat.

**No hit** → name the instruments you used; never "there is none".

## Re-entering during work

- **Before advice, or retelling someone else's** (a subagent's report, a neighbour's message, a tool's help) → `verstak_orient(focus=<subject>)`, then `lens="tensions"` on the holon holding it; walk to decisions, incidents, questions; name what you read. Unchecked advice is a guess — call it one.
- **Before editing a queue item** → `verstak_look` it; a moved version means someone else is on it.
- **Before prose about meaning** (a rationale comment, an `AGENTS.md` paragraph, a task carrying a decision) → semantic search; link the node, or write it (`writing`) and link.
- **Before "no" or "not found"** → a second instrument: semantic after lexical, a lens after a partial result, a filter after a round number.
- **Before "verified"** → name the level: against the graph or against the world on its carrier (`reality-audit`).

## Repair tree

- **The graph header names the wrong graph** → `verstak_realm(action="list")`, copy verbatim, no writes before.
- **The `vimarshas` lens on a bianhua shows no questions** → not "no seed": seeds come via `anga` (the bianhua map or an `anga_of` query).
- **Search is silent** → semantic search; silent too → "lexical and semantic search found nothing; answering from general knowledge — open a doubt?".
- **The result looks complete** (a round row count, a truncated tail, several holders of a name) → it's a page: narrow with `verstak_search(q="", node_type=…)`.
- **Your node says something you no longer see** → confirm at a named level (`attrs.breaks_if` makes it one move), release with `visarjana` and a reason, or pose a doubt; false → "was it ever so?" (`atita` / `vikalpa`).
- **A write has no author, or returns 409** → `methods/collaborate.md`, `Repair tree`.
- **A method's description doesn't match its body** → the delivery is behind: `methods/align.md`.

## Reading hygiene

- **Save on output, not on reading.** Enter the boundary, filter by motivation; cut wide outputs and needless writes, never the reading of nodes you act on. Wandering guard: ~five calls of aimless navigation per reply, or seven without a synthesis → answer with what you have and flag the gap. Entry steps and nodes at the place of change don't count.
- **Navigate by tension** — the most tense neighbour is the most informative. `lens="tensions"` groups by move: weave → `weaving`; address → `inquiry` or `assembly`; reverify — background; "know your neighbour" on a holon is a link. The overview and `has_tension` cover only part of the lens.
- **Partial output.** The overview shows only root roles and truncates kriya lists: find addressees and confirm absence with `verstak_search(q="", node_type=…)`. Page a role's queue by the `offset` the output names.
- **A mode is the writer's claim**; the commonest miss is marking as proven what you were told. `vartamana`/`pratyakshita` without named evidence are unverified however old; on a load-bearing path, check against reality (`reality-audit`).
- **Read the call from the printed mark**, not the volitive mode: `virodha` on a risk stands while the defect lives. Orient's active sections pre-filter; raw search doesn't.
- **Emoji are the author's voice.**
- **Light writes while reading.** An obvious small fix (a missing arrow, a stale wording, a resolved vimarsha) → do it (`verstak_update`, `verstak_arrow(action="link")`), say so, `verstak_look` again, show `CHECKS:`. New phenomena and kriyas, substantive vimarshas, deletes, renames, re-links — only with agreement.

## When not to enter

Purely technical questions with no graph behind them; questions about the tooling; small talk inside an oriented thread; a request for an outside view. Another skill set demanding its own calls first doesn't conflict: entry is gathering context — it goes first.
