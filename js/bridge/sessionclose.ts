// Closing the bridge's own MCP session (graph @nks/nks-dev, node #9174; the session — #188).
// A Streamable HTTP client that is done with a session ends it with a DELETE carrying its
// Mcp-Session-Id; otherwise the server keeps it until its own deadline. The bridge does so
// when it leaves and when it replaces a session the server still holds; a session the server
// already answered 404 for is not closed again. One attempt, bounded: a leave never hangs on
// the network, and a refusal is only written down.
import { envName } from "../delivery/index.ts";
import { scoped } from "../shared/scope.ts";
import { CFG } from "./config.ts";
import { errorMessage } from "./errors.ts";
import { grantLog } from "./store.ts";
import { log } from "./streams.ts";

/** How long a DELETE may take before the bridge stops waiting for it. */
const CLOSE_MS = Number(process.env[envName("BRIDGE_SESSION_CLOSE_MS")]) || 3_000;

export interface HeldSession {
  id: string;
  token: string | null;
  protocolVersion: string | null;
}

// Closes still on the wire, per bridge session: the leave waits for them (bounded by CLOSE_MS).
const flying = scoped(() => new Set<Promise<void>>());

/** Close a session upstream; the leave awaits it through closesSettled. */
export function closeSession(s: HeldSession, why: string): Promise<void> {
  const p = send(s, why);
  flying.add(p);
  void p.finally(() => flying.delete(p));
  return p;
}

export const closesSettled = (): Promise<unknown> => Promise.allSettled([...flying]);

async function send(s: HeldSession, why: string): Promise<void> {
  const headers: Record<string, string> = { "mcp-session-id": s.id };
  if (s.token) headers.authorization = `Bearer ${s.token}`;
  if (s.protocolVersion) headers["mcp-protocol-version"] = s.protocolVersion;
  let outcome: string;
  try {
    const res = await fetch(CFG.serverUrl, {
      method: "DELETE",
      headers,
      signal: AbortSignal.timeout(CLOSE_MS),
    });
    res.body?.cancel?.().catch(() => {});
    outcome = `HTTP ${res.status}`;
  } catch (e) {
    const timedOut = (e as { name?: string })?.name === "TimeoutError";
    outcome = timedOut ? `no answer within ${CLOSE_MS}ms` : errorMessage(e);
  }
  const line = `closing upstream session ${s.id} (${why}): ${outcome}`;
  log(line);
  grantLog(line);
}
