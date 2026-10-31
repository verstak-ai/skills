// The plugin's SessionStart hook in Claude Code: one line on stdout — which the harness adds to
// the session's context. After a compaction (source "compact") — the role's way back: the door,
// the role's skills, the summary as a pointer (graph @nks/nks-dev, node #7320), with the role and
// seat only when the hold records name exactly one for the session's directory, the bare word in
// an aligned repository without such a seat, nothing elsewhere. Otherwise the
// invitation when the session's repository carries none of the alignment signs
// (shared/reposigns.ts), else nothing. Local reads only; always exit 0.
import { readFileSync } from "node:fs";

import { COMPACTION, ONBOARD_START } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import { repoSigns } from "../shared/reposigns.ts";
import { seatByDir } from "../shared/seatbydir.ts";
import { authDirFromEnv } from "../shared/standings.ts";

/** The hook input: cwd and source; none when there is no input or it is not JSON. */
function hookInput(): { cwd?: unknown; source?: unknown } {
  try {
    if (!process.stdin.isTTY) return (JSON.parse(readFileSync(0, "utf8")) as object) ?? {};
  } catch {
    /* no input or not JSON */
  }
  return {};
}

const input = hookInput();
/** The session's directory: the hook input's cwd, then the harness's project variable, then ours. */
const dir =
  typeof input.cwd === "string" && input.cwd
    ? input.cwd
    : process.env.CLAUDE_PROJECT_DIR || process.cwd();

function line(): string | null {
  if (input.source === "compact") {
    const W = words(COMPACTION);
    const seat = seatByDir(authDirFromEnv(), dir, "claude-code");
    if (seat) return W.back(seat.karta, seat.name, seat.realm);
    // No seat of this directory: the bare word only where the repository is aligned — elsewhere
    // the session has no graph work to return to, and the word would be noise.
    const { verdict } = repoSigns(dir, "claude-code");
    return verdict === "aligned" || verdict === "partial" ? W.bare() : null;
  }
  return repoSigns(dir, "claude-code").verdict === "invite" ? words(ONBOARD_START).start() : null;
}

try {
  const text = line();
  if (text) process.stdout.write(`${text}\n`);
} catch {
  /* a hook never fails the session's start */
}
process.exitCode = 0;
