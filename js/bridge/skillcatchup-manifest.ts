// Pinned source inventory for #10122 (@nks/nks-dev); no archive extraction here.
import { BRIDGE_SKILL, PRODUCT, SKILL_SET } from "../delivery/index.ts";
import { namedFetch } from "../shared/http.ts";
import { compareVersions } from "../shared/semver.ts";
import { VERSION } from "../shared/version.ts";
import { RELEASES_URL, resolveTag } from "./releases.ts";

export interface SkillManifest {
  sha: string;
  names: string[];
  hashes: Record<string, string>;
  files: Record<string, string>;
}
const safeSkillName = (s: string): boolean => /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(s);
const sha = (v: unknown): v is string => typeof v === "string" && /^[a-f0-9]{40}$/.test(v);

async function json(path: string): Promise<unknown> {
  const url = new URL(`/repos/${SKILL_SET}/${path}`, RELEASES_URL);
  const r = await namedFetch(url.toString(), {
    headers: { accept: "application/vnd.github+json" },
    signal: AbortSignal.timeout(5000),
  });
  if (!r.ok) throw new Error(`manifest_http_${r.status}`);
  return r.json();
}

export async function pinnedSkillManifest(): Promise<SkillManifest> {
  let tag = await resolveTag(false);
  if (tag && compareVersions(tag, VERSION) < 0) tag = await resolveTag(true);
  // Do not silently install main, or a delivery ahead of the bridge executing this move.
  if (tag !== `v${VERSION}`) throw new Error("bridge_release_not_current");
  const commit = (await json(`commits/${encodeURIComponent(tag)}`)) as { sha?: unknown };
  if (!sha(commit?.sha)) throw new Error("commit_sha_unknown");
  const body = (await json(`git/trees/${commit.sha}?recursive=1`)) as {
    sha?: unknown;
    truncated?: unknown;
    tree?: { path?: unknown; type?: unknown; mode?: unknown; sha?: unknown }[];
  };
  if (body?.sha !== commit.sha || body.truncated !== false || !Array.isArray(body.tree))
    throw new Error("incomplete_pinned_tree");
  const hashes: Record<string, string> = Object.create(null) as Record<string, string>;
  const files: Record<string, string> = Object.create(null) as Record<string, string>;
  const names: string[] = [];
  for (const entry of body.tree) {
    if (typeof entry?.path !== "string") throw new Error("invalid_tree_path");
    const path = entry.path;
    if (
      path.includes("\\") ||
      path.includes("\0") ||
      path.split("/").some((p) => p === "." || p === ".." || !p)
    )
      throw new Error("invalid_tree_path");
    if (path.startsWith("skills/") && (entry.mode === "120000" || entry.mode === "160000"))
      throw new Error("source_link_or_submodule");
    if (path.startsWith("skills/") && entry.type === "blob") {
      if (
        !sha(entry.sha) ||
        (entry.mode !== "100644" && entry.mode !== "100755") ||
        files[path.slice(7)]
      )
        throw new Error("invalid_or_duplicate_source_blob");
      files[path.slice(7)] = entry.sha;
    }
    if (/^skills\/[^/]+$/.test(path) && entry.type === "tree" && sha(entry.sha))
      hashes[path.slice(7)] = entry.sha;
    if (!path.startsWith("skills/") || !path.endsWith("/SKILL.md")) continue;
    const m = /^skills\/([^/]+)\/SKILL\.md$/.exec(path);
    const name = m?.[1];
    if (!name || !safeSkillName(name) || entry.type !== "blob" || entry.mode !== "100644")
      throw new Error("unsafe_or_ambiguous_skill_name");
    if (names.includes(name)) throw new Error("duplicate_skill_name");
    names.push(name);
  }
  names.sort();
  if (
    names.length > 128 ||
    !names.includes(BRIDGE_SKILL) ||
    !names.includes(PRODUCT) ||
    names.some((n) => !hashes[n])
  )
    throw new Error("incomplete_skill_inventory");
  return { sha: commit.sha, names, hashes, files };
}
