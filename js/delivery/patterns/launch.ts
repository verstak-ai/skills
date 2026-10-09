// The launch line with a case: "verstak <graph> <role> <case #N> [from <seat>]". Parsing is
// positional (a role is itself written "#N"): graph, role, then the case — "case #N" or a
// bare "#N"/"№N". The launch line is the first text line that starts with it: OpenCode
// puts its own line before a subagent's prompt.
// Groups: 1 graph, 2 role, 3 case number, 4 the launcher's seat.

/**
 * The launch line's first word, the delivery's own: two deliveries' plugins in one session
 * rise only on their own line (graph @nks/nks-dev, node #6981).
 */
export const LAUNCH_WORD = "verstak";

const word = LAUNCH_WORD.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const LAUNCH_LINE = new RegExp(
  `^[ \\t]*${word}\\s+(\\S+)\\s+(\\S+)\\s+(?:case\\s+)?[№#]\\s?(\\d+)(?:[ \\t]+from[ \\t]+(@\\S+))?(?=\\s|$)`,
  "mu",
);
