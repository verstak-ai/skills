---
name: reality-audit
description: "Use after the final material change of a behavior-changing implementation, before reporting verified/done/green, and after requirement corrections or prior falsifier failures. Triggers: 'reality audit', 'acceptance check', 'prove it works', 'verify the canonical artifact', 'проверка реальностью', 'проверь канонический артефакт', 'точно работает'. Verify the exact public deliverable with executable falsifiers; scratch artifacts and print-only observations are provisional. No NKS access required."
---

# Reality Audit — spend the tail on the thing that ships

Implementation evidence is easy to collect from the wrong surface: a scratch binary, `go run`, a
same-author unit test, or plausible printed output. This skill is the short terminal protocol that
decides whether the behavior that will actually ship has been exercised.

Load it **after the final material implementation change**, before saying `verified`, `done`,
`green`, or `no work remains`. Also load it after an owner correction or a reproduced falsifier has
invalidated earlier evidence. Do not load it at task entry and do not interrupt implementation with
graph modelling merely to prepare for this audit.

## 1. Freeze only the load-bearing claims

Read the accepted source, not the implementor's completion summary. Contract precedence is:

1. latest owner correction;
2. accepted requirement or specification;
3. established public API, schema, and canonical tests in the target version;
4. implementor relay, which is evidence about fulfillment, never the contract.

Record only claims whose failure changes acceptance. Exact output, ordering, error, serialization,
or command examples are executable claims even when they are written as prose rather than code.
Reproduce each normative example exactly; a simpler representative case does not discharge it.

## 2. Name the surface and the falsifier before running them

For each claim, write one compact row:

| Field | Required answer |
|---|---|
| Claim | What exactly must hold? |
| Canonical surface | Which exact binary, package, exported symbol, API route, UI, schema, generated artifact, or deployed path will users consume? |
| Observable | What should an external observer see? |
| Executable falsifier | Which command, request, assertion, or test would prove the claim false? |

Treat boundary words as equivalence classes, not one convenient fixture. For `empty`, `none`,
`missing`, `malformed`, or `default`, enumerate the distinct representations the public parser
can receive — for example zero bytes versus a blank/whitespace record, an empty array versus a
missing field, or an omitted flag versus its explicit default. Probe every representation whose
behavior the accepted wording equates; one member does not stand in for the class.

Name the canonical path before the probe. A `/tmp` build, `go run`, local script, mock-only call, or
unit test that bypasses the public boundary is provisional unless that is the exact public
deliverable. Authorship is not the deciding factor: a newly written black-box test may verify a
claim when it rebuilds and executes the canonical surface with the exact falsifier; a same-author
mock or internal-only test may not. When multiple artifacts can be invoked, compare path plus
freshness (`mtime`, digest, version, or build marker) and prove which one the verifier executes.
Printed output is observation, not a pass, unless an executable assertion checks the expected value
and exit status.

## 3. Run the terminal evidence ladder

After the final material change, in this order:

1. **Build/package/deploy the canonical deliverable.** Do this before testing a scratch copy.
2. **Exercise the newly changed path at its public boundary.** Assert the expected observable and
   failure behavior; do not merely inspect plausible output.
3. **Re-run the exact prior falsifier.** A contradicted claim remains contradicted until the same
   case, or a strictly stronger one, passes against the fresh canonical deliverable.
4. **Re-run exposed old requirements in code.** Prefer acceptance cases touching shared code that
   changed. A broad suite is useful only after the exact new path has run.

Any material artifact change after step 1 invalidates the tail: rebuild the canonical deliverable
and repeat the affected probes. Never let cleanup, graph work, or narration consume the budget
needed for the new-path probe. If NKS or another memory layer is available, evidence comes first;
freeze the claim verdicts and finish all material artifact changes before the memory write. Perform
at most one terminal update, and only when a durable correction or contradiction will change a
later agent's decision. A later material patch means that update was premature: its behavioral
confidence is provisional until the affected public evidence is rerun and the node is reverified.
Do not use the graph as mid-audit scratch. If memory calls equal or exceed code-edit plus test
commands, stop modelling and return to the artifact.

Make combined terminal evidence fail closed from its first command (`set -euo pipefail` or the
platform equivalent). Do not let later cleanup, status printing, or an unrelated success turn a
failed or short-circuited build/probe into a zero exit. When a failure code is itself expected,
capture and assert it locally, then restore fail-closed execution for the remaining evidence.

## 4. Give one truthful verdict per claim

- **verified** — the fresh canonical surface produced the required observable and the executable
  falsifier was attempted successfully;
- **provisional** — evidence exists, but it is scratch-only, mock/internal-only, print-only, stale,
  or misses the exact public boundary;
- **contradicted** — a reproduced counterexample still fails;
- **blocked** — the evidence surface is unavailable; quote the literal blocker and name only the
  claim it prevents checking.

Report a compact claims × verdicts table with the canonical path and command/test evidence. Report
actual telemetry only; do not estimate tokens, cost, duration, or coverage. A green carry-over
subset that omits the failing case is absence of observation, not repair. Structural graph health
is a separate fact and never upgrades a behavioral verdict.

Required work closes only when every required claim is verified or the owner consciously accepts a
named exception. Provisional, contradicted, and blocked are handoff states, not synonyms for done.
