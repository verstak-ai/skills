// Behavioural tests for verstak-bridge, run against the local fake in
// js/tests/fake-server.mjs. Black box on purpose: the bridge is spawned exactly as a
// harness spawns it, driven over stdio, and every claim is read off what a
// harness or a browser would actually see — a JSON-RPC answer, an open port,
// the token store on disk. Nothing here reaches the network or the real store.
//
// The core is the sibling delivery's and carries its own suite at the pinned commit
// (js/core.lock); this one proves our build of it keeps the promises the single-file
// bridge made: OAuth discovery, registration, PKCE, refresh, and no silence.

import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { connect } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { BUILT_BRIDGE } from "./built.mjs";
import { startFakeServer } from "./fake-server.mjs";

// Defaults to the dev build; VERSTAK_BRIDGE_PATH points the same suite at another
// copy — the committed release build, an installed one, or a past revision when you
// want to see a test fail on the defect it was written for.
const BRIDGE = process.env.VERSTAK_BRIDGE_PATH || BUILT_BRIDGE;
const INIT_PARAMS = {
  protocolVersion: "2025-06-18",
  capabilities: {},
  clientInfo: { name: "test-harness", version: "0" },
};
const HOME = mkdtempSync(join(tmpdir(), "verstak-bridge-home-"));

// The full bridge in its own process: what the single-file bridge was. The daemon
// path, the default, has its own block below.
const FULL = { VERSTAK_BRIDGE_DAEMON: "0" };
const DAEMON = {
  VERSTAK_BRIDGE_DAEMON: "1",
  VERSTAK_BRIDGE_DAEMON_WAIT_MS: "10000",
  VERSTAK_BRIDGE_DAEMON_IDLE_MS: "500",
  VERSTAK_BRIDGE_ORPHAN_FLOW_MS: "2000",
};

/** A clean environment: none of the caller's delivery variables, a scratch home. */
function bridgeEnv(extra) {
  const env = { ...process.env };
  for (const k of Object.keys(env)) if (k.startsWith("VERSTAK_")) delete env[k];
  return {
    ...env,
    HOME,
    VERSTAK_BRIDGE_NO_BROWSER: "1",
    VERSTAK_BRIDGE_NO_UPDATE: "1",
    VERSTAK_BRIDGE_TOKEN: "",
    ...extra,
  };
}

// --- driving the bridge the way a harness does -----------------------------

function startBridge(serverUrl, authDir, extraEnv = FULL) {
  const proc = spawn(process.execPath, [BRIDGE, serverUrl, "--no-browser", "--auth-dir", authDir], {
    env: bridgeEnv(extraEnv),
    stdio: ["pipe", "pipe", "pipe"],
  });
  const waiters = new Map();
  let out = "";
  let stderr = "";
  proc.stdout.on("data", (c) => {
    out += c;
    let nl;
    while ((nl = out.indexOf("\n")) >= 0) {
      const line = out.slice(0, nl).trim();
      out = out.slice(nl + 1);
      if (!line) continue;
      const msg = JSON.parse(line);
      const w = waiters.get(msg.id);
      if (w) {
        waiters.delete(msg.id);
        w(msg);
      }
    }
  });
  proc.stderr.on("data", (c) => {
    stderr += c;
  });

  return {
    proc,
    get stderr() {
      return stderr;
    },
    send: (msg) => proc.stdin.write(JSON.stringify(msg) + "\n"),
    // Every request must be answered — that is the bridge's core promise, so
    // the timeout here is a failure, never a skip.
    call(method, id, params = {}) {
      const p = new Promise((res, rej) => {
        waiters.set(id, res);
        setTimeout(
          () => rej(new Error(`no answer for ${method} (id ${id}) — the bridge went silent`)),
          15_000,
        ).unref();
      });
      this.send({ jsonrpc: "2.0", id, method, params });
      return p;
    },
    // Idempotent: a bridge the test already killed must not be waited on again.
    stop: () =>
      proc.exitCode !== null || proc.signalCode !== null
        ? Promise.resolve()
        : new Promise((r) => {
            proc.once("exit", r);
            proc.kill("SIGKILL");
          }),
  };
}

// The link a human is handed is the bridge's own loopback address: opening it mints
// the sign-in server's authorize URL and redirects there.
const loginLinkIn = (text) =>
  /(http:\/\/127\.0\.0\.1:\d+\/login\?k=[\w-]+)/.exec(text || "")?.[1] ?? null;
const portOf = (link) => Number(new URL(link).port);

function portListening(port) {
  return new Promise((resolve) => {
    const s = connect({ host: "127.0.0.1", port });
    const done = (v) => {
      s.destroy();
      resolve(v);
    };
    s.setTimeout(1000, () => done(false));
    s.once("connect", () => done(true));
    s.once("error", () => done(false));
  });
}

const storeFile = (dir) =>
  join(
    dir,
    readdirSync(dir).find((f) => f.endsWith(".json")),
  );
const lockFile = (dir) =>
  join(
    dir,
    readdirSync(dir).find((f) => f.endsWith(".auth-pending")),
  );
const readStore = (dir) => JSON.parse(readFileSync(storeFile(dir), "utf8"));
const toolNames = (answer) => (answer.result?.tools ?? []).map((t) => t.name);

// The bridge answers the harness at once and finishes the flow in the
// background, so the click landing is not yet the grant being on disk. Tests
// that go on to depend on the grant wait for it rather than racing it.
async function waitFor(check, what, timeoutMs = 10_000) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    try {
      if (await check()) return;
    } catch {
      /* not there yet */
    }
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${what}`);
    await new Promise((r) => setTimeout(r, 50));
  }
}
const grantLanded = (dir) =>
  waitFor(() => !!readStore(dir).tokens?.access_token, "the exchanged tokens to reach the store");

/** The human's click: open the link and follow it through consent to the callback. */
async function click(link) {
  const res = await fetch(link, { redirect: "follow" });
  assert.equal(res.status, 200, "the loopback callback did not answer the redirect");
  await res.text();
}

// A whole authorization: ask, take the link the bridge published, and play the
// human's click on it. The redirect lands on the bridge's own loopback listener.
async function authorize(bridge, dir, id = 1) {
  const pending = await bridge.call("initialize", id, INIT_PARAMS);
  const link = loginLinkIn(pending.error?.message);
  assert.ok(link, `expected a login link in the answer, got ${JSON.stringify(pending)}`);
  await click(link);
  await grantLanded(dir);
  return link;
}

/** Daemons the run started for this auth dir, from its journal. */
const daemonPids = (dir) => {
  try {
    const log = readFileSync(join(dir, "run", "daemon.log"), "utf8");
    return [...log.matchAll(/ pid=(\d+) \S+ listening /g)].map((m) => Number(m[1]));
  } catch {
    return [];
  }
};

async function withFake(t, opts, fn) {
  const fake = await startFakeServer(opts);
  const dir = mkdtempSync(join(tmpdir(), "verstak-bridge-test-"));
  const bridges = [];
  const spawnBridge = (env) => {
    const b = startBridge(fake.mcpUrl, dir, env);
    bridges.push(b);
    return b;
  };
  try {
    await fn({ fake, dir, spawnBridge });
  } finally {
    await Promise.all(bridges.map((b) => b.stop()));
    for (const pid of daemonPids(dir))
      try {
        process.kill(pid, "SIGKILL");
      } catch {
        /* already gone */
      }
    await fake.stop();
  }
}

// --- the promise the bridge is built on ------------------------------------

test("a call made with no tokens is answered, not swallowed, and carries the login link", async (t) => {
  await withFake(t, {}, async ({ spawnBridge }) => {
    const bridge = spawnBridge();
    const answer = await bridge.call("initialize", 1, INIT_PARAMS);
    assert.equal(answer.id, 1);
    assert.ok(answer.error, "a call that cannot be served must come back as an error for its id");
    assert.ok(
      loginLinkIn(answer.error.message),
      "the error must carry the link the human has to open",
    );
  });
});

test("the callback listener is up BEFORE the login link is published", async (t) => {
  await withFake(t, {}, async ({ spawnBridge }) => {
    const bridge = spawnBridge();
    const answer = await bridge.call("initialize", 1, INIT_PARAMS);
    const link = loginLinkIn(answer.error.message);
    assert.equal(
      await portListening(portOf(link)),
      true,
      "the link was handed out while nothing was listening on its port",
    );
  });
});

test("the full flow authenticates and the next call goes through", async (t) => {
  await withFake(t, {}, async ({ fake, dir, spawnBridge }) => {
    const bridge = spawnBridge();
    await authorize(bridge, dir);
    const answer = await bridge.call("tools/list", 2);
    assert.ok(toolNames(answer).includes("verstak_orient"), JSON.stringify(answer));
    assert.equal(fake.state.counts.code_exchange, 1);
    assert.ok(
      readStore(dir).tokens.refresh_token,
      "the grant must be persisted for the next process",
    );
  });
});

test("the bridge adds its own verstak_stand to the server's tools", async (t) => {
  await withFake(t, {}, async ({ dir, spawnBridge }) => {
    const bridge = spawnBridge();
    await authorize(bridge, dir);
    const names = toolNames(await bridge.call("tools/list", 2));
    assert.ok(names.includes("verstak_stand"), names.join(", "));
    assert.ok(
      names.every((n) => n.startsWith("verstak_")),
      names.join(", "),
    );
  });
});

// --- the reported defect: a pending flow whose owner is gone ---------------

test("a pending flow whose listener is gone is taken over, not re-published", async (t) => {
  await withFake(t, {}, async ({ dir, spawnBridge }) => {
    // Exactly what the dead ephemeral process leaves behind: a fresh-looking
    // file naming a link nothing will ever catch. The pid is this very test
    // runner, so a liveness check on the pid alone would be fooled.
    const first = spawnBridge();
    const stale = await first.call("initialize", 1, INIT_PARAMS);
    const stalePort = portOf(loginLinkIn(stale.error.message));
    const lock = lockFile(dir);
    const held = JSON.parse(readFileSync(lock, "utf8"));
    await first.stop(); // SIGKILL: no exit handler, the file survives its owner
    writeFileSync(lock, JSON.stringify({ ...held, pid: process.pid, started_at: Date.now() }));
    assert.equal(
      await portListening(stalePort),
      false,
      "precondition: the dead owner's port is closed",
    );

    const second = spawnBridge();
    const answer = await second.call("initialize", 2, INIT_PARAMS);
    const link = loginLinkIn(answer.error.message);
    assert.ok(link, "the fresh bridge must publish a link of its own");
    assert.equal(
      await portListening(portOf(link)),
      true,
      "the fresh bridge re-published a link with no listener behind it",
    );
    // And the taken-over flow really completes.
    await click(link);
    await grantLanded(dir);
    assert.ok(toolNames(await second.call("tools/list", 3)).includes("verstak_orient"));
  });
});

test("a bridge told to stop while the human is mid-click outlives it, so the click still lands", async (t) => {
  await withFake(t, {}, async ({ dir, spawnBridge }) => {
    const bridge = spawnBridge();
    const link = loginLinkIn((await bridge.call("initialize", 1, INIT_PARAMS)).error.message);
    // The human opened the link: the bridge minted the sign-in page and redirected there.
    const opened = await fetch(link, { redirect: "manual" });
    assert.equal(opened.status, 302, "opening the link must redirect to the sign-in page");
    await opened.text();
    bridge.proc.kill("SIGTERM"); // what a harness does when its session ends
    await new Promise((r) => setTimeout(r, 400));
    assert.equal(bridge.proc.exitCode, null, "the bridge left while a human was mid-login");
    assert.equal(await portListening(portOf(link)), true, "the redirect had nowhere to land");

    const res = await fetch(opened.headers.get("location"), { redirect: "follow" });
    assert.equal(res.status, 200);
    await res.text();
    await grantLanded(dir);
    await waitFor(() => bridge.proc.exitCode !== null, "the bridge to leave once the flow is done");
  });
});

test("a finished flow leaves no pending lock behind", async (t) => {
  await withFake(t, {}, async ({ dir, spawnBridge }) => {
    const bridge = spawnBridge();
    await authorize(bridge, dir);
    await waitFor(
      () => !readdirSync(dir).some((f) => f.endsWith(".auth-pending")),
      "the pending lock to be dropped",
    );
  });
});

test("a live flow is joined: every instance shows the same link, one click serves them all", async (t) => {
  await withFake(t, {}, async ({ dir, spawnBridge }) => {
    const winner = spawnBridge();
    const joiner = spawnBridge();
    const winnerLink = loginLinkIn((await winner.call("initialize", 1, INIT_PARAMS)).error.message);
    const joinerLink = loginLinkIn((await joiner.call("initialize", 1, INIT_PARAMS)).error.message);
    assert.equal(
      joinerLink,
      winnerLink,
      "a second bridge must surface the standing flow, not start a rival one",
    );

    await click(winnerLink);
    await grantLanded(dir);
    // The joiner never ran a flow of its own; it reads the grant off disk.
    assert.ok(toolNames(await joiner.call("tools/list", 2)).includes("verstak_orient"));
  });
});

test("a fresh process reuses the stored grant with no browser trip at all", async (t) => {
  await withFake(t, { accessTtl: 3600 }, async ({ fake, dir, spawnBridge }) => {
    const first = spawnBridge();
    await authorize(first, dir);
    await first.stop();

    const second = spawnBridge();
    const answer = await second.call("initialize", 1, INIT_PARAMS);
    assert.ok(
      answer.result,
      `the second process should have been served straight away: ${JSON.stringify(answer.error)}`,
    );
    assert.equal(fake.state.counts.authorize, 1, "no second browser flow may be started");
  });
});

// --- keeping the grant alive -----------------------------------------------

test("an expired access token is refreshed silently, without touching the browser", async (t) => {
  await withFake(t, {}, async ({ fake, dir, spawnBridge }) => {
    const first = spawnBridge();
    await authorize(first, dir);
    await first.stop();

    const s = JSON.parse(readFileSync(storeFile(dir), "utf8"));
    s.tokens.expires_at = Date.now() - 1000; // as if the session idled past expiry
    writeFileSync(storeFile(dir), JSON.stringify(s));

    const second = spawnBridge();
    const answer = await second.call("initialize", 1, INIT_PARAMS);
    assert.ok(answer.result, `expected a served call, got ${JSON.stringify(answer.error)}`);
    assert.ok(fake.state.counts.refresh >= 1, "the bridge should have refreshed");
    assert.equal(
      fake.state.counts.authorize,
      1,
      "a refresh must not drag the user into the browser",
    );
    assert.notEqual(
      readStore(dir).tokens.refresh_token,
      s.tokens.refresh_token,
      "the rotated refresh token must be stored",
    );
  });
});

test("a transient refresh failure keeps the grant and never opens a browser", async (t) => {
  await withFake(t, {}, async ({ fake, dir, spawnBridge }) => {
    const first = spawnBridge();
    await authorize(first, dir);
    await first.stop();

    const before = readStore(dir).tokens.refresh_token;
    const s = readStore(dir);
    s.tokens.expires_at = Date.now() - 1000;
    writeFileSync(storeFile(dir), JSON.stringify(s));
    await fake.control({
      refreshStatus: 503,
      refreshError: "temporarily_unavailable",
      revoke_access: true,
    });

    const second = spawnBridge();
    const answer = await second.call("initialize", 1, INIT_PARAMS);
    assert.ok(answer.error, "the call cannot be served while the token endpoint is down");
    assert.equal(
      loginLinkIn(answer.error.message),
      null,
      "a 503 must not send the human to a login screen",
    );
    assert.equal(
      readStore(dir).tokens.refresh_token,
      before,
      "the grant must survive a transient failure",
    );
    assert.equal(fake.state.counts.authorize, 1);
  });
});

test("a definitively dead grant starts a fresh flow with a live listener", async (t) => {
  await withFake(t, {}, async ({ fake, dir, spawnBridge }) => {
    const first = spawnBridge();
    await authorize(first, dir);
    await first.stop();

    const s = readStore(dir);
    s.tokens.expires_at = Date.now() - 1000;
    writeFileSync(storeFile(dir), JSON.stringify(s));
    await fake.control({ refreshStatus: 400, refreshError: "invalid_grant", revoke_access: true });

    const second = spawnBridge();
    const answer = await second.call("initialize", 1, INIT_PARAMS);
    const link = loginLinkIn(answer.error?.message);
    assert.ok(link, `a dead grant must lead to a new authorization: ${JSON.stringify(answer)}`);
    assert.equal(await portListening(portOf(link)), true);
  });
});

// --- never answer the harness with silence ---------------------------------

test("a lost upstream session is re-established transparently", async (t) => {
  await withFake(t, {}, async ({ fake, dir, spawnBridge }) => {
    const bridge = spawnBridge();
    await authorize(bridge, dir);
    assert.ok((await bridge.call("initialize", 2, INIT_PARAMS)).result);
    await fake.control({ kill_session: true });

    const answer = await bridge.call("tools/list", 3);
    assert.ok(
      answer.result,
      `the bridge should have re-initialized and retried: ${JSON.stringify(answer.error)}`,
    );
    assert.ok(toolNames(answer).includes("verstak_orient"));
  });
});

test("an upstream fault comes back as an error for that id, and the bridge stays up", async (t) => {
  await withFake(t, {}, async ({ fake, dir, spawnBridge }) => {
    const bridge = spawnBridge();
    await authorize(bridge, dir);
    await fake.control({ mcpStatus: 500 });
    const failed = await bridge.call("tools/list", 2);
    assert.equal(failed.id, 2);
    assert.ok(failed.error, "an HTTP 500 upstream must not be swallowed");

    await fake.control({ mcpStatus: null });
    const served = await bridge.call("tools/list", 3);
    assert.ok(served.result, "the bridge must keep serving after an upstream fault");
  });
});

test("a notification is never answered", async (t) => {
  await withFake(t, {}, async ({ dir, spawnBridge }) => {
    const bridge = spawnBridge();
    await authorize(bridge, dir);
    let spoke = false;
    bridge.proc.stdout.on("data", () => {
      spoke = true;
    });
    bridge.send({ jsonrpc: "2.0", method: "notifications/initialized", params: {} });
    await new Promise((r) => setTimeout(r, 500));
    assert.equal(spoke, false, "a message with no id must get no answer");
  });
});

// --- the machine daemon, the default path ----------------------------------

test("through the daemon: one login serves a second thin bridge with no browser trip", async (t) => {
  await withFake(t, { accessTtl: 3600 }, async ({ fake, dir, spawnBridge }) => {
    const first = spawnBridge(DAEMON);
    await authorize(first, dir);
    assert.ok(toolNames(await first.call("tools/list", 2)).includes("verstak_orient"));
    assert.ok(daemonPids(dir).length > 0, "the thin bridge did not raise a machine daemon");

    const second = spawnBridge(DAEMON);
    const answer = await second.call("initialize", 1, INIT_PARAMS);
    assert.ok(
      answer.result,
      `the second thin bridge was not served: ${JSON.stringify(answer.error)}`,
    );
    assert.equal(fake.state.counts.authorize, 1, "no second browser flow may be started");
  });
});

test("through the daemon: a thin bridge killed mid-login leaves the click a place to land", async (t) => {
  await withFake(t, {}, async ({ dir, spawnBridge }) => {
    const bridge = spawnBridge(DAEMON);
    const link = loginLinkIn((await bridge.call("initialize", 1, INIT_PARAMS)).error?.message);
    assert.ok(link, "expected a login link from the thin bridge");
    await bridge.stop(); // SIGKILL: the harness is gone, the daemon holds the login
    assert.equal(await portListening(portOf(link)), true, "the login died with the thin bridge");
    await click(link);
    await grantLanded(dir);
  });
});

// --- the command line -------------------------------------------------------

const cli = (args, extra = {}) =>
  spawnSync(process.execPath, [BRIDGE, ...args], {
    encoding: "utf8",
    env: bridgeEnv(extra),
    timeout: 60_000,
  });

test("--version and --help speak as verstak", () => {
  const v = cli(["--version"]);
  assert.equal(v.status, 0, v.stderr);
  assert.match(v.stdout, /^v\d+\.\d+\.\d+\+[0-9a-f]{8}/);
  const h = cli(["--help"]);
  assert.equal(h.status, 0, h.stderr);
  for (const name of [
    "verstak-bridge.mjs",
    "VERSTAK_BRIDGE_TOKEN",
    "VERSTAK_BRIDGE_URL",
    "mcp.verstak.ai",
  ])
    assert.ok(h.stdout.includes(name), `--help does not name ${name}`);
});

test("doctor answers against a server and exits 0", async (t) => {
  const fake = await startFakeServer();
  t.after(() => fake.stop());
  const dir = join(HOME, "doctor");
  mkdirSync(dir, { recursive: true });
  const r = await new Promise((resolve) => {
    const p = spawn(process.execPath, [BRIDGE, "doctor", fake.mcpUrl, "--auth-dir", dir], {
      env: bridgeEnv({}),
      stdio: ["ignore", "pipe", "pipe"],
    });
    let out = "";
    p.stdout.on("data", (c) => (out += c));
    p.stderr.on("data", (c) => (out += c));
    p.on("exit", (status) => resolve({ status, out }));
  });
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /^verstak doctor — v/m);
  assert.ok(r.out.includes(fake.mcpUrl), r.out);
});
