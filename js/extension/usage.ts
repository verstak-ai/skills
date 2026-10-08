// A pi session's usage for the seat's attrs (graph @nks/nks-dev, nodes #6271, #6401): at the
// end of each turn the window fill (ctx.getContextUsage), the model (ctx.model) and the
// session's spend by token kind (the sum of the model answers' usage in the session's entries)
// go to the bridge by the usage method. The bridge decides whether the shift is worth a server
// call and flushes the last snapshot itself before leaving (bridge/usage.ts).
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

import { method } from "../delivery/index.ts";
import { type Bridge } from "../shared/bridge-client.ts";

const n = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? v : 0);

/** Spent by the session by kind; tokens — new tokens without cache reads (reasoning is in output). */
function spent(entries: readonly any[]): Record<string, number> {
  const s = { input: 0, output: 0, cache_read: 0, cache_write: 0 };
  for (const e of entries) {
    const u = e?.type === "message" && e.message?.role === "assistant" ? e.message.usage : null;
    if (!u) continue;
    s.input += n(u.input);
    s.output += n(u.output);
    s.cache_read += n(u.cacheRead);
    s.cache_write += n(u.cacheWrite);
  }
  return { tokens: s.input + s.output + s.cache_write, ...s };
}

export function setupUsage(pi: ExtensionAPI, live: () => Bridge | null): void {
  pi.on("turn_end", async (_event, ctx) => {
    const bridge = live();
    if (!bridge) return; // no seat — nowhere to send
    const c: any = (ctx as any).getContextUsage?.();
    const p: Record<string, number | string> = spent(
      (ctx as any).sessionManager?.getEntries?.() ?? [],
    );
    const model: unknown = (ctx as any).model?.id;
    if (typeof model === "string" && model) p.model = model;
    if (typeof c?.tokens === "number") p.context = c.tokens;
    if (n(c?.contextWindow)) p.window = c.contextWindow;
    await bridge.request(method("usage"), p, { timeoutMs: 10_000 }).catch(() => {});
  });
}

/* eslint-enable @typescript-eslint/no-explicit-any */
