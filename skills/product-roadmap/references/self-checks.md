# Product-roadmap self-checks — the Step 8 gate

Run every check before publishing. A PASS is **earned over the full set the check
names** — a sampled check never earns a full-set label; scope the claim to what you
actually verified. A failed check → fix, re-render, re-check. Never report success
without a verified artifact.

## Artifact integrity

- [ ] `roadmap.md` exists, non-empty, and contains: the assembled-product lead, the
      "what the graph found" block, next-3-moves, the cited ground section, at least
      one core-flow trace, the directions in dependency order, the reading of the
      field, the signal-audit table.
- [ ] `roadmap.html` is the filled template copy — the `ROADMAP` data object replaced,
      design untouched, no hand-written page.
- [ ] Stage checkpoints (`milestones.json`, `issues.json`, `prs.json`, skeleton) were
      written to `--out` as they were gathered.

## Ground (Step 2)

- [ ] The roadmap opens with "what this product is today", **every line cited to a
      real primitive** (module path, config flag, endpoint, release tag).
- [ ] Each cited primitive **exists at its path and implements the claimed
      behaviour** — not a read-site standing in for the enforce-site, not a symbol
      that lives in a different file.
- [ ] Versions/stack figures re-read from the manifest (`package.json` /
      `Cargo.toml` / `pyproject.toml`), never from a doc; no prose doc
      (README/ARCHITECTURE) cited as current ground where code is the source.
- [ ] No content/data coverage claimed off a config or UI surface (UI locales ≠
      translated-content coverage); coverage stated from the producing code path.

## Milestones and signal (Steps 3–4, 6)

- [ ] Every open milestone title appears verbatim; the near-term milestone direction
      lists **every** open issue (a ranked top-N states the total and that the rest
      remain). No milestones at all → the check is N/A and the render says so
      plainly; never fabricate one.
- [ ] The absolute top-reacted and top-commented OPEN issues survived to the roadmap —
      included, or explicitly deferred; the signal-audit table makes this auditable
      and states the engagement cutoff.
- [ ] Empty/thin backlog handled honestly: no invented items; the trajectory table
      (per-repo merged-PR counts + themes) carries the audit; **exact counts, never
      estimates** when the data is in hand.

## Live state (render time)

- [ ] **Each cited issue/PR re-verified individually** at render time — open /
      merged / closed / draft + `mergeable` — with a per-item evidence line
      (`<repo>#N: open, mergeable=true, author=login/ASSOC`). PASS only if itemized
      over every cited item and every mismatch corrected.
- [ ] Author + association re-verified in the same pass — for **every named person**,
      including deferred/secondary/structural-risk mentions; never carry the
      harvest's guess; when unsure, drop the name.
- [ ] No merged/closed item shown as open work; no OPEN PR in a merged/shipped row;
      no "merge/rebase X" where X is draft, already merged, or `mergeable=true`
      (a mergeable PR is not "conflicting"). `mergeable=null` re-polled once, then
      labeled "mergeability pending", never "clean".
- [ ] Recommended action per PR clears its **binding** constraint (draft → ready;
      conflicted → rebase; CI red → fix CI; unresolved review → address review;
      clean+green+reviewed → merge).

## Graph leverage (Steps 2, 5, 6)

- [ ] **No zero-edge karta; every karta carries `manifested_as`.** Each created karta
      has real `actor`/`steward` edges to the deeds it drives — `nks_look` each. A
      worker/CI/cron "doer" is a ⚙️ phenomenon, not a karta.
- [ ] **Runtime-operator layer not collapsed.** If the actors are only contributors +
      a generic end user, the layer was flattened: check the ground for internal
      operators (admin/moderator/staff) and model each as an active adhikarin 能 the
      direction targets — never a passively-"served" party.
- [ ] Every direction's figure-on-ground is a real arrow (driving kriya →
      `upadhi`/`context` → ground capability), or the direction is explicitly marked
      genuinely-new ground.
- [ ] The "reading of the field" section is present: driving kartas (+ runtime
      targets), tensions-derived structural risks, the figure-on-ground map — each
      NKS term glossed in plain English on first use.
- [ ] Prose claims ⊆ graph structure — run the `integrity` skill's claim-audit mode
      over the rendered artifact when in doubt: every claimed ownership/extension/
      flow/coverage carried by real edges, or the prose weakened.

## Re-run contract (existing realm)

- [ ] Ground / backlog / directions updated **in place** (locate-before-write):
      `nks_semantic_search` a sample of subsystems, capabilities, directions —
      each exists exactly once; duplicates merged or deleted.
- [ ] Realm absent → creation was *proposed* and approved, never silent.

## Reference and language discipline

- [ ] `#N` only for real GitHub numbers; graph seqs prefixed (`NKS#…`); directions
      referenced as `D1`/`D2` or by name.
- [ ] Multi-repo: grep the artifacts for violations — a bare or grouped `#\d+` not
      preceded by a full repos key, ad-hoc abbreviations (`be#`/`fe#`), ranges
      (`#\d+-\d+`), unset `directions[].repos` / driver `repo` keys. Expand every hit.
- [ ] Multi-repo: ONE focus holon, each in-scope repo a subsystem under it, and at
      least one cross-repo direction or the cross-repo estafeta present (else it is
      N stapled roadmaps).
- [ ] Label-derived facts (kind counts, label names) come from actual labels; kinds
      inferred from titles are marked inferred.
- [ ] Grep the artifact for "highest/most/biggest/largest": each is scoped or backed
      by a full-set computation, never asserted off the capped subset.
- [ ] No self-check label over-claimed: "every item re-verified" / "nothing dropped" /
      "covers all themes" only where the full set was actually processed.

## Handoff

- [ ] When run by an orchestrator: results handed off as files on disk, the return
      value a short confirmation + paths — never the full roadmap text.
