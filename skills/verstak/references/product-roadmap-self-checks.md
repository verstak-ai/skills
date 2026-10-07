# Product roadmap self-checks — the Step 8 gate

Run every check before publishing (`methods/product-roadmap.md`, Step 8). A PASS is **earned over the full set the check names**; a sampled check earns only a claim scoped to what was checked. Failed → fix, re-render, re-check.

## Artifact integrity

- [ ] `roadmap.md` non-empty, with: "the product, assembled", "what the graph found", next 3 moves, a cited ground section, at least one key-flow trace, directions in dependency order, reading the field, the signal-audit table.
- [ ] `roadmap.html` is `templates/roadmap-template.html` with only the `ROADMAP` data object replaced.
- [ ] Stage checkpoints (`milestones.json`, `issues.json`, `prs.json`, the skeleton) written to `--out` during the harvest.

## Ground (Step 2)

- [ ] "What this product is today": **every line cited to a real primitive** that **exists at its path and implements the behaviour** (where enforced, not where read; not a symbol from another file).
- [ ] Versions and stack figures from the manifest (`package.json` / `Cargo.toml` / `pyproject.toml`); no prose doc cited as ground where the source is code.
- [ ] Coverage comes from the producing code path, not a config or UI surface (UI locales ≠ translated content).

## Milestones and signal (Steps 3–4, 6)

- [ ] Every open milestone appears with its verbatim title; the near-term one's direction lists **every** open issue (a top N names the total and the rest). No milestones → N/A, said plainly.
- [ ] The top OPEN issues by reactions and by comments are included or explicitly deferred; the signal audit names the threshold.
- [ ] A thin backlog: nothing invented; a trajectory table (merged-PR counts per repo + themes); **exact numbers**.

## Live state (at render time)

- [ ] **Every cited issue/PR re-checked individually** — open / merged / closed / draft + `mergeable` — one evidence line each (`REPO#N: open, mergeable=true, author=login/ASSOC`), every discrepancy fixed.
- [ ] Author + association re-checked in the same pass for **every named person**, deferred and risk mentions included; in doubt, remove the name.
- [ ] Nothing merged or closed shown as open work; no OPEN PR as shipped; no "merge/rebase X" where X is a draft, merged, or `mergeable=true`. `mergeable=null` re-queried once, then "mergeability pending".
- [ ] Each recommended PR action removes its **binding** constraint (draft → mark ready; conflicted → rebase; CI red → fix CI; unresolved review → answer it; clean + green + reviewed → merge).

## Graph leverage (Steps 2, 5, 6)

- [ ] **No zero-arrow role; every role carries `manifested_as`** — real `actor`/`steward` arrows, checked by `verstak_look` on each. Worker/CI/cron is a ⚙️ phenomenon.
- [ ] **Runtime operators not collapsed**: actors only contributors + a generic end user → look in the ground for admin/moderator/staff, each an active `adhikarin` 能 a direction targets.
- [ ] Every direction's figure on ground is a real arrow (leading kriya → `upadhi`/`context` → ground capability), or marked as new ground.
- [ ] "Reading the field" present — driver roles (+ targets), structural risks, figure-on-ground map — terms glossed.
- [ ] Prose claims ⊆ graph structure — in doubt, the claim-audit mode of `methods/integrity.md` over the artifact.

## Re-run contract (existing graph)

- [ ] Updated **in place**: `verstak_semantic_search` over a sample of subsystems, capabilities and directions — each exists once; duplicates merged or deleted.
- [ ] A missing graph was *proposed* and approved before creation.

## Reference and wording discipline

- [ ] `#N` only for real GitHub numbers; graph seqs `VERSTAK#…`; directions `D1`/`D2` or named.
- [ ] Multi-repo: grep for bare or grouped `#\d+` without a repo key, home-made abbreviations (`be#`/`fe#`), ranges (`#\d+-\d+`), empty `directions[].repos` / driver `repo` keys; expand every hit.
- [ ] Multi-repo: ONE focus holon, every repo a subsystem under it, at least one cross-repo direction or relay.
- [ ] Label facts from real labels; kinds inferred from titles marked "inferred".
- [ ] Grep for "highest/most/biggest/largest": each scoped or backed by a full-set computation.
- [ ] No self-check label overclaimed ("every item re-checked", "nothing dropped", "covers all themes").

## Handoff

- [ ] Launched by an orchestrator: files on disk, a short confirmation + paths, never the full text.
