// Server prose about the standings board and the webhook list: the fallback path
// until the server gives fields. English forms are assumed, not observed against
// mcp.verstak.ai.

/**
 * Header of the channels board, for the word about an unrecognised board.
 * TODO(sibling): the core reads both `ru` and `en` (bridge/stand.ts); one language
 * here, so both keys carry the same header until the core takes a list.
 */
export const BOARD_HEADER = { ru: "Channels", en: "Channels" } as const;

export const BOARD_FORM = {
  boardHeader: /^\s*Channels(?:\s*\((\d+)\))?(?:\s|:|$)/m,
  boardEmpty: /^\s*No role (?:of|in) this graph (?:holds a channel|stands anywhere)/m,
  listens: /(^|·)\s*listening/,
  alive: /\blive\b|listening/,
  undelivered: /undelivered\s+(\d+)/,
  hooksHeader: /^\s*Webhooks(?:\s|:|\(|$)/m,
  hooksEmpty: /no webhooks (?:are )?registered/i,
  hookActive: /\bactive\b/,
  hookState: /\bactive\b|\bpaused\b/,
  seatId:
    /id of this (?:seat|place)[^\n]*\n\s*([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i,
};
