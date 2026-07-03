# Superpowers interop — canonical template

Canonical template for the `### Workflow-suite interop (superpowers)`
subsection that verstakify Step 8 projects into a target repo's `AGENTS.md`
(at the end of `## Session lifecycle`), when superpowers is detected and the
user opted in at the Step-1 settle. The deployable section is the fenced block
below; the re-verify checklist after it stays here — never deployed.

## Deployed section text

```markdown
### Workflow-suite interop (superpowers)
Superpowers ratifies this contract itself: "user instructions always take
precedence", with "User's explicit instructions (CLAUDE.md, GEMINI.md,
AGENTS.md, direct requests)" ranked highest priority (using-superpowers,
Instruction Priority); "(User preferences for spec location override this
default)" (brainstorming). AGENTS.md is user instructions — everything below
is inside superpowers' own rules, not an exception to them.
- **Do run brainstorming for creative work** — its socratic elicitation is
  welcome. The spec it writes (e.g. under `docs/superpowers/specs/`) is a
  draft view; the graph is the design record.
- **Persisting decisions to the graph is memory-work, not implementation** —
  the brainstorming HARD-GATE ("Do NOT … take any implementation action") does
  not reach it, by its own wording. A design is not done until its decisions,
  risks, and lifecycle are in the realm.
- **The post-brainstorming handoff stands**: intake the spec into the realm
  first, in the same session (user instructions run first per the precedence
  clause), then hand off to writing-plans exactly as brainstorming directs.
- **Execution plane is ceded**: planning, TDD, debugging, verification, review
  and their kin — whatever the installed suite ships — lead execution.
  Decisions born mid-implementation still land as graph nodes before the
  session ends — never deferred to a future push.

*(interop: <mode> — verified against superpowers@<version> — re-check on
suite upgrade)*
```

Stamp the deployed line with the actually installed version
(`superpowers@<version>`) and the mode the Step-1 settle chose (`full` /
`prose-only`) — the stamp is where the settled mode is recorded; keep it a
plain line — the finalize step strips HTML comments.

## Re-verify checklist (maintainers only — on a superpowers upgrade)

Grep the installed plugin cache for:
1. the spec path `docs/superpowers/specs/` still carrying "(User preferences
   for spec location override this default)";
2. the skills cited still named `using-superpowers`, `brainstorming`;
3. the gate phrasings unchanged: HARD-GATE "take any implementation action"
   and the handoff "writing-plans is the next step";
4. the precedence clauses unchanged: "user instructions always take
   precedence" and the "User's explicit instructions (CLAUDE.md, GEMINI.md,
   AGENTS.md, direct requests)" priority item (using-superpowers, Instruction
   Priority) — also quoted in `skills/entry/SKILL.md` (Coexistence section);
   update both.
