// The holon and the agent role of `prepare` read from the graph (graph @nks/nks-dev, node #9325,
// item 2): the holon whose repository attribute names origin, and its steward. The way is the
// bridge's own to its server — the personal token or the grant on disk, refreshed without a
// browser (stopapi.ts) — and two search calls over MCP. No key, no network, no single answer —
// nothing is derived and the model's way stays, as before.
import { CFG, readArgs, setConfig } from "../bridge/config.ts";
import { tool } from "../delivery/index.ts";
import { namedFetch } from "../shared/http.ts";
import { keyFor } from "./stopapi.ts";

const TIMEOUT_MS = 8_000;
const PROTOCOL = "2025-06-18";

type Rpc = {
  id?: unknown;
  result?: { content?: { type?: string; text?: string }[] };
  error?: unknown;
};

/** The answers a POST carried: one JSON body or the data lines of a stream. */
function answers(text: string): Rpc[] {
  const t = text.trim();
  if (t.startsWith("{")) return [JSON.parse(t) as Rpc];
  return t
    .split(/\r?\n/)
    .filter((l) => l.startsWith("data:"))
    .flatMap((l) => {
      try {
        return [JSON.parse(l.slice(5)) as Rpc];
      } catch {
        return [];
      }
    });
}

/** One MCP session against the server under the key: initialize, then calls by name. */
function session(url: string, token: string) {
  let sid: string | null = null;
  let n = 0;
  const post = async (body: Record<string, unknown>): Promise<Rpc | null> => {
    const res = await namedFetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
        authorization: `Bearer ${token}`,
        "mcp-protocol-version": PROTOCOL,
        ...(sid ? { "mcp-session-id": sid } : {}),
      },
      body: JSON.stringify({ jsonrpc: "2.0", ...body }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(String(res.status));
    sid = res.headers.get("mcp-session-id") ?? sid;
    if (!("id" in body)) return null;
    return answers(await res.text()).find((a) => a.id === body.id) ?? null;
  };
  return {
    open: async (): Promise<void> => {
      const info = { name: "prepare", version: "1" };
      await post({
        id: ++n,
        method: "initialize",
        params: { protocolVersion: PROTOCOL, capabilities: {}, clientInfo: info },
      });
      await post({ method: "notifications/initialized" });
    },
    call: async (name: string, args: Record<string, unknown>): Promise<string> => {
      const a = await post({ id: ++n, method: "tools/call", params: { name, arguments: args } });
      if (!a?.result || a.error) throw new Error("refused");
      return (a.result.content ?? []).map((c) => c.text ?? "").join("\n");
    },
    /** The session ended on the server too (graph @nks/nks-dev, node #9174); a refusal — no matter. */
    close: async (): Promise<void> => {
      if (!sid) return;
      const headers = { authorization: `Bearer ${token}`, "mcp-session-id": sid };
      await namedFetch(url, { method: "DELETE", headers, signal: AbortSignal.timeout(TIMEOUT_MS) })
        .then((r) => r.body?.cancel())
        .catch(() => {});
    },
  };
}

/** The one node of the type a search names; none or several — null. */
const single = (text: string, type: string): string | null => {
  const ids = [
    ...new Set([...text.matchAll(new RegExp(`\\(#(\\d+), ${type}\\b`, "g"))].map((m) => m[1])),
  ];
  return ids.length === 1 ? (ids[0] as string) : null;
};

export interface Derived {
  holon?: string;
  agent_role?: string;
}

/** What the graph says of the repository; the holon given — only its steward is asked. */
export async function fromGraph(
  graph: string,
  repository: string,
  holon?: string,
): Promise<Derived> {
  try {
    setConfig(readArgs([]));
    const key = await keyFor(CFG.serverUrl);
    if (!("token" in key)) return {};
    const s = session(CFG.serverUrl, key.token);
    try {
      await s.open();
      const search = (args: Record<string, string>) =>
        s.call(tool("search"), { realm: graph, q: "", ...args });
      const found =
        holon ??
        single(
          await search({ node_type: "holon", attrs_filter: `repository:${repository}` }),
          "holon",
        );
      if (!found) return {};
      const role = single(await search({ node_type: "karta", steward_of: found }), "karta");
      return { ...(holon ? {} : { holon: found }), ...(role ? { agent_role: role } : {}) };
    } finally {
      await s.close();
    }
  } catch {
    return {};
  }
}
