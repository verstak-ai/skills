// The delivery's session rituals in Claude Code, in our words (graph @nks/nks-dev, node #9341;
// the cover's rituals: field — #9316): the plugin's hooks (hooks/hooks.json → hooks/rituals.mjs)
// speak by the cover of the session's repository — the start word (the early one while the cover
// names only the graph), the push and merge words by outcome — keep silent on a kind the
// repository holds itself, and on one the rituals: field leaves out. Each word is the delivery's
// one text (PREPARE.start, RITES), the same the samples in align-hooks.md and
// align-harness-surfaces.md print. Temporary repositories only (rites-kit.mjs).
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { PREPARE, RITES } from "../delivery/index.ts";
import { REPO } from "./built.mjs";
import { bash, COVER, PUSHED, repo, ritesOf, start } from "./rites-kit.mjs";

const FOREIGN = new RegExp("\\p{Script=Cyrillic}|is" + "kron", "iu");
const FULL = PREPARE.en.start({ graph: "r7", holon: "12", role: "34" });
const switched = (rituals) => COVER.replace("  stamp:", `  rituals:${rituals}\n  stamp:`);

test("hooks.json: the rituals entry on start (not compact), after Bash and on Stop", () => {
  assert.deepEqual(
    ritesOf("SessionStart").map((e) => e.matcher),
    ["startup|resume|clear"],
  );
  assert.deepEqual(
    ritesOf("PostToolUse").map((e) => e.matcher),
    ["Bash"],
  );
  assert.equal(ritesOf("Stop").length, 1);
  assert.equal(ritesOf("PreToolUse").length, 0, "the memory guard stays the repository's hook");
});

test("the words are the samples' text: align-hooks.md and align-harness-surfaces.md", () => {
  const hooks = readFileSync(join(REPO, "skills/verstak/references/align-hooks.md"), "utf8");
  const surfaces = readFileSync(
    join(REPO, "skills/verstak/references/align-harness-surfaces.md"),
    "utf8",
  );
  const w = RITES.en;
  for (const [name, text, where] of [
    ["push", w.push(), hooks],
    ["push", w.push(), surfaces],
    ["merge", w.merge("12"), surfaces],
    ["early", w.early("<Graph>"), hooks],
    [
      "start",
      PREPARE.en.start({ graph: "<Graph>", holon: "<Focus holon>", role: "<Agent role>" }),
      hooks,
    ],
  ])
    assert.ok(where.includes(text), `${name}: ${text}`);
  assert.equal(w.merge("12"), w.merge(), "one merge text, the holon unnamed");
  for (const text of [w.push(), w.merge(), w.early("r7"), FULL]) assert.doesNotMatch(text, FOREIGN);
});

test("claude code: the start word by the cover, none after a compaction or without a cover", () => {
  const dir = repo();
  const said = start(dir);
  assert.equal(said?.hookEventName, "SessionStart");
  assert.equal(said.additionalContext, FULL);
  assert.equal(start(dir, "resume")?.additionalContext, FULL);
  assert.equal(start(dir, "compact"), null);
  assert.equal(start(repo({ agents: "# no cover\n" })), null);
});

test("claude code: a cover naming only the graph — the early word", () => {
  const early = repo({ agents: "---\nverstak:\n  graph: r7\n---\n# x\n" });
  assert.equal(start(early)?.additionalContext, RITES.en.early("r7"));
});

test("claude code: push and merge by outcome, our words", () => {
  const dir = repo();
  assert.equal(bash(dir, "git push origin HEAD", PUSHED)?.additionalContext, RITES.en.push());
  assert.equal(bash(dir, "gh pr merge 12 --squash")?.additionalContext, RITES.en.merge());
  assert.equal(bash(dir, "gh pr merge --help", "Usage: gh pr merge"), null);
  assert.equal(bash(dir, "echo git push", ""), null);
  assert.equal(bash(repo({ agents: "# x\n" }), "git push origin HEAD", PUSHED), null);
});

test("claude code: a kind the repository holds itself keeps the delivery silent there", () => {
  const own = (event, command, matcher) => ({
    hooks: {
      [event]: [{ ...(matcher ? { matcher } : {}), hooks: [{ type: "command", command }] }],
    },
  });
  const started = repo({ settings: own("SessionStart", "echo 'read the verstak door Start'") });
  assert.equal(start(started), null);
  const pushHook = "jq -e 'git(?: -C [^ ]+)* push' >/dev/null && echo x || true";
  const pushing = repo({ settings: own("PostToolUse", pushHook, "Bash") });
  assert.equal(bash(pushing, "git push origin HEAD", PUSHED), null);
  assert.ok(start(pushing), "the start word stays: only the held kind is silent");
  assert.equal(bash(pushing, "gh pr merge 3")?.additionalContext, RITES.en.merge());
  const writing = repo({ settings: own("PostToolUse", pushHook, "Write") });
  assert.ok(bash(writing, "git push origin HEAD", PUSHED), "another matcher holds nothing");
});

test("claude code: only the rituals the cover's field lists speak; empty — none", () => {
  const off = repo({ agents: switched(" merge") });
  assert.equal(start(off), null, "start left out");
  assert.equal(bash(off, "git push origin HEAD", PUSHED), null, "push left out");
  assert.ok(bash(off, "gh pr merge 12 --squash"));
  const on = repo({ agents: switched(" start push") });
  assert.equal(start(on)?.additionalContext, FULL);
  assert.ok(bash(on, "git push origin HEAD", PUSHED));
  assert.equal(bash(on, "gh pr merge 12 --squash"), null, "merge left out");
  const none = repo({ agents: switched("") });
  assert.equal(start(none), null);
  assert.equal(bash(none, "git push origin HEAD", PUSHED), null);
  assert.equal(bash(none, "gh pr merge 12 --squash"), null);
});

/** A repository on main whose HEAD equals its push ref — a quiet push there has landed. */
function onTrunk() {
  const dir = mkdtempSync(join(tmpdir(), "rites-trunk-"));
  const origin = mkdtempSync(join(tmpdir(), "rites-origin-"));
  process.on("exit", () =>
    [dir, origin].forEach((d) => rmSync(d, { recursive: true, force: true })),
  );
  const g = (...a) => execFileSync("git", ["-C", dir, ...a], { stdio: "ignore" });
  execFileSync("git", ["init", "-q", "--bare", origin], { stdio: "ignore" });
  g("init", "-q", "-b", "main");
  execFileSync("cp", [join(repo(), "AGENTS.md"), join(dir, "AGENTS.md")]);
  g("-c", "user.email=p@x", "-c", "user.name=p", "commit", "-q", "--allow-empty", "-m", "a");
  g("remote", "add", "origin", origin);
  g("push", "-q", "-u", "origin", "main");
  return dir;
}

// Core v7.31.0 (graph @nks/nks-dev, nodes #8362, #6919): a quiet push to the trunk by its refspec
// says the merge word; a known refusal says nothing; naming no trunk from a folder on main — none.
test("claude code: a quiet push — to the trunk by refspec the merge word, refused or unnamed none", () => {
  const said = bash(onTrunk(), "git push -q origin main 2>&1 | tail -1", "")?.additionalContext;
  assert.equal(said, RITES.en.merge());
  const dir = onTrunk();
  for (const cmd of ["git push -q origin main", "git push -q origin feat/x"])
    assert.equal(bash(dir, cmd, "", 1), null, cmd);
  for (const cmd of ["git push -q", "git push -q 2>&1 | tail -1"])
    assert.equal(bash(onTrunk(), cmd, ""), null, cmd);
});
