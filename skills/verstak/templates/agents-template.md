---
verstak:
  graph: <rN of the graph, from verstak_realm(action="list")>
  holon: <seq of the focus holon>
  agent_role: <seq of the agent role, the holon's steward>
  contract: <N>
  stamp: <YYYY-MM-DD>
---
# `<project-name>`
`<one line: what this project is and whom it serves>`

<!-- The cover's form and fill: `methods/align.md`, Step 7, `Cover`. Judgment slots live in `Project`; an unresolved one reads `open`, its question a message in the holon's alignment case. -->

## Project
- **Nature**: `<production / research / sandbox / one-off / library; if not production — what is relaxed and why>`
- **Cost of breakage**: `<what ships, to whom, where; for a sandbox — where the cheapness ends>`
- **Consumers**: `<who consumes the artifact and how they learn it broke>`
- **Stack**: `<language + main frameworks>`
- **Gate**: `<one call: make check / npm run gate>`
- **Layout**: `<code map: component READMEs, or — where a README beside outputs is forbidden — one non-shipped file or this section>; <traps: the graph or GOTCHAS.md>`
- **Feedback reflection**: `<yes — default / no>`
- **Workflow-suite interop**: `<full / prose-only / none>`

**Load the `verstak` skill first, every session, before any action**, and do the door's `Start` with the addresses above. Code work follows its `methods/code-work.md`. This file holds only this repository's own facts; a line contradicting the method → the door, `Start`, `Alignment`.

**Refused tools:** `AskUserQuestion` (Claude Code) and `question` (OpenCode) — a blocking question stalls the session; ask in words someone answering now, and a question that outlives the turn as an `ask` card in the case (`methods/collaborate.md`, `Asking the user`). Held, not by this line alone, by `<the layers of the harnesses used here, by condition: where Claude Code is used — .claude/settings.json permissions.deny, and the verstak plugin's hook where the plugin is loaded; where OpenCode is used — the question policy in .opencode/opencode.json or .jsonc>`.

## Persistence
- State lives in the repo or the graph. The harness's built-in memory is forbidden entirely; what a finished piece leaves behind — scratch, worktrees, caches, cases you no longer owe a move — is cleaned up with it (`methods/code-work.md`, `Cleanup`). Only committed files and the project graph configure agents.
- The memory directory is frozen by the `PreToolUse` memory guard (exit 2) — Claude Code: `.claude/settings.json`, OpenCode: the delivery; a harness without a hook surface carries none; `<the spec-write hook: .claude/settings.json; else drop>`; add beside other suites' entries. A cover whose `rituals:` leaves out `guard` turns it off; a guard already in `.claude/settings.json` stays until taken off by hand. The start, push and merge rituals are the delivery's, by the cover. Where a fact goes: the door, `Routes`, Keep.

## Where things live
| Concern | Home |
|---|---|
| Gotchas | `<GOTCHAS.md / graph nodes this file links>` |
| Branch state, work in flight | git + PR with the case number; node modes and the transformation's seed (`methods/writing.md`, Decision 5) |
| Decisions, plans, questions of substance | graph: nodes, vimarshas, the map of transformations |
| One-off tasks, conversation | a case |
| Commit history, PRs, SHAs | git, never the graph |

No `HANDOVER.md`.

## Reality
Before saying "works", or switching a mode or ending a question on a claim about execution, read your claim class's row in `REALITY.md` (other changes name their own grounds and the rightful act); it goes whole into a `verifier` or `reviewer` brief. First row: `<main claim class and its carrier>`.

## Stack
`<versions + critical libraries beyond the `Stack` line in Project; drop if none>`

## Commands
`<table: build / test / lint / dev / format; lint zero-warning where the stack allows>`

## Project structure
`<the layering plus a "component → README" table, by the READMEs existing (this run writes none); a file map of the top-level directories, one line each, until the first touch of a component moves it into that README; path aliases; where Layout forbids a README beside shipped outputs: one line pointing to the non-shipped map file, or the map here while it is a few lines>`

## Code conventions
- Graph references in code: `(graph <graph name>, node #N)`. `<where they don't belong: readers without graph access>`
- `<naming / imports / banned patterns + why — only what the linter doesn't enforce>`
- **Test discipline**: `<unit | +integration | +e2e; coverage threshold for production>`; `<affected modules/direct compositions and content-based result reuse — or "not yet", with the batch closing it or the principal-granted exception and scope in Local overrides>` (`methods/code-work.md`, `Tests and CI`).
- `<secrets: untracked and ignored, rotated if ever committed; never git add -A>`

## What to update when
- `AGENTS.md` — only what an agent needs before reaching the graph; the rest goes into nodes.
- `REALITY.md` — a carrier appears, changes or turns out unreachable; dated measurements go to the graph.
- `<CLAUDE.md copy — regenerate on every AGENTS.md change>`
- `<component README — in the commit that moves, renames or adds its files>`
- `<GOTCHAS.md — one line per trap, its node linked where one exists; trap gone, line gone>`

## Git workflow
- Conventional commits (`feat:`, `fix:`, `chore:`…); branches and PR titles likewise.
- PR body: one or two lines and the case number. No co-author trailer unless asked.
- One branch and one PR per batch, in its own worktree `.worktrees/<branch>` (ignored by git and by every gate tool that walks the disk); review by the batch's tier (`methods/code-work.md`, `Branch and worktree`, `Cold review`). An abandoned tree — branch merged or deleted on the forge, copy clean — is removed by any agent of the repo; uncommitted or unmerged work is named to its holder.
- The gate is one call: `<gate command>`; CI calls the same, on `<its triggers from the CI yaml: the batch's PR and trunk>`. Pre-commit runs `<linter + formatter + type check>` on staged files.
- Forge CLI `<gh / fj / glab>`. **Done**: `<merge flow; how you learn it merged>`.
- Never `--no-verify`, `--force`, `--no-gpg-sign`, `git reset --hard` without explicit instruction.

## Role file tails
`<Role files are a projection on the machine, not in git; here are the lines a role needs only in this repo: a `#### <role>` subheading, under it the lines the projection puts under `## This repo` in its file, and frontmatter keys beyond the block. No tails → delete the section.>`

## Local overrides
`<deviations from the method with reasons (a toolchain pin); graph canon blocks byte for byte. None → delete.>`
