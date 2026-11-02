// The project cover a root session seats itself by (opencode/rootseat.ts): the YAML front matter
// of the cover file in the session's directory. Its form is the delivery's root key with the
// fields under it (shared/coverblock.ts, graph @nks/nks-dev, node #9316): the graph is one
// address, the role a number. The file and the root key are the delivery's (COVER); the reasons
// are its words. Another delivery's block or stamp — a foreign cover, and nothing is said.
//
// The flat form before it is read in passing. Its keys come as forms by the repository's language
// (#8497): the form whose keys stand in the front matter is the one read, keys of two forms at
// once are an ambiguity. Deliveries may share a form's keys, so the stamp tells whose cover it is:
// the delivery's own stamp, or none — the keys decide; only another delivery's stamp (stampShape,
// which leaves out the delivery's own older stamps) — a foreign cover. The graph is the value's
// working graph by the rule of shared/graphslot.ts (#8066); the role is exactly one reference
// "#N <open>name<close>" at the value's start, the quotes the form's (roleQuotes; the same
// character may open and close — the name runs to the first closing one). No cover file at all —
// null: the project is not aligned, and nothing is said. The keys are a parameter (COVER by
// default): another delivery's cover is read by the same rule.
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { COVER, ROOT_SEAT } from "../delivery/index.ts";
import { coverBlock, foreignBlock, frontMatter, stamped } from "./coverblock.ts";
import { graphOfSlot } from "./graphslot.ts";
import { words } from "./lang.ts";

export { frontMatter } from "./coverblock.ts";

/** One language's flat form: the slots of the graph and the agent role, the role's quotes, the stamp. */
export interface CoverForm {
  readonly graph: string;
  /** Words listing equal graphs in the graph slot; none — only separators list them. */
  readonly graphJoins?: readonly string[];
  readonly role: string;
  readonly roleQuotes: readonly [string, string];
  /** The delivery's current alignment stamp in this language. */
  readonly stamp: RegExp;
}

/** A delivery's cover: the file, its root key, the flat forms by language, another delivery's stamp. */
export interface CoverKeys {
  readonly file: string;
  readonly root: string;
  readonly forms: Readonly<Record<string, CoverForm>>;
  readonly stampShape: RegExp;
}

/** The seat the cover names, the reason it names none, a foreign delivery's cover, or null — no cover file. */
export type Cover = { realm: string; karta: string } | { why: string } | { foreign: true } | null;
type Seat = { realm: string; karta: string } | { why: string };

/** The forms whose graph or role key stands in the front matter. */
const formsIn = (pairs: Map<string, string>, cover: CoverKeys): [string, CoverForm][] =>
  Object.entries(cover.forms).filter(([, f]) => pairs.has(f.graph) || pairs.has(f.role));

/** Whose stamp the cover file carries: the delivery's own, another delivery's, or none. */
export function stampOf(text: string, cover: CoverKeys = COVER): "own" | "foreign" | null {
  const block = coverBlock(text, cover.root);
  if ((block && stamped(block)) || Object.values(cover.forms).some((f) => f.stamp.test(text)))
    return "own";
  if (block) return null;
  return foreignBlock(text, cover.root) || cover.stampShape.test(text) ? "foreign" : null;
}

/** Whether the front matter carries the delivery's cover, in its block or a flat form. */
export function hasCover(text: string, cover: CoverKeys = COVER): boolean {
  if (coverBlock(text, cover.root)) return true;
  const pairs = frontMatter(text);
  return !!pairs && formsIn(pairs, cover).length > 0;
}

/** The flat form the front matter is written in, with its language, or the reason there is none. */
export function formOf(
  pairs: Map<string, string>,
  cover: CoverKeys = COVER,
): { lang: string; form: CoverForm } | { why: string } {
  const W = words(ROOT_SEAT);
  const listed = (keys: string[]): string => keys.map((k) => `'${k}'`).join(", ");
  const found = formsIn(pairs, cover);
  if (found.length > 1)
    return { why: W.manyForms(cover.file, listed(found.map(([, f]) => f.graph))) };
  const [lang, form] = found[0] ?? [];
  const all = [cover.root, ...Object.values(cover.forms).map((f) => f.graph)];
  if (!lang || !form) return { why: W.noForm(cover.file, listed(all)) };
  return { lang, form };
}

const LEAD = /^[\s`'"<]*/;
const esc = (t: string): string => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** The role reference in a form's quotes: "#N", spaces, the opening quote, the name up to the first closing one. */
const roleRef = (q: readonly [string, string], flags = ""): RegExp =>
  new RegExp(
    `${flags.includes("g") ? "" : "^"}#(\\d+)\\s*${esc(q[0])}[\\s\\S]*?${esc(q[1])}`,
    flags,
  );

const distinct = (re: RegExp, v: string): string[] => [
  ...new Set([...v.matchAll(re)].map((m) => m[1] as string)),
];

/** The graph and the role of the delivery's block: one address and a number. */
export function seatOfBlock(block: Map<string, string>, cover: CoverKeys = COVER): Seat {
  const W = words(ROOT_SEAT);
  const key = (f: string): string => `${cover.root}.${f}`;
  const graph = block.get("graph")?.trim();
  if (!graph) return { why: W.noKey(cover.file, key("graph")) };
  if (!/^(?:r\d+|@[\w.-]+\/[\w.-]*\w)$/.test(graph))
    return { why: W.noGraph(cover.file, key("graph")) };
  const role = block.get("agent_role")?.trim();
  if (!role) return { why: W.noKey(cover.file, key("agent_role")) };
  if (!/^\d+$/.test(role)) return { why: W.notNumber(cover.file, key("agent_role")) };
  return { realm: graph, karta: role };
}

/** The graph and the role of a flat cover's slots, or the reason there is no seat. */
export function seatOfPairs(pairs: Map<string, string>, cover: CoverKeys = COVER): Seat {
  const W = words(ROOT_SEAT);
  const of = formOf(pairs, cover);
  if ("why" in of) return of;
  const keys = of.form;
  const graph = pairs.get(keys.graph)?.trim();
  if (!graph) return { why: W.noKey(cover.file, keys.graph) };
  const role = pairs.get(keys.role)?.trim();
  if (!role) return { why: W.noKey(cover.file, keys.role) };

  const g = graphOfSlot(graph.replace(LEAD, ""), keys.graphJoins ?? []);
  if (!g) return { why: W.noGraph(cover.file, keys.graph) };
  if ("many" in g) return { why: W.manyGraphs(cover.file, keys.graph, g.many.join(", ")) };

  const r = role.replace(LEAD, "");
  const roles = distinct(roleRef(keys.roleQuotes, "g"), r);
  if (roles.length > 1)
    return { why: W.manyRoles(cover.file, keys.role, roles.map((n) => `#${n}`).join(", ")) };
  const first = roleRef(keys.roleQuotes).exec(r);
  if (!first)
    return {
      why: W.noRoleRef(cover.file, keys.role, `#N ${keys.roleQuotes[0]}…${keys.roleQuotes[1]}`),
    };

  return { realm: g.realm, karta: first[1] as string };
}

/** The cover of a directory. */
export function readCover(dir: string, cover: CoverKeys = COVER): Cover {
  let text: string;
  try {
    text = readFileSync(join(dir, cover.file), "utf8");
  } catch {
    return null;
  }
  if (stampOf(text, cover) === "foreign") return { foreign: true };
  const block = coverBlock(text, cover.root);
  if (block) return seatOfBlock(block, cover);
  const pairs = frontMatter(text);
  if (!pairs) return { why: words(ROOT_SEAT).noFrontmatter(cover.file) };
  return seatOfPairs(pairs, cover);
}
