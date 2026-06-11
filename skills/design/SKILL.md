---
name: design
description: "Use this skill when the user asks to design, architect, or project a system, component, or feature and NKS tools are available. Triggers: 'спроектируй', 'давай продумаем', 'архитектура', 'нужен дизайн', 'design', 'let's think through', 'plan the system', 'what should this look like', mentions of 'жц' / 'lifecycle', 'крия' / 'эстафета' / 'холон', or when the user says to 'записать в NKS' / 'положить в граф' / 'зафиксировать'. Also use when entry has triggered and the conversation turns from reading to building — the user shifts from 'what do we know?' to 'what should we build?'. Use this skill even for seemingly simple design tasks if NKS MCP tools are available — the graph prevents losing decisions, questions, and risks."
---

# NKS Design

The graph IS the spec. If it's not in the graph, it doesn't exist.

## Principles (always active)

| # | Principle | What it means for you | methodology |
|---|---|---|---|
| P1 | Every ding is born and dies | Every phenomenon (given_as=ding or sachverhalt) MUST have utpatti AND ahara. No exceptions. Leaked tension = missing end-of-life kriya. Add it. Never suppress with attrs. | #389 |
| P2 | Complex systems grow, not get built | Leave room. Use anagata+upeksha modes and vimarshas for deferred work. Deep on first pass = anti-pattern. | #390 |
| P3 | Graph ≠ reality, graph = tension with reality | Shabda intake lowers tension. Design raises it. Every vimarsha marks a tension. System evolves by processing vimarshas. | #403 |
| P4 | Tensions are always truthful | Never suppress. Always close structure. attrs.role='reference' = anti-pattern. If tension feels wrong → detector bug (#373), not your cue to silence it. | #404 |

## Starting modes for projected work (#53)

A projected practice is born **planned, not done**. Its triad is the *project* triad — never the "ready" one. Stamping a designed-but-nonexistent kriya/phenomenon as `pramanita/vartamana/upeksha` lies about both its ontic state (it isn't running) and its epistemic state (it isn't verified), and the lie cascades: false `vartamana` breaks the sunset section, succession, anga-raising (a "ready" kriya can't be anga — nothing is left to move), and carrier predicates.

| You are recording | Epistemic | Ontic | Volition | Triad (#53) |
|---|---|---|---|---|
| A planned kriya/phenomenon to build | anumita | anagata | chanda | проект |
| A settled plan you commit to | anumita | anagata | adhimoksha | зрелый проект |
| Deferred — "needed, not now" | anumita | anagata | upeksha | (parked) |
| Something observed already running | pratyakshita | vartamana | upeksha | наблюдение |

**Transition to `vartamana` is a separate act of life** (движение 1 «проект → реализация», #53), performed when the practice actually starts — not the default of writing a designed node. Volition graduates along the `chanda → adhimoksha` axis (want → committed); never reach for `attrs` to express urgency or priority (#979).

## Four phases of design (#405)

Enter any phase based on graph maturity. Not waterfall — any phase can loop back.

### Phase 1: Backward chaining (#160)

```
TRIGGER: goal exists, path does not
DO:
  1. Name goal as sachverhalt(anagata+chanda) — #159
  2. nks_search + nks_semantic_search — goal doesn't already exist? (keyword misses a differently-phrased duplicate; semantic catches it before you design it twice)
  3. From goal: "what produces this?" → create kriya + ahara phenomenon
  4. Recurse until you hit a ding that must be given (realm inlet)
  5. Mark inlets: attrs.boundary="init"
OUTPUT: path of kriyas from inlet to goal
NEXT: → Phase 2 (forward weaving)
```

Actor: Проектирующий (#116). Consumes: Вопрошание поставлено (#141). Produces: Путь построен (#145).

### Phase 2: Forward weaving (#421)

```
TRIGGER: path exists, not all entities serviced
DO:
  1. Walk path left to right
  2. For each phenomenon on the path:
     - Has utpatti? If no → relay-gap → add producing kriya
     - Has ahara? If no → leaked → add end-of-life kriya
     - Level of abstraction matches? Bootstrap creates config → Teardown destroys config (same level)
  3. For each kriya:
     - Has exactly one actor? If two → split (#419, #386)
     - All arrows have sense? If no → write sense (#418)
     - ahara/utpatti point to correct phenomena? (may need reconnect after distinctions — #420)
  4. nks_orient(lens="trace", focus=<phenomenon>) on key phenomena → lifecycle connected?
  5. nks_orient(lens="tensions") → new problems?
OUTPUT: tensions discovered, lifecycles closed
NEXT: → Phase 3 (risk analysis) or → lifecycle closure (#397→#398) if broken
```

Actor: Ткач (#302). Consumes: Путь построен (#145). Produces: Натяжение замечено (#143), Lifecycle замкнут (#396).

### Phase 3: Risk analysis + mitigation

**3a. Analysis (#161):**
```
TRIGGER: path woven, risks not assessed
DO: For each kriya on path, five provocation questions (#262):
  1. Different actor? What if unavailable?
  2. Different context? Environment changed?
  3. Damaged upadhi? Precondition corrupted?
  4. Scale mismatch? Parallel/concurrent?
  5. Adversary? Network drops, disk fills, process hangs?
  If threat found → nks_add_vimarsha(genre="risk", vimarsha_of=<kriya>)
OUTPUT: risk-vimarshas (#400)
```

**3b. Mitigation (#391) — separate process, per risk:**
```
TRIGGER: risk-vimarsha exists, unaddressed
DO:
  1. Read risk context: nks_look on target kriya + neighborhood
  2. Research operational environment
  3. Choose response type:
     a. Mitigation kriya → new action preventing/handling failure
     b. Grundsatz invariant → principle as upadhi
     c. Conscious acceptance → vimarsha to upeksha with reasoning
  4. Wire response, nks_arrow(action="link") addressed_by from vimarsha
OUTPUT: hint-vimarshas for implementation (#401)
NEXT: → Phase 4 or → next risk
```

### Phase 4: Delivery impulse (#392)

```
TRIGGER: graph designed, all in anagata modes, no one is working on it
CONDITION: only for graphs projecting external systems (not methodology, not CJM)
DO:
  1. Create hint-vimarshas for implementors
  2. Each hint: scope of work, acceptance criteria, posed_to (volition graduates chanda→adhimoksha — never attrs.priority; blockingness is a property of the pair, #979)
  3. Order hints: dependencies, what-blocks-what
  4. Cross-reference with existing open vimarshas
  5. If the work is one qualitative transformation: name the bianhua and attach each
     driving hint via anga → the impulse becomes part of 形, not a scattered list
OUTPUT: implementor enters via orient → ACTIVE BIANHUA / nks_orient(lens="vimarshas", focus=<holon>) → knows what to do first
```

anagata kriyas alone don't call to action. Vimarshas do. When the hints form a transformation, a **bianhua** (assembly skill) gathers them into a map the navigator reads — anga inward, anantara between — rather than a flat list of questions.

## Thread vs Estafeta (#412)

| | Thread (нить) | Estafeta |
|---|---|---|
| Connects | kriyas via `next` | phenomena via `ahara`/`utpatti` |
| Carries | praśna (question-needle) on each arrow | sachverhalt (state of affairs) between kriyas |
| About | order of actions | lifecycle of a thing |
| Tool | follow `next` arrows | `nks_orient(lens="trace")` on phenomenon |

Never confuse. A chain of sachverhalts is an estafeta. A sequence of kriyas is a thread.

## Lifecycle closure (#399, Нить 8)

```
TRIGGER: lens="trace" shows "lifecycle broken" or lens="tensions" shows leaked/relay-gap
PATH: #158(tension) → #162(trace) → #397(diagnose) → #398(close) → #162(re-trace)
DO:
  1. nks_orient(lens="trace", focus=<phenomenon>) on flagged phenomenon → see where lifecycle breaks
  2. Diagnose: missing end-of-life? missing producer? wrong abstraction level?
  3. Add the missing kriya at the SAME abstraction level as the producing kriya
  4. Re-trace → lifecycle connected? If not → loop
  5. Deferred closure OK: kriya in anagata+upeksha = placeholder, lifecycle formally closed
```

## given_as — arrow legality

| given_as | What it is | Legal arrows |
|---|---|---|
| ding 物 | Thing outside graph | ahara, utpatti, context |
| sachverhalt 勢 | State of affairs | ahara, utpatti, context |
| sinn 名 | Named meaning | upadhi, vimarsha_of |
| bildung 理 | Forming pattern | arose_from, realized_as |
| vollzug 行 | Method/procedure | upadhi only |
| grundsatz 法 | Principle/invariant | upadhi only |

vollzug/grundsatz → API rejects ahara/utpatti (422). See #372, #376.

## Tension cheat-sheet

| Tension | Meaning | Fix |
|---|---|---|
| leaked | phenomenon has utpatti, no ahara | Add consuming kriya (end-of-life) or parked kriya (anagata+upeksha) |
| relay-gap | phenomenon has ahara, no utpatti | Add producing kriya or mark inlet (boundary='init') |
| orphan | phenomenon has no kriya arrows at all | Wire to a kriya (ahara/utpatti/upadhi) or delete if spurious |
| no-ahara | kriya without input | Add ahara or set attrs.boundary='init' for inlets |
| no-actor | kriya without actor | Add actor arrow to karta |
| lifecycle | disconnected lifecycle segments | Thread via next, or trace to find the break |
| unreachable | upadhi phenomenon not reachable via happens-before | Check producer is hb-before consumer |

## Batch ordering

When using `nks_batch` with 3+ operations:
1. **Phenomena first** — sachverhalts, dings, sinns
2. **Kriyas second** — with arrows-inline referencing phenomena from step 1
3. **Cross-cutting arrows last** — next between kriyas, context to holons, vimarsha_of

Partial failure is safe in this order: phenomena without kriyas = orphan (fixable), kriyas without phenomena = broken (harder).

## Endpoint wiring pattern (#406)

HTTP endpoints → kriyas, not text descriptions:
1. Root sinn container (e.g. "API URL") — contains all endpoint phenomena
2. Endpoint phenomenon = sachverhalt (HTTP request). attrs: method, path
3. Kriya "Обслуживание GET /path" — ahara ← endpoint phenomenon, utpatti → response phenomenon, actor → API client
4. Next arrows: caller → endpoint kriya → renderer

## Fat Node — where to put content (#414)

| Content type | Where it goes |
|---|---|
| Insights, reasoning, justifications | Vimarshas (prati-paksha, hint, hetu-dosha) with arose_from |
| Sub-steps, stages | Contains children (sub-kriyas) |
| Reference data, schemas | Separate phenomena (ding) — long description OK for dings |
| Related concepts | Separate phenomena (sinn) + upadhi arrows |

Long description on ding = fine (describing a thing). Long description on kriya = anti-pattern (procedure instead of pariṇāma).

## Deferred work (#415)

Two instruments:
- **Modes anagata+upeksha** on kriya/phenomenon: "needed, not now". Lifecycle closed formally. No tension.
- **Vimarsha** on node: open question, calls to action when time comes.

Both simultaneously OK: kriya in anagata+upeksha + samshaya "is this even needed?"

Anti-pattern: attrs.parked=true to suppress tensions. Use modes and vimarshas.

## Realm inlets (#416)

Kriyas without upstream (HTTP handler, scheduled tick, bootstrap):
- Set `attrs.boundary="init"` → waives has_ahara tension
- ENTRY KRIYAS in orient = diagnostic signal. Healthy realm: ENTRY ≈ INIT. ENTRY >> INIT → unprimed ahara arrows, needs weaving.

## Naming (正名, #72)

- **Kriya**: verbal noun. ✓ "Аутентификация", "Bootstrap VM". ✗ "Build the API" (imperative).
- **Phenomenon**: noun + emoji. ✓ "⚙️ VM ready", "🛡️ Zero-SSH". ✗ "Token creation" (kriya in disguise).
- **Holon**: boundary name. ✓ "📦 Контур авторизации". ✗ "📦 Папка auth" (folder thinking).
- **Karta**: role + motivation. ✓ "👤 Проектирующий". ✗ "Иван Петров" (person, not role).
- **Vimarsha**: the actual question. ✓ "🕮 How does agent access NKS?". ✗ "Auth stuff" (not a question).

## Methodology lookups

| Question | Node |
|---|---|
| Arrow × given_as matrix | `nks_look(node_id="376", realm="methodology")` |
| Backward chaining | `nks_look(node_id="160", realm="methodology")` |
| Call = communication | `nks_look(node_id="386", realm="methodology")` |
| Five risk questions | `nks_look(node_id="262", realm="methodology")` |
| 正名 naming | `nks_look(node_id="72", realm="methodology")` |
| Realm principles | `nks_look(node_id="332", realm="methodology")` |
| Estafeta concept | `nks_look(node_id="128", realm="methodology")` |
| Crystallization | `nks_look(node_id="387", realm="methodology")` |
| Lifecycle closure | `nks_look(node_id="389", realm="methodology")` |
| System growth principle | `nks_look(node_id="390", realm="methodology")` |
| Graph = tension with reality | `nks_look(node_id="403", realm="methodology")` |
| Four phases of design | `nks_look(node_id="405", realm="methodology")` |
| Thread ≠ estafeta | `nks_look(node_id="412", realm="methodology")` |

## Concurrency

All mutations require `basis_version` — the `v<N>` from `nks_look`. Read → write → on conflict re-read and retry.

## orient vimarsha caveat

`nks_orient(focus=<holon>)` may show 0 vimarshas when they're attached to kriyas threading through the holon, not to phenomena inside it. The `lens="vimarshas"` view on a holon groups blocking/active/dormant across its scope — but vimarshas posed on threading kriyas still surface best via `nks_search(node_type="vimarsha", vimarsha_of=<kriya-seq>)` if numbers feel wrong.
