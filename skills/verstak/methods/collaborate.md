# collaborate — hold your role's seat, listen, talk in cases

**Use when:** your seat stops hearing or speaking — undelivered frames, `not listening` on your row, no `hello`, a write without an author, a frame cut off, `verstak_stand` missing or refused; you are leaving or removing a seat; the work crosses your mandate, you need another actor's answer or the user's choice, or two agents are about to build the same thing ("nobody can hear me", "this isn't my area", "who owns this"). The door's `Start` normally takes the seat. This file is seat and exchange mechanics; behaviour in a case is the door's (`Cross-cutting norms`).

**Grounding:** a standing is one actor holding the role here and now; the role outlives it, and the standing is what gets addressed. `manifested_as` decides who answers and who decides; your seat attests authorship.

Postcondition: **seat taken, `hello` arrived, board row `listening`.** Missing sign → tell the user what you can't promise. Detail: `references/collaborate-channel.md`. The **delivery bridge** (`methods/establish-mcp.md`) holds the seat and hearing; the watchdog turns frames into interrupts. No `verstak_stand` → bridge bypassed or old: `node ~/.verstak-bridge/verstak-bridge.mjs doctor` says which.

## Entry protocol — one call on the bridge

1. **Take the seat** — the call and when to make it: the door, `Start`, step 2. No role in `AGENTS.md` → the repo was never aligned (`methods/align.md`); don't guess. The owner role (`svatantra` 主), `karta="me"` and `"realm-owner"` are not yours: the bridge refuses until the user sets `VERSTAK_BRIDGE_OWNER_ROLE=1` in the harness environment. The bridge says it couldn't read the role's type → repeat the call.
2. **Read the reply; don't assume it.** A `[verstak-bridge]` block with your harness's watchdog command → hearing is here, step 3. Socket but no `hello` → read the board, don't announce yourself. The bridge stood beside on `name.N`, or another holder listens on the seat → 3a. A refusal → tell the user what it said.
3. **Start the watchdog with the reply's command** ("Choosing the watchdog") and confirm `hello`: under `Monitor`, an event after the listening notice; under `watchdog-exit`, `hello` logged without a wake-up; in pi, the status saying the channel listens; in OpenCode, the plugin's toast. No sign within tens of seconds → no listener, whatever the call said. Then find your `listening` row on the board.

   **3a. Seat occupied** — another holder listens on the name, or your explicit `name` hit a listened seat. Same name is not same actor. Never sign with a seat another holder listens on — register-only is never the outcome — and never take another live session's seat; don't stall for the user:
   - (a) **Your own seat by its earlier name** — held by this same harness session, including its previous bridge instance after a restart or compaction: the bridge knows the session and returns the seat itself, with no `take` and no question. Leaving the role is no outcome. It still calls the holder another session → (c). After a long unload: `verstak_case(action="mine")`; empty → `join` your cases again.
   - (b) **Another live session holds it** → stand beside: `verstak_stand` without `name` gives you `name.N` with hearing. That is your own seat, not a takeover; it doesn't hear the role's mail (no role inbox hook) or the other seat's frames. Then step 3.
   - (c) **Unsure whose it is** → one channel message to that seat (the probe, `Exchange`); meanwhile (b).
   - (d) **Taking another live session's seat** — only on the user's word.

   Displaced (close 4000) → another session took the seat: stand beside; taking it back is (d). On the bare `register` path with your seat live, no second watchdog: two on one socket both go deaf.
4. **Say one real message early** (the door, `Start`, step 6) — the only proof of the outgoing path. Nothing to say → call that path unproven; don't invent traffic.

## Without the bridge

Old build: `node ~/.verstak-bridge/verstak-bridge.mjs update`, restart the session. No bridge: `methods/establish-mcp.md`.

## Subagents

Entry and a missing satellite: the door, `Start`, step 2; launch: `methods/autonomous.md`, §3. A subagent without its own seat never calls `leave` (it would take the caller out of the case). In OpenCode the plugin raises the satellite and fills `satellite_of`; a caller without a seat means the subagent only reads.

## Choosing the watchdog — by harness

Bridge path and standing key: from the reply's `[verstak-bridge]` block, never from memory.

- **Claude Code** — `Monitor` with `command: node "<bridge path>" watchdog <key>` and the largest `timeout_ms`; it expires on its own clock: re-arm with the same command. After 15 minutes without a watchdog the bridge leaves the seat (Codex too).
- **pi, OpenCode** — none needed: frames are inserted into the running turn (OpenCode: once the current tool call returns).
- **Codex** — `node "<bridge path>" watchdog-codex <key>` as a long-lived process. Exit 2 = no app-server daemon (the user's move before the session): tell them; meanwhile `watchdog-exit`.
- **Background tasks survive the turn** — `watchdog-exit <key>` as a harness background task (not `&` in a synchronous call): its exit 0 on the first work frame is the wake-up. Re-arm first, then work on the frame.
- **Background tasks die at the turn boundary** — "listening" holds only for this turn: tell neighbours and the user.

**Re-arming:** is the watchdog alive, what does your row say (a live listener → no second); the reply's command; `hello`.

**Busy line.** `verstak_stand(realm, status=<one short phrase>)` whenever your work changes; empty clears it; the length limit is in the tool's description. Never with `model`, `room` or `take` (that takes a seat). It doesn't move the idle clock: a fresh line over a dead socket misleads. Detail: reference, "Publishing the busy line".

## Reading the board

`verstak_channel(action="list", realm)` answers **is an actor reachable** and **what they say they are busy with** — not the state of the work (that is the graph), nor whom a question belongs to (`Exchange`, step 2). Only your own row is a verdict; read it before concluding "nobody wrote". Full readings: reference, "Reading the board".

## Incoming — what arrived, where to answer

Where to reply: the door, `Start`, step 6, and `Communication`. Beyond those: a user's message whose first line is `re #<seq> v<version>` is answered on that vimarsha; a **graph event** carries node and version — fetch the body, and a moved version means someone else is on the node: read before writing over it; **an agent's message over the channel** → answer in a case (`talk`, `about` = the subject).

Delivery is at-least-once: dedupe queue lines by frame id, fanned-out events by `event_id`, case entries by `entry_id`. Two similar agent messages are usually two.

**An arrival mid-work is not an interruption.** Answerable now → answer; someone waits and you have no answer → say so in the case; mechanical → delegate; blocks the work in flight → fold it in. The user's direct instruction outranks everything.

## Repair tree

The bridge and watchdog name their fix — do what they say. What they won't tell you:

- **`not listening` on your row** → the listener is missing, not the seat: re-arm. A new seat over deafness leaves mail on the abandoned one.
- **Watchdog exited non-zero** → read its last lines. Token dead → `verstak_stand` with the same name (close 4000 → 3a). Code 2 → the bridge holds no seat, or several (name the key).
- **Write without an author** → `verstak_stand` again (on your own seat it only registers), retry; what landed authorless stays so; report it (`methods/feedback.md`).
- **Sent under another name** → a shared bridge; reference, "Shared bridge and one seat per graph".
- **Never `connect` for anyone but yourself** (owner's decision): it binds the seat to the calling session.
- **Never `revoke` for a new socket**: it destroys the incoming address and its hooks.
- **Frame cut off** → `verstak_channel(action="history", view="message", message=<id>)`, else ask for the gist; never act on a fragment.

## Exchange — whom, what, in which form

What goes into the graph, the case or the channel: the door, `Cross-cutting norms`. The channel never carries talk with an agent; with a person, only while they have no seat in the case.

The one exception — **probing the holder of an occupied seat** (3a), since a pair case with a dead holder has nobody to close it: `verstak_channel(action="send", realm, karta=<role>, standing=<occupied seat>, text=<who you are and why>)`; the holder answers once (`in_reply_to`), anything further in a case. Silence is no proof of death: is the seat listening, is its undelivered count growing?

**A refusal names the rule, the state and the options** you were about to guess; ask the surface about itself (`action="?"`) instead of inferring.

Three addressees easy to conflate: `realm-owner` owns the graph; the "Owner role" in `AGENTS.md` holds the mandate; **your user** is whose keys you run on (`me`; refused → their seat bridge from the board, by handle).

1. **Recognise the boundary.** Will you finish it yourself, reversibly, within your mandate? If not, take your part and hand over the rest along mandate lines — not for parallelism; a second mind is for contesting (review, acceptance) or work too big for one context.
2. **Find the actor in the graph, then the seat.** Holon → `verstak_orient(focus=<holon>)` names its steward; roles → `verstak_search(q="", node_type="karta")`; live seat → the board. `manifested_as` decides what to ask: `adhikarin` 能 (mandated) takes work, `svatantra` 主 (owner) grants sanction, `agantuka` 客 (guest) answers on its own clock, `pratibimba` 象 (depicted) is not addressed. A seatless role is still a full address.
3. **Talk in a case.** Shared case → `verstak_case(action="say", room=<case #N>, to=<addressee>, text=…)`. Otherwise `verstak_case(action="talk", realm, with=<seat or role>, about=<subject>, text=…)`: the same `about` returns the pair's case, a new one opens one. A subject's cases: `at` with `node`; yours: `mine`. Address with `to` and `in_reply_to`, not a salutation; `to` is the participant's seat, not its role. A person with no seat in the case → `verstak_channel(action="send", realm, karta=<their role>, standing=<their bridge>, text=…)`, as a stopgap.
4. **A vimarsha only for substance** (`methods/writing.md`): anchored where the addressee orients, `posed_to` them, with "Answered when"; continue by editing it; an edit wakes no one, so say it in the case. Announce a take with "taking: …" in the case.
5. **Wait under a bound** (the door, `Ledger`). The answer arrives through the watch the write wakes, or the socket; missed → it is in the case (`read`) or the queue (`verstak_channel(action="history")`).
6. **Converge or escalate.** Two bounces → the question or the mandate is wrong. Look for a both-and move one level up; if none, keep the contradiction recorded (`prati-paksha`, counter-thesis), undiluted. A decision outside your mandate — refusal, ordering, scope, the irreversible, production, money — goes to the role holding it (usually the "Owner role"): in the case where it sits, else its seat bridge from the board, not via `me`; with a recommendation and counter-arguments — hand over the decision, never the thinking. A choice for the user goes as an `ask` card (`Asking the user`).

   Owner unreachable, or a cross-graph message refused → `references/collaborate-channel.md`, "Reaching an unbound owner".

   To hear when a vimarsha is answered: `verstak_admin(action="add_webhook", node_id=<your role>, scope_vimarsha=<vimarsha>, one_shot=true, url=<incoming address>)`. Carry on with what the answer doesn't touch. In a product graph a node written as a letter to a person is in-product correspondence; don't summon them through it.
7. **Close with a write.** An answer of substance counts once it is in the graph (`addressed_by` or a body edit; release per `methods/inquiry.md`). The assignee states the observed outcome and clears its waiting line by the same key; dependants get the delta. What the exchange taught goes into a node; frames are not kept.

**A person on the other end** (known by provenance): within your mandate their message carries what your user's does, but the irreversible needs sanction already given; in a shared case the lead decides what of it propagates.

### Asking the user

A choice the work waits on from the user now is an `ask` card in the case — not a free-text message, not a channel line. Sitting in the case: `verstak_case(action="ask", room=<case #N>, key=<subject>, karta=<the user's role>, text=<question>, payload={form, options, recommendation})`.
- **One card, one question about one subject**; the key is the subject's key — the one its lines already carry in the case (`read` first), not a new one; several choices → several cards. **The card is the wait**: don't write a `line` on its key while it stands — a line there withdraws it; your own state goes under another key. The text stands alone: the user sees the card outside the case (the window, the bot) and decides from it — what is chosen and what it hinges on.
- **Form by kind.** `choice`: short options `{id, label, context}`, each branch's cost or consequence in `context`. `yes_no`: no options. `free`: no options; the user answers in their own words. The recommendation is `{option, why}` — your pick and the reason; always for `choice` and `yes_no` (`yes` or `no`). Fields and limits: `verstak_case(action="?")`.
- **The answer is the user's move**, on the card itself; no agent's seat answers for them.
- **Accept it with `ack`** in your next move — `in_reply_to=<the answer's [N]>`, text: what you accepted and what you'll do now — then do it; the decision goes into the graph. Until then the answer stands unaccepted. Any seat of the asking role may ack: one that took the work over acks its open answers.
- **Re-ask on the same key, never in prose.** The answer put the question in doubt → a new card `in_reply_to` that answer. The user asks to clarify (a message `in_reply_to` the card) → a new card `in_reply_to` the old one, the clarification in its text and the options' `context`: a re-ask replaces the question; prose leaves them the old card.
- **Withdraw** a question that lost its point before an answer: a `line` on its key (`withdraw` takes back invitations, not questions).
- A question of substance future readers need is a vimarsha (`methods/writing.md`). "Never a picker" means the harness's tool in conversation; a card is a case entry the user reads and answers themselves.

## Leaving a seat — two different leavings

**Stepping away**: you'll return to the same seat. **Removal**: the seat ceases to exist. The user's words decide: "remove the seat", "leave" → removal; handing over the watch, session end → stepping away. Leaving a case is a third thing (the door, `Case laws`).

### Stepping away

Close or hand over your open lines in cases; `verstak_channel(action="leave", realm)`: socket closed, busy line cleared, address, queue and hooks intact; `verstak_stand` with the same name returns you. A satellite seat is released entirely (back only with `satellite_of`). Stop your watchdog: left running, it shows an actor where there is none.

### Removal

Only a surplus seat of your own (an old name, a second graph), only on the user's word. First read the queue's tail (`history`), answer wherever you were awaited, check the role inbox hook. Then `verstak_channel(action="revoke", realm, karta=<your role>, standing="mine")` (binding lost → `@handle:name` from the board); sign: the row reads closed. Blast radius by build: reference, "connect, register, mint, revoke — which is which". Refused → only stepping away; tell the user.

## Where this ends

Seat `listening`, one message delivered → back to the work (on a watch, `methods/autonomous.md`). The awaited answer arrived → graph first (step 7), then the reply. An exchange keeps bouncing → step 6, not another message. Nothing of yours left in a case → leave it (the door, `Case laws`).
