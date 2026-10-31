// The Claude Code SessionStart hook after a compaction (hooks/onboard.mjs, source "compact";
// graph @nks/nks-dev, node #7320) in our words: the role's way back, the seat named only from
// exactly one hold record for the session's directory. Temporary directories only; no network,
// no model.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, dirname, join } from "node:path";
import { test } from "node:test";

import { COMPACTION, envName, ONBOARD_START } from "../delivery/index.ts";
import { BUILT_ONBOARD_HOOK, REPO } from "./built.mjs";

const COMMAND = JSON.parse(
  readFileSync(join(REPO, "hooks", "hooks.json"), "utf8"),
).hooks.SessionStart.find((e) => e.matcher === "compact").hooks[0].command;

function temp(t, prefix) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

/** A plugin root with the built hook, a grant directory and the session's repository —
 * aligned (an AGENTS.md with align's stamp) unless `aligned` is false. */
function lay(t, aligned = true) {
  const root = temp(t, "compact-plugin-");
  mkdirSync(join(root, "hooks"));
  copyFileSync(BUILT_ONBOARD_HOOK, join(root, "hooks", "onboard.mjs"));
  const auth = temp(t, "compact-auth-");
  mkdirSync(join(auth, "standings"));
  const cwd = temp(t, "compact-repo-");
  mkdirSync(join(cwd, ".git"));
  if (aligned)
    writeFileSync(
      join(cwd, "AGENTS.md"),
      "# repo\n\n*(verstak align: contract `9`, stamped `2026-10-30` — …)*\n",
    );
  return { root, auth, cwd };
}

let n = 0;
function hold(auth, rec) {
  const full = { realm: "@tester/work", karta: 7, url: "u", at: Date.now(), ...rec };
  writeFileSync(join(auth, "standings", `r${n++}.hold`), JSON.stringify(full));
}

function hook(s, source) {
  const env = {
    ...process.env,
    PATH: `${dirname(process.execPath)}${delimiter}${process.env.PATH}`,
    CLAUDE_PLUGIN_ROOT: s.root,
    [envName("BRIDGE_AUTH_DIR")]: s.auth,
    CLAUDE_PROJECT_DIR: "",
  };
  delete env[envName("BRIDGE_LANG")];
  return spawnSync(COMMAND, {
    shell: true,
    input: JSON.stringify({
      session_id: "s",
      transcript_path: "/dev/null",
      cwd: s.cwd,
      hook_event_name: "SessionStart",
      source,
    }),
    cwd: tmpdir(),
    env,
    encoding: "utf8",
    timeout: 5000,
  });
}

const ok = (r) => {
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stderr, "");
  assert.equal(r.stdout.trimEnd().split("\n").length, 1, r.stdout);
  return r.stdout;
};

test("compact hook: one seat for the directory — role, seat, the door and the ladder", (t) => {
  const s = lay(t);
  hold(s.auth, { name: "m3.skills", cwd: s.cwd, client: "claude-code" });
  const out = ok(hook(s, "compact"));
  assert.equal(out, `${COMPACTION.en.back("7", "m3.skills", "@tester/work")}\n`);
  assert.match(
    out,
    /^Verstak: the context was compacted\. You are role #7 in graph @tester\/work; the bridge holds seat m3\.skills\./,
  );
  assert.match(out, /verstak skill.*"Recalling"/);
  assert.ok(!out.includes(ONBOARD_START.en.start()), "no invitation after a compaction");
});

const AMBIGUOUS = {
  "no record": () => [],
  "two seats in the directory": (cwd) => [
    { name: "a", cwd, client: "claude-code" },
    { name: "b", cwd, client: "claude-code" },
  ],
  "another harness's seat": (cwd) => [{ name: "a", cwd, client: "opencode" }],
  "another directory": () => [{ name: "a", cwd: tmpdir(), client: "claude-code" }],
  "released by leave": (cwd) => [{ name: "a", cwd, client: "claude-code", left: true }],
  expired: (cwd) => [{ name: "a", cwd, client: "claude-code", at: Date.now() - 7 * 3600e3 }],
};

for (const [name, recs] of Object.entries(AMBIGUOUS))
  test(`compact hook: ${name} — the word without role or seat`, (t) => {
    const s = lay(t);
    for (const r of recs(s.cwd)) hold(s.auth, r);
    assert.equal(ok(hook(s, "compact")), `${COMPACTION.en.bare()}\n`);
  });

test("compact hook: no seat in a repository not aligned — silence", (t) => {
  for (const s of [lay(t, false)]) {
    const r = hook(s, "compact");
    assert.equal(r.status, 0, r.stderr);
    assert.equal(r.stdout, "");
  }
});

test("compact hook: startup keeps the invitation, not the compaction word", (t) => {
  const s = lay(t, false);
  hold(s.auth, { name: "m3.skills", cwd: s.cwd, client: "claude-code" });
  assert.equal(ok(hook(s, "startup")), `${ONBOARD_START.en.start()}\n`);
});
