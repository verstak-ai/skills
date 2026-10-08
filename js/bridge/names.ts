// The standing name is the seat's address (graph @nks/nks-dev, node #5068): an explicit
// name is taken exactly or refused aloud; a derived name (host.repo.model) over the
// server's limit is cut with a note. A silently cut explicit name would address ANOTHER seat.
import { execFileSync } from "node:child_process";
import { realpathSync } from "node:fs";
import { hostname } from "node:os";
import { basename, dirname, resolve } from "node:path";

import { NAMES, type NameWords } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import { NAME_MAX } from "../shared/satname.ts";
import { sessionCwd } from "../shared/scope.ts";

// The server's standing-name rule (observed via a 400 refusal), shared with the OpenCode plugin.
export { NAME_MAX };

const nw = (): NameWords => words(NAMES);

/**
 * Role as the board prints it (bare digits or a sentinel: agent, me, realm-owner), name
 * without padding — one normalization for writing the binding and for comparing: a raw
 * record missed its normalized twin and the bridge did not know its own socket
 * (graph @nks/nks-dev, node #5154).
 */
export const normKarta = (k: unknown): string =>
  String(k ?? "")
    .trim()
    .replace(/^#/, "");
export const normName = (n: unknown): string => (typeof n === "string" ? n.trim() : "");
const NAME_RE = /^[a-z0-9][a-z0-9._-]*$/;

/** One part of a derived name brought to the rule. */
export const sanitize = (s: string): string =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(0, NAME_MAX);

/** How an explicit name breaks the rule, in words; null if it does not. */
export function nameFault(name: string): string | null {
  if (name.length > NAME_MAX) return nw().overLimit(name.length);
  if (!NAME_RE.test(name)) return /[A-Z]/.test(name) ? nw().capitals() : nw().badSigns();
  return null;
}

/** The model may carry dots (`glm-5.3`), so a name is never split on dots. */
export interface NameParts {
  host: string;
  repo: string;
  model: string;
}
const PART_MIN = 3;
const CUT_ORDER: (keyof NameParts)[] = ["repo", "host", "model"];

/**
 * Cut a derived name over the limit: repo, then host, the model last — it tells
 * sessions of one machine apart. Returns the name and the parts cut.
 */
export function fitName(parts: NameParts): { name: string; cut: (keyof NameParts)[] } {
  const p = { ...parts };
  const join = (): string =>
    [p.host, p.repo, p.model]
      .filter(Boolean)
      .join(".")
      .replace(/[-.]+$/, "");
  const cut: (keyof NameParts)[] = [];
  for (const k of CUT_ORDER) {
    const over = join().length - NAME_MAX;
    if (over <= 0) break;
    const keep = Math.max(k === "model" ? 1 : PART_MIN, p[k].length - over);
    if (keep >= p[k].length) continue;
    p[k] = p[k].slice(0, keep).replace(/[-.]+$/, "");
    cut.push(k);
  }
  return {
    name: join()
      .slice(0, NAME_MAX)
      .replace(/[-.]+$/, ""),
    cut,
  };
}

export const git = (args: string[], cwd: string = sessionCwd()): string => {
  try {
    return execFileSync("git", args, {
      cwd,
      timeout: 2000,
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
  } catch {
    return "";
  }
};

const real = (p: string): string => {
  try {
    return realpathSync(p);
  } catch {
    return p;
  }
};

/**
 * Repo name for the session directory; a linked worktree's toplevel is the task dir, so it
 * takes the name from the main copy, a bare repo from origin (graph @nks/nks-dev, node #5108).
 */
export function repoName(cwd: string = sessionCwd()): string {
  const top = git(["rev-parse", "--show-toplevel"], cwd);
  const [gitDir, common] = git(["rev-parse", "--git-dir", "--git-common-dir"], cwd).split("\n");
  if (!gitDir || !common || real(resolve(cwd, gitDir)) === real(resolve(cwd, common)))
    return basename(top || cwd);
  const shared = real(resolve(cwd, common));
  if (basename(shared) === ".git") return basename(dirname(shared));
  const origin = git(["remote", "get-url", "origin"], cwd).replace(/\/+$/, "");
  const fromOrigin = basename(origin.replace(/^.*:/, "/")).replace(/\.git$/, "");
  return fromOrigin || basename(top || cwd);
}

/**
 * host.repo.model — what a fresh session restores without memory; the model is a
 * parameter (only the agent knows it), its vendor prefix dropped; the repo comes
 * from the harness session's cwd: the OpenCode plugin launches the bridge from the server's
 * cwd (graph @nks/nks-dev, node #5108). At launch the branch is nearly always main and tells
 * nothing apart; the model tells sessions of one machine over one repo apart.
 */
export function deriveParts(model?: string, cwd: string = sessionCwd()): NameParts {
  const host = hostname().split(".")[0];
  const repo = repoName(cwd);
  const short = (model ?? "")
    .trim()
    .toLowerCase()
    .replace(/^claude[-_]/, "");
  return { host: sanitize(host ?? ""), repo: sanitize(repo), model: sanitize(short) };
}

export const joinName = (p: NameParts): string =>
  [p.host, p.repo, p.model].filter(Boolean).join(".");
