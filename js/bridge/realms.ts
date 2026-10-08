// One graph, one name (graph @nks/nks-dev, node #5838). A graph is written as
// @owner/slug, a short id rN or a bare slug; only the canonical @owner/slug is
// compared, and an unresolved name is itself, never "the same graph". The short id
// is learnt from hello first (places.ts), the graph list is the fallback.

import { REALMS } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import { scoped } from "../shared/scope.ts";

// Per session (shared/scope.ts): daemon sessions may have different servers and accounts.
const aliases = scoped(() => new Map<string, string>()); // rN or slug → @owner/slug
const R = scoped(() => ({ listing: null as Promise<void> | null })); // one list read in flight for all waiters

const CANON_RE = /@[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+/;
const trimmed = (r: unknown): string => String(r ?? "").trim();

/** The canonical @owner/slug; an unresolved name stays itself (and equals nothing else). */
export function canonRealm(r: unknown): string {
  const t = trimmed(r);
  if (t.startsWith("@")) return t;
  return aliases.get(t) ?? t;
}

export const resolvedRealm = (r: unknown): boolean => canonRealm(r).startsWith("@");

/**
 * Same spelling — same graph; otherwise only canonical forms are compared, and a
 * name not resolved to @owner/slug gives "unknown": the call refuses aloud (#5838).
 */
export function realmRelation(a: unknown, b: unknown): "same" | "other" | "unknown" {
  const x = trimmed(a);
  const y = trimmed(b);
  if (x && x === y) return "same";
  if (!resolvedRealm(x) || !resolvedRealm(y)) return "unknown";
  return canonRealm(x) === canonRealm(y) ? "same" : "other";
}

export const sameRealm = (a: unknown, b: unknown): boolean => realmRelation(a, b) === "same";

/** Surely another graph: both named and resolved to different @owner/slug. */
export const otherRealm = (a: unknown, b: unknown): boolean =>
  !!trimmed(a) && !!trimmed(b) && realmRelation(a, b) === "other";

/** Unknown whether the same graph: the call refuses, it does not guess. */
export const unknownRealm = (a: unknown, b: unknown): boolean =>
  !!trimmed(a) && !!trimmed(b) && realmRelation(a, b) === "unknown";

/** The refusal on an unresolved graph name; held — the bridge's seats in canonical form. */
export const unresolvedWord = (realm: unknown, held: string[]): string =>
  words(REALMS).unresolved(trimmed(realm), held.join(", "));

export function learnRealm(alias: unknown, canonical: string): void {
  const t = trimmed(alias);
  if (t && !t.startsWith("@") && CANON_RE.test(canonical)) aliases.set(t, canonical);
}

/**
 * Parse the realm tool's action="list" text; a graph line is
 * `    @owner/slug  rN  name · date` (four spaces, two between fields).
 * A bare slug is a name too when it is alone in the list.
 */
const LIST_LINE_RE = /^ {4}(@[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+) {2}(r\d+) {2}.* · /;
export function learnRealmList(text: string): void {
  const slugs = new Map<string, string[]>();
  for (const line of text.split("\n")) {
    const m = LIST_LINE_RE.exec(line);
    if (!m) continue;
    const [, c, short] = m;
    learnRealm(short, c);
    const slug = c.replace(/^@[^/]+\//, "");
    slugs.set(slug, [...new Set([...(slugs.get(slug) ?? []), c])]);
  }
  for (const [slug, cs] of slugs) if (cs.length === 1) learnRealm(slug, cs[0]);
}

/**
 * Resolve graph names: any unresolved one re-reads the graph list (the graph may
 * have appeared since), so a negative answer is not kept. `list` calls the realm list.
 */
export async function resolveRealms(
  names: unknown[],
  list: () => Promise<string | null>,
): Promise<void> {
  const open = names.map(trimmed).filter((t) => t && !resolvedRealm(t));
  if (!open.length) return;
  R.listing ??= list()
    .then(
      (text) => {
        if (text) learnRealmList(text);
      },
      () => {},
    )
    .finally(() => {
      R.listing = null;
    });
  await R.listing;
}
