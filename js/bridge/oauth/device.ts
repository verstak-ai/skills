import { envName } from "../../delivery/index.ts";
import { errorMessage, TokenError } from "../errors.ts";
import { debug, log } from "../streams.ts";
import { type Meta } from "../types.ts";
import { codeThrough, DeviceUnset } from "./deviceclient.ts";
import { DEVICE_GRANT, type DeviceCode, deviceOffered } from "./devicecode.ts";
import { resourceOf } from "./discovery.ts";
import { pauseUntil } from "./pacing.ts";
import { tokenRequest } from "./tokenrequest.ts";

// RFC 8628 §3.5: slow_down widens the interval by five seconds for good.
const SLOW_DOWN_MS = Number(process.env[envName("BRIDGE_DEVICE_SLOW_DOWN_MS")]) || 5_000;
// A code the server would not issue is asked for again after this long.
const REISSUE_PAUSE_MS = Number(process.env[envName("BRIDGE_DEVICE_REISSUE_MS")]) || 30_000;

/** The device side of one published login. */
export interface DeviceSide {
  /**
   * the first code — null when the server offers no device grant or would not
   * issue one; a string, the word for the human, when it has no client for it
   */
  first: Promise<DeviceCode | string | null>;
  /** the grant is stored; rejects when the human refused on the other device */
  landed: Promise<void>;
  /** the login ended another way: polling stops, quietly */
  stop: () => void;
}

const never = new Promise<never>(() => {});

/**
 * Runs the device side of the machine's one login: the loopback link and this
 * code are one login, whichever lands first stores the grant, the other is
 * stopped. `onCode` hears every code issued (null when none stands, with the
 * word why when the server has no client for it — then the side stops asking),
 * so the login's record — what every bridge of the machine hands out — stays current.
 * `called` reads the code a caller issued: one that found the record's code
 * dead asks a fresh one (devicehandout.ts), and that one is polled
 * from then on, the old one never again.
 */
export function deviceSide(
  meta: Meta,
  redirectUri: string,
  resume: DeviceCode | undefined,
  onCode: (code: DeviceCode | null, unset?: string) => void,
  called: () => DeviceCode | undefined,
): DeviceSide {
  const halt = new AbortController();
  let tellFirst: (c: DeviceCode | string | null) => void = () => {};
  const first = new Promise<DeviceCode | string | null>((r) => (tellFirst = r));
  let unset: string | undefined;
  const pause = (ms: number): Promise<void> => pauseUntil(halt.signal, ms);

  // A fresh code in place of the one polled so far, which is dropped. null —
  // the login stopped meanwhile, or no code was to be had.
  const fresh = async (clientId: string | undefined): Promise<DeviceCode | null> => {
    try {
      const code = await codeThrough(meta, redirectUri, clientId);
      return halt.signal.aborted ? null : code;
    } catch (e) {
      if (e instanceof DeviceUnset) unset = e.message;
      log(`sign-in from another device not offered: ${errorMessage(e)}`);
      return null;
    }
  };
  // No client on the server: nothing to poll and nothing to ask again.
  const giveUp = (): Promise<never> => {
    onCode(null, unset);
    return never;
  };
  // A newer code a caller issued, if there is one.
  const newer = (code: DeviceCode): DeviceCode | null => {
    const r = called();
    return r && r.device_code !== code.device_code && r.expires_at > code.expires_at ? r : null;
  };

  const run = async (): Promise<void> => {
    if (!deviceOffered(meta)) {
      tellFirst(null);
      return never;
    }
    let code = resume && resume.expires_at > Date.now() ? resume : await fresh(resume?.client_id);
    tellFirst(code ?? unset ?? null);
    if (unset) return giveUp();
    onCode(code);
    let clientId = code?.client_id ?? resume?.client_id;
    for (;;) {
      while (!code) {
        await pause(REISSUE_PAUSE_MS);
        if (halt.signal.aborted) return never;
        code = await fresh(clientId);
        if (unset) return giveUp();
        if (code) onCode(code);
      }
      clientId = code.client_id;
      await pause(code.interval_ms);
      if (halt.signal.aborted) return never;
      const taken = newer(code);
      if (taken) {
        debug(`device poll: taking the code ${taken.user_code} a caller issued`);
        code = { ...taken, interval_ms: Math.max(taken.interval_ms, code.interval_ms) };
        onCode(code);
        continue;
      }
      let renew = Date.now() >= code.expires_at;
      if (!renew) {
        try {
          await tokenRequest(meta, {
            grant_type: DEVICE_GRANT,
            device_code: code.device_code,
            client_id: code.client_id,
            resource: resourceOf(meta),
          });
          return;
        } catch (e) {
          const word = e instanceof TokenError ? e.oauthError : undefined;
          if (word === "access_denied") {
            throw new Error("authorization refused on the other device", { cause: e });
          }
          if (word === "slow_down") {
            code = { ...code, interval_ms: code.interval_ms + SLOW_DOWN_MS };
            onCode(code);
          } else if (word && word !== "authorization_pending") {
            renew = true; // expired_token, or a code the server no longer knows
          } else if (!word) debug(`device poll: ${errorMessage(e)} — asking again`);
        }
      }
      if (renew) {
        code = newer(code) ?? (await fresh(clientId));
        if (halt.signal.aborted) return never;
        if (unset) return giveUp();
        onCode(code);
      }
    }
  };
  const landed = run();
  landed.catch(() => {});
  return {
    first,
    landed,
    stop: () => {
      halt.abort();
      tellFirst(null);
    },
  };
}
