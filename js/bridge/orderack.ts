// The api side of a stop order (graph @nks/nks-dev, nodes #7509, #7510, #7579): the answer,
// with the key of the account that opened the seat (the read — orderread.ts). An answer the
// api has not taken is repeated from the journal (orderjournal.ts) until it is taken.
import { envName } from "../delivery/index.ts";
import { scoped } from "../shared/scope.ts";
import {
  ANSWER_WINDOW_MS,
  type OrderEntry,
  type OrderState,
  readOrder,
  unanswered,
  writeOrder,
} from "./orderjournal.ts";
import { log } from "./streams.ts";
import { bearer } from "./transport.ts";

/** An order as the frame and the read carry it. */
export interface Order {
  id: string;
  standing_id: string;
  /** the read's order of commit (api: since) */
  seq?: number;
  reason_code?: string;
  by?: string;
  issued_at?: string;
  ack_window_seconds?: number;
}

/** The end of the order's answer window: issued_at + ack_window, each defaulted. */
export function windowEnd(o: Order, at: number): number {
  const issued = Date.parse(o.issued_at ?? "");
  const seconds = o.ack_window_seconds ?? 0;
  const span = seconds > 0 ? seconds * 1000 : ANSWER_WINDOW_MS;
  return (Number.isFinite(issued) ? issued : at) + span;
}

export const TIMEOUT_MS = 5000;
const RETRY_MS = (process.env[envName("ORDER_RETRY_MS")] || "1000,2000,5000,15000,30000,60000")
  .split(",")
  .map(Number)
  .filter((n) => Number.isFinite(n) && n > 0);

export function headers(): Record<string, string> {
  const h: Record<string, string> = { "content-type": "application/json" };
  const token = bearer();
  if (token) h.authorization = `Bearer ${token}`;
  return h;
}

/**
 * One answer. taken — the api took it, repeated it as a no-op, or holds the order closed
 * (409: its state wins, 404: not this account's) — nothing to repeat; otherwise a later try.
 */
export async function sendAck(
  base: string,
  id: string,
  state: OrderState,
  reason?: string,
): Promise<"taken" | "later"> {
  try {
    const res = await fetch(`${base}/me/orders/${encodeURIComponent(id)}/ack`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        state,
        ...(reason ? { reason_code: reason } : {}),
        client_id: `${id}-${state}`,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const body = await res.text().catch(() => "");
    if (res.ok) return "taken";
    if ([404, 409, 422].includes(res.status)) {
      log(`stop order ${id}: answer ${state} not taken (${res.status}) — ${body.slice(0, 160)}`);
      return "taken";
    }
    log(`stop order ${id}: answer ${state} refused (${res.status}) — repeated later`);
  } catch (e) {
    log(
      `stop order ${id}: answer ${state} did not reach the api (${(e as Error).message}) — repeated later`,
    );
  }
  return "later";
}

/** The outcome is on disk; answer it now and keep answering until the api takes it. */
export async function answerOutcome(e: OrderEntry): Promise<void> {
  if ((await sendAck(e.base, e.id, e.state, e.reason)) === "taken") markTaken(e.id);
  else repeatLater();
}

function markTaken(id: string): void {
  const e = readOrder(id);
  if (e && !e.acked) writeOrder({ ...e, acked: true });
}

const P = scoped(() => ({ timer: null as ReturnType<typeof setTimeout> | null, step: 0 }));

/**
 * Every journal outcome the api has not taken, once more — now and on a growing pause; so too
 * while another live process's accepted waits for its outcome (it may end without one).
 */
export function repeatLater(now = false): void {
  if (P.timer) {
    if (!now) return;
    clearTimeout(P.timer);
  }
  const pause = now ? 0 : RETRY_MS[Math.min(P.step, RETRY_MS.length - 1)];
  P.timer = setTimeout(() => {
    P.timer = null;
    void (async () => {
      const { left, watching } = unanswered();
      let open = watching;
      for (const e of left) {
        if ((await sendAck(e.base, e.id, e.state, e.reason)) === "taken") markTaken(e.id);
        else open = true;
      }
      if (!open) return void (P.step = 0);
      P.step++;
      repeatLater();
    })();
  }, pause);
  P.timer.unref?.();
}
