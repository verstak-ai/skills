# Two P3 follow-ups to the accepted delta

Case 1247 [27–29]: Opus 5.5 accepted `77e00b4` with concerns. Candidate
`9f248ce` changes only two prose lines plus the rebuilt bundle:

1. Reverts the door's unobserved bound-role board lookup to the previously
   accepted seat-address wording, matching collaborate and foreman. This does
   not restore handle-based role ownership or mind-address construction.
2. Distinguishes shell exit 2/0 from an OpenCode before-hook's rejection and
   resolution. Describes an isolated fake-context check without executing writes
   or claiming the live harness loaded the projection.

`status.json` records the exact full head and exit codes. The documented
fake-context method was exercised on the shipped template by
`node guard-plugin-probe.mjs <candidate-worktree>`; the template hook rejected
the memory path, allowed a repository path and emitted no mind locator.
There is no EN repository OpenCode projection yet (separate realignment owned
by the steward); this observation is expressly of the template.

Full `make check` exit 0; raw output in `make-check.log`. Earlier evidence is
unchanged in `en5-delta-1247/`. This is an author check, not a new independent
approval and not model-behaviour evidence.
