// Closing the bridge's own MCP session (graph @nks/nks-dev, node #9174; the session — #188).
// A Streamable HTTP client that is done with a session ends it with a DELETE carrying its
// Mcp-Session-Id; otherwise the server keeps it until its own deadline. The bridge does so
// when it leaves and when it replaces a session the server still holds; a session the server
// already answered 404 for is not closed again. One attempt, bounded: a leave never hangs on
// the network, and a refusal is only written down.
//
// The machine's down window holds closes too (downwindow.ts, #11375): while a window stands —
// or has lapsed and waits for its probe — a close is not sent but kept, one per server and
// session id, in this process's memory; it is never the window's probe. A close carries its
// server, credential and session scope: it is sent to its own server only, under its own scope's
// window and gate, whatever scope releases it (one daemon holds sessions of several servers).
// Every close takes the return gate's turn as an open — at most two knocks in flight
// (returngate.ts) — and when a knock of a server is answered and that server's window is gone,
// the closes kept for it go the same way; another server's stay. A 404 is done (the server already lost it), never retried; a close that meets
// the window again is kept again. A process that exits with closes kept says so: the server
// ends those sessions by its own term.
import { envName } from "../delivery/index.ts";
import { namedFetch } from "../shared/http.ts";
import { currentScope, runIn, type Scope, scoped } from "../shared/scope.ts";
import { CFG } from "./config.ts";
import { onAnswered } from "./downwindow.ts";
import { DownError, errorMessage } from "./errors.ts";
import { throughGate } from "./returngate.ts";
import { grantLog, loadDown, sleep } from "./store.ts";
import { log } from "./streams.ts";
import { throughWindow } from "./windowfetch.ts";

/** How long a DELETE may take before the bridge stops waiting for it. */
const CLOSE_MS = Number(process.env[envName("BRIDGE_SESSION_CLOSE_MS")]) || 3_000;

export interface HeldSession {
  id: string;
  token: string | null;
  protocolVersion: string | null;
}

/**
 * A close with what it was asked under: its server, and its session's scope — the scope's config
 * (the window, the gate) and the captured credential are the only ones it is ever sent under.
 */
interface Close {
  s: HeldSession;
  why: string;
  server: string;
  scope: Scope;
}

// Closes still on the wire, per bridge session: the leave waits for them (bounded by CLOSE_MS).
const flying = scoped(() => new Set<Promise<void>>());
// Closes the down window holds, for the whole process: one per server and session id.
const kept = new Map<string, Close>();
const keyOf = (c: Close): string => `${c.server}\n${c.s.id}`;

const note = (line: string): void => {
  log(line);
  grantLog(line);
};

/** A session id the server issued, said as its close is: open and close pair up by the log (#9174). */
export function noteOpened(id: string): void {
  note(`opened upstream session ${id}`);
}

/** Close a session upstream — on this session's server, under its scope; the leave awaits it. */
export function closeSession(s: HeldSession, why: string): Promise<void> {
  const p = gated({ s, why, server: CFG.serverUrl, scope: currentScope() });
  flying.add(p);
  void p.finally(() => flying.delete(p));
  return p;
}

/** The leave waits for its closes — no longer than a close may take and the gate's turn. */
export const closesSettled = (): Promise<unknown> =>
  Promise.race([Promise.allSettled([...flying]), sleep(2 * CLOSE_MS)]);

/**
 * Every close takes the gate's turn as an open, at most two knocks in flight (returngate.ts) —
 * in its own scope, whoever releases it. A scope that speaks to another server now (its config
 * gone or changed) sends nothing: the close is dropped and said not sent.
 */
const gated = (c: Close): Promise<void> =>
  runIn(c.scope, () => {
    if (CFG.serverUrl !== c.server)
      return Promise.resolve(unsent(c.s.id, "its session's scope is gone"));
    return throughGate(c.server, () => send(c), "open").catch((e: unknown) =>
      e instanceof DownError
        ? keep(c)
        : note(`closing upstream session ${c.s.id}: ${errorMessage(e)}`),
    );
  });

function keep(c: Close): void {
  if (!kept.size) process.once("exit", leftUnsent);
  kept.set(keyOf(c), c);
  note(`closing upstream session ${c.s.id} (${c.why}): kept — the server is down for the machine`);
}

const unsent = (id: string, why: string): void =>
  note(`closing upstream session ${id}: not sent (${why}) — the server ends it by its own term`);

function leftUnsent(): void {
  for (const c of kept.values()) unsent(c.s.id, "the process ended");
}

// A knock answered: the closes kept for THAT server go — only when its own window is gone —
// each in its own scope, at most two in flight. Another server's closes stay where they are.
onAnswered(() => {
  const server = CFG.serverUrl;
  const mine = [...kept.values()].filter((c) => c.server === server);
  if (!mine.length || loadDown()) return;
  for (const c of mine) kept.delete(keyOf(c));
  if (!kept.size) process.removeListener("exit", leftUnsent);
  for (const c of mine) void gated(c);
});

async function send(c: Close): Promise<void> {
  const { s, why } = c;
  // A window standing, or lapsed and waiting for its probe: the close is no knock of its own.
  if (loadDown()) return keep(c);
  const headers: Record<string, string> = { "mcp-session-id": s.id };
  if (s.token) headers.authorization = `Bearer ${s.token}`;
  if (s.protocolVersion) headers["mcp-protocol-version"] = s.protocolVersion;
  let outcome: string;
  try {
    const res = await throughWindow(() =>
      namedFetch(c.server, {
        method: "DELETE",
        headers,
        signal: AbortSignal.timeout(CLOSE_MS),
      }),
    );
    res.body?.cancel?.().catch(() => {});
    outcome = `HTTP ${res.status}`;
  } catch (e) {
    if (e instanceof DownError) return keep(c);
    const timedOut = (e as { name?: string })?.name === "TimeoutError";
    outcome = timedOut ? `no answer within ${CLOSE_MS}ms` : errorMessage(e);
  }
  note(`closing upstream session ${s.id} (${why}): ${outcome}`);
}
