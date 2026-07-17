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
| Ось живости рода — carrier table, U1–U3, U6 | #464 | writing → «Starting triples & closure — carrier canon»; design → «Starting modes for projected work» (pointer); methodology-work → «Carrier canon» (pointer) | a carrier row or U-universal changes |
| Грамматика переходов трипути — moves, suspicious transitions, kind-aware forbidden | #465 | weaving → «Carrier transitions are acts, not tensions»; writing → virodha-polarity bullets | a transition rule or forbidden state changes |
| Устойчивые комбинации модусов — образцы | #53 | writing → `references/modes.md` (stable triads) | a sample triad is added/retired |
| Конфликтные триады — forbidden triples | #52 | writing → `references/modes.md` (Forbidden) | a hard triple changes |
| given_as канон + матрица стрелок | #372, #376 | writing → Decision 2 + `references/given_as.md`; design → «given_as — arrow legality» | a mode of givenness or arrow-legality cell changes |
| vollzug не заменяет крию — деятельность не записывается существительным | #471 | writing → Decision 1 «A method is half a node» + Traps «Activity reified into a method-noun» + Kriya question 6 + «After writing» 3–4; `references/given_as.md` → «Obligation — vollzug / grundsatz» | the obligation, the phases-are-contains rule, or the one-line test changes |
| Проектная активность — не крия (задача ≠ действие с повторяемой эстафетой) | #102 | writing → Traps «Task in kriya disguise» | the kriya-vs-task test changes |
| manifested_as канон (роды делателя) | #460 | writing → Decision 2b; product-roadmap → actor-modeling rules (Step 2) | a род or its addressing/steward rule changes |
| 時-цикл, bianhua, роли сборки, композиция | #431, #432, #434, #435 | assembly → the whole skill; inquiry → «Inquiry and transformation» | the ritual, roles, or 形 halves change |
| Жизнь вимарши: исходы, кристаллизация | #387 + genre canon | inquiry → sections 2–3; writing → «Vimarsha genres» | an outcome or genre-resolution rule changes |
| Шабда: виды источников, сверка | #104, #165, #157, #340 | intake → steps 1–2, 5; product-roadmap → Step 5 | a source-kind mode or сверка step changes |
| Граница реалма топологична; boundary-маркер | #416 (+ nks-dev #978) | design → «Realm boundary»; weaving → «Boundary is the edge of the world»; writing → Decision 5 kriya note | boundary semantics or the marker changes |
| Санкция bianhua (владелец принимает имя+телос) | #432 + factory SANCTION | writing → Decision 1 bianhua row; assembly → step 5; design → Phase 4; inquiry → section 4 | the sanction discipline changes |
| Вневременность записи | #440 | writing → Decision 4 «Timelessness» | the timelessness rule changes |

Two more sync obligations live outside this table:

- **Tool surface → skills** (AGENTS.md: «tool references must be live») — when
  nks-mcp renames/drops a tool or changes factory behaviour, grep `skills/` for the
  tool name.
- **superpowers → interop section** — `skills/verstakify/references/superpowers-interop.md`
  carries its own re-verify checklist.

## Language contract (four layers, en-first product)

| Layer | Language | Owner |
|---|---|---|
| Skill instructional prose | English (canonical) | the product |
| NKS terms (kriya, шабда, сверка, 正名, возведение…) | as-is, glossed once per file on first use | the method |
| Routing triggers in frontmatter descriptions | English + Russian | the router |
| Realm content (names, teloi, vimarshas, senses posed into a user's graph) | the realm owner's language | the user |

A skill violating a neighbouring layer's contract (RU instructional prose, EN-only
triggers, seq-refs into someone else's realm) is drift — fix toward this table.
