---
name: methodology-work
description: "Use this skill when working on the methodology realm itself — not applying methodology to a project, but evolving the methodology. Triggers: 'methodology realm', 'работа над методологией', 'обогатить методологию', 'methodology нужно дополнить', 'записать принцип', 'новая крия в methodology', 'новая нить', references to 'methodology' realm by name, or when the user brings agent feedback about methodology gaps. Distinct from design (designing external systems) and weaving (semantic repair). This is meta-work: methodology applied to itself. The stakes are highest — every node here shapes how every future agent thinks."
---

# NKS Methodology Work

You are working on the methodology realm — the graph that teaches all other agents how to work. Every node you write here will be read by hundreds of agents. Every principle you record will shape their decisions. Every kriya you define will become their path.

This is not design. This is not weaving. This is the methodology describing itself.

## Before you touch anything

```
1. nks_orient(realm="methodology", include_schema=false)
   → Read root holons (元意行德忠忘), entry/exit kriyas, key nodes, active vimarshas, tensions
2. nks_search(realm="methodology", q="", attrs_filter="key:true", limit=50)
   → Key nodes = landmarks. Start here when learning.
3. Read the seed vimarsha left by the previous session:
   nks_search(realm="methodology", q="seed", node_type="vimarsha", sort="recent", limit=3)
4. Read working principles:
   nks_look(node_id="332", realm="methodology")
```

Do NOT write from training data. The realm has its own vocabulary, its own distinctions, its own history. Orient first. Always.

## What belongs in methodology

| YES — record it | NO — don't |
|---|---|
| Principle that applies across all realms | Principle specific to one project |
| Kriya that any agent in any realm performs | Kriya specific to nks-dev or a product |
| Distinction that prevents a class of agent errors | Fix for one agent's one-time mistake |
| Pattern observed across 2+ realms | Pattern seen in only one context |
| Correction from the user that reveals a general rule | Correction that's just a local fix |

## Types of methodology work

### 1. Recording a principle (grundsatz)

```
TRIGGER: user states a rule that applies universally
SIGNALS:
  - "always", "never", "without exception", "все без исключения"
  - User corrects you with a general statement, not a local fix
  - A pattern the user has enforced multiple times

DO:
  1. Search methodology for existing coverage:
     nks_search(realm="methodology", q="<key terms>")
  2. If covered → don't duplicate. Link to existing.
  3. If not covered → create phenomenon:
     given_as=grundsatz, epistemic=pramanita, ontic=vartamana, volitive=adhimoksha
     attrs.key=true if foundational
  4. Write description: what it IS, what it PREVENTS, what the anti-pattern looks like
  5. Wire upadhi edges FROM kriyas that apply this principle TO the new grundsatz
     Every edge carries sense: "why this principle matters HERE"
  6. Context edge to appropriate holon (usually 行 Воплощение #179)
  7. re-nks_look — CHECKS: block clean after wiring? (the create self-validated; this re-check is for the edges you just added)

DESCRIPTION FORMAT:
  - What the principle states (one sentence)
  - Why (what goes wrong without it — concrete)
  - Anti-pattern (what agents do wrong — concrete)
  - How to apply (operational, not philosophical)
```

### 2. Recording a kriya (pattern of action)

```
TRIGGER: a pattern of action that any agent performs, not captured in methodology
SIGNALS:
  - You just did something in a realm and realized it's a general pattern
  - User described a process that applies beyond this project
  - Agent feedback identifies a gap: "I had to invent this idiom"

DO:
  1. Search methodology for existing coverage
  2. Name as verbal noun (正名 #72): "Замыкание жизненного цикла", not "Close lifecycle"
  3. Identify actor: which karta performs this? (must exist in methodology)
  4. Identify ahara: what does this kriya consume? Must be a sachverhalt or ding.
  5. Identify utpatti: what does this kriya produce? Must be a sachverhalt or ding.
     → If you can't name the utpatti, you don't understand the kriya yet. Stop.
  6. Write description as pariṇāma: "Before: X. After: Y."
     NOT procedure. NOT steps. The qualitative transition.
  7. Wire: ahara, utpatti, actor, upadhi (principles that apply), next (praśna)
  8. re-nks_look → CHECKS: clean? (create self-validated; this confirms the edges you just wired)
  9. Does this kriya belong to a thread (нить)? If yes → wire next edges with praśna
  10. Does this kriya participate in an estafeta? If yes → check trace

CRITICAL: a kriya without utpatti is a kriya you don't understand.
```

### 3. Recording a distinction (sinn)

```
TRIGGER: user corrects a confusion between two concepts
SIGNALS:
  - "не путай X и Y"
  - You mixed up two things and got corrected
  - An agent's feedback reveals a systematic confusion

DO:
  1. Create phenomenon: given_as=sinn, name clearly states both sides
     ✓ "Различение: нить (next) ≠ эстафета (ahara/utpatti)"
     ✗ "Нить и эстафета" (doesn't say what the distinction IS)
  2. Description: what each side IS, how they DIFFER, what agents CONFUSE
  3. Wire upadhi FROM kriyas where this distinction matters
  4. derived_from if one concept was already recorded
  5. re-nks_look → not orphan? Must have at least one upadhi.
```

### 4. Recording a vollzug (method/pattern)

```
TRIGGER: a way of working that agents should follow
SIGNALS:
  - "паттерн", "рецепт", "идиома", "так делай"
  - Repeated instruction across sessions
  - Agent feedback: "I had to figure this out myself"

DO:
  1. Create phenomenon: given_as=vollzug
  2. Description: WHEN to use, HOW to apply, ANTI-PATTERN to avoid
  3. Wire upadhi FROM kriyas that use this method
  4. Context edge to holon
  5. If derived from a principle → derived_from the grundsatz

vollzug is HOW. grundsatz is WHY. Don't merge them.
```

### 5. Extending a thread (нить)

```
TRIGGER: existing thread is incomplete — missing kriyas, missing steps
SIGNALS:
  - Agent couldn't navigate: praśna didn't help choose
  - Thread ends but work continues (missing next)
  - Gap between two kriyas where something should happen

DO:
  1. nks_trace on thread phenomenon (#337-#343, #399) → see current shape
  2. Identify the gap: which transition is missing?
  3. Create intervening kriya with ahara/utpatti/actor
  4. Wire next edges with praśna (question-needles)
  5. Wire thread phenomenon as upadhi on new kriya
  6. Re-trace → thread flows?

PRAŚNA QUALITY CHECK: can an agent answer yes/no from their situation?
  ✓ "Path built — where can it break?"
  ✗ "Continue to next step" (not a question, always yes)
```

### 6. Processing agent feedback

```
TRIGGER: user brings feedback from an agent that used NKS tools
DO:
  1. Read feedback carefully. Separate:
     a. Real methodology gaps (agent couldn't find guidance)
     b. Skill gaps (methodology knows, skill doesn't teach)
     c. Agent errors (agent misunderstood, methodology is fine)
     d. Tool bugs (nks_orient, nks_tensions — not methodology)
  2. For each real gap: which type of work? (principle/kriya/distinction/vollzug/thread)
  3. For each agent error: what did the agent get wrong? Is it a PATTERN that other agents will repeat?
     If yes → record as distinction or anti-pattern in a grundsatz/vollzug
  4. For skill gaps → update relevant skill, not methodology
  5. For tool bugs → vimarsha in nks-dev, not methodology

CRITICAL PATTERN — agent tries to suppress tension:
  This is THE most common agent error. The correct response is ALWAYS:
  close the structure, never suppress the signal.
  If you see attrs.role='reference', attrs.persistent=true, attrs.parked=true
  used to silence tensions → it's wrong. Record the anti-pattern.
```

## Lessons from experience

These are patterns observed across multiple methodology sessions:

### The user corrects — listen structurally

When the user says "нет, это не так" — they're not giving feedback, they're revealing a principle. Ask: is this correction LOCAL (fix this node) or GENERAL (this applies everywhere)? If general → record as grundsatz.

Examples from real sessions:
- "All ding must be consumed" → #389 (lifecycle closure, no exceptions)
- "Don't confuse thread and estafeta" → #412 (distinction)
- "Complex systems can only grow" → #390 (deferred depth is normal)
- "Tension is always truthful" → #404 (never suppress)
- "Graph is not reality, it's tension with reality" → #403

### The utpatti test

If you're creating a kriya and can't name its utpatti — you don't understand it yet. Stop. Think. What does this action PRODUCE? What sachverhalt exists after that didn't exist before?

If the answer is vague ("stuff gets better") — you need to distinguish further. Every kriya has a concrete qualitative transition.

### Ahara is destruction

ahara = the phenomenon is CONSUMED. Not "read", not "referenced" — destroyed. If a kriya only reads a phenomenon without consuming it → upadhi, not ahara. If you put ahara and the phenomenon should survive → wrong edge type.

### Sachverhalts under an umbrella

When you distinguish subtypes of a sachverhalt (risk-вопрошание vs hint-вопрошание), create children under the parent via contains. The parent remains the umbrella. Trace inherits from parent to children — lifecycle of a child is covered by the parent's consumers.

Example: #141 (Вопрошание поставлено) contains #400 (Risk), #401 (Hint), #407-#411 (other genres).

### The right boundary of a realm

#146 (Задача разрешена) is the right boundary of methodology. Many kriyas produce it. When a new terminal sachverhalt seems "leaked" — check if it's a child of #146 via contains. If yes, it inherits #146's consumers and lifecycle closes.

### Re-orient after mutations

After creating 5+ nodes, call nks_orient again. Your mental model drifts from the graph's reality. Re-orient catches drift early.

### Leave a seed

At the end of every methodology session, create a hint-vimarsha:
- posed_by: you (with session date)
- posed_to: Claude (next session)
- vimarsha_of: 行 Воплощение (#179)
- Content: what was done, what remains, how to recover context
- Include conversation_search queries for the next agent

## Holons of methodology

| Holon | Chinese | Quality of time | What lives here |
|---|---|---|---|
| 元 Пред-замысел | yuán | Chaos before distinction | Pre-differentiation |
| 意 Замысел | yì | Distinction arises | Intentions, motivations |
| 行 Воплощение | xíng | Bringing into form | Kriyas, principles, methods — most work here |
| 德 Ценность | dé | Quality discovered | Established patterns, validated principles |
| 忠 Верность | zhōng | Maintaining form | Ongoing commitments |
| 忘 Пост-забвение | wàng | Releasing form | Retired forms, scars |

Most methodology work happens in 行 Воплощение (#179). Context edges for new phenomena usually point here.

## Key nodes to know

| # | Name | What it is |
|---|---|---|
| 111 | Мыслепрактик | Root karta — encompasses all roles |
| 128 | Эстафета | Phenomenon lifecycle concept |
| 129 | Натяжение | Structural tension concept |
| 332 | Working principles | Session 2026-04 principles — read first |
| 389 | Lifecycle closure | Every ding born and dies |
| 390 | System growth | Can only grow, not be built whole |
| 403 | Graph = tension | Not reality — tension with reality |
| 405 | Four phases | Backward → forward → whole → impulse |
| 412 | Thread ≠ estafeta | Critical distinction |

## What NOT to do

- Don't write from training data. Orient the realm first.
- Don't create nodes without edges. Orphans are invisible.
- Don't merge grundsatz and vollzug. WHY ≠ HOW.
- Don't suppress tensions. Close structure.
- Don't write description as procedure. pariṇāma = qualitative transition.
- Don't ignore the CHECKS: block — it prints on every create and on re-look after edits.
- Don't forget the seed vimarsha at session end.
- Don't rush. "Не спеши" — the most common correction.
