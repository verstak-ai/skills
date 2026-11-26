// The orchestrator's own account and a call's author (graph @nks/nks-dev, #11011, #5042): the
// account is its id — the whoami text's «id <uuid>» line, when the server prints it; a handle
// only when the account has one. A call's author is author_user_id; an older api without it —
// the handle of the author's seat address. Own is a matching id; a handle decides only where an
// id is missing on either side.
import { tool } from "../delivery/index.ts";
import type { McpSession } from "../shared/mcpsession.ts";

export interface Account {
  /** The account's id (UUID), lower case; "" — the api did not name it (older api). */
  id: string;
  /** The account's handle without "@", lower case; "" — none. */
  handle: string;
}

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const text = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

/** The account of a seat address @handle or @handle:name, lower case; anything else — null. */
export function accountOf(address: unknown): string | null {
  if (typeof address !== "string") return null;
  const m = /^@([^\s:@/]+)(?::\S*)?$/.exec(address.trim());
  return m ? m[1].toLowerCase() : null;
}

/**
 * The key's account from the "me" tool's whoami text: the id from its «id <uuid>» line, when
 * the server prints it, the handle from «… handle @name …» (live 09.11.2026). Neither —
 * account_unknown.
 */
export async function readAccount(s: McpSession): Promise<Account> {
  const me = await s.call(tool("me"), { action: "whoami" });
  return accountOfWhoami(me);
}

/** The account a whoami text names; neither id nor handle — throws account_unknown. */
export function accountOfWhoami(me: string): Account {
  const id = /(?:^|[\s·(])id\s+([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\b/im
    .exec(me)?.[1]
    ?.toLowerCase();
  const handle = /\bhandle @([^\s:@/()·]+)/.exec(me)?.[1]?.toLowerCase() ?? "";
  if (!id && !handle) throw new Error("account_unknown");
  return { id: id ?? "", handle };
}

/** A call's author: its account id and the handle of its seat address, either may be missing. */
export function authorOf(source: Record<string, unknown>): Account | null {
  const id = UUID.test(text(source.author_user_id))
    ? text(source.author_user_id).toLowerCase()
    : "";
  const handle = accountOf(source.author) ?? "";
  return id || handle ? { id, handle } : null;
}

/** The author is the account itself: by id when both carry one, else by handle; unknown — null. */
export function sameAccount(a: Account, b: Account): boolean | null {
  if (a.id && b.id) return a.id === b.id;
  if (a.handle && b.handle) return a.handle === b.handle;
  return null;
}

/** A description's callers name the author: by id or by handle. */
export const listed = (callers: string[], a: Account): boolean =>
  (!!a.id && callers.includes(a.id)) || (!!a.handle && callers.includes(a.handle));
