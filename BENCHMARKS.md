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
| Concurrent multi-role team | at least three roles overlap in wall time | disjoint artifact namespaces + shared coordination surface | concurrent discovery, conflict detection, correction propagation, graph write contention |
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

For the concurrent-team track, the strongest non-NKS baseline also receives an equivalent
message-passing/file channel and the same role topology. Parallel writers own disjoint artifact
namespaces; deliberate shared-interface conflicts are resolved through the declared coordination
surface rather than by racing edits in one file.

### 4. Qualify the harness before spending model budget

Each task/condition must pass a machine-readable preflight:

1. pin task commit, model, reasoning settings, timeouts, skills content hash, harness commit plus
   local patch hash, MCP endpoint, and run manifest;
2. assert the intended session topology from actual session IDs and invocation commands;
3. isolate workspace, agent home, realm, logs, secrets, caches, and sibling-run visibility;
4. run oracle and no-op controls when the benchmark supports them;
5. plant a leak sentinel and prove the agent cannot read current/future grader assets;
6. verify condition parity: same prompt/task state/tools except the declared treatment;
7. pre-register run IDs, primary metric, invalidation rules, and allowed repair/retry policy;
8. verify cost collection for uncached input, output, wall time, NKS calls/failures, and time to first
   artifact-facing action; attribute reality-audit and cold-verifier calls/tokens/wall separately.
9. score failures by requirement origin: new-requirement correctness, regression of a requirement
   that previously passed, and persistence/cascade of an already-failing requirement are distinct.

A failed preflight invalidates the run before its score is seen.

#### Qualification of the evidence already collected

The old rows remain useful for calibration, but they do not meet the frozen-generation gate:

| Evidence | Session topology | Isolation | Skill pin | Baseline identity | Qualification |
|---|---|---|---|---|---|
| Team-EVO Dask | Pass: four independent `codex exec --ephemeral` roles | Fail: one shared home per condition; unrestricted host filesystem made sibling runs and harness artifacts physically reachable | Fail: a snapshot existed, but several trajectories read the mutable source checkout directly | File-memory baseline: both conditions used `.team/relay.md` | Calibration only |
| EvoCodeBench Terra pairs | Pass: a fresh `codex exec` and deleted `CODEX_HOME` on every round; persistent `/app` only | Partial: condition workspaces/containers were distinct and Harbor cleared grader surfaces, but one credential could enumerate other benchmark realms | Partial: one old worktree path was stable during the run, but its commit was not recorded in the result manifest | Native control; no explicit durable notes | Calibration only |

The Dask replay also reused its earlier baseline rows instead of producing a new paired baseline in
the same generation. Future runs must create one immutable skill checkout and one isolated agent
home per `(task, condition, model, seed, role/round)`. A realm name is not an access-control
boundary: the credential must be scoped so a treatment agent cannot enumerate or read realms from
another condition. Until the service supports that boundary, realm isolation is audited but not
security-enforced and the limitation stays visible in the report.

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

#### Portfolio candidates and intended use

The portfolio is selected by topology and grader quality, not by where Verstak happened to score
well. Candidate tasks are assigned to a split before their trajectories or verifier details are
opened.

| Benchmark | Portfolio role | Why it is useful | Limitation to control |
|---|---|---|---|
| [EvoCodeBench](https://github.com/EvoCodeBench/EvoCodeBench) | Same-role, fresh-session evolution | Corrections arrive over many rounds while only the workspace and the declared memory surface persist | Our Codex adapter behavior must be asserted from actual session IDs; add the missing file-memory baseline |
| [TeamBench](https://github.com/ybkim95/TeamBench) | Multi-role relay and cross-boundary integration | Planner, Executor, and Verifier run in separate containers with disjoint mounts; tasks have deterministic graders and official role ablations | Add a Verstak adapter without weakening the OS boundaries; exclude tasks under re-curation |
| [MultiAgentBench / MARBLE](https://github.com/ulab-uiuc/MARBLE) | Concurrent multi-role candidate | Open framework evaluates collaborative/competitive agents under star, chain, tree, and graph communication topologies with milestone metrics | Prove roles actually overlap in wall time plus qualify determinism/isolation; otherwise it covers message topology, not the concurrent cell |
| [Long-Horizon Terminal-Bench](https://github.com/zli12321/LHTB) | Long single-session no-harm and sustained-loop stress | 46 containerized tasks across nine categories, 90-minute budgets, hidden replay-based verifiers, and continuous partial credit | It primarily measures one sustained terminal loop, so it cannot prove cross-session or multi-agent leverage by itself |
| [DeepResearch Bench](https://github.com/Ayanami0730/deep_research_bench) | Non-coding research/decision evolution | 100 expert-authored tasks across 22 fields with citation support and report-quality metrics | RACE/FACT use model judges and live web evidence; evaluator version, corpus snapshot, and judge variance must be frozen, or use only deterministic citation/fact submetrics |
| Team-EVO Dask | Burned multi-role calibration/regression | Known correction, boundary, ownership, and blocker-scope failures make it a useful unit-level regression | Custom harness, known grader failures, and prior leakage mean it can never become validation evidence |

The first validation generation should use one unseen EvoCode task, a small stratified TeamBench
subset, one LHTB task, and a qualified concurrent-team case (MARBLE or a deterministic custom
fixture with disjoint ownership). DeepResearch enters only after its evaluator can be frozen and
its multi-session research/synthesis/review wrapper passes the same isolation preflight. This order
tests same-role memory, sequential role separation, concurrent coordination, and single-session
no-harm before expanding to a less deterministic research grader.

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
- old-requirement regressions and new-requirement failures are reported separately; an
  anti-regression win cannot conceal a larger loss on current-round correctness;
- the concurrent-team track beats an equivalent message/file coordination baseline on task quality
  or conflict/correction recovery, not merely on graph activity;
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
All rows below passed the original sealed-grader validity rules; one earlier Terra attempt was
discarded because a sibling run leaked a correction into its workspace. The later harness audit
reclassifies even the retained rows as calibration-only because the homes, skill source, and host
filesystem were not physically isolated.

| Condition | Sol | Terra | Luna | Mean | Assertions | Uncached input | Wall time | NKS calls |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| File-relay baseline | 72.222 | 50.000 | 50.000 | 57.407 | — | — | — | 0 |
| Verstak, prior skills | 61.111 | 50.000 | 50.000 | 53.704 | 80/129 | 2,391,098 | 8,214 s | 220 (11 failed) |
| Verstak, calibrated prompt replay | 61.111 | 50.000 | 50.000 | 53.704 | 80/129 | 2,565,775 | 8,911 s | 210 (10 failed) |

In this one burned task, the calibrated replay did not improve the score: it remains 3.703
percentage points below the file-relay mean. The entire difference comes from Sol (−11.111 points);
Terra and Luna tie at 50.000 in both conditions, so this is per-track `n=1` calibration with a
possible grader floor, not an estimated general effect. It did make the failure more legible. The
agents could keep a coherent graph while
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

#### Reconstructed provenance and limits

These four `n=1` pairs were operated by a second agent for the same owner on 2026-07-15. The
operator reports Harbor 0.18.0 with the verifier-leak fix from still-open
[harbor#1961](https://github.com/harbor-framework/harbor/pull/1961), a local package source that
clears `/tests` and `/logs/verifier` before every shared-mode agent phase, Codex with
`gpt-5.6-terra` under subscription auth, and an ON condition containing `entry`, `writing`,
`design`, `inquiry`, `integrity`, NKS MCP over PAT, and an injected duty AGENTS protocol. The old
skill worktree currently resolves to `69a6304ea44984e934d627de89ba5252706baa78`.

This is reconstructed provenance, not a frozen run manifest. The historical result did not record
the EvoCode repository commit, skill content hash, exact AGENTS bytes, reasoning effort, harness
patch hash, or retry policy. The currently inspected EvoCode checkout is
`f8fcfaa1c9ad1c5b0bbc433323b587e4ddea2f32`, but that must not be retroactively assigned to the
runs. Therefore the rows remain calibration-only even though session topology and the local
verifier sanitization were independently inspected.

| EvoCodeBench task | Rounds | Control binary | Verstak binary | Control case | Verstak case | Control wall | Verstak wall | Control input | Verstak input |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Brownfield modification | 8 | 1.000 | 0.875 | 100.000 | 99.167 | 2,823 s | 3,713 s | 6,851,670 | 17,743,463 |
| MLOps migration/upgrade | 13 | 0.769 | 0.538 | 99.442 | 98.589 | 3,134 s | 4,558 s | 6,476,711 | 23,181,632 |
| MLOps forensics | 9 | 1.000 | 1.000 | 100.000 | 100.000 | 1,858 s | 3,106 s | 3,770,037 | 15,639,566 |
| Greenfield implementation | 9 | 1.000 | 1.000 | 100.000 | 100.000 | 1,376 s | 2,321 s | 3,147,384 | 13,353,417 |

This is precisely a setting where Verstak should have leverage: a new context must recover prior
requirements and corrections while the workspace alone exposes only their implementation residue.
Final line-by-line forensics partly rehabilitates the mechanism: on the 13-round migration task the
graph-backed run preserved every requirement that had previously passed, while control regressed a
round-1 output contract after the unrelated round-12 `compare` change. The treatment still lost
overall because it failed more current-round semantics and spent roughly 3–4 times the input.

The cumulative verifier exposes requirement origin. Counting failed cases at their origin round as
**new**, and failures of an origin that had previously passed as **regressions**, gives:

| Migration condition | New-requirement failed-case observations | Old-requirement regression observations | Distinct previously-passing origins regressed |
|---|---:|---:|---:|
| Native control | 3 | 2 | 1 |
| Earlier Verstak | 13 | 0 | 0 |

The two control regression observations are the same round-1 `stats` contract failing in rounds 12
and 13, so the distinct regression count is one. The Verstak failures are concentrated in new
semantics; the round-11 defect also influenced the next feature, a cascade that a pure origin count
does not express. Thus the measured mechanism is **regression safety bought at a price larger than
its correctness benefit**. The target is to retain that zero-regression property while removing
graph ceremony and returning the final budget to the changed path, not to remove persistence.

#### Independent trajectory forensics

A second-agent line-by-line review reports the following mechanism. These observations are accepted
as calibration input, but percentages and round anatomy remain attributed until the analysis code
and trajectory paths are attached to a reproducible manifest:

- 63–75% of tool calls in inspected ON rounds were graph operations, while graph payload text was
  under 0.5% of billed input; discrete model/tool round trips, not stored prose size, dominated cost;
- graph writes preceded repository reading and mostly transcribed task bullets; no inspected
  engineering decision was directly attributed to a retrieval, although the zero-regression
  result is behavioral evidence that the persisted requirement model affected the run;
  decision-level causality remains uninstrumented rather than disproven;
- repeated read-modify-write closure churn edited the same node three or four times;
- after one late implementation fix, the agent spent 19 graph calls and did not exercise the new
  path, then reported realm-backed verification despite the surviving behavioral defect;
- a shared-failure round cannot explain the ON/OFF delta and must be reported as a paired tie rather
  than charged to either condition.

The old `entry` already said to cap NKS at roughly five calls per response, yet these trajectories
ignored it. The stronger decision budget in this branch is therefore a **skill guardrail under
test**, not enforcement. Transfer must measure actual calls; hard budgets, compact responses, and
bulk lifecycle operations belong on lower layers.

### Tool-surface and orchestration work items

Skill prose cannot close these findings by itself:

| Work item | Layer | Acceptance contract |
|---|---|---|
| Per-phase NKS call counter with soft warning and harness-configurable hard budget | Host/orchestration + MCP telemetry | Agent and result manifest see calls remaining; exceeding the registered hard budget fails or disables graph writes without stopping artifact work |
| Compact/delta `orient` without repeated ontology boilerplate | NKS MCP rendering | Repeated orient on an unchanged focus returns identity + changed decisions/tensions, with materially fewer input tokens |
| Atomic lifecycle close / bulk update | NKS API + MCP | One operation can apply a predeclared set of mode/edge changes with one version fence and one response |
| Canonical realm resolution consistency | NKS service/schema | `owner/slug` and UUID always resolve to the same populated realm; short aliases cannot silently create or address a pseudo-empty realm |
| Realm-scoped benchmark credential | NKS auth/ACL | A run credential cannot list, read, or write any realm outside its registered set |
| Decision-use telemetry | Measurement | A write records its intended future reader/decision; later retrieval can be linked to an observed changed action instead of counting nodes as value |

Until these exist, the benchmark reports both `skill-compliant` and `actually enforced/observed` as
separate fields. A prose instruction is never credited as a realized optimization.

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
8. **The treatment generation was not immutable.** Some Dask roles read `skills/*/SKILL.md` from the
   live repository rather than the prepared snapshot. A benchmark generation is one content hash,
   not whatever source exists when a role starts.
9. **A dedicated realm was mistaken for a security boundary.** The shared credential could list
   neighboring benchmark realms. Correct realm discipline reduces accidental writes but does not
   prevent deliberate or mistaken cross-condition reads.
10. **The baseline was mislabeled.** Dask control already had a structured relay file. It tests NKS
    against file memory, not against an amnesic agent, and is renamed accordingly.

### Layered reflection ledger

| Symptom | Layer | Current disposition | Transfer falsifier |
|---|---|---|---|
| Sibling correction entered a run | Harness/isolation | Invalidated that row; require physical workspace and home isolation | Leak sentinel and forbidden-path probe fail closed before scoring |
| Roles could read mutable skill source | Harness/isolation + measurement | Freeze skill commit/archive in the manifest and mount it read-only | Every observed skill read hashes to the registered generation |
| One credential could enumerate all benchmark realms | NKS service/auth | Treat realm isolation as non-enforced; request credential/ACL scoping | A treatment credential cannot list or read another condition's realm |
| Short realm aliases sometimes resolved to a new empty realm | NKS service/schema | Skills require owner/slug or UUID plus header verification; service defect remains open | Cold role using the declared canonical ID always sees the seeded sentinel |
| Graph closure passed while public behavior was wrong | Skills + methodology boundary | Added reality-audit and independent falsification contracts | Verifier rejects a coherent graph with an injected public-boundary defect |
| Graph activity cost 3–4× input on perfect tasks | Skills/routing + orchestration | Added decision budget, empty-realm cap, and decision-delta relay | First artifact action is earlier and median overhead stays within the gate |
| Graph prevented old regressions but lost new semantics | Skills/routing + measurement | Preserve load-bearing cross-round state; spend the tail on the new path; report old/new failures separately | Treatment keeps regression advantage while new-requirement correctness reaches baseline parity or better |
| Existing prose call cap was ignored | Host/orchestration + NKS MCP + skills | Keep a novelty/circuit-breaker guardrail, but open enforcement and compact-response work items | Observed per-phase calls obey a registered counter; no claim relies on prompt compliance alone |
| Missing downstream checkout blocked reachable work | Skills/integrity | Added smallest-claim blocker scope | Agent completes the reachable half while leaving only the exact integration claim blocked |
| Single-session and multi-session evidence were conflated | Benchmark/reporting | Report every track by actual invocation/session topology | Manifest/session audit and prose classification agree for every row |
| Strong models saturated some EvoCode cases | Benchmark/task | Keep as no-harm regression; select harder unseen partial-credit tasks for validation | Control score has headroom and paired task deltas do not collapse to all ties |

### What changed in the skills

| Observed failure | Skill correction | Expected behavioral effect | Still to validate |
|---|---|---|---|
| Coherent graph accepted as correct implementation | `integrity` reality-audit; `writing` separates graph checks from behavioral evidence; `on-duty` requires claim verdicts before closure | Claims are frozen independently and tested at observable public boundaries | Unseen tasks produce fewer false-positive closures |
| Worker and tests shared the same wrong API hypothesis | `integrity` and verifier role require a falsifier and independent evidence; one narrow probe per claim | Wrong exports, defaults, and representation shapes fail early | Cold verifier catches injected boundary traps |
| A missing downstream checkout blocked all work | Smallest-claim blocker rule in `integrity` and delegation doctrine | Reachable provider/API/config work continues while integration remains honestly blocked | Mixed reachable/unreachable task completes the reachable half |
| Agents replayed the graph instead of acting | `entry` limits pre-action NKS work to five calls and an empty-realm bootstrap to one batch / eight nodes | Lower overhead and faster first repository action | Current skills reduce input/NKS calls without losing handoff fidelity |
| NKS work outnumbered edits and probes | `entry` stops graph work when calls reach the artifact edit+test count; freshly self-seeded realms are not re-read | Graph remains subordinate to implementation and verification | Per-round NKS calls stay below artifact-changing plus test/probe actions |
| Task bullets became graph busywork | `writing` requires an identified future reader, changed decision, and novel durable delta before any write | Instruction transcription disappears; graph state exists only where later retrieval can change action | Unseen trajectory shows at least one graph-derived decision and no requirement-copy nodes |
| Late graph closure displaced the final test | `integrity` protects the post-change tail for a fresh narrow boundary probe before graph cleanup | A last material fix is exercised before closure; otherwise verdict stays provisional | Injected late correction is tested and survives the next round |
| Terminal lifecycle churn updated one node repeatedly | `inquiry` sends the terminal triputi in one update and forbids end-of-round field sweeps | Closure costs at most one terminal node update after code evidence | No `vartamana→atita` update walk and no graph action displaces the final probe |
| NKS errors caused recreate/retry churn | `entry` handles 409/400/422 and stops graph writes after repeated failures without stopping artifact work | No duplicate realm/model and bounded failed-call cost | Fault-injected tool run recovers or degrades to an explicit provisional handoff |
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
- one truly concurrent team case with at least three overlapping roles, disjoint artifact
  ownership, one shared coordination surface, and an equivalent file/message baseline;
- paired control/Verstak isolation, fixed model and task state, sealed grading, and pre-registered
  invalidation rules;
- task quality reported with cost and time, including separate reality-audit and cold-verifier
  tokens/calls/wall;
- a positive result means better quality, or equal quality with a material coordination/cost gain.

Anything weaker is calibration evidence, not proof that Verstak works.
