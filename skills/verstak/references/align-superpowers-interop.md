# Superpowers interop: canonical template

What Step 7 of `methods/align.md` appends to the target's `AGENTS.md` as a section after `Local overrides` when superpowers is detected and agreed at Step 1. Deploy only the fenced block; its quotes are verbatim.

## Deployed section text

```markdown
### Workflow-suite interop (superpowers)
Superpowers ratifies this contract itself: "user instructions always take
precedence", with "User's explicit instructions (CLAUDE.md, GEMINI.md,
AGENTS.md, direct requests)" ranked highest priority (using-superpowers,
Instruction Priority); "(User preferences for spec location override this
default)" (brainstorming). AGENTS.md is user instructions, so everything below
lives inside superpowers' own rules, not as an exception to them.
- **Do run brainstorming for creative work**: its Socratic elicitation is
  welcome. The spec it writes (e.g. under `docs/superpowers/specs/`) is a
  draft view; the graph is the design record.
- **Persisting decisions to the graph is memory work, not implementation**:
  the brainstorming HARD-GATE ("Do NOT … take any implementation action")
  does not reach it, by its own wording. A design is not done until its
  decisions, risks and lifecycle are in the graph.
- **The post-brainstorming handoff stands**: bring the spec into the graph
  first, in the same session (user instructions run first under the
  precedence clause), then hand off to writing-plans exactly as brainstorming
  directs.
- **The execution plane is ceded**: planning, TDD, debugging, verification,
  review and their kin, whatever the installed suite ships, lead execution.
  Decisions born mid-implementation still land as graph nodes before the
  session ends, never deferred to a future push.

*(interop: <mode> — verified against superpowers@<version> — re-check on
suite upgrade)*
```

Stamp the installed version and the agreed mode (`full` / `prose-only`) as a plain line: finalize strips HTML comments.

## Re-verify checklist (maintainers only, on a superpowers upgrade)

Grep the installed plugin cache for: `docs/superpowers/specs/` with "(User preferences for spec location override this default)"; skills `using-superpowers`, `brainstorming`; "take any implementation action" and "writing-plans is the next step"; "user instructions always take precedence" and "User's explicit instructions (CLAUDE.md, GEMINI.md, AGENTS.md, direct requests)" (also quoted in `methods/entry.md`: update both).
