// The signs that a repository was aligned for the agent (the core's shared/reposigns.ts):
// what align leaves in the repository — the AGENTS.md cover (its keys are COVER), the start
// hook and the stamp. Align writes a start hook for Claude Code (a SessionStart entry
// carrying the mark) and OpenCode (the rituals plugin) only; Codex and pi get none
// (skills/verstak/references/align-harness-surfaces.md); the stamp is the template's last
// line (skills/verstak/templates/agents-template.md). A sibling delivery names its own.

export const REPO_SIGNS = {
  /** The repository's Claude Code settings: the start hook is a hooks.SessionStart entry. */
  settings: ".claude/settings.json",
  /**
   * Align's start-hook mark: the line asks for the door's Start — "Load the verstak skill
   * first (/verstak) and read its Start section", in the full and the initial form alike
   * (skills/verstak/references/align-hooks.md). The product name elsewhere in a command
   * (verstak_orient, another suite) is no mark.
   */
  startMark: /\bverstak skill\b[^.]*\bStart section\b/,
  /** The OpenCode rituals plugin align writes. */
  rituals: ".opencode/plugins/verstak-rituals.js",
  /**
   * Align's stamp in the cover file: "(verstak align: contract N, stamped …"; before the
   * contract counter it read "(verstakify: contract DATE".
   */
  stamp: /\((?:verstak align:\s*contract\s*`?\d+`?\s*,\s*stamped|verstakify:\s*contract\b)/,
} as const;
