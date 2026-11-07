// Server prose the delivery reads to give the human's rules from mind (the core's
// shared/mindslice.ts; graph @nks/nks-dev, nodes #9817, #9816): readiness's `personal_mind` sign
// ("  personal_mind «…» — present · scope: person · …"; absence — `missing`) and a
// verstak_search row "  🔛 Name (#65, phenomenon, Pt/Va/Ad, v2) — fragment…" (groups: name,
// seq, fragment, which may be missing). The sibling observed the Russian prose; the key and the
// state are the server's own tokens, the row its shape — the English server's form unobserved.
export const MIND_PRESENT = /^\s*personal_mind\b[^\n]*—\s*present\b/m;
export const MIND_MISSING = /^\s*personal_mind\b[^\n]*—\s*missing\b/m;
export const MIND_ROW = /^\s+(\S[^\n]*?) \(#(\d+), [^\s,)]+[^)\n]*\)(?: — ([^\n]*))?$/;
