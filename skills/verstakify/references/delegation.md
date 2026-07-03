# Subagent delegation — doctrine + role projection

What verstakify projects so heavy reading and mechanical work run outside the
main session's context window. The deployable artifacts are the **role agent
files** below (`.claude/agents/`, `.opencode/agents/`) — not an AGENTS.md
section: AGENTS.md addresses one agent in one session, and orchestration
mechanics stay out of it (the skill's output contract). The agent files'
`description` fields surface in the platform's agent/task tool list every
session, so the routing trigger rides the tool surface and needs no skill
load.

## Doctrine (platform-neutral)

Split work by **role**, not by size. Three roles, three model tiers:

| Role | Tier | Good for | Returns to the orchestrator (main session) |
|---|---|---|---|
| `reader` | cheap (Haiku-class) | breadth-first recon: locate, shortlist candidates, digest with error tolerance | leads + pointers (`file:line`), ≤12 lines |
| `worker` | mid (Sonnet-class) | mechanical execution of a self-contained brief: transforms, inventories, structured writes | status + artifact paths |
| judgment | top / session model | design, review, synthesis — anything the orchestrator acts on directly | conclusion + reasoning |

The orchestrator keeps the user dialogue, decisions, orchestration, and edits
that need conversation context.

Rules — grounded in a 5-task benchmark across tiers, not guesswork:

1. **Cheap tier only where errors are cheap or the output is verified
   downstream.** Measured failure modes: wrong exact counts, wrong extracted
   fields. Never take a cheap-tier count, aggregate, or "final fact"
   unverified.
2. **Verify the artifact, not the report.** A subagent can do the work right
   and describe it wrong — down to parroting an error from the brief. Check
   the file / graph / diff it produced, not its summary of it.
3. **The return contract is load-bearing.** Without it a cheap-tier agent
   returns a 500-word wall into the orchestrator's context. Every brief
   states: `STATUS: DONE|DONE_WITH_CONCERNS|NEEDS_CONTEXT|BLOCKED` + a line
   cap + pointers over dumps. Artifacts go to disk; the return carries paths
   (file handoffs) — everything a subagent prints stays resident in the
   orchestrator's context for the rest of the session.
4. **Briefs are self-contained** — the subagent sees no conversation history.
   Include: the task, constraints ("do not spawn subagents", "read-only"), the
   return contract, and the reality license: *if the brief conflicts with
   reality, follow reality and say so in the return*.
5. **Never parallelize writers over a shared namespace** (same files, same
   realm, same node names) — parallel same-named writes collide or dedup into
   cross-contamination. Parallel readers are free.
6. **Don't delegate**: decisions the owner makes, tasks needing the full
   conversation, exploratory debugging where the hypothesis shifts per step,
   co-edits of files another lane is touching.
7. **Don't pick the cheap tier for speed — it saves money, not wall-clock**
   (it takes more calls). The scarce resource is the orchestrator's context
   window; spend subagent tokens to protect it.
8. **Spot-check every return.** A stopped agent sometimes returns a non-answer
   ("waiting for background work") — resume it with a pointed message instead
   of re-running the whole task.

## Projection — what verstakify generates

Role files per platform in use: Claude Code always; OpenCode when the repo
shows it (`opencode.json` or `.opencode/` present, or the user says so).
Judgment gets no file — it is the primary session's model (per-call top-tier
override where the platform supports it).

The fenced blocks below are the deployed artifacts; surrounding prose is
guidance. Keep every `description` trigger-shaped and under ~500 characters —
it is the routing surface.

### Claude Code — `.claude/agents/reader.md`, `.claude/agents/worker.md`

Model aliases (`haiku`, `sonnet`) are stable platform vocabulary — use them,
not dated model ids.

```markdown
---
name: reader
description: Cheap breadth-first recon — locate files and usages, shortlist candidates, digest docs and logs. Returns leads with pointers, not verified facts; anything load-bearing gets re-checked by the caller. Not for exact counts, field extraction, or facts acted on unverified.
model: haiku
---

Recon agent. Your final message is your only output — the caller sees nothing else.
- First line: `STATUS: DONE|DONE_WITH_CONCERNS|NEEDS_CONTEXT|BLOCKED`; then ≤12 lines of conclusions with `file:line` / id pointers, no file dumps.
- Large findings go to a file on disk; return the path.
- Do not spawn subagents — do the work yourself.
- If the brief conflicts with reality, follow reality and flag it in the return.
```

```markdown
---
name: worker
description: Mechanical execution of a self-contained brief — apply a known transform, build an inventory, write structured records. Needs an explicit brief with a return contract; returns status + artifact paths, not content. Not for judgment calls, design, review, or open-ended exploration.
model: sonnet
---

Execution agent for briefs. Your final message is your only output.
- First line: `STATUS: DONE|DONE_WITH_CONCERNS|NEEDS_CONTEXT|BLOCKED`; then artifact paths / created ids + a one-line summary each, plus concerns.
- Before reporting, verify against the artifact you produced (file, diff, graph node) — report what is there, not what the brief asked for.
- Do not spawn subagents — do the work yourself.
- If the brief conflicts with reality, follow reality and flag it in the return.
```

### OpenCode — `.opencode/agents/reader.md`, `.opencode/agents/worker.md`

Same bodies — reuse them verbatim; only the frontmatter differs. **The model
pin is the point**: an unpinned OpenCode subagent inherits the invoking
primary's model — per-invocation model override does not exist there. Resolve
the current `provider/model-id` for each tier at projection time (ask the
user, or read the configured providers in `opencode.json` / the global
OpenCode config); never copy ids from this reference.

```markdown
---
description: <same as the Claude Code description>
mode: subagent
model: <provider/cheap-tier-id — resolve at projection time>
---
<same body>
```

`worker.md`: same shape, `model: <provider/mid-tier-id>`. The calling agent
invokes via the task tool; `@reader` / `@worker` is the human's affordance.

## Maintainer notes (not deployed)

- Re-verify on platform upgrades, like the interop reference: Claude Code —
  agents dir (`.claude/agents/`), frontmatter keys (`name`, `description`,
  `model`, model aliases); OpenCode — agents dir (`.opencode/agents/`,
  plural), keys (`description`, `mode: subagent`, `model`), the inheritance
  rule (unpinned subagent inherits the invoking agent's model), skills
  discovery reading `.claude/skills/` and `~/.claude/skills/`.
- Delivery rationale: the `description` field is the only channel in context
  every session on both platforms. Skill bodies load on demand and agents
  don't reflexively load them — the agent files sidestep that failure mode.
- `reader` / `worker` are deliberately bare, generic names and may collide
  with same-named user-level agents — accepted trade-off (mirror of the bare
  skill-name convention); rename per-repo if a collision bites.
- The measured benchmark behind the rules: 5 verifiable tasks (repo search,
  mechanical JSON extraction, graph orientation via MCP, convention review
  with planted violations, graph writes by brief) × cheap/mid/top tiers,
  ground truth prepared up front. Measured: review recall 3/6 → 5/6 → 6/6 by
  tier; cheap tier correct on MCP orientation but wrong on counts, field
  extraction, and its own write report.
