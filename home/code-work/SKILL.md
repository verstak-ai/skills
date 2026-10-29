---
name: code-work
description: "Change code in a repository aligned to a graph: before the first edit, tests and CI, self-review before a push, the cold review tier, after a merge. Triggers: 'fix this', 'implement', 'build it', 'refactor', 'we've decided, do it', 'review the branch', 'merged', 'shipped', 'tidy after the merge'. Needs the verstak_* tools."
---

# code-work — changing code in a repository aligned to a graph

**Use when:** you are about to change code where `AGENTS.md` names a graph ("fix this", "implement", "refactor", "we've decided, do it") — before the first edit; you write or run tests, or touch CI; a stage is done (gate green, a PR opened or updated); you are about to push; a PR merged ("merged", "shipped", "tidy after the merge"), or the session ends without one.

## Before code

Graph → integration scope → design → code. Task by references and a check; accept by running it. Skip only on "just do it" or a named protocol; the survey remains a **reconcile** debt. Silence isn't permission.

1. **Survey** (**entry**): the place of change, its open vimarshas, what was decided and rejected. Name the nodes you read; a search hit is a lead until opened and walked.
2. **Integration scope** (**integrity**, Mode 1), from the graph only. Root: the focus holon and its steward role; no list of shared surfaces, none asked of the user. Per node the change embodies: a phenomenon → `verstak_orient(lens="trace")` both ways; a kriya → its `next` thread and `ahara`/`utpatti`/`upadhi` relays; an exit into another holon → its steward role. A dependency the traversal misses is a model defect (**design**, **weaving**); a wait → a `posed_to` vimarsha and a message in the case; a public handle with no trace is unneeded or a graph debt.
3. **Design** (**design**) when a structural choice is open. Not ready until its decisions, risks and lifecycle are in the graph, whichever method or suite elicited it; another suite's spec file is taken in the same session (**intake**). Owner absent → decisions and risks now, the telos to confirm.
4. **External surfaces** (someone else's API, SDK, CLI, schema): before the work, record the part you touch as a node with its version, `upadhi` (or `ahara`/`utpatti`) of the kriya acting through it. Observation (a call, `--help`, installed types) outranks docs; docs outrank memory; memory is no source — `pratyakshita` only for what you observed. Mismatch or new version → fix the node at once. Code at a surface carries `(graph …, node #N)`: read that first.
5. **Code.** Execution suites run execution; their decisions and risks reach the graph this session.

## Branch and worktree

- **One branch and one PR per batch of changes** until its merge, follow-ups included, in **its own worktree inside the repository**, from a fresh trunk: `git fetch origin && git worktree add .worktrees/<branch> -b <branch> origin/main` (`.worktrees/` in `.gitignore` and excluded by every gate tool that walks the disk) — not in the main checkout and not beside the repo: every tree shows in one `git worktree list`. Subagents' work and the batch's items merge into it locally; no branch or PR per item. A `checkout` in the shared checkout wipes others' work.
- Pushed → the PR in the same move (draft if unfinished); watch the checks and the merge signal in the background, never by a blocking poll in your own turn; fix red in the branch.
- After merge: `git worktree remove` yours, `git branch -d` merged branches, remove your temp files and development caches, `git pull` in the main checkout; confirm cleanup before the next task. **An abandoned tree** — its branch in `main` or deleted on the forge, its copy clean — is removed by any agent of the repo (`git worktree remove`, `prune`, `git branch -d`); uncommitted or unmerged work stays — name it to its holder or the user.

## Self-review

Per stage (gate green, PR opened or updated, touching more nodes) re-read the diff against trunk: bugs, fragile spots, weak error handling, DRY/SOLID breaches, missing or useless tests, files over 150 lines, god units. Fix or say nothing surfaced; don't invent findings. Before push, the **vocabulary pass** over PR text: borrowed words (ticket, backlog, sprint, epic, story, done, blocker) — ask what the project calls them; don't substitute.

## Cold review

- Where cold review is required, self-review comes first and doesn't replace it.
- The unit is the batch — its branch, its PR, its diff against trunk; never per commit. An unfinished feature or an intermediate PR → self-review and the gate only.
- **Before merge** a finished batch gets **one light review** only when it carries a refactor or a large new feature: one `reviewer` reads the diff against the accepted base with the surroundings it needs, against what the change closes (its vimarsha or principle) — not an audit of the project, graph or skill corpus. Anything else is small: the author says so as a line in the case; a reviewer or whoever merges may contest it, and then it is reviewed before merge. A small batch merges on the gate; its review, if wanted, is a `reviewer` after the merge that blocks nothing, its findings fixed in the next batch.
- The **full review** runs once, on the frozen tag candidate before publication: the assembled release against the previous accepted release, built artifacts and touched shared contracts included. A batch that is itself the release candidate gets only this one, on its last head — no light review before it. A review after publication is not this one.
- **Model families.** On code a second family is the user's choice: you may offer a pair, nothing obliges one, and the user names the models. Where the repository ships agent skills, their bodies are read once on the final candidate by reviewers of different model families — mandatory: skills are executed by different models and an error is costly. They look for bloat, contradictions between texts (one norm, one home) and drift from the canon and the tool surface, and number each finding by the repository's skill-body criteria. Executable role-file pins follow `align-delegation`.
- Each `reviewer` runs in a separate worktree: the spawner's isolation where it offers one (Claude Code: `isolation`); where it doesn't (OpenCode), lay a detached tree yourself (`git worktree add --detach .worktrees/<name> <head>`), the brief says "work only there", the edit ban is the second line, the report says "isolation manual"; neither → say there was no cold review. The hook fires only on push: a finished batch never pushed gets no reminder — decide its review tier yourself.
- After a fix: check the changed delta and the findings it touches. A new SHA, a version bump, a micro-branch, pulling trunk or a rebase with no content change is no reason for another round; the same step runs again whole only on a changed shared contract or a new substantial counterexample.
- The record in the case names head and base, model, scope checked, verdict, usage where available, and which step it was: light pre-merge, post-merge, full tag-candidate or skill-body reading.
- Brief with references, not your retelling: diff, repository, focus holon and steward, the nodes the diff embodies. It runs **integrity** Mode 1 read-only and returns findings plus an integration report: what is touched, relays, open questions, neighbours' readiness, whom to wake (**collaborate**); unknown → `unknown`.
- `NEEDS_CONTEXT` is a graph defect: finish design, weave, pose vimarshas, review again. Reject a finding by recording why.
- A behavioural claim closes on a cold `verifier` briefed with claim, carrier and falsifier from `REALITY.md`; wait for its verdict (**reality-audit**). No such role → observe the carrier yourself, never the source. CI, tests, this acceptance and an immediate targeted check of a security or data-loss threat stay at every step; the review tiers spare only review.
- Launch line: `verstak <graph> <role> case #N` of the case its assignment goes into (`verstak`, `Work goes to subagents`). A graph review canon in `AGENTS.md` wins where it speaks.

## Tests and CI

A change is checked in what it touched, once.

- **One responsibility, one home**: each has its place and one source of change, and is tested on its own — code, tests, skill texts and graph nodes alike. A component carries its own entry point (router, module) and its own tests; a change to it wakes only those.
- **Composition by injection**: dependencies arrive from outside through the language's or framework's abstractions, so each component can be exercised in isolation. A composition test checks the wiring, not each component's behaviour again; a one-call gate orchestrating independent suites is not a monolithic test.
- **Run the affected**: a change wakes the tests of the touched modules (crates, packages, subprojects) and their direct compositions, with the stack's fastest runner; the untouched don't run. The same test on the same content runs once: results are reused by content, and the local gate and CI don't repeat each other.
- **CI runs on the batch's PR and on trunk**, not on every branch push.
- Missing a content cache, path selection or a per-module layout is a defect to close in the same branch. Depart only under an explicit exception granted by the rule's principal that covers this repository and act; record its scope in `AGENTS.md`, `Local overrides`. A cost measurement alone is not permission. Write tests that make refactoring easy.

## After merge

A push shipped nothing; these acts hang on the merge, all mandatory, in the same move — also after a forge merge plus `git merge --ff-only`, which fires no hook. On work tasked by another agent, weaving, ending and reconciling are the tasker's; you leave the seed and delivery modes (**autonomous**).

1. **Weave** (**weaving**): what shipped → nodes and arrows with `sense` in the target system; repo mechanics stay in git. Zero nodes after a real change — say why.
2. **Advance the map**: open work stays `anga` on the transformation; its seed is never a log of the merge (**writing**, Decision 5).
3. **Switch modes on evidence it runs, not on merge.** The merge moves the map and the nodes of what the code now carries. A kriya goes `anagata`→`vartamana` (and up from `kalpita`) only when an actor does it, a rollout or an observed run shows it (**reality-audit**). None → it stays `anagata`; ask for what's missing in a vimarsha `posed_to` whoever runs it.
4. **End by axis** (**inquiry**), answer the `posed_to` inbox; as lead, `propose_close` with evidence.
5. **Reconcile** (**reconcile**): nodes against code, code against graph; the remainder as vimarshas.
6. **Feedback reflection** unless `AGENTS.md` sets `Feedback reflection` to `no`, and at session end without a merge: experience about the method, as a concrete instance (**feedback**); zero entries is valid.
7. **Vocabulary pass** over what landed.

Then cleanup; next task → `Before code`.

## Cleanup

With each finished piece — merged, delivered, answered, released — not at session end; a wake-up tick is the reminder to walk this list.

1. **Files**: the piece's worktree (`git worktree remove`), its merged branch (`git branch -d`), your scratch and development caches by name — gate logs, review trees, isolated run homes, `dist/`, `target/`, `.next/`, `node_modules` of your removed trees, the containers, images and build cache of your probes. Shared runner caches and others' stay; unsure whose → ask. A machine-wide sweep is not cleanup of yours: `docker system|volume|image|builder prune` without a filter on your own label, or `git clean` outside your own tree, deletes others' work for good. Yours carries a mark you can filter on — a run label, a volume name, your compose project; nothing to filter on → name it and ask.
2. **Cases**: `verstak_case(action="mine")`. Where no move of yours is awaited (task delivered, question answered, your share done): close your lines with their outcome (`line`); as lead, `propose_close` with evidence or hand the lead over (**lead**) — and once it closes, `leave`. Stay only where you await an answer or lead something open.

## Working principles

1. **Think before code.** Name assumptions; unsure → ask what exactly is unclear, in words, never via the harness's picker: in text only to someone answering now; the work runs in a case, and a question that outlives the turn goes there as an `ask` card (**collaborate**, `Asking the user`; no case → take one). Push back on a false premise or when a simpler move exists. Out of mandate → `posed_to` the owner role.
2. **Simplicity first**: the minimum; no speculative features or one-off abstractions; validate at boundaries.
3. **Stay inside the repo.** Outside the working directory: only reading carriers, the temp directory, the delivery's home. Another holon → a vimarsha on its node (`anga` to the transformation) and `verstak_case(action="talk", about=<subject>)` to its steward. Don't read, clone or survey repos outside your mandate: integration comes from the graph or the steward; what is in neither is a `posed_to` vimarsha.
4. **A second implementation is an event**: find both via **integrity**, name them to the user, propose reunifying or a named fork; a new consumer gets its arrows in the same move.
5. **Surgical changes**: only what the task needs; no reformatting neighbours; keep the style; the linter is authoritative; delete only what your change made dead, flag the rest.
6. **Execute from the goal**: a bug → a failing test first; multi-step → `step → check` pairs; runtime → the real environment; falsifier before looking.
7. **Meaning lives in the graph; code references it**: rationale, rejections ("not cached: #N"), how an integration works → a node, `(graph <name>, node #N)` in code; mechanics stay in words (**reconcile**, pass 3).
8. **Speak the project's language** until the user speaks the graph's.
9. **Declining and leaving**: an assignment by a message, a vimarsha by editing it; leave a transformation seed and a message in the case; the lead passes by agreement (**lead**).
10. **Fresh toolchain**: take delivery updates; an unpacked copy → check its version. A pin is a local override.
