// The open stop orders read (graph @nks/nks-dev, nodes #7509, #7579): GET <api>/me/orders with
// the account's key, page by page by next_since, from the cursor kept in the bridge's home.
import { headers, type Order, TIMEOUT_MS } from "./orderack.ts";
import { readSince, settled, writeSince } from "./orderjournal.ts";

const PAGE = 200;
/** A bound on one read: so many pages of open orders is a fault, not a queue. */
const MAX_PAGES = 50;

/** One page of the account's open stop orders past `since`; null when the api is not reached. */
async function ordersPage(
  base: string,
  since: number,
): Promise<{ orders: Order[]; next: number } | null> {
  try {
    const q = `open=true&limit=${PAGE}${since ? `&since=${since}` : ""}`;
    const res = await fetch(`${base}/me/orders?${q}`, {
      headers: headers(),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { items?: unknown; next_since?: unknown };
    const orders = (Array.isArray(body.items) ? body.items : [])
      .map((x) => x as Record<string, unknown>)
      .filter((x) => typeof x.id === "string" && typeof x.standing_id === "string")
      .map((x) => ({
        id: x.id as string,
        standing_id: x.standing_id as string,
        ...(typeof x.seq === "number" ? { seq: x.seq } : {}),
        ...(typeof x.reason_code === "string" ? { reason_code: x.reason_code } : {}),
        ...(typeof x.by === "string" ? { by: x.by } : {}),
        ...(typeof x.issued_at === "string" ? { issued_at: x.issued_at } : {}),
        ...(typeof x.ack_window_seconds === "number"
          ? { ack_window_seconds: x.ack_window_seconds }
          : {}),
      }));
    const next = typeof body.next_since === "number" ? body.next_since : since;
    return { orders, next };
  } catch {
    return null;
  }
}

/**
 * The account's open stop orders, page by page by next_since while a page brings items; each
 * page goes to `take` as it comes. The read starts at the home's cursor; once what `take`
 * started has ended, the cursor moves over the leading orders settled on this disk
 * (orderjournal.ts readSince) — another session's order holds it where it is.
 */
export async function readOpenOrders(
  base: string,
  take: (orders: Order[]) => Promise<void>[],
): Promise<void> {
  const start = readSince(base);
  const read: Order[] = [];
  const running: Promise<void>[] = [];
  let since = start;
  for (let n = 0; n < MAX_PAGES; n++) {
    const page = await ordersPage(base, since);
    if (!page?.orders.length) break;
    read.push(...page.orders);
    running.push(...take(page.orders));
    if (page.next <= since) break;
    since = page.next;
  }
  await Promise.allSettled(running);
  let floor = start;
  for (const o of read) {
    if (typeof o.seq !== "number" || !settled(o.id)) break;
    floor = Math.max(floor, o.seq);
  }
  if (floor > start) writeSince(base, floor);
}
