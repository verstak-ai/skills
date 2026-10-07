# reality-audit — witnessing: spend the tail on what ships

**Use when:** you are about to say `verified`, `done`, `green`, "works" or "no work left" after the last material change to behaviour — out of failure 5 (the door, `The method fails in five ways`); again after an owner correction or a reproduced falsifier invalidates evidence; whenever a test or tool returned a non-zero exit code or mixed pass/fail output to summarise. Triggers: "reality audit", "reality check", "check the canonical artifact", "prove it works", "tests passed". Not at a task's start; never interrupt implementation with graph modelling for it.

This terminal protocol decides whether the behaviour that ships was exercised — not a scratch build, a test bypassing the public boundary, or plausible output.

**"Checked" always names its level.** First: against the graph (`verstak_look`, `verstak_orient`, `lens="trace"`) — words against the record; the graph observes the world, it isn't the world. Second: a fresh observation on the canonical carrier — only this closes a behavioural claim. Every verdict here is second-level; any "verified" says what it was verified against.

**A witness, not the author**: the maker sees the reflection of their own intent, so name the falsifier *before* looking and observe afresh — a fresh agent or black-box run.

**Proportionality.** A change that alters no public contract (no new or changed exported symbol, output format, config or schema shape, documented behaviour) shrinks the ladder to steps 1–2 on the touched path: rebuild the canonical deliverable, exercise the changed path once with an asserted expectation, record the command and exit code in one line. Unsure whether the contract changed? It did.

## 1. Freeze only the load-bearing claims

Read the accepted source, not the implementer's summary. Precedence: the owner's latest correction › the accepted requirement or spec › the target version's public API, schema and canonical tests › the implementer's account (evidence of execution, never the contract).

Record only claims whose failure changes acceptance. Exact output, ordering, errors, serialisation, a command example are executable claims even in prose; reproduce each normative example exactly, not a simpler stand-in.

## 2. Name the carrier and the falsifier before running anything

**Take the carrier from the repository**: `AGENTS.md` → `Reality` gives the canonical carrier per class of claim, how to observe it, who can. The owner names it — the built deliverable, not the source; the live endpoint, not the handler; a clean install, not a cache. No table, or a class it misses → ask the owner, offer `methods/align.md`, record the answer.

One row per claim: **Claim** · **Canonical carrier** (the exact binary, package, symbol, route, UI, schema, artifact or deployed path users consume) · **Observable** (what an outsider sees) · **Executable falsifier** (what would prove it false).

Boundary words are equivalence classes: for `empty`, `none`, `missing`, `malformed`, `default`, probe each distinct representation the public parser can receive that the wording treats as equal (zero bytes vs empty record, empty array vs missing field, omitted flag vs explicit default). For a min, max, threshold, window, counter or version gate: the boundary plus the nearest differently-behaving value each side; a default supplying the boundary is tested omitted and explicit. A guard inherited from a stricter neighbouring path must not reject input the new contract accepts.

A scratch build, local script, mock-only call or boundary-bypassing test is `provisional` unless it *is* the public deliverable. A fresh black-box test that rebuilds and runs the canonical carrier with the exact falsifier witnesses; a same-author mock or internal test doesn't. Several artifacts could have run → prove which: path plus freshness (`mtime`, digest, version, build marker). Printed output is an observation until an assertion checked the value and exit code.

**A sign is not a carrier**: a log line, status field or new file proves behaviour only if tested on an input that distinguishes the outcomes.

## 3. Run the terminal evidence ladder

After the last material change:

1. **Build, package or deploy the canonical deliverable** — before any scratch copy.
2. **Exercise exactly the changed path at its public boundary**, asserting the observable and the failure behaviour.
3. **Re-run the exact earlier falsifier.** A refuted claim stays refuted until the same or a strictly stronger case passes against the fresh deliverable.
4. **Re-run the old requirements the change touches** — acceptance cases for the changed shared code first; the broad suite only after the new path ran.

A material change after step 1 invalidates the tail: rebuild, repeat the affected probes. Cleanup, graph work and narration don't eat the probing budget.

**The graph comes after the evidence and never enters it.** Verdicts frozen and changes finished first; then at most one terminal update, only when a durable correction or contradiction will change a later agent's decision (a later material patch makes it premature until re-run and re-attested). Reading the graph is fine in its place; here you read the world. The limit covers this audit's hand-off, not the round's modelling.

**The exit code is the verdict** (this rule's home). Combined evidence fails closed from its first command (`set -euo pipefail` or equivalent); an expected failure code is caught and asserted locally, then fail-closed restored. While the evidence command exits non-zero the claim is not verified: green subtests, `passed` lines, a later unrelated zero don't override the code read from the tool result; only a re-run of the same or stronger case on the fresh deliverable clears it. A wrapper running every subgroup exits non-zero if any required one fails. Before the narrative, reconcile every `passed`/`green` with the recorded codes.

## 4. One truthful verdict per claim

- `verified` — the fresh canonical carrier produced the required observable, and the executable falsifier ran successfully;
- `provisional` — evidence is scratch-only, mock or internal, print-only, stale, or misses the exact public boundary;
- `contradicted` — a reproduced counterexample still fails;
- `blocked` — the evidence surface is unreachable; quote the blocker literally and name only the claim it blocks.

This is the verdict set for any method or role judging a claim. Report a claims × verdicts table with the canonical path and the command or test evidence — real telemetry only, never estimated tokens, cost, duration or coverage. A green subset omitting the failing case is no observation, not a fix. Structural health never raises a behavioural verdict.

**Where verdicts go.** The table as a message in the case; in the graph as modes — rising confidence and `anagata → vartamana` only for `verified`, its text stating only the observation's ceiling (what was observed, where the carrier's reach ends). A `provisional` or `blocked` claim that will wait may be a ledger line (→ door, `Ledger`).

**What each level earns:** reading code → `anumita`; a focused internal or mock test → at most `pratyakshita`; `pramanita` for a behavioural claim → the second level on the canonical carrier with the falsifier executed.

**Kind ceilings.** Classes under *Ceiling* in the repository's `Reality` table never come back `verified`: their top is `provisional`, their honest epistemic mode `anumita` or converging independent testimony.

Required work closes only when every required claim is `verified` or the owner deliberately accepted a named exception. `provisional`, `contradicted` and `blocked` are hand-off states, not synonyms for done.

Next moment: every claim has its verdict → the task is ending: `methods/reconcile.md`.
