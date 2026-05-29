---
name: weaving
description: "Use this skill when doing semantic work on an existing NKS graph: closing lifecycles, writing sense on edges, splitting kriyas with multiple actors, reconnecting edges after phenomenon distinctions, or any work where the graph exists structurally but needs semantic completeness. Triggers: 'проткать', 'прошить', 'ткачество', 'weave', 'close lifecycle', 'fix tensions', 'sense на стрелках', references to leaked/relay-gap/orphan tensions, or when nks_orient(lens=\"tensions\") shows structural problems. Also triggers when entry shows a realm with high tension count, or when orient shows ENTRY far exceeding INIT kriyas. Distinct from design: design creates structure from goals, weaving completes structure that already exists."
---

# NKS Weaving

You are the Ткач (#302 in methodology). Your job: the graph has structure but lacks semantic completeness. You read, discover breaks, and repair — not by inventing new paths, but by finding connections that were implied but never made explicit.

Design creates. Weaving completes.

## When to weave (not design)

| Signal | Meaning | Action |
|---|---|---|
| `lens="tensions"` shows leaked | Phenomenon has utpatti, no ahara | → Close lifecycle |
| `lens="tensions"` shows relay-gap | Phenomenon has ahara, no utpatti | → Add producer or mark inlet |
| `nks_orient` shows ENTRY >> INIT | Many kriyas without upstream | → Wire ahara edges |
| Edge without description | Mute connection | → Write sense |
| Kriya with 2 actor edges | Hidden double kriya | → Split |
| Phenomenon was one, now two | Stale edges | → Reconnect |
| `lens="trace"` shows broken | Lifecycle not connected | → Diagnose → close |

## Core operations

### 1. Estafeta priming (#417)

```
TRIGGER: lens="trace" shows broken lifecycle OR lens="tensions" shows leaked/relay-gap
DO:
  1. Identify the break: nks_orient(lens="trace", focus=<phenomenon>) → find the gap
  2. Send-analysis: utpatti without consumer → who should pick up?
  3. Receive-analysis: ahara without producer → where does it come from?
  4. If connecting phenomenon doesn't exist → create sachverhalt
  5. Wire: nks_link ahara/utpatti
  6. Verify: nks_orient(lens="trace", focus=<phenomenon>) → lifecycle connected?
ANTI-PATTERN: suppressing tension with attrs instead of closing structure
```

### 2. Sense writing (#418)

```
TRIGGER: edge has no description, or description duplicates target name
DO:
  1. Read both endpoints: nks_look on source and target
  2. Ask: WHY does this connection exist? What does the target DO for the source?
  3. Write sense based on edge type:
     - next → praśna: yes/no question agent answers from their situation
       ✓ "Path built — where can it break?"
       ✗ "Go to next step" (not a question)
     - upadhi → "why this context HERE": what the phenomenon contributes to this specific kriya
       ✓ "at design time: every lifecycle must be closed"
       ✗ "principle of lifecycle closure" (duplicates phenomenon name)
     - arose_from → "what gave birth to this question"
     - ahara → "what this kriya consumes and why"
  4. nks_link or nks_update to write description on edge
SIGNAL of bad sense: it says the same thing as the target phenomenon's name
```

### 3. Double kriya decomposition (#419)

```
TRIGGER: kriya has 2+ actor edges, or description implies two actors with different motivations
SIGNALS:
  - Two actor edges visible in nks_look
  - Description contains "and then another agent/role..."
  - pariṇāma describes TWO qualitative transitions
  - Different time scales within one kriya
DO:
  1. Identify the two roles and their motivations
  2. Create two kriyas, each with one actor
  3. Connect via next (if sequential) or via sachverhalt transfer (utpatti → ahara)
  4. Move edges from original to appropriate child
  5. Delete or visarjana the original
  6. read the CHECKS: block each create response prints (factories self-validate) — both new kriyas clean?
BASIS: methodology #386 — call = communication, not nesting (π-calculus scope extrusion)
```

### 4. Distinction reconnection (#420)

```
TRIGGER: phenomenon was one, now distinguished into two (or more). Old edges point at the undistinguished whole.
EXAMPLE: "Config" split into "Runtime Config" + "Build Config". Kriya K has ahara → "Config". Which config does K consume?
DO:
  1. Find all edges pointing at the old phenomenon: nks_look
  2. For each edge: which distinguished phenomenon is correct?
  3. nks_reconnect_edge to redirect (atomic, never half-reconnected)
  4. If old phenomenon is now empty of edges → visarjana or delete
  5. nks_look on affected kriyas — check the CHECKS: block (reconnect is an edit, so re-look)
```

### 5. Lifecycle closure (#397 → #398)

```
TRIGGER: lens="trace" shows broken lifecycle on phenomenon
PATH: trace → diagnose (#397) → close (#398) → re-trace
DO:
  1. DIAGNOSE nature of break:
     a. Missing end-of-life kriya (leaked: utpatti exists, ahara missing)
     b. Missing producer kriya (relay-gap: ahara exists, utpatti missing)
     c. Wrong abstraction level (teardown too granular or too abstract)
  2. CLOSE:
     a. Add end-of-life kriya at SAME abstraction level as producer
        Config born at "Bootstrap" → dies at "Teardown" (not at "rm -rf")
     b. Or add producer kriya / mark inlet (boundary='init')
     c. Or defer: kriya in anagata+upeksha = placeholder, lifecycle formally closed
  3. RE-TRACE: nks_orient(lens="trace", focus=<phenomenon>) → lifecycle connected?
  4. If still broken → loop
PRINCIPLE: every ding is born and dies (#389). Deferred closure via modes is OK (#390). Suppression via attrs is never OK (#404).
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
    → yes but edges have no sense → Operation 2 (sense writing)

no-actor on kriya?
  → nks_look: who performs this?
    → one role → nks_link actor
    → two roles → Operation 3 (decomposition)

no structural tension but graph feels incomplete?
  → Read kriyas manually: nks_look on key kriyas
    → edges without description? → Operation 2
    → two actors? → Operation 3
    → entities that were split? → Operation 4
```

## Weaving in context of design (Phase 2)

When weaving as Phase 2 of design (#421):
1. Walk the path built by backward chaining (Phase 1)
2. For each phenomenon: lifecycle closed? → if not, Operation 5
3. For each kriya: one actor? sense on edges? → Operations 2, 3
4. For each distinction made during walk: old edges correct? → Operation 4
5. When path is woven → next to Phase 3 (risk analysis, #161)

But weaving is NOT only Phase 2. Enter from:
- Tracing (#162): trace showed broken → Operation 1 or 5
- Tension (#158): structural problem → decision tree above
- Shabda intake (#165): external input revealed distinction → Operation 4
- Refinement (#366): accumulated vimarshas need structural response → any operation

## Rhythm

- Cap NKS calls at ~7 per response unless batching
- Re-orient every 5-10 nodes
- After an edit (reconnect/update): nks_look on the affected node — failed checks render in CHECKS:. After a create: the CHECKS arrive in the factory's own response.
- After lifecycle work: nks_orient(lens="trace", focus=…) to confirm connected
- Batch order: phenomena → kriyas → links

## What weaving is NOT

- NOT inventing new paths (that's design, Phase 1)
- NOT risk analysis (that's Phase 3)
- NOT creating vimarshas about what to build (that's questioning, #151)
- NOT suppressing tensions (that's never OK)

Weaving DISCOVERS connections that were implied but not explicit. The Ткач reads the graph semantically — not just structure, but meaning — and makes the implicit explicit.

## Methodology lookups

| Question | Node |
|---|---|
| Estafeta concept | `nks_look(node_id="128", realm="methodology")` |
| Thread ≠ estafeta | `nks_look(node_id="412", realm="methodology")` |
| Lifecycle closure principle | `nks_look(node_id="389", realm="methodology")` |
| System growth (defer OK) | `nks_look(node_id="390", realm="methodology")` |
| Tensions = truthful signal | `nks_look(node_id="404", realm="methodology")` |
| Call = communication #386 | `nks_look(node_id="386", realm="methodology")` |
| Sense on edges principle | `nks_look(node_id="332", realm="methodology")` (principle 6) |
| Graph = tension with reality | `nks_look(node_id="403", realm="methodology")` |
| Weaving as Phase 2 | `nks_look(node_id="421", realm="methodology")` |
| Weaving vimarsha (origin) | `nks_look(node_id="290", realm="methodology")` |
| Ткач karta | `nks_look(node_id="302", realm="methodology")` |
