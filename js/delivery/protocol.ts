// Protocol names the bridge speaks with the server, the harness and its own plugins:
// derived from the product name, except the keys the server's own surface confirms
// (serverProtocol).
import type { Lang } from "./lang.ts";
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
 * The product mark on a frame the plugin puts into a session: two deliveries' frames in one
 * session stay apart, and the agent answers with its own delivery's tools.
 */
export const FRAME_MARK = `[${PRODUCT}]`;

/**
 * The answer-fields key the bridge declares to the server in `capabilities.experimental` —
 * from the product name, like the other protocol keys.
 */
export const STRUCTURED_CAPABILITY = `${PRODUCT}/structured`;

/**
 * Server protocol keys not derived from the product name: the server's surface names them
 * (api refusal — `_meta[refusal]`). Confirmed 2026-10-08 against mcp.verstak.ai 0.108.0: its
 * initialize answer names `verstak/structured` and `verstak/refusal` in capabilities.experimental.
 */
export const serverProtocol = {
  refusal: "verstak/refusal",
} as const;

/**
 * The prose language the bridge asks the server for explicitly (a seat's `locale`,
 * `accept-language`), by session language.
 */
export const SERVER_LOCALE: Readonly<Partial<Record<Lang, string>>> = { en: "en" };
