# Phrasebook: what users call the thing they need

Open this when the door's routes didn't resolve a request: the phrase fell between two routes, or into none. The phrases are not templates — they show register and concern; recognise the kind of request by them, not by the letter. **Gets** is what the user ends up holding.

## Contested pairs — read first

Dividing signs: the door, Step 3 (the two channel pairs carry theirs below). Here, the words that give each pair away.

| Pair | Marker words |
|---|---|
| **reconcile** ↔ **weaving** | reconcile: "in the code", "after the merge", "we renamed it". weaving: "there's no link", "where does this come from", "who does this" |
| **integrity** ↔ **reality-audit** | reality-audit: any verb about working — "works", "fixed", "shipped", "installs". integrity: "who's affected", "is it backed by anything" |
| **inquiry** ↔ **assembly** | inquiry: singular — "this question", "close it", "put it aside". assembly: "all of this", "the picture", "directions" |
| **writing** ↔ **design** | writing: a fact being stated. design: "what's best", "which one", "think it through" |
| **writing** ↔ **minding** | minding: "I", "me", "my" about machines, deadlines, people, habits — not about one project |
| **writing** ↔ **intake** | intake: "it says here", "they sent", "in this article", a link in the request |
| **entry** ↔ **integrity** | entry reads what's recorded about a place; integrity walks what a change touches: "what breaks", "who should I warn" |
| **design** ↔ **code-work** | "just do it, we've decided" → code-work |
| hearing ↔ addressing (**collaborate**) | hearing — arrived, silence, no author: "you can't hear me", "writes have no author". addressing — to whom, what (`Exchange`): "ask the other one", "who owns this" |
| **autonomous** ↔ **foreman** | foreman: "spread this across the agents", "who's stuck". autonomous: "work on your own", "take it to merge" |
| **establish-mcp** ↔ **collaborate** | establish-mcp, transport to the graph: "I don't see the tools", "oauth". collaborate, the channel's socket: "you can't hear me", "the frame didn't arrive" |
| **feedback** ↔ a complaint about the work | feedback: "the skill is wrong", "the description says one thing, it does another" |

**Not a fork:** a standing preference ("always show the plan") is an instruction — process → `AGENTS.md` or the project graph; how to talk to the user → minding; files outside the worktree configure nothing.

Still unresolved → ask the user in one line, naming both readings and what you'd do for each.

## entry — "what's actually recorded here"

**Gets:** an answer standing on their records. "what's going on with the project?" · "find what we decided" · "why did we do it this way?" · "catch me up"
**Elsewhere:** "what breaks if I change it" → integrity · "the picture" → assembly · "does it work" → reality-audit · "the graph won't connect" → establish-mcp · "write down what we decided" → writing.

## writing — "so it doesn't get lost"

**Gets:** a record anyone can find later. "write this down" · "record that we decided against the queue" · "note there's a risk" · "put this on Sam, he should answer"
**Elsewhere:** "remember I'm on an old MacBook" → minding · "think through how to build it" → design · "the connection is missing" → weaving · "close this question" → inquiry · "open a direction" → assembly · "record what this issue says" → intake.

## design — "how should this be built"

**Gets:** a path from the goal back to what exists, with order and risks. "let's think through refunds" · "what can go wrong?"
**Elsewhere:** "just do it" → code-work · "we decided X, record it" → writing · "what does it affect" → integrity · "turn their draft spec into something" → intake, then here. No goal named → ask; design doesn't invent it.

## weaving — "the links aren't drawn"

**Gets:** a graph that holds: each output consumed, each link with a sense, each action one actor. "tie the ends together" · "who actually does this?" · "something creates this, nothing cleans it up"
**Elsewhere:** "how to build it" → design · "answer the open questions" → inquiry or assembly · "what else does it affect" → integrity · "create a node" → writing. Needs an existing graph.

## code-work — "just build it"

**Gets:** the change merged: the graph read first, the graph caught up after. "fix this bug" · "we've decided, build it" · "open the PR"
**Elsewhere:** an open structural choice → design · "does it work" → reality-audit · "tidy after the merge" → reconcile.

## reconcile — "the graph lies about the code"

**Gets:** code and record back in line, plus a report of debts. "check the graph against the code" · "we merged — clean up after us" · "nothing left about what we ripped out?"
**Elsewhere:** "a link is missing" → weaving · "does it work" → reality-audit · "is the report even true?" → integrity · "fix the neighbours' area" → a question to their steward (collaborate), never silently.

## inquiry — "what's open"

**Gets:** each question with one outcome, the understanding recorded. "what's hanging?" · "close this, we've answered it" · "put this aside" · "retire it properly"
**Elsewhere:** "write a question down" → writing · "group into directions" → assembly · "close them all so the list is clean" → the user's decision · "done, it works" → reality-audit first · "my question hangs in the void" → no addressee: inquiry; addressee named but their seat empty: collaborate, `Exchange`.

## assembly — "I'm drowning"

**Gets:** directions with goals and order, questions folded under them, an agenda of what only they decide. "pull it all together" · "what do I have to decide myself?"
**Elsewhere:** "plan from the goal" → design · "fix the links" → weaving · "close this one question" → inquiry. A new direction: create it as your proposal (`chanda`) and offer its name and goal; it is held only once the owner accepts.

## integrity — "who does this affect"

**Gets:** what's affected, with owners and status — or "claimed × backed by". "hook our service up to theirs" · "we're changing the format — who reads it?" · "is this report backed by anything?"
**Elsewhere:** "check it really works" → reality-audit · "how to adapt it" → design · "finish the link" → weaving · "wake the neighbour" → collaborate.

## reality-audit — "I don't take your word for it"

**Gets:** "claim × verdict" with a named carrier and exit code. "show me" · "tests pass but it doesn't work for me" · "accept the work"
**Elsewhere:** "what does this touch" → integrity · "code against the graph" → reconcile · "the skill let me down" → feedback · "what counts as done" → design, never mid-work · "review my diff" → a cold review. Needs no graph.

## intake — "here's someone else's text"

**Gets:** nodes linked to their source, no duplicates, honest trust. "pull in our GitHub issues" · "here's the README, record it"
**Elsewhere:** "record what we decided" → writing · "a roadmap from the issues" → product-roadmap (it composes intake). The slice is declared, never "the whole tracker".

## autonomous — "work on your own"

**Gets:** an agent that wakes on a signal (the user's word, a case message, an event), carries work to merged and leaves a readable trail. "go on watch" · "take it to merge, not to 'I pushed'" · "hand over the post"
**Elsewhere:** "spread across the agents" → foreman · "you can't hear me", "ask the other one" → collaborate · "assemble the graph" → assembly. No agent role in `AGENTS.md` → say the repo isn't aligned.

## collaborate — "you can't hear me"

**Gets:** a live channel — reachable, visibly listening, writes signed. "are you there?" · "messages stuck undelivered" · "your writes have no author" · "drop the seat" (a bare release; handing over the watch is autonomous)
**Elsewhere:** "task the agents" → foreman · "the tools won't connect" → establish-mcp · "how is their work going" → not on the board.

### collaborate, `Exchange` — "ask the other one"

**Gets:** the question at the right addressee — a case message, or a vimarsha if substantive — the addressee woken, the answer recorded. "ask the other agent" · "pass it to whoever handles it" · "tell the other one not to build the same thing" · "escalate to me" · "who owns this?"
**Elsewhere:** "split the work" → foreman · "write down what we agreed" → by substance, not a "we talked" record. Needs a named seat, not hearing: `register` is enough to speak.

## architect — "hold integrity", "lead the case"

**Gets:** one agent holding intent and integrity, or one shared case: decisions prepared with options and cost, agents tasked from the woven graph with a check, acceptance by running it. "hold the architecture" · "prep a decision, I'll choose" · "check what we built against what we designed"
**Elsewhere:** a feature inside one holon → design · "check it works" with no tasking → reality-audit · "spread across the agents" → foreman · "do it yourself" → work.

## foreman — "spread this across the agents"

**Gets:** one dispatcher that hands out work, notices who's stuck, brings up only what needs their word. "take the post" · "who's stuck?"
**Elsewhere:** a one-time handoff → collaborate · "just do this small thing" → code-work · "an agenda" → assembly. Launched without the user's word → ask whether you coordinate.

## assistant — "how are things"

**Gets:** one summary across their cases and one point through which their words reach the right case. "what's on my plate?" · "any questions?" · "what's happening with case #12?"
**Elsewhere:** "who should I raise" → foreman · "lead / close this case" → architect · "what's recorded about X" → entry.

## widgets — "show me the cases"

**Gets:** a live case list, card or agent board in the Verstak window. "which cases are open?" · "who's working right now?"
**Elsewhere:** "how are things" → assistant · outside the Verstak window → answer in words.

## feedback — "the tool let me down"

**Gets:** a concrete instance, recorded where whoever fixes it acts. "this skill is broken, log it" · "I lost an hour because this isn't written anywhere"
**Elsewhere:** the product broken → code-work · an opinion with no instance → doesn't start · "my skill is old" → align.

## establish-mcp — "connect the graph"

**Gets:** tools that answer; it ends where entry begins. "bring up the bridge" · "I don't see the Verstak tools" · "oauth won't go through"
**Elsewhere:** "writes have no author" → collaborate · "upstream unreachable" → the server or network · "tools answer, but not as promised" → surface drift.

## minding — "remember this about me"

**Gets:** a personal graph, and answers about themselves from it. "remember I'm on an M1 with 16 gigs" · "what do you know about me?"
**Elsewhere:** "prod runs on that machine" → a project fact · "always show a plan" → `AGENTS.md` or the project graph ("keep replies short" stays here) · tokens and secrets → never.

## align — "set up this repo" (`/verstak align`)

**Gets:** a stamped agent config, session rituals, an agreed gate, delegation roles. "add an AGENTS.md" · "I'm tired of explaining things every session"
**Elsewhere:** "add a line to the config" → a file edit · "fix CI" → code-work. Offered unprompted per the door's `Start`, step `Alignment`.

## product-roadmap — "drowning in tickets"

**Gets:** a roadmap on disk: what the product is, the next three moves, directions in dependency order. "what should I do next here?" · "three repos, one product"
**Elsewhere:** "what's in progress" → entry · "plan this feature" → design · "estimate the timeline" → not here; directions stay hypotheses. An empty backlog is no stop: the present and merged changes drive it.
