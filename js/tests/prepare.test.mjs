// The prepare subcommand in our words (the core's cli/prepare*.ts; graph @nks/nks-dev, node
// #9319, the cover's form #9316): one call over a temporary repository writes the verstak: cover,
// the REALITY.md stub, the CLAUDE.md pointer, the start hook and the memory guard. What is pinned
// here is the delivery side: the hooks equal align's samples (skills/verstak/references/
// align-hooks.md) byte for byte with their slots filled, the stub and the left items name our
// door, steps and tools, nothing in the answer or the files speaks another delivery's words. The
// core's behaviour (idempotence, others' entries kept, refusals) is the sibling's suite.
//
// VERSTAK_BRIDGE_PATH points the probe at any copy: a bridge without prepare takes the argument as
// a launch — no files, no JSON answer.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, readlinkSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";

import { envName, PREPARE, REPO_SIGNS } from "../delivery/index.ts";
import { coverBlock } from "../shared/coverblock.ts";
import { BUILT_BRIDGE, REPO } from "./built.mjs";

const BRIDGE = process.env.VERSTAK_BRIDGE_PATH || BUILT_BRIDGE;
const FOREIGN = new RegExp("\\p{Script=Cyrillic}|is" + "kron", "iu");
const scratch = mkdtempSync(join(tmpdir(), "verstak-prepare-"));
after(() => rmSync(scratch, { recursive: true, force: true }));

let n = 0;
function repo() {
  const dir = join(scratch, `r${n++}`);
  mkdirSync(dir);
  spawnSync("git", ["init", "-q", dir]);
  spawnSync("git", ["-C", dir, "remote", "add", "origin", "git@github.com:acme/widget.git"]);
  return dir;
}

function prepare(dir, args = []) {
  const r = spawnSync(process.execPath, [BRIDGE, "prepare", "--dir", dir, "--json", ...args], {
    env: { ...process.env, [envName("BRIDGE_NO_UPDATE")]: "1" },
    encoding: "utf8",
    timeout: 10000,
    input: "",
  });
  let out = null;
  try {
    out = JSON.parse(r.stdout);
  } catch {
    /* not this subcommand */
  }
  return { status: r.status, out, stdout: r.stdout, stderr: r.stderr };
}

const read = (dir, f) => readFileSync(join(dir, f), "utf8");
const commands = (dir, event) =>
  (JSON.parse(read(dir, ".claude/settings.json")).hooks?.[event] ?? []).flatMap((e) =>
    e.hooks.map((h) => h.command),
  );
const ADDR = ["--graph", "r7", "--holon", "12", "--agent-role", "34", "--case", "77"];

// The samples as align-hooks.md publishes them: the first JSON block's start entry and the
// memory guard section's entry.
const hooksMd = read(REPO, "skills/verstak/references/align-hooks.md");
const firstJson = (text) => JSON.parse(/```json\n([\s\S]*?)\n```/.exec(text)[1]);
const START_SAMPLE = firstJson(hooksMd).hooks.SessionStart[0].hooks[0].command;
const GUARD_SAMPLE = firstJson(hooksMd.split("## Memory guard")[1]).hooks[0].command;
const fill = (sample) =>
  sample.replace("<Graph>", "r7").replace("<Focus holon>", "12").replace("<Agent role>", "34");

const dir = repo();
const run = prepare(dir, ADDR);

test("prepare: a fresh repository answers JSON, exit 3, push and merge and contract left", () => {
  assert.ok(run.out, `not JSON: ${run.stdout}${run.stderr}`);
  assert.equal(run.status, 3);
  assert.equal(run.out.repository, "github.com/acme/widget");
  assert.deepEqual(Object.fromEntries(coverBlock(read(dir, "AGENTS.md"), "verstak")), {
    graph: "r7",
    holon: "12",
    agent_role: "34",
  });
  for (const f of ["AGENTS.md", "REALITY.md", "CLAUDE.md", "hook.start", "hook.guard"])
    assert.ok(run.out.done.includes(f), f);
  assert.deepEqual(run.out.left.map((x) => x.item).sort(), [
    "cover.contract",
    "hook.merge",
    "hook.push",
  ]);
  if (process.platform !== "win32") assert.equal(readlinkSync(join(dir, "CLAUDE.md")), "AGENTS.md");
});

test("prepare: the start hook is align-hooks.md's sample with the cover's slots filled", () => {
  const start = commands(dir, "SessionStart");
  assert.deepEqual(start, [fill(START_SAMPLE)]);
  assert.ok(!START_SAMPLE.includes("Owner role"), "the owner role is read from the graph");
  const said = spawnSync("/bin/sh", ["-c", start[0]], { encoding: "utf8", input: "{}" });
  const ctx = JSON.parse(said.stdout).hookSpecificOutput.additionalContext;
  assert.equal(ctx, PREPARE.en.start({ graph: "r7", holon: "12", role: "34" }));
  assert.match(start[0], REPO_SIGNS.startMark, "the repository signs see the hook");
});

test("prepare: the memory guard is align-hooks.md's sample with the graph filled", () => {
  assert.deepEqual(commands(dir, "PreToolUse"), [fill(GUARD_SAMPLE)]);
  const blocked = spawnSync("/bin/sh", ["-c", commands(dir, "PreToolUse")[0]], {
    encoding: "utf8",
    input: JSON.stringify({ tool_input: { file_path: "/x/.claude/projects/p/memory/a.md" } }),
  });
  assert.equal(blocked.status, 2);
  assert.equal(blocked.stderr, `${PREPARE.en.guard("r7")}\n`);
});

test("prepare: the REALITY.md stub is the template heading and align's line", () => {
  const reality = read(dir, "REALITY.md");
  const heading = read(REPO, "skills/verstak/templates/reality-template.md").split("\n")[0];
  assert.ok(reality.startsWith(`${heading}\n`), reality);
  assert.ok(
    read(REPO, "skills/verstak/methods/align.md").includes(
      "Carriers not yet established; alignment case #N. Until they are, behavioural claims are not accepted.",
    ),
  );
  assert.match(reality, /alignment case #77\. Until they are/);
});

test("prepare: left items name our method, steps and tools; nothing in another delivery's words", () => {
  const bare = prepare(repo());
  const why = bare.out.left.map((x) => x.why).join("\n");
  assert.match(why, /verstak_realm\(action="list"\)/);
  assert.match(why, /verstak_search/);
  assert.match(why, /align, Round 1, step 2/);
  assert.match(why, /align, Step 4, by references\/align-hooks\.md/);
  for (const text of [
    run.stdout,
    bare.stdout,
    why,
    read(dir, "AGENTS.md"),
    read(dir, "REALITY.md"),
    read(dir, ".claude/settings.json"),
  ])
    assert.doesNotMatch(text, FOREIGN);
});

test("prepare: the usage line in our words", () => {
  const r = spawnSync(process.execPath, [BRIDGE, "prepare", "--help"], {
    env: { ...process.env, [envName("BRIDGE_NO_UPDATE")]: "1" },
    encoding: "utf8",
    timeout: 10000,
    input: "",
  });
  assert.equal(r.stdout, PREPARE.en.usage());
  assert.doesNotMatch(r.stdout, /--lang/);
});
