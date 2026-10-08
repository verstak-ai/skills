// Role hooks as fields (graph @nks/nks-dev, node #6637): webhooks[] of the admin
// list_webhooks and user_webhooks answer, by api keys. Hook url and secret stay out.
import { tool } from "../delivery/index.ts";
import { fallback, incomplete, is, isObj } from "./fields.ts";

export interface Hook {
  id?: number;
  kind?: string;
  target_karta_seq?: number;
  active: boolean;
  reaches?: { standing?: string | null; you?: boolean }[];
  /** Whether the hook wakes this session's seat — computed by the api. */
  reaches_you?: boolean;
}

const hook = (v: unknown): Hook | null => {
  if (!isObj(v) || typeof v.active !== "boolean") return null;
  if (!is.num(v.id) || !is.str(v.kind) || !is.num(v.target_karta_seq) || !is.bool(v.reaches_you))
    return null;
  const reaches = v.reaches;
  if (reaches !== undefined) {
    if (!Array.isArray(reaches)) return null;
    if (!reaches.every((r) => isObj(r) && is.strOrNull(r.standing) && is.bool(r.you))) return null;
  }
  // "Wakes me" is the api's word only: without reaches_you and reaches there is nothing to judge by.
  if (v.reaches_you === undefined && reaches === undefined) return null;
  return v as unknown as Hook;
};

/** webhooks[] of a hook list — all well-formed, else null. */
export function hooksField(sc: unknown, action = "list_webhooks"): Hook[] | null {
  const what = `${tool("admin")} ${action}`;
  if (!isObj(sc) || incomplete(sc) || sc.action !== action || !Array.isArray(sc.webhooks))
    return fallback(what, sc);
  const out = sc.webhooks.map(hook);
  return out.every((h) => h) ? (out as Hook[]) : fallback(what, sc);
}

/** Whether the hook wakes this session's seat — reaches_you, else reaches[].you. */
export const reachesYou = (h: Hook): boolean =>
  h.reaches_you ?? (h.reaches ?? []).some((r) => r.you === true);
