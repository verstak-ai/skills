# `<project-name>`
`<one line: what this project is and who it serves>`

## What this project is
- **Nature**: `<production | research | sandbox | one-off | library>`. If not
  `production`, list which working principles are relaxed and why. No explicit
  relaxation = full production discipline (agents lean lenient by default).
- **NKS realm**: `<@owner/slug, immutable rN, or UUID — copied verbatim from
  nks_realm(action="list")>` — every session starts with `nks_orient` here. Any
  of the three addresses is durable (`rN` survives a rename); a bare slug
  without its owner is deprecated — never persist one. On first orient, verify
  the returned `REALM:` header before any graph write.
- **Focus holon**: `<#seq «name»>`, or `focus: realm root` if the whole realm
  is in scope.
- **Agent karta**: `<#seq «name»>` — adhikarin, steward of the focus holon.
  Your inbox: `nks_orient(focus="<seq>")` at session start (self-locate
  fallback: `nks_me(action="kartas")`).
- **Owner karta**: `<#seq «name»>` (svatantra 主) — out-of-mandate questions go
  here as `posed_to` vimarshas.
- **Stack**: `<language + primary frameworks, one line>`.
- **Production statement**: `<one paragraph: what ships, to whom, where, cost
  of breakage. Sandbox/research: state that breakage is cheap, what the
  project is for, and when it stops being cheap.>`

## Persistence rules
State lives in the **repo** or in **NKS** — nowhere else. The harness's built-in
memory (whatever it calls it — a per-project memory dir, conversation summaries,
`/tmp`, machine-local files) is **forbidden entirely, not by category**: nothing
goes into it, not a project fact, not a user preference, not a note on working
style. (why: local memory is invisible to every other agent and every other
machine, so it drifts silently — and it breaks flow reproducibility, which is
what makes a second machine or a second agent possible at all.)
- **Repo**: code, configs, conventions, code-level gotchas, branch state — the
  artifact itself.
- **NKS**: methodology, design decisions, open questions (vimarshas), plans,
  hand-offs, lessons, hints — the thinking around it. Don't restate NKS content
  in the repo; link to the vimarsha or holon.
- **Fetch state; never reconstruct it from memory.** No source for a "we
  decided…"? Stop and read NKS or the repo before acting.
- **External design/spec files are drafts to intake**, not the record — the
  graph holds the decisions; any such file is a view of them.
- **This overrides the harness's own memory instruction**, which invites a
  `project` memory category and will keep inviting it — the pull is strongest
  exactly when something feels worth keeping, and this file is long out of
  context by then. Route it instead, always: a repo convention or a fact about
  the code → this file; work state, a decision, an open question → a vimarsha
  in the realm; a fact about the user that no project owns (machines, people,
  cross-project findings) → their personal realm `@<handle>/mind` (`minding`).
  There is no residue the memory dir keeps — "it's only a preference" is how
  the category comes back.
- The local memory dir is **evacuated and frozen**: `MEMORY.md` holds a
  one-line prohibition stub pointing here, and the `PreToolUse` memory guard
  in the harness config blocks any write into it (exit 2) at the moment the
  save-instinct fires. Whatever had already accumulated there moves to its real
  home before the freeze — nothing is deleted unread.

## Session lifecycle
NKS = the work (structure, open questions, what's next). Git = how it got here
(SHAs, branches, PRs). **Keep git refs out of NKS** — no SHAs, branch names,
PR numbers, or "shipped/merged" in nodes (go stale on rebase).
- **Start of session:** orient in NKS — the realm named in *What this project
  is*, focus holon if set; orient by the ACTIVE BIANHUA map (`lens="bianhua"`
  for the forest) — open work lives as anga-vimarshas on transformations; a
  `genre=hint` seed, if any, is a pointer for what the map doesn't carry. The
  `entry` skill runs the protocol. Then open your agenda:
  `nks_orient(focus=<agent-karta-seq>)` — incoming `posed_to` vimarshas are
  your inbox; pick up or explicitly defer each before starting repo work.
- **A decision is recorded the moment it is taken, not when it is done.**
  Wherever it arrives — the user says it in chat, a person's word comes over
  the socket, two agents settle it between themselves — it stands in the graph
  **immediately**, with the modes it actually has right then: epistemic no
  higher than `anumita`, ontic `anagata`, volitive `chanda`/`adhimoksha`. The
  modes move later, as it is built; the record does not wait for them. Write
  who decided and what counts as carrying it out. (why: a decision left in the
  conversation that carried it dies with that conversation — the next session,
  and every other doer, sees a repo that simply disagrees with an intent
  nobody can find. Recording it late is the same failure with a delay: what
  gets written after the fact is what you remember deciding, which is not the
  same thing.)
- **Every task is described before it is begun.** Before the first change
  outside the graph: the task stands there as a deed with its before/after,
  its inputs and what it produces. While it runs, the graph moves with it —
  what changed, what turned out otherwise, what it opened. On **merge** (not
  on push — a branch that merged nothing shipped nothing) the modes flip to
  what the merge actually made true. Then **reality-audit**: verify the claim
  against the deployed artifact, not against the diff, and only then let the
  node say so. A mode flipped ahead of the evidence is a claim you have not
  checked, and it reads exactly like one you have.
- **Before work leaves the graph:** once the decision is taken and before the
  first change outside NKS, the deeds you are about to do stand in the realm in
  the project triad — ontic `anagata`, epistemic no higher than `anumita`,
  volitive `chanda`/`adhimoksha` — each volitional kriya attached by `anga` to
  the transformation it constitutes. Mark what you are about to do, not the
  whole design: a deed you cannot state as a transition (this ahara, that
  utpatti) is a signal to think, not to write more nodes. Marking is not
  deciding — a telos, a scope, a new transformation stay the owner's. (why: a
  graph written after the deed can never be wrong, and a record that cannot be
  wrong carries no knowledge — the projection is what makes the mode flip below
  evidence rather than bookkeeping; and until the deeds stand in it, the
  transformation shows nothing in flight, so a second doer reads it as idle.)
  `design` carries the *how*.
- **Every merge → update NKS.** A push that only opens or updates a PR ships
  nothing: record an answer where one genuinely stands, and leave bodies and
  modes describing what the trunk actually carries. Once it merges, every move
  below is required:
  - **Match reality.** First confirm the fresh canonical changed path and the
    exposed old requirements were exercised in the artifact. If that evidence
    is missing or contradicted, do not upgrade or end graph claims. Then record
    what positions the change in the target system:
    architecture, module APIs, supply/delivery, user experience, integration
    with neighbouring code. Repo-only mechanics — lockfile churn, internal
    refactors with no outside impact, commands, file moves — stay in git, not
    NKS.
  - **Advance the map.** Keep open work attached via `anga` to the bianhua it
    drives. A thin `genre=hint` seed is left only for what the graph can't carry
    — external-world state, chosen priorities; pointer, not payload
    — never by default.
  - **Close by axis, not by feeling done.** Record the answer as `addressed_by`
    to the node that carries it — that raises confidence, it does not end the
    question. Release (`visarjana`) is a separate, volitional act, and what it
    takes first depends on the question: a distinction is answered by its form,
    a behavioral claim needs the observation on its carrier (*Reality*).
    Release it yourself when three things hold together — the answer stands in
    the realm as a node rather than in your recollection, the repo shows it, and
    reality shows it as far as reality is reachable; where it is not reachable,
    the user's word stands in its place and you asked for it. Short of all
    three, prepare the release and present it to the owner instead of assuming
    it. Release is not the only ending — park, supersede, or crystallize what
    the question taught.
  - **Update the evidenced contour** — the counterpart of the marking above.
    Walk the whole contour the push designed
    — not only the nodes you happened to touch — and for each node the
    executable evidence actually realized, make **one** terminal update carrying
    its final modes (anagata→vartamana, kalpita→pratyakshita). No ceremonial
    intermediate modes, no unrelated nodes swept because a round ended, and
    nothing flipped past what the evidence covers: a mode flip is a claim.
  - **Work the inbox.** The `posed_to` questions your work and its evidence
    answered end by the rule above; park or group the stale ones.
  - **Vocabulary pass.** Re-read what you are about to land — repo text and graph
    nodes alike — for borrowed project-management words (ticket, backlog, sprint,
    epic, story, done, blocker, committed). Do **not** swap them yourself: name
    each one to the user and ask what this project calls it, in the same move.
    (why: renaming is the owner's act, and a confidently wrong replacement is
    worse than the word it displaced — it reads as native, so nobody questions
    it again.)

  `inquiry` carries the *how* of the questions — ending them by axis, and
  working the inbox. `weaving` carries the *how* of the structure the push left
  behind — closing lifecycles, sense on arrows, threading the holon. Reach for
  `design` only where the push opened a structural choice instead of settling
  one; it builds paths from goals and has no part in ending a question.
- **Design completion criterion:** a design is not *done* until its decisions,
  risks, and lifecycle are in the realm — whichever skill elicited it.
  Persisting to the graph is memory-work, not implementation, so design-phase
  gates on implementation don't apply to it. A design/spec file another suite
  writes is a draft view — intake it **in the same session** (never defer graph
  landing to a future push). Working autonomously (owner absent): still land
  decisions and risks now; propose the transformation (bianhua) with its telos
  marked for owner confirmation rather than skipping it.
- **Execution suites lead execution.** Planning, TDD, debugging, verification,
  review and their kin belong to whatever execution suite is installed; NKS
  carries the memory/design plane only. Decisions and risks born during
  execution still land in the realm **before the session ends** — never gate
  them on a future push/commit.
- **A claim you made is not a claim you accept.** Behavioral claims — "the fix
  works", "the endpoint answers", "the migration ran" — close on a cold
  `verifier` subagent's verdict, never on your own re-reading. Give it the
  claim, the carrier and the falsifier from *Reality*, and **wait for the
  verdict** before ending anything by the rule above. (why: you cannot see your own change as it
  is, only as you meant it.) Where this repo has no verifier role, make the
  observation yourself against the carrier — never close a behavioral claim on
  the source that was supposed to produce it.
- **Hooks merge.** Where the harness has a hooks file, entries from different
  suites coexist — add alongside, never overwrite another suite's.
- These reminders are automated where the harness supports it: a session-start
  hook, a post-`git push` hook, and a memory-write hook — verify all three
  wired. Where the interop stamp below says `full`, a fourth spec-write reminder
  rides along; otherwise it must not be wired. <!-- Fill in the harness's own
  paths (Claude Code: `.claude/settings.json`); on a harness with no hook
  surface, drop this bullet — the rituals above still bind, unautomated. -->
- **Keep this file honest.** It is generated by `verstakify` and stamped at the
  bottom with the contract it came from. Re-run `verstakify` when the installed
  skill declares a newer contract, or when the sources this file derives from
  have moved since the stamp — `git log -1 --format=%cd -- <those files>` against
  the stamp date settles it in one command. (why: a stale AGENTS.md is read with
  full confidence every session, so it misleads harder than no file at all.)
- **Keep your own toolchain current.** Updates are **on by default**: take them
  as the channel delivers them, don't pin. (why: an outdated skill drifts from
  the tool surface it names and degrades you silently — nothing crashes, the
  method just goes wrong.) <!-- opt-out: replace this bullet with
  the pin + the reason, e.g. "pinned to verstak@X.Y — <why>"; a pin without a
  recorded reason is drift with extra steps. --> Where the install channel has
  no auto-update — a plain unpacked copy under the agent's skills dir — the
  presumption can't hold: check the installed version before a session that will
  lean on the skills, or move to a channel that carries updates itself.
- **Skill names in this file are meant to be invoked, so they must resolve.**
  How a skill is addressed depends on the install channel — a plugin namespaces
  its skills, a flat unpack leaves them bare — so the names written here are the
  ones that resolve on `<this project's channel>`. If one of them doesn't
  resolve for you, that is a defect in this file, not your problem to route
  around: say so, and try the other form before working by feel. (why: an
  unresolvable name raises no error, it raises a shrug — the reminder still
  fires, the doer still reads it, and the method it was pointing at silently
  doesn't run.)

### After a green push: self-review
Quality gate green and the iteration done → re-read your diff for: bugs,
fragile spots, weak error handling, DRY/SOLID violations, repeated patterns,
missing or useless tests, files over 150 lines or god-units mixing many concerns
(split by concern; extract large inline test blocks to a sibling file). Fix in
the **same branch** and push again, or state plainly that nothing surfaced. Don't
fake findings.

### Branch discipline
One branch through to its merge — commit follow-ups into it, don't chain new
branches before it merges. After the branch merges (however this project merges
— see *Definition of done*), clean up locally:
1. `git checkout main && git pull`.
2. Delete the merged branch (`git branch -d <name>`); prune others now on
   `main`.
3. Update NKS: change is on `main`, not a branch — thread shipped state into
   the holon (`weaving`), end what the merge settled by the rule above
   (`inquiry`).
4. Confirm cleanup is done before the next task.

**The signal starts the sequence.** Steps 1–4 are owed to the merge event
itself, not to a quiet moment after it. An agent on a live channel never
reaches "nothing else in flight" — the next arrival lands while it is still
tidying — so a ritual conditioned on calm never runs at all, and the skip is
free on the day you make it and costs a conflict several merges later, too far
from its cause to connect from the inside. The mechanics are delegable to a
subagent while your current work stays in flight; noticing the event is not.

**Prove freshness, don't recall it.** Start each branch from a freshly fetched
trunk, and check at push time that it still descends from one:
`git merge-base --is-ancestor origin/main HEAD`. This is worst right after a
merge, when the tree looks current and is not — where this project squashes, a
merged branch's own commits exist nowhere on the trunk, so branching off one
replays work that already landed and the PR conflicts with itself.

## Working principles
1. **Think before coding.** State assumptions; ask when uncertain — name
   *what's* unclear, not just "which option". Surface competing
   interpretations; push back when a simpler approach or false premise is
   visible. Check repo + NKS before writing; fetch, don't recall. Hit the
   live system before trusting a type, a name, or a doc. Out-of-boundary or
   authority-exceeding questions become vimarshas `posed_to` the owner's 主
   karta — not silent decisions, not chat-only asks.
2. **Simplicity first.** Minimum code for the task. No speculative features, no
   abstractions for single-use code, no error handling for impossible cases.
   Validate at boundaries; trust internal invariants. 200 lines that could be
   50 → rewrite.
3. **Stay inside the repo boundary.** Never leave this repository's working
   directory. A change belonging to another holon — another repo, service,
   or team's contour — is not yours to make across the border: record it as
   a vimarsha on that holon's node in its realm, anchored where that holon's
   owner orients, `anga` to the bianhua it serves.
4. **The second implementation is a reportable event.** About to write something
   that already exists elsewhere — the same component for a second consumer, the
   same rule in a second service? Say so: name both places and propose either
   re-joining them or a named, deliberate fork. Check *Shared surfaces* before
   adding a consumer to anything listed there.
5. **Surgical changes.** Touch only what the task needs. Don't reformat or
   refactor adjacent code. Match existing style; the linter is authoritative.
   Remove only the dead code your change created; flag the rest, don't delete.
6. **Goal-driven execution.** Tasks → verifiable goals. Bugs: pin with a
   failing test before patching (no ad-hoc curl/bash debugging). Multi-step:
   state plan as `step → verify` pairs, loop until each passes. Runtimes (UI,
   service, integration): verify in the real environment (browser, real API,
   downstream system), not just unit tests — *Reality* names this project's
   carriers and who can reach them. Name the falsifier before you look ("what
   observation would refute this?"), and observe the carrier itself, not the
   source that was meant to produce it. Before claiming `verified`, `done`,
   `integration green`, or `no work remains`, run the `reality-audit` skill: it
   freezes each required claim and carries it to one truthful verdict. A clean
   graph, or an internal/mock-only test that misses the canonical public
   boundary, is not a release verdict; unavailable evidence stays
   `provisional`/`blocked`. Ending the questions your change touched follows
   *Session lifecycle* — by axis, not by feeling done.
7. **Read before answering an open-ended ask.** Tasks framed as *discuss / think
   through / figure out / research / design / plan / analyse / investigate /
   explore / "what do you think"* — anything beyond "do X concretely" — are
   answered from recorded thinking, not from training data: query the realm
   first, several ways (one miss ≠ absent). The `entry` skill runs the protocol
   and locates the realm that holds the answer.
8. **Think in NKS, speak the project's language.** The graph's structural
   vocabulary — kriya, phenomenon, holon, karta, vimarsha, the three mode axes —
   is for reasoning: it carries distinctions ordinary language drops, and losing
   it is how "release by the volitional axis" decays into "close the ticket". It
   does not appear in what you say to the user — not once, not for precision —
   unless they used it first. Translate into this project's own words, and the
   glossary is at hand: the realm's holon and phenomenon names, and the
   vocabulary of the code. The same split governs the graph itself — structural
   terms *type* a node, the domain's words *name* it.
   Talking *about* the work is a third register, and the one that goes wrong:
   ticket, task, sprint, backlog, story, done are in neither glossary, because
   they describe work rather than belong to this project. Use plain description
   instead — a question, a change, what is open, what this settles. (why: a
   borrowed word arrives with its method's script — a question turns into an
   issue "to be closed", a transformation into an epic — and you then act by the
   borrowed script instead of by what is actually in front of you.)

## Shared surfaces
<!-- Authored slot — no checkable source, so ask the user; omit the section only
if the answer is genuinely "nothing is shared". List each component, schema,
contract or rule with more than one consumer, and who those consumers are.
Touching one obliges checking the others (Working principle 4). -->
| Surface | Consumers | Note |
|---------|-----------|------|
| <component / schema / contract> | <system A, system B> | <shared on purpose, or a fork we accepted and why> |

## Reality — what a claim is verified against
<!-- Authored slot — ask the user, derive nothing; every project answers it
differently (code, data, infrastructure, content). NKS is the model of the work,
this repo part of its embodiment; this names the third thing — what the work
becomes when it runs, and how to look at it. Ask: where does a change land? what
effects does it produce? which of them are observable, with exactly what
command, URL, dashboard or query? what does the agent reach alone, what needs
the user? A row the agent can't execute is worth nothing. -->
| Claim class | Canonical carrier | How to observe | Who can |
|---|---|---|---|
| <what kind of claim this row settles> | <the thing that settles it: the built artifact, the live endpoint, the migrated table, the deployed host — never the source that was supposed to produce it> | <exact command / URL / query> | <agent \| user> |

**Ceiling**: `<claim classes with no reachable observation, and why — the past,
a third-party system, a surface the agent may not touch. Their honest top is
inference or converging independent sources; they are never closed as verified.>`

**This table grows by use.** The interview only seeds it. The moment a session
teaches you something it doesn't hold — a carrier nobody named, an observation
that turned out reachable, one that turned out not to be (→ *Ceiling*), a command
here that was wrong — write the row *then*, in that session, before the work that
taught it is closed. (why: an unrecorded carrier is one the next agent doesn't
find, so the same claim gets accepted on weaker evidence next time.)

## NKS ↔ repo: where things live
| Concern                                | Repo            | NKS                      |
|----------------------------------------|-----------------|--------------------------|
| Code, configs, lockfiles               | ✓               |                          |
| Commands, conventions, gotchas, stack  | ✓ (AGENTS.md)   |                          |
| Current branch state, how to verify    | ✓ (HANDOVER.md) |                          |
| Gaps in external systems we depend on  | ✓ (MISSING_*.md)|                          |
| Methodology, ontology                  |                 | ✓                        |
| Design decisions, open questions       |                 | ✓ (vimarshas)            |
| Plans, task lists, session hand-offs   |                 | ✓ (project realm)        |
| Lessons, hand-offs                     |                 | ✓ (graph first; thin `genre=hint` for off-map remainder) |
| Commit history, PRs, SHAs              | git             | (never NKS)              |
<!-- HANDOVER.md and MISSING_*.md rows are optional — keep them only if the project uses those files; drop them otherwise. -->

## Stack
`<versions + critical libraries the one-liner in *What this project is* doesn't
already cover; lockfiles carry the rest. Omit this section entirely if the
one-liner says enough.>`

## Commands
`<table: build / test / lint / dev / format. Lint runs zero-warning where the
stack supports it.>`

## Project structure
`<top-level dirs, one line each. Path aliases here too. Keep readable, not
exhaustive.>`

## Code conventions
`<only what the linter doesn't enforce:>`
- `<naming / import style / forbidden patterns + why-forbidden>`
- **Test discipline**: `<unit | unit+integration | +e2e; coverage threshold
  for production>`.
- **Verification surfaces**: `<public API/UI/config/runtime boundary for each
  load-bearing behavior; canonical command or environment; honest fallback and
  literal blocker when unavailable>`.
- **Gotchas**: `<runtime traps types/linter miss — hook return shapes, async
  races, env-specific behavior, library quirks, CI-parity gaps, shared
  build/test state, tracked secret/env files. One paragraph each.>`

## What to update when
- `AGENTS.md` — commands, structure, conventions, or stack change; a reality
  carrier appears, moves, or becomes reachable/unreachable.
  <!-- Keep this row only where CLAUDE.md is a copy rather than a symlink or an
  import (Windows checkouts): -->
- `CLAUDE.md` — regenerate the copy whenever `AGENTS.md` changes; it is a
  duplicate, never edit it directly.
- `HANDOVER.md` — current branch state shifts (branch, what's runnable/blocked).
  Not a changelog (that's commits + NKS).
- `MISSING_*.md` — a need surfaces that an upstream/downstream system doesn't
  satisfy yet.
- NKS (project realm) — every push (see *Session lifecycle*).

## Git workflow
- **Conventional commits** (`feat:`/`fix:`/`chore:`/`refactor:`/`docs:`/
  `test:`). Branches `feat/…`, `fix/…`, `chore/…`. PR titles same format.
- **No co-author trailer** unless the user asks.
- **Where the project squash-merges, the PR title is the only commit that lands
  on the trunk.** Everything your branch said in its own commit messages
  collapses into that one line, so whatever reads the trunk's history — release
  automation, a changelog, a version bump — sees the title alone. Give the PR
  the highest type its branch carries, and write the title knowing it becomes
  the changelog entry. `<state here how this project merges, since it decides
  whether commit messages or the PR title carry the release>`
- **Who does which act.** Committing and pushing your branch are yours — do
  them, don't offer them as a choice ("push, or keep working?" is the same ask
  in a different coat). Opening the PR is yours too, with
  `<the forge's own CLI — gh | fj | glab | tea, derived from the remote>`.
  **Merging is the user's alone**: never merge — not on green checks, not on an
  approval, not because it's a one-liner.
- **After the PR is open, follow it yourself.** Having nothing else in flight is
  not a reason to go idle or to ask what's next: watch the checks, and watch
  whether it merged — `<the forge's watch command, e.g. gh pr checks <n>
  --watch>`. Push fixes into the same branch when they go red. If you hold a
  live channel, keep its socket open while you wait: a review comment, a
  question, or the merge itself can each reach you there rather than at your
  next tact.
- **Local gate**: a pre-commit hook (Husky / lefthook / pre-commit) runs linter
  + formatter (+ typecheck) on staged files — or, if the project has none, run
  them manually before pushing. CI enforces them regardless.
- **Definition of done**: `<the project's merge flow + how the agent learns a
  branch merged, by its own watching rather than by being told — e.g. PR into
  main opened with <cli>, checks green under <cli>'s watch command,
  zero-conflict merge by the user. Branch discipline and "follow it yourself"
  both point here for the signal, so fill this in.>`
- **Never** `--no-verify`, `--force`, `--no-gpg-sign`, or `git reset --hard`
  without explicit user instruction.

*(verstakify: contract `<YYYY-MM-DD>` — re-run when the installed contract is
newer, or when the sources this file derives from have moved since.)*
