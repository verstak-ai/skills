# feedback — a session's experience, recorded where it can be acted on

**Use when:** a task ends or a merge lands and the method or a tool behaved non-trivially — a rule missed an instance, a description misstated what the surface does, a fix worked without you knowing why, a step had no sign of its own. Reflection is the move out of failure 5 (the door, `The method fails in five ways`). Fires by itself on such experience, and on the user's word: "feedback", "give feedback", "record what didn't work", "the skill let me down", `/verstak feedback`. Puts the report into the work graph on the tool's node, addressed to its steward, after checking it hasn't been said. Composes `methods/writing.md`.

What an agent learns about its own tools — a method that led astray, a description promising what the surface doesn't do — never reaches their maintainers unless recorded; the session ends and takes it along.

**The unit is an instance, not an opinion.** "The method is confusing" is nothing to act on; "the rule says X, I did Y, and nothing stopped me" is — concrete enough to argue with, like a counterexample.

## When it fires

**By itself, when one of these actually happened to you:**

- a rule exists, you read it, and the instance still slipped through;
- a description promised behaviour the surface doesn't have — you found out by trying;
- a fix worked, and you can't say it reached the cause;
- a step had no sign of its own, and nothing would have told you it was skipped;
- a tool came back empty where the thing existed under another name.

**When the user calls for it** — `/verstak feedback` or their own words; offer it when they say something about the tools worth keeping that has nowhere else to go. A user's complaint is already an instance: your job is the form, the check and the placement, not judging whether it counts.

**Not:** something that worked as documented; a difficulty that was yours, not the tool's; a preference.

**About the tool, or about your own subject?** Feedback is only about a tool — a method, a tool, the surface, the delivery: its maintainer can fix the instance, not you in your project. Knowledge about your project's work goes into the project's graph by `methods/writing.md`.

## Before writing: which version you hold

An installed copy can lag the maintained one by several releases, and stale text reads as authoritatively as current. Check the installed delivery's version by `methods/align.md` before reporting a method instruction as wrong, and put the version on the report's first line.

## Before writing: has it already been said

A second node saying what one already says splits the answer, and the second gets ignored. Choose the **destination graph** first (below); search and write there.

`verstak_semantic_search(realm=<destination>, q=<the instance in one sentence>)` — **one idea per query, as a natural phrase**: the whole string becomes one vector, and a centroid between several meanings lies near nothing. Two ideas, two queries. Lexical `verstak_search` is the wrong tool here: tokens match with AND, no stemming, so a multi-word query returns nothing.

**On a hit — a near-hit counts — add what's new to the existing node**: another holon where it reproduced, an unnamed mechanism, an instance that narrows or widens it. A second witness turns an accident into a pattern; as a duplicate it's worth nothing. Open a new node only when adding yours would make the existing one about two things.

## Form

Genre first — it decides how the report will be read:

| What you carry | Genre |
|---|---|
| A rule exists and the instance slipped past it | `vyabhichara` (counterexample) |
| The description or its reasoning is itself wrong | `hetu-dosha` (defect in the grounds) |
| An observation worth carrying, without a claim of defect | `hint` |
| A real question about how it should be | `samshaya` (doubt) |

The body, in order:

1. **The instance** — where, and what actually happened.
2. **The rule that should have caught it, quoted verbatim**, if there is one — the load-bearing, most-skipped part: "no rule" and "the rule is right but got skipped" call for opposite fixes, and only the quote tells them apart. A fourth confirmation of a rule still counts: the problem is not the rule.
3. **Where the miss really is** — often not where it first seemed.
4. **The mechanism** — why, not what: a step without its own confirmation is skipped by construction; a fix that removed the symptom teaches itself. Name the shape.
5. **What would close it** — a criterion, not a solution.

Who and from where (holon, harness, date) go in `reasoning`; `posed_by` is the asker's short address. **Epistemic mode by how you know**: `pratyakshita` for what you saw, `anumita` for what you inferred from code or prose — the maintainer then knows whether to reproduce or argue.

## Put it where the tool is maintained — addressed

- **Your graph has a holon for the tool with a steward** (it's where this delivery is developed): the report goes there — a method in its delivery's holon, a tool in its surface's holon, channel discipline in its own sub-boundary.
- **It doesn't** (your project's graph; others maintain the delivery): a report about the delivery's methods, bridge or tools goes to its feedback destination, named by the user or by `AGENTS.md`; neither names one → ask the user. Not into your project's graph — the delivery has no steward there.

Two edges, two questions:

- **The anchor** (`vimarsha_of` → the tool's node or holon) decides where it is **found**: whoever orients on that holon collects it. The method or tool has its own node → anchor there.
- **The address** (`posed_to` → a role) decides **whose queue** it enters. `posed_to="steward"` walks from the anchor to the holon's steward; several candidates produce a refusal listing them — pick one. A report about the method in general goes to the product owner's role.

Neither replaces the other: addressed but unanchored never surfaces where the subject is reviewed; anchored but unaddressed is held by no one.

**Read the holon before placing**: `verstak_orient(realm=<destination>, focus=<the tool's holon>)`; find the tool's node with `verstak_search(realm=<destination>, q=<method or tool name>)`. No holon for the tool → the nearest boundary where it is applied. An anchor on a node that doesn't exist is worse than none.

**You owe an account, not a fix**: write so someone who wasn't there can reproduce and decide. The report joins the role's queue, read with `verstak_orient(focus=<role>)` on entry and on cause. A conversation about the fix happens in a case on the tool's node (`verstak_case(action="talk", about=<subject>)`), not in the report's body — the body is rewritten to current knowledge, not grown into correspondence.

Next moment: the report is placed and addressed → back to the interrupted work; the fix is its maintainer's.
