// Hooks of `prepare` carried out to a script (graph @nks/nks-dev, node #9331): a command that calls
// a file is known by the file's text; one whose file is missing or says nothing known stays opaque,
// and prepare writes nothing beside it — the model reads it and decides. A file is told by its
// extension, by an interpreter before it, or by a path that names a file of the repository; a
// matcher is read as the harness reads it, a pattern of the whole tool name.
import { readFileSync, statSync } from "node:fs";
import { isAbsolute, join } from "node:path";

const SCRIPT = /\.(sh|bash|zsh|js|cjs|mjs|ts|py|rb|pl)$/;
const PROJECT = /\$\{?CLAUDE_PROJECT_DIR\}?/g;
const INTERPRETER = /(^|\/)(sh|bash|zsh|dash|node|bun|deno|tsx|python3?|ruby|perl)$/;

/** The files a command calls, as the harness would run it from the repository root. */
export function scriptsOf(root: string, command: string): string[] {
  const words = command.split(/\s+/).map((t) => t.replace(/["']/g, ""));
  const at = (t: string): string => {
    const p = t.replace(PROJECT, root);
    return isAbsolute(p) ? p : join(root, p);
  };
  return words
    .filter(
      (t, i) =>
        SCRIPT.test(t) ||
        t.includes("CLAUDE_PROJECT_DIR") ||
        (i > 0 && INTERPRETER.test(words[i - 1] ?? "") && /^[\w.~]/.test(t)) ||
        (t.includes("/") && isFile(at(t))),
    )
    .map(at);
}

function isFile(path: string): boolean {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

/** The text of the file, or "" when it cannot be read. */
function text(path: string): string {
  try {
    return isFile(path) ? readFileSync(path, "utf8") : "";
  } catch {
    return "";
  }
}

/** Whether the command, or a file it calls, reads as a hook of this kind. */
export function knownHook(root: string, command: string, known: (c: string) => boolean): boolean {
  return known(command) || scriptsOf(root, command).some((p) => known(text(p)));
}

/** Whether a matcher, a tool-name pattern of the harness, runs on this tool. */
export function runsOn(matcher: string, tool: string): boolean {
  try {
    return new RegExp(`^(?:${matcher})$`).test(tool);
  } catch {
    return false;
  }
}

/** Whether the command calls a file at all: then its kind cannot be told from the command. */
export const opaque = (root: string, command: string): boolean =>
  scriptsOf(root, command).length > 0;
