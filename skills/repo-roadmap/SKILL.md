---
name: repo-roadmap
description: "Use this skill to build a product roadmap for a GitHub repository you maintain, derived from its issues and pull requests via an NKS reasoning graph. Triggers: 'roadmap from repo', 'build a roadmap from issues', 'roadmap from github', 'собери роадмап из issues/PR', 'что в этом репо делать дальше', repo-roadmap. Role-play as the repo's maintainer: first model the current product (its subsystems, capabilities, and core flows) as a verified present-state ground, then harvest issues + PRs (weighting contributor signal over drive-by noise) as the backlog, write them into the graph as phenomena + risks (shabda intake), run assembly to discern the transformations underway, and render a figure-on-ground roadmap as graph + markdown + local HTML. Composes verstakify (understand the codebase) and assembly (discern directions). Needs the gh CLI and nks_* MCP tools."
---

# Repo Roadmap

Turn a GitHub repo **you maintain** into a roadmap you can act from. The value
(verstak's solo-dev promise): own the context that's scattered across the
codebase + the issue/PR backlog, and let the graph surface *the directions the
project is actually under* — not a flat ticket list.

You role-play the **maintainer**. The pipeline:

```
frame + bootstrap realm  →  model the current product (vartamana ground)  →
harvest issues + PRs  →  weight by author  →  write to graph (shabda intake)  →
assembly (figure-on-ground bianhua)  →  render roadmap (graph + markdown + HTML)
```

This skill **composes** two others: `verstakify` (understand the codebase, set up
the realm/holon) and `assembly` (discern the bianhua and produce 形). It adds the
GitHub-harvest front and the roadmap-render back.

**Figure on ground.** A roadmap is only as good as the product understanding under
it. Issues + PRs are the *delta* — what people want changed; on their own they read
as ticket-triage. So before harvesting the backlog, **model the product that
exists** — its subsystems, capabilities, and core flows — as a verified
`vartamana` (present) ground, visibly distinct from the `shabda` backlog. Every
direction then reads as *figure on ground*: a transformation of something real, not
a free-floating wish. A roadmap built on no product model undercuts verstak's whole
promise ("own the product context").

**Leverage the graph, not just its text.** The methodology earns its place only if it
shows up in the roadmap. Model **who** acts (`karta`) and **wire** them — a karta with
no edges is theater; make figure-on-ground a **graph-legal link** (the direction's
driving kriya reaches the ground capability via `upadhi`/`context` — not a literal
`ahara` from the bianhua, which the graph forbids); wire the core flows as an `ahara`/`utpatti`
**estafeta** (each step consumes and produces typed phenomena); name the **`anga`**
(the open question that drives each direction); let the graph's own **tensions**
surface structural risks the backlog can't. The roadmap is a **snapshot of the
present** — one moment, built now, not a cross-run journal. A roadmap that could have
been a flat markdown list never used the graph.

## Prerequisites
- `gh` CLI authenticated (`gh auth status`). Target repo is public or accessible.
- **A local checkout of the code.** In the real maintainer scenario the repo is
  already local; otherwise `git clone --depth 1` it. Step 2 reads the actual code
  structure (module/dir names, entry points, config surface), not just GitHub
  metadata — modeling the product from `gh` alone under-serves it.
- nks_* MCP tools; a realm to write into (create + focus holon if absent).
- Heavy steps (product-model, harvest, graph-writing, assembly, render) should run
  via subagents to conserve the main context.

## Step 1 — Frame and bootstrap
- Identify the target `owner/repo` and the product's boundary in one line.
- Realm: create if missing (`nks_realm`); create a **focus holon** named after the
  product (the boundary "what is this project"), `contains`-linked from root.
- A `verstakify`-style read sets up the realm/holon, but we never write `AGENTS.md`
  into a repo we only role-play owning. The deep codebase read — the product model —
  is its own step (Step 2).

## Step 2 — Model the current product (the `vartamana` ground)
Before the backlog, model **what the product IS today** — the verified ground the
roadmap transforms. Skip this and the whole graph is `shabda`/`kalpita` (proposed,
unverified) and the roadmap reads as triage. This sub-graph is the *figure-on-ground*
foundation and the answer to "do you actually understand this product?"

**Read the sources of what EXISTS (verified, not proposed):**
- **README + docs** — the product's own claim of what it does.
- **CHANGELOG + GitHub Releases** (`gh release list`, `gh api repos/<r>/releases`) —
  what has actually *shipped*, and the current version.
- **Codebase structure** — top-level dirs / packages / module names (the real
  subsystem boundaries), entry points, the route/handler table. Read the actual
  checkout, not just `gh`.
- **Config surface** — config flags / env vars / settings: what the product can do
  is bounded by what it exposes.
- **API surface** — endpoints, CLI commands, public interfaces.

**Seed a current-state sub-graph in the *Observation* modus (Pt/Va/Up —
`pratyaksha`/`vartamana`/`upeksha`: witnessed, present, accepted).** This is the one
place in this skill that writes verified-present nodes; keep them strictly separate
from the backlog's `kalpita`/`shabda` (Step 4) so the graph visibly separates "what
is" from "what's proposed".

| What you read | Node | given_as | modus |
|---|---|---|---|
| a subsystem (crawler, indexer, search, reader, auth, storage) | **holon** | — | (boundary) |
| an existing capability ("full-text search", "AI auto-tagging") | **phenomenon** | vollzug / sachverhalt | Pt/Va/Up |
| a domain entity (Bookmark, Library, Series, User) | **phenomenon** | bildung / sinn | Pt/Va/Up |
| a core flow the product performs today | **kriya** | — | Pt/Va/Up |
| a *shipped* fact confirmed by a release/changelog | phenomenon | sachverhalt | **Pm**/Va/Up (proven) |

- **Nest subsystems under the focus holon** (`contains`); land capabilities/entities
  inside their subsystem holon. These subsystem holons become the spine the backlog
  clusters onto (Step 5) and the directions attach to (Step 6).
- **Cite a real primitive on every node** — the module path, config flag, endpoint,
  or release tag it came from (`attrs.source_ref`). A `vartamana` claim with no
  citable primitive is a guess: demote or drop it. Verify-before-write, don't infer
  a capability from a feature request (that's backlog, not ground).
- **Scope: enough to anchor directions, not a full reverse-engineering.** The
  subsystems, the main domain entities, and the handful of core flows — not every
  function. Aim for a map a new maintainer recognizes as "yes, that's the product".
- **Model the actors (`karta`), so deeds aren't actor-less.** Give the core-flow
  kriyas a performer — the system's workers (or the end user) as a `karta` — which
  resolves the *no-actor* tension those kriyas otherwise raise. Model the
  **maintainer(s)** as a `karta` too (`nks_add_karta`, with motivation): the role
  whose finite attention this roadmap serves. The author-weighting in Step 4 is really
  a karta distinction (maintainer voice vs drive-by) — making the kartas graph-real is
  the "own the product context" pitch made concrete, and lets Step 6 attribute each
  direction to who drives it. **Two karta layers, kept distinct:** the **runtime actor**
  of a core flow (worker fleet / user) vs the **development driver** of backlog work
  (maintainer / contributor). They are NOT the same karta — a maintainer-authored PR's
  kriya takes `actor` = the *maintainer* karta, not the worker fleet (Step 5). **A karta
  with zero edges is theater** (a graph audit will flag it); wire it to the deeds it
  drives or don't claim it owns anything.
- **Wire the core flows as an `ahara`/`utpatti` estafeta.** Each core-flow kriya
  *consumes* (`ahara`) the phenomena it reads and *produces* (`utpatti`) the phenomena
  it writes, sequenced with `next` — so the product's spine is a real relay in the
  graph (traced in Step 7), not a prose list. This is also what makes the
  structural-risk read computable: a capability with **no producing flow** (`utpatti`)
  is a real dead-recipe the tensions lens will catch in Step 6.

## Step 3 — Harvest milestones + issues + PRs
Use `gh` (JSON). **Three sources, not two** — the maintainer's *committed* plan
lives in milestones / a Projects board, and that is the strongest single signal
(a pure top-reactions cap misses it).
- **Milestones (committed plan — pull FIRST):**
  `gh api repos/<owner>/<repo>/milestones?state=open` then the issues of each
  non-"Backlog" milestone (`gh issue list --milestone "<title>" --json …`). A
  near-term version milestone is the maintainer's scheduled roadmap — its issues
  are committed work regardless of reaction count. **Read each milestone's own
  `description` prose, not only its issues** — maintainers name goals there that
  have no issue (a goal can live only in the milestone's description prose, with no
  issue of its own). Also check a Projects board or a pinned "roadmap" issue.
- **Open issues:**
  `gh issue list --state open --limit <N> --json number,title,body,author,authorAssociation,labels,reactionGroups,comments,milestone,createdAt,updatedAt`
- **PRs (open + recently-merged):**
  `gh pr list --state all --limit <N> --json number,title,body,author,authorAssociation,labels,state,milestone,additions,deletions,createdAt,mergedAt`

**Selection — UNION, not top-reactions (declared cap, never silent):** take the
union of (a) every milestoned issue, (b) every `accepted`/`approved`/`roadmap`-labeled
issue, (c) the top-reacted/most-commented N, (d) recently-active N, (e) contributor
PRs. Selecting by reactions alone drops *already-decided* low-reaction work — exactly
what belongs on a roadmap. Log the cap and what was excluded. **Don't window PRs to
the newest N only** — a long-lived OPEN maintainer-authored PR is high signal and
must be included even if it's old.
- Capture per item: number, title, trimmed body, **verified author login +
  authorAssociation (resolved from the API, never inferred)**, labels, **milestone**,
  reactions/comments (engagement), linked issues, state.

## Step 4 — Weight by author role (signal vs drive-by noise)
A random external PR may have zero roadmap value; a maintainer/contributor item is
signal. Weight by `authorAssociation` + engagement:

| authorAssociation | weight | note |
|---|---|---|
| OWNER / MEMBER / COLLABORATOR | high | maintainer voice — strong signal |
| CONTRIBUTOR | high | has merged work before — real |
| FIRST_TIME_CONTRIBUTOR / FIRST_TIMER | medium | judge by content + engagement |
| NONE (issue) | medium | a user need — keep, but check it's substantive |
| NONE (PR, no linked issue) | low | drive-by — often noise; admit only if engagement (reactions/comments) is real |

Boost on engagement (reactions, comment count, label like `accepted`/`roadmap`);
demote duplicates, `wontfix`, bot authors (`*[bot]`), pure dependency bumps.

- **Milestone membership outranks reactions.** An issue in the next-release
  milestone is committed maintainer work — weight it `high` even with few reactions.
- **Verify authorship, never infer.** Resolve every cited item's real author login
  + association from the API. **Never attribute a community contribution to the
  maintainer** — a drive-by PR is the contributor's, not "work you started." Mixing
  these up corrupts the very author-weighting this skill relies on.

## Step 5 — Write to the backlog graph (shabda intake — selective, honest, deduped)
This is the complement of Step 2: the backlog is `kalpita`/`shabda` (proposed),
kept visibly distinct from the `vartamana` ground. Issues/PRs are **external word**,
not verified truth. Land them as **shabda** (epistemic `kalpita`), never as
established fact (methodology: впуск шабды #165 → сверка #157; risk of garbage
import — nks-dev #1158). Before each write, **dedup** with `nks_semantic_search`
(locate-before-write) — and check whether the item is really a *delta* on an
existing capability you already seeded in Step 2, not a duplicate of the ground.

Map by kind (use `writing` skill discipline for type/modes/arrows):

| Source item | Node |
|---|---|
| bug report | **risk vimarsha** (genre=risk) — or sachverhalt incident if reproduced |
| feature request / enhancement | **phenomenon** (given_as=sinn/bildung) or a seed **kriya** (anagata/chanda) |
| design discussion / RFC / open question | **samshaya vimarsha** |
| merged contributor PR | **kriya** (deed done) or phenomenon it produced |
| open contributor PR | **kriya** (anagata) — work in flight |
| low-weight drive-by PR | skip, or low-priority phenomenon flagged as such |

Carry the source ref (`#123`, author, weight) in attrs so the roadmap is
traceable. Anchor each vimarsha (`vimarsha_of`) to the focus holon or the
phenomenon it's about — anga alone doesn't make it findable.

**Anchor each backlog item to the subsystem it touches.** Link it (`context` /
`vimarsha_of`) to the Step 2 **subsystem holon** or the existing capability it
extends, so the backlog clusters by subsystem (Step 6 reads as "how each part of
the product evolves", not a flat list). An item with no home subsystem is a signal:
either you under-modeled the product (go back to Step 2) or it is genuinely new
ground — say which.

**Dedup against the GROUND, not just the backlog.** Before writing a feature-request,
`nks_semantic_search` it against the **Step-2 capabilities** too. If it matches a
shipped capability, it is a **delta** on that capability — anchor it with an `ahara`
arrow (it consumes/extends what already exists) and frame it as "enhance X", not "add
X". Skipping this is how a direction comes to mis-claim an already-shipped capability
as new (a feature-request asking to *improve* custom prompts is not evidence that
custom prompts don't exist — check the ground).

**Set the in-moment modus honestly (the present mode, not a transition).** A
milestone-committed deed is `adhimoksha` (committed); a speculative request is `chanda`
(wanted); projected work is `anagata`; the verified ground stays `vartamana`/`pramana`.
Read the triputi back as a sentence (`writing` skill) — the volitive mode is how the
graph distinguishes committed from merely-wished-for without a prose label. Model the
field as it stands **now**; never pre-transition a node to a future mode.

**Give each backlog kriya its driving `karta` as `actor`.** An open PR / projected deed
takes an `actor` edge to the karta who drives it — the verified author's maintainer or
contributor karta (Step 2/4), never the runtime worker-fleet karta. This is what makes
Step 6's "who owns this direction" a real graph edge instead of a prose label: a
"maintainer-led" direction must trace to maintainer-`actor`'d kriyas, or it is theater.

## Step 6 — Assembly (discern the directions)
Run the `assembly` skill over the seeded realm: orient the whole field → triage
free vimarshas → discern **bianhua** (the transformations the project is under) →
name + telos → anga the driving vimarshas → order with `anantara`. We play the
owner, so accept names/teloi inline, but keep the discipline: a bianhua name must
**read for a human owner**, telos is the *destination quality* ("проект станет …"),
never create one for a single vimarsha, risks stay risks.

- **Each direction names the existing capability it extends (figure on ground) — as a
  real arrow.** A bianhua transforms something real — tie its telos to the Step 2
  subsystem / capability it grows from ("search *becomes* semantic", grounded in the
  existing full-text search — not "add semantic search" in a vacuum). Make "extends"
  **graph-legal**: the direction's driving kriya reaches that capability via
  `upadhi`/`context` — **not** a literal `ahara` from the bianhua (`ahara` is
  kriya→phenomenon, and a `vollzug` capability forbids it; a bianhua cannot hold `ahara`
  at all — teaching that arrow is a tool-surface error). So figure-on-ground stays
  **graph-checkable** through the kriya link: a direction whose driving kriyas touch no
  ground capability is floating — either genuinely new ground (say so explicitly) or a
  sign you under-modeled in Step 2 (go seed the missing capability). Cluster the driving
  issues/PRs by the **subsystem** they touch.
- **Surface structural risks from the graph's own tensions.** Run
  `nks_orient(lens="tensions")` over the seeded realm. Genuine structural findings — a
  capability with no producing flow, a relay-gap in the estafeta, a deed with no karta,
  a dangling state — are **structural risks** worth naming in the roadmap, distinct
  from the backlog (issue-derived) risks. Don't wave them off as "expected residue":
  the graph's self-diagnosis is signal a flat ticket list cannot give. (Filter to the
  ones that mean something for the product; a pure modeling artifact you can fix in
  place, not report.)
- **Attribute each direction to its driving `karta`.** Name who carries it —
  maintainer-led & committed vs contributor-led & needs-review vs community-requested &
  unowned — using the Step 2/4 kartas. A solo-maintainer roadmap is, at bottom, about
  that karta's finite attention; making ownership explicit is the whole point. **Make it
  a graph fact, not a label:** the direction's driving (`anga`) kriyas must carry
  `actor` = that karta. A "maintainer-led" direction with no `actor` edge from the
  maintainer karta is theater — a zero-edge orphan karta is exactly what a graph audit
  flags; wire the ownership or downgrade it to "inferred from author attrs."
- **A coherent high-signal theme earns a direction even with no committed work.** Don't
  drop the **most-reacted / most-commented** open issues just because they aren't
  milestoned — the top community demand is exactly roadmap signal. If you deliberately
  defer a theme, mark it an explicit "deferred but real" direction; never let it vanish
  silently because no PR exists yet.

- **Name in the repo's audience language.** Bianhua names + teloi become the
  roadmap headings the owner reads — write them in the repo's primary language
  (English for an English repo), not the methodology's default Russian.
- **Every `anantara` edge needs evidence.** A dependency (direction B after A) must
  cite the issue/PR or maintainer statement that establishes it. Where the ordering
  is your own architectural inference, mark it heuristic (`kalpita`) and hedge it in
  the render — never present an inferred dependency as established fact.
  **Don't over-call "blocked."** A direction whose own work is in flight (an open or
  active PR) is *sequenced-after* its prereq, not *blocked* — reserve "blocked" for
  work that genuinely cannot start. Prefer "next, after …" over "blocked by …" when work moves.
- **Surface the next-release milestone as its own direction — in FULL.** The
  committed near-term milestone is the most actionable block. List **every open
  milestone issue** (don't cherry-pick a handful). You may rank a top-N as
  highest-priority "gating", but then **state the total open count and that the
  rest remain** — never imply the subset completes the milestone, and never write a
  telos claiming "every issue resolved" off a partial list. A
  milestone-committed **and** maintainer-authored issue is the strongest signal in
  this whole skill — it must appear in its theme direction, never dropped in favour
  of a lower-signal community PR on the same theme. **Enumerate every OPEN milestone,
  not only the next release.** A catch-all "Backlog" milestone is either listed in full
  or **explicitly marked sampled** (not exhaustively roadmapped) — don't silently cover
  only the near-term one and leave the rest unaccounted.

## Step 7 — Render the roadmap (figure on ground)
The roadmap **leads with the product, then the directions.** Three artifacts:
1. **Graph** — `nks_orient(lens="bianhua")`: the directions, ready/in-flight/done.
2. **Markdown** — `roadmap.md`, in this order:
   - **"What this product is today"** — the Step 2 ground: the subsystems, the core
     capabilities, the current version — **each line cited to a real primitive**
     (file/module, config flag, endpoint, or release tag). This is the figure's
     ground; it proves product mastery, not backlog triage.
   - **"How it works today"** — trace **one core estafeta** end-to-end
     (`nks_orient(lens="trace")` over a core flow, e.g. URL → crawl → index →
     AI-tag → search → read) as a comprehension proof: the product's spine in one walk.
   - **The directions** in `anantara` order; per direction: the capability it
     extends (figure on ground), telos, the driving issues/PRs (verbatim titles +
     `#refs` + author weight), the **driving karta** (who owns it), the **`anga`** (the
     open question/risk driving the change), open risks, what it unblocks.
   - **"Reading of the field" (methodology view)** — a short closing section that makes
     the graph's leverage visible: the **driving `karta`s** (who owns/drives each
     direction), the **structural risks** from the tensions lens, and the
     **figure-on-ground map** (each direction → the capability it consumes via `ahara`).
     The product understanding the graph bought, in one view — the part a flat list
     can't produce.
   - **A "signal audit" table** — the global top-reacted and top-commented OPEN issues
     (counts + the query basis), each marked included-in-Dn / deferred / out-of-scope.
     Makes the selection cap auditable and the rankings reproducible — a reader sees
     nothing high-signal was silently dropped.
   - Open the whole file with a 3–5 line **"next 3 moves"**.
3. **HTML** — `roadmap.html`: **do NOT hand-write the page.** Copy the shipped
   template `references/roadmap-template.html` and replace ONLY its `ROADMAP` data
   object — the schema is documented at the top of the template's `<script>` (product
   ground, estafeta, directions + drivers, signal-audit, structural risks, next-3-moves,
   the field). The template renders the rest: consistent design, working `#ref` →
   `<repoUrl>/issues/N` links (GitHub redirects issues↔PRs) and author chips, status +
   PR-readiness badges, collapsible direction cards, a status filter, light/dark. It is
   self-contained (zero external deps). Write the filled copy to the chosen `--out` dir
   (default repo root). All `ROADMAP` text is plain and auto-escaped — paste verbatim
   titles directly. Filling the data object is the whole HTML job; the design is fixed.

Render the human-facing roadmap (md + html) in the **repo's primary language**
(match the audience). Each cited item shows its verified author + weight; each
inferred dependency is marked as a hypothesis, not a fact. **Quote cited issue/PR
titles verbatim** — don't paraphrase a title the reader will look up. **Make
next-actions state-precise:** distinguish **review / rebase / merge** by the PR's
mergeability + draft state — "merge the PRs" is too coarse (a draft can't be merged;
a conflicted PR needs a rebase first). GitHub computes mergeability **lazily** — a read
may return `mergeable=null` / `mergeStateStatus=UNKNOWN`; re-poll once, and if it is
still null label it "mergeability pending — re-check," never assert "clean." And
`mergeable=true` ≠ **ready**: a mergeable PR can still have failing CI or unresolved
review. **Report the readiness breakdown, don't collapse it:** for a cited PR state draft? · mergeable? ·
CI/checks? · review resolved? — and recommend the action that clears the *binding*
constraint (mergeable but CI-red → "fix CI"; mergeable but unresolved review → "address
review"; clean + green + reviewed → "merge"). "Mergeable" is a git fact, not a go-ahead. **No un-computed superlatives:** never assert a
global ranking — "the highest-reacted / most-commented / biggest X" — off the capped
harvest subset; you sampled only part of the field. State the raw figure ("28
reactions") or a scoped claim you actually computed ("the top request in the AI
subsystem"), never a global "#1" you did not verify over the full set.

**Don't collide internal IDs with GitHub refs.** Reserve `#NNN` notation
*exclusively* for real GitHub issue/PR numbers. Refer to directions by name or as
`D1`/`D2`… — never by their NKS graph seq in `#NNN` form, or a reader will look the
number up on GitHub and land on an unrelated item. Only state
label-derived facts (kind counts, label names) from **actual labels**; if you infer
a kind from a title, mark it inferred. Never print a "verified author" next to a
blank author cell — resolve it from the API or drop the claim for that row. **Resolve
the author + association for EVERY named person** — deferred and secondary items and
structural-risk mentions too, not just the headline drivers; one wrong attribution (an
issue credited to the wrong contributor, a maintainer's association mislabeled)
corrupts the author-weighting. When unsure, drop the name rather than guess.

## Step 8 — Checkpoint + verify the deliverable (fail loudly)
A roadmap that's never written is worth nothing — never terminate silently on a
partial run — a run that dies and ships nothing is the worst outcome.
- **Checkpoint as you go.** Write each stage's raw output to the `--out` dir while
  gathering it: `milestones.json`, `issues.json`, `prs.json`, and the assembled
  skeleton. A late failure then leaves recoverable state instead of nothing.
- **Verify the write.** After rendering, re-read `roadmap.md`; assert it is
  non-empty and contains the required sections: the committed-milestone tier, the
  per-direction blocks, the dependency order. Missing/empty file or absent section
  → say so loudly and stop. Never report success without a verified artifact.
- **Milestone self-check.** Every open milestone title must appear verbatim in the
  roadmap (the committed near-term release is the most load-bearing signal).
- **Product-ground self-check.** The roadmap must open with the "what this product
  is today" section, **cited to real primitives**, plus at least one core-flow
  trace. An empty or uncited current-state section means Step 2 was skipped — say so
  loudly and do it; never ship a backlog-only roadmap.
- **Re-verify item state at render time.** States drift between harvest and render —
  re-check each cited issue/PR's live state (open / merged / closed / draft) via gh
  before publishing. Never show a merged/closed item as open work, and never tell the
  maintainer to "merge X first" if X is a draft or blocked (e.g. an item shown open
  that has since merged, or a draft told to "merge first"). **Treat
  `mergeable=null` as unknown, not clean** — re-poll once; if still null, say
  "mergeability pending," never "clean/ready."
- **Top-signal survival self-check.** The absolute most-reacted and most-commented OPEN
  issues from the harvest must appear in the roadmap — selection → assembly → render can
  silently drop them. If one is intentionally deferred, the roadmap must say so; if it
  fell out by accident, restore it (silently dropping a top-reacted issue loses the
  strongest community theme). The **signal-audit table**
  (Step 7) is where this is made visible — every top-ranked issue marked
  included/deferred, so the survival check is auditable, not just internal.
- **No un-computed superlative slipped through.** Grep the artifact for
  "highest/most/biggest/largest" and confirm each is either scoped or backed by a
  full-set computation, not asserted off the capped subset.
- **Methodology view present.** The "reading of the field" section must carry the
  driving `karta`s, the tensions-derived structural risks, and the figure-on-ground
  (`ahara`) map — the graph's leverage is part of the deliverable, not optional.
- **Keep returns small.** When this skill is run by an orchestrator, hand off via
  files on disk and return a short confirmation + paths — never pipe the full
  roadmap text back through a return value (large returns drop the connection).

## Output contract
- A verified `vartamana` product-ground sub-graph (subsystems + capabilities + core
  flows), cited to real primitives, distinct from the `shabda` backlog.
- Realm seeded with traceable phenomena/risks (shabda-honest, deduped, capped).
- A bianhua map = the roadmap, sequenced, each direction anchored to the ground.
- The graph's leverage made visible: actor `karta`s, figure-on-ground `ahara` links,
  and tensions-derived structural risks, gathered in a "reading of the field" section.
- `roadmap.md` + `roadmap.html` written locally.
- A short "next 3 moves" the maintainer can act on immediately.

## What this is NOT
- Not a dump of every issue as a node — selective, weighted, deduped.
- Not a verstakify that writes AGENTS.md into a repo you don't own.
- Not a substitute for the maintainer's judgment — directions are hypotheses
  (shabda) until they confirm them.
- Not an all-`shabda` graph — the directions transform a verified product ground
  (Step 2), not a backlog floating in a vacuum.

## Methodology / sibling skills
- `verstakify` — codebase understanding + realm/holon bootstrap.
- `assembly` — the bianhua discernment ritual (the heart of Step 6).
- `writing` — node type/modes/arrows discipline for Steps 2 and 5 (the `vartamana`
  ground, the `shabda` backlog, the `karta` actors, the `ahara` figure-on-ground links).
- `weaving` — the tensions lens (Step 6 structural risks).
- External-word pattern: methodology #165 (впуск шабды) → #157 (сверка); nks-dev
  direction #1157/#1158/#1159 (onboarding seeds the graph from issues).
