// Author/offer/limit and checkout-cover gates shared by execution and dry planning (#9968).
import { existsSync, statSync } from "node:fs";

import { readCover } from "../shared/cover.ts";
import { accountOf, type Launcher, type Launchers } from "./orchestra-launchers.ts";
import type { CheckoutOf } from "./orchestra-orca.ts";
import { LIVE, type Run } from "./orchestra-runs.ts";

type Row = Record<string, unknown>;
const text = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);
const ADAPTER_HARNESSES = new Set(["opencode"]);

export function refusal(row: Row, ls: Launchers, runs: Record<string, Run>): string | null {
  const launcher = text(row.launcher);
  if (!launcher) return "launcher_missing";
  const own = ls.own.get(launcher);
  if (!own) {
    const broken = ls.refused.find((r) => r.what === launcher);
    if (broken) return broken.code;
    const host = ls.elsewhere.get(launcher);
    return host ? `host_elsewhere (${host})` : "launcher_unknown";
  }
  const caller = accountOf(row.author);
  if (!caller) return "caller_unknown";
  if (caller !== ls.account && !own.callers.includes(caller)) return "caller_not_allowed";
  const harness = text(row.harness);
  if (!harness) return "harness_missing";
  const offer = own.harnesses[harness];
  if (!offer) return "harness_not_offered";
  if (!ADAPTER_HARNESSES.has(harness)) return "harness_unsupported";
  const model = text(row.model);
  if (!model) return "model_missing";
  if (!offer.models.includes(model)) return "model_not_offered";
  if (!text(row.repository)) return own.clone ? "clone_refused (no_repository)" : "no_checkout";
  const live = Object.values(runs).filter(
    (r) => r.launcher === launcher && LIVE.includes(r.state),
  ).length;
  return live >= own.limit ? "limit_reached" : null;
}

export function checkoutFor(
  own: Launcher,
  repository: string,
  orca: CheckoutOf,
): string | { code: string } {
  const named = own.checkouts[repository];
  const got = named ? { path: named } : orca(repository);
  if ("code" in got) return got;
  if (!existsSync(got.path) || !statSync(got.path).isDirectory())
    return { code: "checkout_absent" };
  return got.path;
}

export async function coverRefusal(
  worktree: string,
  realm: string,
  karta: number,
  canon: (name: string) => Promise<string | null>,
): Promise<string | null> {
  const c = readCover(worktree);
  if (!c || "why" in c || "foreign" in c) return "checkout_uncovered";
  if (Number(c.karta) !== karta) return "checkout_other_seat";
  const graph = /^r\d+$/i.test(c.realm) ? await canon(c.realm) : c.realm;
  if (!graph) return "checkout_cover_unresolved";
  return graph === realm ? null : "checkout_other_seat";
}
