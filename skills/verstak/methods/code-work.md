# code-work — changing code in a repository aligned to a graph

**Use when:** you are about to change code where `AGENTS.md` names a graph ("fix this", "implement", "refactor", "we've decided, do it") — before the first edit; a stage is done (gate green, a PR opened or updated); you are about to push; a PR merged ("merged", "shipped", "tidy after the merge"), or the session ends without one.

## Before code

Graph → integration scope → design → code. Task by references and a check; accept by running it. Skip only on "just do it" or a named protocol; the survey remains a `methods/reconcile.md` debt. Silence isn't permission.

1. **Survey** (`methods/entry.md`): the place of change, its open vimarshas, what was decided and rejected. Name the nodes you read; a search hit is a lead until opened and walked.
2. **Integration scope** (`methods/integrity.md`, Mode 1), from the graph only. Root: the focus holon and its steward role; no list of shared surfaces, none asked of the user. Per node the change embodies: a phenomenon → `verstak_orient(lens="trace")` both ways; a kriya → its `next` thread and `ahara`/`utpatti`/`upadhi` relays; an exit into another holon → its steward role. A dependency the traversal misses is a model defect (`methods/design.md`, `methods/weaving.md`); a wait → a `posed_to` vimarsha and a message in the case; a public handle with no trace is unneeded or a graph debt.
3. **Design** (`methods/design.md`) when a structural choice is open. Not ready until its decisions, risks and lifecycle are in the graph, whichever method or suite elicited it; another suite's spec file is taken in the same session (`methods/intake.md`). Owner absent → decisions and risks now, the telos to confirm.
4. **External surfaces** (someone else's API, SDK, CLI, schema): before the work, record the part you touch as a node with its version, `upadhi` (or `ahara`/`utpatti`) of the kriya acting through it. Observation (a call, `--help`, installed types) outranks docs; docs outrank memory; memory is no source — `pratyakshita` only for what you observed. Mismatch or new version → fix the node at once. Code at a surface carries `(graph …, node #N)`: read that first.
5. **Code.** Execution suites run execution; their decisions and risks reach the graph this session.

## Branch and worktree

- One branch until its merge, follow-ups included, in **its own worktree**, from a fresh trunk: `git fetch origin && git worktree add <dir> -b <branch> origin/main`. A `checkout` in the shared checkout wipes others' work.
- Pushed → the PR in the same move (draft if unfinished); watch the checks and the merge signal in the background, never by a blocking poll in your own turn; fix red in the branch.
- After merge: `git worktree remove` yours, `git branch -d` merged branches, remove your temp files, `git pull` in the main checkout; confirm cleanup before the next task. Leave others' worktrees alone.

## Self-review

Per stage (gate green, PR opened or updated, touching more nodes) re-read the diff against trunk: bugs, fragile spots, weak error handling, DRY/SOLID breaches, missing or useless tests, files over 150 lines, god units. Fix or say nothing surfaced; don't invent findings. Before push, the **vocabulary pass** over PR text: borrowed words (ticket, backlog, sprint, epic, story, done, blocker) — ask what the project calls them; don't substitute.

## Cold review

- Self-review doesn't replace it: both, in this order.
- After self-review of an open PR or a large stage → the `reviewer` role, in a separate worktree: the spawner's isolation where it offers one (Claude Code: `isolation`); where it doesn't (OpenCode), lay a detached tree yourself (`git worktree add --detach <dir> <head>`), the brief says "work only there", the edit ban is the second line, the report says "isolation manual"; neither → say there was no cold review. The hook fires only on push: a stage without one is yours to hold.
- Brief with references, not your retelling: diff, repository, focus holon and steward, the nodes the diff embodies. It runs `methods/integrity.md` Mode 1 read-only and returns findings plus an integration report: what is touched, relays, open questions, neighbours' readiness, whom to wake (`methods/collaborate.md`); unknown → `unknown`.
- `NEEDS_CONTEXT` is a graph defect: finish design, weave, pose vimarshas, review again. Reject a finding by recording why.
- A behavioural claim closes on a cold `verifier` briefed with claim, carrier and falsifier from `REALITY.md`; wait for its verdict (`methods/reality-audit.md`). No such role → observe the carrier yourself, never the source.
- Launch line: `start <graph> <role> case #N` of its child case (the door, `Work goes to subagents`). A graph review canon in `AGENTS.md` wins where it speaks.

## After merge

A push shipped nothing; these acts hang on the merge, all mandatory, in the same move — also after a forge merge plus `git merge --ff-only`, which fires no hook. On work tasked by another agent, weaving, ending and reconciling are the tasker's; you leave the seed and delivery modes (`methods/autonomous.md`).

1. **Weave** (`methods/weaving.md`): what shipped → nodes and arrows with `sense` in the target system; repo mechanics stay in git. Zero nodes after a real change — say why.
2. **Advance the map**: open work stays `anga` on the transformation; its seed (`methods/writing.md`) keeps only what matters after the session, never a log of the merge.
3. **Switch modes on evidence it runs, not on merge.** The merge moves the map and the nodes of what the code now carries. A kriya goes `anagata`→`vartamana` (and up from `kalpita`) only when an actor does it, a rollout or an observed run shows it (`methods/reality-audit.md`). None → it stays `anagata`; ask for what's missing in a vimarsha `posed_to` whoever runs it.
4. **End by axis** (`methods/inquiry.md`), answer the `posed_to` inbox, `propose_close` with evidence.
5. **Reconcile** (`methods/reconcile.md`): nodes against code, code against graph; the remainder as vimarshas.
6. **Feedback reflection** unless `AGENTS.md` sets `Feedback reflection` to `no`, and at session end without a merge: experience about the method, as a concrete instance (`methods/feedback.md`); zero entries is valid.
7. **Vocabulary pass** over what landed.

Then cleanup; next task → `Before code`.

## Cleanup

With each finished piece — merged, delivered, answered, released — not at session end; a wake-up tick is the reminder to walk this list.

1. **Files**: the piece's worktree (`git worktree remove`), its merged branch (`git branch -d`), your scratch by name — gate logs, review trees, isolated run homes. Others' stay; unsure whose → ask. A machine-wide sweep is not cleanup of yours: `docker system|volume|image|builder prune` without a filter on your own label, or `git clean` outside your own tree, deletes others' work for good. Yours carries a mark you can filter on — a run label, a volume name, your compose project; nothing to filter on → name it and ask.
2. **Cases**: `verstak_case(action="mine")`. Where no move of yours is awaited (task delivered, question answered, your share done): close your lines with their outcome (`line`); as lead, `propose_close` with evidence or hand the lead over (`methods/architect.md`) — and once it closes, `leave`. Stay only where you await an answer or lead something open.

## Working principles

1. **Think before code.** Name assumptions; unsure → ask what exactly is unclear, in text (in a case, an `ask` card: `methods/collaborate.md`, `Asking the user`), never via the harness's picker. Push back on a false premise or when a simpler move exists. Out of mandate → `posed_to` the owner role.
2. **Simplicity first**: the minimum; no speculative features or one-off abstractions; validate at boundaries.
3. **Stay inside the repo.** Outside the working directory: only reading carriers, the temp directory, the delivery's home. Another holon → a vimarsha on its node (`anga` to the transformation) and `verstak_case(action="talk", about=<subject>)` to its steward. Don't read, clone or survey repos outside your mandate: integration comes from the graph or the steward; what is in neither is a `posed_to` vimarsha.
4. **A second implementation is an event**: find both via `methods/integrity.md`, name them to the user, propose reunifying or a named fork; a new consumer gets its arrows in the same move.
5. **Surgical changes**: only what the task needs; no reformatting neighbours; keep the style; the linter is authoritative; delete only what your change made dead, flag the rest.
6. **Execute from the goal**: a bug → a failing test first; multi-step → `step → check` pairs; runtime → the real environment; falsifier before looking.
7. **Meaning lives in the graph; code references it**: rationale, rejections ("not cached: #N"), how an integration works → a node, `(graph <name>, node #N)` in code; mechanics stay in words (`methods/reconcile.md`, pass 3).
8. **Speak the project's language** until the user speaks the graph's.
9. **Declining and leaving**: an assignment by a message, a vimarsha by editing it; leave a transformation seed and a message in the case; the lead passes by agreement (`methods/architect.md`).
10. **Fresh toolchain**: take delivery updates; an unpacked copy → check its version. A pin is a local override.
