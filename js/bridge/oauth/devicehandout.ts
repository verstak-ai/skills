import { readFileSync, renameSync, writeFileSync } from "node:fs";

import { AuthPending, errorMessage } from "../errors.ts";
import { log } from "../streams.ts";
import { type Meta } from "../types.ts";
import { type AuthLock, authLockPath } from "./authlock.ts";
import { type DeviceCode, issueDeviceCode } from "./devicecode.ts";

// The login's record is written only by the bridge holding its port, so a
// fresh code a joining caller asked for goes beside it, under the login's
// state; the device side takes it up from there (device.ts) and writes it into
// the record itself.
const freshPath = (): string => `${authLockPath()}.device`;

/** A code a caller issued for this login, if one is there. */
export function callerCode(state: string | undefined): DeviceCode | undefined {
  try {
    const f = JSON.parse(readFileSync(freshPath(), "utf8")) as {
      state?: string;
      code?: DeviceCode;
    };
    return state && f.state === state ? f.code : undefined;
  } catch {
    return undefined;
  }
}

/** The later-dying of two codes of one login. */
const later = (a?: DeviceCode, b?: DeviceCode): DeviceCode | undefined =>
  !a || (b && b.expires_at > a.expires_at) ? b : a;

/**
 * What a caller joining a login hands out: its loopback link and, while one
 * stands, the same login's code for sign-in from another device (#6570). A
 * code is handed out to its very end and replaced only once dead: it goes to
 * the human through an agent, and the link they were given must still be the
 * polled one when they open it — a code replaced early is one they open dead.
 * None offered because the server has no client for it — the word why.
 */
export async function joinedPending(
  meta: Meta,
  l: AuthLock & { authorize_url: string },
  note?: string,
): Promise<AuthPending> {
  const stale = later(l.device, callerCode(l.state));
  const device = stale && stale.expires_at <= Date.now() ? await renewed(meta, l, stale) : stale;
  return new AuthPending(l.authorize_url, note, device ?? l.device_unset);
}

async function renewed(
  meta: Meta,
  l: AuthLock,
  stale: DeviceCode,
): Promise<DeviceCode | undefined> {
  const alive = (c: DeviceCode | undefined): DeviceCode | undefined =>
    c && c.expires_at > Date.now() ? c : undefined;
  let code: DeviceCode;
  try {
    code = await issueDeviceCode(meta, stale.client_id);
  } catch (e) {
    log(`no fresh code for sign-in from another device: ${errorMessage(e)}`);
    return alive(stale);
  }
  // Another caller's fresh code, put there meanwhile, wins; this one is dropped unseen.
  const other = callerCode(l.state);
  if (other && other.device_code !== stale.device_code) return alive(other);
  const fresh = { ...code, interval_ms: Math.max(code.interval_ms, stale.interval_ms) };
  const tmp = `${freshPath()}.tmp-${process.pid}`;
  try {
    writeFileSync(tmp, JSON.stringify({ state: l.state, code: fresh }), { mode: 0o600 });
    renameSync(tmp, freshPath());
  } catch (e) {
    log(`fresh code for sign-in from another device not kept: ${errorMessage(e)}`);
    return alive(stale);
  }
  return fresh;
}
