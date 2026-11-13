// Author/offer/limit and checkout-cover gates shared by execution and dry planning (#9968).
import { existsSync, statSync } from "node:fs";

import { readCover } from "../shared/cover.ts";
import type { Launcher } from "./orchestra-launchers.ts";
import type { CheckoutOf } from "./orchestra-orca.ts";

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
