// The files of `prepare` (graph @nks/nks-dev, node #9319): the cover written by the one writer
// (shared/coverblock.ts, form #9316), the stubs the bootstrap leaves where nothing stands — the
// reality file, the pointer for Claude Code — and the repository's address from origin. A file
// that already stands is never rewritten beyond the cover block.
import { spawnSync } from "node:child_process";
import {
  existsSync,
  lstatSync,
  readFileSync,
  readlinkSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

import { COVER, PREPARE } from "../delivery/index.ts";
import { hasCover, stampOf } from "../shared/cover.ts";
import {
  coverBlock,
  type CoverData,
  FIELDS,
  repeatedKeys,
  ritualsOf,
} from "../shared/coverblock.ts";
import { writeCover } from "../shared/coverwrite.ts";
import { words } from "../shared/lang.ts";
import { ownRitualsPlugin } from "../shared/ritualcover.ts";
import { type Outcome } from "./preparehooks.ts";

const git = (dir: string, ...args: string[]): string | null => {
  const r = spawnSync("git", ["-C", dir, ...args], { encoding: "utf8", windowsHide: true });
  return r.status === 0 ? r.stdout.trim() : null;
};

/** The top of the work tree holding dir; null — no repository. */
export const repoRoot = (dir: string): string | null => git(dir, "rev-parse", "--show-toplevel");

/** origin as host/owner/repo, without the scheme, the user, the port and ".git"; none — null. */
export function repositoryOf(root: string): string | null {
  const url = git(root, "remote", "get-url", "origin");
  if (!url) return null;
  const scp = /^[^/:]+@([^/:]+):(.+)$/.exec(url);
  const path = scp
    ? `${scp[1]}/${scp[2]}`
    : url
        .replace(/^[a-z][\w+.-]*:\/\//i, "")
        .replace(/^[^/@]+@/, "")
        .replace(/:\d+\//, "/");
  return path.replace(/\.git$/, "").replace(/\/+$/, "") || null;
}

type CoverText = {
  file: string;
  before: string | null;
  text: string;
  data: CoverData;
  repeated: string[];
};

/**
 * The cover's text as it will stand, the data in it — or the refusal, nothing written. A key named
 * twice before or after the write keeps the file as it stands; a doubled field of the block is no
 * address (#9314).
 */
export function coverText(root: string, given: CoverData): CoverText | { why: string } {
  const W = words(PREPARE);
  const file = join(root, COVER.file);
  const before = existsSync(file) ? readFileSync(file, "utf8") : null;
  if (before !== null && stampOf(before) === "foreign") return { why: W.foreign(COVER.file) };
  const had = before === null ? null : coverBlock(before, COVER.root);
  const twice = before === null ? [] : repeatedKeys(before);
  const data: CoverData = {};
  for (const k of FIELDS) {
    const v = given[k] ?? (twice.includes(`${COVER.root}.${k}`) ? undefined : had?.get(k));
    if (v !== undefined && v !== "") data[k] = v;
  }
  const text = writeCover(before, COVER.root, data);
  const repeated = [...new Set([...twice, ...repeatedKeys(text)])];
  if (repeated.length) return { file, before, text: before ?? text, data, repeated };
  const read = coverBlock(text, COVER.root);
  if (!read || FIELDS.some((k) => (read.get(k) ?? "") !== String(data[k] ?? "")))
    return { why: W.unparsed(COVER.file) };
  return { file, before, text, data, repeated };
}

/**
 * The cover written; what is missing in it, a ritual it names that the delivery has not, a flat
 * cover beside it, a key twice — to the model.
 */
export function writeAgents(c: CoverText, out: Outcome): void {
  if (c.repeated.length) {
    out.left.push("cover.repeat");
    out.repeated = c.repeated;
  } else if (c.text === c.before) out.kept.push(COVER.file);
  else {
    writeFileSync(c.file, c.text);
    out.done.push(COVER.file);
  }
  for (const k of ["graph", "holon", "agent_role", "contract"] as const)
    if (c.data[k] === undefined) out.left.push(`cover.${k}` as const);
  if (c.repeated.length) return;
  const { unknown } = ritualsOf(coverBlock(c.text, COVER.root));
  if (unknown.length) {
    out.left.push("cover.rituals");
    out.rituals = unknown;
  }
  if (c.before !== null && !coverBlock(c.before, COVER.root) && hasCover(c.before))
    out.left.push("cover.flat");
}

/** The reality stub where no file stands; the bare stub learns the case once it is named. */
export function writeReality(root: string, caseNo: string | undefined, out: Outcome): void {
  const file = join(root, "REALITY.md");
  const stub = words(PREPARE).reality(caseNo);
  const had = existsSync(file) ? readFileSync(file, "utf8") : null;
  if (had !== null && (had === stub || !caseNo || had !== words(PREPARE).reality()))
    return void out.kept.push("REALITY.md");
  writeFileSync(file, stub);
  out.done.push("REALITY.md");
}

/** CLAUDE.md: a link to the cover file where links work, else the one-line import. */
export function writeClaude(root: string, out: Outcome): void {
  const file = join(root, "CLAUDE.md");
  const st = lstatSync(file, { throwIfNoEntry: false });
  if (st?.isSymbolicLink()) {
    out[readlinkSync(file) === COVER.file ? "kept" : "left"].push("CLAUDE.md");
    return;
  }
  if (st) {
    const lines = readFileSync(file, "utf8").split(/\r?\n/);
    out[lines.includes(`@${COVER.file}`) ? "kept" : "left"].push("CLAUDE.md");
    return;
  }
  const links = process.platform !== "win32" && git(root, "config", "core.symlinks") !== "false";
  if (links) symlinkSync(COVER.file, file);
  else writeFileSync(file, `@${COVER.file}\n`);
  out.done.push("CLAUDE.md");
}

/** A rituals plugin of the repository's own: the delivery carries them, named for the transition. */
export function checkOpencode(root: string, out: Outcome): void {
  if (ownRitualsPlugin(root)) out.left.push("opencode.rituals");
}
