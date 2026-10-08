// Satellite pause for an OpenCode plugin reload (graph @nks/nks-dev, nodes #6625, #6550).
// A reload kills subagent bridges, and a satellite's end leaves its cases and drops the seat.
// The plugin's `suspend` request before a stop: the bridge writes a pause record
// (pauserecord.ts) and goes without leaving cases, seat or busy line; the new
// instance's bridge returns the seat by key (resume.ts) and takes the run's cases,
// leaving them at its own end.
import { method, SUSPEND, tool } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import { callTool as call } from "./call.ts";
import { seedJoined } from "./caseexit.ts";
import { CFG } from "./config.ts";
import { parkStanding, releaseStanding } from "./hold.ts";
import { HOLD_RECORD_MAX_AGE_MS, readHoldRecord } from "./holdrecord.ts";
import { H } from "./holdstate.ts";
import { P, pauseRecord } from "./pauserecord.ts";
import { placeFields } from "./placefields.ts";
import { sleep } from "./store.ts";
import { log } from "./streams.ts";
import { state } from "./transport.ts";
import { type JsonRpcMessage } from "./types.ts";

export { suspended } from "./pauserecord.ts";

/** The `suspend` request — only for a satellite holding a seat; answers the pause record key. */
export function localSuspend(msg: JsonRpcMessage): Promise<JsonRpcMessage> | null {
  if (msg?.method !== method("suspend")) return null;
  const answer = (result: unknown): JsonRpcMessage => ({ jsonrpc: "2.0", id: msg.id, result });
  const s = state.standing;
  // A daemon handover pause becomes the harness's pause (same window re-arm, the busy line
  // waits); the socket already went to the handover.
  const drained = P.kind === "handover";
  if (drained) P.kind = "suspend";
  else if (P.kind && P.answer) return Promise.resolve(answer({ suspended: true, ...P.answer }));
  const key = drained ? (P.answer?.key ?? null) : pauseRecord("suspend");
  if (!key || !s)
    return Promise.resolve(
      answer({
        suspended: false,
        word: words(SUSPEND).noSeat(),
      }),
    );
  return rearmForPause(s, drained).then((rearmed) => {
    if (rearmed) P.write?.();
    log(
      `satellite paused for a plugin reload${drained ? " in the daemon handover" : ""}: ${key}, cases ${P.answer?.cases ?? 0} — place and cases kept, idle window ${rearmed ? `${PAUSE_TTL_S} s` : "unchanged"}`,
    );
    return answer({ suspended: true, ...P.answer });
  });
}

/**
 * The seat's idle window on a pause is the hold record's lifetime (#6550): the
 * satellite window would kill the seat over a longer reload. Only connect sets ttl
 * and it evicts a live socket, so the socket is left first; the bridge holds the new
 * address and writes the record. In a daemon handover (drained) connect evicts the
 * handover's socket and the new one goes to the handover too, with the busy line.
 * On refusal or cap the window stays as it was.
 */
const PAUSE_TTL_S = Math.floor(HOLD_RECORD_MAX_AGE_MS / 1000);
const REARM_CAP_MS = 1_000;

async function rearmForPause(
  s: { realm: string; karta: string | number; name?: string | null },
  drained: boolean,
) {
  const name = s.name ?? "";
  if (!drained && !parkStanding(words(SUSPEND).reason())) return false;
  const args = {
    action: "connect",
    realm: s.realm,
    karta: s.karta,
    name,
    ...placeFields({ realm: s.realm, karta: String(s.karta), name }),
    ttl_seconds: PAUSE_TTL_S,
  };
  // The bridge absorbs the connect answer (absorb.ts): the new address lands in H.
  const connect = call(tool("channel"), args).then((r) => {
    if (!r.isError && H.currentUrl) P.turned = { url: H.currentUrl, statusUrl: H.currentStatusUrl };
    if (drained) {
      // The session is gone: the handover holds the new socket, the record follows the address.
      releaseStanding(words(SUSPEND).reason(), false, false, false, true);
      P.write?.();
    }
    return r;
  });
  P.connect = connect;
  const r = await Promise.race([connect, sleep(REARM_CAP_MS).then(() => null)]);
  if (!r || r.isError)
    log(`satellite pause: idle window not re-armed — ${r?.text ?? "no answer yet"}`);
  return !!r && !r.isError && !!P.turned;
}

/** Re-arm wait at session end, under the harness's grace (OpenCode kills the bridge after 5 s). */
const SETTLE_CAP_MS = 3_000;

/**
 * End of a paused bridge (session.ts): a connect that lost the cap still runs at
 * the server (the address turns while the record keeps the old, dead one; a case entry
 * answered after the pause is not in it), so wait for it and rewrite the record with
 * the fresh address and cases.
 */
export async function pauseSettled(): Promise<void> {
  if (!P.kind) return;
  if (P.connect) await Promise.race([P.connect.catch(() => {}), sleep(SETTLE_CAP_MS)]);
  const turned = !!P.turned && P.turned.url !== P.written;
  P.write?.();
  if (turned)
    log(`satellite pause: the late re-arm turned the address — the pause record follows it`);
}

/** A return by key succeeded: the run's cases from the pause record go to this bridge. */
export function afterResume(key: string | undefined): void {
  if (!CFG.satellite || !key) return;
  seedJoined(readHoldRecord(key)?.cases);
}
