import { BRIDGE_NAME, envName, ID_PREFIX, NOTICE_MARK, tool } from "../delivery/index.ts";
import { OWN_CLIENTS } from "../shared/clients.ts";
import { scoped } from "../shared/scope.ts";
import {
  absorbChannelReply,
  absorbCloseReply,
  absorbRevokeReply,
  expectOwnRevoke,
  settleOwnRevoke,
} from "./absorb.ts";
import { refusedAudience } from "./audience.ts";
import { ensureAuth } from "./auth.ts";
import { BUILD } from "./build.ts";
import { crossPlaceRefusal, resolveAgainstLed, serialized } from "./call.ts";
import { noteCaseEntry } from "./caseexit.ts";
import { deafRefusal } from "./deaf.ts";
import {
  AuthPending,
  errorMessage,
  HoldOffError,
  type Outcome,
  TokenRefused,
  UpstreamError,
} from "./errors.ts";
import { evictedRefusal } from "./evicted.ts";
import { forHarness, structuredOf } from "./fields.ts";
import { rawSeatRefusal, seatRealm } from "./hearing.ts";
import { localLeave } from "./leave.ts";
import { annotateToolList } from "./moment.ts";
import { narrowToolList, outsideSetRefusal } from "./narrow.ts";
import { ownerRefusal } from "./owner.ts";
import { noteLocaleEcho, withPlaceFields } from "./placefields.ts";
import { READ_TOOLS } from "./repeat.ts";
import { isCheckCall, isResumeCall, runCheck, runResume } from "./resume.ts";
import { localEnd } from "./runend.ts";
import { satelliteChannelRefusal } from "./satellite.ts";
import { isStandCall, runStand } from "./stand.ts";
import { ensureStanding, isUnattributed, noteStanding, replyText } from "./standing.ts";
import { localStatus } from "./status.ts";
import { loadServerCache, saveServerCache, sleep } from "./store.ts";
import { emit, log } from "./streams.ts";
import { localSuspend } from "./suspend.ts";
import { beginTaking } from "./taking.ts";
import { noteServedTools, recheckTools } from "./toolsync.ts";
import { currentAccessToken, onReinitialized, post, reinitialize, state } from "./transport.ts";
import { type JsonRpcMessage } from "./types.ts";
import { takeNotice } from "./update.ts";
import { isUsageCall, runUsage } from "./usage.ts";

// The verdict a caller actually needs is not "it failed" but "may it have taken
// effect?" — and those are different sentences. A single "retry the call" over
// both is worse than silence: it is advice, and for a write with no version
// guard the advice duplicates the record without a trace.
export function syntheticError(
  id: JsonRpcMessage["id"],
  message: string,
  outcome: Outcome = UpstreamError.UNKNOWN,
  holdOff: boolean | "wait" | "knock" | "dead" | "human" = false,
): JsonRpcMessage {
  // holdOff carries the KIND of not-yet, because the two kinds prescribe
  // opposite moves. "wait" is a pause with an honest figure — the knock
  // cooldown, an hour a repeated refusal proved real — when one reaches a
  // caller at all: calls sit short holds out and answer long ones with the
  // login (#4794); a retry there buys nothing. "knock" is the FIRST early refusal of a needed
  // refresh: witnessed in the field, the same call succeeded seconds after
  // that refusal (a rotated grant, a 401 that did not survive a second
  // presentation — the cause was not pinned, the refuted prescription was),
  // so selling the token's whole hour as a wait once cost a caller a
  // self-imposed half hour of blindness.
  const kind = holdOff === true ? "wait" : holdOff;
  const verdict =
    outcome === UpstreamError.NOT_SENT
      ? kind === "wait"
        ? // Safe and not-yet are different axes, and an agent told only "safe" reads
          // it as "now": it retries into the same wall, then goes looking for a
          // defect in what only time repairs. The interval itself stays where it was
          // measured — in the reason above — so one refusal never carries two.
          "Nothing was applied and the grant is whole — this clears itself by waiting, " +
          "not by fixing: wait out the interval named above before retrying."
        : kind === "knock"
          ? "Nothing was applied and the grant is whole — a benign transition, not a broken " +
            "authorization: retry the call now. Only a refusal that returns means the hour is " +
            "real — that one names its own wait."
          : kind === "dead"
            ? "Nothing was applied, and no retry and no wait will change that — only a human " +
              "with a new token can."
            : kind === "human"
              ? // The agent reads this; the human does not. A retry buys nothing
                // and a wait shortens nothing — only handing the link over does.
                "Nothing was applied, and only the human can move this: hand them the link above — " +
                "the local one opens only on this machine; from another, the sign-in page with the " +
                "code, where one is named — the login is already waiting for their click. Once they " +
                "finish, retry the call."
              : "The call never reached the server, so nothing was applied — retry freely."
      : "The call went out and its answer was lost, so THE OUTCOME IS UNKNOWN — re-read the target " +
        "before retrying: a blind retry can apply a second time, and a write with no version guard " +
        "duplicates silently.";
  // The attention clause stays off every hold-off: a whole grant pausing is
  // the server's own pacing, never a defect to escalate.
  const tail = kind
    ? "The bridge stays up."
    : "The bridge stays up; if this repeats, the server side needs attention.";
  return {
    jsonrpc: "2.0",
    id,
    error: {
      code: -32001,
      // BUILD is here for the field report: the error is quoted verbatim, and
      // the build string is what dates the code that produced it.
      message: `${BRIDGE_NAME} ${BUILD}: ${message}. ${verdict} ${tail}`,
    },
  };
}

// Network blips are retried with backoff: unsent calls always, answer-lost ones
// only when they are reads (graph @nks/nks-dev, node #4664).
const NET_BACKOFF_MS = (process.env[envName("BRIDGE_NET_BACKOFF_MS")] || "1000,2000,4000")
  .split(",")
  .map(Number)
  .filter((n) => Number.isFinite(n) && n >= 0);

// After a reopen the tool list is rechecked against the harness's copy, unless the
// harness's own tools/list is in flight (graph @nks/nks-dev, node #5405).
const H = scoped(() => ({ listing: 0 }));
onReinitialized(() => {
  if (H.listing > 0) return;
  return recheckTools(async () => {
    const id = `${ID_PREFIX}bridge-tools-${++state.reinitCounter}`;
    let got: JsonRpcMessage | null = null;
    await post({ jsonrpc: "2.0", id, method: "tools/list", params: {} }, (m) => {
      if (m.id === id) got = m;
    });
    const reply = got as JsonRpcMessage | null;
    if (!reply?.result) return reply;
    annotateToolList(reply); // the cache keeps the full annotated list
    saveServerCache({ tools: reply.result });
    return narrowToolList(reply); // compared with what the harness would see
  }, emit);
});

function isRead(msg: JsonRpcMessage): boolean {
  if (msg?.method === "initialize" || msg?.method === "tools/list") return true;
  return msg?.method === "tools/call" && READ_TOOLS.has(String(msg.params?.name ?? ""));
}

// initialize/tools/list blocked by network or login are answered from the last
// cached server answer (graph @nks/nks-dev, node #4790).
function lastServerAnswer(msg: JsonRpcMessage): JsonRpcMessage | null {
  const cache = loadServerCache();
  const result =
    msg?.method === "initialize"
      ? cache.init
      : msg?.method === "tools/list" && !msg.params?.cursor
        ? cache.tools
        : null;
  if (!result) return null;
  const reply: JsonRpcMessage = { jsonrpc: "2.0", id: msg.id, result };
  if (msg?.method !== "tools/list") return reply;
  annotateToolList(reply);
  const shown = narrowToolList(reply);
  noteServedTools(shown.result);
  return shown;
}

// Own clients read a handshake refusal themselves and keep the plain refusal
// (graph @nks/nks-dev, node #4790).
function ownClient(): boolean {
  const info = (state.initParams as { clientInfo?: { name?: unknown } } | null)?.clientInfo;
  return typeof info?.name === "string" && OWN_CLIENTS.has(info.name);
}

/** The delivery-behind notice, once per session, into the first tool reply with a body. */
function withNotice(reply: JsonRpcMessage): JsonRpcMessage {
  const content = reply?.result?.content;
  if (!Array.isArray(content)) return reply;
  const notice = takeNotice();
  if (notice && !content.some((c) => NOTICE_MARK.test(c?.text ?? ""))) {
    content.push({ type: "text", text: notice });
  }
  return reply;
}

// Deliver one harness message upstream, with one auth retry and one session
// retry. On final failure a request id is ALWAYS answered with an error.
export async function deliver(msg: JsonRpcMessage): Promise<void> {
  const listing = msg?.method === "tools/list";
  if (listing) H.listing++;
  try {
    await deliverOne(msg);
  } finally {
    if (listing) H.listing--;
    settleOwnRevoke(msg);
  }
}

async function deliverOne(msg: JsonRpcMessage): Promise<void> {
  // Answered by the bridge itself, never sent upstream.
  const local = localStatus(msg) ?? localLeave(msg) ?? localSuspend(msg) ?? localEnd(msg);
  if (local) {
    emit(await local);
    return;
  }
  const isInit = msg?.method === "initialize";
  if (isInit) state.initParams = msg.params;
  const harness = !ownClient();
  const hasId = msg?.id !== undefined && msg?.id !== null;
  let authRetried = false;
  let heldRetried = false;
  let sessionRetried = false;
  let netTries = 0;
  // Across retries the honest verdict is the worst one seen: an attempt that
  // went out with a lost answer is not undone by a later attempt that never left.
  let outcome: Outcome = UpstreamError.NOT_SENT;
  const note = (e: unknown) => {
    if (!(e instanceof UpstreamError) || e.outcome === UpstreamError.UNKNOWN) {
      outcome = UpstreamError.UNKNOWN;
    }
  };

  // A tool call's own reply is held back until it has been read for the
  // unattributed mark; everything else the server streams passes through.
  const isToolCall = msg?.method === "tools/call";
  const isStand = isStandCall(msg);
  let heldReply: JsonRpcMessage | null;
  let standingRetried = false;
  const forward = (reply: JsonRpcMessage) => {
    let m = reply;
    if (isInit && m.id === msg.id && m.result?.protocolVersion) {
      state.protocolVersion = m.result.protocolVersion;
    }
    if (m.id === msg.id) noteStanding(msg, m);
    if (m.id === msg.id && m.result && isInit) saveServerCache({ init: m.result });
    if (m.id === msg.id && msg.method === "tools/list") {
      annotateToolList(m); // the cache keeps the full annotated list
      if (m.result && !msg.params?.cursor) saveServerCache({ tools: m.result });
      m = narrowToolList(m); // the harness gets the narrowed copy, fingerprinted as served
      if (!msg.params?.cursor) noteServedTools(m.result);
    }
    if (isToolCall && hasId && m.id === msg.id) {
      heldReply = m;
      return;
    }
    emit(m);
  };

  let endTaking: (() => void) | null = null;
  for (;;) {
    try {
      if (
        !isInit &&
        state.sessionId &&
        state.sessionToken &&
        currentAccessToken() !== state.sessionToken
      ) {
        // The credential this session was opened with is gone; so is the session,
        // whatever the server says next. Re-open — bound by header — before the call.
        log(
          "the access token changed since the session was opened — re-initializing before the call",
        );
        await reinitialize();
      }
      if (!isInit && !state.sessionId && state.initParams) {
        // The harness's own initialize was answered by us, not the server (a
        // deferred login, a refused token): upstream has no session for this
        // call, and a call without Mcp-Session-Id is refused outright. Open the
        // session now, with the params the harness gave — it will not ask again.
        log("no upstream session yet — initializing before the call");
        await reinitialize();
      }
      if (!isInit) await ensureStanding(); // the session may have turned over under us
      // A taken or deaf seat signs no record (graph @nks/nks-dev, node #6706).
      const taken = hasId ? (evictedRefusal(msg) ?? (await deafRefusal(msg))) : null;
      if (taken) {
        emit({
          jsonrpc: "2.0",
          id: msg.id,
          result: { isError: true, content: [{ type: "text", text: taken }] },
        });
        return;
      }
      if (isStand) {
        emit(withNotice(await serialized(() => runStand(msg))));
        return;
      }
      if (isResumeCall(msg) || isCheckCall(msg)) {
        // Plugin requests to the bridge itself, over the session opened above
        // (graph @nks/nks-dev, node #5140).
        emit(await serialized(() => (isResumeCall(msg) ? runResume(msg) : runCheck(msg))));
        return;
      }
      if (isUsageCall(msg)) {
        // Session usage into the seat's attrs (graph @nks/nks-dev, node #6271).
        emit(await serialized(() => runUsage(msg)));
        return;
      }
      heldReply = null;
      // One standing per bridge (graph @nks/nks-dev, node #5154); realms compared in one form (node #5838).
      if (hasId && msg.method === "tools/call" && msg.params?.name === tool("channel"))
        await resolveAgainstLed(msg.params.arguments?.realm);
      // A satellite bridge moves only its own .sub-N seat.
      const satWord =
        hasId && msg.method === "tools/call" && msg.params?.name === tool("channel")
          ? satelliteChannelRefusal(msg.params.arguments ?? {})
          : null;
      const cross = satWord
        ? {
            jsonrpc: "2.0",
            id: msg.id,
            result: { isError: true, content: [{ type: "text", text: satWord }] },
          }
        : hasId
          ? (outsideSetRefusal(msg) ?? crossPlaceRefusal(msg))
          : null;
      if (cross) {
        emit(cross);
        return;
      }
      // Taking an owner-role seat by a raw channel move needs the human's word (owner.ts).
      const ch = msg.params?.arguments ?? {};
      const takes =
        hasId &&
        msg.method === "tools/call" &&
        msg.params?.name === tool("channel") &&
        ["connect", "mint", "register"].includes(String(ch.action));
      // Own seat's realm in its own spelling; a seat another session hears is not taken
      // raw (graph @nks/nks-dev, node #6706).
      if (takes && ch.realm != null) ch.realm = await seatRealm(ch.realm, ch.name);
      const notOwner = takes
        ? ((await ownerRefusal(ch.realm, ch.karta)) ?? (await rawSeatRefusal(msg)))
        : null;
      if (notOwner) {
        emit({
          jsonrpc: "2.0",
          id: msg.id,
          result: { isError: true, content: [{ type: "text", text: notOwner }] },
        });
        return;
      }
      expectOwnRevoke(msg); // close 4001 may outrun the reply
      if (
        msg.method === "tools/call" &&
        msg.params?.name === tool("channel") &&
        msg.params.arguments
      )
        msg.params.arguments = withPlaceFields(msg.params.arguments); // graph @nks/nks-dev, node #5174
      // Raw connect/mint runs under an intent until the hold record (graph @nks/nks-dev, node #6706).
      endTaking =
        msg.params?.name === tool("channel") ? beginTaking(msg.params.arguments ?? {}) : null;
      await post(msg, forward);
      const held = heldReply as JsonRpcMessage | null;
      if (held && msg.params?.name === tool("channel") && msg.params.arguments)
        noteLocaleEcho(msg.params.arguments, replyText(held), structuredOf(held));
      if (held) {
        if (state.standing && isUnattributed(held)) {
          // The binding this session trusted is gone on the server's side — a
          // silent turnover, a platform that lost it, a header nobody honoured.
          // A refused channel call applied nothing: re-bind and say the word again,
          // once. A write that went through with a warning is already on record
          // without its author; all that can be saved is the next one.
          state.standingSession = null;
          const refused = !!held.result?.isError;
          if (refused && !standingRetried) {
            standingRetried = true;
            log("the call ran unattributed — re-binding the standing and repeating it once");
            await ensureStanding();
            if (state.standingSession !== state.sessionId) await ensureStanding(); // one passing refusal is not the hour
            if (state.standingSession === state.sessionId) {
              endTaking?.();
              continue;
            }
          } else {
            log(
              `a write went out unattributed (${replyText(held).slice(0, 120)}) — the standing is re-bound before the next call`,
            );
          }
        }
        // connect/mint: the bridge takes the socket; a case join is remembered (graph @nks/nks-dev, node #6573).
        noteCaseEntry(msg.params?.name, msg.params?.arguments, held);
        const reply = absorbCloseReply(msg, absorbRevokeReply(msg, absorbChannelReply(msg, held)));
        emit(forHarness(withNotice(reply)));
      }
      endTaking?.();
      return;
    } catch (e) {
      endTaking?.();
      note(e);
      if (
        e instanceof UpstreamError &&
        e.kind === "network" &&
        e.retryable &&
        netTries < NET_BACKOFF_MS.length &&
        (e.outcome === UpstreamError.NOT_SENT || isRead(msg))
      ) {
        const pause = NET_BACKOFF_MS[netTries++];
        log(`${e.message} — knocking again in ${pause}ms (${netTries}/${NET_BACKOFF_MS.length})`);
        await new Promise((r) => setTimeout(r, pause));
        continue;
      }
      if (e instanceof UpstreamError && e.kind === "auth" && !authRetried) {
        authRetried = true;
        try {
          await ensureAuth(e.message, { force: true, rejected: e.presented });
          continue;
        } catch (authErr) {
          if (authErr instanceof HoldOffError && authErr.retryNow && !heldRetried) {
            // The first early refusal of a needed refresh: the same call was
            // witnessed succeeding a moment later, so the bridge repeats it
            // once itself instead of telling anyone to (#4794).
            heldRetried = true;
            authRetried = false;
            log(`${authErr.message} — repeating the call once`);
            await sleep(300);
            continue;
          }
          const standIn = hasId && harness ? lastServerAnswer(msg) : null;
          if (standIn) {
            log(`${msg.method} answered from the last server answer — ${errorMessage(authErr)}`);
            emit(standIn);
            return;
          }
          if (authErr instanceof TokenRefused) {
            if (hasId) emit(syntheticError(msg.id, authErr.message, outcome, "dead"));
            return;
          }
          if (authErr instanceof AuthPending) {
            // A login waiting for a click is repaired by the human alone: no
            // retry and no waiting shortens it, so the verdict sends the link on.
            if (hasId) emit(syntheticError(msg.id, authErr.message, outcome, "human"));
            return;
          }
          // A hold-off is not a failed authorization: the grant is whole and
          // nothing was judged. Naming it "failed" sent readers off to mend a
          // grant nobody had touched.
          const held = authErr instanceof HoldOffError;
          const message = errorMessage(authErr);
          log(`${held ? "authorization holding off" : "authorization failed"}: ${message}`);
          if (hasId) {
            emit(
              syntheticError(
                msg.id,
                `${held ? "authorization holding off" : "authorization failed"}: ${message}`,
                outcome,
                held && (authErr.retryNow ? "knock" : "wait"),
              ),
            );
          }
          return;
        }
      }
      if (e instanceof UpstreamError && e.kind === "session" && !sessionRetried && !isInit) {
        sessionRetried = true;
        try {
          await reinitialize();
          continue;
        } catch (reErr) {
          if (hasId) {
            emit(
              syntheticError(msg.id, `session recovery failed: ${errorMessage(reErr)}`, outcome),
            );
          }
          return;
        }
      }
      if (
        e instanceof UpstreamError &&
        (e.kind === "network" || (e.kind === "auth" && harness)) &&
        hasId
      ) {
        const cached = lastServerAnswer(msg);
        if (cached) {
          log(`${e.message} — ${msg.method} answered from the last server answer`);
          emit(cached);
          return;
        }
      }
      const reason =
        e instanceof UpstreamError
          ? e.kind === "auth" && authRetried
            ? refusedAudience(e.message)
            : e.message
          : `bridge internal error: ${errorMessage(e)}`;
      log(`request ${hasId ? msg.id : `(notification ${msg?.method})`} failed: ${reason}`);
      if (hasId) emit(syntheticError(msg.id, reason, outcome));
      return;
    }
  }
}
