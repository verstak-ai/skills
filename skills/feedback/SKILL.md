---
name: feedback
description: "Session experience becomes something someone can fix — the agent's own word about the skills and tools it just used. Fires by itself when the experience was non-trivial: a rule missed a case, a description promised what the surface does not do, a fix worked for the wrong reason, a step had no way to prove it was done. Triggers: 'фидбэк', 'дай обратную связь', 'feedback', 'запиши, что не сработало', 'скилл подвёл', 'опиши затык', or the end of a session that carried a stumble. Writes into the shared realm @nks/feedback after checking the field for the same thing already said, and places the case inside that field — the only reach the writer has. Composes writing. Needs the nks_* MCP tools."
slash: true
---

# Feedback — the session's experience, written where it can be acted on

An agent passes through its own instruments all day: skills that fitted or misled, a tool description that promised something the surface does not do, a rule that was right and still let a case through. None of it reaches whoever maintains those instruments, because the session ends and takes it with it.

**The unit is a case, not an opinion.** "The skill is confusing" cannot be acted on. "The rule says X, I did Y, and nothing refused me" can. What makes feedback usable is the same thing that makes a counterexample usable: something specific happened, and it is reproducible enough to argue with.

## When this fires

**By itself, on non-trivial experience** — you do not wait to be asked. Non-trivial means one of these actually happened to you:

- a rule exists, you read it, and a case still escaped it;
- a description promised behaviour the surface does not have — you found out by attempting the move;
- a repair worked, and you cannot say it addressed the cause;
- a step had no sign of its own, so nothing would have told you it was skipped;
- you reached for an instrument and it returned nothing, where the thing existed under another name.

**And the user can call it directly** — `/feedback`, in their own words. Offer that when they say something about the instruments that is worth keeping and has nowhere else to go. A person's complaint is already a case; your job is the form, the check, and the placement, not the judgement of whether it counts.

**What does not fire it:** something that worked as documented; a difficulty that was yours rather than the instrument's; a preference. A field full of "I would have liked" is a field nobody reads.

## Before you write: has this already been said

The field is shared and long-lived, so the first move is not writing — it is looking. A second node saying what one already says splits the answer, and the second one is the one that gets ignored.

`nks_semantic_search(realm="@nks/feedback", q=<the case as one sentence>)` — **one concept per query, as a natural phrase.** A bag of terms is a bag of directions: the whole string becomes a single vector, and a centroid between several meanings sits near nothing. Two concepts mean two queries, not one longer one. Lexical `nks_search` is the wrong instrument here — its tokens are AND-matched and unstemmed, so a many-word query returns nothing precisely when you have most to say.

**On a hit, add the novelty to the node that stands — do not open a second.** Say what is new: another contour where it reproduced, a mechanism the first account did not name, a case that narrows or widens it. A second sighting is worth more than the first, because it turns one session's accident into a pattern; recorded as a duplicate, it is worth nothing.

**Near-miss is not a miss.** If a node covers the same defect from another angle, that is a hit. Only open a new node when what you carry would make the existing one about two things.

## The form

Genre first, and it decides how the case is read:

| What you carry | Genre |
|---|---|
| A rule exists and a case escaped it | `vyabhichara` |
| A description or justification is itself wrong | `hetu-dosha` |
| An observation worth carrying, no defect claimed | `hint` |
| A genuine question about how something should be | `samshaya` |

Then the body, in the realm's language, in this order:

1. **The case.** Where, when, what actually happened — concretely enough to be argued with.
2. **The rule that should have caught it — quoted verbatim, if there is one.** This is the load-bearing part and the one most often skipped. "There is no rule" and "the rule is right and was skipped anyway" call for opposite fixes, and only the quote tells them apart. A case that confirms a rule for the fourth time is still worth writing: it says the rule is not the problem.
3. **Where the miss actually is** — which is often not where it first looked.
4. **The mechanism.** Why this happens rather than what happened. A step with no confirmation of its own gets skipped by construction, not by inattention; a repair that clears the symptom teaches itself. Name the shape, and the case stops being one incident.
5. **What would close it** — the criterion, not the solution. You are not the one who will fix it.

`attrs.posed_by` carries who and from where: the contour, the harness, the date. A case whose origin cannot be traced cannot be reproduced.

**Write the mode honestly.** `pratyakshita` for what you watched happen; `anumita` for what you inferred from reading code or prose. The difference is what tells the maintainer whether to reproduce it or to argue with it.

## Place it inside the field, and only inside it

The field is the whole of your reach here. You have this realm — its kartas and its boundaries — and nothing beyond it: the contour that will actually fix your case lives in a realm you cannot see, address, or write into. **Do not promise yourself otherwise, and do not leave the case unplaced because the real owner is elsewhere.** Placing it well inside the field is the entire job, and it is what decides whether the case is ever found.

Two edges do that work, and they answer different questions:

- **The anchor** (`vimarsha_of` → the boundary your case falls in) decides where it is **found**. Whoever orients on that boundary gathers everything anchored under it; a case anchored nowhere is discoverable only by whoever reads the whole field.
- **The address** (`posed_to` → the karta that answers for it) decides **whose queue** it enters.

Neither substitutes for the other: addressed but unanchored, it never surfaces where the subject is reviewed; anchored but unaddressed, nobody is holding it.

**Read the field before you place — never guess the shape from another realm.** `nks_orient(realm="@nks/feedback")` shows the boundaries and the roles that exist *today*. Where the field is still flat — no boundary fits, one karta receives everything — both edges collapse onto that receiver, and that is correct rather than lazy. Anchoring on a boundary that does not exist is worse than not anchoring.

**What you owe the case is the account, not the fix.** Write it so a reader who was not there can reproduce it and decide. You will not be in the session where it is acted on.

## What feedback is NOT

- Not **writing** — that skill is how any node is formed; this one is which node, into whose field, after which check.
- Not **inquiry** — the life of a vimarsha through its lifecycle happens in the realm that owns the question. Here you deposit a case and let its holder run it.
- Not **reality-audit** — that verifies your own deliverable. This reports on the instruments you used to build it.
- Not a channel for praise or for grievance. If nothing would change had the case been known, it is not feedback.
