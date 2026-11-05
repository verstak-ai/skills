---
name: door-start
description: "Reference for the verstak skill: the mechanics of Start — addresses and the personal slice, the primer, the seat for a watch or a write, alignment, the greeting and hearing. Load when the door's Start points here; not a task of its own."
---

# Start — addresses, seat, alignment, greeting

Run it after `verstak`'s `Start` has read the graph, before the first write. It is the mechanics of entry; it doesn't replace the subject's neighbourhood or the chain of its consumers.

## Addresses and the personal slice

Graph and agent role: from `AGENTS.md`'s cover (`graph`, `agent_role`), the start hook, `start <graph> <role> <seat address>`, or the window's paste line (`Graph: … Seat address: … Chat: …`) — the last two win. A bare slug is no address (**entry**, Part II). No source → `verstak_realm(action="list")`, ask which project graph; none → `verstak`'s Survey row "no project graph". **The owner role** is the graph's, by seq, never `me`: the `svatantra` role the agent role's `group` arrow leads to (`verstak_look` the agent role). No such arrow → the `svatantra` role bound to the person whose keys you run on in this graph (`verstak_me(action="kartas")`) when they are the one answering for this repository; still unclear → ask once, and record the answer as that `group` arrow, so the next session reads it. Never guess graph or role.

The focus holon's `repository` attr must match `origin`: **align**, Round 1, step 2.

Your tools carry another prefix than `verstak_` (the bridge's config sets it) → read it off your tool list and put it in place of `verstak_` wherever the methods write it.

**The personal slice — only a root session talking to the user**, never a delegate started by a launch line: first `verstak_me(action="readiness")` — the `personal_mind` sign must be present for this account (a bare `mind` with none of your own can resolve to another's graph); its `state` exactly `present` → one read, `verstak_search(realm="mind", q="", attrs_filter="slice:agents,ways", limit=50)` — the preferences below and the names of their ways of doing (**minding**, §1b); `missing` → personal memory is provided here, unasked, by **minding**'s entry (`lacks` with `mind_realm` → the graph is created; only the person's role missing → the role), readiness read again, and the slice read once it shows `present`; `unknown`, no such field, a refusal — no read and no create, say so in a line (`unknown` means the session's credential can't reach your own, and a bare `mind` may then resolve to another's) — the preferences, in the personal graph of whoever's keys run the session, about how agents work with them (how to report, ask, plan). Hold them all session, below this project's rules; mind unreachable → the start doesn't wait, say so in a line. Anything else personal — on occasion (**minding**).

## Primer

The graph holds what no file shows. `kriya` (action): a repeatable before → after transition with actor, input, output. `phenomenon`: what actions consume, produce or act through. `vimarsha` (question): on a node, addressed to a role, saying when it's answered. `bianhua` (transformation): where the system is heading. A role is a mandate, not a person; you are the agent role, under your own name. Modes: how we know a node, whether it exists, what we want with it; "verified" only on evidence. More: **entry**, Part I.

## A seat for a watch or a write

A seat comes with the word "watch", a `start` with a seat address, a `verstak … case #N` launch line, a pasted seat address, a frame that woke you; and the first write or case word under a role in a project graph (onboarding before any role exists writes without one). Otherwise none: a seat makes you reachable by everyone. A seat your session already holds (the plugin seated you on a launch line or, in OpenCode, from `AGENTS.md` at start — a provisional seat, which an explicit `verstak_stand` replaces — or returned your own) is used as is. `register` only names a seat you already hold, or one on the channel your bridge holds — it never opens a seat, and with none it refuses (`standing_not_held`); `verstak_stand` takes a listening seat.
- **Watch:** one `verstak_stand(realm=<graph>, karta=<role>, model=<model id without provider prefix>, room=<the user's seat address, if any>, status=<what you're busy with>)`; it also knocks on the user's seat. The role's queue is `verstak_orient(focus=<role>)` on entry and whenever something prompts it; a frame reaches its addressee and the case's participants.
- **`verstak <graph> <role> case #N`** → `verstak_stand` without `room`, `verstak_case(action="join", room=<case>, realm)`, `read` it and its nodes with their relations; your first `say` restates the brief.
- **Subagent:** its own satellite bridge, never the caller's — `verstak_stand(realm, karta, satellite_of=<caller's seat>)` (from a trailing `from <seat>`), `join`, restate; done → `leave`. An `ask` of yours still open blocks `leave` (`verstak`, `Case laws`): a question you won't stay to accept is left to the lead in the first place; one already asked — tell the lead in a `say` which question it was, then withdraw it. No own bridge — no `verstak_*` tools, or that `satellite_of` call refused (don't retry) → no `verstak_stand`/`join`/`leave`, no writes; say so in your result's first line. Only that call tells: a brief saying a bridge is or isn't there is no answer, and a harness that didn't run your entry leaves the call to you.
- **Occupied seat.** Never sign with a seat another holder listens on; yours after a compaction or restart returns by itself; another live session's → stand beside as `name.N` and work there; evicting a holder, your own name too, only on the user's word — **collaborate**, 3a. On a watch, don't finish without a seat; a refusal, no `verstak_stand` → **collaborate**.

## Alignment

**Contract `11`** (the description's number; **align**, `Contract`). The cover is the `verstak:` block of `AGENTS.md`'s YAML front matter: `graph`, `holon`, `agent_role`, `contract`, `stamp`, and `rituals` where the person narrowed the delivery's rituals; judgment slots live in the body's `Project`.
- **None of the three signs of alignment** (`verstak`'s Survey) → only the offer of **onboarding**'s harness branch, which runs on the person's word; the items below don't fire there.
- **`contract` below `11`** → **align**, full arc; no file in a repository bearing a sign → its first round. An older cover — flat slots, a section or table, the stamp line at the file's end (`verstak align: contract N`, below `10`) — is align's `From contract 9`; a date, no contract at all, or a hole naming a node ranks below every number; `verstakify: contract N` counts on the same counter.
- **Another delivery's cover** — a front-matter block under another root key carrying a `contract`, or a last line naming another skill's alignment (`<name>: contract N`, not `verstak align` or `verstakify`), and none of ours → a sibling delivery aligned this repository. Work by its `AGENTS.md`; don't align it or rewrite its cover unasked — only on the user's word, which replaces it deliberately.
- **`contract` current, but your role files are missing on this machine** (a fresh clone; a pull took them out of the index) → only **align**, Step 6: they are a projection on the machine, not part of the repo.
- **A `Project` slot reads `open`** → one `read` of the holon's alignment case (`verstak_case(action="at", node=<holon>)`), then **align**, round 2; **the run doesn't wait for the user** (**align**, "Who runs the alignment").
- **An `AGENTS.md` line contradicts the method → say so.** `contract` below → the method is right; equal → template defect, **feedback**.

## Speak, then listen — watch only

One real message (where you stand, what you hold, what you'll ask) proves you're reachable: to a frame from the user's seat, `send` with `in_reply_to`; to a case frame (first line `case #N`), `say` in that case; no seat address → `send` to `karta="me"`, the human whose keys you run on (refused → their seat row on the board, `verstak_channel(action="list")`, by handle); an agent only in a case. `me` names an addressee, never a seat to take: no `verstak_stand`, `register` or `connect` with it — an agent does not stand in the owner's role (the bridge's refusal: **collaborate**, step 1). Delivered → the reply's watchdog, then `hello`; else **collaborate**.

Start ends in readiness: graph and role named; your seat named, or deliberately not taken by a reading session; the greeting delivered where it's awaited. Nobody at the console → the report goes into the case or to their seat, not into an empty console. The user's word or a frame decides — picking up a predecessor's cases by the role and, on watch, your role's abandoned ones waits for neither (**autonomous**, `Debts at three moments`): watch → **autonomous**; what's recorded → **entry**; else `verstak`'s routes.
