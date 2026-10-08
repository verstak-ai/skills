// An OpenCode session's usage for the seat's attrs (graph @nks/nks-dev, nodes #6271, #6401).
// From service events: session.usage.updated — spent by the session cumulatively, by token
// kind; session.step.started — the step's model; session.step.ended — how much entered the
// window on the step; the window size — the model's limit.context from ctx.model.list().
// To the bridge at most once per DEBOUNCE_MS per session (the bridge decides, bridge/usage.ts);
// a run's end and the session's deletion flush the pending snapshot before the bridge leaves.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { envName, method } from "../delivery/index.ts";
import { type Bridge } from "../shared/bridge-client.ts";

export interface UsagePayload {
  tokens?: number;
  input?: number;
  output?: number;
  cache_read?: number;
  cache_write?: number;
  model?: string;
  context?: number;
  window?: number;
}

const DEBOUNCE_MS = Number(process.env[envName("USAGE_DEBOUNCE_MS")] || 10_000);

const n = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? v : 0);

/** One service report's tokens: new ones (no cache read) are "spent", all input is "in the window". */
const spent = (t: any): number => n(t?.input) + n(t?.output) + n(t?.reasoning) + n(t?.cache?.write);
const inWindow = (t: any): number => n(t?.input) + n(t?.cache?.read) + n(t?.cache?.write);
/** By kind: reasoning is model output. */
const kinds = (t: any): UsagePayload => ({
  input: n(t?.input),
  output: n(t?.output) + n(t?.reasoning),
  cache_read: n(t?.cache?.read),
  cache_write: n(t?.cache?.write),
});

export interface UsageFeed {
  onEvent: (ev: any) => void;
  /** The session's pending snapshot to the bridge now, past the pause; waits for the bridge's answer. */
  flush: (session: string) => Promise<void>;
  forget: (session: string) => void;
  stop: () => void;
}

export function createUsageFeed(opts: {
  listModels: () => Promise<unknown>;
  /** The bridge holding the session's own seat; null — no seat, nowhere to send. */
  bridgeOf: (session: string) => Bridge | null;
}): UsageFeed {
  const bySession = new Map<string, UsagePayload & { ref?: string }>();
  const timers = new Map<string, ReturnType<typeof setTimeout>>();
  const windows = new Map<string, number>(); // "provider/model" → limit.context
  let listed: Promise<void> | null = null;

  const loadWindows = (): Promise<void> =>
    (listed ??= (async () => {
      try {
        const out: any = await opts.listModels();
        const list: any[] = Array.isArray(out) ? out : (out?.data ?? out?.models ?? []);
        for (const m of list) {
          const ctx = n(m?.limit?.context);
          const id = m?.id ?? m?.modelID;
          const prov = m?.providerID ?? m?.provider?.id;
          if (ctx && id) windows.set(`${prov ?? ""}/${id}`, ctx);
        }
      } catch {
        listed = null; // the list did not come — ask again on the next step
      }
    })());

  // Snapshots go one at a time: otherwise the last could overtake the previous and the seat keep old numbers.
  const inFlight = new Map<string, Promise<void>>();
  const send = async (session: string, timeoutMs: number): Promise<void> => {
    const u = bySession.get(session);
    if (!u) return;
    const { ref, ...p } = u;
    if (ref && windows.has(ref)) p.window = windows.get(ref);
    await opts
      .bridgeOf(session)
      ?.request(method("usage"), p, { timeoutMs })
      .catch(() => {});
  };
  const flush = (session: string, timeoutMs = 10_000): Promise<void> => {
    clearTimeout(timers.get(session));
    timers.delete(session);
    // Numbers are taken when sent, not when queued: the last snapshot goes.
    const p = (inFlight.get(session) ?? Promise.resolve()).then(() => send(session, timeoutMs));
    inFlight.set(session, p);
    void p.finally(() => {
      if (inFlight.get(session) === p) inFlight.delete(session);
    });
    return p;
  };
  const schedule = (session: string): void => {
    if (!timers.has(session)) {
      const t = setTimeout(() => void flush(session), DEBOUNCE_MS);
      t.unref?.();
      timers.set(session, t);
    }
  };

  return {
    onEvent(ev: any): void {
      const session: unknown = ev?.data?.sessionID;
      if (typeof session !== "string") return;
      const u = bySession.get(session) ?? {};
      switch (ev?.type) {
        case "session.step.started": {
          const m = ev.data?.model;
          if (m?.id) {
            u.ref = `${m.providerID ?? ""}/${m.id}`;
            u.model = String(m.id);
          }
          void loadWindows();
          break;
        }
        case "session.step.ended":
          if (!ev.data?.tokens) return;
          u.context = inWindow(ev.data.tokens);
          break;
        case "session.usage.updated":
          if (!ev.data?.tokens) return;
          Object.assign(u, { tokens: spent(ev.data.tokens), ...kinds(ev.data.tokens) });
          break;
        default:
          return;
      }
      bySession.set(session, u);
      schedule(session);
    },
    // No pending snapshot — wait for the one in flight: the bridge does not leave the seat before its answer.
    flush: (session) =>
      timers.has(session) ? flush(session, 3_000) : (inFlight.get(session) ?? Promise.resolve()),
    forget(session: string): void {
      clearTimeout(timers.get(session));
      timers.delete(session);
      bySession.delete(session);
    },
    stop(): void {
      for (const t of timers.values()) clearTimeout(t);
      timers.clear();
      bySession.clear();
    },
  };
}

/* eslint-enable @typescript-eslint/no-explicit-any */
