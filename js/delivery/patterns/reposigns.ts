// The signs that a repository was aligned for the agent (the core's shared/reposigns.ts):
// what align leaves in the repository — the AGENTS.md cover and the stamp (its keys and stamp
// are COVER's form), the start hook. Align writes a start hook for Claude Code (a SessionStart
// entry carrying the mark) and OpenCode (the rituals plugin) only; Codex and pi get none
// (skills/verstak/references/align-harness-surfaces.md). A sibling delivery names its own.

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
} as const;
