import { noteServerDate } from "../clock.ts";
import { utcTime } from "../errors.ts";
import { log } from "../streams.ts";
import { type Meta } from "../types.ts";

// Sign-in from another device, RFC 8628 (graph nks-dev: #6570). The loopback
// link opens only on the bridge's own machine, and the sign-in page's redirect
// goes to 127.0.0.1 of whatever browser follows it — on a server without a
// browser nobody could log in at all. The device grant needs no redirect: the
// human opens the server's own page with the code in it on any device, and the
// bridge asks the token endpoint until the grant is there.

export const DEVICE_GRANT = "urn:ietf:params:oauth:grant-type:device_code";

/** One code of a device login, as the machine's published login carries it. */
export interface DeviceCode {
  client_id: string;
  device_code: string;
  user_code: string;
  /** the sign-in page with the code in it — what a human on another device opens */
  link: string;
  /** when the code dies, on this machine's clock */
  expires_at: number;
  /** the pause before each poll; slow_down widens it for good */
  interval_ms: number;
}

/** A refusal of the device side: `error` is the server's OAuth word, if it said one. */
export class DeviceRefusal extends Error {
  error: string | undefined;
  status: number | undefined;
  constructor(message: string, error: string | undefined, status?: number) {
    super(message);
    this.error = error;
    this.status = status;
  }
}

/** Does the sign-in server take the device grant? Without it only the loopback link is offered. */
export function deviceOffered(meta: Meta): boolean {
  const endpoint = meta.as.device_authorization_endpoint;
  const grants = meta.as.grant_types_supported;
  return (
    typeof endpoint === "string" &&
    !!endpoint &&
    (!Array.isArray(grants) || grants.includes(DEVICE_GRANT))
  );
}

export async function post(
  url: string,
  type: "json" | "form",
  body: Record<string, string | string[]>,
): Promise<Record<string, unknown>> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": type === "json" ? "application/json" : "application/x-www-form-urlencoded",
    },
    body:
      type === "json"
        ? JSON.stringify(body)
        : new URLSearchParams(body as Record<string, string>).toString(),
    signal: AbortSignal.timeout(15_000),
  });
  noteServerDate(res);
  const answer = ((await res.json().catch(() => null)) ?? {}) as Record<string, unknown>;
  if (!res.ok) {
    const error = typeof answer.error === "string" ? answer.error : undefined;
    const said = answer.error_description ?? answer.message ?? "";
    throw new DeviceRefusal(
      `POST ${url} -> ${res.status} ${error ?? ""} ${said}`.trim(),
      error,
      res.status,
    );
  }
  return answer;
}

export async function issueDeviceCode(meta: Meta, clientId: string): Promise<DeviceCode> {
  const form: Record<string, string> = { client_id: clientId };
  if (meta.scope) form.scope = meta.scope;
  const a = await post(String(meta.as.device_authorization_endpoint), "form", form);
  const complete = a.verification_uri_complete ?? a.verification_uri;
  if (typeof a.device_code !== "string" || typeof complete !== "string") {
    throw new DeviceRefusal("the device code answer carries no code or no page", undefined);
  }
  const code: DeviceCode = {
    client_id: clientId,
    device_code: a.device_code,
    user_code: String(a.user_code ?? ""),
    link: complete,
    expires_at: Date.now() + (Number(a.expires_in) || 300) * 1000,
    // RFC 8628 §3.2: five seconds when the server names no interval.
    interval_ms: (Number.isFinite(Number(a.interval)) ? Number(a.interval) : 5) * 1000,
  };
  log(
    `sign in from another device: ${code.link} (code ${code.user_code}, ` +
      `valid until ${utcTime(code.expires_at)})`,
  );
  return code;
}
