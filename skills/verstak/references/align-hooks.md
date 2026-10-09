# Claude Code hooks: exact shape for projection and repair

Shapes for the hooks Step 4 of `methods/align.md` names, in `.claude/settings.json`. Other harnesses: `references/align-harness-surfaces.md`.

## Envelope
Each hook's `command` echoes an envelope; mind the nesting `event → array → {"hooks":[{"type":"command","command":…}]}`:
```json
{ "hooks": { "SessionStart": [ { "hooks": [ { "type": "command",
  "command": "echo '{\"hookSpecificOutput\":{\"hookEventName\":\"SessionStart\",\"additionalContext\":\"Load the verstak skill first (/verstak) and read its Start section before any other action. Addresses from AGENTS.md: graph <Graph>, focus holon #<Focus holon>, agent role #<Agent role>, owner role #<Owner role>. Take a seat only to stand watch, with one verstak_stand. A launch line of the form verstak GRAPH ROLE case #N enters that case. A subagent works on its own satellite bridge (verstak_stand with satellite_of, then join and leave on it); on the bridge of the agent that launched it, it writes nothing to the graph.\"}}'" } ] } ] } }
```
The run fills the four slots from the AGENTS.md frontmatter; no angle brackets remain. The first sentence asks for the skill by name so the door loads every session. No apostrophes (single-quoted `echo`).

## Push and merge: fire on the outcome, not the form
`PostToolUse` entries with `"matcher": "Bash"`; gate: `jq -e '<filter>' >/dev/null && echo '<envelope>' || true`.
- Match a **command** (at line start or after `;`, `&&`, `|`, `(`, a newline; `env` and assignments before it; `-C <path>` on git), never a substring (`echo`, `grep`, a PR body).
- Help (`-h`, `--help`), and `--auto`/`--disable-auto` on a merge, never fire. Flags count only outside quotes (`def a` consumes a quoted string whole; `\"` inside double quotes and `don\'t` outside don't open one; `$(…)` and heredocs aren't parsed).
- The exit code speaks only for a command last in the chain or before `&&`. After `|` or `;`, only a confirmation line in `tool_response` fires:
  - **push:** `To <remote>` then an updated-ref line (flag ` `, `*`, `+` or `-`; not ` ! ` or ` = `). Only new tags (` * [new tag]`) → no fire: a release tag is not a branch for review. A forced tag push or a tag deletion looks like a branch push and fires. Last in the chain, exit 0 fires even on "Everything up-to-date" (accepted gap).
  - **quiet push** (`-q`/`--quiet`): git state, below.
  - **`gh pr merge`:** `Merged` / `Squashed and merged` / `Rebased and merged pull request` (outside a terminal gh prints nothing; only the exit code tells).
  - **fj:** `Merged PR #`.

Push:
```
def a: "(?:>&|\\\\.|\\x27[^\\x27]*\\x27|\\x22(?:[^\\x22\\\\]|\\\\.)*\\x22|[^;&|)\n\\x27\\x22\\\\])*"; def at(h; n): "(?:^|[;&|(\n] *)" + h + "(?=[ ;&|)\n]|$)(?!" + a + " (?:" + n + ")(?:[ ;&|)\n]|$))"; def out: (.tool_response | if type == "object" then "\(.stdout // "")\n\(.stderr // "")" else tostring end); def ran(h; n; said): (.tool_input.command // "") as $c | out as $o | ($c | test(at(h; n) + a + "[ \n]*(?:&&|$)")) or (($c | test(at(h; n))) and ($o | test(said))); ran("(?:env +)?(?:[A-Za-z_]+=[^ ]+ +)*git(?: -C [^ ]+)* push"; "-h|--help"; "To [^\n]+(?:\n [!=] [^\n]*)*\n [ *+-]") and (out | test("^(?=[\\s\\S]*\n [*] \\[new tag\\])(?![\\s\\S]*\n (?:[ +-] |\\* (?!\\[new tag\\])))") | not)
```
A quiet push prints no `To <remote>` and, trimmed, looks like a rejection, so git state decides: a second `jq` recognises the form (from line start through whole quotes, no `<<`), then the shell checks that `git rev-parse HEAD` and `git rev-parse "@{push}"` are non-empty and equal (an accepted push moves `@{push}` to `HEAD`) and the branch isn't `main`/`master`. Limits: `-uq` is missed; `<<` silences it; a push elsewhere (`git -C`, `cd`, another branch or remote), with nothing to send, or from `main`/`master` is judged by that equality; no upstream → silent; git is read in the session's directory. Assemble: `p=$(cat); { printf %s "$p" | jq -e '<push filter>' >/dev/null || { printf %s "$p" | jq -e '<quiet-push filter>' >/dev/null && h=$(git rev-parse HEAD 2>/dev/null) && [ -n "$h" ] && [ "$h" = "$(git rev-parse "@{push}" 2>/dev/null)" ] && case "$(git rev-parse --abbrev-ref HEAD 2>/dev/null)" in main|master) false;; *) true;; esac; }; } && echo '<envelope>' || true`.
```
def a: "(?:>&|\\\\.|\\x27[^\\x27]*\\x27|\\x22(?:[^\\x22\\\\]|\\\\.)*\\x22|[^;&|)\n\\x27\\x22\\\\])*"; (.tool_input.command // "") | (test("^(?:" + a + "[;&|(\n] *)*(?:env +)?(?:[A-Za-z_]+=[^ ]+ +)*git(?: -C [^ ]+)* push(?=[ ;&|)\n]|$)(?!" + a + " (?:-h|--help)(?:[ ;&|)\n]|$))" + a + " (?:-q|--quiet)(?=[ ;&|)\n]|$)") and (test("<<") | not))
```
Merge: the same three `def`s, then a forge merge judged by outcome, or a trunk pull: `checkout`/`switch` of the trunk as a command, then `git pull` through `&&`, `;` or a newline (anything between). Not a pull on a branch, not inside `echo` or quotes, not `main-foo`. A `;`-chained pull fires even after a failed checkout: a spare reminder costs less than a missed one. fj: its own command and line.
```
def a: "(?:>&|\\\\.|\\x27[^\\x27]*\\x27|\\x22(?:[^\\x22\\\\]|\\\\.)*\\x22|[^;&|)\n\\x27\\x22\\\\])*"; def at(h; n): "(?:^|[;&|(\n] *)" + h + "(?=[ ;&|)\n]|$)(?!" + a + " (?:" + n + ")(?:[ ;&|)\n]|$))"; def out: (.tool_response | if type == "object" then "\(.stdout // "")\n\(.stderr // "")" else tostring end); def ran(h; n; said): (.tool_input.command // "") as $c | out as $o | ($c | test(at(h; n) + a + "[ \n]*(?:&&|$)")) or (($c | test(at(h; n))) and ($o | test(said))); ran("gh pr merge"; "-h|--help|--auto|--disable-auto"; "(?:Merged|Squashed and merged|Rebased and merged) pull request") or ((.tool_input.command // "") | test(at("(?:env +)?(?:[A-Za-z_]+=[^ ]+ +)*git(?: -C [^ ]+)* (?:checkout|switch)"; "-h|--help") + " (?:main|master)(?=[ ;&|)\n]|$)(?:" + a + "(?:&&|;|\n))+ *(?:env +)?(?:[A-Za-z_]+=[^ ]+ +)*git(?: -C [^ ]+)* pull(?=[ ;&|)\n]|$)"))
```
**Escaping.** In `settings.json` the filter's quotes become `\"` and **every** backslash doubles (`\n` → `\\n`, `\\x27` → `\\\\x27`); a missed one is a jq error that `|| true` hides, and the hook goes silent.

**Test before writing.** Feed JSON with `tool_input.command` and `tool_response`. Must fire: a push after a commit, `git -C <path> push`, `gh pr merge <N> --squash` last, `gh pr merge <N> -t "fix -h parsing"`, `git push 2>&1 | tail` with ` + …(forced update)`, `git checkout main; git pull`. Must not: `gh pr merge --help | head`, `git push -h`, `gh pr merge <N> | tail` with empty output, `git push 2>&1 | tail` with ` ! [rejected]`, `git checkout main-foo && git pull`, `echo "git checkout main && git pull --ff-only"`, `grep "git push"`, `echo git push`, a bare `git pull` on a branch. Never promote a text match to a work gate.

**Merge gap.** A forge merge then `git merge --ff-only origin/main` shows no event; `methods/code-work.md`, `After merge`, carries it.

**Branch freshness.** Offer a pre-push hook: `git fetch -q origin main && git merge-base --is-ancestor origin/main HEAD || echo 'branch is behind main: rebase before pushing'`.

## Memory guard
Its own `"PreToolUse"` array; blocks with exit 2, the stderr message naming the route to the personal graph. Path: `tool_input.file_path` (Write, Edit, MultiEdit) or `tool_input.notebook_path` (NotebookEdit). Compares paths, not strings:
- relative → from the session directory;
- resolved component by component like `realpath -m`: a link is replaced by its target and resolution continues, `..` applies to the resolved prefix, a missing tail stays text, empty and `.` components drop;
- over 40 hops, a loop, or a link lying in memory → block;
- memory is matched through `~/.claude/projects` behind a link (`cd -P`), case-insensitively (APFS, Windows).

POSIX sh and flagless `readlink` only (`realpath`, `readlink -f` are unreliable on macOS).
```json
{ "matcher": "Write|Edit|MultiEdit|NotebookEdit", "hooks": [ { "type": "command",
  "command": "p=$(jq -r '.tool_input.file_path // .tool_input.notebook_path // \"\"'); [ -n \"$p\" ] || exit 0; case \"$p\" in /*) ;; *) p=\"$PWD/$p\" ;; esac; m=$(cd -P \"$HOME/.claude/projects\" 2>/dev/null && pwd -P | tr '[:upper:]' '[:lower:]'); mem() { k=$(printf '%s' \"$1\" | tr '[:upper:]' '[:lower:]'); case \"$k\" in */.claude/projects/*/memory|*/.claude/projects/*/memory/*) return 0 ;; esac; [ -n \"$m\" ] && case \"$k\" in \"$m\"/*/memory|\"$m\"/*/memory/*) true ;; *) false ;; esac; }; r=; s=$p; n=0; x=0; while [ -n \"$s\" ]; do c=${s%%/*}; s=${s#\"$c\"}; s=${s#/}; case \"$c\" in ''|.) continue ;; ..) r=${r%/*}; continue ;; esac; if [ -L \"$r/$c\" ]; then n=$((n+1)); l=$(readlink \"$r/$c\"); if [ $n -gt 40 ] || [ -z \"$l\" ] || mem \"$r/$c\"; then x=1; break; fi; case \"$l\" in /*) r= ;; esac; s=$l/$s; else r=$r/$c; fi; done; { [ $x = 1 ] || mem \"$p\" || mem \"$r\"; } && { echo 'BLOCKED: local agent memory is forbidden entirely, not by category (AGENTS.md, Persistence). Route the fact: repo conventions / code facts → AGENTS.md; project state, this repo'\\''s servers and dated duties → the project graph <@owner/slug>; a user-scoped fact no project owns → the personal graph @<handle>/mind (the minding method of the verstak skill). This dir stays frozen at its prohibition stub.' >&2; exit 2; } || exit 0" } ] }
```

## Spec-write (full interop only)
A sibling in the same `PostToolUse` array; false positives are harmless; never a work gate:
```json
{ "matcher": "Write|Edit", "hooks": [ { "type": "command",
  "command": "jq -r '.tool_input.file_path // \"\"' | grep -qE '(^|/)specs/[^/]+\\.md$|(^|/)docs/.*design[^/]*\\.md$' && echo '{\"hookSpecificOutput\":{\"hookEventName\":\"PostToolUse\",\"additionalContext\":\"A design draft was written; per AGENTS.md this file is a draft view and the graph is the design record. Bring it into the graph in this session (verstak skill: the intake method, then design); do not defer it to a push.\"}}' || true" } ] }
```

A write to `.claude/settings.json` may be flagged as self-modification; ask the user to confirm.
