import { ID_PREFIX, SERVER_LOCALE } from "../delivery/index.ts";
import { withFieldsAsked } from "../shared/fields.ts";
import { namedFetch } from "../shared/http.ts";
import { lang } from "../shared/lang.ts";
import { scoped } from "../shared/scope.ts";
import { noteServerDate } from "./clock.ts";
import { CFG } from "./config.ts";
import {
  admit,
  answered as windowAnswered,
  DOWN_HTTP,
  downHttp,
  failed,
  NEVER_LEFT,
  retryAfterMs,
} from "./downwindow.ts";
import { closedUnder, DownError, errorCode, errorMessage, UpstreamError } from "./errors.ts";
import { boundByHandshake } from "./handshake.ts";
import { loginPublished } from "./oauth/flow.ts";
import { repeatable } from "./repeat.ts";
import { throughGate } from "./returngate.ts";
import { closeSession, noteOpened } from "./sessionclose.ts";
import { loadStore, saveServerCache } from "./store.ts";
import { debug, emit, log } from "./streams.ts";
import { heardListChanged, isListChanged } from "./toolsync.ts";
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
  // The bearer last associated with the session; refresh alone does not end it.
  sessionToken: null as string | null,
  // The last session id the server answered 404 for: it is gone there, closing it is moot (#9174).
  goneSession: null as string | null,
  // The session that came back through the machine's return gate: its further returns are its tail (#11413).
  returned: null as string | null,
}));

/**
 * A knock of this session's return through the machine's gate (returngate.ts, #11375). A
 * session that already came back through it does not wait again (#11413): its re-registration
 * or board read goes as the return's tail — still behind a probe out for the server. `opens` —
 * the knock opens a new session (an initialize): never a tail. The session the knock leaves is
 * marked as come back; the mark goes with the session — its next 404 or reopen drops it.
 */
export async function throughReturn<T>(knock: () => Promise<T>, opens = false): Promise<T> {
  const back = !opens && !!state.sessionId && state.returned === state.sessionId;
  const got = await throughGate(CFG.serverUrl, knock, back ? "tail" : "return");
  // A session a sibling's 404 already lost meanwhile earns no mark.
  state.returned = state.sessionId === state.goneSession ? null : state.sessionId;
  return got;
}

/**
 * Let go of the held session: forget it here and close it upstream (sessionclose.ts,
 * graph @nks/nks-dev, node #9174) — unless the server already said it is gone.
 */
export function letGo(why: string): Promise<void> {
  const id = state.sessionId;
  state.sessionId = null;
  state.sessionToken = null;
  state.returned = null; // the mark belongs to the return that earned it (#11413)
  if (!id || id === state.goneSession) return Promise.resolve();
  return closeSession({ id, token: bearer(), protocolVersion: state.protocolVersion }, why);
}

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

/** The account's key: a PAT outranks the store — with it the grant on disk is not read at all (#4267). */
export const bearer = (): string | null => CFG.pat ?? loadStore().tokens?.access_token ?? null;

// Whether the bridge left its own seat by word — standing.ts `seatLeft` over hold.ts `isParked`.
// That module imports this one, so the question is handed down at load, not imported up: the
// bundle stays without a cycle.
let seatLeft: () => boolean = () => false;
/** Names the judge of `seatLeft()` (standing.ts); until then no seat counts as left. */
export const seatLeftJudgedBy = (judge: () => boolean): void => {
  seatLeft = judge;
};

// One POST to the server for one JSON-RPC message. Forwards every message the
// server answers with (JSON body or a per-request SSE stream) via onMessage —
// except tools/list_changed, which goes to the harness whoever asked (toolsync.ts, #6819).
export async function post(msg: JsonRpcMessage, heard: (m: JsonRpcMessage) => void): Promise<void> {
  let answered = false;
  // The standing header this initialize is sent with (null — no initialize, or no standing
  // to bind), and the session as the answer's own id leaves it.
  let boundByHeader: string | null = null;
  let answerSession: string | null = null;
  // The server's sign on the standing header this initialize was sent with (handshake.ts,
  // #11403): the session is bound already, and the register is not replayed into it — only
  // while nothing moved since the send: the same standing, no seat beside (the header binds
  // the main seat alone), the seat not left by word (it returns by its own stand — standing.ts
  // `rebind`), and this answer's session still the held one.
  const noteBinding = (answer: JsonRpcMessage): void => {
    if (!boundByHeader || !boundByHandshake(answer)) return;
    if (standingHeader() !== boundByHeader || state.places.length > 0) return;
    if (seatLeft()) return;
    if (!answerSession || state.sessionId !== answerSession) return;
    state.standingSession = state.sessionId;
    log(
      `standing bound by the handshake header (${state.standing?.name ?? "unnamed"}) — no register replay`,
    );
  };
  const onMessage = (m: JsonRpcMessage): void => {
    if (msg.method && msg.id !== undefined && m.id === msg.id) answered = true;
    if (boundByHeader && msg.id !== undefined && m.id === msg.id) noteBinding(m);
    if (isListChanged(m)) heardListChanged(msg, emit);
    else heard(m);
  };
  const requireAnswer = (): void => {
    if (msg.method && msg.id !== undefined && !answered)
      throw new UpstreamError(
        "upstream ended the response without an answer",
        "network",
        null,
        UpstreamError.UNKNOWN,
        true,
      );
  };
  const unnamed = unnamedSeatRefusal(msg);
  if (unnamed) return void onMessage(unnamed);
  const headers: Record<string, string> = {
    "content-type": "application/json",
    accept: "application/json, text/event-stream",
  };
  // The api's prose language follows the session's (shared/lang.ts) where the layer names it.
  const locale = SERVER_LOCALE[lang()];
  if (locale) headers["accept-language"] = locale;
  const token = bearer();
  if (token) headers.authorization = `Bearer ${token}`;
  // No grant and a login already out: the server can only answer 401 — say it here.
  else if (loginPublished())
    throw new UpstreamError("unauthorized (login pending)", "auth", null, UpstreamError.NOT_SENT);
  // The machine's down window (downwindow.ts): while it stands this knock does not go
  // out — the call answers «not sent» at once, and a refused initialize lets nothing go; the
  // first knock after it is the one probe.
  const gate = admit();
  if (gate.refused) throw new DownError(null, UpstreamError.NOT_SENT, false, gate.waitMs);
  const isInit = msg?.method === "initialize";
  if (isInit && state.sessionId) {
    // An initialize opens a session and never rides one (the MCP spec): the id
    // of a session the server has closed makes every repeat of it a 404
    // unknown_session — observed for an hour at a time from a harness that
    // re-handshakes a live bridge. Forget it; the next call re-binds the standing.
    log(`initialize under a held session id (${state.sessionId}) — sent without it`);
    void letGo("the harness re-initialized");
  }
  // The session this request is sent under, kept apart from state: a sibling
  // call may be re-initializing while this one is in flight, and a 404 that
  // comes back after state.sessionId was cleared is still THIS session dying.
  const sentSession = state.sessionId;
  if (sentSession) headers["mcp-session-id"] = sentSession;
  if (state.protocolVersion) headers["mcp-protocol-version"] = state.protocolVersion;
  boundByHeader = isInit ? standingHeader() : null;
  if (boundByHeader) headers["x-nks-standing"] = boundByHeader;

  // The bridge asks for reply fields on every session open, re-opens too (shared/fields.ts).
  const sent = isInit ? { ...msg, params: withFieldsAsked(msg.params) } : msg;
  const send = (): Promise<Response> =>
    namedFetch(CFG.serverUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(sent),
      signal: AbortSignal.timeout(CFG.timeoutMs),
    });
  let res: Response;
  try {
    // The connection closed under the request before the reply (a pooled keep-alive
    // connection the server had closed, #6630): one repeat,
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
    // only the answer is missing, so the write may well have landed (NEVER_LEFT, downwindow.ts).
    const neverLeft = !timedOut && (tls || NEVER_LEFT.has(code ?? ""));
    // A timeout already spent the whole deadline: repeating it multiplies the
    // wait, so only a connection that failed outright is worth another knock —
    // and not a certificate refusal, which fails the same way every time.
    const outcome = neverLeft ? UpstreamError.NOT_SENT : UpstreamError.UNKNOWN;
    const again = !timedOut && !tls;
    // A connection shut under the request, or a timeout, does not say the server is down:
    // an idle keep-alive the server closed fails the same way (#6630), and the call's own
    // repeat serves it (#4664) — no window opens for it. The window opens when nothing
    // answered at all: a connection that was never established (below), the front line's
    // 502/503/504 (downwindow.ts).
    const down = neverLeft && !tls;
    if (!down) {
      gate.knock.release();
      throw new UpstreamError(`upstream unreachable: ${reason}`, "network", null, outcome, again);
    }
    throw new DownError(`upstream unreachable: ${reason}`, outcome, again, failed(gate.knock, 0));
  }
  noteServerDate(res);
  if (DOWN_HTTP.has(res.status)) {
    // The server's pause is read from the whole body; only the word keeps it short.
    const body = await res.text().catch(() => "");
    const pause = retryAfterMs(res.headers.get("retry-after"), body);
    throw downHttp(gate.knock, res.status, body.slice(0, 300), pause);
  }
  windowAnswered(gate.knock);

  if (res.status === 401) {
    const challenge = res.headers.get("www-authenticate") || "";
    const body = await res.text().catch(() => "");
    if (sentSession && /credential_mismatch/i.test(`${challenge} ${body}`))
      throw new UpstreamError(
        "session credential mismatch",
        "session",
        null,
        UpstreamError.NOT_SENT,
      );
    // The server answered, and its answer was a refusal: nothing was applied.
    throw new UpstreamError(challenge || "unauthorized", "auth", token, UpstreamError.NOT_SENT);
  }
  if (res.status === 404 && sentSession) {
    res.body?.cancel?.();
    state.goneSession = sentSession;
    // Lost again: its next knock is a return through the gate, not the last return's tail (#11413).
    if (state.returned === sentSession) state.returned = null;
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
    if (sid !== state.sessionId) noteOpened(sid);
    state.sessionId = sid; // a session id may ride any answer, including an empty one
    state.sessionToken = token;
    // A session opened with the header is bound at the handshake on a surface that
    // honours it — and silently unbound on one that predates it. The handshake's own
    // answer says which (handshake.ts, #11403): its sign (noteBinding, above) is the one
    // thing that spares the register replay. No sign — a silent surface, a seat beside
    // that the header does not bind — and the register is replayed as before: one
    // idempotent call per turnover buys attribution on both.
  }
  // Only the session this answer opened may be marked as bound by its sign.
  answerSession = state.sessionId;
  if (res.status === 202 || res.status === 204) {
    requireAnswer();
    return;
  }
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
      for await (const data of res.body ? sseEvents(res.body) : []) {
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
    requireAnswer();
    return;
  }
  const text = await res.text();
  if (text.trim()) {
    try {
      onMessage(JSON.parse(text) as JsonRpcMessage);
    } catch {
      throw new UpstreamError(`upstream sent unparseable JSON: ${text.slice(0, 200)}`, "http");
    }
  }
  requireAnswer();
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
      void letGo("re-initialize");
      const id = `${ID_PREFIX}bridge-reinit-${++state.reinitCounter}`;
      let result: JsonRpcMessage | null = null;
      // One probe per machine, the rest spread after it (returngate.ts, #11375).
      await throughReturn(
        () =>
          post({ jsonrpc: "2.0", id, method: "initialize", params: state.initParams }, (m) => {
            if (m.id === id) result = m;
          }),
        true,
      );
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
