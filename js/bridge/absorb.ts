// What the bridge takes from proxied channel replies: connect/mint and its own
// revoke/close (graph @nks/nks-dev, nodes #4233, #5033, #5012). The socket secret is
// cut out, holding goes to hold.ts; an own revoke releases the seat quietly.
import { ABSORB, tool } from "../delivery/index.ts";
import { statusUrl as deriveStatusUrl } from "../shared/channel.ts";
import { words } from "../shared/lang.ts";
import {
  besideKeyIn,
  holdStanding,
  releaseStanding,
  setClosingOwn,
  setRevokingOwn,
} from "./hold.ts";
import { holdWords } from "./holdwords.ts";
import { listenBlock } from "./listen.ts";
import { dropExtra, extraIn, extraPlaces } from "./places.ts";
import { otherRealm } from "./realms.ts";
import { rememberedPlace, replyText } from "./standing.ts";
import { log } from "./streams.ts";
import { type Standing, state } from "./transport.ts";
import { type JsonRpcMessage } from "./types.ts";

const SOCKET_RE =
  /wss:\/\/[^\s"'`<>)\]]+|ws:\/\/(?:127\.0\.0\.1|\[?::1\]?|localhost)(?::\d+)?\/[^\s"'`<>)\]]+/;
const STATUS_RE = /https?:\/\/[^\s"'`<>)\]]+\/channel\/status\/[^\s"'`<>)\]]+/;
const trim = (s: string): string => s.replace(/[.,;:!?»"')\]]+$/, "");

/**
 * The secret never leaves the bridge (graph @nks/nks-dev, nodes #4233, #5033):
 * socket and status addresses are cut from the reply, so no harness door can
 * take the socket from the agent itself.
 */
const hideAddresses = (text: string): string =>
  text
    .replace(new RegExp(SOCKET_RE.source, "g"), words(ABSORB).socketHidden())
    .replace(new RegExp(STATUS_RE.source, "g"), words(ABSORB).statusHidden());

/**
 * A connect/mint reply passed through the bridge: hold its socket and append what
 * the server cannot know — the exact listen command and the busy-file path.
 */
export function absorbChannelReply(msg: JsonRpcMessage, reply: JsonRpcMessage): JsonRpcMessage {
  const a = msg?.params?.arguments;
  if (msg?.params?.name !== tool("channel")) return reply;
  if (a?.action !== "connect" && a?.action !== "mint") return reply;
  if (reply?.error || reply?.result?.isError) return reply;
  const text = replyText(reply);
  const socket = SOCKET_RE.exec(text)?.[0];
  if (!socket) return reply;
  const status = STATUS_RE.exec(text)?.[0];
  if (a.realm && a.karta != null) {
    // A connect that names a seat holds key, socket and busy file under THAT name,
    // even if the bridge held another before: the label must not lie.
    state.standing = rememberedPlace(a.realm, a.karta, a.name); // normalized, as register does
  }
  holdStanding(trim(socket), status ? trim(status) : deriveStatusUrl(trim(socket)));
  const block = listenBlock() ?? "";
  const content = reply.result?.content;
  if (Array.isArray(content)) {
    for (const c of content) if (typeof c?.text === "string") c.text = hideAddresses(c.text);
    content.push({ type: "text", text: block.trim() });
  }
  return reply;
}

/**
 * An own revoke (of the standing the bridge holds) is not a dead token: the socket
 * is released before close 4001 arrives and the binding forgotten, otherwise the
 * holder announces "token dead, call connect" and an obedient agent recreates the
 * seat it just revoked (witnessed in pi and OpenCode). The server reply passes as is.
 */

/** Whether this call revokes the standing the bridge holds. */
function revokesOwn(msg: JsonRpcMessage): boolean {
  const a = msg?.params?.arguments;
  if (msg?.params?.name !== tool("channel") || a?.action !== "revoke") return false;
  const s = state.standing;
  if (!s || besideKeyIn(a.realm)) return false; // another graph's seat is revoked alone (absorbRevokeReply)
  return names(a, s) && !otherRealm(a.realm, s.realm);
}

/** Whether revoke names this seat — empty, "mine", the name or full address — and its role. */
function names(a: Record<string, unknown>, s: Standing): boolean {
  const asked = typeof a.standing === "string" ? a.standing.trim() : "";
  const own =
    asked === "" ||
    asked === "mine" ||
    asked === (s.name ?? "") ||
    asked.endsWith(`:${s.name ?? ""}`);
  return own && String(a.karta ?? s.karta) === String(s.karta);
}

/**
 * Before sending an own revoke/close: close 4001 arrives on the socket before the
 * HTTP reply, and without this mark the bridge would declare the token dead.
 */
export function expectOwnRevoke(msg: JsonRpcMessage): void {
  if (revokesOwn(msg)) setRevokingOwn(true);
  if (closesOwn(msg)) setClosingOwn(true);
}

/**
 * An own close — the channel of the seat the bridge holds, with all its seats: like
 * an own revoke, not a dead token (graph @nks/nks-dev, node #6634).
 */
function closesOwn(msg: JsonRpcMessage): boolean {
  const a = msg?.params?.arguments;
  if (msg?.params?.name !== tool("channel") || a?.action !== "close") return false;
  const s = state.standing;
  return !!s && (!otherRealm(a.realm, s.realm) || !!besideKeyIn(a.realm)); // a beside seat's graph is the same channel
}

/**
 * The call ended without its reply absorbed (failed, refused by transport): clear the
 * own revoke/close mark, or the next real dead token would be released quietly.
 */
export function settleOwnRevoke(msg: JsonRpcMessage): void {
  if (msg?.params?.name !== tool("channel")) return;
  const action = msg.params.arguments?.action;
  if (action === "revoke") setRevokingOwn(false);
  if (action === "close") setClosingOwn(false);
}

export function absorbCloseReply(msg: JsonRpcMessage, reply: JsonRpcMessage): JsonRpcMessage {
  if (msg?.params?.name !== tool("channel") || msg?.params?.arguments?.action !== "close")
    return reply;
  setClosingOwn(false);
  // 4001 overtook the reply — the seat is already released (hold.ts).
  if (reply?.error || reply?.result?.isError || !closesOwn(msg)) return reply;
  releaseStanding(holdWords().closedOwn(), true, false, true);
  state.standing = null;
  state.standingSession = null;
  log("channel closed by this session — released quietly, binding forgotten");
  return reply;
}

export function absorbRevokeReply(msg: JsonRpcMessage, reply: JsonRpcMessage): JsonRpcMessage {
  if (msg?.params?.name !== tool("channel") || msg?.params?.arguments?.action !== "revoke")
    return reply;
  setRevokingOwn(false);
  const a = msg.params.arguments;
  if (reply?.error || reply?.result?.isError) {
    // The server keeps the channel's main seat while other graphs' seats stand on it
    // (graph @nks/nks-dev, nodes #5186, #5838): say what holds the channel.
    const held = extraPlaces().map((p) => p.door.key);
    const content = reply.result?.content;
    if (revokesOwn(msg) && held.length && Array.isArray(content))
      content.push({
        type: "text",
        text: words(ABSORB).mainSeatHeld(state.standing?.name, held.join(", ")),
      });
    return reply;
  }
  const beside = extraIn(a.realm);
  if (beside && names(a, beside.standing)) {
    // Another graph's seat revoked by us: drop its door and record, the channel stays (#5838).
    dropExtra(beside.door.key, holdWords().revokedOwn(), true, true);
    return reply;
  }
  if (!revokesOwn(msg)) return reply;
  const name = state.standing?.name ?? "unnamed";
  releaseStanding(holdWords().revokedOwn(), true, false, true);
  state.standing = null;
  state.standingSession = null;
  log(`standing revoked by this session — released quietly, binding forgotten (${name})`);
  return reply;
}
