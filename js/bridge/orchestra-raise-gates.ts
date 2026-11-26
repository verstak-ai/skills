// Author/offer/limit and checkout-cover gates shared by execution and dry planning (#9968).
import { existsSync, statSync } from "node:fs";

import { SPAWN_LINE } from "../delivery/index.ts";
import { readCover } from "../shared/cover.ts";
import type { Launcher } from "./orchestra-launchers.ts";
import type { CheckoutOf } from "./orchestra-orca.ts";

/** The checkout the description names as this graph's role's home (#10598): the call raises
 * there, and the seat takes the call's role, not the cover's. */
export const homeOf = (own: Launcher, realm: string, karta: number): string | undefined =>
  own.homes?.[`${realm}#${karta}`];

/** A dsh task's first line when the role is raised in its home: the pair with the role, the
 * same line OpenCode's prompt opens with (orchestra-start.ts), read by the dsh plugin's root
 * seating (#11076). Elsewhere none — the pair rides the environment alone (#10777). */
export function homeLine(
  own: Launcher,
  r: { realm: string; karta: number; invite: number; room: string },
): string {
  if (!homeOf(own, r.realm, r.karta)) return "";
  return `${SPAWN_LINE} ${JSON.stringify({ invite: r.invite, room: r.room, karta: r.karta })} `;
}

export function checkoutFor(
  own: Launcher,
  repository: string,
  orca: CheckoutOf,
  home?: string,
): string | { code: string } {
  const named = home ?? own.checkouts[repository];
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
  home = false,
): Promise<string | null> {
  const c = readCover(worktree);
  if (!c || "why" in c || "foreign" in c) return "checkout_uncovered";
  if (!home && Number(c.karta) !== karta) return "checkout_other_seat";
  const graph = /^r\d+$/i.test(c.realm) ? await canon(c.realm) : c.realm;
  if (!graph) return "checkout_cover_unresolved";
  return graph === realm ? null : "checkout_other_seat";
}
