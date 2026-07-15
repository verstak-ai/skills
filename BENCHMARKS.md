# Benchmark calibration

This document records the evidence that motivated the current skill changes. It is deliberately
not a product claim. The completed runs do **not yet demonstrate a Verstak advantage**; they show
where the first benchmark protocol and the shipped skill discipline failed, which corrections are
now encoded, and what an unseen transfer run must establish before such a claim is made.

## Claims under test

Verstak is an intelligence layer for agents, not merely long-term memory. The benchmark therefore
needs to test whether a graph-backed team preserves and applies decisions across roles and rounds:

1. accepted requirements and later corrections survive handoffs;
2. work is verified at the exact public boundary, not only represented coherently in the graph;
3. a blocker is scoped to the smallest affected claim instead of stopping reachable work;
4. a cold role can recover the decision delta without replaying the full history;
5. any quality gain is large enough to justify the added calls, tokens, and wall time.

Two tracks cover different parts of that claim. The Dask-derived Team-EVO task stresses cold
multi-role handoffs. Our EvoCodeBench Codex run stresses multi-round software evolution through a
series of fresh sessions over one persistent workspace. They are complementary, not
interchangeable.

## Cross-task calibration workflow

The objective is a general skill improvement, not a prompt that recognizes one benchmark. Equal
quality with more graph work is not enough: the final evidence must show higher task quality than
the strongest non-Verstak baseline on long-horizon work, with bounded overhead.

### 1. Split evidence before changing a skill

Every task is assigned once and never promoted after its grader or failure details have informed a
change:

| Split | What agents/maintainers may inspect | What the result may support |
|---|---|---|
| Calibration | Full trajectories, grader failures, graph, and cost | Failure discovery and skill design only |
| Validation | Trajectory and score only after a skill generation is frozen | Whether a proposed change transfers within a task family |
| Final holdout | Sealed until the candidate generation and analysis code are frozen | The product claim |
| Regression | Short/single-session tasks where NKS should add little | A no-harm guard against ritual and token overhead |

The completed Dask and four Terra EvoCode pairs are burned calibration cases. Re-running them can
confirm mechanics but cannot establish transfer.

### 2. Cover distinct task and session topologies

A portfolio generation contains at least these cells:

| Track | Session boundary | What persists | Capability isolated |
|---|---|---|---|
| Long single session | no reset | model context + workspace | regression/no-harm; NKS should not create ceremony |
| Same-role evolution | fresh session each round | workspace; optional external memory | recovery of corrections and prior decisions |
| Multi-role relay | fresh architect/implementer/verifier roles | workspace + explicit relay surface | ownership, decision handoff, independent verification |
| Cross-boundary integration | fresh roles and at least two artifact boundaries | only the surfaces granted to each role | blocker scoping, interface contracts, distributed ownership |
| Research/decision evolution | fresh research/synthesis/review roles | source corpus + relay surface | evidence provenance, contradiction handling, decision revision |

Coding alone is insufficient for a general intelligence-layer claim. At least one validation and
one final-holdout task must be non-coding, while retaining an executable or independently auditable
grader.

### 3. Compare against memory, not only amnesia

The core paired matrix is:

| Condition | Persistent workspace | Explicit durable memory | NKS reasoning graph + skills |
|---|---:|---:|---:|
| Native control | yes | no | no |
| File-memory baseline | yes | compact `DECISIONS.md`/relay contract | no |
| Full Verstak | yes | graph + decision-delta relay | yes |

The file-memory baseline is load-bearing: it tests whether Verstak adds intelligence beyond simply
giving a fresh session notes. Calibration-only component ablations may remove reality-audit,
decision-budget, verifier, or graph writes one at a time; final reporting compares intact systems,
not cherry-picked components.

### 4. Qualify the harness before spending model budget

Each task/condition must pass a machine-readable preflight:

1. pin task commit, model, reasoning settings, timeouts, skills, MCP endpoint, and run manifest;
2. assert the intended session topology from actual session IDs and invocation commands;
3. isolate workspace, agent home, realm, logs, secrets, caches, and sibling-run visibility;
4. run oracle and no-op controls when the benchmark supports them;
5. plant a leak sentinel and prove the agent cannot read current/future grader assets;
6. verify condition parity: same prompt/task state/tools except the declared treatment;
7. pre-register run IDs, primary metric, invalidation rules, and allowed repair/retry policy;
8. verify cost collection for uncached input, output, wall time, NKS calls/failures, and time to first
   artifact-facing action.

A failed preflight invalidates the run before its score is seen.

### 5. Run small generations, then transfer

1. **Harness generation:** no skill conclusions; eliminate leakage, wrong session topology, realm
   collisions, and missing cost data.
2. **Terra calibration smoke:** one task per portfolio cell, using calibration cases only. Inspect
   deeply and classify failures.
3. **Component ablation:** only where the smoke run supports a causal hypothesis. Change one
   behavioral contract at a time when feasible.
4. **Within-family validation:** freeze the skill generation and run unseen tasks. A miss returns to
   calibration; the validation task then becomes burned.
5. **Cross-model validation:** the same frozen generation on Sol, Terra, and Luna.
6. **Final holdout:** run once after code, prompts, manifests, and analysis are frozen.

Adaptive sampling saves cost without moving the goalposts: weak generations stop early on
calibration/validation, while no final-holdout cell is opened early.

### 6. Classify every problem by Verstak layer

Every reflection row records `symptom → falsifier → layer → evidence → scope → candidate fix →
transfer test → status` and chooses the smallest responsible layer:

| Layer | Typical problems |
|---|---|
| Benchmark/task | saturation, ambiguous contract, grader mirrors implementation, task too short |
| Harness/isolation | resumed-vs-fresh mismatch, leaked grader, shared caches/home/workspace, unfair tools |
| Host/orchestration | wrong role boundaries, correction timing, missing verifier invocation, bad concurrency |
| Skills/routing | skill not triggered, contradictory prose, over-modelling, weak acceptance or handoff contract |
| NKS service/schema | auth/realm identity, tool latency/failure, edge-matrix drift, retrieval quality |
| Graph/methodology | wrong ontology or projection, lost decision dependencies, graph theatre |
| Model capability | ignores a loaded contract, weak implementation/reasoning/tool use despite correct surfaces |
| Measurement/reporting | wrong denominator, hidden invalid run, cost omission, binary score masking near-misses |

Do not patch a skill to compensate for a harness leak, API bug, task ambiguity, or model capability
limit. Surface those at their own layer and keep their evidence alongside skill findings.

### 7. Admit only general skill changes

A skill change enters a generation only when at least one is true:

- the same failure mechanism appears in two task families;
- the shipped instruction contradicts a reproduced live tool/API contract;
- it repairs a general correctness/safety invariant with an independent falsifier.

Skill prose must not contain benchmark task names, hidden assertions, or fixture-specific repair
steps. Every accepted change states the expected behavior and an unseen transfer test. Mechanical
tool-surface fixes still receive a regression lifecycle in NKS.

### 8. Success and convergence gates

The final claim requires all of the following:

- positive paired primary-score uplift over both native control and file-memory baseline across the
  portfolio; equal score with lower cost is useful but does not prove better task performance;
- positive mean uplift on at least two of Sol/Terra/Luna and no material collapse on the third;
- correction survival and false-verification rates improve on the tracks designed to test them;
- no material regression on the single-session/no-harm track;
- median uncached-input and wall-time ratios are at most 1.5× the strongest baseline, unless the
  quality uplift is large enough to pre-register a different trade-off;
- NKS call failures stay below 1% and no run writes to the wrong realm;
- a paired uncertainty interval and per-task results are reported; averages never hide task-family
  regressions.

Calibration continues until all high-severity, reproducible problems have an owner at the correct
layer and two consecutive validation generations reveal no new high-severity general failure. The
PR leaves draft only after the sealed holdout meets the quality gate. “No more observed problems”
is a convergence criterion; “all possible problems are gone” is not a falsifiable claim.

## Completed evidence

### Team-EVO Dask replay

The task uses four cold roles over a Dask change cluster. The hidden grader has 43 assertions and
checks annotation propagation, PyArrow dispatch, Bag memory behavior, and traceback integration.
All rows below are valid sealed-grader runs; one earlier Terra attempt was discarded because a
sibling run leaked a correction into its workspace.

| Condition | Sol | Terra | Luna | Mean | Assertions | Uncached input | Wall time | NKS calls |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Control | 72.222 | 50.000 | 50.000 | 57.407 | — | — | — | 0 |
| Verstak, prior skills | 61.111 | 50.000 | 50.000 | 53.704 | 80/129 | 2,391,098 | 8,214 s | 220 (11 failed) |
| Verstak, calibrated prompt replay | 61.111 | 50.000 | 50.000 | 53.704 | 80/129 | 2,565,775 | 8,911 s | 210 (10 failed) |

The calibrated replay did not improve the score: it remains 3.703 percentage points below the
control mean. It did make the failure more legible. The agents could keep a coherent graph while
still missing the public `dask.get_annotations` surface, selecting the wrong canonical PyArrow
default, testing only the structure of Bag memory retention, and treating a missing downstream
checkout as a blocker for reachable local utility/config work.

This separates the failures sharply:

- graph coherence was mistaken for behavioral correctness;
- implementer-authored tests repeated the implementer's API hypothesis;
- verification began with broad suites instead of one exact probe per required claim;
- blocker scope was repository-sized rather than claim-sized;
- the experiment needed physical isolation, not only a logical run label.

### EvoCodeBench calibration sample

These Terra pairs use the earlier Verstak protocol, before the skill changes in this branch. Each
pair starts from the same task state. `Binary` is the official per-round success fraction; `case`
is the aggregate task score. Four pairs are descriptive calibration evidence, not a statistically
meaningful benchmark result.

Although EvoCodeBench describes the official multi-step format as a continuous agent session, the
Codex adapter path used in these runs did not resume a conversation. Every round invoked a fresh
`codex exec`, removed its `CODEX_HOME` afterward, and produced a unique session ID; only the `/app`
workspace persisted. Across the four completed pairs, every control and Verstak condition had one
unique session ID and one `codex exec` per round, with no resume invocation. The Verstak condition
additionally persisted the NKS realm. These results therefore test **same-role multi-session
recovery**, not one long model context.

| EvoCodeBench task | Rounds | Control binary | Verstak binary | Control case | Verstak case | Control wall | Verstak wall | Control input | Verstak input |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Brownfield modification | 8 | 1.000 | 0.875 | 100.000 | 99.167 | 2,823 s | 3,713 s | 6,851,670 | 17,743,463 |
| MLOps migration/upgrade | 13 | 0.769 | 0.538 | 99.442 | 98.589 | 3,134 s | 4,558 s | 6,476,711 | 23,181,632 |
| MLOps forensics | 9 | 1.000 | 1.000 | 100.000 | 100.000 | 1,858 s | 3,106 s | 3,770,037 | 15,639,566 |
| Greenfield implementation | 9 | 1.000 | 1.000 | 100.000 | 100.000 | 1,376 s | 2,321 s | 3,147,384 | 13,353,417 |

This is precisely a setting where Verstak should have leverage: a new context must recover prior
requirements and corrections while the workspace alone exposes only their implementation residue.
The old protocol did not realize that leverage. It over-modelled the assignment before acting and
reconstructed requirements instead of preserving only the cross-session decision delta. Even when
both conditions were perfect, Verstak consumed roughly 3–4 times the input and more wall time. This
is direct evidence of a skill/protocol failure and the reason for a cold-role decision budget, a
small empty-realm bootstrap, and decision-delta relays rather than duplicated work logs.

## Process reflection

### What was methodologically weak

1. **The claim was too broad.** “NKS helps agents” bundled memory, coordination, verification, and
   task quality. Each run now needs a pre-registered claim and observable.
2. **Control parity was insufficient.** Logical run separation did not prevent sibling correction
   leakage. Runs need separate workspaces, separate agent homes/state, and a sealed grader.
3. **Validity rules arrived too late.** Run IDs, primary metrics, invalidation conditions, and the
   allowed correction channel must be frozen before execution. Invalid rows remain visible but are
   excluded from comparison.
4. **The grader was too easy to mirror incorrectly.** A passing same-author test can encode the same
   wrong export or representation. Exact public-boundary probes must precede broad suites.
5. **Two kinds of session boundary were conflated.** Team-EVO tests recovery across isolated roles;
   our EvoCodeBench Codex path tests a fresh session of the same role on every round. Neither run
   carries a long model context, and results must be reported by track.
6. **Single pairs were treated as directional evidence.** They are useful for finding failure modes,
   but not for estimating a stable effect. Claims need multiple unseen tasks and paired seeds.
7. **Cost was secondary.** A small quality gain can be erased by excessive graph interaction. Report
   task score together with uncached input, wall time, NKS calls, and failed calls.

### What changed in the skills

| Observed failure | Skill correction | Expected behavioral effect | Still to validate |
|---|---|---|---|
| Coherent graph accepted as correct implementation | `integrity` reality-audit; `writing` separates graph checks from behavioral evidence; `on-duty` requires claim verdicts before closure | Claims are frozen independently and tested at observable public boundaries | Unseen tasks produce fewer false-positive closures |
| Worker and tests shared the same wrong API hypothesis | `integrity` and verifier role require a falsifier and independent evidence; one narrow probe per claim | Wrong exports, defaults, and representation shapes fail early | Cold verifier catches injected boundary traps |
| A missing downstream checkout blocked all work | Smallest-claim blocker rule in `integrity` and delegation doctrine | Reachable provider/API/config work continues while integration remains honestly blocked | Mixed reachable/unreachable task completes the reachable half |
| Agents replayed the graph instead of acting | `entry` limits pre-action NKS work to five calls and an empty-realm bootstrap to one batch / eight nodes | Lower overhead and faster first repository action | Current skills reduce input/NKS calls without losing handoff fidelity |
| Realm short aliases drifted across agent contexts | `entry` and the bootstrap template require canonical owner/slug or UUID and header verification | Cold roles orient to the same graph before writing | Multi-agent run has no wrong/empty-realm writes |
| Relays copied work logs and caused rereading | `entry` and `on-duty` require a decision delta: changed claim/verdict, evidence pointer, next possibility | Later roles recover what changed without replaying all prose | Handoff questions are answered with fewer calls/tokens |
| Verification role was implicit and often skipped | `verstakify` always projects a cold `verifier` role with a falsification-first contract | Acceptance judgment is separated from implementation momentum | Generated agent surfaces work across supported hosts |
| Inquiry closure described `addressed_by` as targeting any resolving node | `inquiry` now follows the live matrix: only kriya/karta/vimarsha; a phenomenon answer crystallizes via `arose_from` | Agents close insight-bearing questions without invalid edges or silent fallback | A fresh crystallization lifecycle closes cleanly |

No new skill was added. The failures cross-cut the existing lifecycle: orientation, design,
writing, verification, duty, and repo bootstrap. A separate benchmark skill would teach the agent
to win this harness; these changes instead strengthen the general contracts at the points where
the benchmark exposed them.

## Next evidence gate

This branch should remain a draft until a run using the **current source skills** completes on
previously unseen tasks. At minimum:

- one cold multi-role case with an owner correction and an exact public-boundary trap;
- one persistent-workspace, fresh-session-per-round EvoCodeBench case, with no
  benchmark-specific hints;
- paired control/Verstak isolation, fixed model and task state, sealed grading, and pre-registered
  invalidation rules;
- task quality reported with cost and time;
- a positive result means better quality, or equal quality with a material coordination/cost gain.

Anything weaker is calibration evidence, not proof that Verstak works.
