// check-rituals (RITUALS); the bootstrap skill's hooks section name is HOOKS_SECTION in
// product.ts.
import type { Lang } from "../lang.ts";

export interface RitualWords {
  usage: () => string;
  fixScope: (section: string) => string;
  fixBroken: (section: string) => string;
  notChecked: (file: string, error: string | undefined) => string;
  noSubscription: () => string;
  hole: (file: string) => string;
  foreignWrites: (count: number) => string;
  lostSpelling: (mine: number, twin: number) => string;
  mute: () => string;
  broken: (hit: string) => string;
  unknownFlag: (flag: string) => string;
  noDir: (dir: string) => string;
  noPlugins: () => string;
}

const ruleEn = (section: string): string =>
  `the rule is the verstak skill's align method, "${section}"; the sample is its references/align-harness-surfaces.md`;

export const RITUALS: Readonly<Record<Lang, RitualWords>> = {
  en: {
    usage: () =>
      "node verstak-bridge.mjs check-rituals [repo...] [--json] [-- repo...]   (.opencode/plugins write into no session of another directory and do not break; no repo — the current directory)",
    fixScope: (section) =>
      `fix: the event-stream subscriber takes the event's directory (location.directory of the event or its data), canonicalises it and ctx.location.directory (realpath, the string on failure, no trailing separator) and skips a foreign one; ${ruleEn(section)}`,
    fixBroken: (section) =>
      `fix: a tool hook runs in its own session as written — its names defined, only the guard throws, on a memory path; ${ruleEn(section)}`,
    notChecked: (file, error) => `not checked  ${file}: ${error}`,
    noSubscription: () => " (no event-stream subscription — tool hooks only)",
    hole: (file) => `HOLE  ${file}`,
    foreignWrites: (count) =>
      `  writes into a session of another directory: ${count} writes on session.created — that session gets this repo's addresses`,
    lostSpelling: (mine, twin) =>
      `  its own session under another spelling of the folder gets no greeting (the real path: ${mine}, the instance's spelling: ${twin}) — directories are compared as raw strings, while one folder comes as /tmp/… and as /private/tmp/…`,
    mute: () =>
      "  subscribed to the event stream, yet its own root session got no greeting — the instance's directory is not taken from ctx.location.directory (Context has no ctx.directory) or the condition drops its own",
    broken: (hit) => `  a tool hook breaks in its own session (the plugin is run as is) — ${hit}`,
    unknownFlag: (flag) =>
      `unknown flag ${flag} (a directory of that name — ./${flag} or after --)`,
    noDir: (dir) => `no such directory: ${dir}`,
    noPlugins: () => "no plugins in .opencode/plugins",
  },
};
