// A seat already held compared with the project cover (opencode/rootseat-by.ts, dsh/rootseat.ts):
// only known spellings of the graph are compared — rN against a slug is not, until a bridge
// resolves it.

export interface HeldSeat {
  name: string;
  karta: string;
  realm: string;
}

/** The graph's short spelling rN. */
export const short = (t: string): boolean => /^r\d+$/.test(t.trim());
/** The graph's canonical spelling @owner/slug. */
export const canonical = (t: string): boolean => /^@[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(t);
const slug = (t: string): boolean => /^[A-Za-z0-9_.-]+$/.test(t) && !short(t);

/** Compare known spellings only: rN against a slug is compared after the bridge resolves it. */
export function sameSeat(seat: HeldSeat, realm: string, karta: string): boolean {
  if (seat.karta.trim().replace(/^#/, "") !== karta.trim().replace(/^#/, "")) return false;
  const [x, y] = [seat.realm.trim(), realm.trim()];
  if (short(x) || short(y)) return short(x) && short(y) && x === y;
  if (canonical(x) && canonical(y)) return x === y;
  if (canonical(x) && slug(y)) return x.slice(x.indexOf("/") + 1) === y;
  if (slug(x) && canonical(y)) return x === y.slice(y.indexOf("/") + 1);
  return slug(x) && slug(y) && x === y;
}
