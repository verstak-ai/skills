import { ID_PREFIX, NOTICE_MARK, tool } from "../delivery/index.ts";
import { OWN_CLIENTS } from "../shared/clients.ts";
import { REPLAY_ID_PREFIX } from "../shared/seam.ts";
import { parseSpawn } from "../shared/spawned-for.ts";
import {
  absorbChannelReply,
  absorbCloseReply,
  absorbRevokeReply,
  expectOwnRevoke,
  settleOwnRevoke,
} from "./absorb.ts";
import { refusedAudience } from "./audience.ts";
import { ensureAuth } from "./auth.ts";
import { localAway } from "./away.ts";
import { crossPlaceRefusal, resolveAgainstLed, serialized } from "./call.ts";
import {
  claimReply,
  refused as refusalReply,
  refuseLaunch,
  refuseUnbound,
} from "./claimdelivery.ts";
import { CFG } from "./config.ts";
import { contextCall, refuseContext } from "./context-gate.ts";
import { deafRefusal } from "./deaf.ts";
// The window's ladder (downwindow.ts) begins with the call's own retry pauses: unsent calls
// always, answer-lost ones only when they are reads (graph @nks/nks-dev, node #4664) — a
// write has no version fence and would land twice.
import { NET_BACKOFF_MS } from "./downwindow.ts";
import {
  AuthPending,
  DownError,
  errorMessage,
  HoldOffError,
  type Outcome,
  TokenRefused,
  UpstreamError,
} from "./errors.ts";
import { evictedRefusal } from "./evicted.ts";
import { forHarness, structuredOf } from "./fields.ts";
import { liveHearing, rawSeatRefusal, seatRealm } from "./hearing.ts";
import { initializeSession } from "./initialize.ts";
import { localLeave } from "./leave.ts";
import { annotateToolList } from "./moment.ts";
import { narrowToolList, outsideSetRefusal } from "./narrow.ts";
import { localHalted } from "./orderhalt.ts";
import { ownerRefusal } from "./owner.ts";
import { noteLocaleEcho, withPlaceFields } from "./placefields.ts";
import { isPulseCall, runPulse } from "./pulse.ts";
import { localRealm } from "./realmask.ts";
import { isRead } from "./repeat.ts";
import { noteReply } from "./replynotes.ts";
import { isCheckCall, isResumeCall } from "./resume.ts";
import { throughGate } from "./returngate.ts";
import { localEnd } from "./runend.ts";
import { satelliteChannelRefusal } from "./satellite.ts";
import { withCallOrigin } from "./seatorigin.ts";
import { refreshSkills } from "./skillrefresh.ts";
import { rememberBasis } from "./spawned-for.ts";
import { isStandCall } from "./stand.ts";
import { resumeByOrigin, standForHarness } from "./standdelivery.ts";
import { ensureStanding, isUnattributed, noteStanding, replyText } from "./standing.ts";
import { localStatus } from "./status.ts";
import { loadServerCache, saveServerCache, sleep } from "./store.ts";
import { emit, log } from "./streams.ts";
import { localSuspend } from "./suspend.ts";
import { beginTaking } from "./taking.ts";
import { harnessListing, noteServedTools, recheckTools, watchHarnessListing } from "./toolsync.ts";
import { onReinitialized, post, reinitialize, state } from "./transport.ts";
import { type JsonRpcMessage } from "./types.ts";
import { takeNotice } from "./update.ts";
import { isUsageCall, runUsage } from "./usage.ts";
import { syntheticError } from "./verdict.ts";

// After a reopen the tool list is rechecked against the harness's copy, unless the
// harness's own tools/list is in flight (graph @nks/nks-dev, node #5405).
onReinitialized(() => {
  if (harnessListing()) return;
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

// initialize/tools/list blocked by network or login are answered from the last
// cached server answer (graph @nks/nks-dev, node #4790): a harness refused here treats the
// server as dead until restart; the next call reinitializes and carries the login link.
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

// Own clients read a handshake refusal themselves and retry the handshake until login,
// so they keep the plain refusal (graph @nks/nks-dev, node #4790).
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

// Deliver with one auth/session retry; final failures always answer the request id.
export async function deliver(msg: JsonRpcMessage): Promise<void> {
  const listed = msg?.method === "tools/list" ? watchHarnessListing(msg, emit) : null;
  try {
    await deliverOne(msg);
  } finally {
    listed?.();
    settleOwnRevoke(msg);
    // Publication follows the final answer, not an intermediate retry.
    if (msg.method === "tools/call") void refreshSkills();
  }
}
const LOCAL = [localStatus, localLeave, localSuspend, localAway, localEnd, localHalted, localRealm];
async function deliverOne(msg: JsonRpcMessage): Promise<void> {
  if (refuseLaunch(msg)) return;
  const local = LOCAL.reduce((got, f) => got ?? f(msg), contextCall(msg));
  if (local) {
    emit(await local);
    return;
  }
  const isInit = msg?.method === "initialize";
  if (isInit) initializeSession(msg.params);
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
    let m = claimReply(msg, reply);
    if (isInit && m.id === msg.id && m.result?.protocolVersion) {
      state.protocolVersion = m.result.protocolVersion;
    }
    if (m.id === msg.id) noteStanding(msg, m);
    if (m.id === msg.id && m.result && isInit) saveServerCache({ init: m.result });
    if (m.id === msg.id && msg.method === "tools/list") {
      annotateToolList(m, !!msg.params?.cursor); // the cache keeps the full annotated list
      if (m.result && !msg.params?.cursor) saveServerCache({ tools: m.result });
      m = narrowToolList(m); // the harness gets the narrowed copy, fingerprinted as served
      if (!msg.params?.cursor) noteServedTools(m.result, msg);
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
      if (isCheckCall(msg) && liveHearing()) {
        emit(await resumeByOrigin(msg));
        return;
      }
      if (!isInit && !state.sessionId && state.initParams) {
        // The harness's own initialize was answered by us, not the server (a
        // deferred login, a refused token): upstream has no session for this
        // call, and a call without Mcp-Session-Id is refused outright. Open the
        // session now, with the params the harness gave — it will not ask again.
        log("no upstream session yet — initializing before the call");
        await reinitialize();
      }
      // The session may have turned over under us: rebind; its stop sends nothing (#7439).
      const stop = isInit ? null : await ensureStanding();
      if (stop ? !hasId : refuseLaunch(msg) || refuseUnbound(msg) || (await refuseContext(msg)))
        return;
      // A taken or deaf seat signs no record (graph @nks/nks-dev, node #6706); a stop answers.
      const taken = stop ?? (hasId ? (evictedRefusal(msg) ?? (await deafRefusal(msg))) : null);
      if (taken) return void emit(refusalReply(msg.id, taken));
      if (isStand) {
        emit(await standForHarness(msg, withNotice));
        return;
      }
      if (isResumeCall(msg) || isCheckCall(msg)) {
        // Plugin's automatic return over the session opened above (#5140).
        emit(await resumeByOrigin(msg));
        return;
      }
      if (isUsageCall(msg)) {
        // Session usage into the seat's attrs (graph @nks/nks-dev, node #6271).
        emit(await serialized(() => runUsage(msg)));
        return;
      }
      if (isPulseCall(msg)) {
        // The harness's word on its turn, for the seat's pulse (graph @nks/nks-dev, node #7529).
        emit(runPulse(msg));
        return;
      }
      heldReply = null;
      const ch = msg.params?.arguments ?? {};
      const onChannel =
        hasId && msg.method === "tools/call" && msg.params?.name === tool("channel");
      const takes = onChannel && ["connect", "mint", "register"].includes(String(ch.action));
      // One standing per bridge (graph @nks/nks-dev, node #5154); realms compared in one form
      // (node #5838); a seat-taking move goes as @owner/slug before any check (#8677, hearing.ts).
      if (takes && ch.realm != null) ch.realm = await seatRealm(ch.realm);
      else if (onChannel) await resolveAgainstLed(ch.realm);
      if (takes && ch.action === "register" && ch.spawned_for)
        rememberBasis(ch, parseSpawn(ch.spawned_for));
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
      // Taking an owner-role seat by a raw channel move needs the human's word (owner.ts); a
      // seat another session hears is not taken raw (graph @nks/nks-dev, node #6706).
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
      if (await refuseContext(msg)) return;
      expectOwnRevoke(msg); // close 4001 may outrun the reply: the bridge must know it revoked
      if (
        msg.method === "tools/call" &&
        msg.params?.name === tool("channel") &&
        msg.params.arguments
      )
        // Seat fields go on the five raw channel calls too (graph @nks/nks-dev, node #5174).
        msg.params.arguments = withPlaceFields(msg.params.arguments);
      // Raw connect/mint runs under an intent until the hold record (graph @nks/nks-dev, node #6706).
      endTaking =
        msg.params?.name === tool("channel") ? beginTaking(msg.params.arguments ?? {}) : null;
      const send = () =>
        takes ? withCallOrigin(msg.id, () => post(msg, forward)) : post(msg, forward);
      // Every upstream initialize goes through the machine's gate (returngate.ts, #11375): a thin
      // bridge's replayed handshake to a session new to it (a successor after a handover or a
      // self-update) as a return; any other (new thin bridges after a plugin reload) as an open.
      const replayed = String(msg.id).startsWith(REPLAY_ID_PREFIX);
      await (isInit ? throughGate(CFG.serverUrl, send, replayed ? "return" : "open") : send());
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
        // connect/mint: the bridge takes the socket and appends how to listen; the reply notes
        // the place — a satellite's case join, a provisional seat's first write (replynotes.ts).
        await noteReply(msg, held);
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
      let metDown: DownError | null = null;
      if (e instanceof UpstreamError && e.kind === "session" && !sessionRetried && !isInit) {
        sessionRetried = true;
        try {
          await reinitialize();
          continue;
        } catch (reErr) {
          // A reopen that met the down window, or whose own knock failed in the down
          // family (downwindow.ts), is the server being down — not a session that cannot
          // be recovered, and no word a reader can act on. The call answers the down
          // word below: nothing was applied — the 404 saw to that — and the call is not
          // sent again; the bridge knocks again by itself.
          if (!(reErr instanceof DownError)) {
            if (hasId)
              emit(
                syntheticError(msg.id, `session recovery failed: ${errorMessage(reErr)}`, outcome),
              );
            return;
          }
          metDown = reErr;
        }
      }
      // What the answer names: the caught error, or the window's word when the reopen met it.
      const failure: unknown = metDown ?? e;
      if (
        failure instanceof UpstreamError &&
        (failure.kind === "network" || (failure.kind === "auth" && harness)) &&
        hasId
      ) {
        const cached = lastServerAnswer(msg);
        if (cached) {
          log(`${failure.message} — ${msg.method} answered from the last server answer`);
          emit(cached);
          return;
        }
      }
      const reason =
        failure instanceof UpstreamError
          ? failure.kind === "auth" && authRetried
            ? refusedAudience(failure.message)
            : failure.message
          : `bridge internal error: ${errorMessage(failure)}`;
      log(`request ${hasId ? msg.id : `(notification ${msg?.method})`} failed: ${reason}`);
      if (hasId)
        emit(
          syntheticError(msg.id, reason, outcome, failure instanceof DownError ? "down" : false),
        );
      return;
    }
  }
}
