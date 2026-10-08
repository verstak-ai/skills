// The seat's attrs.usage keys (graph @nks/nks-dev, node #6401): each optional, numbers
// are whole tokens. A snapshot with no number and no model is no usage at all, not zeros.

export interface Usage {
  /** Tokens spent by the session. */
  tokens?: number;
  input?: number;
  output?: number;
  cache_read?: number;
  cache_write?: number;
  /** The last step's model, as the harness names it. */
  model?: string;
  /** Tokens in the context window now. */
  context?: number;
  window?: number;
  /** context / window, whole percent. */
  percent?: number;
  /** When taken, ISO. */
  at: string;
}

const SPENT = ["tokens", "input", "output", "cache_read", "cache_write"] as const;

const num = (v: unknown): number | undefined =>
  typeof v === "number" && Number.isFinite(v) && v >= 0 ? Math.round(v) : undefined;

/** A snapshot from the usage method's params; null — no number and no model. */
export function usageOf(p: Record<string, unknown>): Usage | null {
  const u: Omit<Usage, "at"> = {};
  for (const k of SPENT) {
    const v = num(p[k]);
    if (v !== undefined) u[k] = v;
  }
  if (typeof p.model === "string" && p.model.trim()) u.model = p.model.trim().slice(0, 120);
  const context = num(p.context);
  const window = num(p.window);
  if (context !== undefined) u.context = context;
  if (window) u.window = window;
  if (context !== undefined && window) u.percent = Math.round((100 * context) / window);
  return Object.keys(u).length ? { ...u, at: new Date().toISOString() } : null;
}

/** A shift worth a server call: 5 points of the window, 10% of spent, another window or model. */
export function moved(a: Usage | null, b: Usage): boolean {
  if (!a) return true;
  if (a.percent !== undefined && b.percent !== undefined && Math.abs(b.percent - a.percent) >= 5)
    return true;
  if (b.tokens !== undefined && (a.tokens === undefined || b.tokens >= a.tokens * 1.1 + 1))
    return true;
  return a.window !== b.window || (b.model !== undefined && a.model !== b.model);
}
