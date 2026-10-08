// The fresh release tag of the delivery (graph @nks/nks-dev, node #6467). The anonymous
// GitHub REST API allows 60 requests an hour per external address, shared by everything
// behind it. The releases page is a fallback around the API; a known limit is remembered
// in the bridge home so no bridge or update subcommand of the machine asks before the
// reset; the same file hands the tag to bridges with another grant directory.
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { BRIDGE_NAME, envName, RELEASES, SKILL_SET } from "../delivery/index.ts";
import { homeBridgePath } from "../shared/home.ts";
import { words } from "../shared/lang.ts";
import { VERSION } from "../shared/version.ts";
import { log } from "./streams.ts";

const rw = () => words(RELEASES);

export const RELEASES_URL =
  process.env[envName("BRIDGE_RELEASES_URL")]?.trim() ||
  `https://api.github.com/repos/${SKILL_SET}/releases/latest`;
/**
 * The releases page is outside the REST API limit: its 302 names the fresh tag. An API
 * pointed elsewhere by the variable has no page fallback — never fall back to production.
 */
export const RELEASES_PAGE_URL: string | null =
  process.env[envName("BRIDGE_RELEASES_PAGE_URL")]?.trim() ||
  (process.env[envName("BRIDGE_RELEASES_URL")]?.trim()
    ? null
    : `https://github.com/${SKILL_SET}/releases/latest`);
/** How long the machine-wide cached tag serves any bridge's background check. */
export const TAG_TTL_MS = 60 * 60 * 1000;
/** The machine-wide tag answer lives in the bridge home, not the grant directory. */
export const releaseTagPath = (): string => join(dirname(homeBridgePath()), "release-tag.json");

export function writeAtomic(path: string, bytes: Buffer | string): void {
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  const tmp = `${path}.tmp-${process.pid}`;
  writeFileSync(tmp, bytes, { mode: 0o644 });
  renameSync(tmp, path);
}

/** A GitHub API refusal by rate limit — saying which limit and when it resets. */
export class RateLimitError extends Error {
  readonly limit: number | null;
  readonly resetAt: number | null;
  constructor(message: string, limit: number | null, resetAt: number | null) {
    super(message);
    this.limit = limit;
    this.resetAt = resetAt;
  }
}

function resetWord(resetAt: number | null): string {
  const min = resetAt ? Math.max(0, Math.ceil((resetAt - Date.now()) / 60_000)) : 0;
  return resetAt ? rw().reset(new Date(resetAt).toISOString(), min) : rw().noReset();
}

function rateLimitWord(limit: number | null, resetAt: number | null): string {
  const per = limit ? rw().perHour(limit) : rw().anyHourly();
  return rw().exhausted(per, resetWord(resetAt));
}

/**
 * Primary limit: 403 with x-ratelimit-remaining: 0, reset in x-ratelimit-reset.
 * Secondary: 403 or 429 with retry-after while the primary remains. 429 with neither —
 * a limit without a named reset. Anything else — null.
 */
function rateLimitOf(res: Response): RateLimitError | null {
  if (res.status !== 403 && res.status !== 429) return null;
  const remaining = res.headers.get("x-ratelimit-remaining");
  const retrySec = Number(res.headers.get("retry-after"));
  if (remaining === "0") {
    const limit = Number(res.headers.get("x-ratelimit-limit")) || null;
    const resetSec = Number(res.headers.get("x-ratelimit-reset"));
    const resetAt =
      resetSec > 0 ? resetSec * 1000 : retrySec > 0 ? Date.now() + retrySec * 1000 : null;
    return new RateLimitError(rateLimitWord(limit, resetAt), limit, resetAt);
  }
  if (retrySec > 0 || res.status === 429) {
    const resetAt = retrySec > 0 ? Date.now() + retrySec * 1000 : null;
    return new RateLimitError(rw().secondary(resetWord(resetAt)), null, resetAt);
  }
  return null;
}

async function tagFromApi(): Promise<string | null> {
  const res = await fetch(RELEASES_URL, {
    headers: { accept: "application/vnd.github+json", "user-agent": `${BRIDGE_NAME}/${VERSION}` },
    signal: AbortSignal.timeout(15_000),
  });
  const limited = rateLimitOf(res);
  if (limited) throw limited;
  if (!res.ok) throw new Error(rw().httpFrom(res.status, RELEASES_URL));
  const body = (await res.json()) as { tag_name?: string };
  return body.tag_name?.trim() || null;
}

/** The page answers 302 to …/releases/tag/<tag>; the redirect is not followed. */
async function tagFromPage(url: string): Promise<string> {
  const res = await fetch(url, {
    redirect: "manual",
    headers: { "user-agent": `${BRIDGE_NAME}/${VERSION}` },
    signal: AbortSignal.timeout(15_000),
  });
  const location = res.headers.get("location") ?? "";
  const m = /\/releases\/tag\/([^/?#]+)/.exec(location);
  if (res.status < 300 || res.status >= 400 || !m)
    throw new Error(rw().noTag(res.status, url, location));
  return decodeURIComponent(m[1] as string);
}

interface ReleaseTag {
  /** The API address this answers for: a bridge pointed elsewhere ignores it. */
  source: string;
  checked_at: number;
  tag: string | null;
  via?: "api" | "page";
  /** The API said "limit exhausted" — no bridge of the machine asks it before the reset. */
  api_limited_until?: number;
  api_limit?: number | null;
}

function readReleaseTag(): ReleaseTag | null {
  try {
    const c = JSON.parse(readFileSync(releaseTagPath(), "utf8")) as ReleaseTag;
    return c.source === RELEASES_URL ? c : null;
  } catch {
    return null;
  }
}

function writeReleaseTag(c: ReleaseTag): void {
  try {
    writeAtomic(releaseTagPath(), JSON.stringify(c, null, 2));
  } catch {
    /* home not writable — each bridge asks itself */
  }
}

/**
 * The fresh tag. The background check takes it from the machine-wide cache while it is
 * under an hour old (force — the update subcommand — always asks). The API is asked
 * first (with the shared cache, about one request an hour); any API failure falls back
 * to the releases page; a known limit keeps the API untouched until its reset.
 */
export async function resolveTag(force: boolean): Promise<string | null> {
  const cached = readReleaseTag();
  const now = Date.now();
  if (!force && cached?.tag && now - cached.checked_at < TAG_TTL_MS) return cached.tag;
  const knownLimit =
    cached?.api_limited_until && now < cached.api_limited_until
      ? new RateLimitError(
          cached.api_limit
            ? rateLimitWord(cached.api_limit, cached.api_limited_until)
            : rw().recordedByOther(resetWord(cached.api_limited_until)),
          cached.api_limit ?? null,
          cached.api_limited_until,
        )
      : null;
  let apiErr: Error | null = knownLimit;
  if (!knownLimit) {
    try {
      const tag = await tagFromApi();
      writeReleaseTag({ source: RELEASES_URL, checked_at: Date.now(), tag, via: "api" });
      return tag;
    } catch (e) {
      apiErr = e as Error;
    }
  }
  const limit = apiErr instanceof RateLimitError ? apiErr : null;
  const limitFields = limit?.resetAt
    ? { api_limited_until: limit.resetAt, api_limit: limit.limit }
    : {};
  if (RELEASES_PAGE_URL) {
    try {
      const tag = await tagFromPage(RELEASES_PAGE_URL);
      log(rw().fromPage(String(apiErr?.message), tag));
      writeReleaseTag({
        source: RELEASES_URL,
        checked_at: Date.now(),
        tag,
        via: "page",
        ...limitFields,
      });
      return tag;
    } catch (e) {
      const both = `${apiErr?.message}; ${rw().fallback()} — ${(e as Error).message}`;
      apiErr = limit ? new RateLimitError(both, limit.limit, limit.resetAt) : new Error(both);
    }
  }
  if (limit?.resetAt)
    writeReleaseTag({
      source: RELEASES_URL,
      checked_at: cached?.checked_at ?? 0,
      tag: cached?.tag ?? null,
      ...(cached?.via ? { via: cached.via } : {}),
      ...limitFields,
    });
  throw apiErr as Error;
}
