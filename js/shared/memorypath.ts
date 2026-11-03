// Whether a path lands in the harness's local project memory (graph @nks/nks-dev, node #9319,
// section RITUALS): the memory-guard's rule. A relative path is taken from the session's
// directory; the path is resolved component by component as realpath -m does — an existing
// link is replaced by its target, ".." applies to the resolved prefix, a missing tail stays
// text. More than 40 hops, a link that does not read or a link lying in memory — refused
// (closed on failure). Memory is known under ~/.claude/projects, behind a link too, and
// regardless of case (one folder on APFS and Windows).
import { lstatSync, readlinkSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, isAbsolute, join, parse } from "node:path";

const slash = (p: string): string => p.replaceAll("\\", "/");
const parts = (p: string): string[] => p.slice(parse(p).root.length).split(/[\\/]+/);

/** The resolved path; null — not resolved (limit, cycle, unreadable link) or a link in memory. */
function real(p: string, inMemory: (q: string) => boolean = () => false): string | null {
  let r = parse(p).root;
  let rest = parts(p);
  let hops = 0;
  while (rest.length) {
    const c = rest.shift() as string;
    if (!c || c === ".") continue;
    if (c === "..") {
      r = dirname(r);
      continue;
    }
    const q = join(r, c);
    let link = false;
    try {
      link = lstatSync(q).isSymbolicLink();
    } catch {
      /* missing — the tail stays text */
    }
    if (!link) {
      r = q;
      continue;
    }
    let l = "";
    try {
      l = readlinkSync(q);
    } catch {
      /* unreadable — not resolved */
    }
    if (++hops > 40 || !l || inMemory(q)) return null;
    if (isAbsolute(l)) r = parse(l).root;
    rest = [...parts(l), ...rest];
  }
  return r;
}

/** Whether the path, as a tool would write it from base, is in local project memory. */
export function inLocalMemory(path: string, base: string): boolean {
  const home = join(homedir(), ".claude", "projects");
  const projects = slash(real(home) ?? home).toLowerCase();
  const inMemory = (p: string): boolean => {
    const x = `${slash(p)}/`.toLowerCase();
    return (
      /\/\.claude\/projects\/.*\/memory\//.test(x) ||
      (x.startsWith(`${projects}/`) && /\/memory\//.test(x.slice(projects.length)))
    );
  };
  // Joined as text: ".." must apply after the links before it resolve, not before.
  const abs = isAbsolute(path) ? path : `${base || process.cwd()}/${path}`;
  const r = real(abs, inMemory);
  return r === null || inMemory(abs) || inMemory(r);
}
