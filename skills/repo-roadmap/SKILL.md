---
name: repo-roadmap
description: "Use this skill to build a product roadmap for a GitHub repository — or a multi-repo product (a whole org, or a set of repos that together form one product) — you maintain, derived from its issues and pull requests via an NKS reasoning graph. Triggers: 'roadmap from repo', 'build a roadmap from issues', 'roadmap from github', 'roadmap for my org', 'multi-repo roadmap', 'roadmap across repos', 'quick roadmap', 'roadmap teaser', 'собери роадмап из issues/PR', 'роадмап по продукту из нескольких репо', 'что в этом репо делать дальше', repo-roadmap. Role-play as the maintainer: treat a multi-repo product as ONE product (one focus holon, each repo a subsystem, the cross-repo flow as the spine); first model the current product (its subsystems, capabilities, and core flows) as a verified present-state ground, then harvest issues + PRs (weighting contributor signal over drive-by noise; for an empty backlog lean on the merged-PR trajectory, don't invent issues) as the backlog, write them into the graph as phenomena + risks (shabda intake), run assembly to discern the transformations underway, and render a figure-on-ground roadmap as graph + markdown + local HTML. Composes verstakify (understand the codebase), intake (shabda-intake the issues/PRs as claims not facts), and assembly (discern directions). Needs the gh CLI and nks_* MCP tools."
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

This skill **composes** three others: `verstakify` (understand the codebase, set up
the realm/holon), `intake` (the source-independent **shabda-intake** discipline — the
spine of Step 5), and `assembly` (discern the bianhua and produce 形). It adds the
GitHub-harvest front (the intake **adapter** — Steps 3–4) and the roadmap-render back.

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

**One repo, or a whole product (multi-repo).** The target may be a single repo *or a
product spread across several repos* — a whole org, or a maintainer-named set
(`pipelines` + `backend` + `frontend` + `ops`). Treat a multi-repo product as **ONE
product**: one focus holon, **each repo a top-level subsystem**, and the **cross-repo
flow** (one repo's output is the next repo's input) as the headline figure-on-ground.
A multi-repo roadmap is *not* N single-repo roadmaps stapled together — and it is
exactly where "own the product context" pays off most: the cross-repo flow and
cross-repo structural risks are what no single repo's tracker can show. When the scope
is an org or a repo-set, **confirm with the maintainer which repos are in the product**
(an org can hold unrelated repos) and name the product boundary before modeling.

## Prerequisites
- `gh` CLI authenticated (`gh auth status`). Target repo(s) public or accessible.
- **A local checkout of the code — of *each* in-scope repo.** In the real maintainer
  scenario they are already local; otherwise `git clone --depth 1` each. Step 2 reads the
  actual code structure (module/dir names, entry points, config surface), not just GitHub
  metadata — modeling the product from `gh` alone under-serves it. For a multi-repo
  product, clone every in-scope repo (private repos: `gh repo clone`, which carries auth).
- nks_* MCP tools; a realm to write into (create + focus holon if absent).
- Heavy steps (product-model, harvest, graph-writing, assembly, render) should run
  via subagents to conserve the main context.

## Step 1 — Frame and bootstrap
- Identify the target — one `owner/repo`, **or the set of repos that form the product**
  (org or maintainer-named list) — and the product's boundary in one line. If multiple
  repos, confirm they are one product and which are in-scope (Scope note above).
- Realm: create if missing (`nks_realm`); create **one focus holon** named after the
  **product** (the boundary "what is this project"), `contains`-linked from root —
  **one product holon even across many repos**, never one holon per repo.
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
  clusters onto (Step 5) and the directions attach to (Step 6). **Multi-repo: the repos
  ARE the subsystem boundaries** — one subsystem holon per in-scope repo, each tagged with
  which repo it is (`attrs.repo`); a single repo may still split into finer subsystems
  inside it, but the repo is the natural top-level boundary.
- **Cite a real primitive on every node** — the module path, config flag, endpoint,
  or release tag it came from (`attrs.source_ref`). A `vartamana` claim with no
  citable primitive is a guess: demote or drop it. Verify-before-write, don't infer
  a capability from a feature request (that's backlog, not ground). **Multi-repo:
  repo-qualify the primitive** (`<repo>: path/to/file.py:Symbol`) so it's unambiguous which
  repo it lives in. **Cite the EXACT primitive — verify the named symbol actually exists at
  that path** (a plausible-but-wrong constant name, or a constant that really lives in a
  different file, is a grounding slip even when the capability is real). **Cite where the
  behaviour is *implemented*, not where it's read** — if you claim a precedence / policy /
  transform, cite the write/enforce site that does it (e.g. the seeder that sets the
  ordering), not the read site that merely consumes it; verify the cited path actually
  *does* what you claim. **Prefer executable primitives over prose docs as ground** — code,
  config, and manifests are what runs; a README/ARCHITECTURE doc can be stale, so don't cite
  it as the current state. **Read versions from the manifest** (`package.json` /
  `Cargo.toml` / `pyproject.toml`), never from a doc — a wrong framework version in the
  verified-ground section is a grounding error in the one section that claims to be all-cited.
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
- **Multi-repo: the cross-repo flow is the headline estafeta.** Model the spine that
  crosses repos — a kriya in repo A *produces* (`utpatti`) a **hinge phenomenon** (a
  shared DB table, an HTTP/API contract, a published artifact) that a kriya in repo B
  *consumes* (`ahara`), with `next` crossing the boundary (e.g. `pipelines-ETL →
  Postgres-tables → backend-API → JSON-resource → frontend-render`). Those hinge
  phenomena, produced in one repo and consumed in another, are the graph-level proof that
  this is **one product, not N** — and they make cross-repo structural risks computable
  (a frontend capability with no backing backend flow, a pipeline output nothing consumes).

## Step 3 — Harvest milestones + issues + PRs
Use `gh` (JSON). **Three sources, not two** — the maintainer's *committed* plan
lives in milestones / a Projects board, and that is the strongest single signal
(a pure top-reactions cap misses it).

- **Multi-repo: harvest across *every* in-scope repo, then union.** Run the
  milestone/issue/PR pulls per repo, **tag each item with its repo**, and treat a feature
  with coordinated work in several repos as **one cross-repo theme**, not three separate
  items.
- **Empty / thin backlog is honest, not a failure.** If a repo — or the whole product —
  has no open issues / PRs / milestones / releases, **do NOT invent them**. The
  product-model ground (Step 2) plus the **merged-PR trajectory** (what has recently been
  built, and in what direction — `gh pr list --state merged`) carry the roadmap; the
  recently-merged clusters are the de-facto committed plan when no tracker is used. Say so
  plainly in the render and lean on the ground — never pad a thin backlog with manufactured
  tickets.
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
This is the complement of Step 2: the backlog is `kalpita`/`shabda` (proposed), kept
visibly distinct from the `vartamana` ground. **Run the `intake` skill over the harvested
items** — Steps 3–4 are intake's GitHub **adapter** (they supply each item's content /
form / provenance / authority). intake owns the source-independent spine, so **don't
restate it here**: map each item's **form → node type**, set its **epistemic mode by
kind** (#104 — `kalpita` for an unverified request/RFC, never a blanket stamp; the
maintainer's own committed volition is *not* kalpita-to-verify — it lands at its volitive
mode), mark `source_kind=shabda`, **dedup before writing** (`nks_semantic_search`,
locate-before-write), **anchor each node to its source** (`arose_from` the issue/PR), then
**verify by пратьякша and graduate the mode**, under the **selectivity cap** (#1158 — never
the whole tracker; the cap is Step 3's). Issues/PRs are **external word**, not verified
truth — that is the whole reason for the shabda discipline (методология: впуск шабды #165 →
сверка #157).

Use intake's `form → type` map for the shared shapes — bug → risk (a sachverhalt-incident
if reproduced), RFC / design-discussion → samshaya, a stated fact about the system →
phenomenon. **One deliberate divergence from intake's table:** a **feature-request /
enhancement** lands here as a **phenomenon** (a *wanted capability*, given_as=sinn/bildung)
or a seed **kriya** (anagata/chanda) — **not** intake's `bianhua`. In this pipeline the
bianhua are discerned later by `assembly` (Step 6), so Step 5 seeds the *wanted capability*,
not the transformation. intake's own note agrees: "a single wish is not a transformation —
locate the existing bianhua first (assembly), don't spawn one per item." Plus the **GitHub
PR forms** intake's table doesn't name:

| Source item | Node |
|---|---|
| merged contributor PR | **kriya** (deed done) or phenomenon it produced |
| open contributor PR | **kriya** (anagata) — work in flight |
| low-weight drive-by PR | skip, or low-priority phenomenon flagged as such |

Carry the GitHub source ref (`#123`, author, weight) in `attrs` so the render stays
traceable (intake's `arose_from` anchors the provenance node; this is the roadmap's
render-trace). Anchor each vimarsha (`vimarsha_of`) to the focus holon or the phenomenon
it's about — anga alone doesn't make it findable.

**The roadmap-specific overlays `intake` does not carry — apply these on top of its spine:**

**Anchor each backlog item to the subsystem it touches.** Link it (`context` /
`vimarsha_of`) to the Step 2 **subsystem holon** or the existing capability it
extends, so the backlog clusters by subsystem (Step 6 reads as "how each part of
the product evolves", not a flat list). An item with no home subsystem is a signal:
either you under-modeled the product (go back to Step 2) or it is genuinely new
ground — say which. **Multi-repo: anchor to the repo-subsystem the item lives in**;
a **cross-repo theme** (coordinated work in several repos) anchors to the focus holon
and links each touched repo-subsystem, so it reads as one cross-repo direction in Step 6.

**Dedup against the GROUND, not just the backlog.** Before writing a feature-request,
`nks_semantic_search` it against the **Step-2 capabilities** too. If it matches a
shipped capability, it is a **delta** on that capability — anchor it with an `ahara`
arrow (it consumes/extends what already exists) and frame it as "enhance X", not "add
X". Skipping this is how a direction comes to mis-claim an already-shipped capability
as new (a feature-request asking to *improve* custom prompts is not evidence that
custom prompts don't exist — check the ground). **Check whether a *basic form already
ships* and reframe to the real remaining gap.** If the product already has a rough
version of the capability (e.g. an AI-summary *disclaimer/status UI exists* in the code),
the direction is not "add a disclaimer" — it's the gap that's actually missing (the
review / gating / curation workflow). Naming an already-shipped capability as the
to-build undercuts product mastery; verify the code before framing a direction as net-new.

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
  issues/PRs by the **subsystem** they touch. **Multi-repo: prefer ONE cross-repo direction
  over several per-repo ones** when the trajectory shows coordinated work across repos (a
  feature whose PRs landed in pipeline + backend + frontend is one direction); name which
  repos each direction touches (`directions[].repos` in the render).
- **Surface structural risks from the graph's own tensions.** Run
  `nks_orient(lens="tensions")` over the seeded realm. Genuine structural findings — a
  capability with no producing flow, a relay-gap in the estafeta, a deed with no karta,
  a dangling state — are **structural risks** worth naming in the roadmap, distinct
  from the backlog (issue-derived) risks. Don't wave them off as "expected residue":
  the graph's self-diagnosis is signal a flat ticket list cannot give. (Filter to the
  ones that mean something for the product; a pure modeling artifact you can fix in
  place, not report.) **Multi-repo: a *cross-repo* dead-recipe or relay-gap is the
  highest-value structural risk** — a capability in one repo with no backing flow in
  another, a pipeline output nothing downstream consumes, a deploy gap in ops — because it
  is exactly what no single repo's view can surface.
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
The roadmap **leads with the assembled cross-repo picture and what the graph found —
then the directions.** Make the figure-on-ground the *first* thing the maintainer sees:
here is your product pulled together from **every source** (code + config + docs + the
merged-PR trajectory), and here is what the graph surfaced that no issue tracker can.
This insight-first opening is the showcase — the differentiated value (product
comprehension + cross-repo structural findings) on the first screen, not buried. Three
artifacts:
1. **Graph** — `nks_orient(lens="bianhua")`: the directions, ready/in-flight/done. **The
   HTML renders this as a visual graph view** (the cross-repo spine + the directions in
   dependency order + the structural-risk flags), generated from the `ROADMAP` data by the
   template — the figure-on-ground *shown*, not just described.
2. **Markdown** — `roadmap.md`, in this order:
   - **"The product, assembled" (lead)** — the cross-repo figure-on-ground at a glance:
     the subsystems (one per repo) and the **cross-repo spine** (the estafeta — one repo's
     output is the next's input), the real picture assembled from ALL sources, not a ticket
     list. One or two sentences + the spine; the detail follows below. (In the HTML this is
     the graph view, artifact 1.)
   - **"What the graph found" (lead the findings)** — the **structural risks** the tensions
     lens surfaced that no issue tracker shows: a cross-repo dead-recipe / relay-gap, a
     capability with no producing flow, a bus-factor. **Lead with these** — they are the
     single most differentiated thing the graph produces (a flat ticket list structurally
     cannot). Each tagged with the seam it crosses. (The per-direction risks, kartas, and
     figure-on-ground detail still live in "Reading of the field" below.)
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
     can't produce. **Write it for the maintainer, not the methodologist** — gloss each
     NKS term in plain English on first use (`anantara` → dependency order; `anga` → driving
     question; `upadhi` → the capability it builds on; `kalpita` → inferred/hypothesis), or
     lead with the plain word and keep the NKS term in parentheses. A reader outside the
     realm must parse this section without a glossary.
   - **A "signal audit" table** — the global top-reacted and top-commented OPEN issues
     (counts + the query basis), each marked included-in-Dn / deferred / out-of-scope.
     Makes the selection cap auditable and the rankings reproducible — a reader sees
     nothing high-signal was silently dropped. **For an empty/thin backlog this becomes a
     trajectory table** (per-repo merged-PR counts + themes). **State exact counts you have
     the data for — never an estimate** ("~90 PRs") when the precise figure (the per-repo
     sum, e.g. 24+30+11+42 = 107) is in hand; an undercount in the audit table weakens the
     very trajectory it documents.
   - **"Next 3 moves"** — a 3–5 line action list, placed right after the lead (the
     assembled picture + what the graph found), before the product detail.
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
   **Multi-repo: fill the `repos` URL-map** (`{ '<key>':'https://github.com/<owner>/<repo>' }`)
   and put `repo:'<key>'` on **every** driver/signal ref plus `directions[].repos` — the
   template then links each ref to its *own* repo (`<key>#N` → that repo's `/issues/N`) and
   shows a per-direction repo chip; set `repoUrl` to the org/product URL (the bar link).
   Write free-text refs (nextMoves/risks/unblocks) as `<key>#N` so they link; internal NKS
   seqs use a non-repo prefix (`NKS#1120`) and render as plain text. **Single-repo: omit
   `repos`** — the template links via `repoUrl` exactly as before (back-compatible).

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
review"; clean + green + reviewed → "merge"). "Mergeable" is a git fact, not a go-ahead.
**Never bundle PRs of different states into one row or label.** A "merged / shipped
substrate" row must contain ONLY genuinely-merged PRs — an OPEN PR is never "shipped",
and grouping it under a merged heading is a state error (a reader acts on a wrong status).
Each cited PR carries its OWN verified state + mergeability; if you group, group by the
*verified* state, not by theme. And a *mergeable* PR is not "conflicting": don't tell the
maintainer to rebase a PR whose `mergeable=true` — that inverts the action. **No un-computed superlatives:** never assert a
global ranking — "the highest-reacted / most-commented / biggest X" — off the capped
harvest subset; you sampled only part of the field. State the raw figure ("28
reactions") or a scoped claim you actually computed ("the top request in the AI
subsystem"), never a global "#1" you did not verify over the full set.
**A capability's coverage is what its data/code path does, not what a config or UI
surface lists.** Don't read content/data coverage off a configuration or routing surface —
i18n *UI locales* ≠ *translated-content* coverage; a settings flag's presence ≠ the feature
is complete. State the coverage you verified in the code path that *produces* the content,
and keep UI-surface support distinct from data/content coverage (e.g. "UI is he/ru/en/ar,
but AI summaries cover he/en/ru — Arabic excluded by design"). Overstating coverage from a
config list is a grounding slip even when the capability is real.

**Don't collide internal IDs with GitHub refs.** Reserve `#NNN` notation
*exclusively* for real GitHub issue/PR numbers. Refer to directions by name or as
`D1`/`D2`… — never by their NKS graph seq in `#NNN` form, or a reader will look the
number up on GitHub and land on an unrelated item. For an internal NKS seq you must
mention, prefix it (`NKS#1120`) so it never reads as a GitHub link. **Multi-repo:
repo-qualify EVERY GitHub ref with the FULL repo key, everywhere** — in the directions
tables *and* the subsystem bullets, the prose, the signal-audit, the estafeta. Rules:
(a) use the full `repos` key (`backend#1`, `frontend#22`), **never an ad-hoc abbreviation**
(`be#1`, `fe#22` — the reader's legend only knows the full keys); (b) **expand every grouped
list and range** so each number carries its repo — `backend#1, backend#2, backend#3`, never
`backend#1,#2,#3` and never a range `frontend#22-30`; (c) a bare `#N` is forbidden (ambiguous
across repos). A grouped, ranged, abbreviated, or bare ref is a grounding/clarity defect: the
reader can't tell which repo, or lands on the wrong one. Only state
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
  roadmap (the committed near-term release is the most load-bearing signal). If the
  product has **no milestones** (empty/thin backlog), this check is N/A — state that
  plainly; never fabricate a milestone to satisfy it.
- **Product-ground self-check.** The roadmap must open with the "what this product
  is today" section, **cited to real primitives**, plus at least one core-flow
  trace. An empty or uncited current-state section means Step 2 was skipped — say so
  loudly and do it; never ship a backlog-only roadmap. **Verify each cited primitive
  exists at its path AND implements the behaviour you claim** (don't cite the read site for
  a rule enforced elsewhere; don't cite a symbol that lives in a different file), and
  **don't claim a content/data coverage you only read off a config/UI surface** (UI locales
  ≠ translated-content coverage). **Re-read every version/stack figure from the manifest**
  (`package.json`/`Cargo.toml`/`pyproject.toml`), not a doc; **don't cite a prose doc
  (README/ARCHITECTURE) as current ground** when the code is the source of truth; **state
  exact counts, not estimates** (the per-repo merged-PR sum, never "~90").
- **Multi-repo self-check.** For a multi-repo product: ONE focus holon with **each
  in-scope repo as a subsystem** under it; at least one **cross-repo direction** or the
  **cross-repo estafeta** present (else it's N stapled roadmaps, not one product); **every
  GitHub ref repo-qualified with the full key, everywhere** — grep the artifact for a bare
  or grouped `#\d+` not preceded by a full repo key, for ad-hoc abbreviations (`be#`/`fe#`),
  for ranges (`#\d+-\d+`), and for any `directions[].repos`/driver `repo` left unset; expand
  every hit; internal NKS seqs prefixed (`NKS#`) so none renders as a GitHub link.
- **Re-verify item state at render time — EACH cited item, individually, not a sample.**
  States drift between harvest and render. Re-check *every* cited issue/PR's live state
  (open / merged / closed / draft + `mergeable`) via gh before publishing — on a large
  backlog this is more work, but a sampled check is how an open PR ends up labeled
  "merged/shipped" or a mergeable PR labeled "conflicting." Produce a **per-item line**
  (`<repo>#N: open, mergeable=true, author=login/ASSOC`) as the evidence; the **"live-state
  re-verified" self-check is PASS only if you itemized every cited item and corrected each
  mismatch** — never assert PASS off a sample. **Re-verify the author + association in the SAME
  pass** — a recurring slip is a cited author tagged with the wrong association (e.g.
  CONTRIBUTOR where the live value is NONE); resolve it per-number from the API, don't carry
  the harvest's guess. Never show a merged/closed item as open work; never put an OPEN PR in a
  "merged/shipped" row; never tell the maintainer to "merge/rebase X" when X is a draft, or
  already merged, or `mergeable=true`. **Treat `mergeable=null` as unknown, not clean** —
  re-poll once; if still null, say "mergeability pending," never "clean/ready."
- **No zero-edge karta.** Any `karta` you created must carry real `actor` edges to the deeds /
  directions it drives — `nks_look` each and confirm. A karta with no edges (e.g. a contributor
  karta on a *solo*-maintainer product) is theater a graph audit flags: wire it, or drop it and
  don't claim a "driving karta" the graph doesn't back.
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
- **No over-claimed completeness in the self-checks.** A self-check label is *earned*, not
  asserted: don't write "every cited item re-verified", "nothing high-signal dropped", or
  "covers all themes" unless you actually did it over the full set — scope each claim to what
  you checked. State the **engagement cutoff** and that items below it remain, so a high-comment
  issue just under the cut is visible as "deferred", not silently invisible.
- **Methodology view present.** The "reading of the field" section must carry the
  driving `karta`s, the tensions-derived structural risks, and the figure-on-ground
  (`ahara`) map — the graph's leverage is part of the deliverable, not optional.
- **Keep returns small.** When this skill is run by an orchestrator, hand off via
  files on disk and return a short confirmation + paths — never pipe the full
  roadmap text back through a return value (large returns drop the connection).

## Quick mode — the fast teaser (time-to-wow)
When the maintainer wants a **fast first read** (triggers: `--quick`, "quick roadmap",
"give me the gist", a first-time onboarding) — don't run the full 8-step pipeline (that's
~tens of minutes). Produce a **one-screen teaser in a couple of minutes** that lands the
wow — "it actually understands my product" — and offer the full roadmap. The teaser is the
*same machinery, breadth-first and shallow*, leaning on the showcase parts (Step 2 ground +
the cross-repo spine + the lead findings), not the exhaustive harvest/seed/assembly.

**The fast path (one or two agents, not eight phases):**
1. **Frame** (Step 1) — the product boundary; for a multi-repo product, the in-scope repos.
2. **Light product model** — the **subsystems** (one per repo) and the **cross-repo spine**
   (the estafeta — enough to draw the graph view), plus the handful of core capabilities and
   domain entities. Cite real primitives, but **scope to the spine**, not a full Step-2
   reverse-engineering. Seed just enough graph to make the spine + a headline tension real
   (skip exhaustive seeding).
3. **Glance the trajectory** — the top merged-PR themes / committed milestone at a glance
   (skip the full harvest + per-item seeding + author-weighting depth).
4. **Name the top 3 directions + the single headline structural risk** (the cross-repo
   finding the graph surfaces). Don't assemble the full bianhua forest.
5. **Render the lead only** — the **graph view** (cross-repo spine + the 3 directions + the
   headline finding) + a 3–5 line summary: *what this product is · what the graph found ·
   the next move*. End with an explicit pointer: **"this is a teaser — run the full roadmap
   for the complete picture (every direction, the signal/trajectory audit, the full reading
   of the field)."**

**Discipline still holds:** honest `shabda`/`vartamana` separation, no fabrication, every
cited primitive real, refs repo-qualified, the empty-backlog honesty. The teaser is
*shallower, not sloppier* — it shows less, but everything it shows is true. Its whole job is
the wow in minutes; depth is the full pipeline's job.

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
- Not N separate single-repo roadmaps for a multi-repo product — it's ONE product
  roadmap (one focus holon, repos as subsystems, the cross-repo flow as the spine).

## Methodology / sibling skills
- `verstakify` — codebase understanding + realm/holon bootstrap.
- `intake` — the source-independent **shabda-intake** discipline = the spine of Step 5
  (form→type, epistemic mode by kind #104, dedup, `arose_from` anchor, сверка by пратьякша,
  selectivity #1158). Steps 3–4 are its GitHub **adapter**; the Step-5 overlays
  (ground-delta, subsystem anchor, milestone modus, karta-as-actor) are what intake leaves
  to this consumer.
- `assembly` — the bianhua discernment ritual (the heart of Step 6).
- `writing` — node type/modes/arrows discipline for Steps 2 and 5 (the `vartamana`
  ground, the `shabda` backlog, the `karta` actors, the `ahara` figure-on-ground links).
- `weaving` — the tensions lens (Step 6 structural risks).
- External-word pattern: methodology #165 (впуск шабды) → #157 (сверка); nks-dev
  direction #1157/#1158/#1159 (onboarding seeds the graph from issues).
