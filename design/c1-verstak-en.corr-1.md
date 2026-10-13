# C1 → verstak/en: correction 1 to the pair design and its M2 delta

This file is a corrective carrier. It does not regenerate anything. It corrects:
- the accepted pair design `design/c1-verstak-en.md`, sha256 `94872bfaccac70784ff827623919f3c749825d6132569ffed090742e04b97afc` (cited as **D:line**);
- its M2 delta `design/c1-verstak-en.m2-delta.md`, sha256 `d1cbd9d12e94452b35b2c86e87b9e54f9e971d8119335254a0bae6dba740c97d` (cited as **Δ:line**).

Neither file was edited. C1, the drafts, the reviews, M1 and M2 are kept unchanged. This follows the wave lead's instruction (№651 [56]): fixes addressed to the pair go in as one move.

**Shares:**
- **#931** owns skills, the bridge and plugin.
- **#163** owns the server contract, which is one for ru and en. Each #163 item below is a meaning, independent of language; the English is only a rendering.
- **#48** is named where the readers name it. I have not read #48's words myself.

**Paths:**
- `S` = `skills/verstak` in the worktree `c1-en` at `25bbbf9`.
- `M2` = `.c1-inputs/m2-surface-en-verstak.json` (`36ceaa95…`).

## Findings → corrections

### C1. Steward decision #7557 removes the bridge's writing-moment line (also #7576)

**Applies: yes.** #7557 v4 (r5) records this decision: *"снимается мостовая строка момента, серверная „Перед первой записью…" остаётся; дверь iskron и writing — в ногу"*. Its grounds are the #931 proposal (№637 [94]), #163's consent ([101]) and the owner's words, verbatim *«Делай как договорились»* ([133]). The node names the en pair's 445-char line as written without that decision. #7576 v3 adds a second ground: the bridge line displaces the purpose line of the seven write tools in the catalog. Δ §2 was the second witness for this (Δ:64–68).

**Replacements in D (#931):**
- **D §5.3, D:482–488**
  - **Was:** "Moment line … replace the 598-char line with the merged wording below (445 chars) …", the quoted line, "Why it is mandatory …", "Keep idempotence and the stand insertion".
  - **Becomes:** "**Moment line: removed per #7557.** The bridge prefixes no line to the seven write tools (6 `add_*` + `batch`). The server's own pointer stays in each of them: 'Before this session's first graph write: if your harness carries a node-writing discipline (a writing skill), load it now…'. Only #163 may change that pointer, and only within the budget. The stand insertion and the `channel` status/leave lines stay."
- **What the line was meant to carry now has homes in the skills (#931, door and writing in step):**
  - **"A wait goes by kind"** (substance → vimarsha `posed_to` on its node; one-off → the case):
    - K7 (D:403–406) already carries it at `S/methods/autonomous.md:126` and `S/methods/architect.md:45`.
    - Add to the door's Agent-moments row "about to write (`verstak_add_*`, `verstak_batch`); `CHECKS` lines in a reply" (`S/SKILL.md`, table under `## Agent moments`, line 213) the clause "; a wait goes by kind — `Waiting on an answer` / `One-off task`, a vimarsha only for substance".
  - **"CHECKS are not execution evidence":**
    - `S/methods/writing.md:175` (After writing, item 6) already says it; no edit there.
    - On the same door row, extend "each `CHECKS` line is work or a reasoned decline" with "— graph integrity, not evidence that anything runs".
  - **"The body is present knowledge; provenance goes to history":** stays at `S/methods/writing.md:123`; no edit.
  - **"A hint is a seed pointer":** K6, `writing.md:148` (D:402); no further edit.
  - **"Name the reader, what changes, what is new":** `writing.md:11–18` (novelty gate and its Sign); no edit.
- **D §5.3, D:501, Truncation**
  - **Was:** "Keep the moment line first: moving it after a long server description could truncate it away."
  - **Becomes:** "There is no bridge moment line (#7557). The truncation testimony (`js/bridge/moment.ts:28`) now applies to the server pointer; see the risk below."
- **D §5.4**
  - **D:509 was:** "the moment line saves −153 × 7 ≈ −1,070".
  - **D:509 becomes:** "removing the moment line takes ≈600 chars × 7 ≈ −4.2k chars off the post-bridge tools/list. Catalog estimate by `npm run cost` (first line ≤120 + signature): the seven catalog lines change from 120 chars of bridge text to the server's purpose line, which the Opus reading puts at 73–106 chars. That is roughly −50 tokens, an estimate rather than a measurement."
  - **D:514 was:** "What leaves in exchange: the moment line's enumeration of provenance … compressed".
  - **D:514 becomes:** "What leaves: the whole bridge line; its content lives in the door and writing (above)."
- **D §7, D:532 (mandatory item 3)**
  - **Was:** "K7 and the bridge moment line — the blanket vimarsha for a wait or relay."
  - **Becomes:** "K7, the removal of the bridge moment line (#7557), and the door's about-to-write row — the blanket vimarsha for a wait or relay leaves together with the line."
- **D §10, D:620**
  - **Was:** "the merged line is in §5.3".
  - **Becomes:** "superseded by #7557: neither line ships."

**Replacements in Δ:**
- **Δ:30 (row "§5.3 moment line") and Δ:62 (budget row "Moment line")** become: "Removed per #7557. Catalog line = the server's purpose line; the bridge has no catalog effect on the write tools."
- **Δ:64–68 and Δ:76 (§3 (d))** become: "(d) After the description wave, #931 confirms #7576's answer condition. In the harness catalog, each write tool's first line is the server's purpose line. The post-bridge tools/list size is compared with the server's 125k limit. #7576 notes it is not established whether that limit applies after the bridge."

**What happens to the bridge code and its tests (#931):**
- **`js/delivery/words/moment.ts`:** drop the `moment` key from `MomentWords` and from the `en` entry. `status` and `leave` stay.
  - `js/tests/delivery-words.test.mjs:66–90` checks that languages carry the same keys and only functions. It should keep passing, because the key leaves the whole dictionary; this is a prediction from the test source, to be verified by running it after the edit.
- **`js/bridge/moment.ts`:**
  - remove `momentLine`, `WRITE_TOOL` (`:9`) and the write-tool branch of `annotateToolList` (`:37–40`);
  - keep the stand insertion (`:25–27`) and the `channel` lines (`:30–36`);
  - rewrite the header comment (`:1–2`, which cites #4238) and the comment "keep both in step" (`:11`), so that #4238's moment now lives in the door and writing, and the server pointer.
- **Shipped outputs:** rebuild per the repo's build. `js/tests/build-check.test.mjs:19–23` lists `skills/verstak/scripts/verstak-bridge.mjs` (the moment line is compiled at `:521`), `skills/verstak/scripts/opencode-plugin.js` and `extensions/verstak.js`.
- **Tests:**
  - No existing test asserts the moment line: grep finds `annotateToolList` only in `js/bridge/deliver.ts:28,135,160,236` and not in `js/tests/`.
  - Add one test on the fake server: write tools' descriptions after the bridge equal the server's (no `[bridge]` prefix); `verstak_stand` is still added; `channel` still carries status/leave.
- **Stale cache (open, #931's choice):**
  - `deliver.ts:135,236` keeps "the full annotated list" in the cache, and `moment.ts:24` says a cached list "may have been written by another bridge".
  - An older bridge's cache can therefore still show the old line until it is relisted.
  - Either strip the known old prefix on read or invalidate the cache on a version change. No source tells which the delivery prefers.

**Risk and limit of the decision (O1). Named, not used to override #7557:**
- In M2, the server pointer sits at the tail of every write tool's description, starting at character:
  - `add_holon` 2643;
  - `batch` 3816;
  - `add_phenomenon` 4298;
  - `add_karta` 4664;
  - `add_kriya` 5555;
  - `add_bianhua` 5584;
  - `add_vimarsha` 9019.
- All of these start past the 2048-char cut that `js/bridge/moment.ts:28` reports for Claude Code. That is source-code testimony; I did not observe the cut.
- Where a harness truncates like this, the loaded description of a write tool carries **no** pointer to the writing discipline. The skill-side homes (the door row, `writing.md`) then carry it alone.
- Changing this needs a separate act on #7557 by #931/#163, with the owner. It is not a design choice of this pair.

### C2. Opus O2 — `ahara … (consumed / destroyed)` in en `add_kriya`

**Applies: yes.** The en surface has two places that state it:
- M2 `verstak_add_kriya.description`, ALLOWED OUTGOING ARROWS: "`ahara → phenomenon (consumed / destroyed)`";
- M2 help `verstak_arrow`: "Capture / consumption (āhāra) — the destruction operator".

According to the Opus reading, ru reads "потребляется, расходуется" at the first place. Both conflict with D15 and #389 v5. My design missed them: S3 and K9 (D:120–140, D:427–430) fix only the skills.

**Add to D §5.2 after D:470:**

| # | Surface | Change (meaning) | D | Catalog |
|---|---|---|---|---|
| T9 | `verstak_add_kriya` ALLOWED OUTGOING ARROWS, ahara row; `verstak_arrow` help, ahara entry | `ahara`: the subject is consumed, or its participation ends at this level and in this scope; this is not physical destruction, and a retained participant goes through `upadhi`. en rendering: "(consumed / its participation ends in this scope)" | D15 | 0 (mid-description and help) |

**Share:** probably #163. By #163's own word (№651 [36]) `typed-add.ts` is theirs, so this is not #48's, but **#163 must confirm**.

**Also:**
- D §7 mandatory item 4 (D:533) extends with ", and T9".
- D has no "texts are structurally identical in ru/en" claim (grep: none). D:7, "every #163 item is stated as a language-independent meaning", gains: "The #163 changes specify one language-independent meaning. In the inspected M2 loci, add_kriya's en 'destroyed' differs from ru 'потребляется, расходуется' (T9); the readings do not establish whole-surface equivalence. Verify the changed ru/en loci on the steward-confirmed carrier." (Revised per Sol's corr-1 review: the earlier wording asserted equivalence of all texts, which no inspected source establishes.)

### C3. Opus O3 — the seam between #64 v8 and #477 v5 under the `add_kriya` risk edit (T3)

**Applies: yes.** #64 v8 (pramanita · vartamana · upeksha; read in r4) says: *«Смягчил — переведи модус сам (visarjana, если снят; upeksha, если принят с компенсацией)»*. T3 (D:465) removes exactly the upeksha half of that formula, on the ground of #477 v5. The visarjana half agrees with C4 below.

**Add to D §8 after D:573:** "**#64 v8 against #477 v5.** #64 v8 lets the mitigating doer set `upeksha` ('accepted with compensation') themselves; #477 v5 makes accepting the unwanted the principal's act. Per C1, the projection follows #477 (T3). The canon conflict is #470's to reconcile; deliveries don't fix it silently. The canon is not edited here."

### C4. Opus O4 and Sol N2 — "pose it to the principal" needs advance authority; release is yours by kind

**Applies: yes.**
- **D:465, T3 (#163)**
  - **Was:** "**accepting a risk (upeksha) is the principal's act — pose it to them**".
  - **Becomes:** "**accepting a risk (upeksha) is the principal's act — pose it to them (`posed_to`) unless they gave authority beforehand**; releasing a risk that no longer applies is yours, by its kind".
- **D:165 (S5, #931)**
  - **Was:** "… putting something into force are the principal's acts."
  - **Becomes:** "… are the principal's acts, unless authority given beforehand by whoever may give it covers the act (next line)."
- **D:177, probe (c)**
  - **Was:** "→ the agent poses the risk, does not set `upeksha`".
  - **Becomes:** "→ with no prior sanction, the agent poses the risk and does not set `upeksha`. Contrast: a doer whose advance authority covers this class of risk records the acceptance with its provenance and does not ask again."
- D:345 (K2 `:93`) already carries the exception; no edit.

### C5. Sol B1 — `add_phenomenon` defines given_as as Gegebenheitsweise

**Applies: yes.** M2 `verstak_add_phenomenon.description`, second paragraph: "`given_as` — the *mode of givenness* (Gegebenheitsweise): not a taxonomy but the way this thing PRESENTS ITSELF to thought." It competes with D1 and `I/INTRO.md:26` at the moment the agent chooses `given_as`. My design fixed it only in the skill (K2, `writing-given-as.md:3`, D:349) and lists given_as among the things consciously unchanged (D:560).

**Add to D §5.2 (#163, mandatory, D1/D19):**

| # | Surface | Change (meaning) | D | Catalog |
|---|---|---|---|---|
| T10 | `verstak_add_phenomenon.description`, second paragraph (and the same phrase at "GIVEN_AS — pick the mode that names how this phenomenon gives itself") | the six values are local practical kinds in which the subject is given, not Husserl's modes of givenness; how you came to know it is the epistemic axis. Choose by content. Remove "Gegebenheitsweise: not a taxonomy". Keep the name `given_as`, the six enum values and the endpoint contract | D1, D19 | 0 (mid-description) |

The first line, "`given_as` says how it gives itself", is the catalog line. Changing it costs catalog tokens, so that is #163's choice and not required here.

**D:560 extends with:** "the enum and name stay; the defining sentence changes (T10)".

### C6. Sol N3 — Fat Node: "reference material becomes a ding-phenomenon"

**Applies: yes**, at M2 `verstak_add_kriya.description`, PARINĀMA / Fat Node: "…reference material becomes a ding-phenomenon. The body carries the transition, nothing else." My design's S13 (D:283–292) states the subject condition only for thickness.

**Add to D §5.2 as recommended, next to T5 (#163, D17):**

| # | Surface | Change (meaning) | D | Catalog |
|---|---|---|---|---|
| T11 (recommended) | the Fat Node sentence | reference material becomes a phenomenon only when it has its own subject and is applied by an action; a fragment needed only to explain the transition stays in the body; keep a seam that matters | D17 | 0 |

### C7. Opus Н1–Н6

- **Н1 (applies, recommended).** Each mandatory T-item (T1–T4, T6–T10) carries a `canon: methodology#N` marker naming its ground. T3's marker is #477, not #64 (C3). #1796's review form is a proposal, not an accepted rule, so this is a recommendation.
- **Н2 (does not apply).** The en design proposes no edit to `look` or the `⛰️ Estafeta:` footer (M2 `verstak_look` NEXT). If the synthesis' edit there is adopted, its runtime twin (`formatters/node.ts`, by #163's word) is #163's.
- **Н3 (applies, mandatory with T1).** M2 `verstak_add_phenomenon` STARTING TRIPUTI reads "(→ pramanita/vartamana/upeksha once confirmed)". This is a second pramanita place in the same tool, which the delta's T1 scope statements missed. Replacement sites (Δ:41, the size-limits line, stays **unchanged**):
  - **Δ:26 (§1 table, T1 row), Was:** "…so T1 touches one argument doc, not six." **Becomes:** "…so T1 touches one argument doc, not six, **plus** the STARTING TRIPUTI clause in the same description: 'once confirmed' → 'once attested on independent grounds'."
  - **Δ:54 (§2 budget table, T1 row), Was:** "≈ +9 tokens, one argument only …". **Becomes:** keep "≈ +9 tokens" as the catalog cost of the one argument doc; add "the TRIPUTI clause is mid-description: 0 catalog tokens, about +20 chars counted toward the 10,000-char description and 125,000-char list limits".
  - **Δ:74 (§3 (b)), Was:** "T1's scope is one argument doc (`add_phenomenon.epistemic_mode`)." **Becomes:** "T1's scope is one argument doc (`add_phenomenon.epistemic_mode`) plus the STARTING TRIPUTI 'once confirmed' clause of the same tool."
- **Н4 (does not apply).** The en design does not cite #1796.
- **Н5 (applies as a limit).** The readers name a deferred "writing reduction, PR458" in the delivery. **No source here**: I didn't read it. Any K-edit to `S/methods/writing.md` and the door row in C1 must be rebased on it by #931.
- **Н6 (applies, consciously unchanged).** M2 `verstak_delete_node`: "Prefer `verstak_update(… volitive_mode=visarjana …)` to retire a vimarsha". That is a choice between a mode and deletion, not "answered → release", so T8 doesn't extend to it.
  - **Add to D §7, consciously unchanged (after D:560):** "`delete_node`'s prefer-visarjana-over-delete line (Н6)."

### Findings about the synthesis, not this design

- **Opus O5** (an undeclared r2→r3 edit), **Opus O6** (the inheritance rule doesn't cover some r1 sections) and **Sol N1** (r1's path and hash in the inheritance line) concern the integrity of the wave lead's synthesis (r3/r1/Astra). The en design has no locus for them, so there is nothing to correct here.

## Mandatory status after correction 1

- **Mandatory, added:**
  - removal of the bridge moment line, plus the door-row clauses (C1);
  - T9, ahara (C2);
  - the T3 / S5 / probe (c) wording (C4);
  - T10, given_as (C5);
  - the Н3 TRIPUTI clause, part of T1.
- **Recommended, added:**
  - T11 (C6);
  - Н1 markers;
  - the stale-cache handling (C1).
- **Open seam, added:** #64 v8 against #477 v5 (C3).
- **Limit, added:** the server pointer is lost on harness truncation (C1, O1).
- **Everything else in 94872bfa and d1cbd9d1 stands.**

## Sources read for this correction

| Source | Version / sha256 |
|---|---|
| `/Users/dmitry/code/nks/c1-pair-designs/review-654-first/night-projection-independent-opus.md` | `e188604635c644213f1575444c64a11b2e66d88de807808c04539faf8f025bcc`, read in full |
| `…/night-projection-independent-sol.md` | `04e06a005ffaeac51f3c8265463cb9ed1e953a6b8c3e1299ef154a5ce7ef886f`, read in full |
| r5 #7557 | v4 (the brief's carriers cite v2; v4's decision text is the one quoted above) |
| r5 #7576 | v3 |
| r4 @alari/methodology #64 | v8 (pramanita · vartamana · upeksha) |
| M2 en | `36ceaa95…09e99`: `add_kriya`, `add_phenomenon`, `look`, `delete_node` descriptions; `arrow` help; tail offsets of the server pointer |
| delivery `c1-en` @ `25bbbf9` | `js/delivery/words/moment.ts`, `js/bridge/moment.ts:1–45`, `js/bridge/deliver.ts` (grep), `js/tests/delivery-words.test.mjs:60–90`, `js/tests/build-check.test.mjs:1–30`, `js/tests/bridge.test.mjs` (grep), `S/SKILL.md:203–240`, `S/methods/writing.md:1–20,93,148,170–176` (grep and read) |

## Non-blocking notes from Sol (corr-1 review)

- Stale cache: the remedy (invalidate or strip the legacy prefix) stays #931's choice, but claiming #7557/#7576 fulfilled requires that no legacy moment line is served; the proposed bridge test should include an old-annotated-cache / offline case alongside the fresh-server case.
- #7557 v4 authorizes branch and measurement work, not production rollout before the owner's release word; nothing here routes unaccepted descriptions through the separate stop-agent wave.
- The seven tail offsets (2643–9019) and first-line lengths (73–106) were independently re-extracted by Sol and match; the 2048 cut remains source-code testimony.
- T11 and Н1 stay recommended; the Н1 marker authorizes no catalog growth or schema field.

## Not done / limits

- **Text only.** No skill, bridge, server, graph or case was changed, and nothing was committed. The design and the M2 delta were not edited.
- **No measurement.**
  - Catalog and size figures are estimates: chars/4 on an approximate signature, and ≈600 × 7 for the line's removal. `npm run cost` was not run.
  - The 73–106-char first lines come from the Opus reading, not my count.
  - The 2048-char cut is source-code testimony.
- **The O2/T9 share** is #163's to confirm. I didn't read `typed-add.ts`, the ru M2, or #48's or #163's case words (№651 [36], [39]); they are cited through the readers.
- **#7557's versions differ.** The brief and readers cite v2, and I read v4. I didn't fetch its history, so I don't know what changed between v2 and v4; the decision sentence quoted above is from v4.
- **Not read:** the synthesis (r1/r3/Astra), the PR458 writing reduction, `formatters/node.ts`, the full plugin, and the remaining help texts.
- **Stale-cache handling** after the line is removed is a #931 design choice with no source either way.
- **Open, for a separate act on #7557:** the risk that a truncating harness loses the server pointer. #931's homes in the door and `writing.md` are the only remaining carriers there.
