# design — designing a system as a graph

**Use when:** a structural choice opens — competing paths, ownership, a boundary, a dependency direction; a decision is made ("we decided", "persist this design"); a brainstorm ends. Phrases: "design this", "let's think it through", "architecture", "plan the system". Out of failure 5 (the door, `The method fails in five ways`): design with the graph, not around it.

The graph is a stable projection of the spec: a decision or risk outside it won't survive the session; behaviour that lives only in it is unverified — external sources, public boundaries and runtime evidence are what it's checked against.

**The telos is the owner's; the design is yours to write now.** On "think it through" or "we want X", the design goes into the graph in the same turn — in prose only, it is failure 5. Search, then weave the new flow into the phenomena already there; all you design is `anagata`+`chanda` (`vartamana` only for what already runs); risks; a vimarsha `posed_to` whoever must answer. Every arrow carries `sense`. A *new* transformation you may create too, but as your assumption, never as accepted (below).

## Routing boundary

Design starts where a structural choice is open (a lifecycle among them) or a decision must outlive the session. An accepted concrete request is implemented through the repository's normal flow; `methods/writing.md` only for a lasting correction, dependency, boundary or question it uncovered.

## Interop: elicitation kits (e.g. superpowers brainstorming)

If a brainstorming skill is installed, use it for elicitation; its spec file is a draft — pass it through `methods/intake.md` and stitch it in here.

## Principles

| # | Principle | For you |
|---|---|---|
| P1 | Every thing is born and dies | Each `ding` or `sachverhalt` phenomenon needs `utpatti` (an action producing it) and `ahara` (one consuming it). `leaked` = the end-of-life kriya is missing — add it. |
| P2 | A complex system can only grow | `anagata`+`upeksha` and vimarshas hold what's deferred. Depth on the first pass yields a shallow graph (all named, nothing stitched) or a fat node. |
| P3 | The graph is a tension with reality | Intake lowers it; design raises it — the graph describes what doesn't exist yet. Each vimarsha marks a tension to work. |
| P4 | Tensions tell the truth | Close the structure, never suppress (no `attrs` to mute). A tension that looks wrong is a detector bug. |

## Starting modes

A designed node is born **planned, not done** — the design triad, and the "done" stamp it must never carry: `methods/writing.md`, Decision 3. **Moving to `vartamana` is a separate, witnessed event**: the practice actually started, confirmed on its canonical carrier (`methods/reality-audit.md`), not by intent. Will matures `chanda → adhimoksha`; urgency and priority never go in `attrs`.

## A kriya born of will belongs to a transformation

A kriya recorded because the user wants it to exist (or stop), not from testimony ("it works this way"), is part of a **bianhua** — a qualitative transformation whose `telos` names what the system becomes. Attach its driving vimarshas (the *path*) and the kriya itself (the *arrival*) by `anga` (grammar: `methods/writing.md`, Decision 5). Search the forest first (`lens="bianhua"`): an existing one that fits takes the design's kriyas as `anga` now. None fits → create one, with modes that say it is your assumption, not the owner's will: `kalpita` (`anumita` if derived from the field), `anagata`, `chanda` — never `adhimoksha`. Propose its name and telos in your answer to the user, or, without the user, in a vimarsha `posed_to` the owner role. A proposal is not acceptance: only the owner's acceptance moves it to `adhimoksha`, recorded with their words in `reasoning`. Until then its kriyas hang on it by `anga` as usual (`methods/assembly.md`, step 5).

## Four phases

Enter where the graph's maturity calls; any phase can send you back.

### Phase 1: backward chaining (right to left)

Goal → path → risks → thesis; given_as flows `sachverhalt` → `bildung` → `grundsatz`/`vollzug`.

```
TRIGGER: a goal exists, a path does not
DO:
  1. Name the goal as a sachverhalt (anagata+chanda); the target state is the
     owner's — name it in dialogue, the user accepts it
  2. verstak_search + verstak_semantic_search: already in the graph?
  3. Who takes the goal? A hand-off kriya — ahara on the goal, no utpatti, actor an
     owner (svatantra) or guest (agantuka). The right edge stands before you recurse
  4. From the goal: "what produces this?" → a kriya + its ahara phenomenon
  5. Recurse until something is given from outside → an observation kriya
     (utpatti without ahara, actor whoever saw it)
OUT: a path of kriyas from entry to goal → Phase 2
```

### Phase 2: forward weaving (left to right)

```
TRIGGER: a path exists, not every phenomenon is served
DO:
  1. Walk the path. Per phenomenon: no utpatti → relay-gap → add a producer;
     no ahara → leaked → add end-of-life at the same abstraction level;
     context → holon set?
     (without a home holon it's invisible to holon-scoped orienting)
  2. Per kriya: exactly one actor (two → split; unknown → a vimarsha posed_to
     the holon's steward "who does X?", no actor until answered); sense on every arrow;
     ahara/utpatti on the right phenomena (after a distinction: reconnect)
  3. verstak_orient(lens="trace", focus=<phenomenon>) on the key ones → connected?
  4. verstak_orient(lens="tensions") → anything new?
OUT: cycles closed → Phase 3
```

Operations: `methods/weaving.md`.

### Phase 3: risks and mitigation

**3a. Analysis.** For each kriya on the path, seven provocations: (1) another actor — what if unavailable? (2) another context? (3) a corrupted `upadhi` precondition? (4) scale — parallelism, concurrency? (5) an adversary — network down, disk full, a hung process? (6) the public boundary — exports, config/schema shape, protocol, serialization, compatibility exact? (7) state and history — isolation, retries, accumulated state, a rerun? Each threat → `verstak_add_vimarsha(genre="risk", vimarsha_of=<kriya>)`.

**3b. Mitigation — one risk at a time.** Read the context (`verstak_look` around the kriya) and the environment, then pick:
- **a.** a compensating kriya or phenomenon that prevents or handles the failure;
- **b.** a `grundsatz` invariant applied via `upadhi` — born proposed (`chanda`; the owner puts it in force), with `arose_from` → this risk and `derived_from` → the principle it follows from;
- **c.** deliberate acceptance — **the owner's decision**: prepare what is accepted, at what cost, how many actions run through it, and address it to them (`methods/writing.md`, Decision 3). Until then the risk stays `virodha`.

For a and b, link `addressed_by` from the vimarsha; acceptance ends by mode, not by arrow.

### Phase 4: delivery impulse

Only for graphs designing external systems (not a methodology or CJM), once all is designed, `anagata`, and idle.

1. **Put the work on a transformation** (above): `anga` to an existing one first; else a new one at `chanda`, proposed to the owner.
2. **Stage the flow**: staged delivery (test → staging → full) is ONE delivery transformation whose stages are sub-transformations (`anga`) ordered by `anantara`, each gathering its kriyas — the owner reads it as the release plan.
3. **Work runs in a case**: `verstak_case(action="at", node=<transformation>)`; none → `open_room` on the transformation's (or stage's) write.
4. **Set the work by reference** (`methods/architect.md`, step 5) — addressed to the `adhikarin` stewarding the holon (`steward` arrow) or the owner at strategic scale, never a `pratibimba`. Order comes from `anantara` and happens-before, not a list.
5. **Vimarshas only for what outlives the work** — a risk, a question of substance, an obligation to future actors — `posed_to` and anchored where the addressee orients (`methods/inquiry.md`, §1); one whose resolution moves the transformation is also its `anga`. A one-off task → door, `One-off task`.
6. **The transformation's seed** (`methods/writing.md`, Decision 5).
7. Check vimarshas still calling and the holon's cases (`verstak_case(action="at", node=<holon>)`).
8. On a freshly accepted transformation, run `methods/integrity.md`.

Out: an agent entering through the case or orient's `ACTIVE BIANHUA` knows what to do first. Cases call for work, vimarshas for thought; anagata kriyas don't call. **Next moment:** a stage ships → its kriya goes `vartamana` only on evidence (`methods/reality-audit.md`).

## Line of work vs relay

| | Line of work | Relay |
|---|---|---|
| Links | kriyas via `next` | phenomena via `ahara`/`utpatti` |
| Carries | a needle-question on each arrow | a state of affairs between kriyas |
| About | the order of actions | a thing's lifecycle |
| Read with | walking `next` | `verstak_orient(lens="trace")` on the phenomenon |

## Rules that bite while designing

- **Broken cycles** (trace gap, `leaked`, `relay-gap`) → `methods/weaving.md`, Operation 5.
- **Arrow legality** (`vollzug`/`grundsatz` are applied only via `upadhi`; `ahara`/`utpatti` to them returns 422) and **the boundary** (an observation or hand-off kriya, its phenomenon in the external holon): `methods/writing.md`, Decision 5. `leaked`/`relay-gap` at the boundary are modelling debt, not false alarms.
- **Naming, before/after, fat nodes, modes, batch order**: `methods/writing.md`, at every write.
- **Concurrency**: mutations need `basis_version` (`v<N>` from `verstak_look`); on conflict, re-read and retry.

## Tension cheat sheet

`leaked`, `relay-gap`, `orphan`, `no-actor` → the decision tree in `methods/weaving.md` (for `no-actor`, the role test first: a machine without motivation is a phenomenon, actor → `upadhi`). Also:

| Tension | Fix |
|---|---|
| `lifecycle` (disconnected segments) | stitch via `next`, or trace to the gap |
| `unreachable` (upadhi not reachable by happens-before) | is the producer happens-before the consumer? |
| a fan (many arrows of one kind) | not "split" — name the middle level with its own coarse link (`methods/writing.md`, Decision 5; by kind: `methods/assembly.md`, step 3) |

**Endpoints become kriyas, not text:** a root `sinn` container ("API URL") holds endpoint phenomena (`sachverhalt`, attrs `method`, `path`); a kriya "Serving GET /path" takes the endpoint (`ahara`), produces the response (`utpatti`), actor the API client; `next`: caller → endpoint kriya → renderer.

**Vimarshas missing from orient**: `verstak_orient(focus=<holon>)` can show 0 for vimarshas on kriyas passing through → `verstak_search(node_type="vimarsha", vimarsha_of=<kriya seq>)`.
