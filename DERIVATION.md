# Derivation map — skills ← methodology canon

The skills are the **portable projection** of the methodology realm: canon lives in
the graph, skills carry its agent-facing summary inline (skills are realm-agnostic
and may not point into the graph — see AGENTS.md conventions). That makes drift
structural: when a canon landmark changes, the projected sections do NOT update
themselves. This map is the maintainer's re-projection checklist.

**Ritual:** after any push that changes a methodology canon landmark, walk the row —
re-project each listed section from the landmark's current body, run `make check`,
review the diff. Same audit-classify-act discipline verstakify applies to AGENTS.md,
applied to the skills.

This file is maintainer-facing (realm access assumed); graph seqs are allowed here,
they are forbidden inside `skills/`.

| Methodology landmark (canon) | Seq | Projected into (skill → section) | Re-project when |
|---|---|---|---|
| Ось живости рода — carrier table, U1–U3, U6 | #464 | writing → «Starting triples & closure — carrier canon»; design → «Starting modes for projected work» (pointer) | a carrier row or U-universal changes |
| Грамматика переходов трипути — moves, suspicious transitions, kind-aware forbidden | #465 | weaving → «Carrier transitions are acts, not tensions»; writing → virodha-polarity bullets | a transition rule or forbidden state changes |
| Устойчивые комбинации модусов — образцы | #53 | writing → `references/modes.md` (stable triads) | a sample triad is added/retired |
| Конфликтные триады — forbidden triples | #52 | writing → `references/modes.md` (Forbidden) | a hard triple changes |
| given_as канон + матрица стрелок | #372, #376 | writing → Decision 2 + `references/given_as.md`; design → «given_as — arrow legality» | a mode of givenness or arrow-legality cell changes |
| vollzug не заменяет крию — деятельность не записывается существительным | #471 | writing → Decision 1 «A method is half a node» + Traps «Activity reified into a method-noun» + Kriya question 6 + «After writing» 3–4 + «Reader-and-use novelty gate» (its kind obligation and method carve-out); `references/given_as.md` → «Obligation — vollzug / grundsatz» | the obligation, the phases-are-contains rule, or the one-line test changes |
| Проектная активность — не крия (задача ≠ действие с повторяемой эстафетой) | #102 | writing → Traps «Task in kriya disguise» | the kriya-vs-task test changes |
| manifested_as канон (роды делателя) | #460 | writing → Decision 2b; product-roadmap → actor-modeling rules (Step 2); minding → skeleton §2b (people of the contours, agantuka rule) | a род or its addressing/steward rule changes |
| 時-цикл, bianhua, роли сборки, композиция | #431, #432, #434, #435 | assembly → the whole skill; inquiry → «Inquiry and transformation» | the ritual, roles, or 形 halves change |
| Жизнь вимарши: исходы, кристаллизация | #387 + genre canon | inquiry → sections 2–3; writing → «Vimarsha genres»; feedback → «The form» (genre-by-kind table: what the case carries → which genre) | an outcome or genre-resolution rule changes |
| Шабда: виды источников, сверка | #104, #165, #157, #340 | intake → steps 1–2, 5; product-roadmap → Step 5 | a source-kind mode or сверка step changes |
| Граница реалма топологична; boundary-маркер | #416 (+ nks-dev #978) | design → «Realm boundary»; weaving → «Boundary is the edge of the world»; writing → Decision 5 kriya note | boundary semantics or the marker changes |
| Санкция bianhua (владелец принимает имя+телос) | #432 + factory SANCTION | writing → Decision 1 bianhua row; assembly → step 5; design → Phase 4; inquiry → section 4 | the sanction discipline changes |
| Вневременность записи | #440 | writing → Decision 4 «Timelessness»; inquiry → terminal-triputi closure; minding → dated facts as attrs (skeleton §7) | the timelessness rule changes |
| Кристаллизация вопрошания + 忘 Пост-забвение | #387, #182 | minding → §2 crystallize-then-release + skeleton §8 (lessons from retired contours) | the crystallization or release canon changes |
| Замкнутость ЖЦ — каждый ding порождается и уничтожается (P1) | #389 | design → P1; minding → skeleton §6 (the map's own lifecycle) | P1 or the deferred-closure form changes |
| Граф — не реальность, а натяжение с реальностью; импульс к работе ставится по anagata-графу | #403, #392 | autonomous → «2c · Mark the intent» + «4 · Close the work tact» (reconcile bullet); verstakify → `references/agents-template.md` «Before work leaves the graph» + «Update the evidenced contour» | the tension-with-reality principle changes, or the impulse step moves/renames |
| Нить 1 «Вхождение и ориентация» — вход начинается с УЖЕ данного реалма (крия «Вхождение в реалм», `boundary=init`); различение узнавание ≠ ориентировка | #337, #147, #478 | minding → §1 recall (names the realm, hands to entry; ask-one-line rule) + Seams → entry (one-directional) | a canonical step before «Вхождение в реалм» appears, or the thread's inlet moves |

Two more sync obligations live outside this table:

- **Tool surface → skills** (AGENTS.md: «tool references must be live») — when
  nks-mcp renames/drops a tool or changes factory behaviour, grep `skills/` for the
  tool name.
- **superpowers → interop section** — `skills/verstakify/references/superpowers-interop.md`
  carries its own re-verify checklist.

## Sections without a canon landmark

Not everything in `skills/` projects from the methodology realm. The sections
below have no canon landmark; they stand on methodology reasoning (pramanita
requires evidence external to the graph; honest modes; implementer/verifier
actor separation) and on counterexamples witnessed in `r5`:

- `reality-audit` — the whole skill;
- `collaborate` — the whole skill, and **not yet audited against the canon**: it
  stands on methodology reasoning (the graph is the record, the channel is the
  wake) and on the channel's observed behaviour in `r5`. Auditing it against the
  canon — and moving what turns out to project into the table above — is
  outstanding work, not an optional pass;
- `autonomous` → «0 · Stand on your channel», «2a · Grasp it before you take it»
  and «Carry it to integration» — these project from the owner's will for the
  cycle recorded in `r5`, not from a canon landmark. If the canon grows a thread
  for standing watch, they are the first sections to re-derive from it;
- `writing` → «After writing» step 6 (graph checks ≠ reality evidence) and the
  reader/use questions of «Reader-and-use novelty gate» (the gate's *kind*
  obligation stays projected from #471 above);
- `autonomous` → the repo/graph durable-state split and its reality-audit gating
  before `verified` closure;
- `design` → «Routing boundary», provocations 6–7 (public boundary /
  representation, state and history) in Phase 3a, and the reality-acceptance
  contract each Phase-4 hint must carry;
- `integrity` → the reality-audit boundary in «Reverse mode — claim-audit» and
  «Not an execution suite» in «What it is NOT»;
- `verstakify` → the cold-verifier role in `references/delegation.md`, the
  «Verification surfaces» slot in `references/agents-template.md`, that
  template's «Update the evidenced contour» / «Work the inbox» steps, its
  Step 4 reality-audit gate, the `PostToolUse` git-push reminder hook, and
  delegation rules 9–11;
- `foreman` — the whole skill; **audited against the canon (methodology realm,
  2026-08-11)**. Nothing in it projects from a landmark yet, so it stays in this
  list; the audit pinned the alignments and one friction. Aligned: «Derive the
  standing name, never invent it» restates the standing discipline (#538 — the
  name derives from what the doer is; two doers under one name displace each
  other silently); «It is not the owner either» plus the «Deciding because
  asking is slow» trap restate 主-acts are not delegated (#477 — the agent
  prepares the act, the owner performs it); «Require it recorded» and leaving
  closure to the inquiry's own holder follow the release discipline (#246 —
  letting go is the holder's volitional act). Friction, fixed in the skill
  rather than recorded here: §1 stated the channel claim as absolute («the
  channel is what keeps a doer working») where the canon treats the session and
  its harness as the replaceable carrier of a standing (#538); the claim is now
  bound to a harness that holds the socket, and the harness-less degraded mode
  is named. Open link: §1's load-bearing fact is empirical material for #530
  («нить несения вахты не описана» — what carries a doer's cycle through time
  is exactly the undescribed thread); if the canon grows that thread, «1 · A
  doer that finished a turn does not continue itself» and «8 · The foreman
  needs seating too» re-derive from it first and this entry moves into the
  table above.

If the methodology realm later canonizes a reality-audit / pramana-discipline
landmark, move them into the table above as ordinary projected rows.

## Language contract (four layers, en-first product)

| Layer | Language | Owner |
|---|---|---|
| Skill instructional prose | English (canonical) | the product |
| NKS terms (kriya, шабда, сверка, 正名, возведение…) | as-is, glossed once per file on first use | the method |
| Routing triggers in frontmatter descriptions | English + Russian | the router |
| Realm content (names, teloi, vimarshas, senses posed into a user's graph) | the realm owner's language | the user |

A skill violating a neighbouring layer's contract (RU instructional prose, EN-only
triggers, seq-refs into someone else's realm) is drift — fix toward this table.
