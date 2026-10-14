// A seat's identity for the bridge and the OpenCode plugin (graph @nks/nks-dev, nodes #5154,
// #5838, #5164): graph, role and name — one name in two graphs is two seats.

export interface SeatKey {
  realm: string;
  karta: string;
  name: string;
}

/**
 * Role as the board prints it (bare digits or a sentinel: agent, me, realm-owner) — one
 * normalization for writing the binding and for comparing (#5154).
 */
export const normKarta = (k: unknown): string =>
  String(k ?? "")
    .trim()
    .replace(/^#/, "");

/**
 * The same seat: the graphs compared only in the canonical @owner/slug — a graph not in that
 * form matches nothing (#5838), role normalized, name exact.
 */
export function sameSeat(a: SeatKey, b: SeatKey): boolean {
  const realm = String(a.realm ?? "").trim();
  const name = String(a.name ?? "").trim();
  return (
    realm.startsWith("@") &&
    realm === String(b.realm ?? "").trim() &&
    normKarta(a.karta) === normKarta(b.karta) &&
    !!name &&
    name === String(b.name ?? "").trim()
  );
}
