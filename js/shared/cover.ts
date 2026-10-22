// The project cover a root session seats itself by (opencode/rootseat.ts): the flat YAML
// front matter of the cover file in the session's directory. The file and the keys of the
// graph and the agent role are the delivery's (COVER); the reasons are its words.
//
// The keys come as forms by the repository's language (graph @nks/nks-dev, node #8497): the
// form whose keys stand in the front matter is the one read, and its language is the
// repository's; keys of two forms at once are an ambiguity. Deliveries may share a form's
// keys, so the stamp tells whose cover it is: the delivery's own stamp, or none — the keys
// decide; only another delivery's stamp (the delivery's stampShape, which leaves out the
// delivery's own older stamps, and none of its current ones) — a foreign cover, and nothing is
// said. Another delivery's keys are named nowhere.
//
// The graph is the value's working graph by the rule of shared/graphslot.ts (#8066): one head at
// its start, prose after it is no candidate, equal heads or doubt are ambiguity; the joining
// words are the form's (graphJoins). The role is exactly one reference "#N <open>name<close>" at the value's
// start, the quotes the form's (roleQuotes; the same character may open and close —
// the name runs to the first closing one); bare numbers elsewhere in the value (a contour, a
// neighbouring repo) are prose, not roles. No cover file at all — null: the project is not
// aligned, and nothing is said. The keys are a parameter (COVER by default): another
// delivery's cover form is read by the same rule.
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { COVER, ROOT_SEAT } from "../delivery/index.ts";
import { graphOfSlot } from "./graphslot.ts";
import { words } from "./lang.ts";

/** One language's form: the slots of the graph and the agent role, the role reference's quotes, the stamp. */
export interface CoverForm {
  readonly graph: string;
  /** Words listing equal graphs in the graph slot; none — only separators list them. */
  readonly graphJoins?: readonly string[];
  readonly role: string;
  readonly roleQuotes: readonly [string, string];
  /** The delivery's current alignment stamp in this language. */
  readonly stamp: RegExp;
}

/** A delivery's cover: the file, its forms by language, the shape of another delivery's stamp. */
export interface CoverKeys {
  readonly file: string;
  readonly forms: Readonly<Record<string, CoverForm>>;
  readonly stampShape: RegExp;
}

/** The seat the cover names, the reason it names none, a foreign delivery's cover, or null — no cover file. */
export type Cover = { realm: string; karta: string } | { why: string } | { foreign: true } | null;

const unquote = (v: string): string => {
  const t = v.trim();
  if (t.length >= 2 && t.startsWith("'") && t.endsWith("'"))
    return t.slice(1, -1).replace(/''/g, "'");
  if (t.length >= 2 && t.startsWith('"') && t.endsWith('"')) {
    try {
      return String(JSON.parse(t));
    } catch {
      return t.slice(1, -1);
    }
  }
  return t;
};

/**
 * Flat front matter: key → value; no opening and closing "---" — null. An indented line that is
 * no pair continues the value above it, kept after a newline: a slot reads its continuation apart.
 * Comment lines ("#" first after the indent) and blank lines continue nothing.
 */
export function frontMatter(text: string): Map<string, string> | null {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/);
  if (lines[0]?.trim() !== "---") return null;
  const end = lines.findIndex((l, i) => i > 0 && l.trim() === "---");
  if (end < 0) return null;
  const raw = new Map<string, string>();
  let last: string | null = null;
  for (const line of lines.slice(1, end)) {
    const kv = /^\s*('(?:[^']|'')*'|"(?:[^"\\]|\\.)*"|[^\s'"#][^:]*?)\s*:(?:\s+(.*))?$/.exec(line);
    if (kv) raw.set((last = unquote(kv[1])), kv[2] ?? "");
    else if (last !== null && /^\s+[^\s#]/.test(line))
      raw.set(last, `${raw.get(last)}\n${line.trim()}`);
  }
  return new Map([...raw].map(([k, v]) => [k, unquote(v)]));
}

/** The forms whose graph or role key stands in the front matter. */
const formsIn = (pairs: Map<string, string>, cover: CoverKeys): [string, CoverForm][] =>
  Object.entries(cover.forms).filter(([, f]) => pairs.has(f.graph) || pairs.has(f.role));

/** Whose stamp the cover file carries: the delivery's own, another delivery's, or none. */
export function stampOf(text: string, cover: CoverKeys = COVER): "own" | "foreign" | null {
  if (Object.values(cover.forms).some((f) => f.stamp.test(text))) return "own";
  return cover.stampShape.test(text) ? "foreign" : null;
}

/** Whether the front matter carries one of the delivery's forms. */
export const hasForm = (pairs: Map<string, string>, cover: CoverKeys = COVER): boolean =>
  formsIn(pairs, cover).length > 0;

/** The form the front matter is written in, with its language, or the reason there is none. */
export function formOf(
  pairs: Map<string, string>,
  cover: CoverKeys = COVER,
): { lang: string; form: CoverForm } | { why: string } {
  const W = words(ROOT_SEAT);
  const listed = (forms: CoverForm[]): string => forms.map((f) => `'${f.graph}'`).join(", ");
  const found = formsIn(pairs, cover);
  if (found.length > 1) return { why: W.manyForms(cover.file, listed(found.map(([, f]) => f))) };
  const [lang, form] = found[0] ?? [];
  if (!lang || !form) return { why: W.noForm(cover.file, listed(Object.values(cover.forms))) };
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

/** The graph and the role of a cover's slots, or the reason there is no seat. */
export function seatOfPairs(
  pairs: Map<string, string>,
  cover: CoverKeys = COVER,
): { realm: string; karta: string } | { why: string } {
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
  const pairs = frontMatter(text);
  if (!pairs) return { why: words(ROOT_SEAT).noFrontmatter(cover.file) };
  return seatOfPairs(pairs, cover);
}
