---
name: weaving
description: "Use this skill when doing semantic work on an existing NKS graph: closing lifecycles, writing sense on arrows, splitting kriyas with multiple actors, reconnecting arrows after phenomenon distinctions, or any work where the graph exists structurally but needs semantic completeness. Triggers: 'проткать', 'прошить', 'ткачество', 'weave', 'close lifecycle', 'fix tensions', 'sense на стрелках', references to leaked/relay-gap/orphan tensions, or when nks_orient(lens=\"tensions\") shows structural problems. Also triggers when entry shows a realm with high tension count (large leaked/relay-gap sections in lens=\"tensions\"). Distinct from design: design creates structure from goals, weaving completes structure that already exists."
---

# NKS Weaving

**Weaving** is the work here: the graph has structure but lacks semantic completeness. You read, discover breaks, and repair — not by inventing new paths, but by finding connections that were implied but never made explicit.

Design creates. Weaving completes.

## Route by resolving move first (response_kind)

`nks_orient(lens="tensions")` groups every tension by its **resolving move** — and not all four are yours:

| Group | Move | Yours? |
|---|---|---|
| **weave** | замкни структуру — leaked, relay-gap, no-actor, no-sense, orphan-by-given_as, unreachable upadhi | **Yes** — this skill (operations below) |
| **address** | ответь / закрой вопрошание — unresolved risk, unanchored vimarsha, bug-without-vimarsha | No → the **inquiry** / **assembly** agenda (carries transcendent will) |
| **reverify** | потрогай / обнови модус — stale, mode-conflict | No → background, or the reader on the spot (confirm-touch / release / doubt); touch the node's mode, don't restructure |
| **boundary** | оставь — санкционированный край реалма | No → **information, not work** (see below) |

Repair only the **weave** group. Don't invent structure to "answer" an address-class question, don't restructure a reverify-class stale node, and — the trap below — don't try to weave a boundary.

`lens="tensions"` is the **full registry**; the cheap `has_tension` filter and the orient overview cover only a subset — each surface declares its own «covers N/M» (a `Scope:` / coverage line). Weave from `lens="tensions"`; never read a thin `has_tension` list as a clean realm.

### Boundary is the edge of the world, not a break

A realm legitimately takes input from and delivers output beyond itself. The detector already **subtracts the boundary subset from leaked/relay** — so a phenomenon still sitting in the **weave** group is *not* a boundary; weave it. Only what orient files under **boundary** is the edge, and the criterion is **topological — read it off the thread, don't go hunting in other realms for it**:

- **boundary-outlet** — terminal delivery on a `next`-thread: the consumer is outside the realm. The producing kriya needs no downstream consumer here.
- **boundary-inlet** — a `next`-thread origin, **or** a kriya marked `attrs.boundary="init"`: the impulse comes from outside the realm. Needs no upstream producer / ahara here.

Boundary renders as information ("this is the edge"), never a tension to close. And never add `attrs` to silence a *non*-boundary tension — that's suppression, not a boundary.

### Carrier transitions are acts, not tensions

A step *forward along a node's carrier* (e.g. `anagata→vartamana` as a practice starts) and an *ascent in certainty* (`Kl→An→Pt→Pm`) are **legitimate weaving acts** — make them when the graph implies them; they are not tensions. Only **suspicious** transitions surface, and only as **reverify**-class: a `Warning` on write and a self-extinguishing `LocalCheck` (response_kind=reverify) in `nks_look` — resurrection (`atita→vartamana`, unexplained), `Pm→An/Kl` without a reverify event, death-without-being (`anagata→atita` skipping `vartamana`; kind-aware — a risk's `Ag→At` is legitimate realization). Resolve by touching the node's mode; never restructure, and never read it as a standing tension or a counter.

## When to weave (not design)

| Signal | Meaning | Action |
|---|---|---|
| `lens="tensions"` shows leaked | Phenomenon has utpatti, no ahara | → Close lifecycle |
| `lens="tensions"` shows relay-gap | Phenomenon has ahara, no utpatti | → Add producer — or it's the realm edge (boundary-inlet, computed from thread topology: information, not work) |
| ENTRY KRIYAS in orient looks bloated | Kriyas missing their ahara wiring | → Wire ahara arrows (true inlets render as boundary-inlet — no marker needed) |
| Arrow without sense | Mute connection | → Write sense |
| Kriya with 2 actor arrows | Hidden double kriya | → Split |
| Phenomenon was one, now two | Stale arrows | → Reconnect |
| `lens="trace"` shows broken | Lifecycle not connected | → Diagnose → close |

## Core operations

### 1. Estafeta priming

```
TRIGGER: lens="trace" shows broken lifecycle OR lens="tensions" shows leaked/relay-gap
DO:
  1. Identify the break: nks_orient(lens="trace", focus=<phenomenon>) → find the gap
  2. Send-analysis: utpatti without consumer → who should pick up?
  3. Receive-analysis: ahara without producer → where does it come from?
  4. If connecting phenomenon doesn't exist → create sachverhalt
  5. Wire: nks_arrow(action="link") ahara/utpatti
  6. Verify: nks_orient(lens="trace", focus=<phenomenon>) → lifecycle connected?
ANTI-PATTERN: suppressing tension with attrs instead of closing structure
```

### 2. Sense writing

```
TRIGGER: arrow has no sense, or sense duplicates target name
DO:
  1. Read both endpoints: nks_look on source and target
  2. Ask: WHY does this connection exist? What does the target DO for the source?
  3. Write sense based on arrow type:
     - next → praśna: yes/no question agent answers from their situation
       ✓ "Path built — where can it break?"
       ✗ "Go to next step" (not a question)
     - upadhi → "why this context HERE": what the phenomenon contributes to this specific kriya
       ✓ "at design time: every lifecycle must be closed"
       ✗ "principle of lifecycle closure" (duplicates phenomenon name)
     - arose_from → "what gave birth to this question"
     - ahara → "what this kriya consumes and why"
  4. nks_arrow(action="link") or nks_arrow(action="update") to write sense on the arrow
SIGNAL of bad sense: it says the same thing as the target phenomenon's name
```

### 3. Double kriya decomposition

```
TRIGGER: kriya has 2+ actor arrows, or description implies two actors with different motivations
SIGNALS:
  - Two actor arrows visible in nks_look
  - Description contains "and then another agent/role..."
  - pariṇāma describes TWO qualitative transitions
  - Different time scales within one kriya
DO:
  1. Identify the two roles and their motivations
  2. Create two kriyas, each with one actor
  3. Connect via next (if sequential) or via sachverhalt transfer (utpatti → ahara)
  4. Move arrows from original to appropriate child
  5. Delete or visarjana the original
  6. read the CHECKS: block each create response prints (factories self-validate) — both new kriyas clean?
BASIS: call = communication, not nesting (π-calculus scope extrusion)
```

### 4. Distinction reconnection

```
TRIGGER: phenomenon was one, now distinguished into two (or more). Old arrows point at the undistinguished whole.
EXAMPLE: "Config" split into "Runtime Config" + "Build Config". Kriya K has ahara → "Config". Which config does K consume?
DO:
  1. Find all arrows pointing at the old phenomenon: nks_look
  2. For each arrow: which distinguished phenomenon is correct?
  3. nks_arrow(action="reconnect") to redirect (atomic, never half-reconnected)
  4. If old phenomenon is now empty of arrows → visarjana or delete
  5. nks_look on affected kriyas — check the CHECKS: block (reconnect is an edit, so re-look)
```

### 5. Lifecycle closure

```
TRIGGER: lens="trace" shows broken lifecycle on phenomenon
PATH: trace → diagnose → close → re-trace
DO:
  1. DIAGNOSE nature of break:
     a. Missing end-of-life kriya (leaked: utpatti exists, ahara missing)
     b. Missing producer kriya (relay-gap: ahara exists, utpatti missing)
     c. Wrong abstraction level (teardown too granular or too abstract)
     d. Inherited closure: the node lives under a `contains`-umbrella whose
        parent already closes the lifecycle (contains_closure, E1) —
        then it inherits the parent's lifecycle. Not a break; leave it.
  2. CLOSE:
     a. Add end-of-life kriya at SAME abstraction level as producer
        Config born at "Bootstrap" → dies at "Teardown" (not at "rm -rf")
     b. Or add producer kriya — or recognize the realm edge (boundary-inlet/outlet is topological: information, not work; no marker)
     c. Or defer: kriya in anagata+upeksha = placeholder, lifecycle formally closed
     d. Or recognize inherited closure (1d): don't patch a child individually
        when its contains-umbrella owns the lifecycle
  3. RE-TRACE: nks_orient(lens="trace", focus=<phenomenon>) → lifecycle connected?
  4. If still broken → loop
PRINCIPLE: every ding is born and dies. Deferred closure via modes is OK. Suppression via attrs is never OK.
```

## Decision tree: which operation?

```
Start: nks_orient(realm=..., lens="tensions", verbose=true)

leaked phenomenon?
  → nks_orient(lens="trace", focus=<phenomenon>)   # auto-forward for a phenomenon
    → lifecycle broken? → Operation 5 (lifecycle closure)
    → lifecycle connected but no consumer? → Operation 1 (estafeta priming)

relay-gap?
  → nks_orient(lens="trace", focus=<consuming kriya>)   # auto-backward for a kriya — trace and relay are one lens now
    → missing producer → Operation 1 (add producer or inlet)

orphan phenomenon?
  → nks_look: does it belong to any kriya?
    → no → wire to relevant kriya or delete
    → yes but arrows have no sense → Operation 2 (sense writing)

no-actor on kriya?
  → nks_look: who performs this?
    → one role → nks_arrow(action="link") actor
    → two roles → Operation 3 (decomposition)

no structural tension but graph feels incomplete?
  → Read kriyas manually: nks_look on key kriyas
    → arrows without sense? → Operation 2
    → two actors? → Operation 3
    → phenomena that were split? → Operation 4
```

## Weaving in context of design (Phase 2)

When weaving as Phase 2 of design:
1. Walk the path built by backward chaining (Phase 1)
2. For each phenomenon: lifecycle closed? → if not, Operation 5
3. For each kriya: one actor? sense on arrows? → Operations 2, 3
4. For each distinction made during walk: old arrows correct? → Operation 4
5. When path is woven → next to Phase 3 (risk analysis)

But weaving is NOT only Phase 2. Enter from:
- Tracing: trace showed broken → Operation 1 or 5
- Tension: structural problem → decision tree above
- Shabda intake: external input revealed distinction → Operation 4
- Refinement: accumulated vimarshas need structural response → any operation

## Rhythm

- Cap NKS calls at ~7 per response unless batching
- Re-orient every 5-10 nodes
- After an edit (reconnect/update): nks_look on the affected node — failed checks render in CHECKS:. After a create: the CHECKS arrive in the factory's own response.
- After lifecycle work: nks_orient(lens="trace", focus=…) to confirm connected
- Batch order: phenomena → kriyas → arrows

## What weaving is NOT

- NOT inventing new paths (that's design, Phase 1)
- NOT risk analysis (that's Phase 3)
- NOT creating vimarshas about what to build (that's questioning)
- NOT suppressing tensions (that's never OK)

Weaving DISCOVERS connections that were implied but not explicit. It reads the graph semantically — not just structure, but meaning — and makes the implicit explicit. When the other end of an implied connection isn't in view, **`nks_semantic_search(q=<the concept>)`** finds the node that belongs there by meaning — where tension-walking and keyword search won't surface it.
