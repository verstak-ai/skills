// When the process under a pid started — to tell the loss marker's author from a process that
// got its pid later (marker.ts, #147 [100]). No dependencies, under Node and Bun: Linux —
// /proc/<pid>/stat (ticks since boot) and btime from /proc/stat; macOS and other BSDs —
// `ps -o lstart= -p <pid>` (seconds). Not known — null.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

/** Ticks per second in /proc/<pid>/stat: the Linux kernel's USER_HZ is 100 on all common builds. */
const CLK_TCK = 100;

function linuxStart(pid: number): number | null {
  const stat = readFileSync(`/proc/${pid}/stat`, "utf8");
  // The process name in parentheses may hold spaces: fields count after the last ")".
  const fields = stat.slice(stat.lastIndexOf(")") + 2).split(" ");
  const ticks = Number(fields[19]); // field 22 starttime; from ")" the 20th, zero-based 19
  const btime = Number(/^btime (\d+)$/m.exec(readFileSync("/proc/stat", "utf8"))?.[1]);
  return Number.isFinite(ticks) && btime ? (btime + ticks / CLK_TCK) * 1000 : null;
}

function psStart(pid: number): number | null {
  const out = execFileSync("ps", ["-o", "lstart=", "-p", String(pid)], {
    encoding: "utf8",
    env: { ...process.env, LC_ALL: "C" },
    stdio: ["ignore", "pipe", "ignore"],
    timeout: 2000,
  }).trim();
  const at = Date.parse(out);
  return Number.isNaN(at) ? null : at;
}

/** The process's start, epoch ms; no process or no way to know — null. */
export function processStart(pid: number): number | null {
  try {
    return process.platform === "linux" ? linuxStart(pid) : psStart(pid);
  } catch {
    return null;
  }
}
