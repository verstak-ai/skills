// Launch admission precedes automatic replay or any taking path (#9959).
import { SPAWNED_FOR, tool } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import { parseSpawn, spawnReceipt } from "../shared/spawned-for.ts";
import { claimIdentity, claimReceipt, noteClaimReceipt, noteClaimSeat } from "./claimseat.ts";
import { structuredOf } from "./fields.ts";
import { refusalOf } from "./refusal.ts";
import { claimRefusal, launchBasis, refuseClaim } from "./spawned-for.ts";
import { replyText, seatIsGone } from "./standing.ts";
import { emit } from "./streams.ts";
import { state } from "./transport.ts";
import { type JsonRpcMessage } from "./types.ts";

const refused = (id: JsonRpcMessage["id"], text: string): JsonRpcMessage => ({
  jsonrpc: "2.0",
  id,
  result: { isError: true, content: [{ type: "text", text }] },
});

export function launchAdmission(msg: JsonRpcMessage): JsonRpcMessage | null {
  if (msg.method !== "tools/call") return null;
  const a = msg.params?.arguments;
  const channel = msg.params?.name === tool("channel");
  const blocked = claimRefusal();
  if (blocked && !(channel && ["revoke", "close"].includes(String(a?.action))))
    return refused(msg.id, blocked);
  const stand = msg.params?.name === tool("stand");
  if (!a || !(stand || (channel && ["connect", "register", "mint"].includes(String(a.action)))))
    return null;
  try {
    const basis = launchBasis(a);
    if (basis && !stand && a.action !== "register") throw new Error(words(SPAWNED_FOR).connect());
    if (basis) a.spawned_for = basis;
    return null;
  } catch (e) {
    return refused(msg.id, (e as Error).message);
  }
}

export function refuseLaunch(msg: JsonRpcMessage): boolean {
  const reply = launchAdmission(msg);
  if (reply) emit(reply);
  return reply !== null;
}

/** Proxied register: verify before noteStanding can remember it. */
export function claimReply(msg: JsonRpcMessage, reply: JsonRpcMessage): JsonRpcMessage {
  const a = msg.params?.arguments;
  if (reply.id !== msg.id || msg.params?.name !== tool("channel")) return reply;
  if (a?.action === "connect" && !reply.error && !reply.result?.isError)
    noteClaimSeat(a, structuredOf(reply));
  return claimResult(a ?? {}, reply);
}

/** The api's temporary rules (#9959 v13); an unknown rule is no guess, it stays terminal. */
const BUSY_RULES = new Set(["db_pool_busy", "db_unreachable", "realm_busy"]);

/** A refusal that says nothing about the invitation: no rule with no status or 5xx, or a busy rule. */
function passing(reply: JsonRpcMessage): boolean {
  const r = refusalOf(reply);
  const status = r?.status ?? 0;
  const server = status >= 500 && status < 600;
  if (r?.rule) return BUSY_RULES.has(r.rule) && (server || status === 429);
  return (!status || server) && !seatIsGone(reply);
}

/**
 * Shared by proxied, own and replayed registrations; only the returned pair is proof. `replay` —
 * the bridge's own re-registration: after this target's confirmed claim a passing refusal is the
 * hour's, retried before the next call, and work waits for it (refuseUnbound; #9959).
 */
export function claimResult(
  a: Record<string, unknown>,
  reply: JsonRpcMessage,
  replay = false,
): JsonRpcMessage {
  if (a.action !== "register" || !a.spawned_for) return reply;
  let m = reply;
  if (!m.error && !m.result?.isError) {
    const receipt = spawnReceipt(structuredOf(m), parseSpawn(a.spawned_for), claimIdentity(a));
    if (receipt) noteClaimReceipt(a, receipt);
    else m = refused(reply.id, words(SPAWNED_FOR).echo());
  } else if (replay && claimReceipt(a) && passing(m)) return m;
  if (m.error || m.result?.isError) refuseClaim(replyText(m));
  return m;
}

/** A confirmed claim's seat not yet bound on this session: no call goes without its author. */
export function refuseUnbound(msg: JsonRpcMessage): boolean {
  const a = msg.params?.arguments;
  if (msg.method !== "tools/call" || !state.standing || !claimReceipt(state.standing)) return false;
  if (state.standingSession === state.sessionId) return false;
  if (msg.params?.name === tool("channel") && ["revoke", "close"].includes(String(a?.action)))
    return false;
  emit(refused(msg.id, words(SPAWNED_FOR).unbound()));
  return true;
}
