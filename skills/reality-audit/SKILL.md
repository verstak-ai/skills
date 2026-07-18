---
name: reality-audit
description: "Use after the final material change of a behavior-changing implementation, before reporting verified/done/green, after requirement corrections or prior falsifier failures, and whenever a test/tool command returned nonzero or mixed pass/fail output must be summarized. Triggers: 'reality audit', 'acceptance check', 'prove it works', 'verify the canonical artifact', 'tests passed', 'проверка реальностью', 'проверь канонический артефакт', 'точно работает'. Verify the exact public deliverable with executable falsifiers; scratch artifacts and print-only observations are provisional."
---

# Reality Audit — spend the tail on the thing that ships

Implementation evidence is easy to collect from the wrong surface: a scratch build, a one-off
interpreter run, a test that bypasses the public boundary, plausible printed output. This terminal
protocol decides whether the behavior that ships has actually been exercised.

Load it **after the final material implementation change**, before saying `verified`, `done`,
`green`, or `no work remains` — and again after an owner correction or a reproduced falsifier
invalidates earlier evidence. Not at task entry, and never interrupt implementation with graph
modelling to prepare for it.

**Proportionality.** When the change alters no public contract — no new or changed exported
symbol, output format, config/schema shape, or documented behavior — the ladder collapses to
steps 1–2 on the touched path: rebuild the canonical deliverable, exercise the changed path once
with an asserted expectation, record command and exit status in one line. The full claims table is
priced for behavior-changing work, not typo-class fixes. In doubt whether a contract changed? It
did.

## 1. Freeze only the load-bearing claims

Read the accepted source, not the implementor's completion summary. Contract precedence:

1. latest owner correction;
2. accepted requirement or specification;
3. established public API, schema, and canonical tests in the target version;
4. implementor relay — evidence about fulfillment, never the contract.

Record only claims whose failure changes acceptance. Exact output, ordering, error, serialization,
or command examples are executable claims even when written as prose. Reproduce each normative
example exactly; a simpler representative case does not discharge it.

## 2. Name the surface and the falsifier before running them

For each claim, one compact row:

| Field | Required answer |
|---|---|
| Claim | What exactly must hold? |
| Canonical surface | Which exact binary, package, exported symbol, API route, UI, schema, generated artifact, or deployed path will users consume? |
| Observable | What should an external observer see? |
| Executable falsifier | Which command, request, assertion, or test would prove the claim false? |

Boundary words are equivalence classes, not one convenient fixture. For `empty`, `none`,
`missing`, `malformed`, `default` — enumerate the distinct representations the public parser can
receive (zero bytes vs a blank record, an empty array vs a missing field, an omitted flag vs its
explicit default) and probe every representation the accepted wording equates. For a minimum,
maximum, threshold, window, count, or version gate — the accepted boundary plus the nearest value
on each side with different behavior; a default that supplies the boundary is tested both omitted
and explicit. A parser, validator, or helper reused from a stricter sibling path gets its
preconditions checked independently: an inherited guard must not reject input the new public
contract accepts.

Name the canonical path before the probe. A scratch build, local script, mock-only call, or test
that bypasses the public boundary is provisional unless it *is* the exact public deliverable.
Authorship does not decide: a fresh black-box test verifies when it rebuilds and executes the
canonical surface with the exact falsifier; a same-author mock or internal-only test does not.
When several artifacts could be invoked, prove which one runs — path plus freshness (`mtime`,
digest, version, or build marker). Printed output is observation, not a pass, until an executable
assertion checks the expected value and exit status.

## 3. Run the terminal evidence ladder

After the final material change, in this order:

1. **Build/package/deploy the canonical deliverable** — before testing any scratch copy.
2. **Exercise the newly changed path at its public boundary.** Assert the expected observable and
   failure behavior; do not merely inspect plausible output.
3. **Re-run the exact prior falsifier.** A contradicted claim stays contradicted until the same
   case, or a strictly stronger one, passes against the fresh deliverable.
4. **Re-run exposed old requirements in code.** Acceptance cases touching changed shared code
   first; a broad suite only after the exact new path has run.

Any material artifact change after step 1 invalidates the tail: rebuild and repeat the affected
probes. Never let cleanup, graph work, or narration consume the budget of the new-path probe.

NKS comes after the evidence and is never part of it. Freeze the claim verdicts and finish all
material artifact changes first; then at most one terminal update, and only when a durable
correction or contradiction will change a later agent's decision. A later material patch makes
that update premature — its behavioral confidence is provisional until the affected public
evidence is rerun and the node reverified. The graph is not mid-audit scratch, and graph state is
never an input to a verdict. The one-update limit scopes this audit's own evidence handoff; the
structural modelling `writing` or the repo's push ritual requires belongs to the round, not to
the audit.

**Exit status is the verdict** (the canonical statement — `writing` points here). Combined
terminal evidence fails closed from its first command (`set -euo pipefail` or the platform
equivalent); an expected failure code is captured and asserted locally, then fail-closed execution
is restored. A claim is not verified while its evidence command exits nonzero: green subtests,
`passed` lines in stdout, or a later unrelated zero do not override the recorded exit code — read
it from the tool result, never infer it from selected output; only a rerun of the same case (or a
strictly stronger one) against the fresh deliverable clears it. A wrapper that deliberately runs
every subgroup accumulates failures and exits nonzero when any required subgroup fails. Before the
final narration, reconcile every `passed`/`green` claim with the recorded exit statuses and the
failing subgroup summary.

## 4. Give one truthful verdict per claim

- **verified** — the fresh canonical surface produced the required observable and the executable
  falsifier was attempted successfully;
- **provisional** — evidence exists but is scratch-only, mock/internal-only, print-only, stale,
  or misses the exact public boundary;
- **contradicted** — a reproduced counterexample still fails;
- **blocked** — the evidence surface is unavailable; quote the literal blocker and name only the
  claim it prevents checking.

Report a compact claims × verdicts table with the canonical path and command/test evidence —
actual telemetry only, never estimated tokens, cost, duration, or coverage. A green carry-over
subset that omits the failing case is absence of observation, not repair. Structural graph health
is a separate fact and never upgrades a behavioral verdict.

Required work closes only when every required claim is verified or the owner consciously accepts a
named exception. Provisional, contradicted, and blocked are handoff states, not synonyms for done.
