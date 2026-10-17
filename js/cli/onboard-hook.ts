// The plugin's SessionStart hook in Claude Code: one invitation line on stdout — which the
// harness adds to the session's context — when the session's repository carries none of the
// alignment signs (shared/reposigns.ts); otherwise nothing. Local reads only; always exit 0.
import { readFileSync } from "node:fs";

import { ONBOARD_START } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import { repoSigns } from "../shared/reposigns.ts";

/** The session's directory: the hook input's cwd, then the harness's project variable, then ours. */
function sessionDir(): string {
  try {
    if (!process.stdin.isTTY) {
      const cwd = (JSON.parse(readFileSync(0, "utf8")) as { cwd?: unknown })?.cwd;
      if (typeof cwd === "string" && cwd) return cwd;
    }
  } catch {
    /* no input or not JSON */
  }
  return process.env.CLAUDE_PROJECT_DIR || process.cwd();
}

try {
  if (repoSigns(sessionDir(), "claude-code").verdict === "invite")
    process.stdout.write(`${words(ONBOARD_START).start()}\n`);
} catch {
  /* a hook never fails the session's start */
}
process.exitCode = 0;
