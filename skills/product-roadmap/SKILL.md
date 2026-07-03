---
name: product-roadmap
description: "Use this skill to build a product roadmap for a GitHub repository — or a multi-repo product (a whole org, or a set of repos forming one product) — derived from its issues and PRs through an NKS reasoning graph. Triggers: 'roadmap from repo', 'build a roadmap from issues', 'roadmap from github', 'roadmap for my org', 'multi-repo roadmap', 'roadmap across repos', 'quick roadmap', 'roadmap teaser', 'собери роадмап из issues/PR', 'роадмап по продукту', 'что в этом репо делать дальше', product-roadmap. Role-plays the maintainer: verified present-state ground, weighted backlog as shabda, directions underway (bianhua), rendered as graph + markdown + local HTML. Composes verstakify, intake, and assembly. Needs the gh CLI and nks_* MCP tools."
---

# Product Roadmap

Turn a GitHub repo **you maintain** — or a multi-repo product — into a roadmap you
can act from. The value (the solo-dev promise): own the context scattered across
the codebase and the issue/PR backlog, and let the graph surface *the directions
the project is actually under* — not a flat ticket list.

You role-play the **maintainer**. The pipeline:

```
frame + bootstrap realm  →  model the current product (vartamana ground)  →
harvest milestones + issues + PRs  →  weight by author  →  write to graph (shabda intake)  →
assembly (figure-on-ground bianhua)  →  render (graph + markdown + HTML)  →  verify
```

This skill **composes** three others: `verstakify` (understand the codebase, set up
the realm/holon), `intake` (the source-independent shabda-intake discipline — the
spine of Step 5), and `assembly` (discern the bianhua — the heart of Step 6). It
adds the GitHub **adapter** (Steps 3–4) and the roadmap **render** (Step 7).
`references/self-checks.md` is the full verification gate — Step 8 runs it; never
publish without it.

## Commitments — hold these through every step

- **Figure on ground.** Issues/PRs are the *delta* — what people want changed; on
  their own they read as ticket triage. Model the product that exists first, as a
  verified `vartamana` ground visibly distinct from the `kalpita`/`shabda` backlog.
  Every direction then transforms something real.
- **Leverage the graph, not just its text.** Actors are kartas with real edges;
  figure-on-ground is a graph-legal link; core flows are an `ahara`/`utpatti`
  estafeta; structural risks come from the graph's own tensions. A roadmap that
  could have been a flat markdown list never used the graph — and any leverage the
  prose claims must be carried by edges (the `integrity` skill's claim-audit mode
  is the check).
- **One product, even across many repos.** ONE focus holon; each repo a top-level
  subsystem; the cross-repo flow as the headline. Never N stapled roadmaps. Confirm
  with the maintainer which repos are in the product before modeling.
- **Read-and-refresh, never re-seed (the re-run contract).** An existing realm is
  oriented into and refreshed **in place** — locate-before-write on every write:
  update what exists, add only the genuinely new, close what shipped. A missing
  realm is *proposed*, never silently created. The output is a snapshot of the
  present, not a cross-run journal.
- **Honest before impressive.** An empty or thin backlog is stated, never padded;
  selection caps are declared; superlatives only over sets you actually computed;
  every cited primitive verified. The full guard list lives in
  `references/self-checks.md`.
- **Reference discipline.** `#N` is reserved for real GitHub issue/PR numbers.
  Multi-repo: every ref is repo-qualified with the full repos key (`backend#1`) —
  no ad-hoc abbreviations, no grouped or ranged refs, no bare `#N`. Internal graph
  seqs take a non-repo prefix (`NKS#1120`). Directions are referenced as `D1`/`D2`
  or by name.

## Prerequisites

- `gh` CLI authenticated (`gh auth status`); target repo(s) accessible.
- **A local checkout of each in-scope repo** (`git clone --depth 1`; private:
  `gh repo clone`). Step 2 reads real code structure — modeling from `gh` metadata
  alone under-serves the product.
- nks_* MCP tools; a realm per the re-run contract above.
- Run heavy steps (product model, harvest, graph writes, assembly, render) via
  subagents; hand results between steps as **files on disk** and return short
  confirmations + paths — large returns drop the connection.

## Step 1 — Frame and bootstrap

- Identify the target — one `owner/repo` or the repo set (org or maintainer-named
  list) — and the product boundary in one line. Multiple repos: confirm they are
  one product and which are in scope.
- Locate the realm + focus holon first (`nks_realm` list; `nks_orient` /
  `nks_semantic_search`). Exists → orient in and treat the run as an incremental
  refresh. Absent → propose creation, create only on the maintainer's go-ahead.
- Exactly **one focus holon** named after the **product**, `contains`-linked from
  root — one holon even across many repos, never one per repo.
- A `verstakify`-style read sets up the realm/holon, but never write `AGENTS.md`
  into a repo you only role-play owning.

## Step 2 — Model the current product (the vartamana ground)

Skip this and the graph is all `shabda` — the roadmap reads as triage on a backlog
floating in a vacuum.

**Read what EXISTS:** README + docs (the product's own claim); CHANGELOG + releases
(`gh release list` — what actually shipped, current version); codebase structure
(top-level dirs/packages — the real subsystem boundaries, entry points, route
tables); config surface (flags, env vars); API surface (endpoints, CLI commands).

**Seed the ground in the Observation modus (Pt/Va/Up)** — witnessed, present,
accepted — strictly separate from the backlog:

| What you read | Node | given_as | modus |
|---|---|---|---|
| a subsystem (crawler, indexer, auth, storage) | **holon** | — | (boundary) |
| an existing capability ("full-text search") | **phenomenon** | vollzug / sachverhalt | Pt/Va/Up |
| a domain entity (Bookmark, Library, User) | **phenomenon** | bildung / sinn | Pt/Va/Up |
| a core flow the product performs today | **kriya** | — | Pt/Va/Up |
| a shipped fact confirmed by a release | phenomenon | sachverhalt | **Pm**/Va/Up |

- Nest subsystems under the focus holon (`contains`); capabilities/entities live
  inside their subsystem. **Multi-repo: the repos ARE the top-level subsystems**
  (`attrs.repo` on each); a repo may split further inside.
- **Grounding rules — every ground node:** cite a real primitive in
  `attrs.source_ref` (module path, config flag, endpoint, release tag;
  repo-qualified for multi-repo). Cite the **exact** primitive — the named symbol
  exists at that path; cite where the behaviour is **implemented**, not where it is
  read; prefer **executable primitives over prose docs**; read versions from the
  **manifest**, never a doc. A `vartamana` claim with no citable primitive is a
  guess — demote or drop it. Don't infer a capability from a feature request
  (that's backlog, not ground).
- **Scope:** the subsystems, the main domain entities, a handful of core flows — a
  map the maintainer recognizes as "yes, that's the product", not a full
  reverse-engineering.
- **Model the actors — karta test first (writing skill): only an addressable doer
  is a karta.** Two layers, from two different sources, never collapsed:
  - **Runtime operators** — who acts on / is served by the *live* system. External
    consumer → `agantuka` 客; internal operator (admin, moderator, onboarding
    staff) → `adhikarin` 能 — an *active* doer who responds and acts, never a
    passively-"served" party. A worker fleet / CI / cron is **not** a karta — it's
    a ⚙️ phenomenon (`upadhi`); promoting it to silence a no-actor tension is the
    anti-pattern that tension warns of. Modeled from the **ground** (the roles the
    code serves), because these people mostly never file issues.
  - **Development drivers** — who authors the *backlog*. Maintainer → `svatantra`
    主 (a delegated dev scope → `adhikarin`); a drive-by contributor → `agantuka`.
    This layer is all the harvest can see.
  The narrower the contributor set (solo project = one 主), the more the real actor
  signal hides in the runtime layer. A karta with zero edges is theater — wire it
  to the deeds it drives or drop it; every karta carries `manifested_as`.
- **Wire the core flows as an estafeta:** each core-flow kriya consumes (`ahara`)
  the phenomena it reads and produces (`utpatti`) the phenomena it writes,
  sequenced with `next` — the product's spine as a real relay (traced in Step 7),
  and the reason structural risks become computable. **Multi-repo: the cross-repo
  spine is the headline** — a kriya in repo A produces a *hinge phenomenon* (shared
  DB table, API contract, published artifact) that a kriya in repo B consumes; the
  hinge phenomena are the graph-level proof of one product.

## Step 3 — Harvest milestones + issues + PRs

`gh`, JSON. **Three sources** — the maintainer's committed plan lives in
milestones / a Projects board and is the strongest single signal.

- **Multi-repo:** harvest every in-scope repo, tag each item with its repo, treat
  coordinated work across repos as one cross-repo theme.
- **Milestones first:** `gh api repos/<owner>/<repo>/milestones?state=open`, then
  each non-"Backlog" milestone's issues. **Read each milestone's own description
  prose** — maintainers name goals there that have no issue. Also check Projects
  boards and pinned "roadmap" issues.
- **Issues:** `gh issue list --state open --limit <N> --json
  number,title,body,author,authorAssociation,labels,reactionGroups,comments,milestone,createdAt,updatedAt`
- **PRs (open + recently merged):** `gh pr list --state all --limit <N> --json
  number,title,body,author,authorAssociation,labels,state,milestone,additions,deletions,createdAt,mergedAt`
- **Selection = UNION, declared cap, never silent:** (a) every milestoned issue,
  (b) every accepted/approved/roadmap-labeled issue, (c) top-reacted /
  most-commented N, (d) recently-active N, (e) contributor PRs. Reactions alone
  drop already-decided low-reaction work — exactly what belongs on a roadmap.
  Don't window PRs to the newest N: a long-lived OPEN maintainer PR is high
  signal. Log the cap and what was excluded.
- **Empty/thin backlog is honest, not a failure:** do NOT invent items. The ground
  plus the merged-PR trajectory (`gh pr list --state merged` — what was recently
  built, in what direction) carry the roadmap; say so plainly in the render.
- Capture per item: number, title, trimmed body, **verified author login +
  authorAssociation (from the API, never inferred)**, labels, milestone,
  engagement, linked issues, state.

## Step 4 — Weight by author role

| authorAssociation | weight | note |
|---|---|---|
| OWNER / MEMBER / COLLABORATOR | high | maintainer voice |
| CONTRIBUTOR | high | has merged work — real |
| FIRST_TIME_CONTRIBUTOR / FIRST_TIMER | medium | judge by content + engagement |
| NONE (issue) | medium | a user need — keep if substantive |
| NONE (PR, no linked issue) | low | drive-by; admit only on real engagement |

Boost on engagement and `accepted`/`roadmap` labels; demote duplicates, `wontfix`,
bot authors, pure dependency bumps.

- **Milestone membership outranks reactions** — a next-release issue is committed
  work regardless of reaction count.
- **Verify authorship from the API, never infer** — attributing a community
  contribution to the maintainer corrupts the very weighting this step exists for.

## Step 5 — Write the backlog (shabda intake + roadmap overlays)

**Run the `intake` skill over the harvest** — Steps 3–4 are its GitHub adapter
(they supply each item's content / form / provenance / authority). intake owns the
spine, don't restate it: form → node type; epistemic mode by kind (`kalpita` for an
unverified request — the maintainer's own committed volition is *not*
kalpita-to-verify); `source_kind=shabda`; semantic dedup, locate-before-write;
`arose_from` anchor to the source; verify by pratyaksha and graduate the mode;
selectivity cap (Step 3's).

**One deliberate divergence from intake's table:** a feature-request lands here as
a **phenomenon** (a wanted capability, sinn/bildung) or a seed **kriya**
(anagata/chanda) — **not** intake's bianhua. Directions are discerned later by
assembly; Step 5 seeds the wanted capability, not the transformation.

GitHub PR forms intake's table doesn't name:

| Source item | Node |
|---|---|
| merged contributor PR | **kriya** (deed done) or the phenomenon it produced |
| open contributor PR | **kriya** (anagata) — work in flight |
| low-weight drive-by PR | skip, or low-priority phenomenon flagged as such |

**Roadmap overlays intake does not carry:**

- **Anchor each item to its subsystem** (`context` / `vimarsha_of` to the Step-2
  subsystem holon or the capability it extends) — the backlog clusters by
  subsystem. An item with no home is a signal: under-modeled ground (go back to
  Step 2) or genuinely new ground — say which. A cross-repo theme anchors to the
  focus holon and links each touched subsystem.
- **Dedup against the GROUND, not just the backlog:** a request matching a shipped
  capability is a *delta* — frame it "enhance X", never "add X"; if a basic form
  already ships, reframe to the real remaining gap. Naming an already-shipped
  capability as the to-build undercuts product mastery. Carry the GitHub ref
  (number, author, weight) in `attrs` for render traceability.
- **Set the in-moment modus honestly:** milestone-committed → `adhimoksha`;
  speculative request → `chanda`; projected work → `anagata`; the ground stays
  `vartamana`/`pramanita`. Model the field as it stands now; never pre-transition.
- **Give each backlog kriya its driving karta as `actor`** — the verified author's
  dev-driver karta, never the runtime actor. This is what makes "who owns this
  direction" a graph edge instead of a prose label.

## Step 6 — Assembly (discern the directions)

Run the `assembly` skill over the seeded realm: orient the field → triage free
vimarshas → discern **bianhua** → name + telos → anga the drivers → order with
`anantara`. Playing the owner, accept names/teloi inline, but keep the discipline:
a name must read for a human owner; a telos is the *destination quality*; never a
bianhua per single vimarsha; risks stay risks.

- **Refresh runs reconcile, never re-discern from zero:** update the telos / anga /
  order of directions that still hold, add a direction only for a genuinely new
  theme, close (visarjana) the ones whose work shipped. Never a twin direction.
- **Figure-on-ground as a real arrow:** the direction's driving kriya reaches the
  ground capability via `upadhi`/`context` — never a literal `ahara` from the
  bianhua (the graph forbids it). A direction whose driving kriyas touch no ground
  capability is floating: either genuinely new ground (say so explicitly) or a sign
  Step 2 under-modeled (go seed the missing capability).
- **Surface structural risks from the graph's own tensions**
  (`nks_orient(lens="tensions")`): a capability with no producing flow, an estafeta
  relay-gap, a deed with no karta — the graph's self-diagnosis, distinct from
  backlog-derived risks; a flat ticket list structurally cannot produce these.
  **Multi-repo: a cross-repo dead-recipe or relay-gap is the highest-value
  finding.** Fix pure modeling artifacts in place instead of reporting them.
- **Attribute each direction on two axes:** its **driver** (maintainer-led &
  committed / contributor-led & needs-review / community-requested & unowned —
  from the harvest kartas) and its **runtime target** (whom the changed system
  serves: external consumer 客 or internal operator 能 — from the ground). Don't
  collapse the second into the first — expect operator-facing directions (admin
  console, staff onboarding) alongside consumer-facing ones; on a solo product the
  driver axis flattens and the runtime target is where directions actually differ.
  Ownership is a **graph fact**: the direction's anga kriyas carry `actor` → the
  driver karta, or the label is downgraded to "inferred".
- **A coherent high-signal community theme earns a direction** even with no
  committed work — the top-reacted issues are roadmap signal; a deliberate deferral
  is marked "deferred but real", never silently dropped.
- **Milestones in full:** the committed near-term milestone is its own direction
  listing **every** open milestone issue — rank a top-N as gating, but state the
  total and that the rest remain; never a telos claiming completion off a partial
  list. Enumerate every OPEN milestone; a catch-all "Backlog" milestone is listed
  in full or explicitly marked sampled. A milestone-committed, maintainer-authored
  issue never loses its place to a lower-signal item on the same theme.
- **Every `anantara` edge needs evidence** — the issue/PR or maintainer statement
  that establishes it; your own architectural inference is marked heuristic
  (`kalpita`) and hedged in the render. **Don't over-call "blocked":** a direction
  with its own work in flight is *sequenced-after*, not blocked.
- **Name directions in the repo's audience language** — they become the roadmap
  headings the owner reads.

## Step 7 — Render (lead with the assembled picture)

The roadmap leads with the assembled cross-repo picture and what the graph found —
the differentiated value on the first screen, not buried. Three artifacts:

1. **Graph** — `nks_orient(lens="bianhua")`; the HTML renders it as a visual graph
   view (spine + directions in dependency order + structural-risk flags).
2. **`roadmap.md`**, in this order:
   - **"The product, assembled"** — subsystems (one per repo) + the cross-repo
     spine, one-two sentences; the real picture from ALL sources.
   - **"What the graph found"** — the tensions-derived structural risks, each
     tagged with the seam it crosses. Lead with these.
   - **"Next 3 moves"** — a 3–5 line action list.
   - **"What this product is today"** — the ground, every line cited to its
     primitive; proves product mastery.
   - **"How it works today"** — one core estafeta traced end-to-end
     (`lens="trace"`): the spine in one walk.
   - **The directions** in `anantara` order; per direction: the capability it
     extends, telos, driving items (verbatim titles + refs + author weight), the
     driving karta **and** the runtime target (客/能), the anga (driving
     question), open risks, what it unblocks.
   - **"Reading of the field"** — driving kartas (+ runtime targets), structural
     risks, the figure-on-ground map. Written for the maintainer, not the
     methodologist: gloss every NKS term in plain English on first use.
   - **"Signal audit"** — the top-reacted and top-commented OPEN issues (counts +
     query basis), each marked included / deferred / out-of-scope, with the
     engagement cutoff stated. Thin backlog → a trajectory table (per-repo
     merged-PR counts + themes). Exact counts, never estimates.
3. **`roadmap.html`** — do NOT hand-write the page. Copy
   `references/roadmap-template.html` and replace ONLY its `ROADMAP` data object
   (schema documented at the top of the template's `<script>`); the template
   renders design, ref links, author chips, status badges, filters, themes. All
   text is auto-escaped — paste verbatim titles. **Multi-repo:** fill the `repos`
   URL-map, put `repo:'<key>'` on every driver/signal ref and `directions[].repos`;
   write free-text refs as `<key>#N`; internal seqs as `NKS#…`. Single-repo: omit
   `repos` (template links via `repoUrl`).

Render in the repo's audience language. Quote cited titles verbatim.
**State-precision:** distinguish review / rebase / merge by draft state +
mergeability + CI + review; report the readiness breakdown per PR and recommend
the action that clears the *binding* constraint. `mergeable=null` → re-poll once,
then "mergeability pending", never "clean"; `mergeable=true` ≠ ready; a mergeable
PR is not "conflicting". Never bundle PRs of different states into one row; an
OPEN PR is never "shipped". **No un-computed superlatives** — a scoped claim or a
raw figure, never a global "#1" off the capped subset. **Coverage is what the
data/code path does**, not what a config or UI surface lists.

## Step 8 — Checkpoint and verify (fail loudly)

A roadmap that's never written is worth nothing; a run that dies silently and
ships nothing is the worst outcome.

- **Checkpoint as you go:** write each stage's raw output (`milestones.json`,
  `issues.json`, `prs.json`, the assembled skeleton) to the `--out` dir while
  gathering — a late failure leaves recoverable state.
- **Verify the write:** re-read the artifacts; assert non-empty and the required
  sections present; missing → say so loudly and fix, never report success without
  a verified artifact.
- **Run `references/self-checks.md` — every check.** Each PASS is earned over the
  full set it names; correct mismatches, re-render, re-check.
- **Keep returns small:** files on disk + a short confirmation with paths.

## Quick mode — the fast teaser

Triggers: `--quick`, "quick roadmap", "give me the gist", first-time onboarding.
Don't run the full pipeline (~tens of minutes); produce a one-screen teaser in a
couple of minutes — "it actually understands my product" — and offer the full run.
Same machinery, breadth-first and shallow:

1. **Frame** (Step 1) — product boundary; in-scope repos.
2. **Light ground** — the subsystems and the cross-repo spine (enough to draw the
   graph view) + the handful of core capabilities and entities; real primitives
   cited, scoped to the spine; seed just enough graph for the spine + a headline
   tension.
3. **Trajectory glance** — top merged-PR themes / the committed milestone; skip the
   full harvest and weighting depth.
4. **Top 3 directions + the single headline structural risk**; no full forest.
5. **Render the lead only** — graph view + a 3–5 line summary (*what this product
   is · what the graph found · the next move*) + an explicit pointer: "this is a
   teaser — run the full roadmap for the complete picture."

Discipline still holds: honest shabda/vartamana separation, no fabrication, every
cited primitive real, refs repo-qualified, empty-backlog honesty. Shallower, not
sloppier.

## Output contract

- A verified `vartamana` ground sub-graph (subsystems + capabilities + core flows),
  cited to real primitives, distinct from the `shabda` backlog.
- The realm seeded with traceable phenomena/risks — shabda-honest, deduped, capped.
- A bianhua map = the roadmap, sequenced, each direction anchored to the ground.
- The graph's leverage visible: actor kartas, figure-on-ground links,
  tensions-derived structural risks — gathered in "Reading of the field".
- `roadmap.md` + `roadmap.html` written locally; a "next 3 moves" list.
- All self-checks passed.

## What this is NOT

- Not a dump of every issue as a node — selective, weighted, deduped.
- Not a verstakify that writes AGENTS.md into a repo you don't own.
- Not a substitute for the maintainer's judgment — directions are hypotheses
  (shabda) until they confirm them.
- Not an all-shabda graph — directions transform a verified ground.
- Not N single-repo roadmaps for a multi-repo product.
- Not a graph-duplicator — re-runs refresh in place; missing realms are proposed.

## Sibling skills

- `verstakify` — codebase understanding + realm/holon bootstrap.
- `intake` — the shabda-intake spine of Step 5; Steps 3–4 are its GitHub adapter.
- `assembly` — the bianhua discernment ritual (Step 6).
- `writing` — node type/modes/arrows discipline for Steps 2 and 5.
- `weaving` — the tensions lens behind Step 6's structural risks.
- `integrity` — claim-audit mode: verify the rendered prose is carried by the graph.
