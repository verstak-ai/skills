// A harness reads the tool list once, and a server rollout cuts the bridge's session
// silently (graph @nks/nks-dev, node #5405): on a re-opened session the bridge compares
// the served list's print with a fresh one and sends tools/list_changed if they differ.
//
// Within a live HTTP session the server itself puts list_changed into the SSE of the
// answer to every request with an id until the session asks tools/list (#6819): the
// bridge's request or the harness's, the word reaches the harness once until it rereads;
// a call sent before its tools/list cleared the mark may say it again (#6817 allows a
// spare notice). The --tools narrowing is not judged here.
import { createHash } from "node:crypto";

import { scoped } from "../shared/scope.ts";
import { log } from "./streams.ts";
import { type JsonRpcMessage } from "./types.ts";

const LIST_CHANGED = "notifications/tools/list_changed";

const T = scoped(() => ({
  served: null as string | null, // each harness session has its own list
  told: false, // list_changed said, and the harness has not reread yet
  inFlight: 0, // the harness's tools/list in flight (any page)
  listing: new WeakSet<JsonRpcMessage>(), // the harness's tools/list (first page) in flight
  heldBack: new WeakSet<JsonRpcMessage>(), // …in whose answer the server said list_changed
  live: new WeakSet<JsonRpcMessage>(), // …answered to the harness with the server's live list
}));

/** A print of names and schemas: the bridge rewrites descriptions itself, so they are left out. */
export function toolsPrint(result: unknown): string | null {
  const tools = (result as { tools?: { name?: string; inputSchema?: unknown }[] } | null)?.tools;
  if (!Array.isArray(tools)) return null;
  const shape = tools
    .map((t) => [t.name ?? "", JSON.stringify(t.inputSchema ?? null)])
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  return createHash("sha256").update(JSON.stringify(shape)).digest("hex");
}

/**
 * A list was served to the harness (live or cached): remember what it now knows.
 * `liveFor` — the harness's tools/list answered with the server's live list.
 */
export function noteServedTools(result: unknown, liveFor?: JsonRpcMessage): void {
  const print = toolsPrint(result);
  if (!print) return;
  T.served = print;
  T.told = false;
  if (liveFor) T.live.add(liveFor);
}

/** The harness's own tools/list in flight: it gets a fresh list anyway. */
export const harnessListing = (): boolean => T.inFlight > 0;

/**
 * The harness's tools/list goes out. First page: a change announced in its own answer
 * reaches it as the list, and the next change is its again. Returns what to do at its end:
 * the server cleared the mark with this answer, even an error (#6817) — if no live list
 * got through, the held-back word goes to the harness, or it would keep the old one.
 */
export function watchHarnessListing(
  msg: JsonRpcMessage,
  emit: (m: JsonRpcMessage) => void,
): () => void {
  T.inFlight++;
  const first = !msg.params?.cursor;
  if (first) T.listing.add(msg);
  if (first) T.told = false;
  return () => {
    T.inFlight--;
    if (T.heldBack.has(msg) && !T.live.has(msg))
      tell(emit, "the server said its tool list changed, and no fresh list reached the harness");
  };
}

export const isListChanged = (m: JsonRpcMessage): boolean =>
  m?.method === LIST_CHANGED && (m.id === undefined || m.id === null);

function tell(emit: (m: JsonRpcMessage) => void, why: string, again = false): void {
  if (T.told && !again) return; // the harness already knows and has not reread — a repeat adds nothing
  T.told = true;
  log(`${why} — telling the harness (tools/list_changed)`);
  emit({ jsonrpc: "2.0", method: LIST_CHANGED });
}

/**
 * The server said list_changed answering `sent` — the bridge's request or the harness's:
 * to the harness, once per change. The harness's own tools/list brings the new list
 * itself — the word waits to see whether it got through (watchHarnessListing).
 */
export function heardListChanged(sent: JsonRpcMessage, emit: (m: JsonRpcMessage) => void): void {
  if (T.listing.has(sent)) return void T.heldBack.add(sent);
  tell(emit, `the server said its tool list changed (answering ${sent?.method})`);
}

/** The server session re-opened: `ask` the list over it and compare; `emit` tells the harness. */
export async function recheckTools(
  ask: () => Promise<JsonRpcMessage | null>,
  emit: (m: JsonRpcMessage) => void,
): Promise<void> {
  if (!T.served) return; // the harness has not asked for the list yet
  const fresh = toolsPrint((await ask().catch(() => null))?.result);
  if (!fresh || fresh === T.served) return;
  T.served = fresh;
  tell(emit, "tool list changed under the re-opened session", true); // a differing print is always said, as before
}
