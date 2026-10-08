import { now } from "./clock.ts";
import { loadStore } from "./store.ts";
import { type Tokens } from "./types.ts";

interface Claims {
  exp?: number;
  nbf?: number;
  [k: string]: unknown;
}

// Tokens are opaque by contract, so this only ever ASKS — a claim that is not
// there changes nothing. What it buys is the one thing the token endpoint never
// says out loud: when a freshly issued refresh token actually starts working.
export function jwtClaims(token: unknown): Claims | null {
  try {
    return JSON.parse(Buffer.from(String(token).split(".")[1], "base64url").toString()) as Claims;
  } catch {
    return null;
  }
}

// The hours the SERVER keeps. Both tokens carry them when they are JWTs, and
// the server judges by those, never by our arithmetic: `exp` on the access
// token is the moment it stops being accepted; `nbf` on the refresh token is
// the moment it STARTS being accepted — a server may hold a refresh token back
// until the access token it came with is nearly spent (witnessed: Rauthy stamps
// nbf at access expiry minus a minute), and asking earlier is refused in the
// exact words of a dead grant; `exp` on the refresh token is when the grant is
// honestly over and only a human can mend it. Opaque tokens say none of this,
// so `expires_in` remains the fallback — a fallback, not the first source.
const CLOCK_SKEW_MS = 60_000; // stop trusting a token this long before its exp

export interface TokenBody {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}

export function tokenSchedule(
  body: TokenBody,
  refresh: string | undefined,
): Pick<Tokens, "expires_at" | "refresh_not_before" | "refresh_expires_at"> {
  const a = jwtClaims(body.access_token);
  const r = jwtClaims(refresh);
  const accessExp = Number.isFinite(a?.exp)
    ? (a!.exp as number) * 1000
    : body.expires_in
      ? now() + body.expires_in * 1000
      : null;
  // A minute of caution is right for tokens that live for half an hour and
  // absurd for one that lives for thirty seconds: taken whole it would declare
  // every token stale on arrival. Never give up more than half the life.
  const skew = accessExp ? Math.min(CLOCK_SKEW_MS, Math.max(0, (accessExp - now()) / 2)) : 0;
  return {
    expires_at: accessExp ? accessExp - skew : null,
    refresh_not_before: Number.isFinite(r?.nbf) ? (r!.nbf as number) * 1000 : null,
    refresh_expires_at: Number.isFinite(r?.exp) ? (r!.exp as number) * 1000 : null,
  };
}

// The stored hours are a convenience, not the source. A store written by an
// older bridge carries none of them, and a machine mid-upgrade must not have to
// wait for a rotation to start reading the clock right — the token itself has
// said so all along.
export function refreshHours(t: Tokens | null | undefined): {
  nbf: number | null;
  exp: number | null;
} {
  const c = jwtClaims(t?.refresh_token);
  return {
    nbf: Number.isFinite(t?.refresh_not_before)
      ? (t!.refresh_not_before as number)
      : Number.isFinite(c?.nbf)
        ? (c!.nbf as number) * 1000
        : null,
    exp: Number.isFinite(t?.refresh_expires_at)
      ? (t!.refresh_expires_at as number)
      : Number.isFinite(c?.exp)
        ? (c!.exp as number) * 1000
        : null,
  };
}

// The tokens on disk, judged for use here and now: present, not the very token
// we already know is refused, and not inside `marginMs` of expiry.
export function tokenUsable(
  t: Tokens | null | undefined,
  { rejected = null, marginMs = 0 }: { rejected?: string | null; marginMs?: number } = {},
): t is Tokens {
  if (!t?.access_token) return false;
  if (rejected && t.access_token === rejected) return false;
  if (t.expires_at && t.expires_at - now() <= marginMs) return false;
  return true;
}

export function usableTokens(opts?: {
  rejected?: string | null;
  marginMs?: number;
}): Tokens | null {
  const t = loadStore().tokens;
  return tokenUsable(t, opts) ? t : null;
}
