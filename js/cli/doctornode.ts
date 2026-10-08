// Whether a bridge entry's command is executable (graph @nks/nks-dev, node #6727):
// the harness looks it up in the PATH of its own environment, while doctor sees the
// PATH of the shell it was called from. What is visible is said as a fact, what is not
// is said so, and the fix is named as an exact command.
import { accessSync, constants } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, isAbsolute } from "node:path";

import { envName, HARNESS, type HarnessWords } from "../delivery/index.ts";
import { homeBridgePath } from "../shared/home.ts";
import { words } from "../shared/lang.ts";
import { which } from "./subagents.ts";

export interface Launch {
  who: string;
  harness: "claude" | "codex";
  command: string;
  /** Name of a manual entry in the user config, the one to rewrite; plugin entries have none. */
  entry?: string;
}

const hw = (): HarnessWords => words(HARNESS);

const platform = (): string => process.env[envName("DOCTOR_PLATFORM")] || process.platform;

// Directories in PATH even for a process not started from a shell:
// launchd on macOS gives /usr/bin:/bin:/usr/sbin:/sbin, a Linux session adds /usr/local/bin.
const SYSTEM_DIRS: Record<string, string[]> = {
  darwin: ["/usr/bin", "/bin", "/usr/sbin", "/sbin"],
  linux: ["/usr/local/bin", "/usr/bin", "/bin"],
};

const executable = (p: string): boolean => {
  try {
    accessSync(p, constants.X_OK);
    return true;
  } catch {
    return false;
  }
};

// The fix never puts a second bridge beside the first (graph @nks/nks-dev, node #6728).
const fix = (l: Launch, node: string | null): string =>
  hw().launchFix(l.harness, l.entry, node, homeBridgePath().replace(homedir(), "$HOME"));

/** Each bridge stdio entry's command: found or not, where, and whether a harness outside a shell sees it. */
export function launchReport(out: (s: string) => void, launches: Launch[]): void {
  for (const l of launches) {
    const cmd = l.command || "node";
    const found = which(cmd, process.cwd());
    if (!found || !executable(found)) {
      out(hw().launchNotFound(l.who, cmd, isAbsolute(cmd)));
      const own = /^node/i.test(basename(process.execPath)) ? process.execPath : null;
      out(fix(l, own));
      continue;
    }
    if (isAbsolute(cmd)) {
      out(hw().launchAbsolute(l.who, cmd));
      continue;
    }
    const dir = dirname(found);
    const system = SYSTEM_DIRS[platform()];
    if (!system || system.includes(dir)) {
      out(hw().launchFound(l.who, cmd, found));
      continue;
    }
    out(hw().launchProfile(l.who, cmd, found, dir));
    out(fix(l, found));
  }
}

export const openCodeRuntimeWord = (): string => hw().openCodeRuntime();
