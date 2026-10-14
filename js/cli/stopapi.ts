// The seat's api for `stop` (graph @nks/nks-dev, nodes #7518, #5085; contract — case №669):
// the key of the seat's own server and the order (or the revoke) under it.
import { randomUUID } from "node:crypto";

import { ensureAuth } from "../bridge/auth.ts";
import { CFG } from "../bridge/config.ts";
import { errorMessage } from "../bridge/errors.ts";
import { loadStore } from "../bridge/store.ts";
import { STOP_CLI, type StopCliWords } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import { type PlaceSnapshot } from "../shared/snapshot.ts";

const sw = (): StopCliWords => words(STOP_CLI);
const TIMEOUT_MS = 10_000;

/** One server under two spellings: origin and path, a trailing slash aside. */
export const sameServer = (a: string, b: string): boolean => {
  const at = (u: string): string => {
    const x = new URL(u);
    return `${x.origin}${x.pathname.replace(/\/+$/, "")}`;
  };
  try {
    return at(a) === at(b);
  } catch {
    return false;
  }
};

/**
 * The key of the seat's own server, CFG set to it (a personal token of another server already
 * taken out of it, stop.ts): the personal token, else that server's grant — refreshed the
 * bridge's way when expired; none — the words why, nothing is sent.
 */
export async function keyFor(server: string): Promise<{ token: string } | { why: string }> {
  if (CFG.pat) return { token: CFG.pat };
  if (!loadStore().tokens?.access_token) return { why: sw().noKey(server) };
  try {
    return { token: (await ensureAuth(null, { interactive: false })).access_token };
  } catch (e) {
    return { why: sw().signIn(server, errorMessage(e)) };
  }
}

async function ask(
  url: string,
  method: string,
  realm: string,
  token: string,
  body?: unknown,
): Promise<{ status: number; text: string }> {
  const res = await fetch(url, {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      "x-nks-realm": realm,
      ...(body ? { "content-type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  return { status: res.status, text: (await res.text().catch(() => "")).slice(0, 300) };
}

/** The order (or the revoke) and its outcome in words; true — the seat goes. */
export async function stopSeat(p: PlaceSnapshot, id: string, base: string, token: string) {
  const seat = `${p.name} (${p.realm})`;
  const at = `${base}/standings/${encodeURIComponent(id)}`;
  try {
    const order = await ask(`${at}/stop`, "POST", p.realm, token, {
      reason_code: "person_request",
      client_id: `stop-${randomUUID()}`,
    });
    if (order.status >= 200 && order.status < 300) {
      let orderId = "";
      try {
        const o = JSON.parse(order.text) as { id?: unknown };
        if (typeof o.id === "string") orderId = o.id;
      } catch {
        /* an answer without a body still issued the order */
      }
      return { ok: true, said: sw().ordered(seat, orderId) };
    }
    if (order.status === 410) return { ok: true, said: sw().gone(seat) };
    if (order.status === 401)
      return { ok: false, said: sw().signIn(CFG.serverUrl, `401 ${order.text}`) };
    if (order.status !== 404)
      return { ok: false, said: sw().refused(seat, "stop", order.status, order.text) };
    const revoke = await ask(at, "DELETE", p.realm, token);
    if (revoke.status >= 200 && revoke.status < 300) return { ok: true, said: sw().revoked(seat) };
    if (revoke.status === 410) return { ok: true, said: sw().gone(seat) };
    return { ok: false, said: sw().refused(seat, "revoke", revoke.status, revoke.text) };
  } catch (e) {
    return { ok: false, said: sw().unreachable(seat, (e as Error).message) };
  }
}
