// A node's stored body, byte for byte (graph @nks/nks-dev, nodes #10962, #467): the card of the
// look tool carries it between a line of ⟦ and a line of as many ⟧ — the server took the separate
// raw read away. A server before that prints the body indented and still has raw: read it so.
type Call = (name: string, args: Record<string, unknown>) => Promise<string>;

/** The body between the card's fences; null — the card has none (an older server). */
export function fencedBody(card: string): string | null {
  const lines = card.split("\n");
  const open = lines.findIndex((l) => /^⟦+$/.test(l));
  if (open < 0) return null;
  const close = "⟧".repeat([...lines[open]].length);
  const end = lines.indexOf(close, open + 1);
  return end < 0 ? null : lines.slice(open + 1, end).join("\n");
}

/** Read the body of node `seq` in `realm` through the look tool `look`. */
export async function nodeBody(
  call: Call,
  look: string,
  realm: string,
  seq: string,
): Promise<string> {
  const card = await call(look, { realm, node_id: `#${seq}` });
  return fencedBody(card) ?? (await call(look, { realm, node_id: `#${seq}`, raw: true }));
}
