// The bridge's own tool calls (board, connect, register), absorbed like proxied ones;
// an accepted register is remembered by the standing.
import { CALL, tool } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import { scoped } from "../shared/scope.ts";
import { absorbChannelReply } from "./absorb.ts";
import { structuredOf } from "./fields.ts";
import { holdsChannel, ledKey } from "./hold.ts";
import { keyOf } from "./holdrecord.ts";
import { normKarta, normName } from "./names.ts";
import { noteLocaleEcho } from "./placefields.ts";
import { extraIn } from "./places.ts";
import { canonRealm, otherRealm, resolveRealms, unknownRealm, unresolvedWord } from "./realms.ts";
import { openedConcurrently, type Refusal, refusalOf } from "./refusal.ts";
import { OWN_CALL_PREFIX } from "./repeat.ts";
import { noteStanding, replyText } from "./standing.ts";
import { takingSeat } from "./taking.ts";
import { post, state } from "./transport.ts";
import { type JsonRpcMessage } from "./types.ts";

/**
 * One seat per bridge in a graph; a seat in another graph stands beside on the same
 * channel (graph @nks/nks-dev, nodes #5154, #5838). Returns the led key when another
 * seat is asked, else null. Realms compare in canonical @owner/slug form; an unresolved
 * name never gets here (unresolvedRefusal). In another graph the rule compares against
 * the seat this bridge already leads there, if any.
 */
export function leadsOtherPlace(realm: unknown, karta: unknown, name: unknown): string | null {
  const led = ledKey();
  const prim = state.standing;
  if (!led || !prim) return null;
  const ex = extraIn(realm);
  const beside = ex?.door.key;
  const s = ex ? ex.standing : prim;
  if (!ex && otherRealm(realm, prim.realm)) return null;
  const k = normKarta(karta);
  const n = normName(name);
  // "agent" is always own; anything else, "me" included, compares literally
  // (graph @nks/nks-dev, node #5154).
  const sameKarta = k === "agent" || k === String(s.karta);
  return sameKarta && n === (s.name ?? "") ? null : (beside ?? led);
}

/** Resolves the call's and the led seats' realms to @owner/slug with one realm list. */
export async function resolveAgainstLed(realm: unknown): Promise<void> {
  const prim = state.standing;
  if (!prim || !ledKey() || String(realm ?? "").trim() === prim.realm) return;
  await resolveRealms([realm, prim.realm, ...state.places.map((p) => p.realm)], async () => {
    const r = await callTool(tool("realm"), { action: "list" });
    return r.isError ? null : r.text;
  });
}

/** Realms of the led seats, canonical where known. */
export const heldRealms = (): string[] =>
  [state.standing, ...state.places].filter((s) => !!s).map((s) => canonRealm(s?.realm));

/**
 * An unresolved realm name against the led seats is neither "same" (it would block a seat
 * beside) nor "other" (it would bypass the one-seat rule):
 * refuse aloud asking for @owner/slug (graph @nks/nks-dev, nodes #5154, #5838).
 */
export function unresolvedRefusal(realm: unknown): string | null {
  if (!ledKey() || !state.standing) return null;
  const held = [state.standing, ...state.places];
  return held.some((s) => unknownRealm(realm, s.realm))
    ? unresolvedWord(realm, heldRealms())
    : null;
}

/**
 * Who listens on the asked seat; "unknown" — the board did not read, or a direct call reads
 * no board. When not "free", take=true is not advised
 * (graph @nks/nks-dev, node #6706).
 */
export type AskedHearing = "free" | "other" | "unknown";

/** Refusal word, advising by how the asked seat differs from the led one. */
export function otherPlaceWord(
  led: string,
  asked: string,
  sameName = false,
  hearing: AskedHearing = "free",
): string {
  const w = words(CALL);
  const same = sameName ? w.sameNamePrefix() : "";
  const advice =
    hearing !== "free"
      ? same + w.heardAdvice(hearing === "other", asked, led)
      : led === asked
        ? w.sameKeysAdvice()
        : sameName
          ? w.sameNameAdvice()
          : w.takeOtherAdvice();
  const Advice = `${advice.charAt(0).toUpperCase()}${advice.slice(1)}`;
  return w.otherPlace(led, asked, Advice);
}

/**
 * A seat in another graph stands beside only on this bridge's live channel;
 * without it a new connect would silently drop the led seat. Refusal or null.
 */
export function besideRefusal(realm: unknown, how: "stand" | "connect"): string | null {
  const prim = state.standing;
  const led = ledKey();
  if (!led || !prim || !otherRealm(realm, prim.realm)) return null;
  if (how === "stand" && holdsChannel()) return null;
  return how === "connect" ? words(CALL).besideConnect(led) : words(CALL).besideStand(led);
}

const refusal = (msg: JsonRpcMessage, text: string): JsonRpcMessage => ({
  jsonrpc: "2.0",
  id: msg.id,
  result: { isError: true, content: [{ type: "text", text }] },
});

/** Proxied connect/mint/register for another seat while one is led: refused aloud, not swapped silently. */
export function crossPlaceRefusal(msg: JsonRpcMessage): JsonRpcMessage | null {
  if (msg?.method !== "tools/call" || msg.params?.name !== tool("channel")) return null;
  const a = msg.params.arguments ?? {};
  if (!["connect", "mint", "register"].includes(String(a.action))) return null;
  const realm = typeof a.realm === "string" ? a.realm.trim() : "";
  const unresolved = unresolvedRefusal(realm);
  if (unresolved) return refusal(msg, unresolved);
  if (a.action !== "register") {
    const word = besideRefusal(realm, "connect");
    if (word) return refusal(msg, word);
  }
  const karta = normKarta(a.karta ?? state.standing?.karta ?? "");
  const name = normName(a.name);
  const led = leadsOtherPlace(realm, karta, name);
  if (!led) return null;
  const asked = keyOf(realm, karta, name);
  const sameName = name === (state.standing?.name ?? "");
  return refusal(msg, otherPlaceWord(led, asked, sameName, "unknown")); // the board is not read here
}

export interface Answer {
  text: string;
  isError: boolean;
  /** The reply's structuredContent as is, when the server sent one. */
  structured?: unknown;
  /** The server's structured refusal (fields.ts). */
  refusal?: Refusal;
}

let seq = 0;

async function ask(
  name: string,
  args: Record<string, unknown>,
): Promise<{ msg: JsonRpcMessage; got: JsonRpcMessage | null }> {
  const id = `${OWN_CALL_PREFIX}${++seq}`;
  const msg: JsonRpcMessage = {
    jsonrpc: "2.0",
    id,
    method: "tools/call",
    params: { name, arguments: args },
  };
  let reply: JsonRpcMessage | null = null;
  await post(msg, (m) => {
    if (m.id === id) reply = m;
  });
  return { msg, got: reply as JsonRpcMessage | null };
}

/** Seat connect and mint run under the taking intent up to the holding record (taking.ts). */
export const callTool = (name: string, args: Record<string, unknown>): Promise<Answer> =>
  name === tool("channel") ? takingSeat(args, () => answer(name, args)) : answer(name, args);

async function answer(name: string, args: Record<string, unknown>): Promise<Answer> {
  let { msg, got } = await ask(name, args);
  // Seat-open race (409 without rule, refusal.ts): register once more, only once.
  if (name === tool("channel") && args.action === "register" && openedConcurrently(got))
    ({ msg, got } = await ask(name, args));
  if (!got) return { text: words(CALL).noReply(), isError: true };
  const structured = structuredOf(got);
  const refusal = refusalOf(got);
  if (name === tool("channel")) {
    noteLocaleEcho(args, replyText(got), structured);
    if (args.action === "register") noteStanding(msg, got);
    if (args.action === "connect") got = absorbChannelReply(msg, got);
  }
  return {
    text: replyText(got),
    isError: !!got.error || !!got.result?.isError,
    ...(structured !== undefined ? { structured } : {}),
    ...(refusal ? { refusal } : {}),
  };
}

export const short = (s: string, n = 300): string => (s.length > n ? `${s.slice(0, n)}…` : s);

// Seat moves (stand, resume, check) run one at a time, per session
// (graph @nks/nks-dev, node #5140): a stand colliding with a watchdog tick would give two
// holdStanding and a stray released. Daemon sessions do not wait for each other.
const Q = scoped(() => ({ chain: Promise.resolve() as Promise<unknown> }));
export function serialized<T>(fn: () => Promise<T>): Promise<T> {
  const p = Q.chain.then(fn, fn);
  Q.chain = p.then(
    () => undefined,
    () => undefined,
  );
  return p;
}
