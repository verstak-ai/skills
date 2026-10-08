// Regular expressions built around delivery names (js/delivery): an inserted name
// matches itself literally, so the pattern equals the one written with it inline.

/** The name with every regex metacharacter escaped (for use outside a character class). */
export const escapeRe = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
