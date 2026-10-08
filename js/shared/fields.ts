// Response fields on request (graph @nks/nks-dev, nodes #6637, #6731, #6707): the server
// gives structuredContent and outputSchema only to a client that declared the fields
// capability in initialize. The bridge always asks for itself and passes the fields
// to the harness only when the harness asked.

import { SERVER_PROTOCOL } from "../delivery/index.ts";

/** Capability key of response fields. */
export const FIELDS_CAPABILITY = SERVER_PROTOCOL.fields;

/** Capabilities of a bridge client that receives the fields (OpenCode plugin, pi extension). */
export const FIELDS_CAPABILITIES = { experimental: { [FIELDS_CAPABILITY]: {} } };

type Obj = Record<string, unknown>;
const obj = (v: unknown): Obj =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Obj) : {};

/** Whether the client itself asked for the fields, by its initialize params. */
export const asksFields = (initParams: unknown): boolean =>
  FIELDS_CAPABILITY in obj(obj(obj(initParams).capabilities).experimental);

/** Initialize params with the key declared; a value the client declared is kept. */
export function withFieldsAsked(initParams: unknown): Obj {
  const p = obj(initParams);
  const caps = obj(p.capabilities);
  const exp = obj(caps.experimental);
  if (FIELDS_CAPABILITY in exp) return p;
  return { ...p, capabilities: { ...caps, experimental: { ...exp, [FIELDS_CAPABILITY]: {} } } };
}
