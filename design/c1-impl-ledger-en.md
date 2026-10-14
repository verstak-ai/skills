# C1 → verstak/en: implementation ledger (#931 share)

Branch `impl/c1-verstak-en`, from `origin/main` `25bbbf9`. Implements role #931's English share of the accepted text design C1 under the governing object r5 (case 650, lead seat of #931). Not merged, no PR, no tag. Nothing was written to the graph or to cases.

**Commits**
- `3c0b3ea` feat(bridge): core sync + delivery words + bridge tests.
- `7406548` fix(verstak): the skill edits (+ rebuilt `verstak.skill`, `home/`).
- `0a872b8` docs(design): this ledger.
- `07f4576` fix(bridge): core re-synced to `9c40eca1`, the old-cache test made real, the truncation word.
- `792d43d` fix(verstak): the review fixes (§8).
- the commit that updates this ledger: core re-synced to `923fe131` (whole-line stripping), `formerMoments`, the cache contrast test.

**Sources** (in the worktree's uncommitted `.c1-inputs/`; sha256 prefixes recomputed here and matching the brief):
- r5 `night-projection-synthesis-r5.md` `467d8dd3…` — governing; its line 11 (inheritance), §1 Seam 4 and Seam 5, §2 "#931 en — mandatory" and "#931 — recommended".
- r1 `night-projection-synthesis-fable.md` `7971eed0…` — §10 en list (lines 123–131).
- pair design `c1-verstak-en.md` `94872bfa…` (K1–K10, S1–S13, §5–§7), its correction `c1-verstak-en.corr-1.md` `7611ae02…`, `c1-verstak-en.m2-delta.md` `d1cbd9d1…`; Sol's reviews alongside.
- surfaces: M2 `m2-surface-en-verstak.json` `36ceaa95…`, postbridge `3c4bb022…`.

Line numbers below are **after** the edit, at the head carrying §8. `S` = `skills/verstak`.

## 1. Bridge core and the writing moment (Seam 5, standard C)

**Core sync.** `d6ec4c29`, then `9c40eca1`, now `scripts/sync-core.sh <sibling repo> 923fe131230aa6e13d44445947c0083e4bb2178f`; `js/core.lock` pins `923fe131`. The last step changes only `js/bridge/moment.ts`: a cached list loses a former moment line only as a whole shipped line with its blank line, at the head or the tail, on `add_*`/`batch` only; anything else keeps its bytes, and a description is never emptied. It reads the lines from the delivery word `MOMENT.formerMoments`.
- **`923fe131` is not on the sibling's `main`** either: it sits on its isolated ru implementation branch `impl/c1-…-ru` (head `11c9301f`), over its main `89f0de73` + draft #458 + its C1 fixes. **Before any release of this delivery, re-sync the core to the sibling's merged commit** and re-run `make check`.
- The sync also brings two sibling core changes since our last pin `0434b9a6`: #462 (own revoke with karta "#N" matched, `absorb.ts`) and #464 (the stop word rides the OpenCode turn's system context, not the inbox: `opencode/{channel,halts,plugin}.ts`). #464 asks the delivery for two plugin words: added at `js/delivery/words/plugin.ts` (`stoppedTurn`, `stoppedAny`), English renderings of the sibling's. The re-sync asks for two more, ours in English: `MOMENT.formerMoment` (`js/delivery/words/moment.ts`) — the **whole** 3.3.0 line exactly as shipped (checked byte-equal against the 3.3.0 release build `skills/verstak/scripts/verstak-bridge.mjs` at `25bbbf9`), so only that exact line is taken off; and `LEAD.cut` (`js/delivery/words/leads.ts`). With `923fe131` the word became `MOMENT.formerMoments: () => readonly string[]` — every whole line this delivery's bridges shipped; ours holds the one line of §9. The sibling's en list carries the same 598-char line byte for byte (its second item) among its own three; that list is the sibling's delivery layer, not ours, so nothing is duplicated — ours stays the delivery's own word.

**Moment line removed** (#7557 v4; en corr-1 C1). The core's `js/bridge/moment.ts` no longer prefixes the seven write tools (6 `add_*` + `batch`); `verstak_stand` insertion and the `channel` status/leave lines stay. Delivery: the `moment` key leaves `MomentWords` (`js/delivery/words/moment.ts`). The 445-char merged line and the 598-char 3.3.0 line are gone; the 3.3.0 line's "a wait is a vimarsha" (against #746) leaves by deletion, not replacement. The server's own tail ("Before this session's first graph write: … load it now…") stays — #163's, untouched.

**The meanings move to the skills, as meanings, not call fields:**
- `S/SKILL.md:215`, the door's "about to write" row: reader / what reading changes / what is new; type, `given_as`, three modes as claims about the node; thesis name, `sense` per arrow; body = present knowledge, provenance to `reasoning`, history, case; a hint is a continuation, not a log; **a wait goes by kind — `Waiting on an answer` / `One-off task`, a vimarsha only for substance**; **each `CHECKS` line … graph integrity, not evidence that anything runs**.
- `S/methods/writing.md`: novelty gate `:11–18` (unchanged); modes as claims about this node `:86`; body/provenance `:126` (unchanged); wait by kind and the hint `:151`; CHECKS ≠ execution `:178` (unchanged).

**Tests** (`js/tests/bridge.test.mjs`, fake server now takes whole tool definitions):
- *fresh* — "write tools reach the harness with the server's descriptions; the channel tool keeps the bridge's lines": write tools and `orient` equal the server's description byte for byte, no `[bridge] The writing skill's moment` anywhere, `verstak_stand` present, `channel` starts with `[bridge] Busyness`, carries `[bridge] action="leave"`, ends with the server's text. **Pass.**
- *negative probe* (prefix back): the same test against the 3.3.0 release build (`git show 25bbbf9:skills/verstak/scripts/verstak-bridge.mjs`, `VERSTAK_BRIDGE_PATH=…`) → **fails**: `verstak_add_vimarsha must reach the harness as the server sent it`, actual starts `[bridge] The writing skill's moment: before each node…`.
- *old annotated cache, login wait* — "a login-wait tool list from an old bridge's cache loses only a whole shipped moment line on a write tool": no grant; `initialize` and `tools/list` answered from a `.server-answers` cache (the stand-in path, graph @nks/nks-dev, node #4790). Each cached tool is one contrast, each asserted byte-equal; `verstak_stand` added, `channel` keeps the server's text. **Pass.**

  | Cached tool | Cached description | Harness gets |
  |---|---|---|
  | `add_vimarsha` | whole 3.3.0 line + `\n\n` + server text | server text — taken off |
  | `add_bianhua` | server text + `\n\n` + whole line (tail) | server text — taken off (the core's tail case; verstak never shipped a tail) |
  | `batch` | same start ("[bridge] The writing skill's moment:"), not the whole line, + `\n\n` + text | byte-equal — kept |
  | `add_kriya` | whole line + `\n` (no blank line) + text | byte-equal — kept |
  | `add_holon` | the line alone | byte-equal — not emptied |
  | `add_karta` | the line + `\n\n`, nothing after | byte-equal — not emptied |
  | `orient` (read tool) | whole line + `\n\n` + text | byte-equal — untouched |

- *negative probes*, each a scratch edit of the core's `js/bridge/moment.ts`, restored after, `check-core-lock` re-verified (198 files match `923fe131`):
  - stripping call removed → **fails** on `verstak_add_vimarsha — whole line first: taken off`;
  - write-tool filter removed → **fails** on `verstak_orient — a read tool: untouched`;
  - a broad prefix strip (the shape of the earlier ru core) added → **fails** on `verstak_batch — the same start without the whole line: kept`.
- The *offline* stand-in (network refusal) goes through the same `lastServerAnswer` → `annotateToolList`; not tested separately here.
- #7557/#7576 are fulfilled in source and offline tests for this delivery; claiming them fulfilled in use still needs the release and the post-wave catalog check (#7576's answer condition).
- The test "bridge line = door line" doesn't exist in this repo; nothing to remove.

**Not claimed:**
- **Present ≠ loaded.** That the row and `writing.md` ship in `verstak.skill` says nothing about whether a session loaded them. A loaded-context probe is separate and not run.
- **Truncation falsifier:** the server tail starts past 2048 chars in all seven (en 2643, 3816, 4298, 4664, 5555, 5584, 9019 — per corr-1/Sol, not re-measured); where a harness cuts at 2048 (source testimony, `moment.ts`, not observed), the tool description carries no writing pointer and only the door and `writing.md` remain. A named limit of C, not a reason to reopen #7557.
- **The shipped bridge still has the line.** `S/scripts/verstak-bridge.mjs`, `opencode-plugin.js` and `extensions/verstak.js` are release builds written only by the release job; at this head they are 3.3.0 with the line. Production rollout is after the owner's release word (#7557 v4).
- No `npm run cost`, no post-bridge tools/list size, no catalog capture; no re-capture server → bridge → plugin from one build (required before any parity claim).

## 2. Mandatory loci (r1 §10 en, r5 §2)

Status: **done** / **unchanged (why)** / **not done (why)**. `canon:` — the ground marker (r5 §2 recommended N1 (Opus)), from the design's sources.

| # | Locus (after the edit) | Status | canon |
|---|---|---|---|
| K1 | `S/methods/intake.md:5` given_as by content, not a fixed `ding → sachverhalt → any` flow | done | #157 v5, #446 v3 |
| K1 | `intake.md:16` "authority sets the mode" → speaker, standing, means, evidence: inputs, not a grade | done | #104 v5 |
| K1 | `intake.md:26` reported possibility / observed counter-case / uncertainty / incident told apart | done | #100 v3 |
| K1 | `intake.md:34–49` section 2 rewritten whole as "Claim, means and provenance" (code observes code; run report is testimony; normative text by reading; unreproducible past; ontic by subject; owner's own word vs retelling; unknown provenance limits only the reader; `pramanita` independent) | done | #100 v3, #104 v5, #477 v5, #745 v12 (corrections) |
| K1 | `intake.md:70–74` "Compare the bounded claim": view by question; agreement = with the record; disagreement → `vyabhichara` / `samshaya`, `badhita` only on the defeated judgment | done | #157 v5, #255 v3 |
| K1 | `intake.md:78` "modes by the claim's grounds" | done | #104 v5 |
| K2 | `S/methods/writing.md:88` code observes code, execution `anumita`; focused test; `pramanita` independent; agreement = record | done | #104 v5, #529 v10 |
| K2 | `writing.md:43` (after the task trap) form / case / retained participant; `derived_from` links forms; `ahara`/`upadhi` by consumption vs application | done | #446 v3 |
| K2 | `writing.md:94` owner-act list kept + "unless the owner said it, or authority granted beforehand…"; recording a risk as `virodha` is guarding | done | #477 v5 |
| K2 | `writing.md:96` three readings of recorded will | done | #477 v5, #745 v12 |
| K2 | `S/references/writing-modes.md:7` `pramanita` = independent grounds, retellings once | done | #104 v5 |
| K2 | `writing-modes.md:45` "external text, past = Pm" → graded by the claim (intake step 2) | done | #104 v5 |
| K2 | `writing-modes.md:27` stub row → planned end, will by the actual relation | done | #398 v2 |
| K2 | `S/references/writing-given-as.md:3` six local practical kinds, not Husserl's modes | done | INTRO:26, D1/D19 |
| K3 | `S/methods/reality-audit.md:7` graph observes recorded content, not execution; text claim vs behaviour claim | done | #529 v10, #100 v3 |
| K3 | `reality-audit.md:9` fresh witness where self-substitution matters or the rule requires it | done | #738 v3 |
| K3 | `reality-audit.md:21` propose / admit / observe; safe, reversible, in-mandate inquiry; `provisional` until admitted | done | #100 v3 |
| K3 | `reality-audit.md:25` the measurer paragraph | done | #504 v4, #738 v3 |
| K3 | `reality-audit.md:57` "rising confidence and `anagata → vartamana` only for `verified`" → each axis moves on its own relevant grounds within the bounded claim's ceiling; a rise in epistemic grounds (`kalpita` → `anumita`, a bounded observation on a not-yet-admitted carrier) does not raise behavioural acceptance, which stays `provisional` until its `verified` conditions hold on the canonical carrier; existence can be observed while a behavioural claim stays `provisional`; structural linkage raises no behavioural acceptance. Agrees with `:59` (what each level earns) and `:61` (kind ceilings). Review fix, Sol EN-1; the first fix ("a behavioural claim's node rises only on its `verified`") still gated all mode movement on `verified` — corrected on Sol's re-review | done | #156 v3, #529 v10 |
| K3 | `reality-audit.md:55` success ≠ value; the four verdicts are for behavioural acceptance, text by reading | done | #529 v10 |
| K3 | `reality-audit.md:59` reading code observes content; to execution `anumita` | done | #104 v5 |
| K3 | `S/templates/reality-template.md:2–3` rows by claim class; content claim's subject is the admitted text; "worth nothing" → names a limit | done | #529 v10 |
| K3 | `S/templates/agents-template.md:58` the Reality row read for execution claims; other changes name their grounds and the rightful act | done; contract **not** bumped (see §5) | #529 v10 |
| K4 | `S/methods/entry.md:7` read by the question | done | #157 v5 |
| K4 | `entry.md:26` connected trace ≠ it runs | done | #157 v5, #529 v10 |
| K4 | `entry.md:46` follow the arrow when the card leaves a ground unresolved; "a complete direct answer on the card needs no walk" | done | #157 v5 |
| K4 | `entry.md:48` scope by question; flow closure needs the flow's holon; no ceremonial rerun | done | #157 v5 |
| K4 | `entry.md:49` "while its question is live" | done | #157 v5 |
| K4 | `entry.md:116` tensions for dependency/closure advice; a direct question already answered needs no more | done | #157 v5 |
| K5 | `S/methods/inquiry.md:73–75` §6 rewritten whole: "What the work changed" | done | #387 v5, #356 v2, #131 v5 |
| K5 | `inquiry.md:27` "the most valuable" dropped; "`visarjana` once the form carries the content" → shaping the form ends nothing, the vimarsha moves on its own carrying axis, released only when its answer condition is met and the release is yours by kind (the second half is a review fix, Sol BOTH-1; the first pass had left it) | done | #387 v5, #156 v3 |
| K5 | `inquiry.md:25` Resolution: `addressed_by`; release as its own act by answer condition and kind | done | #156 v3, #464 v13 |
| K5 | `inquiry.md:21` "exactly one door" → the genre's ending axis decides; held/accepted need no exit | done | #156 v3 |
| K6 | `S/methods/assembly.md:71` `bildung` only when actually told apart; a kept whole or open question is a result | done | #387 v5 |
| K6 | `S/methods/autonomous.md:55` lessons → what holds outside the case → the node it touches; nothing → one line | done | #131 v5 |
| K6 | `autonomous.md:147` `addressed_by`, then release by condition and kind | done | #156 v3 |
| K6 | `autonomous.md:31` growing seed → check the unit of continuation | done | #366 v4, #365 v4 |
| K6 | `writing.md:151` seed only for a material continuation condition that neither the graph, its lenses nor reading the cases (`at`, `read`) restores; a pointer, not a snapshot — live cases read, not listed; a case number only where a material choice can't be recovered otherwise; absence no failure; release kind-aware. The first pass kept "live cases by number and wait" in the list — review fix, Sol EN-3 = Opus E-1; `SKILL.md:94` "notes go into the seed" aligned | done | #131 v5, #356 v2, #366 v4, #629 v2 |
| K6 | `S/methods/minding.md:60` (+ derived `home/minding/SKILL.md:65`) "crystallize, then release" → check for a material remainder, keep it with grounds and condition (refine the touched node first), nothing → release without inventing a lesson; releasing doesn't destroy the archive. The first pass left it as "consciously unchanged" — declined by both reviews, now fixed (Sol EN-2 = Opus E-2) | done | #387 v5, #356 v2, #131 v5 |
| K6 | `S/methods/collaborate.md:90` a lasting delta, if any, at the node it touches | done | #131 v5 |
| K7 | `autonomous.md:126` relay by kind; grounds, where they live, the mandate's boundary; mention ≠ address, receipt ≠ reading | done | #746 v7 |
| K7 | `S/methods/architect.md:45` a wait goes by kind | done | #746 v7 |
| K7 | `S/SKILL.md:86` `talk(with=<seat or role>, about=<one-line matter>)`; `open_room` on the subject node's write | done | M2 `verstak_case` help |
| K7 | door table and cards (`SKILL.md:52–61, 84–100`) | unchanged — kept, per K7 | — |
| K8 | `architect.md:53–58` closing rewritten as one block: four cases; silence/deadline supply no missing act; settle/withdraw/transfer first; "not attested" doesn't settle; platform order, not the local clock | done | #747 v10 (accepted correction), #744 v10; #48's contract named, not chosen |
| K8 | `architect.md:51` hand-over points to grounds and mandate edges | done | #131 v5, #570 v2 |
| K8 | `architect.md:72` (design :71) summary ≠ assessment; same summary, changed situation | done | #744 v10 |
| K8 | `architect.md:75` (design :74) facts apart from assumptions; falsifier and branch where an assumption decides; recommendation doesn't change the goal | done | #212 v2, #566 v3 |
| K8 | `architect.md:95` (design :94) acceptance by claim class; "no one accepts their own work" and the production marker kept | done | #529 v10, #797 v5 |
| K8 | `S/methods/assistant.md:56` consent to the close as named, if received and able to object — not an act theirs to make | done | #747 v10 |
| K8 | `assistant.md:66` + "what their silence can't decide for them" | done | #747 v10 |
| K8 | `SKILL.md:86` deadline belongs to the promise (single home); `collaborate.md:84` refers to it | done | #746 v7 |
| K8 | `S/methods/reconcile.md:15` age → recheck when the subject or authorisation conditions can have changed; no automatic downgrade of a true normative source | done | #104 v5, #738 v3 |
| K8 | `autonomous.md:155` hand-over: where the next one finds why (node numbers) | done | #131 v5, #570 v2 |
| K8 | `autonomous.md:173` decision-time grounds and limits | done | #131 v5 |
| K8 | D14: `SKILL.md:100` paragraph on a rule's source, genre, force and scope; the delivery's own product rules named as product rules | done | #745 v12 (last paragraph) |
| K8 | `architect.md:5` intent vs mandate, refers to the door | done | #745 v12 |
| K9 | `S/methods/weaving.md:83–93` §5 rewritten whole; `anagata`+`upeksha` stub removed | done | #398 v2, #389 v5, #446 v3 |
| K9 | `S/methods/design.md:21–22` P1/P2 reworded, refer to weaving §5 | done | #398 v2 |
| K10 | `SKILL.md:15` degeneration sign: a reason to look, not a verdict | done | #744 v10 |
| Seam 5 | moment line removed; door row `SKILL.md:215`; `writing.md` (§1 above) | done; fresh and old-cache tests pass (§1) | #7557 v4, #7576 v3, #4238 v5 |
| §5.1 | re-capture server → bridge → plugin from one build before any parity claim | **not done** — needs the build #163 names and a live grant; no parity is claimed | — |

**Count:** 62 rows — **60 done**, **1 unchanged** (K7 door table, kept by design), **1 not done** (the one-build re-capture).

**Additional edits, same meaning, outside the listed loci** (each stated so it isn't hidden):
- `writing.md:138` `ahara` "(destruction)" → "consumed: its participation in this scope ends" (D15; the server twins are T9/C6/C6b, #163/#48).
- `writing.md:102` risk row "`upeksha` = accepted *by its principal*"; `inquiry.md:44` risk acceptance "the owner's act or their authority given beforehand" (#477 v5).
- `inquiry.md:79` "hold with its grounds" among triage outcomes (follows K5 §6).
- `S/references/minding-personal-realm.md:81` "`anagata` + `upeksha`: the deferred end-of-life closure" → a planned end with the actual will (K9's ground; minding wasn't in the en pair's reading).
- `autonomous.md:130` the separate subagent before "verified" is a product rule for acceptance, not for exploratory probes (§6 P7).
- `autonomous.md:70` duty round: no assessment (recommended item, §3).

## 3. Recommended (#931)

| Item | Outcome |
|---|---|
| `architect.md:91` backbrief / sample by risk | **done** `architect.md:92`: restatement ≠ result or competence; agreeing is a further act; neither gives a mandate; method risk → backbrief, joint risk → sample both sides run; none on a routine task |
| `autonomous.md:63–70` reference line | **done** `autonomous.md:70` |
| `foreman.md:51` liveness ranking | **done** `S/methods/foreman.md:51`: four questions, not a ranking |
| `foreman.md:49` pace / budget | **done** `foreman.md:49` |
| `assistant.md:61` pace is a reason to ask | **done** `assistant.md:61` |
| `entry.md:137` time matters to evidence, not questions | **done** `entry.md:137` |
| plugin ENDED word | **done** `js/delivery/words/leads.ts:73`: "Its final report follows — testimony, not acceptance evidence; the case and the carrier hold the grounds and limits". The explicit truncation marker: **done** — the sibling's core `30b10fb4` marks it through our word `LEAD.cut` (`leads.ts:73`): "[report truncated: N of M characters shown — incomplete here, whole in its case]"; not covered by a test here |
| adapters and refusal metadata | **not done**: confirming which downstream adapters keep `_meta` rule/status/data needs runs against each harness; the OpenCode plugin returns text only (`js/opencode/tools.ts`, per the design). No refusal meaning was changed |
| N1 (Opus) canon markers | **done** in this ledger's `canon` column (implementation notes, not shipped text) |
| T5, T11, the conditional server items | #163's (below), not this share |

## 4. Server (#163) and API (#48) shares — named, not touched

The skills now say the meanings the server should say too; the server text itself is not edited here:
- **#163**: Seam 1 (a)–(e) `add_vimarsha` NEXT / argument, `update` WHEN / CHANGING A MODE / example; C3 `add_kriya` provocation 4; C1/C2 `pramanita` (+ the TRIPUTI clause); C4 / T7 `update` DECIDING; C7 `look`; C9 WHEN and C9b/T10 `given_as` paragraph in `add_phenomenon`; C10 Fat Node; C6b/T9 "consumed / destroyed"; C14 `initialize.instructions`; C12 core `propose_close` help; the server pointer "Before this session's first graph write…" (stays; only #163 changes it, within budget); `npm run cost` and tools/list measures.
- **#48**: C6 `ahara` help text (accepted, not shipped); C13 objection order — the skill (`architect.md:53`) reads the platform's proposal and journal order and picks no order for it.

## 5. Consciously unchanged

- **Contract stays `4`.** The `agents-template.md:58` and `reality-template.md` edits narrow wording; `align.md:11` raises the contract only when a generated file becomes wrong (a section, file, ritual or tool name), "never for wording". Already generated files keep the broader line, which is stricter, not wrong.
- **This repo's own `AGENTS.md` Reality line** keeps "switching a mode or ending a question": a stricter product rule of this repo, which the D14 paragraph lets bind.
- **Grounds, nests, genres, modes, enums, the staff Seam 4** — unchanged; no new axis, field or enum; D1–D19 are not turned into a checklist (the door's five failures stay a recognition device, only failure 1's sign reworded per P4).
- `delete_node`'s prefer-visarjana line is server text (N6 (Opus)), not touched.

## 6. Gate

`make check` at the head carrying §8 (re-run after the review fixes), the uncommitted `.c1-inputs/` excluded for the run only (`GIT_CONFIG_*` → `core.excludesFile`; validate lists untracked files and bans their Cyrillic): **exit 0**.
- `validate` ✓, `check-bundles` ✓, `check-surface` ✓ (23 tools), `check-core` ✓ (198 files), `check-core-lock` ✓ (923fe131), `lint` 0 errors / 22 warnings (all in core files, e.g. `js/bridge/tokens.ts`; not from this branch's delivery edits), `format-check` ✓, `typecheck` ✓, `check-js` ✓ (committed outputs are the 3.3.0 release build), `test`: 125 tests, **125 pass, 0 fail, 0 todo**.
- No flakes; nothing re-run.

## 7. Limits

- **Two different #458s.** The bridge draft #458 ("bridge does not append the writing moment line") came in with the core sync and is reconciled here. The **writing-reduction PR458** (a separate wave) was **not read**; reconciling the door row and `writing.md` with it is #931's, in one move — not done.
- Core pinned to an **unmerged** sibling commit `923fe131` (§1): **re-sync to the sibling's merged commit before any release.**
- #7557/#7576 in use: not claimed until the release and a post-wave catalog check (§1).
- No loaded-context probe, no truncation observation, no measurement, no live server or bridge, no re-capture — all §1/§2 claims are about committed text and the offline fake.
- The skill edits are text; whether agents then act differently (base/head probes, redundant-use contrasts) is not observed — REALITY.md's Ceiling.
- Graph read: none beyond the inputs; no graph or case writes (subagent without its own seat).

## 8. Cold reviews at `07f4576` — findings

Reviews: Sol `impl-review/sol.md` (sha256 `cf8b3af4…`), Opus `impl-review/opus.md` (`ac02dce7…`), both REVISE for en. Read in full. Skills only in this pass; the core is not touched (the sibling's ru branch is fixing the strip; re-sync on its commit).

**Mandatory, en**
- **Sol EN-1** — `reality-audit.md:57` "only for `verified`" on both axes: **fixed** `S/methods/reality-audit.md:57` (K3 row). Fail-closed, the four verdicts and "structural linkage raises no behavioural acceptance" kept.
- **Sol EN-2 = Opus E-2** — `minding.md:60` mandatory crystallization: **fixed** `S/methods/minding.md:60`, `home/minding/SKILL.md:65` (derived). The earlier "consciously unchanged" in §5 was unsupported and is withdrawn.
- **Sol EN-3 = Opus E-1** — `writing.md:151` "live cases by number and wait": **fixed** `S/methods/writing.md:151`; `S/SKILL.md:94` aligned. The earlier K6 "done" was a false completeness claim.
- **Sol BOTH-1 (en)** — `inquiry.md:27` automatic `visarjana`: **fixed** `S/methods/inquiry.md:27`; no new mode or field. The earlier K5 "done" for `:27` was a false completeness claim.

**Non-blocking — taken / not taken**
- Opus N-en8 (two #458s told apart in the ledger): **taken**, §7.
- Opus N-en6 / Sol §3.9 (pinned to an unmerged core; #462/#464 ride along, not C1): **named**, §1/§7; re-sync before release.
- Opus N-en1 / Sol N2 (`design.md:21` P1 heading "born and dies", `:62` "add end-of-life", P4 `:24`): **not taken in this pass** — the brief scopes it to the mandatory findings; K9 named only the P1/P2 bodies. Next pass.
- Opus N-en2 (`entry.md:21,23` "dissipation"), N-en3 (`writing.md:88` "attested repeatedly and independently"), N-en9 (`product-roadmap.md:87` "authority"), Sol N6 (`assistant.md:61` "is a blockage"), Opus N-en4 / Sol N1 (`architect.md:72` fixed reading list): **not taken in this pass** — wording parity, no contradiction of a mandatory locus; next pass.
- Opus N-en7 / Sol N3 (an en test of `LEAD.cut`, wider fixtures: seven write tools, multi-paragraph bodies, a door-row test): **not taken** — tests are out of this skills-only pass; due with the next core re-sync.

## 9. Historical en moment lines — ready for the words file

Searched every commit touching the shipped bridge `skills/verstak/scripts/verstak-bridge.mjs` (all releases v3.0.0–v3.3.0, plus `e5eaae4`, `952565f`, `07f4576`), the pi extension and the OpenCode plugin, and git history (`git log --all -S"skill's moment"`, `-G"momentLine"`). Releases before v3.0.0 (v1.9.0–v2.10.1, the pre-core bridge under `skills/establish-mcp/`) carry no moment line. The pi extension and the OpenCode plugin never carried one (they don't annotate the list).

**Exactly one line was ever shipped**, unchanged from v3.0.0 through v3.3.0:
- **Position: head.** The bridge set the description to the line + `\n\n` + the server's description; an empty server description became the line alone (no separator). Write tools only: `^<tool prefix>(add_[a-z_]+|batch)$` — the prefix is the bridge's `TOOL_PREFIX`, `verstak_` unless `config.json`'s `tool_prefix` renames it.
- **Never at the tail** (unlike the sibling's bridges between its d19d6e8b and 94d088df).
- **Text** — 598 characters, sha256 `755d4ed7dbe51b5471727b150952264f1b3820a49c40919523dc436d6cb2fbed`:

> [bridge] The writing skill's moment: before each node, name the reader, what will change retrieval and what is new here; type and given_as, the three modes as claims, a thesis name, arrows with sense; the body is present knowledge, never provenance: who said it, when, by whose hand — lives in the node's history and in the case, a node is rewritten, not appended with a section; hint is a transformation's seed: only what matters after the session, not a log; a question to a neighbour and a wait are a vimarsha with `posed_to`, not a case line; the CHECKS lines in the reply are this beat's work.

It stands whole in `js/delivery/words/moment.ts` as the single item of `MOMENT.en.formerMoments` (598 characters, sha256 `755d4ed7…`, byte-equal to the v3.3.0 build), the shape the core at `923fe131` asks for. The core also strips a tail position; verstak never shipped one, so for this delivery that case only guards against a foreign cache.


## r2. Carried onto the fresh main, core re-synced, output limit gated

Branch `impl/c1-verstak-en-r2`, from `origin/main` `a18714d` (3.4.0, which carries #160 — the core synced to the sibling's 7.10.0 `d1010ac6`, with its English delivery words). Commit hashes in the sections above belong to `impl/c1-verstak-en` (head `bad6f98`); on r2 they have new ones. Line numbers above hold on r2: no skill file differs from `bad6f98`.

### Carried

- Cherry-picked in order, all seven commits of `impl/c1-verstak-en` after `25bbbf9`: `3c0b3ea`, `7406548`, `0a872b8`, `07f4576`, `792d43d`, `35923a0`, `bad6f98`.
- Conflicts, all in places the re-sync or the build owns: `js/core.lock` (three times — main's pin taken, then overwritten by the re-sync), `verstak.skill` (three times — main's taken, rebuilt by the pre-commit hook from the picked skills), `js/delivery/words/plugin.ts` (`stoppedTurn`, `stoppedAny`: #160 already carries the same two words; main's wording kept, ours not duplicated).
- `js/delivery/words/leads.ts`: main's #160 additions (`unreleased`, `noLiveAncestor`, `endUnwritten`, `endUnlifted`, `lastUnknown`, no `cancelled*`/`released`) stand together with C1's `cut` and the `end` line "testimony, not acceptance evidence".
- `home/` and `verstak.skill` are rebuilt from the picked methods; `skills/`, `home/` and `design/` equal `bad6f98` apart from what main itself changed since `25bbbf9` (the release-build outputs under `skills/verstak/scripts/` and the bundle carrying them).

### Core re-synced

- `scripts/sync-core.sh <sibling repo> 5a48cfe7` — the head of the sibling's `impl/c1-…-ru-r2`: its fresh main `39f8c1f9` (7.10.0 and after: #466, #467 the stop order, #468, #470 the language by server address, #471 the seat beside handed over with the main one) plus C1. `js/core.lock` pins `5a48cfe7b389d6da0b2a19e8bc036f9f998f6c51`, 212 files. `d1010ac6` (our previous pin, via #160) is an ancestor of `39f8c1f9`.
- The C1 core is unchanged by the re-sync: `js/bridge/moment.ts` (only a whole shipped moment line, at the head or the tail, on `add_*`/`batch`) is byte-equal to the `923fe131` copy; the outcome cut and ENDED ride as before.
- The delivery layer, for what the new core asks: `HALTS_CAPABILITY` (`js/delivery/protocol.ts`, exported from `index.ts`; the bridge client's experimental key confirming the OpenCode plugin executes a stop), `STOP.orderJournalRefused` (`js/delivery/words/stop.ts`, the order journal on disk refused an entry), `THIN.besideNotBack` reworded for #471 ("the seat beside did not come back with the main one"). English renderings of the sibling's words. `SERVER_LOCALE` stays `{ en: "en" }`: this delivery speaks only English, and #468's Russian entry has no place here.
- **`5a48cfe7` is not on the sibling's `main`.** Before any release of this delivery, re-sync to the sibling's merged commit and re-run `make check`.

### Output limit (#7597) — gate, no recomposition needed

- `scripts/validate-skills.mjs` section 4 carries the sibling's gate with the same meaning: OpenCode 2.0.28 cuts any tool's output at 2000 lines / 51 200 bytes by whole lines; the skill tool's output is modelled as the sibling models it (wrapper, body without frontmatter, a long install directory, up to ten files). Unlike the sibling, this delivery has one skill — the door — which sends every method, reference and template through the read tool; those are gated too, each line with its `N: ` prefix plus a 10-line / 1024-byte wrapper reserve. No exceptions; `SKILL_OUTPUT_SIZES=1` prints sizes. Falsifier run: a method blown up to 774 529 bytes fails `make validate` by name; restored, it passes.
- `AGENTS.md` "Shared surfaces" gains the row for this contract.
- **Nothing is over the limit, so nothing was recomposed.** The longest are `references/align-delegation.md` (35 424 bytes), `methods/align.md` (26 612), `methods/writing.md` (26 474) and the door (26 374) — about half the limit. The en counterparts of the sibling's overgrown skills (`autonomous` for its watch, `align` for its alignment) were already split across `methods/` and `references/align-*.md`. The table "section → where" is therefore empty: no section moved. The longest line anywhere is 1 637 characters (`methods/writing.md`), under a 2000-character line cap if a read tool applies one.

### Output sizes (bytes / lines, limit 51 200 / 2000)

Skill tool: **door `SKILL.md` 26 374/255**.

Read tool, `methods/`: align 26 612/157 · architect 20 987/117 · assembly 10 103/88 · assistant 16 960/125 · autonomous 25 373/190 · code-work 10 708/77 · collaborate 19 754/130 · design 13 076/140 · entry 18 235/155 · establish-mcp 11 864/85 · feedback 8 269/85 · foreman 11 925/100 · inquiry 11 178/90 · intake 10 450/93 · integrity 15 589/143 · minding 12 932/150 · product-roadmap 17 871/171 · reality-audit 10 841/76 · reconcile 7 394/37 · weaving 11 015/120 · widgets 3 441/48 · writing 26 474/196.

Read tool, `references/`: align-delegation 35 424/240 · align-harness-surfaces 18 765/230 · align-hooks 11 300/74 · align-superpowers-interop 3 638/50 · collaborate-channel 23 917/167 · door-menu 4 171/55 · door-phrasebook 13 649/152 · minding-personal-realm 10 571/132 · product-roadmap-self-checks 5 670/65 · writing-batch 2 797/31 · writing-given-as 6 094/73 · writing-modes 13 150/125. `templates/`: agents-template 7 629/106 · reality-template 2 553/22.

`home/` (the conversation home, not OpenCode; not gated, by the same skill-tool model): assistant 15 996/125 · minding 19 522/258 · widgets 2 787/48.

### Gate r2

`make check` — exit 0: core boundary and pin (212 files at `5a48cfe7`), lint 0 errors (22 warnings, as on main), format, types, release-build check, tests 126, passed 126, failed 0, skipped 0, todo 0.

### Limits r2

- Delivery into OpenCode was not observed by capturing a request: the gate models the output, not a load.
- The read-tool model (prefix and wrapper reserve) is a reserve, not a measured shape of the 2.0.28 read output; a user `tool_output` smaller than the default cuts sooner.
- Opus N-en7 / Sol N3 (an en test of `LEAD.cut`, wider fixtures) stays not taken: this re-sync adds no test of its own.
- No PR, tag or release (the brief).
