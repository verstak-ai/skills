# product-roadmap — a product roadmap derived from issues and PRs through the graph

**Use when:** the question is what a product should do next and its issues and PRs are the evidence — a GitHub repo or a multi-repo product (an org, or repos forming one product). Phrases: "build a roadmap from issues/PRs", "what should this repo do next", "roadmap for my org", "multi-repo roadmap", "quick roadmap", "roadmap teaser". Needs the `gh` CLI and the `verstak_*` tools.

You play the maintainer: a verified ground of the present product, a weighted backlog taken in as external text, and the graph surfacing *the directions the project is actually moving in* — not a flat list of tickets.

```
frame + graph bootstrap  →  model the current product (the vartamana ground)  →
harvest milestones + issues + PRs  →  weigh by author  →  write to the graph (shabda intake)  →
assembly (transformations: figure on ground)  →  render (graph + markdown + HTML)  →  verify
```

Composes `methods/align.md` (read the codebase, set up graph and holon), `methods/intake.md` (the spine of Step 5) and `methods/assembly.md` (the heart of Step 6); adds the GitHub **adapter** (Steps 3–4) and the **render** (Step 7). `references/product-roadmap-self-checks.md` is the gate Step 8 runs; nothing is published without it.

## Commitments — hold them through every step

- **Figure on ground.** Issues and PRs are the *delta*: model the existing product first as a verified `vartamana` ground, apart from the `kalpita` / shabda backlog, so every direction transforms something real.
- **Use the graph's leverage, not just its text**: roles with real arrows, figure on ground as a legal link, key flows as a relay, structural risks from tensions. Prose claims are carried by edges (claim-audit mode, `methods/integrity.md`).
- **One product, even across many repos**: ONE focus holon, each repo a top-level subsystem, the cross-repo flow as headline — never N stapled roadmaps. Confirm the repos in scope.
- **Read and refresh, never re-seed**: refresh an existing graph **in place** (locate before every write, add only the new, close what shipped); a missing one is *proposed*. A snapshot of the present, not a journal.
- **Accurate before impressive**: a thin backlog stated, cut-offs declared, superlatives only over computed sets, every cited primitive verified.
- **Reference discipline.** `#N` only for real GitHub numbers; multi-repo: the full repo key on every reference (`backend#1`) — no home-made abbreviations, groupings, ranges or bare `#N`. Graph seqs take a non-repo prefix (`VERSTAK#1120`). Directions are `D1`/`D2` or named.

## Prerequisites

- `gh` authenticated (`gh auth status`); target repos accessible.
- **A local checkout of every repo in scope** (`git clone --depth 1`; private: `gh repo clone`) — Step 2 reads real code; `gh` metadata alone short-changes the product.
- Graph craft is yours; harvesting, reading code and rendering go to subagents in the run's case (→ door, `Work goes to subagents`). Results pass as **files on disk** with short confirmations and paths (large returns drop the connection); check a step by its artifact, not its report.

## Step 1 — Frame and bootstrap

- Fix the target — one `owner/repo` or a set (an org, or a named list) — and the product boundary in one line.
- Find the graph and focus holon (`verstak_realm` list; `verstak_orient` / `verstak_semantic_search`): exists → incremental refresh; missing → propose, create only on the go-ahead.
- Exactly **one focus holon**, named for the **product**, `contains` from the root.
- Never write `AGENTS.md` into a repo whose ownership you are only playing.

## Step 2 — Model the current product (the vartamana ground)

**Read what IS:** README and docs (the claim); CHANGELOG and `gh release list` (what shipped, current version); code structure (subsystem boundaries, entry points, route tables); config (flags, env); API surface (endpoints, CLI commands).

**Seed the ground in observation modes (Pt/Va/Up — observed, in effect, accepted)**, apart from the backlog:

| What you read | Node | given_as | modes |
|---|---|---|---|
| a subsystem (crawler, indexer, auth, storage) | **holon** | — | (a boundary) |
| an existing capability ("full-text search") | **phenomenon** | vollzug / sachverhalt | Pt/Va/Up |
| a domain object (Bookmark, Library, User) | **phenomenon** | bildung / sinn | Pt/Va/Up |
| a key flow the product runs today | **kriya** | — | Pt/Va/Up |
| a shipped fact confirmed by a release | phenomenon | sachverhalt | **Pm**/Va/Up |

- Subsystems nest under the focus holon (`contains`), capabilities and objects in their subsystem. **Multi-repo: the repositories ARE the top-level subsystems** (`attrs.repo`).
- **Grounding:** the real primitive in `attrs.source_ref` (module path, flag, endpoint, release tag; repo-qualified) — the **exact** symbol at that path, where behaviour is **implemented** not read, **executable over doc prose**, versions from the **manifest**. No citable primitive → a guess: downgrade or drop. A feature request is backlog, not ground.
- **Scope:** a map the maintainer recognises as "my product", not a reverse-engineering.
- **Actors — role test first (`methods/writing.md`, Decision 1).** Two layers, never collapsed:
  - **Runtime operators** — who acts on or is served by the live system, from the **ground** (they rarely write issues): external consumer → `agantuka` 客; internal operator (admin, moderator, staff) → `adhikarin` 能, an *active* actor, not a "served" party. Workers / CI / cron are a ⚙️ phenomenon (`upadhi`), not a role — never promoted to silence `no-actor`.
  - **Development drivers** — who authors the backlog (the only layer the harvest shows): the maintainer → `svatantra` 主 (a delegated dev scope → `adhikarin`); a drive-by contributor → `agantuka`.

  The narrower the contributor circle (solo = one 主), the more the actor signal hides in the runtime layer. A zero-arrow role is theatre: wire or drop it; every role carries `manifested_as`.
- **Key flows as a relay:** each key-flow kriya `ahara`s what it reads and uses up, `utpatti`s what it writes, in a `next` sequence — the spine that makes structural risks computable. **Multi-repo:** a kriya in repo A produces a *hinge phenomenon* (shared table, API contract, published artifact) a kriya in repo B consumes; hinges prove one product.

## Step 3 — Harvest milestones, issues and PRs

`gh`, JSON, **three sources** — the maintainer's committed plan (milestones / Projects board) is the strongest single signal.

- **Multi-repo:** every repo in scope, items tagged by repo, coordinated work as one cross-repo theme.
- **Milestones first:** `gh api repos/OWNER/REPO/milestones?state=open`, then the issues of every non-"Backlog" milestone; **read each description** (goals without issues). Also Projects boards and pinned "roadmap" issues.
- **Issues:** `gh issue list --state open --limit N --json number,title,body,author,authorAssociation,labels,reactionGroups,comments,milestone,createdAt,updatedAt`
- **PRs (open + recently merged):** `gh pr list --state all --limit N --json number,title,body,author,authorAssociation,labels,state,milestone,additions,deletions,createdAt,mergedAt`
- **Selection is a UNION, the cut declared and logged:** (a) every milestone issue, (b) every one labelled accepted/approved/roadmap, (c) top N by reactions / comments, (d) the N most recently active, (e) contributor PRs. Reactions alone drop decided work; don't window PRs to the newest N (a long-open maintainer PR is a strong signal).
- **A thin backlog is a fact:** invent nothing; the ground plus the merged-PR trajectory (`gh pr list --state merged`) carry the roadmap — say so.
- Per item: number, title, truncated body, **verified author login + authorAssociation from the API**, labels, milestone, engagement, linked issues, state.

## Step 4 — Weigh by the author's role

| authorAssociation | weight | note |
|---|---|---|
| OWNER / MEMBER / COLLABORATOR | high | the maintainer's voice |
| CONTRIBUTOR | high | has merged work — real |
| FIRST_TIME_CONTRIBUTOR / FIRST_TIMER | medium | judge by content and engagement |
| NONE (issue) | medium | a user's need — keep it if it has substance |
| NONE (PR with no linked issue) | low | drive-by; only with real engagement |

Raise for engagement and `accepted`/`roadmap` labels; lower duplicates, `wontfix`, bots, dependency bumps. **Milestone membership outweighs reactions.** **Authorship from the API, never inferred.**

## Step 5 — Write the backlog (shabda intake + roadmap additions)

**Run `methods/intake.md` over the harvest** — Steps 3–4 are its adapter (content, form, provenance, authority per item). The maintainer's own committed will is not `kalpita`-awaiting-check.

**One departure from intake's table:** a feature request lands as a **phenomenon** (a wanted capability, sinn/bildung) or a seed **kriya** (`anagata`/`chanda`) — not a bianhua; directions are discerned in Step 6.

| Source item | Node |
|---|---|
| a merged contributor PR | **kriya** (an action done) or the phenomenon it produced |
| an open contributor PR | **kriya** (`anagata`) — work in flight |
| a low-weight drive-by PR | skip it — or a low-priority phenomenon, marked |

**Roadmap additions:**

- **Anchor every item to its subsystem** (`context` / `vimarsha_of` → the Step 2 holon or the capability it extends). No home → under-modelled ground (back to Step 2) or new ground — say which. A cross-repo theme anchors to the focus holon, linking every subsystem it touches.
- **Dedupe against the GROUND too:** a request matching a shipped capability is "improve X", never "add X" — name the real remaining gap. GitHub reference (number, author, weight) in `attrs`.
- **Modes as they stand now:** milestone-committed or speculative → `chanda` (the milestone is evidence in `attrs` and ranking weight, not will); being designed → `anagata`; the ground stays `vartamana`/`pramanita`. **`adhimoksha` only from what the graph's owner said** — a milestone's setter may not hold this graph (`methods/writing.md`, Decision 3).
- **Each backlog kriya's `actor`** is the verified author's dev-driver role, never a runtime actor — ownership as an edge.

## Step 6 — Assembly (discern the directions)

Run `methods/assembly.md` over the seeded graph. Playing the owner, accept names and teloses inline, with its discipline intact; risks stay risks.

- **Refresh reconciles:** update directions that hold; add one only for a new theme; release (`visarjana`) shipped ones. Never a twin.
- **Figure on ground as a real arrow:** the leading kriya reaches a ground capability via `upadhi` / `context` — never `ahara` from the bianhua (forbidden). No ground touched → new ground (say so) or an under-modelled Step 2.
- **Structural risks from tensions** (`verstak_orient(lens="tensions")`): a capability with no producing flow, a relay gap, an action without a role. **Multi-repo: a cross-repo dead recipe or relay gap is the top finding.** Fix pure modelling artifacts in place.
- **Two axes per direction:** **driver** (maintainer-led and committed / contributor-led awaiting review / community-requested, no owner) and **runtime target** (consumer 客 or operator 能). Don't collapse them; on a solo product directions differ by target. Ownership is a graph fact: `anga` kriyas carry `actor` → the driver, else "inferred".
- **A coherent high-signal community theme earns a direction** without committed work; a deferral is marked "deferred, but real", never dropped silently.
- **Milestones whole:** a committed near-term milestone is a direction listing **every** open issue (a ranked top N names the total and the rest); no telos claims completion from a partial list. Every OPEN milestone listed; "Backlog" whole or "sampled". A committed maintainer issue never yields to a lower-signal one on the same theme.
- **Every `anantara` has evidence** (issue/PR or maintainer statement); your inference is a hedged `kalpita` heuristic. Work in flight means *sequenced after*, not blocked.
- **Name directions in the audience's language** — they become the owner's headings.

## Step 7 — Render (lead with the assembled picture)

The assembled picture and what the graph found go on the first screen. Three artifacts:

1. **The graph** — `verstak_orient(lens="bianhua")`; the HTML renders it (spine + directions in dependency order + risk flags).
2. **`roadmap.md`**, in this order:
   - **"The product, assembled"** — subsystems (one per repo) + the cross-repo spine, a sentence or two.
   - **"What the graph found"** — structural risks, each with its joint.
   - **"Next 3 moves"** — 3–5 lines.
   - **"What this product is today"** — the ground, every line cited.
   - **"How it works today"** — one key relay traced end to end (`lens="trace"`).
   - **Directions** in `anantara` order: capability extended, telos, leading items (verbatim titles + references + author weight), driver **and** runtime target (客/能), the `anga`, open risks, what it unblocks.
   - **"Reading the field"** — driver roles (+ targets), structural risks, the figure-on-ground map; every graph term glossed on first use.
   - **"Signal audit"** — top OPEN issues by reactions and comments (numbers + basis), each included / deferred / out-of-scope, threshold named; thin backlog → a trajectory table (merged-PR counts per repo + themes). Exact numbers.
3. **`roadmap.html`** — copy `templates/roadmap-template.html` and replace ONLY its `ROADMAP` data object (schema at the top of its script block); never hand-write the page. It escapes all text — paste titles verbatim. **Multi-repo:** fill the `repos` URL map, set `repo:'KEY'` on every driver/signal reference and `directions[].repos`; free references `KEY#N`, seqs `VERSTAK#…`. Single repo: omit `repos` (links via `repoUrl`).

Render in the audience's language. **PR state:** separate review / rebase / merge by draft + mergeability + CI + reviews; recommend the action removing the *binding* constraint; `mergeable=null` → re-query once, then "mergeability pending"; `mergeable=true` ≠ ready, ≠ "conflicting"; an OPEN PR is never "shipped"; never lump states in one line. **No uncomputed superlatives.** **Coverage is what the data/code path does**, not what a config or UI lists.

## Step 8 — Checkpoint and verify (fail loudly)

A run that dies silently and hands back nothing is the worst outcome.

- **Checkpoint as you go:** each stage's raw output (`milestones.json`, `issues.json`, `prs.json`, the skeleton) into `--out`, so a late failure leaves recoverable state.
- **Verify the write:** artifacts non-empty, required sections present; otherwise say so loudly and fix.
- **Run every check in `references/product-roadmap-self-checks.md`.**
- **Small returns:** files on disk + a short confirmation with paths.

## Quick mode — the teaser

Triggers: `--quick`, "quick roadmap", "give me the gist", a first look. A one-screen teaser in a couple of minutes instead of the full run (tens of minutes), then offer the full run:

1. **Frame** (Step 1).
2. **Light ground** — subsystems, the cross-repo spine, a few capabilities and objects, primitives cited; seed only the spine + one headline tension.
3. **Trajectory** — merged-PR themes / the committed milestone; no full harvest or weighting.
4. **Top 3 directions + one headline structural risk.**
5. **Render the lead only** — the graph view + 3–5 lines (*what this product is · what the graph found · next move*) + "this is a teaser — run the full roadmap for the whole picture".

Every commitment still holds: shallower, not sloppier.

## Output contract

A cited `vartamana` ground apart from the deduped shabda backlog; the transformation map as the roadmap, every direction anchored in the ground; `roadmap.md` + `roadmap.html` written locally; all self-checks pass.

Next moment: the user adopts a direction → `methods/integrity.md` on that transformation.
