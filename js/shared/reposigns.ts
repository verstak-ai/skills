// Whether a repository was ever aligned for the agent, read locally and only locally: no
// network, no platform call, no seat. The signs the bootstrap leaves in the repository —
// the cover's front matter, the stamp, and a start hook for each harness it writes one for
// (a Claude Code SessionStart entry with the delivery's mark, the OpenCode rituals plugin);
// the files and marks are the delivery's (REPO_SIGNS, COVER). The repository is the nearest
// directory upward with a .git entry (a directory, or the file of a worktree); none —
// "outside", and nothing is said. No sign at all — "invite". Otherwise "aligned" when
// everything the bootstrap writes for the calling harness is there, "partial" when some of
// it is missing — which the door's alignment leads, not an invitation. A harness the
// bootstrap writes no start hook for (null) needs none. The cover and the stamp count in any
// of the delivery's languages (shared/cover.ts); a cover file stamped by another delivery and
// no start hook of this one — "foreign", and nothing is said (graph @nks/nks-dev, node #8089).
import { readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

import { COVER, REPO_SIGNS } from "../delivery/index.ts";
import { type CoverKeys, frontMatter, hasForm, stampOf } from "./cover.ts";

export type RepoVerdict = "invite" | "aligned" | "partial" | "outside" | "foreign";

/** The harness asking: the ones the bootstrap writes a start hook for, or null — any other. */
export type HookHarness = "claude-code" | "opencode" | null;

export interface RepoSigns {
  root: string | null;
  cover: boolean;
  stamp: boolean;
  hooks: { "claude-code": boolean; opencode: boolean };
  verdict: RepoVerdict;
}

export interface SignKeys {
  readonly settings: string;
  readonly startMark: RegExp;
  readonly rituals: string;
}

const exists = (path: string): boolean => {
  try {
    statSync(path);
    return true;
  } catch {
    return false;
  }
};

const text = (path: string): string | null => {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return null;
  }
};

/** The nearest directory upward holding .git; none — null. */
export function repoRoot(dir: string): string | null {
  let at = resolve(dir);
  for (;;) {
    if (exists(join(at, ".git"))) return at;
    const up = dirname(at);
    if (up === at) return null;
    at = up;
  }
}

/** A SessionStart entry whose command carries the delivery's mark. */
function startHook(settings: string | null, mark: RegExp): boolean {
  if (settings === null) return false;
  try {
    const entries = (JSON.parse(settings) as { hooks?: { SessionStart?: unknown } })?.hooks
      ?.SessionStart;
    if (!Array.isArray(entries)) return false;
    return entries.some(
      (e) =>
        Array.isArray((e as { hooks?: unknown })?.hooks) &&
        (e as { hooks: unknown[] }).hooks.some((h) => {
          const command = (h as { command?: unknown })?.command;
          return typeof command === "string" && mark.test(command);
        }),
    );
  } catch {
    return false;
  }
}

/** The signs of the repository holding dir, and what they call for in the given harness. */
export function repoSigns(
  dir: string,
  harness: HookHarness,
  keys: SignKeys = REPO_SIGNS,
  cover: CoverKeys = COVER,
): RepoSigns {
  const root = repoRoot(dir);
  const hooks = { "claude-code": false, opencode: false };
  if (root === null) return { root, cover: false, stamp: false, hooks, verdict: "outside" };
  const agents = text(join(root, cover.file));
  const pairs = agents === null ? null : frontMatter(agents);
  const stamped = agents === null ? null : stampOf(agents, cover);
  const signs = {
    cover: !!pairs && stamped !== "foreign" && hasForm(pairs, cover),
    stamp: stamped === "own",
    hooks: {
      "claude-code": startHook(text(join(root, keys.settings)), keys.startMark),
      opencode: exists(join(root, keys.rituals)),
    },
  };
  const hooked = signs.hooks["claude-code"] || signs.hooks.opencode;
  const any = signs.cover || signs.stamp || hooked;
  const complete = signs.cover && signs.stamp && (harness === null || signs.hooks[harness]);
  const verdict =
    stamped === "foreign" && !hooked
      ? "foreign"
      : !any
        ? "invite"
        : complete
          ? "aligned"
          : "partial";
  return { root, ...signs, verdict };
}
