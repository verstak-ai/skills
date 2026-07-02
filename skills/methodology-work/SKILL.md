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
3. Read the map: the ACTIVE BIANHUA section of orient (lens="bianhua" for the
   full forest) — open work lives there as anga-vimarshas. A seed vimarsha, if
   one exists, is only a pointer to what the map doesn't carry.
4. Read the working principles — they are among the key:true landmarks
   (nks_look the ones your task touches)
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

> The realm now carries a sixth node type — **bianhua** (变化), a qualitative transformation of the system. It is an *assembly-level* primitive (the **assembly** skill), not a routine methodology write: you rarely create one here, but recognise it when reading 形. The five kinds of work below remain the methodology-recording acts.

### 1. Recording a principle (grundsatz)

```
TRIGGER: user states a rule that applies universally
SIGNALS:
  - "always", "never", "without exception", "все без исключения"
  - User corrects you with a general statement, not a local fix
  - A pattern the user has enforced multiple times

DO:
  1. Search methodology for existing coverage — both, the realm likely phrased it differently:
     nks_search(realm="methodology", q="<key terms>")                       # keyword
     nks_semantic_search(realm="methodology", q="<the principle as a sentence>")  # conceptual — catches differently-worded coverage
  2. If covered → don't duplicate. Link to existing.
  3. If not covered → create phenomenon:
     given_as=grundsatz, epistemic=pramanita, ontic=vartamana, volitive=adhimoksha
     attrs.key=true if foundational
  4. Write description: what it IS, what it PREVENTS, what the anti-pattern looks like
  5. Wire upadhi arrows FROM kriyas that apply this principle TO the new grundsatz
     Every arrow carries sense: "why this principle matters HERE"
  6. Context arrow to appropriate holon (usually 行 Воплощение)
  7. re-nks_look — CHECKS: block clean after wiring? (the create self-validated; this re-check is for the arrows you just added)

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
  1. Search methodology for existing coverage (nks_search + nks_semantic_search — keyword + conceptual)
  2. Name as verbal noun (正名): "Замыкание жизненного цикла", not "Close lifecycle"
  3. Identify actor: which karta performs this? (must exist in methodology)
  4. Identify ahara: what does this kriya consume? Must be a sachverhalt or ding.
  5. Identify utpatti: what does this kriya produce? Must be a sachverhalt or ding.
     → If you can't name the utpatti, you don't understand the kriya yet. Stop.
  6. Write description as pariṇāma: "Before: X. After: Y."
     NOT procedure. NOT steps. The qualitative transition.
  7. Wire: ahara, utpatti, actor, upadhi (principles that apply), next (praśna)
  8. re-nks_look → CHECKS: clean? (create self-validated; this confirms the arrows you just wired)
  9. Does this kriya belong to a thread (нить)? If yes → wire next arrows with praśna
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
  4. Context arrow to holon
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
  1. nks_orient(lens="trace", focus=<thread phenomenon>) → see current shape
  2. Identify the gap: which transition is missing?
  3. Create intervening kriya with ahara/utpatti/actor
  4. Wire next arrows with praśna (question-needles)
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
     d. Tool bugs (nks_orient and its lenses — not methodology)
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

## Carrier canon — one liveness axis per род

Modes are not free-form: for every род (type × given_as × genre) ONE axis carries liveness/closedness; the others qualify. Every surface's resolved/active predicate is a table function of that carrier — never per-genre `if`s. The canon itself lives in the realm as key landmarks: the grundsatz **«Ось живости рода»** (the carrier table + the U-universals) and the vollzug **«Грамматика переходов трипути»** (legal moves along the carrier, suspicious transitions, kind-aware forbidden states) — find them via the `key:true` search from «Before you touch anything» and read them before touching modes. Set modes by the род's carrier when recording; when you *extend* methodology, extend the carrier table, never a local exception. The agent-facing summary (starting triples, virodha polarity) lives in the **writing** skill.

## Lessons from experience

These are patterns observed across multiple methodology sessions:

### The user corrects — listen structurally

When the user says "нет, это не так" — they're not giving feedback, they're revealing a principle. Ask: is this correction LOCAL (fix this node) or GENERAL (this applies everywhere)? If general → record as grundsatz.

Examples from real sessions:
- "All ding must be consumed" → the lifecycle-closure grundsatz (no exceptions)
- "Don't confuse thread and estafeta" → the thread ≠ estafeta distinction
- "Complex systems can only grow" → deferred depth is normal
- "Tension is always truthful" → never suppress
- "Graph is not reality, it's tension with reality" → a key grundsatz

### The utpatti test

If you're creating a kriya and can't name its utpatti — you don't understand it yet. Stop. Think. What does this action PRODUCE? What sachverhalt exists after that didn't exist before?

If the answer is vague ("stuff gets better") — you need to distinguish further. Every kriya has a concrete qualitative transition.

### Ahara is destruction

ahara = the phenomenon is CONSUMED. Not "read", not "referenced" — destroyed. If a kriya only reads a phenomenon without consuming it → upadhi, not ahara. If you put ahara and the phenomenon should survive → wrong arrow type.

### Sachverhalts under an umbrella

When you distinguish subtypes of a sachverhalt (risk-вопрошание vs hint-вопрошание), create children under the parent via contains. The parent remains the umbrella. Trace inherits from parent to children — lifecycle of a child is covered by the parent's consumers.

Example: «Вопрошание поставлено» contains its genre-children (Risk, Hint, and the rest).

### The right boundary of a realm

«Задача разрешена» is the right boundary of methodology. Many kriyas produce it. When a new terminal sachverhalt seems "leaked" — check if it's a contains-child of that umbrella. If yes, it inherits the umbrella's consumers and lifecycle closes.

### Re-orient after mutations

After creating 5+ nodes, call nks_orient again. Your mental model drifts from the graph's reality. Re-orient catches drift early.

### Close the loop on the map

At the end of a session the graph itself must carry the state forward — not a seed:
- Completed work changes the graph: update modes, descriptions, arrows of the nodes you touched.
- Open work lives on the map: vimarshas attached via `anga` to the bianhua they drive.
- A seed vimarsha is the exception, not the ritual. Leave one ONLY for what the graph cannot carry — external-world state (a deploy in flight, an agreement made in chat), a chosen ordering of priorities, a convention not yet crystallized. Pointer, not payload: no restating what orient/lenses show, no DONE blocks, no dates, no names, no git refs, no context-recovery instructions. Edit an existing seed in place rather than spawning a vol2; close it (visarjana) once its content has grown into the graph.

## Holons of methodology

| Holon | Chinese | Quality of time | What lives here |
|---|---|---|---|
| 元 Пред-замысел | yuán | Chaos before distinction | Pre-differentiation |
| 意 Замысел | yì | Distinction arises | Intentions, motivations |
| 行 Воплощение | xíng | Bringing into form | Kriyas, principles, methods — most work here |
| 德 Ценность | dé | Quality discovered | Established patterns, validated principles |
| 忠 Верность | zhōng | Maintaining form | Ongoing commitments |
| 忘 Пост-забвение | wàng | Releasing form | Retired forms, scars |

Most methodology work happens in 行 Воплощение. Context arrows for new phenomena usually point here.

## Key nodes to know

The landmarks (`attrs.key=true`) carry the load-bearing canon — find them via the key:true search from «Before you touch anything», by name:

| Name | What it is |
|---|---|
| Мыслепрактик | Root karta — encompasses all roles |
| Эстафета | Phenomenon lifecycle concept |
| Натяжение | Structural tension concept |
| Working principles | Split principle nodes: utpatti учит · справочных типов нет · 理 узор · различение среды · sense на стрелках |
| Lifecycle closure | Every ding born and dies |
| System growth | Can only grow, not be built whole |
| Graph = tension | Not reality — tension with reality |
| Four phases | Backward → forward → whole → impulse |
| Thread ≠ estafeta | Critical distinction |

## What NOT to do

- Don't write from training data. Orient the realm first.
- Don't create nodes without arrows. Orphans are invisible.
- Don't merge grundsatz and vollzug. WHY ≠ HOW.
- Don't suppress tensions. Close structure.
- Don't encode **population expectations** ("top-level kriyas should be few and essential") as tension detectors. Detector grammar is node-grained; a population pattern is invisible to it by design (the *граница рода*). Such expectations belong in the **assembly** agenda, not in counter-detectors.
- Don't write description as procedure. pariṇāma = qualitative transition.
- Don't ignore the CHECKS: block — it prints on every create and on re-look after edits.
- Don't leave payload seeds at session end — the graph carries the state; a thin seed only for what the graph can't hold.
- Don't rush. "Не спеши" — the most common correction.
