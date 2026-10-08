import { now } from "../clock.ts";
import { CFG } from "../config.ts";
import {
  DeadGrantError,
  DEFINITIVE_OAUTH_ERRORS,
  errorCode,
  errorMessage,
  HoldOffError,
  TokenError,
} from "../errors.ts";
import { grantLog, loadGrantState, loadStore, saveGrantState, saveStore, sleep } from "../store.ts";
import { debug, log } from "../streams.ts";
import { refreshHours, tokenUsable, usableTokens } from "../tokens.ts";
import { type Meta, type Tokens } from "../types.ts";
import { discoverMeta, resourceOf } from "./discovery.ts";
import { acquireRefreshLock, releaseRefreshLock } from "./refreshlock.ts";
import { tokenRequest } from "./tokenrequest.ts";

const REFRESH_WAIT_MS = 60_000; // a waiter gives up long before the harness does
const REFRESH_POLL_MS = 120;
const EARLY_REFUSAL_COOLDOWN_MS = 15_000; // one knock per stretch, never one per call
// A background knock on a refused grant does not serve a call; it only notices
// healing after a server restart or database hiccup. One machine-wide control
// knock per interval is enough, rather than one per minute from every process —
// the field loop was five processes making about five knocks/minute, 2896 in one
// night (graph @nks/nks-dev, node #4168).
const REFUSED_KNOCK_MS = 5 * 60_000; // one background control knock per stretch, machine-wide, on a grant the machine holds refused

// One refresh attempt, classified. Returns the new tokens, null if the attempt
// only proves someone else already rotated, and throws either a DeadGrantError
// (the grant itself is refused) or a plain Error (transient — keep the grant).
// `proactive` is the caller's claim that this is a speculative top-up; the
// current token decides whether that claim still holds when it is spent.
async function refreshOnce(meta: Meta, cur: Tokens, proactive: boolean): Promise<Tokens | null> {
  // The hour is a reason to WAIT, never a reason to refuse to act. Holding back
  // a refresh nobody needs yet is thrift (that pacing lives in the keepalive,
  // where the speculative caller is); holding back one the caller needs now is
  // a wall — it turns "the server might say no" into "no answer for half an
  // hour", and the caller has no way around it. Our reading can also be stale:
  // a sibling may have rotated the grant a moment ago, and then the nbf we are
  // looking at belongs to a token the server has already retired. So a needed
  // refresh knocks — ONCE per stretch. Knocking on every call would turn one
  // rejected access token into hundreds of refused token requests, from every
  // bridge on the machine: the lock serializes concurrency, not repetition.
  const hours = refreshHours(cur);
  const inTheWindow = hours.nbf && now() < hours.nbf;
  const cooling = inTheWindow && loadGrantState().early_refused_until;
  if (cooling && now() < cooling) {
    const left = Math.round((cooling - now()) / 1000);
    throw new HoldOffError(
      `the token endpoint refused this grant as too early moments ago` +
        ` — not knocking again for ${left}s; grant kept, will retry`,
      false,
      hours.nbf as number,
    );
  }
  // The grant is presented with the client it was issued to. The machine's
  // registration may have moved on under it — a login just published on a
  // fresh one — and that one is not this grant's to spend or to lose.
  const clientId = CFG.staticClientId || cur.client_id || loadStore().client?.client_id || "";
  debug("refreshing access token");
  try {
    return await tokenRequest(meta, {
      grant_type: "refresh_token",
      refresh_token: cur.refresh_token ?? "",
      client_id: clientId,
      resource: resourceOf(meta),
    });
  } catch (e) {
    const message = errorMessage(e);
    const deadRefresh =
      e instanceof TokenError &&
      e.status === 404 &&
      e.oauthError === "NotFound" &&
      e.oauthMessage === "Refresh Token does not exist";
    // A token endpoint that answers 404/405/410 — or whose host is not there
    // to answer at all — is discovery gone stale: the AS moved and the store
    // still points at where it used to live. Cached forever, that is a
    // permanent outage every attempt walks back into; dropped, the next
    // attempt rediscovers and heals. The grant itself was never judged.
    const gone =
      e instanceof TokenError
        ? !deadRefresh && [404, 405, 410].includes(e.status)
        : ["ENOTFOUND", "ECONNREFUSED"].includes(errorCode(e) ?? "");
    if (gone && e instanceof TokenError && e.status === 404 && !(await tokenEndpointMoved(meta))) {
      // Rauthy words its verdict on a client it no longer knows — cleaned up
      // as unused, or presented empty — as 404 NotFound "No results found",
      // the status of a path that is not there. Discovery still naming this
      // very endpoint is what tells them apart: nothing moved, the refusal is
      // the server's own, and rediscovering would only walk into it again,
      // forever (graph @nks/nks-dev, node #4540).
      log(
        "the token endpoint answers NotFound while discovery still names it — the server no longer knows this client; dropping the registration",
      );
      grantLog(
        `refresh refused by an endpoint discovery still names (${message}) — registration dropped`,
      );
      dropRegistration(clientId);
      throw new DeadGrantError(message);
    }
    if (gone) {
      saveStore({ meta: null });
      grantLog(
        `token endpoint is gone (${message}) — cached discovery dropped, rediscovering on the next attempt`,
      );
      throw new Error(
        `the token endpoint is gone (${message}) — rediscovering on the next attempt; grant kept, will retry`,
        { cause: e },
      );
    }
    // Definitive = the grant itself is refused: a known OAuth error code, or
    // any 400/401 from the token endpoint (servers word these codes freely —
    // witnessed: Rauthy answers a dead refresh with 401 "JwtToken" or the
    // structured NotFound response above).
    // Only 5xx/network/temporarily_unavailable stay transient.
    const definitive =
      e instanceof TokenError &&
      e.oauthError !== "temporarily_unavailable" &&
      (deadRefresh ||
        DEFINITIVE_OAUTH_ERRORS.has(e.oauthError ?? "") ||
        e.status === 400 ||
        e.status === 401);
    if (!definitive) {
      throw new Error(`token refresh failed transiently (${message}) — grant kept, will retry`, {
        cause: e,
      });
    }
    // Refused, yes — but a refusal is not a verdict. The grant's own hours say
    // more than the server's wording does: a token still short of its nbf, or
    // one nobody needed yet, is refused in exactly the words of a dead grant.
    // Only an expired refresh token is honest proof that a human must return.
    const expired = hours.exp && now() >= hours.exp;
    const notYet = hours.nbf && now() < hours.nbf;
    // `proactive` is the keepalive's CLAIM that the access token in hand still
    // works — checked here, where it is spent. A keepalive that woke up to an
    // already-expired store is topping nothing up: nobody on the machine can
    // serve a call until this refresh lands, and refusing it in the words of a
    // speculative one hides a dead grant behind a false "still works". And the
    // server's own verdict on the refresh token's existence is about the token,
    // not about hours — no hold-off applies to it (graph @nks/nks-dev, node #4168).
    const speculative = proactive && tokenUsable(cur);
    if (!expired && !deadRefresh && (notYet || speculative)) {
      // One early refusal can be a stale reading — the grant may have rotated
      // under us moments ago, and the server's 401 need not survive a second
      // presentation (witnessed in the field: the same call succeeded seconds
      // later). A refusal knocked AFTER the cooldown while a fresh stamp still
      // stands is different: that is the server's own schedule speaking, and
      // from here the honest prescription flips from "retry now" to "wait".
      // Read the stamp BEFORE this refusal renews it.
      const stamp = loadGrantState().early_refused_until;
      const repeated = !!notYet && !!stamp && stamp > now() - 120_000;
      // The figure is the refresh token's own hour on the server's clock — a
      // fact about ITS schedule, never the length of anyone's deafness. Worded
      // as a lockout it once read as a 27-minute sentence on the caller.
      const why = notYet
        ? `the refresh token's own hour is another ${Math.round(((hours.nbf as number) - now()) / 1000)}s away on the server's clock`
        : "the access token in hand still works";
      // Remember the refusal for a breath, so the next call in this stretch
      // waits with us instead of asking the same doomed question again — but
      // only when it was the HOUR that refused us. A speculative refusal must
      // never gag a caller who actually needs a token: that is the same wall,
      // built smaller. And never past the hour itself: the moment it arrives,
      // knocking is the right move again.
      let until: number | null = null;
      if (notYet) {
        until = Math.min(now() + EARLY_REFUSAL_COOLDOWN_MS, hours.nbf as number);
        saveGrantState({ early_refused_until: until });
      }
      grantLog(
        `refresh refused early — ${why}; grant kept` +
          (until ? `, not knocking again for ${Math.round((until - now()) / 1000)}s` : "") +
          ` (${message})`,
      );
      throw new HoldOffError(
        repeated
          ? `token refresh refused too early again (${message}) — the hour is real: ${why}; grant kept`
          : `token refresh refused too early (${message}) — ${why}; grant kept, will retry`,
        !!notYet && !repeated,
        notYet ? (hours.nbf as number) : null,
      );
    }
    // A rotated-away token is refused in exactly the same words as a dead one.
    // If the store moved on while we were asking, what we presented was merely
    // stale: the grant is alive, in someone else's hands.
    if (loadStore().tokens?.refresh_token !== cur.refresh_token) {
      debug("our refresh token was already rotated by a sibling — retrying with the stored one");
      return null;
    }
    if (e instanceof TokenError && e.oauthError === "invalid_client") {
      // The server has forgotten our dynamic registration. Keeping it would
      // point the next browser flow at an authorize page that refuses the
      // client — a login the human cannot complete however often they try.
      log("the server no longer knows this client — dropping the registration");
      grantLog("server no longer knows this client — registration dropped");
      dropRegistration(clientId);
    }
    const overdue = hours.exp && now() >= hours.exp;
    grantLog(
      `refresh refused${overdue ? " and the grant is past its own expiry" : ""}: ${message}`,
    );
    throw new DeadGrantError(overdue ? `${message} (grant expired)` : message, !!overdue);
  }
}

// Did the token endpoint move since the store last saw it? Discovery
// unreachable — or slower than this budget, since the walk runs inside a
// harness call and under the machine's refresh lock — counts as moved: that
// keeps the old prescription (rediscover next time) where nothing can be
// told apart.
const ENDPOINT_CHECK_BUDGET_MS = 10_000;

async function tokenEndpointMoved(meta: Meta): Promise<boolean> {
  try {
    const fresh = await Promise.race([
      discoverMeta(null),
      sleep(ENDPOINT_CHECK_BUDGET_MS).then(() => {
        throw new Error("discovery did not answer within the budget");
      }),
    ]);
    return fresh.as.token_endpoint !== meta.as.token_endpoint;
  } catch {
    return true;
  }
}

// Get fresh tokens for the machine, refreshing at most once across all bridges.
// `rejected` is the access token we must not come back with.
export async function refreshShared(
  meta: Meta,
  rejected: string | null,
  proactive: boolean,
  interactive: boolean,
): Promise<Tokens> {
  const deadline = Date.now() + REFRESH_WAIT_MS;
  for (;;) {
    const sibling = usableTokens({ rejected });
    if (sibling) {
      debug("a sibling refreshed the grant — reusing it");
      return sibling;
    }
    // Whoever holds the lock is alive and still working, or we keep losing the
    // grant to a rotating sibling. Either way, presenting our own copy now is
    // the one move that could burn it: we fail this call instead, and the grant
    // stays whole for the next one.
    if (Date.now() > deadline) {
      throw new Error("the shared grant could not be refreshed in time — grant kept, will retry");
    }
    if (acquireRefreshLock()) {
      try {
        const late = usableTokens({ rejected }); // re-read: the wait itself may have settled it
        if (late) {
          debug("a sibling refreshed the grant — reusing it");
          return late;
        }
        if (!interactive && refusalStands()) {
          // Not a new refusal — the machine's standing one; noting it again would
          // stretch the stretch. The human's call still knocks on its own.
          throw new DeadGrantError(
            "the grant stands refused on this machine — the background knock waits for the next stretch or a human's call",
          );
        }
        try {
          const cur = loadStore().tokens;
          if (!cur?.refresh_token) throw new DeadGrantError("no refresh grant on disk");
          const fresh = await refreshOnce(meta, cur, proactive);
          if (fresh) return fresh;
        } catch (e) {
          // Record the verdict under the lock: a sibling waiting on that lock
          // reads the refusal rather than emptiness and does not knock next.
          if (e instanceof DeadGrantError) noteRefusal(e.message);
          throw e;
        }
      } finally {
        releaseRefreshLock();
      }
    } else {
      await sleep(REFRESH_POLL_MS);
    }
  }
}

// A refusal names the client the grant presented. Drop that registration only
// while it is still the machine's: a login may have just been published on a
// newer one, and dropping that would unseat the login under the human (#4794).
function dropRegistration(clientId: string): void {
  if (clientId && loadStore().client?.client_id === clientId) saveStore({ client: null });
}

// The machine's memory of a refused grant. `refused_at` is the latest refusal
// by any caller — the background uses it to decide whether another control
// knock is due; `refused_since` dates the first, for doctor to show.
function noteRefusal(reason: string): void {
  const local = Date.now();
  const first = !loadGrantState().refused_since;
  saveGrantState({ refused_at: local, ...(first ? { refused_since: local, reason } : {}) });
  if (first) grantLog(`grant refused: ${reason}`);
}

// The machine already holds a verdict on this grant, recorded moments ago by
// whoever knocked last; a background knock inside this stretch buys nothing.
export function refusalStands(): boolean {
  const at = loadGrantState().refused_at;
  return !!at && Date.now() - at < REFUSED_KNOCK_MS;
}
