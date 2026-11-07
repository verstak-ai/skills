// Server prose the delivery reads to give the human's rules from mind (the core's
// shared/mindslice.ts; graph @nks/nks-dev, nodes #9817, #9816): readiness's `personal_mind` sign
// ("  personal_mind «…» — present · scope: person · …"; absence — `missing`) and a
// verstak_search row "  🔛 Name (#65, phenomenon, Pt/Va/Ad, v2) — fragment…" (groups: name,
// seq, fragment, which may be missing). Observed in English on the LAB verstak server (nks-mcp
// 0.137.0, FLAVOR=verstak; case #3255, 2026-11-06): "  personal_mind «Personal memory» — present ·
// scope: person · ready: yes" and "  🗺️ A short plan before starting a task (#3, phenomenon,
// Pm/Va/Ad, v1)" under "Found 1 nodes:".
export const MIND_PRESENT = /^\s*personal_mind\b[^\n]*—\s*present\b/m;
export const MIND_MISSING = /^\s*personal_mind\b[^\n]*—\s*missing\b/m;
export const MIND_ROW = /^\s+(\S[^\n]*?) \(#(\d+), [^\s,)]+[^)\n]*\)(?: — ([^\n]*))?$/;
