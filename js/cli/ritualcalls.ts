// Tool calls the scope run (cli/ritualprobe.ts) tries ritual plugin hooks with: a write
// into the project memory path (memory-guard), a plain write (guard silent), and a push
// with a merge (after-reminders). Hook input per @opencode/plugin 2.0.4 types: sessionID, no directory.
import { homedir } from "node:os";
import { join } from "node:path";

export type Fn = (...a: unknown[]) => unknown;
/** Own session (real path), own under the instance's spelling (a symlink), foreign. */
export type Who = "mine" | "twin" | "theirs";

const memoryPath = join(homedir(), ".claude", "projects", "-probe", "memory", "MEMORY.md");
const pushed = "To github.com:o/r.git\n   1234567..89abcde  feat/x -> feat/x";

// A sample may speak once per call id for the whole process: every call gets its own
// id so runs and plugins of one process do not silence each other.
let seq = 0;
const fresh = (kind: string): string => `${kind}-${++seq}`;
const isPlain = (id: string): boolean => id.startsWith("plain-");

const calls = (sessionID: string) => ({
  before: ["write", "edit"].map((tool) => ({
    tool,
    sessionID,
    agent: "build",
    messageID: "msg",
    id: fresh(tool),
    input: { filePath: memoryPath, content: "x" },
  })),
  plain: [
    {
      tool: "write",
      sessionID,
      agent: "build",
      messageID: "msg",
      id: fresh("plain"),
      input: { filePath: "README.md", content: "x" },
    },
  ],
  after: [
    ["git push -u origin feat/x", pushed],
    ["gh pr merge 12 --squash --delete-branch", ""],
  ].map(([command, content]) => ({
    tool: "bash",
    sessionID,
    agent: "build",
    messageID: "msg",
    id: fresh("bash"),
    status: "completed",
    input: { command },
    result: { content, metadata: { exit: 0 } },
  })),
});

// An error of the hook's own code, not a block: an undefined name is a failure, not a guard.
const BROKEN = new Set(["ReferenceError", "TypeError", "SyntaxError", "RangeError"]);

export interface Hits {
  /** A throw or a changed call: "execute.before write: throw (…)", "execute.after bash: changed". */
  hit: string[];
  /** The hook is broken: a code error, a throw on a plain write or after the call. */
  broken: string[];
}

/** Calls the tool hooks on the session's calls: what threw, changed the call or broke. */
export async function runHooks(hooks: Record<string, Fn[]>, sessionID: string): Promise<Hits> {
  const hit: string[] = [];
  const broken: string[] = [];
  const c = calls(sessionID);
  for (const [name, inputs] of [
    ["execute.before", c.before],
    ["execute.before", c.plain],
    ["execute.after", c.after],
  ] as const) {
    for (const input of inputs) {
      const was = JSON.stringify(input);
      const what = `${name} ${input.tool}${isPlain(input.id) ? " (not a memory path)" : ""}`;
      for (const fn of hooks[name] ?? []) {
        try {
          await fn(input);
        } catch (e) {
          const err = e as Error;
          const said = `${what}: throw (${err?.name ?? "?"}: ${String(err?.message ?? e)})`;
          hit.push(said);
          if (BROKEN.has(err?.name) || isPlain(input.id) || name === "execute.after")
            broken.push(said);
        }
      }
      if (JSON.stringify(input) !== was) hit.push(`${what}: changed`);
    }
  }
  return { hit, broken };
}
