// The prepare subcommand in our words (the core's cli/prepare*.ts; graph @nks/nks-dev, node
// #9319, the cover's form #9316): one call over a temporary repository writes the verstak: cover,
// the REALITY.md stub, the CLAUDE.md pointer and the memory guard; start, push and merge are the
// delivery's own (#9341) and never written. What is pinned here is the delivery side: the guard
// equals align's sample (skills/verstak/references/align-hooks.md) byte for byte with its slot
// filled, the start sample there is the delivery's start word, the stub and the left items name
// our door, steps and tools, nothing in the answer or the files speaks another delivery's words.
// The core's behaviour (idempotence, others' entries kept, refusals) is the sibling's suite.
//
// VERSTAK_BRIDGE_PATH points the probe at any copy: a bridge without prepare takes the argument as
// a launch — no files, no JSON answer.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, readlinkSync, rmSync, writeFileSync } from "node:fs";
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

// No key of the bridge under the probe: prepare never asks the graph for a holon or role.
const ENV = {
  ...process.env,
  [envName("BRIDGE_NO_UPDATE")]: "1",
  [envName("BRIDGE_AUTH_DIR")]: join(scratch, "auth"),
  [envName("BRIDGE_TOKEN")]: "",
};
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
    env: ENV,
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

test("prepare: a fresh repository answers JSON, exit 3, only the contract left, only the guard written", () => {
  assert.ok(run.out, `not JSON: ${run.stdout}${run.stderr}`);
  assert.equal(run.status, 3);
  assert.equal(run.out.repository, "github.com/acme/widget");
  assert.deepEqual(Object.fromEntries(coverBlock(read(dir, "AGENTS.md"), "verstak")), {
    graph: "r7",
    holon: "12",
    agent_role: "34",
  });
  for (const f of ["AGENTS.md", "REALITY.md", "CLAUDE.md", "hook.guard"])
    assert.ok(run.out.done.includes(f), f);
  assert.deepEqual(
    run.out.left.map((x) => x.item),
    ["cover.contract"],
  );
  assert.deepEqual(
    Object.keys(JSON.parse(read(dir, ".claude/settings.json")).hooks),
    ["PreToolUse"],
    "start, push and merge are not written into the repository",
  );
  if (process.platform !== "win32") assert.equal(readlinkSync(join(dir, "CLAUDE.md")), "AGENTS.md");
});

test("prepare: align-hooks.md's start sample, its slots filled, says the delivery's start word", () => {
  const start = fill(START_SAMPLE);
  assert.ok(!START_SAMPLE.includes("Owner role"), "the owner role is read from the graph");
  const said = spawnSync("/bin/sh", ["-c", start], { encoding: "utf8", input: "{}" });
  const ctx = JSON.parse(said.stdout).hookSpecificOutput.additionalContext;
  assert.equal(ctx, PREPARE.en.start({ graph: "r7", holon: "12", role: "34" }));
  assert.match(start, REPO_SIGNS.startMark, "the repository signs see such a hook");
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

// A guard written by an earlier delivery in its own words (contract 11 named a stub the
// directory no longer has) is prepare's own: rewritten in place to today's words, not kept
// (graph @nks/nks-dev, node #7910; the core's preparehooks.ts at the sibling's v7.34.0).
test("prepare: a guard in an earlier delivery's words is rewritten to today's", () => {
  const d = repo();
  const now = "This dir stays frozen: nothing is written here.";
  const old = fill(GUARD_SAMPLE).replace(now, "This dir stays frozen at its prohibition stub.");
  assert.notEqual(old, fill(GUARD_SAMPLE), "the sample carries today's words");
  mkdirSync(join(d, ".claude"));
  writeFileSync(
    join(d, ".claude/settings.json"),
    JSON.stringify({
      hooks: {
        PreToolUse: [
          {
            matcher: "Write|Edit|MultiEdit|NotebookEdit",
            hooks: [{ type: "command", command: old }],
          },
        ],
      },
    }),
  );
  const r = prepare(d, ADDR);
  assert.ok(r.out?.done.includes("hook.guard"), r.stdout);
  assert.deepEqual(commands(d, "PreToolUse"), [fill(GUARD_SAMPLE)]);
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

// --help is admitted before any subcommand and prints the whole usage (core v7.36.0);
// prepare's own usage line answers a malformed argument.
test("prepare: the usage line in our words", () => {
  const run = (arg) =>
    spawnSync(process.execPath, [BRIDGE, "prepare", arg], {
      env: ENV,
      encoding: "utf8",
      timeout: 10000,
      input: "",
    });
  const help = run("--help");
  assert.equal(help.status, 0);
  assert.match(help.stdout, /verstak-bridge\.mjs prepare \[--dir <repo>\]/);
  assert.doesNotMatch(help.stdout, FOREIGN);
  const bad = run("--frobnicate");
  const said = bad.stdout + bad.stderr;
  assert.ok(said.includes(PREPARE.en.usage()));
  assert.doesNotMatch(said, /--lang/);
  assert.doesNotMatch(said, FOREIGN);
});

// A start or guard the repository runs from a script prepare can't read (graph @nks/nks-dev,
// node #9331): none of its own beside it, and the model is told in our words to read the script.
test("prepare: an unread script-form hook gets none beside it and a left item in our words", () => {
  const d = repo();
  mkdirSync(join(d, ".claude", "hooks"), { recursive: true });
  writeFileSync(join(d, ".claude", "hooks", "boot.sh"), "#!/bin/sh\n. ./.env.sh\n");
  const start = "bash .claude/hooks/boot.sh";
  const guard = "python3 .claude/hooks/missing.py";
  writeFileSync(
    join(d, ".claude", "settings.json"),
    JSON.stringify({
      hooks: {
        SessionStart: [{ hooks: [{ type: "command", command: start }] }],
        PreToolUse: [{ matcher: "Write|Edit", hooks: [{ type: "command", command: guard }] }],
      },
    }),
  );
  const r = prepare(d, [...ADDR, "--contract", "10"]);
  assert.equal(r.status, 3, r.stderr);
  assert.deepEqual(commands(d, "SessionStart"), [start]);
  assert.deepEqual(commands(d, "PreToolUse"), [guard]);
  for (const [item, cmd, kind, act] of [
    [
      "hook.start",
      start,
      "the start hook",
      /if it is, take it off \(the delivery carries the start/,
    ],
    ["hook.guard", guard, "the memory guard", /align's Step 4 \(references\/align-hooks\.md\)/],
  ]) {
    const why = r.out.left.find((x) => x.item === item)?.why ?? "";
    assert.ok(why.includes(cmd), `${item}: ${JSON.stringify(r.out.left)}`);
    assert.match(why, new RegExp(`could not tell whether it is ${kind}`));
    assert.match(why, act);
    assert.doesNotMatch(why, FOREIGN);
  }
});

// The repository's own start, push and merge hooks and rituals plugin, which the delivery now
// carries: kept as they stand and named to the model for the transition (align, Step 4).
test("prepare: the repository's own carried rituals are kept and named for the transition", () => {
  const d = repo();
  mkdirSync(join(d, ".claude"), { recursive: true });
  const start = `echo '{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"read Start of the verstak door"}}'`;
  const push = "jq -e 'git(?: -C [^ ]+)* push' >/dev/null && echo pushed || true";
  const merge = "jq -e 'gh pr merge' >/dev/null && echo merged || true";
  writeFileSync(
    join(d, ".claude", "settings.json"),
    JSON.stringify({
      hooks: {
        SessionStart: [{ hooks: [{ type: "command", command: start }] }],
        PostToolUse: [
          { matcher: "Bash", hooks: [{ type: "command", command: push }] },
          { matcher: "Bash", hooks: [{ type: "command", command: merge }] },
        ],
      },
    }),
  );
  mkdirSync(join(d, ".opencode", "plugins"), { recursive: true });
  writeFileSync(join(d, ".opencode", "plugins", "verstak-rituals.js"), "export default {};\n");
  const r = prepare(d, [...ADDR, "--contract", "11"]);
  assert.equal(r.status, 3, r.stderr);
  assert.deepEqual(commands(d, "SessionStart"), [start]);
  assert.deepEqual(commands(d, "PostToolUse"), [push, merge]);
  for (const item of ["hook.start", "hook.push", "hook.merge", "opencode.rituals"]) {
    const why = r.out.left.find((x) => x.item === item)?.why ?? "";
    assert.match(why, /the delivery carries the rituals and keeps silent beside/, item);
    assert.match(why, /take it off/, item);
    assert.match(why, /\(align, Step 4, the transition\)/, item);
    assert.doesNotMatch(why, FOREIGN, item);
  }
});

// The cover's rituals: field (graph @nks/nks-dev, node #9316): kept as it stands, the guard
// switched off is not written, an unknown name goes to the model in our words.
test("prepare: the rituals: field stands, a switched-off guard is not written, an unknown name is left", () => {
  const d = repo();
  writeFileSync(
    join(d, "AGENTS.md"),
    "---\nverstak:\n  graph: r7\n  rituals: start mege\n---\n# x\n",
  );
  const r = prepare(d, [...ADDR, "--contract", "11", "--stamp", "2026-11-03"]);
  assert.match(read(d, "AGENTS.md"), /^ {2}rituals: start mege$/m);
  assert.equal(coverBlock(read(d, "AGENTS.md"), "verstak").get("contract"), "11");
  assert.throws(() => read(d, ".claude/settings.json"), "the guard switched off is not written");
  const why = r.out.left.find((x) => x.item === "cover.rituals")?.why ?? "";
  assert.equal(why, PREPARE.en.left("cover.rituals", "'mege'"));
  assert.doesNotMatch(why, FOREIGN);
});
