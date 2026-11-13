// The client process of a stopped agent's session — closed so the human no longer sees it alive
// (graph @nks/nks-dev, nodes #9256, #9257). `opencode run --standalone` serves its session from a
// child "serve --stdio": this plugin's parent is that run, and nothing else lives in it. A shared
// service tells no client of a session: only a TUI opened on exactly this session ("--session
// <id>", the same account) is found, by its command line. No other process is touched.
import { execFileSync } from "node:child_process";

import { envName } from "../delivery/index.ts";

interface Proc {
  pid: number;
  uid: number;
  command: string;
}
export interface BoundClient extends Proc {
  born: string;
}

function processes(): Proc[] {
  try {
    const out = execFileSync("ps", ["-axo", "pid=,uid=,command="], {
      encoding: "utf8",
      timeout: 5_000,
      stdio: ["ignore", "pipe", "ignore"],
      windowsHide: true,
    });
    return out
      .split("\n")
      .map((l) => /^\s*(\d+)\s+(\d+)\s+(.*)$/.exec(l))
      .filter((m) => m !== null)
      .map((m) => ({ pid: Number(m[1]), uid: Number(m[2]), command: m[3] as string }));
  } catch {
    return []; // no ps (Windows) — no client is found
  }
}

/** This instance serves one run's session only: OpenCode started it as that run's "serve --stdio". */
function standaloneClient(): number | null {
  const seam = Number(process.env[envName("OPENCODE_CLIENT_PID")]); // a probe's stand-in for the run
  if (seam > 1) return seam;
  const a = process.argv;
  return a.includes("serve") && a.includes("--stdio") && process.ppid > 1 ? process.ppid : null;
}

/** The client of a root session, or null — none to close without touching another's. */
export function clientOf(sessionID: string): BoundClient | null {
  const own = standaloneClient();
  const uid = process.getuid?.();
  if (uid === undefined) return null;
  const id = sessionID.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // An OpenCode client by its program (directly or through an interpreter) before the session flag.
  const opened = new RegExp(
    `(?:^|[\\s/\\\\])opencode(?:\\.exe)?\\s(?:.*\\s)?(?:--session|-s)(?:=|\\s+)${id}(?:\\s|$)`,
  );
  const hits = processes().filter(
    (p) =>
      p.uid === uid &&
      p.pid !== process.pid &&
      (own !== null ? p.pid === own : opened.test(p.command)),
  );
  const hit = hits.length === 1 ? hits[0] : undefined;
  const born = hit ? stamp(hit.pid) : null;
  return hit && born ? { ...hit, born } : null;
}

/** A process identity, not just a reusable pid. No readable birth stamp — no signal. */
function stamp(pid: number): string | null | undefined {
  try {
    return (
      execFileSync("ps", ["-p", String(pid), "-o", "lstart="], {
        encoding: "utf8",
        timeout: 5_000,
        stdio: ["ignore", "pipe", "pipe"],
        windowsHide: true,
      }).trim() || undefined
    );
  } catch (e) {
    const failure = e as { status?: number; stdout?: string; stderr?: string };
    // ps's empty no-match is absence. Timeout, permissions and a missing observer are unknown.
    return failure.status === 1 && !failure.stdout?.trim() && !failure.stderr?.trim()
      ? null
      : undefined;
  }
}

/** A signal is not an exit. Confirm this exact client's disappearance; never escalate. */
export async function closeClient(client: BoundClient, current: () => boolean): Promise<boolean> {
  const { pid, born } = client;
  const now = processes().find((p) => p.pid === pid);
  if (
    stamp(pid) !== born ||
    now?.uid !== client.uid ||
    now.command !== client.command ||
    !current()
  )
    return false;
  try {
    process.kill(pid, "SIGTERM");
  } catch {
    return false;
  }
  const until = Date.now() + 5_000;
  while (Date.now() < until) {
    const observed = stamp(pid);
    if (observed === null || (typeof observed === "string" && observed !== born)) return true;
    if (observed === undefined) return false;
    if (!current()) return false;
    await new Promise((r) => setTimeout(r, 50));
  }
  return false;
}
