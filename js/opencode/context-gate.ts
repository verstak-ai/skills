// Successful skill loads by the session's own bridge (graph @nks/nks-dev, node #10121).
import { method } from "../delivery/index.ts";
import type { Bridge } from "../shared/bridge-client.ts";
import type { Context } from "./plugin.ts";

export async function setupContextGate(
  ctx: Context,
  opts: {
    bridgeOf: (session: string) => Bridge | null;
    flush: (session: string) => Promise<void>;
  },
): Promise<void> {
  const calls = new Map<string, { bridge: Bridge; session: string; skill: string }>();
  await ctx.tool.hook("execute.before", async (t) => {
    if (t.tool !== "skill") return;
    const session = String(t.sessionID);
    // Flush observed fill before recording the load; never invent a missing host report.
    await opts.flush(session);
    const skill = (t.input as { id?: unknown } | null)?.id;
    const bridge = opts.bridgeOf(session);
    if (!bridge || typeof skill !== "string") return;
    const id = `${session}:${t.id}`;
    if (calls.size >= 128 || calls.has(id)) return;
    try {
      await bridge.request(
        method("usage"),
        { recovery: { phase: "begin", id, skill } },
        { timeoutMs: 3_000 },
      );
      calls.set(id, { bridge, session, skill });
    } catch {
      /* no proof: let the skill load; the write gate remains */
    }
  });
  await ctx.tool.hook("execute.after", async (t) => {
    if (t.tool !== "skill") return;
    const id = `${t.sessionID}:${t.id}`;
    const call = calls.get(id);
    calls.delete(id);
    if (!call || opts.bridgeOf(call.session) !== call.bridge) return;
    const ok = t.status === "completed" && !(t.result as { isError?: unknown })?.isError;
    await call.bridge
      .request(
        method("usage"),
        {
          recovery: { phase: "end", id, skill: call.skill, ok },
        },
        { timeoutMs: 3_000 },
      )
      .catch(() => {});
  });
}
