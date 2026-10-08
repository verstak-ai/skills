# weaving — completing an existing graph

**Use when:** a stage is done, merged or decided and the graph must catch up; a phenomenon was distinguished into several; tensions pile up (`leaked` / `relay-gap` / `orphan`). The structure exists but meaning is incomplete: lifecycles to close, sense on arrows, kriyas with two actors to split. Phrases: "weave", "stitch", "close the lifecycle", "fix the tensions". Out of failure 4 (the door, `The method fails in five ways`). Weaving draws links that were implied and never made; it doesn't invent paths (that's design).

## Route by the resolving move first

`verstak_orient(lens="tensions")` groups tensions by **resolving move** (`response_kind`). Only one group is yours:

| Group, by its move | Covers | Who |
|---|---|---|
| close the structure | `leaked`, `relay-gap`, `no-actor`, `no-sense`, orphan by given_as, unreachable `upadhi` | **you** — the operations below |
| answer or end a question | unresolved risk, unanchored vimarsha, bug without a vimarsha | the agenda (`methods/inquiry.md`, `methods/assembly.md`) — it carries the owner's will |
| touch a mode | conflicting modes, a transformation's record behind its case | confirm / release / raise a doubt — don't restructure; a confirming touch names its level, graph or world |
| neighbour (only with `focus` on a holon) | a scope pair covered by an action outside — a link, not a tension | know the neighbour's steward; nothing to weave |

**Don't repair what was accepted.** The unwanted in `upeksha`, or a question accepted as is, is someone's decision; "fixing" it undoes it.

**Don't fix a mass one row at a time.** Uniform rows converging on one neighbour are one undistinguished thing. Touching a node in the mass, leave a remark, not a copied fix: a second `vimarsha_of` anchor from the mass's vimarsha to this node, its sense saying what you noticed. No vimarsha on the cause → pose one there, addressed to the steward of its holon. Not folded into one row by the lens → judge convergence yourself. The distinction ("what is not distinguished here?") is an assembly move; its answer clears the mass at once.

**Each door judges by its own rules.** The tensions lens uses its registry, a node card the rules that come with the node; neither is a superset. A vanished card warning → the node's history. `has_tension` covers a subset of detectors (coverage in each response's header). Weave from `lens="tensions"` with `focus` on a holon (else no neighbours print); a thin `has_tension` list is not a clean graph.

### A boundary is the edge of the world, not a break

The edge is an observation kriya on entry, a hand-off kriya on exit (`methods/writing.md`, Decision 5): they clear a `relay-gap` from outside and a `leaked` that leaves. The overview (`verstak_orient` without `focus`) lists actions that take what nobody produces: each needs a producer.

### Carrier transitions are acts, not tensions

A step forward on the carrying axis (`anagata → vartamana` when a practice starts) and rising confidence (`kalpita → … → pramanita`) are weaving acts — make them on evidence. A practice starts when an actor does it, a rollout or an observed run shows it (`methods/reality-audit.md`); merged code moves the map and the nodes it carries, not the kriya. No evidence → the kriya stays `anagata`; ask for what's missing in a vimarsha `posed_to` whoever runs it. Only **suspicious** ones surface, in the mode-touch group (a `Warning` on the write, a self-clearing check in `verstak_look`): resurrection (`atita`/`nashta` → `vartamana` without grounds); `pramanita` → `anumita`/`kalpita` without a reverify event; death without being (`anagata` → `atita`/`nashta`; for a risk, `anagata → atita` is a legitimate realization). Resolve by touching the mode; they are not standing tensions.

## Decision tree

```
Start: verstak_orient(realm=..., lens="tensions", focus=<holon>, verbose=true)

a mass? → remark as a second anchor; pose the cause's vimarsha if missing (above)
leaked? → does the body NAME the consumer in prose? draw arrows to every one
          (upadhi is cheap), prose into sense
        → trace forward (lens="trace", focus=<phenomenon>):
          cycle broken → Op 5; connected, no consumer → Op 1
relay-gap, or actions taking what nobody produces?
        → trace backward (focus=<consuming kriya>): add a producer (Op 1);
          from outside → an observation kriya
orphan phenomenon? → verstak_look: does a kriya own it?
          no → stitch it; doesn't hold → delete (no distinction), refute and
               keep (false thesis), or release (right, no longer needed)
          yes, arrows lack sense → Op 2
no-actor? → one known role → link actor; two roles → Op 3; who does it unknown
          → a vimarsha posed_to the holon's steward (or the owner) "who does X?",
          no actor until answered — a guessed role costs more than the tension
arrow without sense → Op 2;  one phenomenon became two → Op 4
no tensions, but feels incomplete? → verstak_look the key kriyas:
          mute arrows → 2; two actors → 3; distinguished phenomena → 4
```

## Operations

The closing line: **tension → trace → diagnosis → closure → re-trace**. Only the re-trace confirms "cycle closed".

### 1. Stitching a relay

Trace the gap: `utpatti` with no consumer → who picks it up? `ahara` with no producer → where does it come from? No linking phenomenon → create a `sachverhalt`. Link `ahara`/`utpatti`, re-trace. Never mute with `attrs`.

### 2. Writing sense

Read both ends (`verstak_look`) and ask what the target *does* for the source. By arrow type (`methods/writing.md`, Decision 5): `next` → a needle-question ✓ "Path built — where can it break?" ✗ "Go to the next step"; `upadhi` → what this context gives this kriya ✓ "when designing: every lifecycle must be closed" ✗ "lifecycle closure principle"; `arose_from` → what raised the question; `ahara` → what is consumed and why. Record via `verstak_arrow(action="link")` or `action="update"`. **Sign of a bad sense:** it repeats the target's name.

### 3. Splitting a double kriya

Signs: two `actor` arrows; "and then another role…" in the description; a before/after with two qualitative changes; two time scales.

1. Name the two roles and their motivations.
2. Two kriyas, one actor each, linked by `next` or a handed `sachverhalt` (`utpatti` → `ahara`).
3. Move each arrow to the right child.
4. The original: delete it if it carried no distinction, release it if it did and isn't held; a false thesis is refuted and kept.
5. Read `CHECKS:` in each factory response.

A call is communication, not nesting.

### 4. Re-linking after a distinction

"Config" became "Runtime Config" + "Build Config": every arrow to "Config" is ambiguous. Find them all (`verstak_look`), decide which each means, redirect with `verstak_arrow(action="reconnect")` — atomic, never half-done. Release or delete the emptied phenomenon; re-look the affected kriyas for `CHECKS:`.

### 5. Closing a lifecycle

- **a.** no end-of-life kriya (`leaked`) → add one **at the producer's level of abstraction**: config born in "Bootstrap" dies in "Teardown", not in "rm -rf". Taken by someone outside → a hand-off kriya.
- **b.** no producer (`relay-gap`) → add one; from outside → an observation kriya, its phenomenon in the external system's holon.
- **c.** wrong level → re-place the teardown.
- **d.** inherited closure: a `contains` parent closes the cycle → not a gap; don't patch children one by one.
- Or defer: a kriya in `anagata`+`upeksha` formally closes the cycle.

Re-trace; still broken → loop.

## Ways into weaving

- Design Phase 2 (`methods/design.md`); a trace gap → Op 1 or 5; a structural tension → the tree; intake exposed a distinction → Op 4.
- A work event (merge, rollout, decision, case close): the graph catches up in three named parts, each at least "none, because…". **Landed** — new transitions, phenomena, arrows. **Moved** — modes changed on evidence (a merge alone is none), questions ended. **Released** — bodies rewritten to the present, superseded nodes retired, stale arrows removed. Same move as the event, in the graph, not the case.

## Rhythm

- About 7 navigation calls per turn when not batching; re-orient every 5–10 nodes.
- After `reconnect`/`update`, `verstak_look` the node and read `CHECKS:`.
- After weaving into a node, re-read its **body**: still true? No detector catches false prose — costliest on contract nodes.
- Before calling it done: what else did this touch? `methods/integrity.md` runs the wave.
- Batch order: phenomena → kriyas → arrows.
- **Next moment:** the weave settled a question → end it by axis (`methods/inquiry.md`); the task is ending → `methods/reconcile.md`.
