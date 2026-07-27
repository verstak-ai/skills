---
name: whoami
description: "Stand the person up in the graph — the entry point ABOVE the realms. Answers which contour this session is in, what belongs to this user, and what awaits them across ALL their realms, before any single realm is entered. Triggers: 'где я', 'какой реалм', 'мои реалмы', 'что у меня есть', 'что на мне сейчас', 'заведи личный реалм', 'whoami', 'which realm is this', 'my realms', 'what's on my plate', 'set up my personal realm', 'verstakify me'. Also whenever a session opens and the realm in play is neither named by the user nor readable from AGENTS.md. Two tacts: cheap bearings (compute the address, one orient) and rare reconcile (diff live access against the map, wire identity, sweep inboxes). The person's contour lives in the realm @<handle>/me; the method lives here. Needs the nks_* MCP tools."
---

# Whoami — the person's contour above the realms

A user with one realm has no question. A user with many has it every session: *which realm answers this?* `nks_realm(action="list")` returns a flat wall of slugs — no purpose, no liveness, no routing, disposable experiment realms sitting beside the one that matters. So the session asks the human what should already be known, or guesses, or answers from training data past a graph that had the answer.

This skill closes that gap. It is **upstream of `entry`**: entry orients *inside* a realm, whoami says *which* realm and *which contour of a life* this session belongs to — and, when asked, what is waiting for this person everywhere at once.

## Two carriers, split by what varies

| Carrier | Holds | Why there |
|---|---|---|
| **This skill** | the protocol, the contour taxonomy, the storage rule, the reconcile procedure, the realm skeleton | identical for every user; ships as a file to every harness |
| **The realm `@<handle>/me`** | this person's contours, what each live realm is *for*, routing rules, local setup | varies per user; the graph is the only carrier that travels between machines and harnesses |

There is no third carrier. Harness-local files (a global `CLAUDE.md`, `~/.codex/AGENTS.md`, an OpenCode config) are **not** where any of this lives: they differ per harness, don't survive a new machine, and drift silently. This skill's own `description` is the pointer to the graph, and the harness reads it every session by construction.

## The address is computed, never searched

```
nks_me(action="whoami")            → handle
nks_orient(realm="@<handle>/me")   → the contour map, or 404
```

`@<handle>/me` is a **convention carried by this skill**, not a fact discovered in the world. Never scan the realm list looking for "this user's personal realm" — a runtime search reintroduces exactly the guessing this skill exists to kill.

Two consequences worth stating out loud:

- **"Realm not found" is an answer, not a failure.** The call errors — legibly, naming the address — and that error *is* the routing result: this person has no contour yet. Read it and go to §3 Bootstrap. Do **not** fall back to listing realms and guessing; that is the failure mode this skill removes.
- **A deviation is settled once, at bootstrap** — a pre-existing personal contour under a different slug is moved, or the exception is written into the realm itself. Never re-resolved at runtime.

Cold cost: two calls. Warm: one — the handle is stable, so once it is in context, don't re-read it.

## 1 · Bearings — the cheap tact

Run it when the realm in play is not already named (the user named it, or AGENTS.md does — then just use it; don't ritualize).

1. Resolve the address (above).
2. **One `nks_orient` on `@<handle>/me`.** The realm is *built* so that this single overview carries the routing answer: contours are root holons, routing rules and the live-realm index are `attrs.key=true` landmarks (the overview prints them), the person's own transformations are ACTIVE BIANHUA.
3. Name the contour the user's question lives in, and the realm that answers it. Then hand over to **entry** for orientation inside that realm.

That is the whole tact: at most two calls, no lens, no sweep. **A tact that costs more than the question is worth stops being run** — and then the session is back to guessing.

If the map genuinely doesn't decide it — two contours could own the question — **ask in one line naming the candidates**. Asking is cheap; routing a session into the wrong realm costs the whole session.

## 2 · Reconcile — the expensive tact

Rare, and deliberately separate. Run on request, on a new realm/machine/job, or when the map is visibly behind. Never on the cadence of §1: a ritual this size run at entry frequency makes the entry unaffordable, and an unaffordable entry is simply skipped.

**Observation here is direct** — access is *returned by a call*, not testified to. So a divergence is not discussed; it is resolved in the world's favour and the map is corrected.

1. **Take the live state.** `nks_realm(action="list")` · `nks_me(action="kartas")` · `nks_org(action="list")`.
2. **Diff against the map.**
   - present in the world, absent from the map → classify: which contour, what for, or which disposable class it falls under;
   - present in the map, gone from the world → release it (`atita` / `visarjana`, with the reason);
   - present in both → leave it alone.
3. **Wire identity.** For each live realm where the person holds a role, the karta standing for them carries the user link: `nks_update(realm=R, node_id=<karta>, user="me", basis_version=…)`, or `user="me"` at creation. Only kartas the person genuinely stands behind — the link is a claim about reality, not a convenient tag. This is what makes §4 possible at all: `nks_me(action="kartas")` then returns them in one call, across every realm.
4. **Sweep the inboxes** (§4).
5. **Report what changed and what you consciously left out.** A silent reconcile reads as "everything is fine".

Idempotent: a re-run touches only what moved.

## 3 · Bootstrap — audit, not an interview

Same discipline as **verstakify**, applied to a person instead of a repo. Never branch on "does the realm exist"; audit each concern against its source and classify it **absent / stale / correct**:

- *derived* concerns (what realms exist, which roles, which orgs) — never written down, re-read every time;
- *authored* concerns (what a contour is for, what is dead, routing rules, local setup) — asked once, preserved, sanity-checked on reconcile.

An absent authored slot is **asked**, never invented. An absent derived slot is **not stored at all**.

Fill the skeleton in `references/personal-realm.md` — contour holons, the landmark set, the 主 karta bound with `user="me"`. Then run §2 once, so the first map is born verified.

### When NOT to build one

Two or three realms, one contour, no organizations → the personal realm is pure overhead: it must be reconciled, and an unreconciled map answers fast and wrong, which is worse than no map. Say so and stop. **"Don't build one" is a legitimate outcome of this skill** — a bootstrap performed on everyone is a rite, not a tool.

## 4 · The agenda across all realms

The capability nothing else provides: *what is on me, everywhere.*

For each identity-linked karta from `nks_me(action="kartas")`: `nks_search(realm=<its realm>, q="", posed_to=<its seq>)`. Cost is the number of **live** contours, not the number of accesses — which is exactly what the map buys.

The result is **derived every time and never stored**. A saved agenda goes stale faster than it is re-read, and then states yesterday's obligations with today's confidence.

## What lives in `@<handle>/me` — and what never does

**The storage rule, entire:** *store only what no call can answer.*

| Never store (derived) | Store (authored) |
|---|---|
| the realm list, access, roles, org membership | what each live realm is **for**, and when to route there |
| which kartas the person holds (`nks_me`) | which contour each realm belongs to; what is dead or dormant |
| anything a tool returns on demand | routing rules and naming conventions |
| the cross-realm agenda (§4) | local setup that doesn't survive a machine change — machines, deployments, checkouts |

Two rules that keep it thin:

- **Classes, not cards.** Disposable realms — benchmark runs, throwaway experiments — get **one** rule ("realms matching `<pattern>` are disposable: never route, never index, retire on sight"), never a card each. The rule outlives its population; forty cards do not.
- **Every stored fact a call could answer is a future lie** — it diverges silently and is read with confidence.

## Limits — state them, don't design around them

- **Cross-realm arrows do not exist.** Everything `@<handle>/me` says about another realm is prose and attrs, never an edge. No propagation, no `anga` across realms, no unified graph.
- **It is therefore not a hub.** It looks like a centre and cannot be one; keep it thin so it doesn't pretend. Unity in §4 is achieved by iteration, not by structure.
- **Cheap entry is only as honest as the last reconcile.** §1 trusts the map; §2 is what earns the trust.

## Seams

| Skill | Seam |
|---|---|
| **entry** | whoami names the realm; entry orients inside it. Entry's realm-discovery step defers here when a personal contour exists. |
| **verstakify** | repo contour ↔ person contour, same audit/classify machinery. A verstakified repo names its realm in AGENTS.md — then §1 is unnecessary for that session. |
| **on-duty** | the §4 agenda feeds the watch: it is the cross-realm view of the inboxes on-duty works one realm at a time. |
| **assembly** | if the person's own transformations are mapped, that map is an assembly at the scale of a life — same discipline, owner accepts every telos. |
| **intake** | classifying a newly appeared realm is external word entering under provenance — same сверка loop, with direct observation available. |

## Acceptance

- The bearings tact answers "which realm" in at most two calls, or asks one question naming the candidates.
- A 404 on the computed address routes to bootstrap without an error path.
- Reconcile is idempotent and reports what it dropped.
- After bootstrap, `nks_me(action="kartas")` returns a karta for every live contour — the person is addressable everywhere they act.
- Nothing derivable was written into the realm.
- On a user who doesn't need one, the skill says so and stops.

## What whoami is NOT

- **Not `entry`.** Entry is orientation *inside* a realm and assumes the realm is given; this is what gives it.
- **Not a hub or an index of everything.** It stores the authored remainder, not a mirror of the access surface.
- **Not a local-config generator.** No harness file is written or read; the graph is the carrier.
- **Not `verstakify`.** That bootstraps a repo's agent contour; this bootstraps a person's.
- **Not a scheduler.** §4 says what awaits; deciding what to do with it belongs to the person and to **on-duty**.
