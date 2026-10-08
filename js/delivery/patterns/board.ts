// Server prose about the standings board and the webhook list: the fallback path
// until the server gives fields. English forms are assumed, not observed against
// mcp.verstak.ai.

import type { Lang } from "../lang.ts";

/** Header of the channels board per language, for the word about an unrecognised board. */
export const BOARD_HEADER: Readonly<Record<Lang, string>> = { en: "Channels" };

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
