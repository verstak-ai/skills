import { noteServerDate, now } from "../clock.ts";
import { TokenError } from "../errors.ts";
import { clearGrantState, grantLog, loadStore, saveStore } from "../store.ts";
import { type TokenBody, tokenSchedule } from "../tokens.ts";
import { type Meta, type Tokens } from "../types.ts";
import { DEVICE_GRANT } from "./devicecode.ts";

interface TokenEndpointError {
  error?: string;
  error_description?: string;
  message?: string;
}

async function tokenRequestOnce(meta: Meta, params: Record<string, string>): Promise<Tokens> {
  const res = await fetch(meta.as.token_endpoint, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params).toString(),
    signal: AbortSignal.timeout(30_000),
  });
  noteServerDate(res);
  // Under Bun an empty body yields null, not a throw — hence `?? {}`.
  const body = ((await res.json().catch(() => null)) ?? {}) as TokenBody & TokenEndpointError;
  if (!res.ok) {
    throw new TokenError(
      `token endpoint ${res.status}: ${body.error || ""} ${body.error_description || body.message || ""}`.trim(),
      body.error,
      res.status,
      body.message,
    );
  }
  const before = loadStore().tokens;
  const refresh = body.refresh_token ?? before?.refresh_token;
  // A grant by code keeps that birth through its refreshes: its audience is
  // the client's on the sign-in server, not the resource asked for (#6619).
  const byCode =
    params.grant_type === DEVICE_GRANT ||
    (params.grant_type === "refresh_token" &&
      !!before?.by_code &&
      before.client_id === params.client_id);
  const tokens: Tokens = {
    access_token: body.access_token,
    refresh_token: refresh,
    ...tokenSchedule(body, refresh),
    ...(params.client_id ? { client_id: params.client_id } : {}),
    ...(byCode ? { by_code: true } : {}),
  };
  saveStore({ tokens });
  clearGrantState(); // a grant in hand ends whatever the machine held against it
  grantLog(
    `tokens stored (${params.grant_type}); access good for ` +
      `${tokens.expires_at ? Math.round((tokens.expires_at - now()) / 1000) + "s" : "an unstated time"}` +
      `${tokens.refresh_not_before ? `, refresh usable in ${Math.round((tokens.refresh_not_before - now()) / 1000)}s` : ""}`,
  );
  return tokens;
}

// Token requests in flight. A rotation the server has performed and this
// process has not yet written down is the one thing a bridge must not die
// holding: the old refresh token is retired upstream, the new one exists
// nowhere but in an answer still on the wire, and every sibling on the machine
// presents the retired one next — witnessed as a whole night of dead-grant
// refusals after one successful rotation (graph @nks/nks-dev, node #4170). The
// request's own deadline bounds the wait.
export const tokenRequestsInFlight = new Set<Promise<Tokens>>();

export async function tokenRequest(meta: Meta, params: Record<string, string>): Promise<Tokens> {
  const p = tokenRequestOnce(meta, params);
  tokenRequestsInFlight.add(p);
  try {
    return await p;
  } finally {
    tokenRequestsInFlight.delete(p);
  }
}
