// The verdict a caller actually needs is not "it failed" but "may it have taken
// effect?" — and those are different sentences. A single "retry the call" over
// both is worse than silence: it is advice, and for a write with no version
// guard the advice duplicates the record without a trace.
import { BRIDGE_NAME, RETURN_GATE } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import { BUILD } from "./build.ts";
import { type Outcome, UpstreamError } from "./errors.ts";
import { type ReturnLater } from "./gatestay.ts";
import { log } from "./streams.ts";
import { type JsonRpcMessage } from "./types.ts";

/**
 * A call whose time at the return gate would pass ~20 s (gatestay.ts notPast,
 * #11375): not sent, answered at once with its remaining wait; the seat's return goes on.
 */
export function returnLater(
  id: JsonRpcMessage["id"],
  e: ReturnLater,
  outcome: Outcome = UpstreamError.NOT_SENT,
): JsonRpcMessage {
  const s = Math.max(1, Math.ceil(e.waitMs / 1000));
  log(`return gate: the call is not held — its place is ${e.waitMs} ms away, answered at once`);
  return syntheticError(id, words(RETURN_GATE).returning(s), outcome, "down");
}

export function syntheticError(
  id: JsonRpcMessage["id"],
  message: string,
  outcome: Outcome = UpstreamError.UNKNOWN,
  holdOff: boolean | "wait" | "knock" | "dead" | "human" | "down" = false,
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
              : kind === "down"
                ? // The server is down for the whole machine (downwindow.ts): «retry freely»
                  // here is what dozens of sessions obeying it at once did to a server
                  // that was already down. The call is not queued: nothing sends it later.
                  "The call never reached the server, so nothing was applied — it is not queued: " +
                  "restart nothing and do not retry it now; call again after the wait named above."
                : "The call never reached the server, so nothing was applied — retry freely."
      : "The call went out and its answer was lost, so THE OUTCOME IS UNKNOWN — re-read the target " +
        "before retrying: a blind retry can apply a second time, and a write with no version guard " +
        "duplicates silently." +
        (kind === "down"
          ? " The server is down for the whole machine: restart nothing — nothing repeats the call; call again after the wait named above."
          : "");
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
