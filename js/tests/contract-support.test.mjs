// The alignment support boundary in our words and numbers (the core's shared/covercontract.ts;
// graph @nks/nks-dev, node #9786): a cover below contract 11 gets one warning naming a full
// verstak align to 15 at each explicit entry — the Claude Code start ritual, doctor, prepare —
// and nothing in the repository is touched: the old hooks stay, the stamp is not bumped.
// Supported and future covers hear nothing; our older stamp lines count on the same counter, a
// date there is no number. The target is pinned to the contract the door and align write
// (#10073). The core's diagnosis itself (ambiguity, foreign covers) is the sibling's suite.
//
// VERSTAK_BRIDGE_PATH and VERSTAK_RITUALS_HOOK point the probes at any copy (a past release).
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { after, test } from "node:test";

import { CONTRACT_SUPPORT, envName } from "../delivery/index.ts";
import { contractOf, contractWarning } from "../shared/covercontract.ts";
import { BUILT_BRIDGE, REPO } from "./built.mjs";
import { startFakeServer } from "./fake-server.mjs";
import { COVER, repo, start } from "./rites-kit.mjs";

const BRIDGE = process.env.VERSTAK_BRIDGE_PATH || BUILT_BRIDGE;
const WARNING =
  "Contract 10 is no longer supported; old hooks have not been removed. Run a full verstak align to contract 15; rituals will be accepted after verification";
const OLD = COVER.replace("contract: 11", "contract: 10");
const OWN_START = {
  hooks: {
    SessionStart: [
      {
        matcher: "startup",
        hooks: [{ type: "command", command: "echo 'read the verstak door Start'" }],
      },
    ],
  },
};
const scratch = mkdtempSync(join(tmpdir(), "verstak-contract-"));
after(() => rmSync(scratch, { recursive: true, force: true }));

const env = (home) => ({
  ...process.env,
  HOME: home,
  USERPROFILE: home,
  XDG_CONFIG_HOME: join(home, ".config"),
  CODEX_HOME: join(home, ".codex"),
  [envName("BRIDGE_AUTH_DIR")]: join(home, "auth"),
  [envName("BRIDGE_TOKEN")]: "",
  [envName("BRIDGE_NO_UPDATE")]: "1",
  [envName("BRIDGE_DAEMON")]: "0",
});
const snapshot = (root, dir = root) =>
  Object.fromEntries(
    readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
      e.isDirectory()
        ? [
            [relative(root, join(dir, e.name)), "directory"],
            ...Object.entries(snapshot(root, join(dir, e.name))),
          ]
        : [[relative(root, join(dir, e.name)), readFileSync(join(dir, e.name)).toString("base64")]],
    ),
  );
let n = 0;
const home = () => {
  const h = join(scratch, `h${n++}`);
  mkdirSync(h);
  return h;
};

test("the bridge's target is the contract the door and align write", () => {
  const door = readFileSync(join(REPO, "skills/verstak/SKILL.md"), "utf8");
  const align = readFileSync(join(REPO, "skills/verstak/methods/align.md"), "utf8");
  assert.equal(Number(/CONTRACT: (\d+)/.exec(door)?.[1]), CONTRACT_SUPPORT.target);
  assert.equal(Number(/\*\*Contract: `(\d+)`/.exec(align)?.[1]), CONTRACT_SUPPORT.target);
  assert.equal(
    Number(/lowest still supported: `(\d+)`/.exec(align)?.[1]),
    CONTRACT_SUPPORT.minimum,
  );
});

test("the Claude Code start ritual warns once in our words, keeping the repository's own start hook", () => {
  const dir = repo({ agents: OLD, settings: OWN_START });
  const before = snapshot(dir);
  assert.ok(start(dir)?.additionalContext.includes(WARNING), "no warning at startup");
  assert.equal(start(dir, "compact"), null);
  assert.deepEqual(snapshot(dir), before);
});

test("supported and future covers are not called unsupported", () => {
  for (const c of [11, 12, 13, 14, 15, 16]) {
    const dir = repo({ agents: COVER.replace("contract: 11", `contract: ${c}`) });
    assert.ok(!start(dir)?.additionalContext.includes("no longer supported"), String(c));
  }
});

test("our older stamp lines count on the same counter; a date is no contract number", () => {
  for (const stamp of [
    "*(verstak align: contract `9`, stamped `2026-10-30` — re-run when …)*",
    "*(verstakify: contract `5` — re-run when …)*",
  ])
    assert.equal(
      contractWarning(contractOf(stamp)),
      WARNING.replace("10", /`(\d+)`/.exec(stamp)[1]),
    );
  assert.equal(contractWarning(contractOf("*(verstak align: contract `11`, stamped `x`)*")), null);
  assert.deepEqual(contractOf("*(verstakify: contract `2026-05-01` — re-run when …)*"), {
    kind: "missing",
  });
});

test("prepare warns once, keeps an older guard's and the start hook's bytes, never bumps the stamp", () => {
  const dir = repo({ agents: OLD, settings: OWN_START });
  spawnSync("git", ["init", "-q", dir]);
  const h = home();
  const run = (args) =>
    spawnSync(process.execPath, [BRIDGE, "prepare", "--dir", dir, ...args], {
      env: env(h),
      encoding: "utf8",
      timeout: 10000,
      input: "",
    });
  // The guard in prepare's own form, then aged to older words.
  assert.ok([0, 3].includes(run(["--json"]).status));
  const file = join(dir, ".claude", "settings.json");
  const s = JSON.parse(readFileSync(file, "utf8"));
  const guard = s.hooks.PreToolUse[0].hooks[0];
  guard.command = guard.command.replace("BLOCKED", "OLD BLOCKED");
  writeFileSync(file, JSON.stringify(s));
  const files = ["AGENTS.md", ".claude/settings.json"];
  const before = files.map((f) => readFileSync(join(dir, f)));
  const r = run(["--json"]);
  assert.equal(r.status, 3, r.stderr);
  const out = JSON.parse(r.stdout);
  assert.deepEqual(out.warnings, [WARNING]);
  assert.equal(out.cover.contract, "10");
  assert.equal(out.cover.stamp, "2026-11-03");
  files.forEach((f, i) => assert.deepEqual(readFileSync(join(dir, f)), before[i], f));
  assert.equal(run([]).stdout.split(WARNING).length - 1, 1);
});

test("doctor warns once and leaves the repository as it was", async (t) => {
  const fake = await startFakeServer();
  t.after(() => fake.stop());
  const dir = repo({ agents: OLD, settings: OWN_START });
  const before = snapshot(dir);
  const r = await new Promise((resolve, reject) => {
    const p = spawn(process.execPath, [BRIDGE, "doctor", fake.mcpUrl], {
      cwd: dir,
      env: env(home()),
      stdio: ["ignore", "pipe", "pipe"],
    });
    let out = "";
    p.stdout.on("data", (c) => (out += c));
    p.stderr.on("data", (c) => (out += c));
    p.on("error", reject);
    p.on("exit", (status) => resolve({ status, out }));
  });
  assert.equal(r.status, 0, r.out);
  assert.equal(r.out.split(WARNING).length - 1, 1, r.out);
  assert.deepEqual(snapshot(dir), before);
});
