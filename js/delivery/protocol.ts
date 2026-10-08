// Protocol names the bridge speaks with the server, the harness and its own plugins:
// derived from the product name, except the keys the server's own surface confirms
// (SERVER_PROTOCOL).
import { BRIDGE_NAME, PRODUCT } from "./product.ts";

/** Tool prefix of the delivery's server. */
export const TOOL_PREFIX = `${PRODUCT}_`;
/** A server tool name: `tool("stand")` is `verstak_stand`. */
export const tool = (name: string): string => `${TOOL_PREFIX}${name}`;

/** A plugin-to-bridge method (OpenCode, pi): `method("resume")` is `verstak/resume`. */
export const method = (name: string): string => `${PRODUCT}/${name}`;

/** MCP notification loggers: channel frames and the bridge's own word. */
export const LOGGERS = { channel: `${PRODUCT}-channel`, bridge: BRIDGE_NAME } as const;

/** Prefix of the bridge's and its clients' internal JSON-RPC ids — the bridge knows its own calls by it. */
export const ID_PREFIX = `${PRODUCT}-`;

/**
 * Server protocol keys. Not derived from the product name: the server's surface names
 * them (api refusal — `_meta[refusal]`, answer fields — `capabilities.experimental[fields]`).
 * `fields` follows the server's build name. TODO(server): `refusal` is assumed by the same
 * rule; confirm both from `capabilities.experimental` in the initialize answer of
 * mcp.verstak.ai. Until confirmed, a mismatch only drops the bridge to prose parsing.
 */
export const SERVER_PROTOCOL = {
  refusal: "verstak/refusal",
  fields: "verstak/structured",
} as const;
