// Behavioural probes of the machine daemon's orchestration door through this delivery (the
// core's bridge/orchestra.ts, bridge/orchestra-door.ts, cli/orchestra.ts; graph @nks/nks-dev,
// nodes #7513, #7514, #8202): the flag, the named graph boundary and the daemon's local entrance,
// spoken in our words and our environment names. The daemon is real — raised by the subcommand
// against no server, for the door needs no session. The tact's reading of the queues is the
// sibling's suite, against its fake graph server; it is not repeated here.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { connect } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { envName, ORCHESTRA, tool } from "../delivery/index.ts";
import { BUILT_BRIDGE } from "./built.mjs";

const BRIDGE = process.env.VERSTAK_BRIDGE_PATH || BUILT_BRIDGE;
const CONSENT = { [envName("ORCHESTRA")]: "1" };
const NO_DAEMON = /the machine daemon is not running/;

function cli(args, env = {}) {
  const proc = spawn(process.execPath, [BRIDGE, "orchestra", ...args, "--lang", "en"], {
    env: { ...process.env, [envName("BRIDGE_NO_UPDATE")]: "1", ...env },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let out = "";
  let err = "";
  proc.stdout.on("data", (c) => (out += c));
  proc.stderr.on("data", (c) => (err += c));
  return new Promise((resolve) => {
    proc.once("exit", (code, signal) => resolve({ code, signal, out, err }));
    setTimeout(() => proc.kill("SIGKILL"), 30_000).unref();
  });
}

function raiseDaemon(dir, env = {}) {
  const proc = spawn(process.execPath, [BRIDGE, "daemon", "--auth-dir", dir], {
    env: {
      ...process.env,
      [envName("BRIDGE_NO_UPDATE")]: "1",
      // A leaked daemon of a failed probe leaves on its own long before the runner's patience.
      [envName("BRIDGE_DAEMON_IDLE_MS")]: "15000",
      ...env,
    },
    stdio: ["ignore", "ignore", "pipe"],
  });
  return () =>
    new Promise((resolve) => {
      if (proc.exitCode !== null || proc.signalCode !== null) return resolve();
      proc.once("exit", resolve);
      setTimeout(resolve, 5000).unref();
      proc.kill("SIGKILL");
    });
}

/** Until the daemon's door answers — or the cause why it never did. */
async function untilDoor(dir) {
  const until = Date.now() + 20_000;
  for (;;) {
    const r = await cli(["status", "--auth-dir", dir]);
    if (!NO_DAEMON.test(r.err)) return r;
    if (Date.now() > until) throw new Error(`the door never answered: ${r.err}`);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

function authDir(t) {
  const dir = mkdtempSync(join(tmpdir(), "verstak-orchestra-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

const flagAt = (dir) => join(dir, "run", "orchestra.json");
const flagOf = (dir) => JSON.parse(readFileSync(flagAt(dir), "utf8"));

test("orchestra: no daemon — the op is refused aloud, nothing written", async (t) => {
  const dir = authDir(t);
  const r = await cli(["on", "--auth-dir", dir]);
  assert.equal(r.code, 1, `exit 1, not ${r.code}: ${r.err}${r.out}`);
  assert.match(r.err, NO_DAEMON, r.err);
  assert.ok(!existsSync(flagAt(dir)), "nothing was written without a daemon");
});

test("orchestra: on without the machine's consent — refused naming our variable, the flag untouched", async (t) => {
  const dir = authDir(t);
  const stop = raiseDaemon(dir);
  try {
    await untilDoor(dir);
    const r = await cli(["on", "--realm", "@x/one", "--auth-dir", dir]);
    assert.equal(r.code, 1, r.err);
    assert.match(r.err, /has not admitted the orchestrator/, r.err);
    assert.ok(r.err.includes(`${envName("ORCHESTRA")}=1`), r.err);
    // Run on pipes, as an agent's shell runs it: a terminal's consent is named, none is given.
    assert.match(r.err, /typed at a terminal/, r.err);
    assert.ok(!existsSync(flagAt(dir)), "the refusal wrote no flag");
  } finally {
    await stop();
  }
});

test("orchestra: on with consent — the flag lies next to the grant, the boundary grows, off clears", async (t) => {
  const dir = authDir(t);
  const stop = raiseDaemon(dir, CONSENT);
  try {
    await untilDoor(dir);
    const on = await cli(["on", "--realm", "@x/one", "--realm", "@x/two", "--auth-dir", dir]);
    assert.equal(on.code, 0, on.err);
    assert.match(on.out, /the orchestrator is on/);
    assert.deepEqual(flagOf(dir), { on: true, realms: ["@x/one", "@x/two"] });
    const more = await cli(["on", "--realm", "@x/three", "--auth-dir", dir]);
    assert.equal(more.code, 0, more.err);
    assert.deepEqual(flagOf(dir).realms, ["@x/one", "@x/two", "@x/three"], "on extends");
    const st = await cli(["status", "--auth-dir", dir]);
    assert.equal(st.code, 0, st.err);
    assert.match(st.out, /^on; named boundary: @x\/one, @x\/two, @x\/three/);
    const off = await cli(["off", "--auth-dir", dir]);
    assert.equal(off.code, 0, off.err);
    assert.match(off.out, /the orchestrator is off/);
    assert.deepEqual(flagOf(dir), { on: false, realms: [] });
    assert.match((await cli(["status", "--auth-dir", dir])).out, /^off/);
  } finally {
    await stop();
  }
});

// A short rN does not ride the api's REST doors; the refusal names the full address by the
// owner's real handle, never the @owner placeholder (graph @nks/nks-dev, node #8521).
test("orchestra: a short rN boundary is refused naming the full address, never @owner", async (t) => {
  const dir = authDir(t);
  const stop = raiseDaemon(dir, CONSENT);
  try {
    await untilDoor(dir);
    const on = await cli(["on", "--realm", "r5", "--auth-dir", dir]);
    assert.equal(on.code, 1, on.out);
    assert.match(on.err, /r5/, on.err);
    assert.match(on.err, /full address — the owner's handle\/slug from the list of graphs/, on.err);
    assert.doesNotMatch(on.err, /@owner/, on.err);
    const st = await cli(["status", "--auth-dir", dir]);
    assert.doesNotMatch(st.out, /r5/, st.out);
  } finally {
    await stop();
  }
});

test("orchestra: the flag outlives the daemon — a new daemon reads what lies", async (t) => {
  const dir = authDir(t);
  const first = raiseDaemon(dir, CONSENT);
  await untilDoor(dir);
  const on = await cli(["on", "--realm", "@x/kept", "--auth-dir", dir]);
  assert.equal(on.code, 0, on.err);
  await first();
  const second = raiseDaemon(dir, CONSENT);
  try {
    const st = await untilDoor(dir);
    assert.equal(st.code, 0, st.err);
    assert.match(st.out, /^on; named boundary: @x\/kept/);
  } finally {
    await second();
  }
});

test("orchestra: a line that is no known op is answered in our words, and the door stays alive", async (t) => {
  const dir = authDir(t);
  const stop = raiseDaemon(dir);
  const ask = (line) =>
    new Promise((resolve, reject) => {
      const s = connect(join(dir, "run", "orchestra.sock"));
      s.setTimeout(10_000, () => {
        s.destroy();
        reject(new Error("the door stayed silent"));
      });
      s.on("error", reject);
      s.on("connect", () => s.write(line + "\n"));
      let buf = "";
      s.on("data", (c) => {
        buf += c;
        const nl = buf.indexOf("\n");
        if (nl < 0) return;
        s.destroy();
        try {
          resolve(JSON.parse(buf.slice(0, nl)));
        } catch (e) {
          reject(e);
        }
      });
    });
  try {
    await untilDoor(dir);
    const junk = await ask(JSON.stringify({ op: "levitate", realms: [] }));
    assert.equal(junk.ok, false, JSON.stringify(junk));
    assert.match(junk.said, /orchestra: unknown op/, JSON.stringify(junk));
    const broken = await ask("{not json");
    assert.equal(broken.ok, false, JSON.stringify(broken));
    assert.match(broken.said, /orchestra: unknown op/, JSON.stringify(broken));
    const st = await cli(["status", "--auth-dir", dir]);
    assert.equal(st.code, 0, st.err);
    assert.match(st.out, /^off/);
  } finally {
    await stop();
  }
});

test("orchestra: the usage names the subcommand, the dry run and the launcher in our CLI help", async () => {
  const r = await cli([]);
  const said = `${r.out}${r.err}`;
  assert.match(said, /usage: orchestra <on\|off\|status\|step \[--dry-run\]\|demands>/, said);
  assert.match(said, /orchestra on --launcher <name> \[--model <id>\]…/, said);
  // A launcher's attributes without --launcher, or a dry run of anything but step, is no command.
  for (const args of [
    ["on", "--model", "m"],
    ["on", "--dry-run"],
  ]) {
    const bad = await cli(args);
    assert.equal(bad.code, 1, args.join(" "));
    assert.match(bad.err, /^usage: orchestra/, `${args.join(" ")}: ${bad.err}`);
  }
});

// on --launcher describes the launcher in mind before the flag moves (the core's
// bridge/orchestra-describe.ts); against no server the description cannot be read, and a name
// the description reading would not take is refused before any read — both leave no flag.
test("orchestra: on --launcher that cannot describe the launcher is refused in our words, no flag", async (t) => {
  const dir = authDir(t);
  const stop = raiseDaemon(dir, CONSENT);
  try {
    await untilDoor(dir);
    const long = "a".repeat(80);
    const tooLong = await cli(["on", "--launcher", long, "--model", "m", "--auth-dir", dir]);
    assert.equal(tooLong.code, 1, tooLong.out);
    assert.match(
      tooLong.err,
      new RegExp(`launcher name ${long} is longer than \\d+ characters`),
      tooLong.err,
    );
    assert.match(tooLong.err, /the flag is not moved/, tooLong.err);
    const unread = await cli(["on", "--launcher", "orca", "--auth-dir", dir]);
    assert.equal(unread.code, 1, unread.out);
    assert.match(unread.err, /the description of launcher orca did not read or write/, unread.err);
    assert.ok(!existsSync(flagAt(dir)), "no flag without the description");
  } finally {
    await stop();
  }
});

// The raised agent's brief follows the spawned_for line: no second register, the case joined
// by our case tool first (the core's bridge/orchestra-raise.ts; the raise itself is the
// sibling's suite).
test("orchestra: the raised agent's brief sends it into its case by our case tool", () => {
  const room = "1035d984-7313-4699-9090-2baa2ae7cb49";
  const brief = ORCHESTRA.en.brief("@x/g", 42, room, 3);
  assert.ok(brief.includes(`${tool("case")}(action="join", realm="@x/g", room="${room}")`), brief);
  assert.match(brief, /role #42/, brief);
  assert.match(brief, /Do not register again/, brief);
});
