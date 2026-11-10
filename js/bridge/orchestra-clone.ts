// The clone of a repository Orca does not know (graph @nks/nks-dev, nodes #10078, #9966, #4518;
// case №4206): only when the human's launcher description says clone, names clone_root and
// lists the call's host/org in allow. The url is https of the invite's repository host/org/repo;
// the folder is <clone_root>/<org>/<repo> and is never overwritten; the clone is Orca's own
// `project setup-clone`, one argv array, the machine's git credentials — the bridge holds none.
// Its form as Orca 1.4.242 answered (case №4221): --project is the id Orca derives from the
// remote (refused after the clone otherwise), --host local, --destination the parent folder,
// given canonical — a path Orca keeps as typed is not found as a worktree by `agent launch`.
// It runs in the daemon's background, not inside the tact (orchestra-cloning.ts).
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { isAbsolute, join } from "node:path";

import { run } from "./orchestra-orca.ts";

export interface ClonePolicy {
  root: string;
  /** host/org, the host in lower case. */
  allow: string[];
}

const ALLOW = /^[^\s/:@]+\/[^\s/:@]+$/;
const SEGMENT = /^[A-Za-z0-9._-]+$/;

const hostLower = (hostOrg: string): string => {
  const [host, org] = hostOrg.split("/");
  return `${host.toLowerCase()}/${org}`;
};

/** The description's clone fields; null — no clone; a code when they cannot stand. */
export function parseClone(d: Record<string, unknown>): ClonePolicy | null | { code: string } {
  if (d.clone === undefined || d.clone === false) return null;
  if (d.clone !== true) return { code: "clone_invalid" };
  const raw = typeof d.clone_root === "string" ? d.clone_root.trim() : "";
  const root = raw === "~" ? homedir() : raw.startsWith("~/") ? join(homedir(), raw.slice(2)) : raw;
  if (!root || !isAbsolute(root)) return { code: "clone_root_invalid" };
  const allow = d.allow;
  if (
    !Array.isArray(allow) ||
    !allow.length ||
    !allow.every((a) => typeof a === "string" && ALLOW.test(a.trim()))
  )
    return { code: "allow_invalid" };
  return { root, allow: (allow as string[]).map((a) => hostLower(a.trim())) };
}

/** Where and from what the repository would be cloned, or why not. */
export function cloneTarget(
  policy: ClonePolicy,
  repository: string,
): { url: string; project: string; parent: string; destination: string } | { code: string } {
  const parts = repository.split("/");
  if (parts.length !== 3 || !parts.every((p) => SEGMENT.test(p) && p !== "." && p !== ".."))
    return { code: "clone_refused (repository_form)" };
  const [rawHost, org, repo] = parts;
  const host = rawHost.toLowerCase();
  if (!policy.allow.includes(`${host}/${org}`)) return { code: "clone_refused (not_allowed)" };
  const parent = join(policy.root, org);
  const destination = join(parent, repo);
  if (existsSync(destination)) return { code: "clone_refused (destination_exists)" };
  return {
    url: `https://${host}/${org}/${repo}.git`,
    project: projectId(host, org, repo),
    parent,
    destination,
  };
}

/** The project id Orca 1.4.242 derives from the remote: github.com in lower case, any other
 * host as git:<host>/<org>/<repo> with the case kept (case №4221). */
export const projectId = (host: string, org: string, repo: string): string =>
  host === "github.com" ? `github:${org}/${repo}`.toLowerCase() : `git:${host}/${org}/${repo}`;

const CLONE_FLAGS = ["project", "host", "url", "destination", "json"];

/** The installed Orca declares setup-clone with every flag used (#9966). */
export async function cloneDeclared(): Promise<boolean> {
  const ctx = await run(["agent-context", "--json"], 10_000);
  try {
    const schema = JSON.parse(ctx.out) as {
      commands?: { command?: string; flags?: string[] }[];
    };
    const c = schema.commands?.find((x) => x.command === "project setup-clone");
    return ctx.code === 0 && !!c && CLONE_FLAGS.every((f) => c.flags?.includes(f));
  } catch {
    return false;
  }
}

/** Orca clones into <parent>/<repo>; parent is canonical (realpath) by the caller. */
export function cloneArgv(project: string, url: string, parent: string): string[] {
  return [
    "project",
    "setup-clone",
    "--project",
    project,
    "--host",
    "local",
    "--url",
    url,
    "--destination",
    parent,
    "--json",
  ];
}
