// Server prose about the channel that the bridge parses.

/**
 * The action list in the server's channel schema description: "one of: a | b | c";
 * group 1 is the head, group 2 the list.
 */
export const ACTION_LIST_RE = /(one of:\s*)([a-z_]+(?:\s*\|\s*[a-z_]+)*)/i;
/** Prose of the register refusal "the seat is gone" (no rule in _meta): take it anew with connect. */
export const SEAT_GONE_RE = /no such standing|take it with connect/i;
/** Prose of the channel refusal "the session holds no standing" (no rule in _meta). */
export const UNATTRIBUTED_RE = /hold no registered standing/i;
