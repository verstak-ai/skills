#!/usr/bin/env node
// nks-bridge — stdio <-> streamable-HTTP MCP bridge with the full OAuth 2.1 flow.
//
// For harnesses that cannot (or should not) speak https+OAuth MCP themselves:
// the harness runs this file as an ordinary stdio MCP server, and the bridge
// carries every JSON-RPC message to a remote streamable-HTTP MCP server,
// handling discovery (RFC 9728 / RFC 8414), dynamic client registration,
// authorization-code + PKCE in the browser, token persistence and refresh.
//
// The design rule that justifies this bridge's existence: NEVER answer the
// harness with silence. Every forwarded request gets a deadline; any upstream
// failure — timeout, dead TCP, HTTP error, lost session — comes back to the
// harness as a JSON-RPC error for that request id. There are no long-lived
// upstream connections to go half-dead: each request is its own POST.
//
// Usage:
//   node nks-bridge.mjs <server-url> [--timeout <ms>] [--auth-dir <dir>]
//                       [--client-name <name>] [--no-browser] [--debug]
// Env (flags win): NKS_BRIDGE_TIMEOUT, NKS_BRIDGE_AUTH_DIR, NKS_BRIDGE_NO_BROWSER,
//                  NKS_BRIDGE_DEBUG, NKS_BRIDGE_SCOPE, NKS_BRIDGE_CLIENT_ID
//
// No dependencies. Node >= 20.

import { createServer } from "node:http";
import { createHash, randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { createInterface } from "node:readline";

const VERSION = "0.1.0";

// ---------------------------------------------------------------- arguments

function parseArgs(argv) {
  const cfg = {
    serverUrl: null,
    timeoutMs: Number(process.env.NKS_BRIDGE_TIMEOUT) || 120_000,
    authDir: process.env.NKS_BRIDGE_AUTH_DIR || join(homedir(), ".nks-bridge"),
    clientName: "nks-bridge",
    noBrowser: !!process.env.NKS_BRIDGE_NO_BROWSER,
    debug: !!process.env.NKS_BRIDGE_DEBUG,
    scope: process.env.NKS_BRIDGE_SCOPE || null,
    staticClientId: process.env.NKS_BRIDGE_CLIENT_ID || null,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--timeout") cfg.timeoutMs = Number(argv[++i]);
    else if (a === "--auth-dir") cfg.authDir = argv[++i];
    else if (a === "--client-name") cfg.clientName = argv[++i];
    else if (a === "--no-browser") cfg.noBrowser = true;
    else if (a === "--debug") cfg.debug = true;
    else if (a === "--version") { process.stdout.write(VERSION + "\n"); process.exit(0); }
    else if (!a.startsWith("--") && !cfg.serverUrl) cfg.serverUrl = a;
    else { log(`unknown argument: ${a}`); process.exit(2); }
  }
  if (!cfg.serverUrl) {
    log("usage: nks-bridge.mjs <server-url> [--timeout ms] [--auth-dir dir] [--no-browser] [--debug]");
    process.exit(2);
  }
  try { new URL(cfg.serverUrl); } catch {
    log(`not a URL: ${cfg.serverUrl}`);
    process.exit(2);
  }
  if (!Number.isFinite(cfg.timeoutMs) || cfg.timeoutMs < 1000) cfg.timeoutMs = 120_000;
  return cfg;
}

// ------------------------------------------------------------------ logging

function log(msg) {
  process.stderr.write(`[nks-bridge ${new Date().toISOString()}] ${msg}\n`);
}
let CFG = null;
function debug(msg) {
  if (CFG?.debug) log(`debug: ${msg}`);
}

// ---------------------------------------------------------------- utilities

const b64url = (buf) => Buffer.from(buf).toString("base64url");
const sha256 = (s) => createHash("sha256").update(s).digest();

class UpstreamError extends Error {
  constructor(message, kind) { super(message); this.kind = kind; } // "auth" | "session" | "http" | "network"
}

class TokenError extends Error {
  constructor(message, oauthError, status) { super(message); this.oauthError = oauthError; this.status = status; }
}
// Only these OAuth errors prove the grant itself is dead; anything else
// (network, 5xx, temporarily_unavailable) must NOT burn the refresh token
// or drag the user into the browser.
const DEFINITIVE_OAUTH_ERRORS = new Set(["invalid_grant", "invalid_token", "invalid_client", "unauthorized_client"]);

// ------------------------------------------------------------- token store

// One JSON file per server origin+path: { client, tokens, meta, updated_at }.
function storePath() {
  const u = new URL(CFG.serverUrl);
  const h = b64url(sha256(u.origin + u.pathname)).slice(0, 10);
  return join(CFG.authDir, `${u.hostname}_${h}.json`);
}
function loadStore() {
  try { return JSON.parse(readFileSync(storePath(), "utf8")); } catch { return {}; }
}
function saveStore(patch) {
  mkdirSync(CFG.authDir, { recursive: true, mode: 0o700 });
  const next = { ...loadStore(), ...patch, server_url: CFG.serverUrl, updated_at: new Date().toISOString() };
  writeFileSync(storePath(), JSON.stringify(next, null, 2), { mode: 0o600 });
  return next;
}

// -------------------------------------------------------------------- OAuth

async function fetchJson(url, opts = {}, timeoutMs = 15_000) {
  const res = await fetch(url, { ...opts, signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new Error(`${opts.method || "GET"} ${url} -> ${res.status}`);
  return res.json();
}

// RFC 9728: locate the protected-resource metadata, then the AS metadata.
async function discover(wwwAuthenticate) {
  const u = new URL(CFG.serverUrl);
  const candidates = [];
  const m = /resource_metadata="?([^",\s]+)"?/.exec(wwwAuthenticate || "");
  if (m) candidates.push(m[1]);
  const path = u.pathname === "/" ? "" : u.pathname;
  candidates.push(`${u.origin}/.well-known/oauth-protected-resource${path}`);
  candidates.push(`${u.origin}/.well-known/oauth-protected-resource`);

  let prm = null;
  for (const c of candidates) {
    try { prm = await fetchJson(c); debug(`protected-resource metadata: ${c}`); break; }
    catch (e) { debug(`no PRM at ${c}: ${e.message}`); }
  }
  const asBase = prm?.authorization_servers?.[0] || u.origin;
  const asUrl = new URL(asBase);
  const asPath = asUrl.pathname === "/" ? "" : asUrl.pathname;
  const asCandidates = [
    `${asUrl.origin}/.well-known/oauth-authorization-server${asPath}`,
    `${asUrl.origin}${asPath}/.well-known/oauth-authorization-server`,
    `${asUrl.origin}/.well-known/openid-configuration${asPath}`,
    `${asUrl.origin}${asPath}/.well-known/openid-configuration`,
  ];
  let as = null;
  for (const c of asCandidates) {
    try { as = await fetchJson(c); debug(`AS metadata: ${c}`); break; }
    catch (e) { debug(`no AS metadata at ${c}: ${e.message}`); }
  }
  if (!as?.authorization_endpoint || !as?.token_endpoint) {
    throw new Error(`OAuth discovery failed for ${CFG.serverUrl}: no authorization server metadata reachable`);
  }
  const scope = CFG.scope
    || (prm?.scopes_supported?.length ? prm.scopes_supported.join(" ") : null);
  const meta = { as, resource: prm?.resource || CFG.serverUrl, scope };
  saveStore({ meta });
  return meta;
}

// Stable per-origin loopback port, so the registered redirect_uri survives restarts.
function callbackPort() {
  const d = sha256(new URL(CFG.serverUrl).origin);
  return 42000 + (d[0] * 256 + d[1]) % 2000;
}

async function ensureClient(meta, redirectUri) {
  if (CFG.staticClientId) return { client_id: CFG.staticClientId };
  const stored = loadStore().client;
  if (stored?.client_id && stored?.redirect_uri === redirectUri) return stored;
  if (!meta.as.registration_endpoint) {
    throw new Error("server offers no dynamic client registration; pass NKS_BRIDGE_CLIENT_ID");
  }
  const reg = await fetchJson(meta.as.registration_endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      client_name: CFG.clientName,
      redirect_uris: [redirectUri],
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
    }),
  });
  const client = { client_id: reg.client_id, redirect_uri: redirectUri };
  saveStore({ client });
  log(`registered OAuth client ${reg.client_id}`);
  return client;
}

function openBrowser(url) {
  log(`authorize in the browser:\n  ${url}`);
  if (CFG.noBrowser) return;
  const [cmd, args] =
    process.platform === "darwin" ? ["open", [url]]
    : process.platform === "win32" ? ["cmd", ["/c", "start", "", url]]
    : ["xdg-open", [url]];
  try {
    spawn(cmd, args, { stdio: "ignore", detached: true }).unref();
  } catch (e) {
    log(`could not open a browser (${e.message}) — open the URL above manually`);
  }
}

// Wait for the loopback redirect carrying ?code=...&state=...
function waitForCallback(port, expectedState, timeoutMs = 300_000) {
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      const u = new URL(req.url, `http://127.0.0.1:${port}`);
      if (u.pathname !== "/callback") { res.writeHead(404); res.end(); return; }
      const code = u.searchParams.get("code");
      const state = u.searchParams.get("state");
      const err = u.searchParams.get("error");
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end(err
        ? `<h3>nks-bridge: authorization failed (${err})</h3>`
        : "<h3>nks-bridge: authenticated — you can close this tab.</h3>");
      clearTimeout(timer); server.close();
      if (err) return reject(new Error(`authorization refused: ${err}`));
      if (!code || state !== expectedState) return reject(new Error("callback missing code or state mismatch"));
      resolve(code);
    });
    const timer = setTimeout(() => {
      server.close();
      reject(new Error("timed out waiting for the browser authorization"));
    }, timeoutMs);
    server.on("error", reject);
    server.listen(port, "127.0.0.1");
  });
}

// If another bridge instance holds the callback port, it is probably running
// the same flow — wait for it to finish and reuse its tokens.
async function waitForSiblingAuth(deadlineMs = 120_000) {
  log("callback port busy — another bridge instance seems to be authorizing; waiting for it");
  const start = Date.now();
  while (Date.now() - start < deadlineMs) {
    await new Promise((r) => setTimeout(r, 2000));
    const s = loadStore();
    if (s.tokens?.access_token && (s.tokens.expires_at || Infinity) > Date.now()) return s.tokens;
  }
  throw new Error("callback port stayed busy and no tokens appeared — kill stale nks-bridge processes and retry");
}

async function tokenRequest(meta, params) {
  const res = await fetch(meta.as.token_endpoint, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params).toString(),
    signal: AbortSignal.timeout(30_000),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new TokenError(
      `token endpoint ${res.status}: ${body.error || ""} ${body.error_description || ""}`.trim(),
      body.error, res.status,
    );
  }
  const tokens = {
    access_token: body.access_token,
    refresh_token: body.refresh_token ?? loadStore().tokens?.refresh_token,
    expires_at: body.expires_in ? Date.now() + (body.expires_in - 60) * 1000 : null,
  };
  saveStore({ tokens });
  return tokens;
}

async function interactiveFlow(meta) {
  const port = callbackPort();
  const redirectUri = `http://127.0.0.1:${port}/callback`;
  const client = await ensureClient(meta, redirectUri);
  const verifier = b64url(randomBytes(48));
  const state = b64url(randomBytes(24));
  const authUrl = new URL(meta.as.authorization_endpoint);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", client.client_id);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("code_challenge", b64url(sha256(verifier)));
  authUrl.searchParams.set("code_challenge_method", "S256");
  authUrl.searchParams.set("resource", meta.resource);
  if (meta.scope) authUrl.searchParams.set("scope", meta.scope);

  const codePromise = waitForCallback(port, state);
  codePromise.catch(() => {}); // handled below; avoid unhandled-rejection noise
  // Give the listener a beat to fail on EADDRINUSE before opening the browser.
  await new Promise((r) => setTimeout(r, 50));
  openBrowser(authUrl.toString());
  let code;
  try {
    code = await codePromise;
  } catch (e) {
    if (String(e.message).includes("EADDRINUSE") || e.code === "EADDRINUSE") return waitForSiblingAuth();
    throw e;
  }
  log("authorization code received — exchanging for tokens");
  return tokenRequest(meta, {
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: client.client_id,
    code_verifier: verifier,
    resource: meta.resource,
  });
}

let authInFlight = null;
// Returns fresh-enough tokens. Order: cached access token -> silent refresh ->
// (only if allowed and the grant is definitively dead) the browser flow.
// opts.force ignores the cached access token (after an upstream 401);
// opts.interactive=false forbids the browser (background keepalive).
async function ensureAuth(wwwAuthenticate, opts = {}) {
  if (authInFlight) return authInFlight;
  const { force = false, interactive = true } = opts;
  authInFlight = (async () => {
    try {
      const s = loadStore();
      if (!force && s.tokens?.access_token && (s.tokens.expires_at || Infinity) > Date.now()) {
        return s.tokens;
      }
      const meta = s.meta?.as ? s.meta : await discover(wwwAuthenticate);
      if (s.tokens?.refresh_token) {
        try {
          debug("refreshing access token");
          return await tokenRequest(meta, {
            grant_type: "refresh_token",
            refresh_token: s.tokens.refresh_token,
            client_id: CFG.staticClientId || s.client?.client_id,
            resource: meta.resource,
          });
        } catch (e) {
          // A sibling bridge process may have rotated the refresh token under
          // us — its fresh tokens are on disk. Re-read before going further.
          const fresh = loadStore();
          if (fresh.tokens?.access_token
              && fresh.tokens.access_token !== s.tokens.access_token
              && (fresh.tokens.expires_at || Infinity) > Date.now()) {
            debug("a sibling refreshed the tokens — reusing them");
            return fresh.tokens;
          }
          const definitive = e instanceof TokenError && DEFINITIVE_OAUTH_ERRORS.has(e.oauthError);
          if (!definitive) {
            // Transient failure: keep the grant, do NOT open a browser.
            throw new Error(`token refresh failed transiently (${e.message}) — grant kept, will retry`);
          }
          log(`refresh grant is dead (${e.message})` + (interactive ? " — starting a fresh authorization" : ""));
          if (!interactive) throw new Error("authorization required (refresh grant dead, browser flow deferred)");
          return await interactiveFlow(meta);
        }
      }
      if (!interactive) throw new Error("authorization required (no tokens, browser flow deferred)");
      return await interactiveFlow(meta);
    } finally {
      authInFlight = null;
    }
  })();
  return authInFlight;
}

// Keep the grant alive even when the harness makes no MCP calls: refresh the
// access token shortly before expiry, rotating the refresh token with it, so
// an idle session never decays into a dead grant and a surprise browser trip.
const REFRESH_MARGIN_MS = 3 * 60_000;
function startTokenKeepalive() {
  const tick = () => {
    const t = loadStore().tokens;
    if (!t?.refresh_token) return;
    const expiresAt = t.expires_at || 0;
    if (expiresAt && expiresAt - Date.now() < REFRESH_MARGIN_MS) {
      ensureAuth(null, { force: true, interactive: false })
        .then(() => debug("background token refresh ok"))
        .catch((e) => log(`background token refresh: ${e.message}`));
    }
  };
  tick(); // an already-expired store refreshes on startup, before the first call
  setInterval(tick, 60_000).unref();
}

// -------------------------------------------------- streamable HTTP client

const state = {
  sessionId: null,
  protocolVersion: null,
  initParams: null, // params of the harness's initialize, for transparent replay
  reinitCounter: 0,
};

function emit(msg) {
  process.stdout.write(JSON.stringify(msg) + "\n");
}

async function* sseEvents(body) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let m;
    while ((m = /\r?\n\r?\n/.exec(buf)) !== null) {
      const raw = buf.slice(0, m.index);
      buf = buf.slice(m.index + m[0].length);
      const data = raw
        .split(/\r?\n/)
        .filter((l) => l.startsWith("data:"))
        .map((l) => l.slice(5).replace(/^ /, ""))
        .join("\n");
      if (data) yield data;
    }
  }
}

// One POST to the server for one JSON-RPC message. Forwards every message the
// server answers with (JSON body or a per-request SSE stream) via onMessage.
async function post(msg, onMessage) {
  const headers = {
    "content-type": "application/json",
    accept: "application/json, text/event-stream",
  };
  const tokens = loadStore().tokens;
  if (tokens?.access_token) headers.authorization = `Bearer ${tokens.access_token}`;
  if (state.sessionId) headers["mcp-session-id"] = state.sessionId;
  if (state.protocolVersion) headers["mcp-protocol-version"] = state.protocolVersion;

  let res;
  try {
    res = await fetch(CFG.serverUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(msg),
      signal: AbortSignal.timeout(CFG.timeoutMs),
    });
  } catch (e) {
    const reason = e.name === "TimeoutError" ? `no answer within ${CFG.timeoutMs}ms` : e.message;
    throw new UpstreamError(`upstream unreachable: ${reason}`, "network");
  }

  if (res.status === 401) {
    res.body?.cancel?.();
    throw new UpstreamError(res.headers.get("www-authenticate") || "unauthorized", "auth");
  }
  if (res.status === 404 && state.sessionId) {
    res.body?.cancel?.();
    throw new UpstreamError("session expired upstream", "session");
  }
  if (res.status === 202 || res.status === 204) return;
  if (!res.ok) {
    const text = (await res.text().catch(() => "")).slice(0, 300);
    throw new UpstreamError(`upstream HTTP ${res.status}: ${text}`, "http");
  }

  const sid = res.headers.get("mcp-session-id");
  if (sid) state.sessionId = sid;

  const ctype = res.headers.get("content-type") || "";
  if (ctype.includes("text/event-stream")) {
    try {
      for await (const data of sseEvents(res.body)) {
        try { onMessage(JSON.parse(data)); }
        catch { debug(`unparseable SSE data: ${data.slice(0, 120)}`); }
      }
    } catch (e) {
      throw new UpstreamError(`upstream stream broke mid-response: ${e.message}`, "network");
    }
    return;
  }
  const text = await res.text();
  if (!text.trim()) return;
  try { onMessage(JSON.parse(text)); }
  catch {
    throw new UpstreamError(`upstream sent unparseable JSON: ${text.slice(0, 200)}`, "http");
  }
}

// Transparent re-initialize after a lost session: replay the harness's own
// initialize params under a bridge-internal id, swallow the response.
let reinitInFlight = null;
async function reinitialize() {
  if (reinitInFlight) return reinitInFlight;
  reinitInFlight = (async () => {
    try {
      if (!state.initParams) throw new UpstreamError("session lost before initialize", "session");
      log("upstream session lost — re-initializing transparently");
      state.sessionId = null;
      const id = `nks-bridge-reinit-${++state.reinitCounter}`;
      let result = null;
      await post(
        { jsonrpc: "2.0", id, method: "initialize", params: state.initParams },
        (m) => { if (m.id === id) result = m; },
      );
      if (!result || result.error) {
        throw new UpstreamError(`re-initialize refused: ${JSON.stringify(result?.error ?? null)}`, "session");
      }
      if (result.result?.protocolVersion) state.protocolVersion = result.result.protocolVersion;
      await post({ jsonrpc: "2.0", method: "notifications/initialized" }, () => {});
      log(`session re-established (${state.sessionId || "no session id"})`);
    } finally {
      reinitInFlight = null;
    }
  })();
  return reinitInFlight;
}

function syntheticError(id, message) {
  return {
    jsonrpc: "2.0",
    id,
    error: {
      code: -32001,
      message: `nks-bridge: ${message}. The bridge stays up — retry the call; if this repeats, the server side needs attention.`,
    },
  };
}

// Deliver one harness message upstream, with one auth retry and one session
// retry. On final failure a request id is ALWAYS answered with an error.
async function deliver(msg) {
  const isInit = msg?.method === "initialize";
  if (isInit) state.initParams = msg.params;
  const hasId = msg?.id !== undefined && msg?.id !== null;
  let authRetried = false;
  let sessionRetried = false;

  const forward = (m) => {
    if (isInit && m.id === msg.id && m.result?.protocolVersion) {
      state.protocolVersion = m.result.protocolVersion;
    }
    emit(m);
  };

  for (;;) {
    try {
      await post(msg, forward);
      return;
    } catch (e) {
      if (e instanceof UpstreamError && e.kind === "auth" && !authRetried) {
        authRetried = true;
        try {
          await ensureAuth(e.message, { force: true });
          continue;
        } catch (authErr) {
          log(`authorization failed: ${authErr.message}`);
          if (hasId) emit(syntheticError(msg.id, `authorization failed: ${authErr.message}`));
          return;
        }
      }
      if (e instanceof UpstreamError && e.kind === "session" && !sessionRetried && !isInit) {
        sessionRetried = true;
        try {
          await reinitialize();
          continue;
        } catch (reErr) {
          if (hasId) emit(syntheticError(msg.id, `session recovery failed: ${reErr.message}`));
          return;
        }
      }
      const reason = e instanceof UpstreamError ? e.message : `bridge internal error: ${e.message}`;
      log(`request ${hasId ? msg.id : `(notification ${msg?.method})`} failed: ${reason}`);
      if (hasId) emit(syntheticError(msg.id, reason));
      return;
    }
  }
}

// ---------------------------------------------------------------- main loop

function main() {
  CFG = parseArgs(process.argv.slice(2));
  log(`v${VERSION} -> ${CFG.serverUrl} (timeout ${CFG.timeoutMs}ms, auth in ${storePath()})`);
  startTokenKeepalive();

  const rl = createInterface({ input: process.stdin, terminal: false });
  const pending = new Set();
  rl.on("line", (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    let msg;
    try { msg = JSON.parse(trimmed); } catch {
      log(`unparseable line from harness: ${trimmed.slice(0, 120)}`);
      return;
    }
    const p = deliver(msg).catch((e) => log(`unexpected: ${e.stack || e}`));
    pending.add(p);
    p.finally(() => pending.delete(p));
  });
  rl.on("close", () => {
    debug("stdin closed — harness is gone, exiting");
    Promise.allSettled([...pending]).then(() => process.exit(0));
  });
  process.on("SIGINT", () => process.exit(0));
  process.on("SIGTERM", () => process.exit(0));
  process.on("uncaughtException", (e) => log(`uncaught: ${e.stack || e}`));
  process.on("unhandledRejection", (e) => log(`unhandled rejection: ${e?.stack || e}`));
}

main();
