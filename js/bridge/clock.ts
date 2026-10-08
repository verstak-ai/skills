import { grantLog, loadStore, saveStore } from "./store.ts";

// --- the server's clock, not ours ------------------------------------------
// Every hour this bridge reasons about — access exp, refresh nbf/exp — is
// stamped by the server's clock, and a machine's own clock is allowed to lie.
// Witnessed in the field: a clock ~28 minutes behind the server made a spent
// access token look fresh (every call bought a 401 first) and a refresh token
// long in force look held back — the exact arithmetic behind a recurring
// "not in force for another 1650s" outage. So the skew is measured off the
// Date header every upstream answer already carries, and every judgement of a
// token's hours goes through now(), which speaks server time. The measurement
// is persisted so a fresh process starts corrected, before its first response.
const SKEW_NOISE_MS = 5_000; // the Date header keeps whole seconds and rides one network leg
const SKEW_MATERIAL_MS = 30_000; // persist and announce only a skew that could move a decision
let clockSkewMs: number | null = null; // server minus local; null until measured or loaded

export function skewMs(): number {
  if (clockSkewMs === null) {
    const s = Number(loadStore().clock_skew_ms);
    clockSkewMs = Number.isFinite(s) ? s : 0;
  }
  return clockSkewMs;
}

export function now(): number {
  return Date.now() + skewMs();
}

export function noteServerDate(
  res: { headers?: { get(name: string): string | null } } | null,
): void {
  const d = Date.parse(res?.headers?.get("date") || "");
  if (!Number.isFinite(d)) return;
  const measured = d - Date.now();
  const skew = Math.abs(measured) < SKEW_NOISE_MS ? 0 : measured;
  const prev = skewMs();
  clockSkewMs = skew;
  if (Math.abs(skew - prev) >= SKEW_MATERIAL_MS) {
    try {
      saveStore({ clock_skew_ms: skew });
    } catch {}
    grantLog(
      skew === 0
        ? "machine clock is back in step with the server"
        : `machine clock is ${Math.round(Math.abs(skew) / 1000)}s ${skew > 0 ? "behind" : "ahead of"} the server` +
            ` — token hours are judged by the server's clock (fix NTP to stop paying a 401 per rotation)`,
    );
  }
}
