// The graph slot of a project cover (shared/cover.ts): which graph it names as the working one
// (#8066). An address is @owner/slug or rN, bare or in backticks or quotes; a head is an address
// with at most its other form in parentheses right after it — the only way a second form joins
// the pair (slug, rN). The heads form one pair: two slugs, two rNs, or heads listed one after
// another that share no address are ambiguity. After the last head, prose that starts with a
// word (a pointer to the methodology, a graph not used) names no candidate; any other rest is
// doubt: an address there that is not already in the pair is ambiguity, never a choice or a
// second form. A continuation line of the value that names an address is ambiguity. Other framing (*, _, ~) is not read as framing: such a start is no graph.

/** A slug ends with a word character: a closing dot or dash is the sentence's, not the slug's. */
const SLUG = String.raw`@[\w.-]+\/[\w.-]*\w`;
const ADDRESS = String.raw`(?:${SLUG}(?=[.-]*(?:$|[\s)\x60'",;.:]))|r\d+(?=$|[\s)\x60'",;.:]))`;
const FRAME = String.raw`[\s\x60'"]*`;
const HEAD = new RegExp(String.raw`^(${ADDRESS})(?:${FRAME}\(${FRAME}(${ADDRESS})${FRAME}\))?`);
/** Any address anywhere, whatever stands around it. */
const ANY = new RegExp(String.raw`${SLUG}|(?<![\w/])r\d+(?!\w)`, "gu");
/** Prose after the heads: optional punctuation, then a word that is no rN. */
const PROSE = /^[—–\-:.(]*\s*(?!r\d)\p{L}/u;

const esc = (t: string): string => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** What lists the next head as an equal: separators, quotes and the form's joining words. */
const listing = (joins: readonly string[]): RegExp =>
  new RegExp(`^(?:[\\s\`'",;/+&|]${joins.map((j) => `|${esc(j)}(?=[\\s\`'"])`).join("")})*`, "u");
const anyIn = (t: string): string[] => [...t.matchAll(ANY)].map((m) => m[0]);

/** The working graph a slot value names, the graphs that make it ambiguous, or null — none at its start. */
export function graphOfSlot(
  value: string,
  joins: readonly string[],
): { realm: string } | { many: string[] } | null {
  const [line = "", ...more] = value.split("\n");
  const list = listing(joins);
  const heads: string[][] = [];
  let rest = line.replace(new RegExp(`^${FRAME}`), "");
  for (let head = HEAD.exec(rest); head; head = HEAD.exec(rest)) {
    heads.push(head.slice(1).filter((x): x is string => !!x));
    rest = rest.slice(head[0].length);
    rest = rest.slice((list.exec(rest)?.[0] ?? "").length);
  }
  if (!heads.length) return null;
  const pair = [...new Set(heads.flat())];
  const slugs = pair.filter((n) => n.startsWith("@"));
  const doubt = rest !== "" && !PROSE.test(rest) ? anyIn(rest) : [];
  const after = anyIn(more.join("\n"));
  const apart = heads.some((h) => !h.some((a) => heads[0]?.includes(a)));
  const strange = doubt.some((a) => !pair.includes(a)) || after.length > 0;
  if (slugs.length > 1 || pair.length - slugs.length > 1 || apart || strange)
    return { many: [...new Set([...pair, ...doubt, ...after])] };
  return { realm: slugs[0] ?? (pair[0] as string) };
}
