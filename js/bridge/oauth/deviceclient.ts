import { BRIDGE_NAME, DEVICE_CLIENT } from "../../delivery/index.ts";
import { words } from "../../shared/lang.ts";
import { CFG } from "../config.ts";
import { errorMessage } from "../errors.ts";
import { log } from "../streams.ts";
import { type Meta } from "../types.ts";
import {
  DEVICE_GRANT,
  type DeviceCode,
  DeviceRefusal,
  issueDeviceCode,
  post,
} from "./devicecode.ts";

// The client the device login goes through: one the operator set up (#6619).
// Rauthy puts no resource in the audience of a device grant — the code request
// carries none, the token is minted without one — so only a client whose
// default audience is the mcp address yields a token mcp accepts; a dynamic
// registration has no default audience.
const DEVICE_CLIENT_ID = BRIDGE_NAME;

/** The server does not know the client or does not let it take the device grant. */
const clientRefused = (e: unknown): boolean =>
  e instanceof DeviceRefusal && /^(invalid_client|unauthorized_client)$/.test(e.error ?? "");

/** Refused with no OAuth word to read: asking again on a pause would only repeat it. */
const bareRefusal = (e: unknown): e is DeviceRefusal =>
  e instanceof DeviceRefusal && e.error === undefined && (e.status === 400 || e.status === 401);

/**
 * The server has no client for the device login. No code is offered then: a
 * registered one would yield a grant mcp refuses, with nothing to undo it but
 * wiping the store. The message is the word for the human.
 */
export class DeviceUnset extends DeviceRefusal {}

/**
 * A code through `clientId` — the one the login already uses — or else the
 * named client, always tried before any registration. Refused, the named
 * client means no code at all; a dynamic registration only by the operator's
 * switch (BRIDGE_DEVICE_REGISTER), and never in place of a client the human
 * named (BRIDGE_DEVICE_CLIENT).
 */
export async function codeThrough(
  meta: Meta,
  redirectUri: string,
  clientId: string | undefined,
): Promise<DeviceCode> {
  const named = CFG.deviceClientId || DEVICE_CLIENT_ID;
  const id = clientId ?? named;
  try {
    return await issueDeviceCode(meta, id);
  } catch (e) {
    if (bareRefusal(e)) {
      throw new DeviceUnset(words(DEVICE_CLIENT).bareRefusal(id, e.status), undefined, e.status);
    }
    if (!clientRefused(e)) throw e;
    const word = (e as DeviceRefusal).error;
    if (id === CFG.deviceClientId) {
      throw new DeviceUnset(words(DEVICE_CLIENT).namedRefused(id, String(word)), word);
    }
    if (id !== named) return await codeThrough(meta, redirectUri, undefined);
    if (CFG.deviceRegister) {
      log(`device client ${id} refused (${errorMessage(e)}) — registering one`);
      return await issueDeviceCode(meta, await registerDeviceClient(meta, redirectUri));
    }
    throw new DeviceUnset(words(DEVICE_CLIENT).unset(id), word);
  }
}

// Only by the switch: a client of its own. The loopback login registers one
// lazily, when its link is opened, and this one must exist before the code is
// asked for. The server wants a redirect URI on every dynamic registration;
// the loopback one is given.
async function registerDeviceClient(meta: Meta, redirectUri: string): Promise<string> {
  if (CFG.staticClientId) return CFG.staticClientId;
  if (!meta.as.registration_endpoint) {
    throw new DeviceRefusal("server offers no dynamic client registration", undefined);
  }
  const reg = await post(meta.as.registration_endpoint, "json", {
    client_name: CFG.clientName,
    redirect_uris: [redirectUri],
    grant_types: [DEVICE_GRANT, "refresh_token"],
    token_endpoint_auth_method: "none",
  });
  if (typeof reg.client_id !== "string") {
    throw new DeviceRefusal("registration answered without a client_id", undefined);
  }
  log(`registered OAuth client ${reg.client_id} for sign-in from another device`);
  return reg.client_id;
}
