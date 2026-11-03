// A push whose target is the trunk (graph @nks/nks-dev, node #8362): there it ships, so the
// merge word speaks, not the push word (ritualjudge.ts). The target is read from what git
// printed (`a..b  x -> main`), else from the refspecs (`main`, `HEAD:main`, `+x:refs/heads/master`),
// else — no refspec, or HEAD — from the branch checked out in the session's directory.
import { execFileSync } from "node:child_process";

const TRUNK = /^(?:refs\/heads\/)?(?:main|master)$/;
/** A ref line of git's push report: flag, summary, `from -> to`. */
const REF_LINE = /^ [ *+-] \S+(?: \S+)*? +\S+ -> (\S+)/gm;

/** A shell argument run split into words: whole quotes are one word. */
export const words = (args: string): string[] =>
  args.match(/(?:\\.|'[^']*'|"(?:[^"\\]|\\.)*"|[^ '"\\])+/g) ?? [];

/** git in the directory: its trimmed output, "" on any failure. */
export function git(cwd: string, ...a: string[]): string {
  try {
    const stdio: ("ignore" | "pipe")[] = ["ignore", "pipe", "ignore"];
    return execFileSync("git", a, { cwd, encoding: "utf8", stdio, windowsHide: true }).trim();
  } catch {
    return "";
  }
}

/** The destinations a push's arguments name; HEAD for the current branch; null — not readable. */
function targets(args: string): string[] | null {
  const pos: string[] = [];
  let skip = false;
  for (const t of words(args)) {
    if (skip) skip = false;
    else if (/^[0-9]*(?:>>?|<|>&)$/.test(t)) skip = true;
    else if (/^[0-9]*(?:>>?|<|>&)/.test(t)) continue;
    else if (/['"\\$`]/.test(t)) return null;
    else if (/^--(?:all|mirror)$/.test(t)) return null;
    else if (/^(?:-o|--push-option|--receive-pack|--exec|--repo)$/.test(t)) skip = true;
    else if (!t.startsWith("-")) pos.push(t);
  }
  const out: string[] = [];
  let tag = false;
  for (const r of pos.slice(1)) {
    if (tag) tag = false;
    else if (r === "tag") tag = true;
    else out.push(r.replace(/^\+/, "").split(":").at(-1) || "HEAD");
  }
  return out.length ? out : ["HEAD"];
}

/** Whether a branch name is the trunk. */
export const isTrunk = (branch: string): boolean => TRUNK.test(branch);

/** Whether a refspec of the push names the trunk itself (not HEAD). */
export const namesTrunk = (runs: string[]): boolean =>
  runs.some((args) => (targets(args) ?? []).some((r) => TRUNK.test(r)));

/**
 * Whether a push (its argument runs, what it printed) went to the trunk; null — not knowable. A
 * quiet push prints no report, and the session's folder need not be where it ran: with no refspec
 * naming the trunk and that folder on the trunk, either word could be false — none is said.
 */
export function toTrunk(
  runs: string[],
  output: string,
  cwd: string | null,
  quiet = false,
): boolean | null {
  const printed = [...output.matchAll(REF_LINE)].map((m) => m[1] ?? "");
  if (printed.length) return printed.some((r) => TRUNK.test(r));
  const branch = (): string => (cwd ? git(cwd, "symbolic-ref", "--short", "-q", "HEAD") : "");
  if (quiet) return namesTrunk(runs) ? true : isTrunk(branch()) ? null : false;
  return runs.some((args) =>
    (targets(args) ?? []).some((r) => TRUNK.test(r === "HEAD" ? branch() : r)),
  );
}
