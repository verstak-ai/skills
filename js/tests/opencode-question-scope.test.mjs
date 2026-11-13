// The OpenCode plugin's refusal of the blocking question tool (graph @nks/nks-dev, node #10397)
// at our scope, QUESTION_SCOPE "repo" (node #10020): in a repository under our cover the built dev
// plugin removes `question` from the tools and denies its permission check, an unrelated action
// still allowed; outside our cover it leaves both alone. Run through the core's stand-in context
// (cli/ritualprobe.ts), the one check-rituals uses — not a live harness.
import assert from "node:assert/strict";
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";

import { probeScope } from "../cli/ritualprobe.ts";
import { envName, QUESTION_SCOPE } from "../delivery/index.ts";
import { BUILT_PLUGIN } from "./built.mjs";

const scratch = mkdtempSync(join(tmpdir(), "verstak-oc-question-"));
after(() => rmSync(scratch, { recursive: true, force: true }));
// The plugin under probe never reaches the invoking agent's home, grant or bridge: a copy
// with no bridge beside it (the plugin looks there too), and should a bridge still start,
// no browser and no daemon outliving the test.
Object.assign(process.env, {
  HOME: scratch,
  [envName("BRIDGE_AUTH_DIR")]: scratch,
  [envName("BRIDGE_PATH")]: join(scratch, "absent.mjs"),
  [envName("BRIDGE_NO_BROWSER")]: "1",
  [envName("BRIDGE_DAEMON")]: "0",
  [envName("ROOT_SEAT")]: "0",
});
const PLUGIN = join(mkdtempSync(join(scratch, "plugin-")), "verstak.js");
copyFileSync(BUILT_PLUGIN, PLUGIN);

function dir(name, agents) {
  const d = join(scratch, name);
  mkdirSync(join(d, ".git"), { recursive: true });
  if (agents !== undefined) writeFileSync(join(d, "AGENTS.md"), agents);
  return d;
}
const foreign = dir("foreign");

test("OpenCode plugin: the question scope is ours, repo", () => {
  assert.equal(QUESTION_SCOPE, "repo");
});

test("OpenCode plugin: under our cover question is removed and refused, another action allowed", async () => {
  const own = dir("own", "---\nverstak:\n  graph: r7\n  holon: 12\n  agent_role: 34\n---\n# x\n");
  const q = (await probeScope(PLUGIN, own, foreign)).questions;
  assert.deepEqual(q, { removed: true, denied: true, caseAllowed: true });
});

for (const [kind, agents] of [
  ["no AGENTS.md", undefined],
  ["a plain AGENTS.md", "# My instructions\n"],
  ["another delivery's cover", "---\nother:\n  graph: r5\n---\n# x\n"],
])
  test(`OpenCode plugin: with ${kind} question and its permission are left alone`, async () => {
    const own = dir(kind.replace(/\W+/g, "-"), agents);
    const q = (await probeScope(PLUGIN, own, foreign)).questions;
    assert.deepEqual(q, { removed: false, denied: false, caseAllowed: true });
  });
