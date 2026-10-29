// What the dispatcher address answered (graph @nks/nks-dev, node #8620): a WebSocket that failed
// at the upgrade does not say its status, undici publishes it on its diagnostics channel before
// the socket's events. A runtime that publishes nothing (Bun) leaves the answer unknown.
import * as diagnostics from "node:diagnostics_channel";

import { apiBase, FLAP_PAUSES_MS } from "../shared/channel.ts";

const HEADERS = "undici:request:headers";

const watched = new Set<string>();
const answered = new Map<string, number>();
let listening = false;

function listen(): void {
  if (listening) return;
  listening = true;
  diagnostics.subscribe?.(HEADERS, (m: unknown) => {
    const r = m as {
      request?: { origin?: unknown; path?: unknown };
      response?: { statusCode?: unknown };
    } | null;
    const at = `${String(r?.request?.origin ?? "")}${String(r?.request?.path ?? "")}`;
    if (watched.has(at)) answered.set(at, Number(r?.response?.statusCode));
  });
}

/** Watch the upgrade answer of this ws address; the returned call reads it once and stops watching. */
export function watchAnswer(wsUrl: string): () => number | undefined {
  const at = wsUrl.replace(/^ws/, "http");
  listen();
  answered.delete(at);
  watched.add(at);
  return () => {
    watched.delete(at);
    const status = answered.get(at);
    answered.delete(at);
    return status;
  };
}

/**
 * The status of the dispatcher address asked by a plain GET without Upgrade — for an upgrade
 * that failed with no readable code (Bun always, a cut, a proxy breaking it); undefined — no
 * answer at all.
 */
export async function askAnswer(wsUrl: string): Promise<number | undefined> {
  try {
    const r = await fetch(wsUrl.replace(/^ws/, "http"), { signal: AbortSignal.timeout(5000) });
    void r.body?.cancel().catch(() => {});
    return r.status;
  } catch {
    return undefined;
  }
}

/**
 * A failed opening judged (#8620 v19): `none` — no dispatcher: the upgrade answered 404/405, or,
 * its code unreadable on any runtime, the plain GET answered 404 (405 there is the router's
 * answer to a method, not "no dispatcher"). Anything else — a 5xx, a timeout, 426 or 400 to the
 * GET, no answer to it — another try after a pause.
 */
export async function verdictOf(
  wsUrl: string,
  e: { code: number; status: number | undefined; timedOut: boolean },
): Promise<{ none: boolean; why: string }> {
  if (e.status === 404 || e.status === 405)
    return { none: true, why: `the upgrade answered ${e.status}` };
  const plain = e.status === undefined && !e.timedOut ? await askAnswer(wsUrl) : undefined;
  if (plain === 404) return { none: true, why: "the plain GET answered 404" };
  const seen = [e.timedOut ? "timeout" : `refused (${e.code})`, e.status, plain && `GET ${plain}`];
  return { none: false, why: `not reached (${seen.filter(Boolean).join(", ")})` };
}

/** The dispatcher address beside the channel: <apiBase>/channel/mux, ws scheme. */
export const muxUrlOf = (socketUrl: string): string =>
  `${apiBase(socketUrl).replace(/^http/, "ws")}/channel/mux`;

/** A pause of the channel ladder, jittered below its step: never longer than the step. */
export function pauseOf(n: number): number {
  const step = FLAP_PAUSES_MS[Math.min(n, FLAP_PAUSES_MS.length - 1)] ?? 60_000;
  return Math.round(step * (0.8 + 0.2 * Math.random()));
}
