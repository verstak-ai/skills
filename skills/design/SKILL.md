---
name: design
description: "Use this skill when the user asks to design, architect, or project a system, component, or feature and NKS tools are available. Triggers: 'спроектируй', 'давай продумаем', 'архитектура', 'нужен дизайн', 'design', 'let's think through', 'plan the system', 'what should this look like', mentions of 'жц' / 'lifecycle', 'крия' / 'эстафета' / 'холон', or when the user says to 'записать в NKS' / 'положить в граф' / 'зафиксировать'. Also use at decision moments — 'we chose X', 'we decided', 'persist this design' — and right after any brainstorming or elicitation session has produced a design or spec: the graph is where it becomes the record. Also use when entry has triggered and the conversation turns from reading to building — the user shifts from 'what do we know?' to 'what should we build?'. Use this skill even for seemingly simple design tasks if NKS MCP tools are available — the graph prevents losing decisions, questions, and risks."
---

# NKS Design

The graph IS the spec. If it's not in the graph, it doesn't exist.

## Interop: elicitation suites (e.g. superpowers brainstorming)

If a brainstorming skill is installed, run it for elicitation — it's a welcome
front-end. Its spec file is a draft view: intake it (`intake` skill), then wire
it here. Persisting the result is memory-work, not implementation —
implementation hard-gates (e.g. superpowers brainstorming's) don't apply to it.
The design isn't done until its decisions, risks, and lifecycle are in the
graph.

## Principles (always active)

| # | Principle | What it means for you |
|---|---|---|
| P1 | Every ding is born and dies | Every phenomenon (given_as=ding or sachverhalt) MUST have utpatti AND ahara. No exceptions. Leaked tension = missing end-of-life kriya. Add it. Never suppress with attrs. |
| P2 | Complex systems grow, not get built | Leave room. Use anagata+upeksha modes and vimarshas for deferred work. Deep on first pass = anti-pattern. |
| P3 | Graph ≠ reality, graph = tension with reality | Shabda intake lowers tension. Design raises it. Every vimarsha marks a tension. System evolves by processing vimarshas. |
| P4 | Tensions are always truthful | Never suppress. Always close structure. attrs.role='reference' = anti-pattern. If tension feels wrong → detector bug, not your cue to silence it. |

## Starting modes for projected work

A projected practice is born **planned, not done**: anumita/anagata/chanda (a settled plan you commit to — adhimoksha; deferred "needed, not now" — anagata+upeksha). Only something observed already running is Pt/Va/Up. Stamping a designed-but-nonexistent node as "ready" (`pramanita/vartamana/upeksha`) lies about both its ontic and epistemic state, and the lie cascades through sunset, succession, kriya-anga, and carrier predicates. **Transition to `vartamana` is a separate act of life**, performed when the practice actually starts. Volition graduates along `chanda → adhimoksha`; never reach for `attrs` to express urgency or priority. The full starting-triple and closure canon is the **writing** skill's — consult it at every write; don't re-derive it here.

**A volitional kriya belongs to a transformation.** A kriya recorded from volition — the user wants it to exist (or wants something gone), rather than from shabda («I know this is so») — is part of a qualitative shift the system is undergoing. Land it on the map: its driving vimarshas attach `anga` to the bianhua (the *path*), **and the volitional kriya itself attaches `anga` too** (the *arrival* — kriya-anga shipped). Read its direction from the kriya's own triputi, not a separate field: a **возведение** is a deed entering the fabric (ontic `anagata→vartamana`, volitive `chanda`/`adhimoksha`) — attach it while still `anagata`, it resolves once `vartamana`; a **депрекация** is a deed leaving (`vartamana→atita`, `virodha`), resolved at `atita`. The full kriya-anga grammar lives in the **writing** skill. And a **ready (completed) kriya can be anga too** — a deed done doesn't leave the map: the bianhua doubles as a *reading of the field of kriyas*, where through it each deed shows which transformation it served and why it was created. Membership records purpose, not only pending movement (отдача долга — the debt repaid). Don't spawn a new bianhua for it spontaneously — existing forest first (`lens="bianhua"`); a new bianhua's name and telos are accepted by the user (assembly skill); unsure where it belongs → ask.

## Four phases of design

Enter any phase based on graph maturity. Not waterfall — any phase can loop back.

### Phase 1: Backward chaining

```
TRIGGER: goal exists, path does not
DO:
  1. Name goal as sachverhalt(anagata+chanda). The target state is the
     owner's: name it in dialog when needed — the user accepts the goal
     (and later the bianhua telos), the designer doesn't invent it
  2. nks_search + nks_semantic_search — goal doesn't already exist? (keyword misses a differently-phrased duplicate; semantic catches it before you design it twice)
  3. From goal: "what produces this?" → create kriya + ahara phenomenon
  4. Recurse until you hit a ding that must be given (realm inlet — the edge is
     a topological fact; no marker needed)
OUTPUT: path of kriyas from inlet to goal
NEXT: → Phase 2 (forward weaving)
```

Actor: the Designer role. Consumes: a posed inquiry. Produces: a built path.

### Phase 2: Forward weaving

```
TRIGGER: path exists, not all phenomena serviced
DO:
  1. Walk path left to right
  2. For each phenomenon on the path:
     - Has utpatti? If no → relay-gap → add producing kriya
     - Has ahara? If no → leaked → add end-of-life kriya
     - Level of abstraction matches? Bootstrap creates config → Teardown destroys config (same level)
  3. For each kriya:
     - Has exactly one actor? If two → split
     - All arrows have sense? If no → write sense
     - ahara/utpatti point to correct phenomena? (may need reconnect after distinctions)
  4. For each phenomenon: context → holon set? A phenomenon without a holon home
     is invisible to holon-scoped orientation — distribute ALL of them
  5. nks_orient(lens="trace", focus=<phenomenon>) on key phenomena → lifecycle connected?
  6. nks_orient(lens="tensions") → new problems?
OUTPUT: tensions discovered, lifecycles closed
NEXT: → Phase 3 (risk analysis) or → lifecycle closure if broken
```

Actor: the Weaver role. Consumes: a built path. Produces: noticed tensions, closed lifecycles.

### Phase 3: Risk analysis + mitigation

**3a. Analysis:**
```
TRIGGER: path woven, risks not assessed
DO: For each kriya on path, five provocation questions:
  1. Different actor? What if unavailable?
  2. Different context? Environment changed?
  3. Damaged upadhi? Precondition corrupted?
  4. Scale mismatch? Parallel/concurrent?
  5. Adversary? Network drops, disk fills, process hangs?
  If threat found → nks_add_vimarsha(genre="risk", vimarsha_of=<kriya>)
OUTPUT: risk-vimarshas
```

**3b. Mitigation — separate process, per risk:**
```
TRIGGER: risk-vimarsha exists, unaddressed
DO:
  1. Read risk context: nks_look on target kriya + neighborhood
  2. Research operational environment
  3. Choose response type:
     a. Compensating (mitigation) kriya or phenomenon → prevents/handles the transition failure
     b. Grundsatz invariant → principle as upadhi
     c. Conscious acceptance → vimarsha to upeksha with reasoning
  4. Wire response, nks_arrow(action="link") addressed_by from vimarsha
OUTPUT: hint-vimarshas for implementation
NEXT: → Phase 4 or → next risk
```

### Phase 4: Delivery impulse

```
TRIGGER: graph designed, all in anagata modes, no one is working on it
CONDITION: only for graphs projecting external systems (not methodology, not CJM)
DO:
  1. Create hint-vimarshas for implementors
  2. Each hint: scope of work, acceptance criteria, a **`posed_to` arrow** (vimarsha→karta) to the doer who can answer — the **能** who stewards the contour (find via the `steward` arrow), the **主** for strategic scope; never a `pratibimba` image; volition graduates chanda→adhimoksha — never attrs.priority; blockingness is a property of the pair),
     and an ANCHOR — vimarsha_of into the contour where the work lands (holon at minimum,
     the precise kriya/phenomenon when known): posed_to without an anchor is a lost hint —
     the addressee orients by holon and never sees it
  3. Order hints: dependencies, what-blocks-what
  4. Cross-reference with existing open vimarshas
  5. If the work is one qualitative transformation: attach each driving hint via anga —
     AND each volitional kriya itself as kriya-anga (the deed that arrives —
     возведение/депрекация per its triputi, see §"A volitional kriya belongs to a
     transformation") alongside the hints —
     to an EXISTING bianhua first (lens="bianhua"); a new one only with user-accepted
     name + telos (assembly skill), never per single vimarsha → the impulse becomes
     part of 形, not a scattered list
  6. Stage the flow: when delivery is staged (e.g. test → staging → full),
     each stage is a sub-bianhua anga'd into the ONE delivery bianhua, ordered by
     anantara (what can start only after what); each stage gathers its own driving
     hints via anga. The canonical result of right-to-left design is this one bianhua
     with an anantara-ordered flow of stages — the owner reads it as the release plan
  7. On a newly accepted bianhua: run the integrity pass (integrity skill) — the
     wavefront of affected-but-unattached nodes gets its «is this affected?» questions
OUTPUT: implementor enters via orient → ACTIVE BIANHUA / nks_orient(lens="vimarshas", focus=<holon>) → knows what to do first
```

anagata kriyas alone don't call to action. Vimarshas do. When the hints form a transformation, a **bianhua** (assembly skill) gathers them into a map the navigator reads — anga inward (the driving hints and the volitional kriyas they realize), anantara between — rather than a flat list of questions.

## Thread vs Estafeta

| | Thread (нить) | Estafeta |
|---|---|---|
| Connects | kriyas via `next` | phenomena via `ahara`/`utpatti` |
| Carries | praśna (question-needle) on each arrow | sachverhalt (state of affairs) between kriyas |
| About | order of actions | lifecycle of a thing |
| Tool | follow `next` arrows | `nks_orient(lens="trace")` on phenomenon |

Never confuse. A chain of sachverhalts is an estafeta. A sequence of kriyas is a thread.

## Lifecycle closure

Broken lifecycles surfaced during design (lens="trace" broken, leaked, relay-gap) are repaired by the **weaving** skill, Operation 5: birth and death at the same abstraction level; deferred closure via anagata+upeksha is OK. Don't re-derive the procedure here.

## given_as — arrow legality

The **writing** skill owns the given_as decision tree and the full arrow matrix. At design time remember the one that bites: vollzug/grundsatz are applied, never consumed — upadhi only; ahara/utpatti to them = API 422.

vollzug/grundsatz → API rejects ahara/utpatti (422).

## Tension cheat-sheet

| Tension | Meaning | Fix |
|---|---|---|
| leaked | phenomenon has utpatti, no ahara | Add consuming kriya (end-of-life) or parked kriya (anagata+upeksha) |
| relay-gap | phenomenon has ahara, no utpatti | Add producing kriya — or it's the realm edge (boundary_inlet, computed from thread topology; information, not work) |
| orphan | phenomenon has no kriya arrows at all | Wire to a kriya (ahara/utpatti/upadhi) or delete if spurious |
| no-actor | kriya without actor | Add actor arrow to karta — but apply the karta test first (writing): a machine with no motivation is a ⚙️ phenomenon (actor → upadhi), not a karta |
| lifecycle | disconnected lifecycle segments | Thread via next, or trace to find the break |
| unreachable | upadhi phenomenon not reachable via happens-before | Check producer is hb-before consumer |

## Endpoint wiring pattern

HTTP endpoints → kriyas, not text descriptions:
1. Root sinn container (e.g. "API URL") — contains all endpoint phenomena
2. Endpoint phenomenon = sachverhalt (HTTP request). attrs: method, path
3. Kriya "Serving GET /path" — ahara ← endpoint phenomenon, utpatti → response phenomenon, actor → API client
4. Next arrows: caller → endpoint kriya → renderer

## Write mechanics → writing skill

Naming (正名), description form (pariṇāma; Fat Node — reasoning to child vimarshas, sub-steps to contains-children, reference data to dings), modes, given_as, batch ordering — the **writing** skill owns all of it. Invoke it at every write moment of every phase; don't re-derive it here.

## Deferred work

Two instruments:
- **Modes anagata+upeksha** on kriya/phenomenon: "needed, not now". Lifecycle closed formally. No tension.
- **Vimarsha** on node: open question, calls to action when time comes.

Both simultaneously OK: kriya in anagata+upeksha + samshaya "is this even needed?"

Anti-pattern: attrs.parked=true to suppress tensions. Use modes and vimarshas.

## Realm boundary

The realm edge is a topological fact, not a marker. A kriya fed by the outside world (thread-origin) or feeding it (thread-terminus) renders as boundary_inlet / boundary_outlet — information ("this is the edge"), not work. No detector demands ahara on a kriya (the old no-ahara tension is retired); never add attrs to silence a tension. `attrs.boundary="init"` survives only as a positive inlet-consumer marker, not a waiver.

## Concurrency

All mutations require `basis_version` — the `v<N>` from `nks_look`. Read → write → on conflict re-read and retry.

## orient vimarsha caveat

`nks_orient(focus=<holon>)` may show 0 vimarshas when they're attached to kriyas threading through the holon, not to phenomena inside it. The `lens="vimarshas"` view on a holon groups blocking/active/dormant across its scope — but vimarshas posed on threading kriyas still surface best via `nks_search(node_type="vimarsha", vimarsha_of=<kriya-seq>)` if numbers feel wrong.
