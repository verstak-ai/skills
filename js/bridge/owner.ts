// An agent does not take the owner's role (主 svatantra) without the human's word
// (graph @nks/nks-dev, node #6550, rule 2). The role's kind is read only through the
// server's search filter manifested_as="svatantra", taking seqs "(#N," from its lines,
// never its prose, which changes with the locale; there is no machine field for it
// (graph @nks/nks-dev, node #6631). The human's word is the BRIDGE_OWNER_ROLE=1 setting
// of the harness bridge's environment, never an argument of the agent's call.
import { envName, OWNER, tool } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import { envOf, scoped } from "../shared/scope.ts";
import { callTool, short } from "./call.ts";
import { normKarta } from "./names.ts";

export const OWNER_ENV = envName("BRIDGE_OWNER_ROLE");
// The human's own role: the same boundary.
const HUMAN = new Set(["me", "realm-owner"]);
/** The largest page the search tool accepts. */
const OWNERS_PAGE = 100;
/** A role does not change its kind during a session. */
const known = scoped(() => new Map<string, boolean>());

const word = (what: string) => words(OWNER).refused(what, OWNER_ENV);

/** The refusal when karta is the owner's role and the human's setting is absent; otherwise null. */
export async function ownerRefusal(realm: unknown, karta: unknown): Promise<string | null> {
  if (envOf(OWNER_ENV)?.trim() === "1") return null;
  const k = normKarta(karta);
  if (!k || k === "agent") return null;
  if (HUMAN.has(k)) return word(words(OWNER).human(k));
  if (!/^\d+$/.test(k)) return null; // not a seq: the server refuses it itself
  const key = `${String(realm ?? "")}|${k}`;
  let owner = known.get(key);
  if (owner === undefined) {
    const r = await ownersOf(realm, k);
    if (typeof r === "string") return words(OWNER).unread(k, short(r, 160));
    owner = r;
    known.set(key, owner);
  }
  return owner ? word(`karta=#${k}`) : null;
}

/**
 * Is role #k the owner's? Only by the server's kind filter. A failed search or a
 * full page means the kind is unread (the string is why): "retry", no fallback to prose.
 */
async function ownersOf(realm: unknown, k: string): Promise<boolean | string> {
  const s = await callTool(tool("search"), {
    realm,
    q: "",
    node_type: "karta",
    manifested_as: "svatantra",
    limit: OWNERS_PAGE,
    include_description: false,
  });
  if (s.isError) return s.text;
  const seqs = [...s.text.matchAll(/\(#(\d+)[,)]/g)].map((m) => m[1]);
  // A full page may have more behind it: incompleteness by count, not by the reply's phrase.
  if (seqs.length >= OWNERS_PAGE) return words(OWNER).incomplete();
  return seqs.includes(k);
}
