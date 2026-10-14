// Server prose of verstak_case(action="mine", relation="participant") — the cases the session
// sits in (graph @nks/nks-dev, nodes #7234, #6809). By the MCP server's formatter (nks-mcp
// src/formatters/room.ts): a case row "  №652 · <intent> — sitting · @h:name" under "Cases of this
// session (1):"; none — "No cases under the narrowing you asked for. …" (or "No cases: …"). An
// answer matching neither is unread, never "none".
export const MINE_ROW = /^\s*[№#]\s*\d+\s/;
export const MINE_NONE = /^\s*No cases(?=[\s:.,;]|$)/;
