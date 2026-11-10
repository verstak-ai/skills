// One short MCP session under the bridge's own key, outside any harness session: initialize,
// calls by name, close (graph @nks/nks-dev, nodes #9325, #9174). `prepare` reads the graph
// with it; the daemon's orchestrator reads the human's launcher descriptions (#5042).
import { namedFetch } from "./http.ts";

const TIMEOUT_MS = 8_000;
const PROTOCOL = "2025-06-18";

type Rpc = {
  id?: unknown;
  result?: { isError?: boolean; content?: { type?: string; text?: string }[] };
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

export interface McpSession {
  open: () => Promise<void>;
  /** The answer's text; a refusal (error or isError) throws. */
  call: (name: string, args: Record<string, unknown>) => Promise<string>;
  close: () => Promise<void>;
}

/** One MCP session against the server under the key: initialize, then calls by name. */
export function mcpSession(url: string, token: string, client = "bridge"): McpSession {
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
      const info = { name: client, version: "1" };
      await post({
        id: ++n,
        method: "initialize",
        params: { protocolVersion: PROTOCOL, capabilities: {}, clientInfo: info },
      });
      await post({ method: "notifications/initialized" });
    },
    call: async (name: string, args: Record<string, unknown>): Promise<string> => {
      const a = await post({ id: ++n, method: "tools/call", params: { name, arguments: args } });
      if (!a?.result || a.error || a.result.isError) throw new Error("refused");
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
