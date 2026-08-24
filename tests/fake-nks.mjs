// A local stand-in for an OAuth-protected streamable-HTTP MCP server.
//
// It exists so the bridge's whole authorization leg — discovery, dynamic client
// registration, PKCE, the loopback redirect, token exchange, refresh rotation —
// can be watched end to end without a browser and without the product instance.
// The one leg it cannot stand in for is a human deciding to consent; here the
// test plays that part by fetching the authorize URL itself.

import { createServer } from "node:http";
import { createHash, randomBytes } from "node:crypto";

const b64url = (b) => Buffer.from(b).toString("base64url");
const sha256 = (s) => createHash("sha256").update(s).digest();
const token = (p) => `${p}-${b64url(randomBytes(9))}`;

export async function startFakeNks(opts = {}) {
  const st = {
    accessTtl: opts.accessTtl ?? 3600,
    clients: new Map(),
    codes: new Map(),
    access: null,
    refresh: null,
    sessions: new Set(),
    dead: new Set(),
    // faults the test switches on through /control
    refreshStatus: null,   // e.g. 503 (transient) or 400 (definitive)
    refreshError: null,
    mcpStatus: null,       // force an HTTP status on /mcp
    counts: { register: 0, authorize: 0, code_exchange: 0, refresh: 0, mcp: 0 },
  };

  const body = (req) => new Promise((res, rej) => {
    let b = ""; req.on("data", (c) => (b += c)); req.on("end", () => res(b)); req.on("error", rej);
  });
  const json = (res, code, obj, headers = {}) => {
    res.writeHead(code, { "content-type": "application/json", ...headers });
    res.end(JSON.stringify(obj));
  };

  let base = null;
  const server = createServer(async (req, res) => {
    const u = new URL(req.url, base);
    const p = u.pathname;

    if (p === "/control") {
      const patch = JSON.parse((await body(req)) || "{}");
      if (patch.kill_session) { for (const s of st.sessions) st.dead.add(s); st.sessions.clear(); }
      for (const k of ["refreshStatus", "refreshError", "mcpStatus", "accessTtl"]) {
        if (k in patch) st[k] = patch[k];
      }
      if (patch.revoke_access) st.access = null;
      return json(res, 200, { counts: st.counts });
    }

    if (p === "/.well-known/oauth-protected-resource/mcp") {
      return json(res, 200, {
        resource: `${base}/mcp`,
        authorization_servers: [base],
        scopes_supported: ["nks"],
      });
    }
    if (p === "/.well-known/oauth-authorization-server") {
      return json(res, 200, {
        issuer: base,
        authorization_endpoint: `${base}/authorize`,
        token_endpoint: `${base}/token`,
        registration_endpoint: `${base}/register`,
        code_challenge_methods_supported: ["S256"],
      });
    }

    if (p === "/register" && req.method === "POST") {
      st.counts.register++;
      const reg = JSON.parse(await body(req));
      const id = token("client");
      st.clients.set(id, reg);
      return json(res, 201, { client_id: id, redirect_uris: reg.redirect_uris });
    }

    // The consent screen a human would click through — answered straight away.
    if (p === "/authorize") {
      st.counts.authorize++;
      const q = u.searchParams;
      if (!st.clients.has(q.get("client_id"))) return json(res, 400, { error: "unknown client" });
      const code = token("code");
      st.codes.set(code, {
        challenge: q.get("code_challenge"),
        redirect_uri: q.get("redirect_uri"),
        client_id: q.get("client_id"),
      });
      const back = new URL(q.get("redirect_uri"));
      back.searchParams.set("code", code);
      back.searchParams.set("state", q.get("state"));
      res.writeHead(302, { location: back.toString() });
      return res.end();
    }

    if (p === "/token" && req.method === "POST") {
      const f = new URLSearchParams(await body(req));
      if (f.get("grant_type") === "authorization_code") {
        st.counts.code_exchange++;
        const c = st.codes.get(f.get("code"));
        if (!c) return json(res, 400, { error: "invalid_grant", error_description: "unknown code" });
        st.codes.delete(f.get("code"));
        if (b64url(sha256(f.get("code_verifier") || "")) !== c.challenge) {
          return json(res, 400, { error: "invalid_grant", error_description: "PKCE mismatch" });
        }
        if (f.get("redirect_uri") !== c.redirect_uri) {
          return json(res, 400, { error: "invalid_grant", error_description: "redirect_uri mismatch" });
        }
        st.access = token("access"); st.refresh = token("refresh");
        return json(res, 200, { access_token: st.access, refresh_token: st.refresh, expires_in: st.accessTtl, token_type: "Bearer" });
      }
      if (f.get("grant_type") === "refresh_token") {
        st.counts.refresh++;
        if (st.refreshStatus) {
          return json(res, st.refreshStatus, { error: st.refreshError || "server_error" });
        }
        if (f.get("refresh_token") !== st.refresh) {
          return json(res, 400, { error: "invalid_grant", error_description: "stale refresh token" });
        }
        st.access = token("access"); st.refresh = token("refresh"); // rotation
        return json(res, 200, { access_token: st.access, refresh_token: st.refresh, expires_in: st.accessTtl, token_type: "Bearer" });
      }
      return json(res, 400, { error: "unsupported_grant_type" });
    }

    if (p === "/mcp" && req.method === "POST") {
      st.counts.mcp++;
      if (st.mcpStatus) { res.writeHead(st.mcpStatus); return res.end("forced fault"); }
      const bearer = (req.headers.authorization || "").replace(/^Bearer /, "");
      if (!st.access || bearer !== st.access) {
        return json(res, 401, { error: "unauthorized" }, {
          "www-authenticate": `Bearer resource_metadata="${base}/.well-known/oauth-protected-resource/mcp"`,
        });
      }
      const sid = req.headers["mcp-session-id"];
      const msg = JSON.parse(await body(req));
      if (sid && st.dead.has(sid)) { res.writeHead(404); return res.end("session expired"); }

      if (msg.method === "initialize") {
        const fresh = token("session");
        st.sessions.add(fresh);
        return json(res, 200, {
          jsonrpc: "2.0", id: msg.id,
          result: { protocolVersion: "2025-06-18", capabilities: {}, serverInfo: { name: "fake-nks", version: "0" } },
        }, { "mcp-session-id": fresh });
      }
      if (msg.id === undefined || msg.id === null) { res.writeHead(202); return res.end(); }
      if (msg.method === "tools/list") {
        return json(res, 200, { jsonrpc: "2.0", id: msg.id, result: { tools: [{ name: "nks_orient" }] } });
      }
      return json(res, 200, { jsonrpc: "2.0", id: msg.id, result: { ok: true, method: msg.method } });
    }

    res.writeHead(404); res.end();
  });

  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  base = `http://127.0.0.1:${server.address().port}`;
  return {
    base,
    mcpUrl: `${base}/mcp`,
    state: st,
    control: (patch) => fetch(`${base}/control`, { method: "POST", body: JSON.stringify(patch) }).then((r) => r.json()),
    stop: () => new Promise((r) => server.close(r)),
  };
}
