// The graph list the api serves beside the channel (GET /realms; the form of nks-api 0.130,
// orchestra-tact.ts): rN by short_id and a bare slug by slug, both to @owner_handle/slug.
// A direct api call outside MCP resolves the graph names it carries by it.

/** short_id → @owner/slug, slug → every @owner/slug of that slug. */
export interface RealmIndex {
  byShort: Map<number, string>;
  bySlug: Map<string, string[]>;
}

/** The index of the list's items; an item without short_id, slug or owner_handle is skipped. */
export function realmIndexOf(listed: unknown[]): RealmIndex {
  const byShort = new Map<number, string>();
  const bySlug = new Map<string, string[]>();
  for (const it of listed) {
    const x = it as { short_id?: unknown; slug?: unknown; owner_handle?: unknown };
    if (typeof x.slug !== "string" || typeof x.owner_handle !== "string") continue;
    const canon = `@${x.owner_handle}/${x.slug}`;
    if (typeof x.short_id === "number") byShort.set(x.short_id, canon);
    bySlug.set(x.slug, [...(bySlug.get(x.slug) ?? []), canon]);
  }
  return { byShort, bySlug };
}

/** rN by its short_id, a bare slug when one graph alone carries it; otherwise null. */
export function canonIn(index: RealmIndex, name: string): string | null {
  const t = name.trim();
  const n = /^r(\d+)$/i.exec(t);
  if (n) return index.byShort.get(Number(n[1])) ?? null;
  const hits = index.bySlug.get(t) ?? [];
  return hits.length === 1 ? hits[0] : null;
}
