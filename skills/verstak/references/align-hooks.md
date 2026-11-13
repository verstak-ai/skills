# Claude Code hooks: exact shape for projection and repair

Shapes for the hooks Step 4 of `methods/align.md` names, in `.claude/settings.json`. Other harnesses: `references/align-harness-surfaces.md`. The memory guard is `prepare`'s (`methods/align.md`, Round 1, step 4); start, push and merge are the delivery's own hooks from contract 11, speaking these samples' texts — the samples below are for an installed delivery older than that, and for reading a repository's own hook during the transition.

## Envelope
Each hook's `command` echoes an envelope; mind the nesting `event → array → {"hooks":[{"type":"command","command":…}]}`:
```json
{ "hooks": { "SessionStart": [ { "hooks": [ { "type": "command",
  "command": "echo '{\"hookSpecificOutput\":{\"hookEventName\":\"SessionStart\",\"additionalContext\":\"Load the verstak skill (/verstak) and run its Start section before anything else. Cover: graph <Graph>, holon #<Focus holon>, role #<Agent role>.\"}}'" } ] } ] } }
```
The delivery's start word is this `additionalContext`, the slots filled from the `verstak:` cover: `<Graph>` with its `graph` (the rN), `<Focus holon>` and `<Agent role>` with its `holon` and `agent_role`, digits only; no angle brackets or quotes remain. No person's role is in the hook: the agent asks the human who launched the session. The first sentence asks for the skill by name so the door loads every session. Written by hand (an older delivery), the entry is this sample byte for byte with the same fills. No apostrophes (single-quoted `echo`).

Every envelope is JSON nested in a shell string: a valid JSON string can still break the shell. For every hook using single-quoted `echo`, avoid apostrophes in message text or shell-escape them. Parse the assembled command with `/bin/sh -n` before installing it, then exercise its event fixtures and parse the emitted JSON: shell syntax alone can pass while quoting changes the output.

**Initial form** (onboarding, before the role, holon and gate exist): the same envelope, with the `additionalContext` byte for byte `Load the verstak skill (/verstak) and run its Start section before anything else. Onboarding unfinished: graph <Graph>, no holon or roles yet — continue it from the first missing sign.` — one slot, the cover's `graph`. The delivery says it while the cover names only the graph, and the full word once `holon` and `agent_role` stand there. With it, the memory guard with its project graph filled; its personal branch goes through minding without a handle or a stored address. Spec-write waits. A start entry of the repository's own (the initial or the full form, one naming the owner role too) silences the delivery's start: `prepare` names it in `left`, and the transition takes it off (`methods/align.md`, Step 4).

## Push reminder envelope

Copy this envelope into the push command below. Repository-specific additions must preserve its shell quoting and pass the same parse and fixture checks.
```json
{"hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext":"[verstak] Pushed, nothing shipped yet: self-review the diff, the vocabulary pass over the PR text; pick the review tier for the batch (verstak, methods/code-work.md, Cold review)."}}
```

The merge command's envelope, the same way:
```json
{"hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext":"[verstak] Merged: the after-merge acts (verstak, methods/code-work.md, After merge) — weave, the map, modes on evidence not on merge, end by axis, reconcile, feedback, vocabulary; work tasked by another agent: the seed and delivery modes only."}}
```

## Push and merge: fire on the outcome, not the form
The delivery's own hooks: a push whose target names `main` or `master` gets the merge word, under the `push` switch, not `merge`; a quiet push naming no trunk from a folder on `main` or `master` gets neither; a non-zero exit silences the push only when the push is last in the chain and git printed no report; behind a pipe the exit is hidden.
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
def a: "(?:>&|\\\\.|\\x27[^\\x27]*\\x27|\\x22(?:[^\\x22\\\\]|\\\\.)*\\x22|[^;&|)\n\\x27\\x22\\\\])*"; def at(h; n): "(?:^|[;&|(\n] *)" + h + "(?=[ ;&|)\n]|$)(?!" + a + " (?:" + n + ")(?:[ ;&|)\n]|$))"; def out: (.tool_response | if type == "object" then "\(.stdout // "")\n\(.stderr // "")" else tostring end); def ran(h; n; said): (.tool_input.command // "") as $c | out as $o | ($c | test(at(h; n) + a + "[ \n]*(?:&&|$)")) or (($c | test(at(h; n))) and ($o | test(said))); ran("gh pr merge"; "-h|--help|--auto|--disable-auto"; "(?:Merged|Squashed and merged|Rebased and merged) pull request") or ran("fj pr merge"; "-h|--help|--auto|--disable-auto"; "Merged PR #") or ((.tool_input.command // "") | test(at("(?:env +)?(?:[A-Za-z_]+=[^ ]+ +)*git(?: -C [^ ]+)* (?:checkout|switch)"; "-h|--help") + " (?:main|master)(?=[ ;&|)\n]|$)(?:" + a + "(?:&&|;|\n))+ *(?:env +)?(?:[A-Za-z_]+=[^ ]+ +)*git(?: -C [^ ]+)* pull(?=[ ;&|)\n]|$)"))
```
**Escaping.** In `settings.json` the filter's quotes become `\"` and **every** backslash doubles (`\n` → `\\n`, `\\x27` → `\\\\x27`); a missed one is a jq error that `|| true` hides, and the hook goes silent.

**Test before writing.** Feed JSON with `tool_input.command` and `tool_response`. Must fire: a push after a commit, `git -C <path> push`, `gh pr merge <N> --squash` last, `gh pr merge <N> -t "fix -h parsing"`, `fj pr merge <N>` last, `fj pr merge <N> | tail` with `Merged PR #`, `git push 2>&1 | tail` with ` + …(forced update)`, `git checkout main; git pull`. Must not: `gh pr merge --help | head`, `fj pr merge --help`, `git push -h`, `gh pr merge <N> | tail` with empty output, `git push 2>&1 | tail` with ` ! [rejected]`, `git checkout main-foo && git pull`, `echo "git checkout main && git pull --ff-only"`, `grep "git push"`, `echo git push`, a bare `git pull` on a branch. Never promote a text match to a work gate.

**Merge gap.** A forge merge then `git merge --ff-only origin/main` shows no event; `methods/code-work.md`, `After merge`, carries it.

**Branch freshness.** Offer a pre-push hook: `git fetch -q origin main && git merge-base --is-ancestor origin/main HEAD || echo 'branch is behind main: rebase before pushing'`.

## Memory guard
Its own `"PreToolUse"` array; blocks with exit 2, the stderr message naming the route to the personal graph; its `<Graph>` is filled as the start hook's, with the cover's rN. `prepare` writes it; by hand, this sample byte for byte. Its refusal names the project graph and the `AGENTS.md`'s persistence section and routes personal content through minding's entry without a personal address; a bare ban or a constructed mind locator is a projection defect. Path: `tool_input.file_path` (Write, Edit, MultiEdit) or `tool_input.notebook_path` (NotebookEdit). Compares paths, not strings:
- relative → from the session directory;
- Windows separators → `/` before resolution (`92` is the backslash code point); drive and UNC paths are checked by the same memory-directory rule;
- resolved component by component like `realpath -m`: a link is replaced by its target and resolution continues, `..` applies to the resolved prefix, a missing tail stays text, empty and `.` components drop;
- over 40 hops, a loop, or a link lying in memory → block;
- memory is matched through `~/.claude/projects` behind a link (`cd -P`), case-insensitively (APFS, Windows).

POSIX sh and flagless `readlink` only (`realpath`, `readlink -f` are unreliable on macOS).
```json
{ "matcher": "Write|Edit|MultiEdit|NotebookEdit", "hooks": [ { "type": "command",
  "command": "p=$(jq -r '(.tool_input.file_path // .tool_input.notebook_path // \"\") | split([92] | implode) | join(\"/\")'); [ -n \"$p\" ] || exit 0; case \"$p\" in /*) ;; *) p=\"$PWD/$p\" ;; esac; m=$(cd -P \"$HOME/.claude/projects\" 2>/dev/null && pwd -P | tr '[:upper:]' '[:lower:]'); mem() { k=$(printf '%s' \"$1\" | tr '[:upper:]' '[:lower:]'); case \"$k\" in */.claude/projects/*/memory|*/.claude/projects/*/memory/*) return 0 ;; esac; [ -n \"$m\" ] && case \"$k\" in \"$m\"/*/memory|\"$m\"/*/memory/*) true ;; *) false ;; esac; }; r=; s=$p; n=0; x=0; while [ -n \"$s\" ]; do c=${s%%/*}; s=${s#\"$c\"}; s=${s#/}; case \"$c\" in ''|.) continue ;; ..) r=${r%/*}; continue ;; esac; if [ -L \"$r/$c\" ]; then n=$((n+1)); l=$(readlink \"$r/$c\"); if [ $n -gt 40 ] || [ -z \"$l\" ] || mem \"$r/$c\"; then x=1; break; fi; case \"$l\" in /*) r= ;; esac; s=$l/$s; else r=$r/$c; fi; done; { [ $x = 1 ] || mem \"$p\" || mem \"$r\"; } && { echo 'BLOCKED: local agent memory is forbidden entirely, not by category (AGENTS.md, Persistence). Route the fact: repo conventions / code facts → AGENTS.md; project state, this repo'\\''s servers and dated duties → the project graph <Graph>; a user-scoped fact no project owns → personal mind through the minding method of the verstak skill. This dir stays frozen: nothing is written here.' >&2; exit 2; } || exit 0" } ] }
```

### Exercise
Exercise it without executing a write: the Claude Code shell command receives tool-input JSON for a forbidden memory path and an allowed repository path, exits 2/0 respectively; its refusal routes personal content through minding and contains no constructed or stored mind address. This checks the projected guard, not a live harness loading it.

## Blocking question tool
Not a hook of the repository: a permission. Merge the one string into `permissions.deny`, keeping every other key of `permissions` and of the file; an absent `permissions` or `deny` is created, a present one never replaced:
```json
{ "permissions": { "deny": ["AskUserQuestion"] } }
```
A `permissions` that isn't a map, or a `deny` that isn't a list of strings, is someone's shape: leave it and name it in the alignment case. The delivery's own layer is the plugin's `PreToolUse` entry on `AskUserQuestion` in its `hooks/hooks.json`, answering `permissionDecision` `deny` with a reason that sends the question to an `ask` card: it denies `AskUserQuestion` in a repository of ours whatever its `rituals:`, and in any other repository says nothing (where each layer applies: `methods/align.md`, Step 4, `The blocking question tool`). Nothing of it is copied into the repository. Skill installed without the plugin → this `deny` and the `AGENTS.md` line are the only layers: say so in the report.

OpenCode, where it is used here: the policy goes into the project config `.opencode/opencode.json` — merged into `policies` (created if absent), every other field and policy kept, `$schema` added only if missing:
```json
{ "$schema": "https://opencode.ai/config.json", "policies": [{ "action": "tool.use", "resource": "question:*", "effect": "deny" }] }
```
`prepare` merges it the same way. The project config is a single `.opencode/opencode.jsonc` instead → `prepare` reads it and, the policy already there, accepts it without a write; without it, or the JSONC not parsing, it refuses and names the file — add the same policy to its `policies` by hand, in an edit that keeps every comment, never a parse-and-rewrite, and rerun. A `policies` that isn't a list, or both files beside each other → `prepare` refuses as well and writes no second config: leave them and name the path in the alignment case. The read-back (`check-rituals`, `question.project`) accepts the policy in either file. A deny policy on `tool.use` refuses the tool even where a `permission` allows it — permissions and policies are separate (OpenCode's docs, `policies`) — so only a policy can lift it: a root `opencode.json` or `opencode.jsonc` outranks `.opencode/`, and must hold no policy allowing `tool.use` on `question`; one found is named in the alignment case, never removed by the run. Never the user's global config. Where the delivered OpenCode plugin is loaded, it also removes `question` and refuses its permission in a repository of ours, and in any other leaves the tool and the permission decision as they were; nothing of it is written here. The live check: in an OpenCode session in the repository, `question` is refused while an `ask` card still lands; what it decides for the cover, and what holds when it is out of reach: `methods/align.md`, Step 4, `The blocking question tool`.

### Read-back
Both project layers whatever the harness, the plugin layers where their plugin is loaded (N/A ones named): the `Refused tools` line names both tools, the `ask` card and the applicable layers by condition; `.claude/settings.json` parses and its `permissions.deny` holds `AskUserQuestion` with every earlier entry still there; the policy stands in `.opencode/opencode.json` or `.jsonc`, every earlier policy, field and comment kept, and no root `opencode.json` or `opencode.jsonc` holds a policy allowing `tool.use` on `question` (a `permission` allow lifts no deny policy); where the plugin is loaded, its `hooks/hooks.json` (the plugin cache) has the `PreToolUse` entry on `AskUserQuestion`; where the OpenCode plugin is loaded, it removes and refuses `question` here. `node ~/.verstak-bridge/verstak-bridge.mjs check-rituals`, under our cover, reads all of these back in its rows — `question.instructions` (the `AGENTS.md` line), `question.project` (`.claude/settings.json` and the OpenCode project config), `question.plugin` (the Claude Code plugin's `hooks/hooks.json` entry, and the OpenCode plugin's refusal called with a stand-in context): file contents and stand-in calls, never the live check.

## Transition preflight
Before taking a repository's own start, push or merge hook off (`methods/align.md`, Step 4, `The transition`), in the scratch repository holding only that `AGENTS.md` (`git init -b main`, a first commit, a local bare repository as `origin` with `main` pushed upstream): feed the installed plugin's `hooks/rituals.mjs` (its plugin cache) hook-event JSON on stdin, `cwd` the scratch repository: `SessionStart` with `source` `startup`, then `PostToolUse` `Bash` with the command and printed output of a real `git push -u origin <branch>` and of `git checkout main && git pull` there. It prints `additionalContext` with the start, push and merge words; silence on a kind is no replacement. That is a preflight: it shows the script answers, not that Claude Code loads it. A delivery older than the contract, told per harness: Claude Code — no `hooks/rituals.mjs` in its plugin cache; OpenCode — the plugin `~/.config/opencode/plugins/verstak.js` carries a `VERSION` below 3.27.0.

## Spec-write (full interop only)
A sibling in the same `PostToolUse` array; false positives are harmless; never a work gate:
```json
{ "matcher": "Write|Edit", "hooks": [ { "type": "command",
  "command": "jq -r '.tool_input.file_path // \"\"' | grep -qE '(^|/)specs/[^/]+\\.md$|(^|/)docs/.*design[^/]*\\.md$' && echo '{\"hookSpecificOutput\":{\"hookEventName\":\"PostToolUse\",\"additionalContext\":\"A design draft was written; per AGENTS.md this file is a draft view and the graph is the design record. Bring it into the graph in this session (verstak skill: the intake method, then design); do not defer it to a push.\"}}' || true" } ] }
```
