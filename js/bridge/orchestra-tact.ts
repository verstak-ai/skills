// The tact's reading half (graph @nks/nks-dev, nodes #5042, #8202; the doors #4951 invites
// and #6010 raised): both queues per realm of the boundary, from the daemon's own cursor
// that lies on disk beside the flag. The doors live under the api BESIDE THE CHANNEL (apiBase
// of shared/channel.ts) — a live probe against nks-api 0.130.12 confirmed: the mcp server url
// does not name them, the channel address does; the daemon hands the base in, discovered from
// its live sessions or the hold records on disk (daemon.ts). The realm's own spelling rides
// the REST path, URL-encoded — @owner/slug verified live, bare slug and numeric id also
// answer, rN does not: a short rN of a live place resolves by the realm list the same api
// serves (GET /realms, short_id → @owner/slug), and one the list does not know refuses the tact
// with the boundary named incomplete — a live place's graph never vanishes by its record's
// spelling (#8202, word [27] of №1260). A failed read is not an empty composition: the whole
// tact is refused, no cursor moves, no stop order goes out (#8202). Taking an invite
// (register with spawned_for) and the extinguishing arrive with the raising slice, not here.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { ORCHESTRA, type OrchestraWords } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import { seamRunDir } from "../shared/seam-entrance.ts";
import type { OrchestraAnswer } from "./orchestra-door.ts";

const w = (): OrchestraWords => words(ORCHESTRA);
/** The raised door's own cap (#6010): ?limit ≤ 200. */
const LIMIT = 200;
const TIMEOUT_MS = 10_000;

/** One realm's take of a tact: what stood in the queue, what the tape said, where it ended. */
export interface TactRead {
  realm: string;
  invites: number;
  signals: { cause?: unknown }[];
  cursor: string | null;
}

const cursorsFile = (authDir: string): string =>
  join(seamRunDir(authDir), "orchestra-cursors.json");

interface TactState {
  realms: Record<string, { cursor: string | null; at: string; invites: number; signals: number }>;
}
function readTactState(authDir: string): TactState {
  try {
    const f = JSON.parse(readFileSync(cursorsFile(authDir), "utf8")) as TactState;
    if (f && typeof f === "object" && f.realms && typeof f.realms === "object") return f;
  } catch {
    /* none lies yet — the first tact starts from the tape's beginning */
  }
  return { realms: {} };
}
/** The cursors and last outcomes as they lie — status reads them aloud (#8202). */
export function tactStateOf(authDir: string): TactState {
  return readTactState(authDir);
}

async function getJson(base: string, token: string, path: string): Promise<unknown> {
  const res = await fetch(`${base}${path}`, {
    headers: { authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(String(res.status));
  return res.json();
}
const itemsOf = (v: unknown): unknown[] | null => {
  if (Array.isArray(v)) return v;
  const items = (v as { items?: unknown })?.items;
  return Array.isArray(items) ? items : null;
};

/** A short rN resolves by the realm list the same api serves — GET /realms, short_id →
 * @owner_handle/slug. The boundary keeps every live place's graph whatever its record's
 * spelling; an rN the list does not know is an explicit refusal, never a silent drop. */
async function resolveRealms(
  base: string,
  token: string | null,
  realms: string[],
): Promise<{ realms: string[] } | { unresolved: string; why: string }> {
  const isShort = (r: string): boolean => /^r\d+$/i.test(r.trim());
  const short = realms.filter(isShort);
  if (!short.length) return { realms: [...new Set(realms)] };
  if (!token) return { unresolved: short[0], why: "no key to the server" };
  const listed = itemsOf(await getJson(base, token, `/realms?limit=${LIMIT}`));
  if (!listed) return { unresolved: short[0], why: "realm list is not a list" };
  const canonById = new Map<number, string>();
  for (const it of listed) {
    const x = it as { short_id?: unknown; slug?: unknown; owner_handle?: unknown };
    if (
      typeof x.short_id === "number" &&
      typeof x.slug === "string" &&
      typeof x.owner_handle === "string"
    )
      canonById.set(x.short_id, `@${x.owner_handle}/${x.slug}`);
  }
  const out: string[] = [];
  for (const r of realms) {
    if (!isShort(r)) {
      out.push(r);
      continue;
    }
    const canon = canonById.get(Number(r.trim().slice(1)));
    if (!canon) return { unresolved: r, why: "not in the realm list" };
    out.push(canon);
  }
  return { realms: [...new Set(out)] };
}

/** One realm's both reads; any failure throws — the caller refuses the whole tact. */
async function readRealm(
  base: string,
  token: string,
  realm: string,
  since: string | null,
): Promise<TactRead> {
  const invited = itemsOf(
    await getJson(base, token, `/realms/${encodeURIComponent(realm)}/invites`),
  );
  if (!invited) throw new Error("invites: not a list");
  const q = new URLSearchParams({ limit: String(LIMIT) });
  if (since) q.set("since", since);
  const raised = (await getJson(
    base,
    token,
    `/realms/${encodeURIComponent(realm)}/raised?${q}`,
  )) as {
    cursor?: unknown;
  };
  const tape = itemsOf(raised);
  if (!tape) throw new Error("raised: not a list");
  const cursor =
    typeof raised.cursor === "string" && raised.cursor ? raised.cursor : (since ?? null);
  return { realm, invites: invited.length, signals: tape as TactRead["signals"], cursor };
}

/** The causes of one tape as the api words them — counts, not prose. */
function causesOf(signals: { cause?: unknown }[]): string {
  const counts = new Map<string, number>();
  for (const s of signals) {
    const cause = typeof s.cause === "string" ? s.cause : "?";
    counts.set(cause, (counts.get(cause) ?? 0) + 1);
  }
  return [...counts].map(([cause, n]) => `${cause} ${n}`).join(", ");
}

/**
 * One tact of reading: every boundary realm's queues from their cursors — short forms of
 * live places resolved first, an unresolved one refusing whole. The base is the api
 * beside the channel, handed in by the daemon — "" means unknown, and the tact is refused
 * aloud, never guessed from the mcp server url. All reads first, then all writes — a realm
 * that fails holds every realm's cursor where it lay (#8202: the tact is refused whole,
 * never half-passed).
 */
export async function stepTact(
  authDir: string,
  base: string,
  token: string | null,
  realms: string[],
  gone?: { gone: boolean },
): Promise<OrchestraAnswer> {
  if (!base) return { ok: false, said: w().stepNoApi() };
  let boundary = [...new Set(realms)];
  if (boundary.some((r) => /^r\d+$/i.test(r.trim()))) {
    try {
      const resolved = await resolveRealms(base, token, boundary);
      if ("unresolved" in resolved)
        return { ok: false, said: w().stepUnresolvedRealm(resolved.unresolved, resolved.why) };
      boundary = resolved.realms;
    } catch (e) {
      const first = boundary.find((r) => /^r\d+$/i.test(r.trim())) ?? "?";
      return { ok: false, said: w().stepUnresolvedRealm(first, (e as Error).message) };
    }
  }
  const state = readTactState(authDir);
  const reads: TactRead[] = [];
  for (const realm of boundary) {
    // The caller's refusal was already spoken: a tact that outlives its caller commits
    // nothing — between realms and again before the write, the cursors stay where they lay
    // (#8202; the refusal of a left caller is final, №1317 [19]).
    if (gone?.gone) return { ok: false, said: w().stepGone() };
    try {
      if (!token) throw new Error("no key to the server");
      reads.push(await readRealm(base, token, realm, state.realms[realm]?.cursor ?? null));
    } catch (e) {
      return { ok: false, said: w().stepReadError(realm, (e as Error).message) };
    }
  }
  if (gone?.gone) return { ok: false, said: w().stepGone() };
  const at = new Date().toISOString();
  for (const r of reads)
    state.realms[r.realm] = {
      cursor: r.cursor,
      at,
      invites: r.invites,
      signals: r.signals.length,
    };
  try {
    mkdirSync(seamRunDir(authDir), { recursive: true, mode: 0o700 });
    writeFileSync(cursorsFile(authDir), JSON.stringify(state) + "\n", { mode: 0o600 });
  } catch (e) {
    return { ok: false, said: w().doorError((e as Error).message) };
  }
  return {
    ok: true,
    said: w().step(
      reads
        .map((r) => w().tactRealm(r.realm, r.invites, r.signals.length, causesOf(r.signals)))
        .join("; "),
    ),
  };
}
