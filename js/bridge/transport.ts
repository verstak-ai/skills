import { ID_PREFIX } from "../delivery/index.ts";
import { withFieldsAsked } from "../shared/fields.ts";
import { lang } from "../shared/lang.ts";
import { scoped } from "../shared/scope.ts";
import { noteServerDate } from "./clock.ts";
import { CFG } from "./config.ts";
import { closedUnder, errorCode, errorMessage, UpstreamError } from "./errors.ts";
import { loginPublished } from "./oauth/flow.ts";
import { repeatable } from "./repeat.ts";
import { loadStore, saveServerCache } from "./store.ts";
import { debug, log } from "./streams.ts";
import { type JsonRpcMessage } from "./types.ts";
import { unnamedSeatRefusal } from "./unnamed.ts";

// -------------------------------------------------- streamable HTTP client

export interface Standing {
  realm: string;
  karta: string | number;
  name?: string;
}

// One server session per bridge session (shared/scope.ts): the machine daemon has many.
export const state = scoped(() => ({
  sessionId: null as string | null,
  protocolVersion: null as string | null,
  initParams: null as unknown, // params of the harness's initialize, for transparent replay
  reinitCounter: 0,
  // The standing this session registered, and the session it was confirmed in.
  // Why the bridge owns re-registration, what was observed to go wrong, and the
  // falsifier that closes it: graph @nks/nks-dev, nodes #3919 (the breakdown),
  // #3454 (the falsifier), #3800 (the header form the surface binds with).
  // The server correlates a writer BY THE MCP SESSION ID (its holder's word):
  // a new session is a different writer, and the surface's own self-repair has
  // nothing to repeat there, because its memory is keyed by that same id and is
  // collected with it. Sessions die silently in three ways — idle past the
  // threshold, eviction by the session ceiling, transport close — and the
  // bridge is the ONLY party that sees the change and still remembers the name
  // the agent derived for itself. So re-registering is the bridge's duty, and
  // it hangs on the change of id, never on a timer.
  standing: null as Standing | null, // {realm, karta, name} of the last register that succeeded
  // Places in OTHER graphs on the same channel (#5838): register on the channel
  // in another graph adds a place, and a write is signed by the place of its
  // own graph. `standing` stays the place the socket was taken for; these ride
  // it and are replayed with it after every session turnover.
  places: [] as Standing[],
  standingSession: null as string | null, // the session id that registration is known to hold in
  // The access token the session was opened with. A session is opened BY a
  // credential and dies with it (the surface's own word): once the token in the
  // store is no longer the one this session was opened with — expired, refreshed
  // after a 401, rotated by a sibling bridge — the old id is a dead letter, and a
  // server that opens a fresh session on it silently runs the call unattributed
  // before we learn the new id. So a changed token means: re-open first.
  sessionToken: null as string | null,
}));

// The three-token form the surface binds a session with at initialize
// ("realm karta name"): a session opened this way is attributed before its
// first tool call, and re-initialising re-binds by itself. A name with spaces
// or no name at all cannot ride the header — those keep the register replay.
export function standingHeader(): string | null {
  const s = state.standing;
  if (!s?.realm || s.karta == null || !s.name) return null;
  const h = `${s.realm} ${s.karta} ${s.name}`;
  // An HTTP header value is bytes, not text: fetch refuses anything outside
  // printable ASCII, and a name with whitespace would not split into three.
  if (!/^[\x21-\x7e]+ [\x21-\x7e]+ [\x21-\x7e]+$/.test(h)) return null;
  return h;
}

export const currentAccessToken = (): string | null =>
  CFG.pat ?? loadStore().tokens?.access_token ?? null;

async function* sseEvents(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let m: RegExpExecArray | null;
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

// A certificate the machine does not trust fails the TLS handshake before the
// request leaves. Node puts the code in cause.code, Bun in code (both observed
// for DEPTH_ZERO_SELF_SIGNED_CERT; the rest are Node's documented certificate
// codes — graph @nks/nks-dev, node #4716).
const TLS_REFUSALS = new Set([
  "DEPTH_ZERO_SELF_SIGNED_CERT",
  "SELF_SIGNED_CERT_IN_CHAIN",
  "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
  "UNABLE_TO_GET_ISSUER_CERT",
  "UNABLE_TO_GET_ISSUER_CERT_LOCALLY",
  "CERT_HAS_EXPIRED",
  "CERT_NOT_YET_VALID",
  "CERT_UNTRUSTED",
  "CERT_REVOKED",
  "ERR_TLS_CERT_ALTNAME_INVALID",
]);

// One POST to the server for one JSON-RPC message. Forwards every message the
// server answers with (JSON body or a per-request SSE stream) via onMessage.
export async function post(
  msg: JsonRpcMessage,
  onMessage: (m: JsonRpcMessage) => void,
): Promise<void> {
  const unnamed = unnamedSeatRefusal(msg);
  if (unnamed) return void onMessage(unnamed);
  const headers: Record<string, string> = {
    "content-type": "application/json",
    accept: "application/json, text/event-stream",
  };
  // The api's prose language follows an English bridge (shared/lang.ts); otherwise the server's default.
  if (lang() === "en") headers["accept-language"] = "en";
  // A PAT outranks the store: with it the grant on disk is not read at all (#4267).
  const token = CFG.pat ?? loadStore().tokens?.access_token ?? null;
  if (token) headers.authorization = `Bearer ${token}`;
  // No grant and a login already out: the server can only answer 401 — say it here.
  else if (loginPublished())
    throw new UpstreamError("unauthorized (login pending)", "auth", null, UpstreamError.NOT_SENT);
  const isInit = msg?.method === "initialize";
  if (isInit && state.sessionId) {
    // An initialize opens a session and never rides one (the MCP spec): the id
    // of a session the server has closed makes every repeat of it a 404
    // unknown_session — observed for an hour at a time from a harness that
    // re-handshakes a live bridge. Forget it; the next call re-binds the standing.
    log(`initialize under a held session id (${state.sessionId}) — sent without it`);
    state.sessionId = null;
    state.sessionToken = null;
  }
  // The session this request is sent under, kept apart from state: a sibling
  // call may be re-initializing while this one is in flight, and a 404 that
  // comes back after state.sessionId was cleared is still THIS session dying.
  const sentSession = state.sessionId;
  if (sentSession) headers["mcp-session-id"] = sentSession;
  if (state.protocolVersion) headers["mcp-protocol-version"] = state.protocolVersion;
  const boundByHeader = isInit ? standingHeader() : null;
  if (boundByHeader) headers["x-nks-standing"] = boundByHeader;

  // The bridge asks for reply fields on every session open, re-opens too (shared/fields.ts).
  const sent = isInit ? { ...msg, params: withFieldsAsked(msg.params) } : msg;
  const send = (): Promise<Response> =>
    fetch(CFG.serverUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(sent),
      signal: AbortSignal.timeout(CFG.timeoutMs),
    });
  let res: Response;
  try {
    // The connection closed under the request before the reply (#6630): one repeat,
    // only for a request whose repeat applies nothing twice (repeat.ts).
    res = await send().catch((e: unknown) => {
      if (!closedUnder(e) || !repeatable(msg)) throw e;
      log(
        `upstream connection closed under ${msg?.method} before the answer — sending it once more`,
      );
      return send();
    });
  } catch (e) {
    const err = e as { name?: string };
    const timedOut = err.name === "TimeoutError";
    // Node says only «fetch failed» and keeps the cause in cause.code; the code
    // is what tells a dead DNS from a refused port from a reset, so it rides the text.
    const code = errorCode(e);
    const message = errorMessage(e);
    const tls = TLS_REFUSALS.has(code ?? "");
    const reason = timedOut
      ? `no answer within ${CFG.timeoutMs}ms`
      : (code && !message.includes(code) ? `${message} (${code})` : message) +
        (tls
          ? " — the server's certificate is not trusted on this machine (a corporate TLS " +
            "inspection?); give the bridge the organisation's CA in NODE_EXTRA_CA_CERTS"
          : "");
    // A connection that was never established carries nothing: the server never
    // saw the call. A timeout is the opposite — the request was on the wire and
    // only the answer is missing, so the write may well have landed. Bun (the
    // runtime OpenCode runs the bridge on) names both a refused port and an
    // unknown host ConnectionRefused.
    const neverLeft =
      !timedOut &&
      (tls ||
        [
          "ECONNREFUSED",
          "ENOTFOUND",
          "EAI_AGAIN",
          "ERR_SOCKET_BAD_PORT",
          "ConnectionRefused",
        ].includes(code ?? ""));
    // A timeout already spent the whole deadline: repeating it multiplies the
    // wait, so only a connection that failed outright is worth another knock —
    // and not a certificate refusal, which fails the same way every time.
    throw new UpstreamError(
      `upstream unreachable: ${reason}`,
      "network",
      null,
      neverLeft ? UpstreamError.NOT_SENT : UpstreamError.UNKNOWN,
      !timedOut && !tls,
    );
  }
  noteServerDate(res);

  if (res.status === 401) {
    res.body?.cancel?.();
    // The server answered, and its answer was a refusal: nothing was applied.
    throw new UpstreamError(
      res.headers.get("www-authenticate") || "unauthorized",
      "auth",
      token,
      UpstreamError.NOT_SENT,
    );
  }
  if (res.status === 404 && sentSession) {
    res.body?.cancel?.();
    throw new UpstreamError("session expired upstream", "session", null, UpstreamError.NOT_SENT);
  }
  const sid = res.headers.get("mcp-session-id");
  if (sid) {
    if (sid !== state.sessionId && !isInit) {
      // The server turned the session over UNDER this call: whatever it just did
      // ran in a session nobody registered. The reply below carries the mark; the
      // next call re-binds before it goes out.
      log(
        `upstream replaced the session mid-call (${state.sessionId} -> ${sid}) — this call may have gone unattributed`,
      );
    }
    state.sessionId = sid; // a session id may ride any answer, including an empty one
    state.sessionToken = token;
    // A session opened with the header is bound at the handshake on a surface
    // that honours it — and silently unbound on one that predates it, and the
    // handshake does not say which. So the register is replayed regardless:
    // one idempotent call per turnover buys attribution on both.
  }
  if (res.status === 202 || res.status === 204) return;
  if (!res.ok) {
    const text = (await res.text().catch(() => "")).slice(0, 300);
    // A 4xx is the server judging the request and refusing it — nothing ran. A
    // 5xx is the server falling over, and it may fall AFTER applying: for the
    // caller that is indistinguishable from applied, so say so.
    throw new UpstreamError(
      `upstream HTTP ${res.status}: ${text}`,
      "http",
      null,
      res.status < 500 ? UpstreamError.NOT_SENT : UpstreamError.UNKNOWN,
    );
  }

  const ctype = res.headers.get("content-type") || "";
  if (ctype.includes("text/event-stream")) {
    try {
      if (!res.body) return;
      for await (const data of sseEvents(res.body)) {
        try {
          onMessage(JSON.parse(data) as JsonRpcMessage);
        } catch {
          debug(`unparseable SSE data: ${data.slice(0, 120)}`);
        }
      }
    } catch (e) {
      throw new UpstreamError(
        `upstream stream broke mid-response: ${errorMessage(e)}`,
        "network",
        null,
        UpstreamError.UNKNOWN,
        true,
      );
    }
    return;
  }
  const text = await res.text();
  if (!text.trim()) return;
  try {
    onMessage(JSON.parse(text) as JsonRpcMessage);
  } catch {
    throw new UpstreamError(`upstream sent unparseable JSON: ${text.slice(0, 200)}`, "http");
  }
}

// Transparent re-initialize after a lost session: replay the harness's own
// initialize params under a bridge-internal id, swallow the response.
const reinit = scoped(() => ({ inFlight: null as Promise<void> | null }));
const reinitHooks: (() => void | Promise<void>)[] = [];
/** What to do after a transparent session re-open (tool list recheck, #5405). */
export const onReinitialized = (hook: () => void | Promise<void>): void => {
  reinitHooks.push(hook);
};

export async function reinitialize(): Promise<void> {
  if (reinit.inFlight) return reinit.inFlight;
  reinit.inFlight = (async () => {
    try {
      if (!state.initParams) throw new UpstreamError("session lost before initialize", "session");
      log("upstream session lost — re-initializing transparently");
      state.sessionId = null;
      state.sessionToken = null;
      const id = `${ID_PREFIX}bridge-reinit-${++state.reinitCounter}`;
      let result: JsonRpcMessage | null = null;
      await post({ jsonrpc: "2.0", id, method: "initialize", params: state.initParams }, (m) => {
        if (m.id === id) result = m;
      });
      const got = result as JsonRpcMessage | null;
      if (!got || got.error) {
        throw new UpstreamError(
          `re-initialize refused: ${JSON.stringify(got?.error ?? null)}`,
          "session",
        );
      }
      if (got.result?.protocolVersion) state.protocolVersion = got.result.protocolVersion;
      // The answer that was swallowed here used to leave the handshake cache
      // (deliver.ts, #4790) quoting whatever the harness's own initialize saw
      // last — stale the moment the server ships a new version between the two.
      if (got.result) saveServerCache({ init: got.result });
      await post({ jsonrpc: "2.0", method: "notifications/initialized" }, () => {});
      log(`session re-established (${state.sessionId || "no session id"})`);
      for (const hook of reinitHooks) void hook();
    } finally {
      reinit.inFlight = null;
    }
  })();
  return reinit.inFlight;
}
