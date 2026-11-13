# Structure

The code map: what the directory tree does not show by itself. Outside `skills/`, so it never ships.

## Source and derived
- `skills/verstak/` — the source of truth, one skill (`verstak`): the door `SKILL.md` selects plain Markdown methods; `references/` and `templates/` carry no frontmatter. Everything under it ships in the bundle, so no README or repository-internal file goes there. `templates/agents-template.md` + `methods/align.md` bootstrap other repos; the root `AGENTS.md` is this repo's own config — don't confuse them.
- `js/` — the bridge's single source: the core `js/{bridge,shared,opencode,extension,watchdog,cli}` (the sibling delivery's, pinned by `js/core.lock`), our delivery layer `js/delivery/` (names and the skill layout, protocol keys, version, the contract support boundary, the launch-basis variable, server prose `patterns/`, English `words/`), `js/build.mjs` and the dev toolchain with the only lockfile.
- Derived, never edited by hand:
  - the release build — `skills/verstak/scripts/verstak-bridge.mjs` (the bridge with its daemon, watchdogs and doctor), `skills/verstak/scripts/opencode-plugin.js`, `extensions/verstak.js` (pi loads `extensions/`), `hooks/onboard.mjs`, `hooks/rituals.mjs`; the dev build goes to `dist/dev/` (ignored);
  - `verstak.skill` — the bundle (a top-level `verstak/` tree), committed for manual install;
  - `home/` — the verstak.ai conversation home's flat catalogue, `home/NAME/SKILL.md` from `scripts/build-home.mjs` (what goes in and how pointers are rewritten: `AGENTS.md`, Shared surfaces, the home row); outside `skills/`, so plugin auto-discovery never ships it.

## Delivery
- `hooks/hooks.json` — the Claude Code plugin's hooks, read at the plugin root: `SessionStart` on `startup` and `compact` runs `hooks/onboard.mjs` (`js/cli/onboard-hook.ts`, signs in `js/delivery/patterns/reposigns.ts`); `SessionStart` on `startup|resume|clear`, `PostToolUse` on `Bash` and `Stop` run `hooks/rituals.mjs` (`js/cli/rituals-hook.ts`); `PreToolUse` on `AskUserQuestion` is one self-standing `node -e` command that `make build` writes from `js/delivery/question-hook.mjs` (`scripts/build-question-hook.mjs`). What each says and when it stays silent: their `REALITY.md` rows. A new output waits for its first release (`PENDING` in `js/build.mjs`).
- `.mcp.json` — the Claude Code record of the MCP server `verstak` (`${CLAUDE_PLUGIN_ROOT}`, which Codex does not resolve); `.codex-plugin/plugin.json` names the bridge inline; `js/tests/codex-plugin.test.mjs` runs Codex's own validator when present.
- The OpenCode npm archive `verstak-opencode-X.Y.Z.tgz` (`@verstak/opencode`): `scripts/pack-opencode.mjs` packs the committed plugin and bridge into `dist/pack/` (ignored); `.github/workflows/release-please.yml` attaches it to each release and, by trusted publishing, puts the same bytes on npm.
- `.claude-plugin/plugin.json`'s `version` is what Claude Code reads to deliver updates; `.claude-plugin/marketplace.json` and `.codex-plugin/plugin.json` mirror it (`make validate` fails on divergence). Release-please writes them and `CHANGELOG.md`. No component lists: skills auto-discover from `skills/`.

## Gate and tests
- The gate scripts in `scripts/` and `.github/workflows/ci.yml` — what each checks: `AGENTS.md`, Commands. `fixtures/surface.json` is the surface snapshot (`scripts/export-surface.mjs`); `scripts/check-outputs-frozen.sh` is wired once the first release ships the outputs.
- `js/tests/` — black box: they run `dist/dev`, or any copy named by `VERSTAK_BRIDGE_PATH`; `fake-server.mjs` stands in for an OAuth-protected MCP server and answers the consent on the human's behalf. What each suite pins: its header comment and its `REALITY.md` row.

## Docs and the machine
- `CLAUDE.md` is a **symlink** to `AGENTS.md`: one file answers every harness; keep it a symlink. `SETUP.md` is read, not fetched to execute.
- `.claude/agents/` and `.opencode/agents/` — the nine delegation roles in each harness, a projection on the machine out of git: each Claude Code file has its own satellite entry and a trigger-shaped `description`; each OpenCode file is pinned to the model the user chose. Their repository lines live in `AGENTS.md`, Role file tails, projected under `## This repo`. `.claude/settings.json` is committed; `settings.local.json` is ignored.
- Scratch is **not** ignored: keep working files out of the tree.
