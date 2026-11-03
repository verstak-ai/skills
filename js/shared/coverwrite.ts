// The one writer of the machine cover (graph @nks/nks-dev, node #9316; read in coverblock.ts):
// the bootstrap and a bridge subcommand write the same bytes (#9319). The fields it is given are
// written; a field of the block it is not given to write — the rituals the person switched on and
// off — stays under them as written.
import { CHILD, type CoverData, fences, FIELDS, TOP, unquote } from "./coverblock.ts";

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
  const end = at < 0 ? at : blockEnd(inner, at);
  const next =
    at < 0
      ? [...block, ...inner]
      : [
          ...inner.slice(0, at + 1),
          ...block.slice(1),
          ...others(inner.slice(at + 1, end)),
          ...inner.slice(end),
        ];
  return bom + ["---", ...next, ...f.lines.slice(f.end)].join(eol);
}

/** Past the block opened at line at: its indented lines, blank lines after it left outside. */
function blockEnd(inner: string[], at: number): number {
  let stop = at + 1;
  while (stop < inner.length && /^(\s+\S|\s*$)/.test(inner[stop] as string)) stop++;
  while (stop > at + 1 && /^\s*$/.test(inner[stop - 1] as string)) stop--;
  return stop;
}

/** The block's lines that are no field written here: each other field with what it carries. */
function others(lines: string[]): string[] {
  const indent = lines.find((l) => CHILD.test(l))?.search(/\S/);
  let keep = false;
  return lines.filter((l) => {
    const child = l.search(/\S/) === indent && CHILD.exec(l);
    if (child) keep = !(FIELDS as readonly string[]).includes(unquote(child[1] as string));
    return keep;
  });
}
