# Harness surfaces: where the rituals actually land

The align method (`methods/align.md`) delivers **rituals**: start, push, merge, memory guard. Wire only the harnesses the repo uses; never write a config format you are guessing at.

| Harness | Reads | Pointer file needed | Automation surface |
|---|---|---|---|
| Claude Code | `CLAUDE.md` | **yes**: `CLAUDE.md` = `@AGENTS.md` | hooks in `.claude/settings.json` |
| Codex CLI | `AGENTS.md` | no | `hooks.json` in CODEX_HOME, not wired by align |
| OpenCode | `AGENTS.md` | no | a plugin in the project's `.opencode/plugins/` |

Detect: `.claude/` or the plugin cache → Claude Code; `opencode.json` / `.opencode/` → OpenCode; `.codex/` or `~/.codex/` → Codex. Wire every one present.

**The start ritual everywhere:** one message, word for word the same in every harness, whose first sentence asks for the verstak skill (`/verstak`) and its `Start` section before any other action, then the AGENTS.md frontmatter addresses (`Graph`, `Focus holon`, `Agent role`, `Owner role`). Without a wireable start surface (Codex), the template's opening paragraph says it. Sign: a fresh session loads the door before its first graph call.

## Claude Code

Reads `CLAUDE.md`, hence the `@AGENTS.md` pointer (Step 7). Hooks: committed in `.claude/settings.json` (events in Step 4, shapes in `references/align-hooks.md`). Role files: `.claude/agents/` (`references/align-delegation.md`).

## Codex CLI

**Reads `AGENTS.md` natively; no pointer file.** It merges every `AGENTS.md` from the project root to the cwd over `~/.codex/AGENTS.md` (which does not configure agent behaviour, Step 1). `AGENTS.override.md` beats `AGENTS.md` in its directory: for machine-local notes, never committed.

**Align does not wire Codex hooks** (Step 1): they are machine-local; `AGENTS.md`'s opening paragraph and `methods/code-work.md` carry the rituals. The 0.151 `project` hook source has an unobserved path; observe it before wiring there. Below is for repairing existing hooks; a `SessionStart` there carries the start message.

- **Find CODEX_HOME with `codex doctor`**; it is not always `~/.codex`.
- **Hooks are declared in `hooks.json` there**, not in TOML: `config.toml`'s `[hooks.state."<path to hooks.json>:<event>:0:0"]` tables are bookkeeping. Shape: event → groups → commands:

```json
{
  "hooks": {
    "PreToolUse": [
      { "hooks": [ { "type": "command", "command": "bash ./scripts/guard.sh", "timeout": 10 } ] }
    ]
  }
}
```

- Events (CamelCase; snake_case only in `[hooks.state]`): `SessionStart`, `UserPromptSubmit`, `PreToolUse`, `PermissionRequest`, `PostToolUse`, `SubagentStart`, `SubagentStop`, `Stop`. Fields seen: `type`, `command`, `timeout`; `matcher` unseen, so check your version before narrowing by tool. Stdin: `session_id`, `turn_id`, `transcript_path`, `cwd`, `hook_event_name`, `model`. `SessionStart`'s source (`startup`, `resume`, `clear`, `compact`) is what `matcher` matches; start needs `startup` and `resume` only.
- Mapping: start → `SessionStart`; guard → `PreToolUse` on writes; push, merge → `PostToolUse` on the shell.

## OpenCode

**Reads `AGENTS.md` natively, no pointer.** Extra rule files go in `instructions` in the project's `opencode.json` (globs allowed: reuse, don't copy); never the global config (Step 1).

Rituals go in a **plugin** in the project's `.opencode/plugins/`; the global `~/.config/opencode/plugins/` holds only the delivered verstak plugin (Step 1). **Shape: OpenCode 2 (`@opencode/plugin` 2.0.4), a default export `{ id, setup(ctx) }`, no imports.** The 2.x loader rejects the 1.x shape (service log `SchemaError(Missing key at ["default"])`) and the rituals silently don't run.

```js
// .opencode/plugins/verstak-rituals.js — OpenCode 2
export default {
  id: "verstak-rituals",
  async setup(ctx) {
    // Own directory: a tool hook's input carries only sessionID, so the session's directory
    // (SessionInfo.location.directory, 2.0.4) is compared with the instance's (ctx.location).
    // Only a known foreign session is skipped; an unknown directory never silences the guard.
    // Directories compare canonicalized: the same folder arrives as /private/tmp/… or /tmp/…,
    // so realpath (falling back to the raw string), without a trailing separator.
    const { realpath } = await import("node:fs/promises");
    const canon = async (p) => {
      if (typeof p !== "string" || !p) return p;
      const r = await realpath(p).catch(() => p);
      return r.replace(/(?<=.)[\\/]+$/, "");
    };
    const own = await canon(ctx.location?.directory);
    const dirOf = async (sessionID) => {
      const info = await ctx.session.get({ sessionID }).catch(() => null);
      return canon(info?.location?.directory ?? info?.data?.location?.directory);
    };
    const mine = async (sessionID) => {
      const dir = await dirOf(sessionID);
      return !own || typeof dir !== "string" || !dir || dir === own;
    };
    // The server creates one plugin instance per spelling of the directory (/tmp/… and /private/tmp/…);
    // after canon both claim the session, so each message is said once per process: a set shared across
    // instances, keyed by the greeting's sessionID or the reminder's callID. No key, no dedupe —
    // otherwise the first id-less call would take the key undefined and silence all later ones.
    const said = (globalThis.__verstakRitualsSaid ??= new Set());
    const once = (key) => key == null || (!said.has(key) && !!said.add(key));
    // The shell tool is `shell` on 2.0.24; `bash` for earlier versions.
    const isShell = (tool) => ["shell", "bash"].includes(tool);
    // Memory guard: a throw from execute.before blocks the call. Same path rule as the Claude Code guard:
    // relative from the session directory; resolve component by component like realpath -m (a link is
    // replaced by its target and resolution continues, ".." applies to the resolved prefix, a missing tail
    // stays text). Over 40 hops, a loop, or a link lying in memory → refuse (fail closed). Memory is
    // recognised through ~/.claude/projects behind a link and case-insensitively (APFS, Windows).
    const { lstatSync, readlinkSync } = await import("node:fs");
    const { dirname, isAbsolute, join, parse } = await import("node:path");
    const { homedir } = await import("node:os");
    const slash = (p) => p.replaceAll("\\", "/");
    const parts = (p) => p.slice(parse(p).root.length).split(/[\\/]+/);
    // Resolved path; null = not resolved (limit, loop, unreadable link) or a link lying in memory.
    const real = (p, inMemory = () => false) => {
      let r = parse(p).root, rest = parts(p), hops = 0;
      while (rest.length) {
        const c = rest.shift();
        if (!c || c === ".") continue;
        if (c === "..") { r = dirname(r); continue; }
        const q = join(r, c);
        let link = false;
        try { link = lstatSync(q).isSymbolicLink(); } catch { /* missing: the tail stays text */ }
        if (!link) { r = q; continue; }
        let l = "";
        try { l = readlinkSync(q); } catch { /* unreadable: not resolved */ }
        if (++hops > 40 || !l || inMemory(q)) return null;
        if (isAbsolute(l)) r = parse(l).root;
        rest = [...parts(l), ...rest];
      }
      return r;
    };
    const home = join(homedir(), ".claude", "projects");
    const projects = slash(real(home) ?? home).toLowerCase();
    const inMemory = (p) => {
      const x = `${slash(p)}/`.toLowerCase();
      return /\/\.claude\/projects\/.*\/memory\//.test(x) || (x.startsWith(`${projects}/`) && /\/memory\//.test(x.slice(projects.length)));
    };
    const isLocalMemoryPath = (p, base) => {
      const abs = isAbsolute(String(p)) ? String(p) : `${base || process.cwd()}/${p}`;
      const r = real(abs, inMemory);
      return r === null || inMemory(abs) || inMemory(r);
    };
    // Call paths: write and edit carry `path` (`filePath` in earlier versions); patch (apply_patch) carries
    // patchText headers "*** Add File: ", "*** Update File: ", "*** Delete File: " and the target "*** Move to: ".
    const pathsOf = (input) =>
      ["patch", "apply_patch"].includes(input.tool)
        ? [...String(input.input?.patchText ?? "").matchAll(/^\*\*\* (?:(?:Add|Update|Delete) File|Move to): (.+)$/gm)].map((m) => m[1].trim())
        : ["write", "edit"].includes(input.tool) ? [input.input?.path ?? input.input?.filePath ?? ""] : [];
    await ctx.tool.hook("execute.before", async (input) => {
      const paths = pathsOf(input);
      if (!paths.length) return;
      const base = (await dirOf(input.sessionID)) || own;
      if (!paths.some((p) => isLocalMemoryPath(p, base))) return;
      if (!(await mine(input.sessionID))) return;
      throw new Error("BLOCKED: local agent memory is forbidden entirely (AGENTS.md, Persistence). Route the fact: repo conventions and code facts -> AGENTS.md; project state, servers, dated duties -> the project graph <@owner/slug>; a user-scoped fact no project owns -> the personal graph @handle/mind (the minding method of the verstak skill).");
    });
    // Push and merge: after a shell call, append one line to the result. Fire on the outcome, not the form:
    // help and --auto never fire; the exit code speaks for a command only when it is last in the chain or
    // stands before &&, otherwise the confirmation line in the output decides.
    // result's fields are read-only, so result itself is replaced; content is a string or an array of parts.
    await ctx.tool.hook("execute.after", async (input) => {
      if (!isShell(input.tool) || input.status !== "completed") return;
      const cmd = String(input.input?.command ?? "");
      const c = input.result.content;
      const out = typeof c === "string" ? c : (c ?? []).map((p) => p.text ?? "").join("\n");
      const exit = input.result.metadata?.exit; // key not checked live; without it the tail's form decides
      const arg = String.raw`(?:>&|\\.|'[^']*'|"(?:[^"\\]|\\.)*"|[^;&|)\n'"\\])*`; // quotes taken whole: a flag inside is text
      const at = (head, noop) => String.raw`(?:^|[;&|(\n] *)${head}(?=[ ;&|)\n]|$)(?!${arg} (?:${noop})(?:[ ;&|)\n]|$))`;
      const ran = (head, noop, said) =>
        new RegExp(at(head, noop)).test(cmd) &&
        (((exit ?? 0) === 0 && new RegExp(at(head, noop) + arg + String.raw`\s*(?:&&|$)`).test(cmd)) || said.test(out));
      const env = String.raw`(?:env +)?(?:[A-Za-z_]+=\S+ +)*`;
      const pull = new RegExp( // trunk pull as a command; chained to pull via &&, ; or a newline
        at(String.raw`${env}git(?: -C \S+)* (?:checkout|switch)`, "-h|--help") + String.raw` (?:main|master)(?=[ ;&|)\n]|$)` +
          String.raw`(?:${arg}(?:&&|;|\n))+ *${env}git(?: -C \S+)* pull(?=[ ;&|)\n]|$)`,
      );
      const push = String.raw`(?:env +)?(?:[A-Za-z_]+=\S+ +)*git(?: -C \S+)* push`;
      // A quiet push (-q/--quiet) prints no "To <remote>" and looks like a rejection, so git state decides:
      // command from line start through whole quotes, no <<, HEAD non-empty and equal to @{push}, branch not main/master.
      let quiet = false;
      if (new RegExp(String.raw`^(?:${arg}[;&|(\n] *)*` + push + String.raw`(?=[ ;&|)\n]|$)(?!${arg} (?:-h|--help)(?:[ ;&|)\n]|$))` + arg + String.raw` (?:-q|--quiet)(?=[ ;&|)\n]|$)`).test(cmd) && !cmd.includes("<<")) {
        // the session's directory, not the server process's; none → the hook stays silent
        const cwd = await dirOf(input.sessionID);
        if (typeof cwd === "string" && cwd) {
          const { execFileSync } = await import("node:child_process");
          const git = (...a) => { try { return execFileSync("git", a, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim(); } catch { return ""; } };
          const head = git("rev-parse", "HEAD");
          quiet = head !== "" && head === git("rev-parse", "@{push}") && !["main", "master"].includes(git("rev-parse", "--abbrev-ref", "HEAD"));
        }
      }
      const tagsOnly = /^(?=[\s\S]*\n [*] \[new tag\])(?![\s\S]*\n (?:[ +-] |\* (?!\[new tag\])))/; // a release tag is not a branch for review
      const note = (ran(push, "-h|--help", /To [^\n]+(?:\n [!=] .*)*\n [ *+-]/) && !tagsOnly.test(out)) || quiet
        ? "[verstak] A push ships nothing: self-review the diff, run the vocabulary pass over the PR text, get the cold review of the stage."
        : ran("gh pr merge", "-h|--help|--auto|--disable-auto", /(Merged|Squashed and merged|Rebased and merged) pull request/) ||
            ran("fj pr merge", "-h|--help", /Merged PR #/) || ((exit ?? 0) === 0 && pull.test(cmd))
          ? "[verstak] Merged: run the after-merge acts (verstak skill, methods/code-work.md, After merge): weave, advance the map, modes on evidence not on merge, end by axis, reconcile, feedback, vocabulary; work tasked by another agent: only the seed and delivery modes."
          : "";
      if (!note || !(await mine(input.sessionID)) || !once(input.id)) return;
      input.result = {
        ...input.result,
        content: typeof c === "string" ? `${c}\n\n${note}` : [...(c ?? []), { type: "text", text: note }],
      };
    });
    // Start: the first message of a new session. ctx.event.subscribe yields an async iterable of events;
    // the stream is shared by the machine's OpenCode service and carries sessions of every directory, so the
    // message goes only to a session whose directory matches this instance's (ctx.location), and only to a
    // root session (no parentID); child sessions (subagents, service sessions) are skipped. A failed prompt
    // for one session is caught in place; a loop failure goes to the service's stderr.
    // Same message as Claude Code's SessionStart hook, addresses from this repo's AGENTS.md frontmatter;
    // the align run fills <Graph>, <Focus holon>, <Agent role>, <Owner role>; no angle brackets remain.
    const START =
      "Load the verstak skill first (/verstak) and read its Start section before any other action. " +
      "Addresses (AGENTS.md frontmatter): graph <Graph>, focus holon #<Focus holon>, agent role #<Agent role>, " +
      "owner role #<Owner role>. Take a seat only to stand watch, with one verstak_stand. " +
      "A launch line of the form start GRAPH ROLE case #N enters that case. " +
      "A subagent works on its own satellite bridge (verstak_stand with satellite_of, then join and leave on it); " +
      "on the bridge of the agent that launched it, it writes nothing to the graph.";
    const ac = new AbortController();
    (async () => {
      for await (const ev of await ctx.event.subscribe({ signal: ac.signal })) {
        if (ev.type !== "session.created" || !own || (await canon(ev.data?.location?.directory)) !== own) continue;
        if (typeof ev.data?.parentID === "string" || !once(ev.data?.sessionID)) continue;
        try {
          await ctx.session.prompt({ sessionID: ev.data.sessionID, text: START, delivery: "queue" });
        } catch (e) {
          console.error("[verstak-rituals] start message not delivered:", e);
        }
      }
    })().catch((e) => console.error("[verstak-rituals] start loop stopped:", e));
    return () => ac.abort(); // cleanup when the plugin unloads
  },
};
```

- **Hooks.** A throw from `execute.before` is the block. In `execute.after`, replace `result` whole (its fields are read-only). Checked against the 2.0.4 types (`@opencode/plugin`, `@opencode/schema`).
- **Scope.** The event stream carries every directory in the machine's OpenCode service: unfiltered, the start message would seat foreign sessions under this repo's role, hence the sample's checks. `mine` re-checks tool hooks, whose own-directory scope the types don't promise.
- **Observed on 2.0.24** (two directories): tool names as in the sample; one greeting, own root only (two without the once-set); the guard refused own-session memory only; one push reminder, own session only. Unobserved: the merge reminder, `edit`, the guard on `patch`; check against the types and the `REALITY.md` row on upgrade.
- No TUI: messages go as a session prompt or to stderr. 2.x drops `slash: true`; register `/` commands via `ctx.command.transform`. Role files: `.opencode/agents/` (`references/align-delegation.md`).

## Re-verify checklist (maintainers)

On harness upgrades: Claude Code — settings path, hook events, `CLAUDE.md` import syntax. Codex — hook events and file form, `SessionStart` sources, `AGENTS.md` / `AGENTS.override.md` names and merge order. OpenCode — `.opencode/plugins/`, `{ id, setup(ctx) }`, `execute.before`/`execute.after` and the throw-block, the `session.created` shape, `ctx.location`. A harness gaining or losing a surface: update the table first, then Step 4.
