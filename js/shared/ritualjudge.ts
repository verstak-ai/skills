// The push and merge rituals judged by outcome, not by form (graph @nks/nks-dev, node #9319,
// section RITUALS): the same rule the bootstrap's hook samples carry in jq, here once for the
// delivery's hooks of every harness. A command is found as a command, help and --auto never
// wake, the exit status speaks only for the last command of a chain or one before &&, a visible
// refusal vetoes, a push of tags only is no branch for review; a quiet push is judged by the
// state of git in the session's directory.
import { execFileSync } from "node:child_process";

/** A shell argument run: whole quotes are one word — a flag inside them is text. */
const ARG = String.raw`(?:>&|\\.|'[^']*'|"(?:[^"\\]|\\.)*"|[^;&|)\n'"\\])*`;
const ENV = String.raw`(?:env +)?(?:[A-Za-z_]+=\S+ +)*`;
const PUSH = String.raw`${ENV}git(?: -C \S+)* push`;
const at = (head: string, noop: string): string =>
  String.raw`(?:^|[;&|(\n] *)${head}(?=[ ;&|)\n]|$)(?!${ARG} (?:${noop})(?:[ ;&|)\n]|$))`;
const PULL = new RegExp(
  at(String.raw`${ENV}git(?: -C \S+)* (?:checkout|switch)`, "-h|--help") +
    String.raw` (?:main|master)(?=[ ;&|)\n]|$)` +
    String.raw`(?:${ARG}(?:&&|;|\n))+ *${ENV}git(?: -C \S+)* pull(?=[ ;&|)\n]|$)`,
);
const REFUSED = /^(?:fatal:|error:| ! \[(?:remote )?rejected\])/m;
const HELD = /^(?:[Ee]rror:|fatal:|GraphQL:|X )|not mergeable|merge failed/m;
const TAGS_OUT = /^(?=[\s\S]*\n [*] \[new tag\])(?![\s\S]*\n (?:[ +-] |\* (?!\[new tag\])))/;
const QUIET = new RegExp(
  String.raw`^(?:${ARG}[;&|(\n] *)*` +
    PUSH +
    String.raw`(?=[ ;&|)\n]|$)(?!${ARG} (?:-h|--help)(?:[ ;&|)\n]|$))` +
    ARG +
    String.raw` (?:-q|--quiet)(?=[ ;&|)\n]|$)`,
);

/** One shell call as the hook sees it: the command, what it printed, its exit status if known. */
export interface ShellCall {
  command: string;
  output: string;
  exit?: number | null;
}

function ran(c: ShellCall, head: string, noop: string, said: RegExp): boolean {
  if (!new RegExp(at(head, noop)).test(c.command)) return false;
  const last = new RegExp(at(head, noop) + ARG + String.raw`\s*(?:&&|$)`).test(c.command);
  return ((c.exit ?? 0) === 0 && last) || said.test(c.output);
}

/** A push's arguments: tags only ("tag"), one bare refspec judged by output ("bare"), else "no". */
function tagOnly(args: string): "tag" | "bare" | "no" {
  let skip = false;
  let tags = false;
  let broad = false;
  const pos: string[] = [];
  for (const t of args.match(/(?:\\.|'[^']*'|"(?:[^"\\]|\\.)*"|[^ '"\\])+/g) ?? []) {
    if (skip) skip = false;
    else if (/^[0-9]*(?:>>?|<|>&)$/.test(t)) skip = true;
    else if (/^[0-9]*(?:>>?|<|>&)/.test(t)) continue;
    else if (/['"\\$`]/.test(t)) broad = true;
    else if (t === "--tags") tags = true;
    else if (/^(?:--(?:all|mirror|follow-tags|delete)(?:=|$)|-d$)/.test(t)) broad = true;
    else if (/^(?:-o|--push-option|--receive-pack|--exec)$/.test(t)) skip = true;
    else if (!t.startsWith("-")) pos.push(t);
  }
  const refs = pos.slice(1);
  let name = false;
  let ok = true;
  for (const r of refs) {
    if (name) name = false;
    else if (r === "tag") name = true;
    else if (!/^\+?refs\/tags\/[^:]+(?::refs\/tags\/[^:]+)?$/.test(r)) ok = false;
  }
  if (broad) return "no";
  if (ok && !name && (refs.length > 0 || tags)) return "tag";
  return refs.length === 1 && !tags && /^(?!refs\/|tag$)[^:+]+$/.test(refs[0] ?? "")
    ? "bare"
    : "no";
}

function tagsOnly(c: ShellCall): boolean {
  const all = new RegExp(String.raw`(?:^|[;&|(\n] *)${PUSH}(?=[ ;&|)\n]|$)(${ARG})`, "g");
  const kinds = [...c.command.matchAll(all)].map((m) => tagOnly(m[1] ?? ""));
  return (
    kinds.length > 0 &&
    !kinds.includes("no") &&
    (!kinds.includes("bare") || TAGS_OUT.test(`\n${c.output}`))
  );
}

/** A quiet push lands where HEAD equals its push ref on a branch other than the trunk. */
function quietLanded(cwd: string | null): boolean {
  if (!cwd) return false;
  const git = (...a: string[]): string => {
    try {
      const stdio: ("ignore" | "pipe")[] = ["ignore", "pipe", "ignore"];
      return execFileSync("git", a, { cwd, encoding: "utf8", stdio, windowsHide: true }).trim();
    } catch {
      return "";
    }
  };
  const head = git("rev-parse", "HEAD");
  const branch = git("rev-parse", "--abbrev-ref", "HEAD");
  return (
    head !== "" && head === git("rev-parse", "@{push}") && !["main", "master"].includes(branch)
  );
}

/** Whether the call pushed a branch; cwd — the session's directory for a quiet push. */
export function pushed(c: ShellCall, cwd: string | null): boolean {
  if (REFUSED.test(c.output) || tagsOnly(c)) return false;
  if (ran(c, PUSH, "-h|--help", /To [^\n]+(?:\n [!=] .*)*\n [ *+-]/)) return true;
  return QUIET.test(c.command) && !c.command.includes("<<") && quietLanded(cwd);
}

/** Whether the call merged: the forge's merge by outcome, or the trunk pulled. */
export function merged(c: ShellCall): boolean {
  if (HELD.test(c.output)) return false;
  const noop = "-h|--help|--auto|--disable-auto";
  return (
    ran(c, "gh pr merge", noop, /(Merged|Squashed and merged|Rebased and merged) pull request/) ||
    ran(c, "fj pr merge", noop, /Merged PR #/) ||
    ((c.exit ?? 0) === 0 && PULL.test(c.command))
  );
}
