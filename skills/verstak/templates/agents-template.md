---
'Nature': '<production / research / sandbox / one-off / library; if not production — what is relaxed and why>'
'Nature — source': '<derived / agreed: who / not agreed — case #N>'
'Graph': '<@owner/slug (rN)>'
'Graph — source': '<derived / agreed: who / not agreed — case #N>'
'Focus holon': '<#seq "name">'
'Focus holon — source': '<derived / agreed: who / not agreed — case #N>'
'Repository': '<host/org/repo> — the holon''s repository attr, from origin'
'Repository — source': 'derived'
'Agent role': '<#seq "name"> — adhikarin, steward of the holon; inbox verstak_orient(focus="<seq>")'
'Agent role — source': '<derived / agreed: who / not agreed — case #N>'
'Owner role': '<#seq "name"> — svatantra, the posed_to address for out-of-mandate questions'
'Owner role — source': '<derived / agreed: who / not agreed — case #N>'
'Stack': '<language + main frameworks>'
'Stack — source': 'derived'
'Gate': '<one call: make check / npm run gate>'
'Gate — source': '<derived / agreed: who / not agreed — case #N>'
'Consumers': '<who consumes the artifact and how they learn it broke>'
'Consumers — source': '<derived / agreed: who / not agreed — case #N>'
'Cost of breakage': '<what ships, to whom, where; for a sandbox — where the cheapness ends>'
'Cost of breakage — source': '<derived / agreed: who / not agreed — case #N>'
'Reality': 'REALITY.md at the root — read when needed (the Reality section below)'
'Reality — source': '<derived / agreed: who / not agreed — case #N>'
'Layout': '<code map: component READMEs, or a section where a README beside outputs is forbidden>; <traps: the graph or GOTCHAS.md>'
'Layout — source': '<derived / agreed: who / not agreed — case #N>'
'Cross-project memory': 'personal graph @<handle>/mind — never a global instructions file or the memory directory'
'Cross-project memory — source': '<derived: template default / agreed: who>'
'Feedback reflection': '<yes — default / no>'
'Feedback reflection — source': '<derived: template default / agreed: who>'
'Workflow-suite interop': '<full / prose-only / none>'
'Workflow-suite interop — source': '<derived / agreed: who / not agreed — case #N>'
'Agreement': '<case #N on the holon "Align …"; none when every slot is resolved>'
'Agreement — source': 'derived'
---
# `<project-name>`
`<one line: what this project is and whom it serves>`

**Load the `verstak` skill first, every session, before any action**, and do the door's `Start` with the addresses above; its `Cross-cutting norms` apply here. Code work follows its `methods/code-work.md`. This file holds only this repository's own facts; a line contradicting the method → the door, `Start`, `Alignment`.

## Persistence
- State lives in the repo or the graph. The harness's built-in memory is forbidden entirely; a temp directory is scratch, cleaned up with each finished piece, as are worktrees, probe graphs and cases you no longer owe a move (the door, `Case laws`). Only committed files and the project graph configure agents.
- The memory directory is frozen: `MEMORY.md` is a one-line stub pointing here; the `PreToolUse` memory guard blocks writes (exit 2). Where a fact goes: the door, `Routes`, Keep.
- Rituals (start, push, merge, memory guard`<, spec-write>`) are wired in `<harness paths>`; add beside other suites' entries.

## Where things live
| Concern | Home |
|---|---|
| Code, configs, commands, conventions | repo, this file |
| Gotchas | `<GOTCHAS.md / graph nodes this file links>` |
| Branch state, work in flight | git + PR with the case number; node modes and the transformation's seed (`methods/writing.md`, Decision 5) |
| Decisions, plans, questions of substance | graph: nodes, vimarshas, the map of transformations |
| One-off tasks, conversation | a case |
| Commit history, PRs, SHAs | git, never the graph |

No `HANDOVER.md`.

## Reality
Before saying "works", switching a mode or ending a question, read your claim class's row in `REALITY.md`; it goes whole into a `verifier` or `reviewer` brief. First row: `<main claim class and its carrier>`.

## Stack
`<versions + critical libraries beyond the frontmatter; drop if none>`

## Commands
`<table: build / test / lint / dev / format; lint zero-warning where the stack allows>`

## Project structure
`<top-level directories, one line each; path aliases — or the layering plus a "component → README" table>`

## Code conventions
- Graph references in code: `(graph <graph name>, node #N)`. `<where they don't belong: readers without graph access>`
- `<naming / imports / banned patterns + why — only what the linter doesn't enforce>`
- **Test discipline**: `<unit | +integration | +e2e; coverage threshold for production>`
- `<tracked secrets: skip-worktree; never git add -A>`

## What to update when
- `AGENTS.md` — only what an agent needs before reaching the graph; the rest goes into nodes.
- `REALITY.md` — a carrier appears, changes or turns out unreachable; dated measurements go to the graph.
- `<CLAUDE.md copy — regenerate on every AGENTS.md change>`
- `<component README — in the commit that moves, renames or adds its files>`
- `<GOTCHAS.md — one line per trap, its node linked where one exists; trap gone, line gone>`
- `<MISSING_*.md — a need a neighbouring system doesn't cover yet>`

## Git workflow
- Conventional commits (`feat:`, `fix:`, `chore:`…); branches and PR titles likewise.
- PR body: one or two lines and the case number. No co-author trailer unless asked.
- The gate is one call: `<gate command>`; CI calls the same. Pre-commit runs `<linter + formatter + type check>` on staged files.
- Forge CLI `<gh / fj / glab>`. **Done**: `<merge flow; how you learn it merged>`.
- Never `--no-verify`, `--force`, `--no-gpg-sign`, `git reset --hard` without explicit instruction.

## Local overrides
`<deviations from the method with reasons (a toolchain pin); graph canon blocks byte for byte. None → delete.>`

*(verstak align: contract `<N>`, stamped `<YYYY-MM-DD>` — re-run when the installed
verstak skill names a higher contract, or when the sources this file derives from
have moved since that date.)*
