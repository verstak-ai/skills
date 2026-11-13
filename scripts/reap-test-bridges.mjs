#!/usr/bin/env node
// After the suite: no bridge started from this tree's dev build may outlive it. A leaked
// daemon without a grant keeps opening sign-in pages on the machine (case #4886). Waits a
// moment for daemons ending by their idle timer, then kills what is left and fails, naming
// each. Pure Node; `ps` on macOS and Linux.
//
//   node scripts/reap-test-bridges.mjs
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DEV = join(dirname(fileURLToPath(import.meta.url)), "..", "dist", "dev") + "/";
const GRACE_MS = 5_000;

function leftovers() {
  const out = execFileSync("ps", ["-axo", "pid=,command="], { encoding: "utf8" });
  return out
    .split("\n")
    .map((l) => /^\s*(\d+)\s+(.*)$/.exec(l))
    .filter((m) => m && m[2].includes(DEV) && m[2].includes("verstak-bridge.mjs"))
    .map((m) => ({ pid: Number(m[1]), command: m[2] }))
    .filter((p) => p.pid !== process.pid);
}

const deadline = Date.now() + GRACE_MS;
let left = leftovers();
while (left.length && Date.now() < deadline) {
  await new Promise((r) => setTimeout(r, 250));
  left = leftovers();
}
if (!left.length) process.exit(0);
for (const p of left) {
  try {
    process.kill(p.pid, "SIGTERM");
  } catch {
    /* already gone */
  }
  console.error(`reap-test-bridges: killed a bridge the suite left running: ${p.pid} ${p.command}`);
}
process.exit(1);
