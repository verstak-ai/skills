// check-rituals: an auditor of the OpenCode ritual plugins in a repo (graph @nks/nks-dev,
// nodes #6686, #5048). Each .opencode/plugins/* is loaded against a stand-in ctx
// (cli/ritualprobe.ts): its event subscriber writes into no session of a foreign
// directory, greets its own root under either spelling, and its tool hooks do not
// break in its own session. Exit 1 on a hole, a breakage or a plugin that did not load.
import { mkdtempSync, readdirSync, realpathSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { HOOKS_SECTION, RITUALS, type RitualWords } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import { probeScope, type Scope } from "./ritualprobe.ts";

const out = (s: string): void => {
  process.stdout.write(s + "\n");
};

const rw = (): RitualWords => words(RITUALS);

export interface Verdict {
  file: string;
  hole: boolean;
  scope?: Scope;
  error?: string;
}

export async function auditRepo(repo: string): Promise<Verdict[]> {
  const own = realpathSync(repo);
  const dir = join(own, ".opencode", "plugins");
  let names: string[];
  try {
    names = readdirSync(dir).filter((n) => /\.(m?js|ts)$/.test(n));
  } catch {
    return [];
  }
  const foreign = realpathSync(mkdtempSync(join(tmpdir(), "ritual-scope-foreign-")));
  const verdicts: Verdict[] = [];
  try {
    for (const name of names.sort()) {
      const file = join(dir, name);
      try {
        const scope = await probeScope(file, own, foreign);
        const hole =
          scope.writes.theirs > 0 || lostSpelling(scope) || mute(scope) || scope.broken.length > 0;
        verdicts.push({ file, hole, scope });
      } catch (e) {
        verdicts.push({ file, hole: true, error: String((e as Error)?.message ?? e) });
      }
    }
  } finally {
    rmSync(foreign, { recursive: true, force: true });
  }
  return verdicts;
}

/** Its own session greeted under one spelling of the directory and lost under the other. */
const lostSpelling = (s: Scope): boolean => s.writes.mine > 0 !== s.writes.twin > 0;

/** Subscribed to the event stream, yet greets its own root session under no spelling. */
const mute = (s: Scope): boolean => s.subscribed && s.writes.mine + s.writes.twin === 0;

function verdictLines(v: Verdict): string[] {
  const s = v.scope;
  if (v.error || !s) return [rw().notChecked(v.file, v.error)];
  if (!v.hole) {
    const quiet = s.subscribed ? "" : rw().noSubscription();
    return [`ok  ${v.file}${quiet}`];
  }
  const lines = [rw().hole(v.file)];
  if (s.writes.theirs > 0) lines.push(rw().foreignWrites(s.writes.theirs));
  if (lostSpelling(s)) lines.push(rw().lostSpelling(s.writes.mine, s.writes.twin));
  if (mute(s)) lines.push(rw().mute());
  if (s.writes.theirs > 0 || lostSpelling(s) || mute(s))
    lines.push(`  ${rw().fixScope(HOOKS_SECTION)}`);
  for (const h of s.broken) lines.push(rw().broken(h));
  if (s.broken.length) lines.push(`  ${rw().fixBroken(HOOKS_SECTION)}`);
  return lines;
}

export const RITUALS_USAGE = (): string => rw().usage();

const isDir = (p: string): boolean => {
  try {
    return statSync(p).isDirectory();
  } catch {
    return false;
  }
};

/** A call error word and exit code 2, without a stack trace. */
const refuse = (word: string): void => {
  process.stderr.write(`check-rituals: ${word}\n${RITUALS_USAGE()}\n`);
  process.exitCode = 2;
};

export async function runCheckRituals(argv: string[]): Promise<void> {
  // After `--` there are no flags: everything is a directory, even one starting with "-".
  const end = argv.indexOf("--");
  const head = end < 0 ? argv : argv.slice(0, end);
  const tail = end < 0 ? [] : argv.slice(end + 1);
  if (head.includes("--help") || head.includes("-h")) return out(RITUALS_USAGE());
  const flag = head.find((a) => a.startsWith("-") && a !== "--json");
  if (flag) return refuse(rw().unknownFlag(flag));
  const json = head.includes("--json");
  const repos = [...head.filter((a) => a !== "--json"), ...tail].map((a) => resolve(a));
  const missing = repos.find((r) => !isDir(r));
  if (missing) return refuse(rw().noDir(missing));
  const verdicts: Verdict[] = [];
  for (const repo of repos.length ? repos : [resolve(".")])
    verdicts.push(...(await auditRepo(repo)));
  if (json) out(JSON.stringify(verdicts));
  else if (verdicts.length === 0) out(rw().noPlugins());
  else for (const v of verdicts) for (const line of verdictLines(v)) out(line);
  // A plugin may leave timers and subscriptions behind: exit once the output is flushed.
  const code = verdicts.some((v) => v.hole) ? 1 : 0;
  process.stdout.write("", () => process.exit(code));
}
