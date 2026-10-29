// Session usage in the seat's attrs (graph @nks/nks-dev, nodes #6271, #6401): the
// OpenCode plugin and the pi extension send numbers by method("usage"), the bridge
// puts them under attrs.usage (placefields.ts) and replays its register — at most
// once a minute, on a notable usage shift or a changed installed skill set (register is
// a server call; the numbers move every step). Under the dispatcher the numbers go in the
// tact instead (#8617), register only for the skill set. The last snapshot bypasses the
// threshold before the seat is left or closed: a closed seat answers 404.
import { envName, method, USAGE } from "../delivery/index.ts";
import { HOSTED_CLIENTS } from "../shared/clients.ts";
import { words } from "../shared/lang.ts";
import { bindScope, scoped } from "../shared/scope.ts";
import { harnessName } from "./client.ts";
import { isParked } from "./hold.ts";
import { onDispatcher, tickFor } from "./muxhold.ts";
import { rememberUsage } from "./placefields.ts";
import { skillsNeedRegister } from "./skillwatch.ts";
import { replayRegister } from "./standing.ts";
import { statusAddress } from "./statusaddr.ts";
import { log } from "./streams.ts";
import { type Standing, state } from "./transport.ts";
import { type JsonRpcMessage } from "./types.ts";
import { moved, type Usage, usageOf } from "./usagefields.ts";

const MIN_GAP_MS = Number(process.env[envName("USAGE_GAP_MS")] || 60_000);
/** Cap on the last snapshot: the harness kills the bridge after a short grace. */
const FLUSH_CAP_MS = Number(process.env[envName("CASE_LEAVE_MS")]) || 1_500;

const U = scoped(() => ({
  published: null as Usage | null,
  latest: null as Usage | null,
  at: 0,
}));

export const isUsageCall = (msg: JsonRpcMessage): boolean => msg?.method === method("usage");

/** The seat usage goes to: held and not left. */
export function usagePlace(): Standing | null {
  const s = state.standing;
  // After leave, register would rebind the released seat; the numbers ride with the next take.
  return s && !isParked(s.realm, s.karta, s.name ?? "") ? s : null;
}

/** register of the seat with the last snapshot kept (`u`; null — none new); true — attrs taken. */
async function publish(place: Standing, u: Usage | null): Promise<boolean> {
  U.at = Date.now();
  const got = await replayRegister(place, false);
  const ok = !!got && !got.error && !got.result?.isError;
  if (ok) {
    if (u) U.published = u;
  } else
    log(
      `usage: register did not take the attrs this time — ${JSON.stringify(got?.error ?? got?.result ?? null).slice(0, 200)}`,
    );
  return ok;
}

/** `method("usage") {tokens?, input?, output?, cache_read?, cache_write?, model?, context?, window?}`. */
export async function runUsage(msg: JsonRpcMessage): Promise<JsonRpcMessage> {
  const answer = (result: Record<string, unknown>): JsonRpcMessage => ({
    jsonrpc: "2.0",
    id: msg.id,
    result,
  });
  if (!HOSTED_CLIENTS.has(harnessName()))
    return answer({
      pushed: false,
      usage: null,
      why: words(USAGE).notHosted(),
    });
  const u = usageOf((msg.params ?? {}) as Record<string, unknown>);
  if (!u)
    return answer({
      pushed: false,
      usage: null,
      why: words(USAGE).noNumbers(),
    });
  const s = usagePlace();
  const gap = !!s && Date.now() - U.at >= MIN_GAP_MS;
  const bytes = Buffer.byteLength(JSON.stringify(u));
  if (bytes > USAGE_MAX) {
    // Over the contract's limit the snapshot goes nowhere — neither the tact nor a register — and
    // is not kept for the next register; a changed skill set still registers, with the last
    // snapshot within the limit, if any (#8620).
    log(`usage: ${bytes} bytes, over ${USAGE_MAX} — not sent, not kept`);
    if (gap && s && skillsNeedRegister(s)) await publish(s, null);
    return answer({ pushed: false, usage: u, why: words(USAGE).tooLarge(USAGE_MAX) });
  }
  U.latest = u;
  rememberUsage(u);
  const tact = !!s && byTact(u);
  // register stays for a changed skill set; the numbers it no longer carries under the dispatcher.
  const due = gap && ((!tact && moved(U.published, u)) || (!!s && skillsNeedRegister(s)));
  const registered = due && s ? await publish(s, u) : false;
  return answer({ pushed: tact || registered, usage: u });
}

const numbers = (u: Usage | null): string => JSON.stringify({ ...u, at: null });

/** The contract's limit of a usage object, bytes (#8620); the variable — a probe seam, only lower. */
const USAGE_MAX = Math.min(Number(process.env[envName("USAGE_MAX_BYTES")]) || 2048, 2048);

/**
 * Under the dispatcher the numbers go in the daemon's tact (graph @nks/nks-dev, nodes #8617,
 * #8620): every change, merged till the tact, no register for them; the leaving seat's last
 * numbers go in its leaving tick. False — a socket per seat: register, as before.
 */
function byTact(u: Usage): boolean {
  const addr = statusAddress();
  if (!addr || !onDispatcher(addr.url)) return false;
  if (numbers(u) === numbers(U.published)) return true;
  if (
    !tickFor(
      addr.url,
      addr.standingId,
      { usage: { ...u } },
      bindScope(() => fellBack(u)),
    )
  )
    return false;
  U.published = u;
  return true;
}

/** Numbers held for hello on a channel that fell back to a socket: by register, as there. */
function fellBack(u: Usage): void {
  if (U.published === u) U.published = null;
  const s = usagePlace();
  if (s) void publish(s, U.latest ?? u).catch(() => {});
}

/** The last snapshot, bypassing the threshold, strictly before the seat closes (leave, satellite revoke). */
export async function flushUsage(place: Standing | null): Promise<void> {
  const u = U.latest;
  if (!place || !u || (u === U.published && !skillsNeedRegister(place))) return;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const cap = new Promise<"cap">((r) => (timer = setTimeout(() => r("cap"), FLUSH_CAP_MS)));
  // A network failure on the last snapshot does not break the end: the seat goes without it.
  const sent = publish(place, u).catch((e: Error) => {
    log(`usage: the last snapshot did not land before the place went — ${e.message}`);
    return false;
  });
  const got = await Promise.race([sent, cap]);
  clearTimeout(timer);
  if (got === "cap")
    log(`usage: the last snapshot exceeded ${FLUSH_CAP_MS} ms before the place went`);
}
