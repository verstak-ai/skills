// The machine cover of a project (graph @nks/nks-dev, node #9316): one root key of the cover
// file's YAML front matter — the delivery's (COVER.root) — and under it, one level deep, the
// fields known before any graph is read: graph (rN), holon, agent_role, contract, stamp. Read
// and written here without a model and without a YAML library, so the bootstrap and a bridge
// subcommand write the same bytes (#9319). Another top-level block carrying a contract is
// another delivery's cover; its key is named nowhere.

/** The cover's fields, in the order they are written. */
export const FIELDS = ["graph", "holon", "agent_role", "contract", "stamp"] as const;
export type CoverField = (typeof FIELDS)[number];
export type CoverData = Partial<Record<CoverField, string | number>>;

/** A YAML scalar as written: single quotes doubled inside, double quotes JSON-escaped, else bare. */
export const unquote = (v: string): string => {
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

const KEY = String.raw`('(?:[^']|'')*'|"(?:[^"\\]|\\.)*"|[^\s'"#][^:]*?)`;
const PAIR = new RegExp(String.raw`^\s*${KEY}\s*:(?:\s+(.*))?$`);
/** A block's root line: the key alone, or with a comment after a space. */
const TOP = new RegExp(String.raw`^${KEY}\s*:(?:\s+#.*)?\s*$`);
const CHILD = new RegExp(String.raw`^\s+${KEY}\s*:(?:\s+(.*))?$`);
/** A bare value ends where a comment starts. */
const bare = (v: string): string => unquote(/^['"]/.test(v.trim()) ? v : v.replace(/\s+#.*$/, ""));

/** The lines of the text and the indexes of its front matter's fences; none — null. */
function fences(text: string): { lines: string[]; end: number } | null {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/);
  if (lines[0]?.trim() !== "---") return null;
  const end = lines.findIndex((l, i) => i > 0 && l.trim() === "---");
  return end < 0 ? null : { lines, end };
}

/**
 * Flat front matter: key → value; no opening and closing "---" — null. An indented line that is
 * no pair continues the value above it, kept after a newline: a slot reads its continuation apart.
 * Comment lines ("#" first after the indent) and blank lines continue nothing.
 */
export function frontMatter(text: string): Map<string, string> | null {
  const f = fences(text);
  if (!f) return null;
  const raw = new Map<string, string>();
  let last: string | null = null;
  for (const line of f.lines.slice(1, f.end)) {
    const kv = PAIR.exec(line);
    if (kv) raw.set((last = unquote(kv[1] as string)), kv[2] ?? "");
    else if (last !== null && /^\s+[^\s#]/.test(line))
      raw.set(last, `${raw.get(last)}\n${line.trim()}`);
  }
  return new Map([...raw].map(([k, v]) => [k, unquote(v)]));
}

/** The front matter's blocks: a top-level key without a value, then its indented pairs. */
export function coverBlocks(text: string): Map<string, Map<string, string>> {
  const blocks = new Map<string, Map<string, string>>();
  const f = fences(text);
  let open: Map<string, string> | null = null;
  for (const line of f ? f.lines.slice(1, f.end) : []) {
    if (/^\s*(#|$)/.test(line)) continue;
    const top = TOP.exec(line);
    const child = open && CHILD.exec(line);
    if (top) blocks.set(unquote(top[1] as string), (open = new Map()));
    else if (open && child) open.set(unquote(child[1] as string), bare(child[2] ?? ""));
    else open = null;
  }
  return blocks;
}

/** Keys named twice — top-level, or root.field in one block (#9314): strict YAML refuses them. */
export function repeatedKeys(text: string): string[] {
  const f = fences(text);
  const [seen, twice] = [new Set<string>(), new Set<string>()];
  let block: { root: string; at: number } | null = null;
  for (const line of f ? f.lines.slice(1, f.end) : []) {
    const kv = PAIR.exec(line);
    const at = line.search(/\S/);
    if (!kv || line[at] === "-") continue;
    const name = unquote(kv[1] as string);
    if (at === 0) block = TOP.test(line) ? { root: name, at: -1 } : null;
    else if (!block || (block.at >= 0 && block.at !== at)) continue;
    else block.at = at;
    const key = at === 0 ? name : `${block?.root}.${name}`;
    (seen.has(key) ? twice : seen).add(key);
  }
  return [...twice];
}

/** The delivery's cover block, or null — none. */
export const coverBlock = (text: string, root: string): Map<string, string> | null =>
  coverBlocks(text).get(root) ?? null;

/** Whether a block carries the alignment stamp: a contract number and a stamp date. */
export const stamped = (block: Map<string, string>): boolean =>
  /^\d+$/.test(block.get("contract") ?? "") && !!block.get("stamp");

/** Another delivery's cover: a block other than the root that carries a contract. */
export const foreignBlock = (text: string, root: string): boolean =>
  [...coverBlocks(text)].some(([k, b]) => k !== root && b.has("contract"));

const scalar = (v: string | number): string => {
  const s = String(v);
  return /^\w[\w/.-]*$/.test(s) ? s : `'${s.replace(/'/g, "''")}'`;
};

/** The block as written: the root key, then each given field indented by two spaces. */
export const renderCover = (root: string, data: CoverData): string[] => [
  `${root}:`,
  ...FIELDS.filter((k) => data[k] !== undefined && data[k] !== "").map(
    (k) => `  ${k}: ${scalar(data[k] as string | number)}`,
  ),
];

/**
 * The text with the delivery's cover block set to data: the block's fields replaced in place under
 * its root line as written, else the block put
 * first in the front matter, else a front matter made for it. Every other line stays as it was;
 * writing the same data twice changes nothing.
 */
export function writeCover(text: string | null, root: string, data: CoverData): string {
  const eol = text?.includes("\r\n") ? "\r\n" : "\n";
  const bom = text?.startsWith("\uFEFF") ? "\uFEFF" : "";
  const block = renderCover(root, data);
  const f = text ? fences(text) : null;
  if (!f) return bom + ["---", ...block, "---", ""].join(eol) + (text ?? "").slice(bom.length);
  const inner = f.lines.slice(1, f.end);
  const at = inner.findIndex((l) => TOP.test(l) && unquote(TOP.exec(l)?.[1] ?? "") === root);
  const next =
    at < 0
      ? [...block, ...inner]
      : [...inner.slice(0, at + 1), ...block.slice(1), ...inner.slice(blockEnd(inner, at))];
  return bom + ["---", ...next, ...f.lines.slice(f.end)].join(eol);
}

/** Past the block opened at line at: its indented lines, blank lines after it left outside. */
function blockEnd(inner: string[], at: number): number {
  let stop = at + 1;
  while (stop < inner.length && /^(\s+\S|\s*$)/.test(inner[stop] as string)) stop++;
  while (stop > at + 1 && /^\s*$/.test(inner[stop - 1] as string)) stop--;
  return stop;
}
