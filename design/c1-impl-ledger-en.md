# C1 → verstak/en: implementation ledger (#931 share)

Branch `impl/c1-verstak-en`, from `origin/main` `25bbbf9`. Implements role #931's English share of the accepted text design C1 under the governing object r5 (case 650, lead seat of #931). Not merged, no PR, no tag. Nothing was written to the graph or to cases.

**Commits**
- `3c0b3ea` feat(bridge): core sync + delivery words + bridge tests.
- `7406548` fix(verstak): the skill edits (+ rebuilt `verstak.skill`, `home/`).
- this ledger: the commit that adds this file.

**Sources** (in the worktree's uncommitted `.c1-inputs/`; sha256 prefixes recomputed here and matching the brief):
- r5 `night-projection-synthesis-r5.md` `467d8dd3…` — governing; its line 11 (inheritance), §1 Seam 4 and Seam 5, §2 "#931 en — mandatory" and "#931 — recommended".
- r1 `night-projection-synthesis-fable.md` `7971eed0…` — §10 en list (lines 123–131).
- pair design `c1-verstak-en.md` `94872bfa…` (K1–K10, S1–S13, §5–§7), its correction `c1-verstak-en.corr-1.md` `7611ae02…`, `c1-verstak-en.m2-delta.md` `d1cbd9d1…`; Sol's reviews alongside.
- surfaces: M2 `m2-surface-en-verstak.json` `36ceaa95…`, postbridge `3c4bb022…`.

Line numbers below are **after** the edit, at `7406548`. `S` = `skills/verstak`.

## 1. Bridge core and the writing moment (Seam 5, standard C)

**Core sync.** `scripts/sync-core.sh <sibling repo> d6ec4c29`; `js/core.lock` pins `d6ec4c29805615c16f56e912dd5509446439e648`.
- **That commit is not on the sibling's `main`**: it is its isolated ru implementation branch (its main `89f0de73` + draft #458 "bridge does not append the writing moment line"). **Before any release of this delivery, re-sync the core to the sibling's merged commit** and re-run `make check`; until then the lock names an unmerged commit.
- The sync also brings two sibling core changes since our last pin `0434b9a6`: #462 (own revoke with karta "#N" matched, `absorb.ts`) and #464 (the stop word rides the OpenCode turn's system context, not the inbox: `opencode/{channel,halts,plugin}.ts`). #464 asks the delivery for two plugin words: added at `js/delivery/words/plugin.ts` (`stoppedTurn`, `stoppedAny`), English renderings of the sibling's.

**Moment line removed** (#7557 v4; en corr-1 C1). The core's `js/bridge/moment.ts` no longer prefixes the seven write tools (6 `add_*` + `batch`); `verstak_stand` insertion and the `channel` status/leave lines stay. Delivery: the `moment` key leaves `MomentWords` (`js/delivery/words/moment.ts`). The 445-char merged line and the 598-char 3.3.0 line are gone; the 3.3.0 line's "a wait is a vimarsha" (against #746) leaves by deletion, not replacement. The server's own tail ("Before this session's first graph write: … load it now…") stays — #163's, untouched.

**The meanings move to the skills, as meanings, not call fields:**
- `S/SKILL.md:215`, the door's "about to write" row: reader / what reading changes / what is new; type, `given_as`, three modes as claims about the node; thesis name, `sense` per arrow; body = present knowledge, provenance to `reasoning`, history, case; a hint is a continuation, not a log; **a wait goes by kind — `Waiting on an answer` / `One-off task`, a vimarsha only for substance**; **each `CHECKS` line … graph integrity, not evidence that anything runs**.
- `S/methods/writing.md`: novelty gate `:11–18` (unchanged); modes as claims about this node `:86`; body/provenance `:126` (unchanged); wait by kind and the hint `:151`; CHECKS ≠ execution `:178` (unchanged).

**Tests** (`js/tests/bridge.test.mjs`, fake server now takes whole tool definitions):
- *fresh* — "write tools reach the harness with the server's descriptions; the channel tool keeps the bridge's lines": write tools and `orient` equal the server's description byte for byte, no `[bridge] The writing skill's moment` anywhere, `verstak_stand` present, `channel` starts with `[bridge] Busyness`, carries `[bridge] action="leave"`, ends with the server's text. **Pass.**
- *negative probe* (prefix back): the same test against the 3.3.0 release build (`git show 25bbbf9:skills/verstak/scripts/verstak-bridge.mjs`, `VERSTAK_BRIDGE_PATH=…`) → **fails**: `verstak_add_vimarsha must reach the harness as the server sent it`, actual starts `[bridge] The writing skill's moment: before each node…`.
- *old annotated cache, login wait* — "a login-wait tool list served from an old bridge's cache carries no writing-moment line": an auth dir with a `.server-answers` cache in the 3.3.0 shape and no grant; `initialize` and `tools/list` are answered from the cache (the stand-in path, graph @nks/nks-dev, node #4790). **Fails on this core — marked `todo`, visible in every run** (`ℹ todo 1`, with the assertion output). The core's `annotateToolList` serves a cached list as stored; no delivery hook reaches it, and the core is not ours to edit. **Remedy proposed upstream** (sibling core, `js/bridge/moment.ts`, the `annotateToolList` loop): strip a known legacy prefix on read, e.g. a delivery-supplied pattern `^\[bridge\] The writing skill's moment: [^\n]*(?:\n\n|$)` (the ru delivery has its own). Probe in scratch only: with that one-line strip in the core, the todo test **passes** and the fresh test still passes; the core was restored and `check-core-lock` re-verified. Until it lands, **#7557/#7576 must not be claimed fulfilled for this delivery**.
- The *offline* stand-in (network refusal) goes through the same `lastServerAnswer` → `annotateToolList`; not tested separately here.
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
| K5 | `inquiry.md:27` "the most valuable" dropped | done | #387 v5 |
| K5 | `inquiry.md:25` Resolution: `addressed_by`; release as its own act by answer condition and kind | done | #156 v3, #464 v13 |
| K5 | `inquiry.md:21` "exactly one door" → the genre's ending axis decides; held/accepted need no exit | done | #156 v3 |
| K6 | `S/methods/assembly.md:71` `bildung` only when actually told apart; a kept whole or open question is a result | done | #387 v5 |
| K6 | `S/methods/autonomous.md:55` lessons → what holds outside the case → the node it touches; nothing → one line | done | #131 v5 |
| K6 | `autonomous.md:147` `addressed_by`, then release by condition and kind | done | #156 v3 |
| K6 | `autonomous.md:31` growing seed → check the unit of continuation | done | #366 v4, #365 v4 |
| K6 | `writing.md:151` seed only for a material continuation condition; absence no failure; release kind-aware | done | #131 v5, #356 v2, #366 v4, #629 v2 |
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
| Seam 5 | moment line removed; door row `SKILL.md:215`; `writing.md` (§1 above) | done in source; **cache result not done** (§1) | #7557 v4, #7576 v3, #4238 v5 |
| §5.1 | re-capture server → bridge → plugin from one build before any parity claim | **not done** — needs the build #163 names and a live grant; no parity is claimed | — |

**Count:** 60 rows — **58 done** (the Seam 5 row counted done for the source removal), **1 unchanged** (K7 door table, kept by design), **1 not done** (the one-build re-capture); plus **one not-done result inside the Seam 5 row**: a login-wait / offline list from an old cache still serves the legacy line (§1).

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
| plugin ENDED word | **done** `js/delivery/words/leads.ts:73`: "Its final report follows — testimony, not acceptance evidence; the case and the carrier hold the grounds and limits". The explicit truncation marker (`js/opencode/leadwords.ts`, `SUMMARY_MAX`) is **not done**: core code, the sibling's |
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
- `S/methods/minding.md:60` "crystallize, then release" for an archived area — a specific procedure, outside the en loci; left.
- `delete_node`'s prefer-visarjana line is server text (N6 (Opus)), not touched.

## 6. Gate

`make check` at `7406548`, the uncommitted `.c1-inputs/` excluded for the run only (`GIT_CONFIG_*` → `core.excludesFile`; validate lists untracked files and bans their Cyrillic): **exit 0**.
- `validate` ✓, `check-bundles` ✓, `check-surface` ✓ (23 tools), `check-core` ✓ (198 files), `check-core-lock` ✓ (d6ec4c29), `lint` 0 errors / 22 warnings (all in core files, e.g. `js/bridge/tokens.ts`; not from this branch's delivery edits), `format-check` ✓, `typecheck` ✓, `check-js` ✓ (committed outputs are the 3.3.0 release build), `test`: 125 tests, **124 pass, 0 fail, 1 todo** (the cache test, §1).
- No flakes; nothing re-run.

## 7. Limits

- **PR458 / draft #458 writing reduction not read.** Any rebase of the door row and `writing.md` onto it is #931's, in one move.
- Core pinned to an **unmerged** sibling commit (§1).
- The stale-cache result needs the upstream core change (§1); #7557/#7576 not fulfilled until then and until a post-wave catalog check.
- No loaded-context probe, no truncation observation, no measurement, no live server or bridge, no re-capture — all §1/§2 claims are about committed text and the offline fake.
- The skill edits are text; whether agents then act differently (base/head probes, redundant-use contrasts) is not observed — REALITY.md's Ceiling.
- Graph read: none beyond the inputs; no graph or case writes (subagent without its own seat).
