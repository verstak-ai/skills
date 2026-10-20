# EN5 review delta — case 1247

Candidate: `77e00b4979244ac6c5621a77caeb0b04b72124db`, PR 214.
Previously reviewed head: `d1e2a052cb83c5d00a41e451c9a788f07e590b87`.
Content change: `c84fbf4`; archive removal only: `77e00b4`.

The historical evidence at d1e2a052 remains unchanged on this retained evidence
branch. Case 1247 records the recipient's hash/archive receipt [18] and our
acknowledgement [20]. Neither this branch nor its historical carriers are to be
deleted after the release branch merges.

## Results

- `make check` on the exact candidate: exit 0, 306 tests, 306 pass, zero failures
  or skips. Raw log and exact head are in `make-check.log` and `gate-status.json`.
- `node probe.mjs <candidate-worktree>`: exit 0. Raw command records, stdout and
  stderr accompany the script. The old disabled checker incorrectly passes;
  disabling the new clause checker causes 14 failures, disabling the recipe
  checker causes one. The old corpus causes 30 failures. These are deliberately
  asserted negative outcomes, not a red candidate gate.
- `node guard-locator-probe.mjs <candidate-worktree> <output-dir> en`: exit 0.
  Appending a mind locator to both real guard commands preserves their exit
  statuses but makes all 24 refusal-message checks fail; 12 allowed-path checks
  still pass. Raw result and status are alongside the script.

## Review delta and accepted boundaries

- Subject `repository` attrs are allowed as readiness sources; onboarding-only
  markers and stored mind locators are prohibited. The specific repository is
  located by normalized origin. API unknown alone is neither absence nor a
  reason to stop subject work.
- The public handle remains required for overall completion, but the reminder
  belongs only to the UI; skills do not request it or stop work on complete=false.
- Existing mind without the current user's role after once-per-account settlement
  has an explicit search/create-user-bound-role/reread path, not a whoami loop.
  The API author's 14/14 result in case 1232 [94] is separate testimony; rollout
  and live API acceptance are not proven by this corpus gate.
- Binding repair no longer uses handle matching. MCP text is read as returned;
  identity name comes from whoami; the understood fields follow live help.
- Source and generated home were rebuilt; the guard self-check inspects the
  message as well as exit status; negative tests invoke the same checker.
- Case 1247 [23–24]: the EN steward owns repository realignment (six roles,
  rituals, OpenCode projections, stamp 5) in a separate post-release PR. This
  candidate honestly retains stamp 4; it does not claim that alignment happened.

Text presence, model behaviour, API isolation, a live harness loading hooks and
native Windows execution remain distinct claims. No model runs were purchased.
This author recheck does not replace the independent reviewer's delta verdict.
