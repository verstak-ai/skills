// Session usage in the seat's attrs (graph @nks/nks-dev, nodes #6271, #6401): the
// OpenCode plugin and the pi extension send numbers by method("usage"), the bridge
// puts them under attrs.usage (placefields.ts) and replays its register — at most
// once a minute and only on a notable shift (register is a server call; the numbers move
// every step). The last snapshot bypasses the
// threshold before the seat is left or closed: a closed seat answers 404.
import { envName, method, USAGE } from "../delivery/index.ts";
import { HOSTED_CLIENTS } from "../shared/clients.ts";
import { words } from "../shared/lang.ts";
import { scoped } from "../shared/scope.ts";
import { harnessName } from "./client.ts";
import { isParked } from "./hold.ts";
import { rememberUsage } from "./placefields.ts";
import { replayRegister } from "./standing.ts";
import { log } from "./streams.ts";
import { type Standing, state } from "./transport.ts";
import { type JsonRpcMessage } from "./types.ts";
import { moved, type Usage, usageOf } from "./usagefields.ts";

const MIN_GAP_MS = Number(process.env[envName("USAGE_GAP_MS")] || 60_000);
/** Cap on the last snapshot: the harness kills the bridge after a short grace. */
const FLUSH_CAP_MS = Number(process.env[envName("CASE_LEAVE_MS")]) || 1_500;

const U = scoped(() => ({ published: null as Usage | null, latest: null as Usage | null, at: 0 }));

export const isUsageCall = (msg: JsonRpcMessage): boolean => msg?.method === method("usage");

/** The seat usage goes to: held and not left. */
export function usagePlace(): Standing | null {
  const s = state.standing;
  // After leave, register would rebind the released seat; the numbers ride with the next take.
  return s && !isParked(s.realm, s.karta, s.name ?? "") ? s : null;
}

/** register of the seat with the last snapshot; true — attrs taken. */
async function publish(place: Standing, u: Usage): Promise<boolean> {
  U.at = Date.now();
  const got = await replayRegister(place);
  const ok = !!got && !got.error && !got.result?.isError;
  if (ok) U.published = u;
  else
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
  U.latest = u;
  rememberUsage(u);
  const s = usagePlace();
  const due = !!s && Date.now() - U.at >= MIN_GAP_MS && moved(U.published, u);
  return answer({ pushed: due && s ? await publish(s, u) : false, usage: u });
}

/** The last snapshot, bypassing the threshold, strictly before the seat closes (leave, satellite revoke). */
export async function flushUsage(place: Standing | null): Promise<void> {
  const u = U.latest;
  if (!place || !u || u === U.published) return;
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
