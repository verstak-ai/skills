// The repository's alignment signs in this delivery's form (the core's shared/reposigns.ts
// with our REPO_SIGNS and COVER) and the Claude Code SessionStart hook built from them
// (hooks/onboard.mjs): temporary directories only; no network, no model.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  chmodSync,
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, dirname, join } from "node:path";
import { test } from "node:test";

import { envName, ONBOARD_START } from "../delivery/index.ts";
import { repoRoot, repoSigns } from "../shared/reposigns.ts";
import { BUILT_ONBOARD_HOOK, REPO } from "./built.mjs";

const COVER = "---\n'Graph': '@tester/work (r1)'\n'Agent role': '#7 \"agent\"'\n---\n";
const STAMP = "*(verstak align: contract `4`, stamped `2026-10-12` — re-run when …)*\n";
const OLD_STAMP = "*(verstakify: contract `2026-05-01` — re-run when …)*\n";
// The sibling delivery's cover and stamps (graph @nks/nks-dev, nodes #8089, #8497, #8508): its
// English form shares our keys, its Russian one has its own; its name is built in two halves and
// its Russian words come as escapes — neither stands in this repository's text.
const SIBLING = "is" + "kronify";
const SIBLING_STAMP = `*(${SIBLING}: contract \`29\`, stamp \`2026-10-22\` — …)*\n`;
const SIBLING_STAMP_RU = `*(${SIBLING}: \u043a\u043e\u043d\u0442\u0440\u0430\u043a\u0442 \`29\`, \u0448\u0442\u0430\u043c\u043f \`2026-10-22\` — …)*\n`;
const SIBLING_COVER_RU =
  "---\n'\u0413\u0440\u0430\u0444': '@tester/work (r1)'\n'\u0420\u043e\u043b\u044c \u0430\u0433\u0435\u043d\u0442\u0430': '#7 «a»'\n---\n";
const SIBLING_PROSE = `The neighbour's file ends with (${SIBLING}: contract 29, stamp 2026-10-22).\n`;
const session = (command) =>
  JSON.stringify({ hooks: { SessionStart: [{ hooks: [{ type: "command", command }] }] } });
// Start hooks as align writes them (references/align-hooks.md): the full and the initial form.
const envelope = (text) =>
  `echo '{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"${text}"}}'`;
const STARTS = [
  envelope(
    "Load the verstak skill first (/verstak) and read its Start section before any other action. Addresses from AGENTS.md: graph @tester/work, focus holon #3, agent role #7, owner role #8.",
  ),
  envelope(
    "Load the verstak skill first (/verstak) and read its Start section before any other action. Onboarding in progress: graph @tester/work; no holon or roles yet. Continue the onboarding method from the first missing sign.",
  ),
];
const START = session(STARTS[0]);
const RITUALS = ".opencode/plugins/verstak-rituals.js";

/** A temporary directory laid out by spec; removed after the test. */
function lay(t, spec = {}) {
  const dir = mkdtempSync(join(tmpdir(), "reposigns-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  if (spec.git === "dir") mkdirSync(join(dir, ".git"));
  if (spec.git === "file")
    writeFileSync(join(dir, ".git"), "gitdir: /elsewhere/.git/worktrees/w\n");
  if (spec.agents !== undefined) writeFileSync(join(dir, "AGENTS.md"), spec.agents);
  if (spec.settings !== undefined) {
    mkdirSync(join(dir, ".claude"));
    writeFileSync(join(dir, ".claude", "settings.json"), spec.settings);
  }
  if (spec.rituals) {
    mkdirSync(join(dir, dirname(RITUALS)), { recursive: true });
    writeFileSync(join(dir, RITUALS), "export default {};\n");
  }
  return dir;
}

const all = (v) => ({ "claude-code": v, opencode: v, other: v });
const CASES = [
  { name: "outside a repository", spec: {}, verdicts: all("outside") },
  { name: "fresh repository", spec: { git: "dir" }, verdicts: all("invite") },
  { name: "worktree .git file", spec: { git: "file" }, verdicts: all("invite") },
  {
    name: "cover, stamp, both start hooks",
    spec: { git: "dir", agents: COVER + STAMP, settings: START, rituals: true },
    verdicts: all("aligned"),
  },
  {
    name: "cover, stamp, Claude Code hook",
    spec: { git: "dir", agents: COVER + STAMP, settings: START },
    verdicts: { "claude-code": "aligned", opencode: "partial", other: "aligned" },
  },
  {
    name: "cover, stamp, OpenCode rituals",
    spec: { git: "dir", agents: COVER + STAMP, rituals: true },
    verdicts: { "claude-code": "partial", opencode: "aligned", other: "aligned" },
  },
  {
    // Codex and pi get no start hook from align: a repository aligned for them has none.
    name: "cover and stamp without start hooks",
    spec: { git: "dir", agents: COVER + STAMP },
    verdicts: { "claude-code": "partial", opencode: "partial", other: "aligned" },
  },
  {
    name: "cover and the pre-contract stamp",
    spec: { git: "dir", agents: COVER + OLD_STAMP },
    verdicts: { "claude-code": "partial", opencode: "partial", other: "aligned" },
  },
  { name: "cover only", spec: { git: "dir", agents: COVER }, verdicts: all("partial") },
  {
    // Our English form without any stamp: partial alignment, which the door's alignment leads.
    name: "English keys without a stamp are our form, not an invitation",
    spec: { git: "dir", agents: `${COVER}# agents\n` },
    verdicts: all("partial"),
  },
  {
    name: "the sibling's stamp under the shared English keys",
    spec: { git: "dir", agents: COVER + SIBLING_STAMP },
    verdicts: all("foreign"),
  },
  {
    name: "the sibling's Russian cover and stamp",
    spec: { git: "dir", agents: SIBLING_COVER_RU + SIBLING_STAMP_RU },
    verdicts: all("foreign"),
  },
  {
    name: "the sibling's stamp without a cover",
    spec: { git: "dir", agents: `# x\n${SIBLING_STAMP}` },
    verdicts: all("foreign"),
  },
  {
    name: "the sibling's stamp beside our start hook",
    spec: { git: "dir", agents: COVER + SIBLING_STAMP, settings: START },
    verdicts: all("partial"),
  },
  {
    name: "the sibling's stamp inside a prose line is no stamp",
    spec: { git: "dir", agents: COVER + SIBLING_PROSE },
    verdicts: all("partial"),
  },
  { name: "stamp only", spec: { git: "dir", agents: `# x\n${STAMP}` }, verdicts: all("partial") },
  { name: "start hook only", spec: { git: "dir", settings: START }, verdicts: all("partial") },
  { name: "rituals only", spec: { git: "dir", rituals: true }, verdicts: all("partial") },
  {
    name: "broken front matter is no cover",
    spec: { git: "dir", agents: "---\n'Graph': '@tester/work'\n# never closed\n" },
    verdicts: all("invite"),
  },
  {
    name: "front matter without the delivery's keys is no cover",
    spec: { git: "dir", agents: "---\ntitle: notes\n---\n" },
    verdicts: all("invite"),
  },
  {
    name: "AGENTS.md without cover or stamp",
    spec: { git: "dir", agents: "# agents\n" },
    verdicts: all("invite"),
  },
  {
    name: "foreign SessionStart hook is no sign",
    spec: { git: "dir", settings: session("echo hi") },
    verdicts: all("invite"),
  },
  {
    name: "the product name alone is no start mark",
    spec: { git: "dir", settings: session(`echo 'verstak_orient(realm="r5") before acting'`) },
    verdicts: all("invite"),
  },
  {
    name: "unparsable settings is no sign",
    spec: { git: "dir", settings: "{" },
    verdicts: all("invite"),
  },
];

for (const c of CASES)
  for (const [harness, verdict] of Object.entries(c.verdicts))
    test(`repo signs: ${c.name} — ${harness}`, (t) => {
      const dir = lay(t, c.spec);
      assert.equal(repoSigns(dir, harness === "other" ? null : harness).verdict, verdict);
    });

test("repo signs: each form of align's start hook carries the mark", (t) => {
  for (const command of STARTS) {
    const dir = lay(t, { git: "dir", settings: session(command) });
    assert.equal(repoSigns(dir, "claude-code").hooks["claude-code"], true, command);
  }
});

test("repo signs: the start mark is the shipped hook text", () => {
  const hooks = readFileSync(join(REPO, "skills/verstak/references/align-hooks.md"), "utf8");
  const ritual = readFileSync(
    join(REPO, "skills/verstak/references/align-harness-surfaces.md"),
    "utf8",
  );
  for (const text of STARTS.map((s) => /"additionalContext":"([^.]*\.)/.exec(s)[1]))
    assert.ok(hooks.includes(text), text);
  assert.ok(ritual.includes(`// ${RITUALS} — OpenCode 2`), "the rituals plugin's path");
});

test("repo signs: the stamp is the template's line", () => {
  const template = readFileSync(join(REPO, "skills/verstak/templates/agents-template.md"), "utf8");
  assert.ok(template.includes("*(verstak align: contract `<N>`, stamped `<YYYY-MM-DD>`"));
});

test("repo signs: the root is the nearest .git upward, read from a subdirectory", (t) => {
  const dir = lay(t, { git: "dir", agents: COVER + STAMP, rituals: true });
  const sub = join(dir, "a", "b");
  mkdirSync(sub, { recursive: true });
  assert.equal(repoRoot(sub), dir);
  assert.deepEqual(repoSigns(sub, "opencode"), {
    root: dir,
    cover: true,
    stamp: true,
    hooks: { "claude-code": false, opencode: true },
    verdict: "aligned",
  });
  mkdirSync(join(dir, "a", ".git"));
  assert.equal(
    repoSigns(sub, "opencode").verdict,
    "invite",
    "a nested repository has its own signs",
  );
});

test("repo signs: this repository is aligned for Claude Code; OpenCode rituals not wired", () => {
  assert.equal(repoSigns(REPO, "claude-code").verdict, "aligned");
  assert.equal(repoSigns(REPO, "opencode").verdict, "partial");
});

/** The plugin's declared command, as Claude Code runs it: through a shell, the plugin root in env. */
const COMMAND = JSON.parse(readFileSync(join(REPO, "hooks", "hooks.json"), "utf8")).hooks
  .SessionStart[0].hooks[0].command;

/** A plugin root holding the built hook (or not), like the installed copy. */
function pluginRoot(t, withHook = true) {
  const root = mkdtempSync(join(tmpdir(), "reposigns-plugin-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  if (withHook) {
    mkdirSync(join(root, "hooks"));
    copyFileSync(BUILT_ONBOARD_HOOK, join(root, "hooks", "onboard.mjs"));
  }
  return root;
}

function hook(t, input, opts = {}) {
  const env = {
    ...process.env,
    PATH: `${dirname(process.execPath)}${delimiter}${process.env.PATH}`,
    CLAUDE_PLUGIN_ROOT: opts.root ?? pluginRoot(t),
    CLAUDE_PROJECT_DIR: opts.project ?? "",
  };
  delete env[envName("BRIDGE_LANG")];
  if (opts.root === null) delete env.CLAUDE_PLUGIN_ROOT;
  return spawnSync(COMMAND, {
    shell: true,
    input: input === undefined ? "" : typeof input === "string" ? input : JSON.stringify(input),
    cwd: opts.cwd ?? tmpdir(),
    env,
    encoding: "utf8",
    timeout: 5000,
  });
}

const startInput = (cwd) => ({
  session_id: "s",
  transcript_path: "/dev/null",
  cwd,
  hook_event_name: "SessionStart",
  source: "startup",
});
const LINE = `${ONBOARD_START.en.start()}\n`;

for (const c of CASES)
  test(`claude code hook: ${c.name}`, (t) => {
    const dir = lay(t, c.spec);
    const started = Date.now();
    const r = hook(t, startInput(dir));
    const elapsed = Date.now() - started;
    assert.equal(r.status, 0, r.stderr);
    assert.equal(r.stderr, "");
    assert.equal(r.stdout, c.verdicts["claude-code"] === "invite" ? LINE : "");
    assert.ok(elapsed < 1000, `fractions of a second: ${elapsed}ms`);
  });

test("claude code hook: the built file absent — silence, exit 0, no error", (t) => {
  const r = hook(t, startInput(lay(t, { git: "dir" })), { root: pluginRoot(t, false) });
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout, "");
  assert.equal(r.stderr, "");
});

test("claude code hook: no plugin root — silence, exit 0, no error", (t) => {
  const r = hook(t, startInput(lay(t, { git: "dir" })), { root: null });
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout, "");
  assert.equal(r.stderr, "");
});

test("claude code hook: one English line naming the skill and its method", (t) => {
  const r = hook(t, startInput(lay(t, { git: "dir" })));
  assert.equal(r.status, 0);
  assert.equal(r.stdout, LINE);
  assert.equal(r.stdout.trimEnd().split("\n").length, 1);
  assert.match(r.stdout, /\bverstak skill\b.*\bonboarding method\b/);
});

test("claude code hook: without input — the project variable, then its own directory", (t) => {
  const fresh = lay(t, { git: "dir" });
  assert.equal(hook(t, undefined, { project: fresh }).stdout, LINE);
  assert.equal(hook(t, "not json", { cwd: fresh }).stdout, LINE);
  assert.equal(hook(t, undefined, { cwd: lay(t) }).stdout, "", "outside — silence");
});

test("claude code hook: unreadable files and a missing directory do not fail the start", (t) => {
  const dir = lay(t, { git: "dir", agents: COVER + STAMP, settings: START });
  if (process.platform !== "win32" && process.getuid?.() !== 0) {
    chmodSync(join(dir, "AGENTS.md"), 0o000);
    const r = hook(t, startInput(dir));
    chmodSync(join(dir, "AGENTS.md"), 0o644);
    assert.equal(r.status, 0, r.stderr);
    assert.equal(r.stdout, "", "the start hook still counts: partial, silent");
  }
  const gone = hook(t, startInput(join(dir, "no", "such")));
  assert.equal(gone.status, 0, gone.stderr);
  assert.equal(gone.stdout, "", "a path inside an aligned repository: its root's signs");
});

test("claude code hook: declared on startup only", () => {
  const hooks = JSON.parse(readFileSync(join(REPO, "hooks", "hooks.json"), "utf8"));
  assert.deepEqual(
    hooks.hooks.SessionStart.map((e) => e.matcher),
    ["startup"],
  );
  assert.equal(hooks.hooks.SessionStart[0].hooks.length, 1);
});
