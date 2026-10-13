# C1 → verstak/en: delta for the corrected server surface M2

This is a delta to the accepted pair design `design/c1-verstak-en.md` at sha256 `94872bfaccac70784ff827623919f3c749825d6132569ffed090742e04b97afc`. The design was not edited, and C1 and the drafts were not changed. The delta comes from the steward #163 (case №650 [30], [34], [35]; №651 [36]).

## Sources

- **M1:** `.c1-inputs/server-export-en-verstak.json`, sha256 `328014fdeb8066f13d12a612074d0df9e86d886d6520f9a83621197f3fccf82e`.
- **M2:** `.c1-inputs/m2-surface-en-verstak.json`, sha256 `36ceaa9543504ba32e407b0f46684cbe8db472fafe8ee23645a36c9a32809e99`.
- **What I checked locally:**
  - M2 equals M1 when "99999" is replaced by "64" in the tools: the comparison returns `True`.
  - M2 adds a root key `attrsLimit: 64`.
  - The `help` objects are identical.
  - The 9 changed tools are: `add_bianhua`, `add_holon`, `add_karta`, `add_kriya`, `add_phenomenon`, `add_vimarsha`, `arrow`, `batch` and `update`. The six factories have 2 occurrences each, `arrow`, `batch` and `update` 1 each: 15 in total.
  - `outputSchema` is present on `verstak_admin` and `verstak_channel` only.
- I did not observe the live server myself. The statement that "the live contour limit is 64" is #163's testimony. It agrees with the postbridge capture (`B`), which printed ≤64.

## 1. Where the design relies on the attrs cap or on the 9 tools' descriptions

| Design line | What it says | Does M2 change the conclusion? | Reason |
|---|---|---|---|
| §5.1, line 448 | "attrs '≤99999' (E) versus '≤64' (B)", listed under "Residual differences are not proved bridge effects" | **Yes, it closes the item.** | M2 explains the difference as an error in the server export M1. The live server's limit is 64, and the bridge passed through what the live server sent. It was not a bridge effect, and it was not an unexplained residual. Move it out of the residual list and into "explained: an M1 export error, corrected in M2". |
| §5.1, lines 449–453 | the other residuals: the open_room length, the 400-char limit on case text, `fold`'s scope, `from_standing` address/id, `keep_cursor` wording | **No.** | M2 changed nothing else (local check above). These differences between E and B stay unexplained by M2, so the mandatory capture of server→bridge→plugin from one build (line 455) still stands for them. |
| §5.1, line 455, and §10, line 619 | the withdrawn bridge-delta item ("bridge delta observed: attrs caps ≤99999 → ≤64") | **The withdrawal stands, and its reason is now known.** | It was never a bridge transformation. M1 printed the wrong cap, and M2 corrects it. Sol's caution (not proven to be a bridge effect) is confirmed. My phase-1 attribution remains withdrawn. |
| S3, line 132; K9 | "never silence `leaked` with attrs" | **No.** | The rule concerns *using* attrs (`persistent`/`reference`) to mute a tension, not their length. Such keys fit within 64. |
| K2, and the delivery's rule at `writing.md:125` ("`attrs` hold data, not prose") | the design keeps this rule and adds no attrs prose | **No; M2 reinforces it.** | A limit of 64 chars per value rules out prose in attrs. Nothing in the design proposes an attrs value longer than 64 or a new attrs key carrying reasoning. Provenance goes to `reasoning` and history, and grounds to arrows and bodies (S1, S4). The design gives an agent no discretion over the attrs limit: it is the contour's limit, read from the tool's argument doc. |
| T1, line 463 | change `add_phenomenon.epistemic_mode`, "and the same for the epistemic args of the other factories" | **No change of meaning; the scope narrows.** | In M2, only `add_phenomenon`'s `epistemic_mode` doc names pramanita ("confirmed it from several sources (pramanita)"). The other factories' epistemic args don't mention it, so T1 touches one argument doc, not six. M2 didn't change that doc. |
| T2 and T7, lines 464 and 469 (`verstak_update`) | edits to the axes, the escalation clause and the DECIDING passage | **No.** | M2 changed only the attrs cap in `update`. The quoted sentences are unchanged in M2. |
| T3, line 465 (`verstak_add_kriya` step 4) | the risk sentence | **No.** | Unchanged in M2. |
| T8, line 470 (`verstak_add_vimarsha` NEXT) | release by kind | **No.** | Unchanged in M2. |
| §5.3, line 482: the moment line on the 7 write tools (6 factories + `batch`) | shorten it and fix "a question … is a vimarsha" | **No change of meaning; its measure changes** (§2). | M2 confirms that these 7 tools differ from M1 only in attrs. The bridge prefix is prepended to the M2 descriptions exactly as before. |
| `outputSchema` (not used by the design) | — | **No.** | It is declared on `admin` and `channel`. The design proposes no edit to either, and the cost of conditional sending isn't part of any T item. |

## 2. The named counting method and the design's budget limits

**The method #163 named** (`npm run cost` in nks-mcp):
- one catalog line per tool: "<Code Mode signature> // <first description line, at most 120 chars>";
- tokens = chars / 4, an estimate;
- cap 9,500 tokens;
- argument docs are part of the signature;
- `action="?"` help is not in the catalog;
- limits: the whole tools/list ≤ 125,000 chars, one description ≤ 10,000 chars, one argument doc ≤ 520 chars.

**Effect on the design's limits:**
- **"No source for how the budget is counted"** (§5.4, line 505; "Not done", line 685): **narrowed, not closed.** The method is now named by its owner. I did not run `npm run cost` and couldn't reproduce the exact Code Mode signature. A rough local projection of M2 (each tool's first line plus its argument docs) gives about 34,400 chars, which is about 8,600 tokens. That is consistent with the brief's ≈9,252, but it is not a measurement.
- **§5.4's character arithmetic** (whole descriptions, line 506: 63,743 chars) **was the wrong measure for the cap.**
  - Only the first description line (truncated at 120 chars) and the argument docs count.
  - Edits in the middle of a description cost **0 catalog tokens**. They still count against the 10,000-char limit per description and the 125,000-char limit for the whole list. M2's tools JSON is 122,302 chars, so there is about 2,700 chars of headroom under 125k for the whole list, schemas included. That makes the whole-list limit, not the 9,500-token cap, the tighter constraint on any additions inside descriptions.
- **The rule "no additive ships until its paired deletion is measured"** (line 507) stands. It now has a concrete instrument (`npm run cost`, owned by #163), and it must also check the 125k whole-list limit.

**Estimated deltas of the T items by this measure** (an estimate from M2 text, not a measurement):

| Item | Where the change sits | Catalog Δ (tokens ≈ chars/4) | Other limits |
|---|---|---|---|
| T1 | `add_phenomenon.epistemic_mode` argument doc (part of the signature): "confirmed it from several sources" → "attested on independent grounds — sources sharing an origin count once"; 170 → 207 chars | **≈ +9 tokens**, one argument only (the design's "≤ +270 chars" assumed six) | 207 ≤ 520 |
| T2 | `update` description, middle (axes, escalation clause) | **0** | about +95 chars toward the description's 10k and the list's 125k |
| T3 | `add_kriya` description, middle (step 4) | **0** | ≈ ±0 chars |
| T4 | `case` help | **0** (help isn't in the catalog) | — |
| T5 | runtime footer | **0** | — |
| T6 | contract confirmation | **0** | — |
| T7 | `update` description, middle (DECIDING) | **0** | ≈ ±0 chars (replaces text) |
| T8 | `add_vimarsha` description, middle (NEXT) | **0** | ≈ ±0 chars (replaces text) |
| Moment line (#931, bridge) | prefixed **before** the first line of the 7 write tools | **≈ 0.** Both the old (598) and new (445) lines exceed 120 chars, so either way the catalog line shows 120 chars of bridge text. The design's "−1,070 chars" saving is a whole-description saving, not a catalog saving. | The server's `npm run cost` doesn't see bridge text at all. The bridge's effect is on the postbridge catalog. |

**A consequence the design already flags, now concrete.** Under this method, the bridge prefix *replaces* each write tool's catalog line: the server's purpose line, e.g. "Create a 🔄 kriya: a repeatable action an actor performs, consuming and producing phenomena.", is pushed out of the visible 120 chars.
- This session's own Code Mode catalog shows exactly that, for the ru (iskron) bridge: `iskron_add_bianhua`'s line reads "[мост] Момент скилла writing: перед вызовом по каждому узлу назови читателя…".
- That is an observation of the ru delivery, not of verstak/en.
- The first 120 chars of the merged en line are: "[bridge] Writing moment, per node: its reader, what it changes, what is new; type, given_as, three modes as claims about". The fix for "a wait goes by kind" sits beyond 120 chars, so it is not visible in the catalog line. It is visible only in the full description that the harness loads.
- This doesn't change the design's decision to keep the moment line first: `js/bridge/moment.ts:28`, a 2048-char truncation, governs the loaded description, not the catalog line. It does add a measurable item for #931, below.

## 3. Conclusion

**Design 94872bfa stands with this delta.** Its conclusions don't change; only the following implementation and measurement notes are added:
- **(a)** §5.1's attrs residual is explained as an error in the M1 export, corrected in M2. The other five residuals stay open.
- **(b)** T1's scope is one argument doc (`add_phenomenon.epistemic_mode`).
- **(c)** Budget checks use `npm run cost`, plus the whole-list limit of 125k chars (≈2.7k chars of headroom in M2).
- **(d)** #931 measures the postbridge catalog line of the 7 write tools under that method and decides whether the first 120 chars of the moment line should carry the "wait by kind" and tool-purpose cues. That is a delivery choice within the accepted line, not a design change.

## Limits

- I didn't run `npm run cost`. The token figures are estimates (chars/4 on my approximation of the signature).
- The live server's limit of 64 is #163's testimony, matched by B. I did not observe it directly.
- I didn't re-read the graph or the skills. The line numbers refer to `design/c1-verstak-en.md` at `94872bfa`.
- I didn't verify whether the postbridge catalog uses the same first-line rule as the server's `npm run cost`. My only evidence that it does is the ru catalog seen in this session.
