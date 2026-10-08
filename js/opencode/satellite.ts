// Standing calls of the "tools" half (tools.ts) and a child session as a satellite of the
// root's seat (graph @nks/nks-dev, node #6002): the root holds a seat — the child's bridge
// comes up with --satellite, and its stand call takes the seat "<root's seat>.sub-N" in the
// role the agent named (none named — the root's role).
import { tool } from "../delivery/index.ts";
import { takingArgs } from "../shared/busyargs.ts";
import { isSatelliteOf } from "../shared/satname.ts";

/** The bridge's tool the plugin hands the session's directory (cwd) to derive the name. */
export const STAND_TOOL = tool("stand");

/** A call whose success means the session stands (the bridge holds a seat or is bound to one). */
export function standsBy(name: string, args: Record<string, unknown>): boolean {
  if (name === STAND_TOOL) return true;
  return name === tool("channel") && ["connect", "mint", "register"].includes(String(args.action));
}

/**
 * Stand arguments the bridge runs as a busy line only (#6509) — the bridge's list (shared/busyargs.ts).
 * Its success is no holding; the plugin knows holding by the bridge's "held" word and hello.
 */
const busyOnly = (args: Record<string, unknown>): boolean =>
  typeof args.status === "string" && takingArgs(args).length === 0;

/** The seat the bridge holds — as the bridge's "held" word names it. */
export type Place = { realm: string; karta: string; name: string };

export interface SatelliteSlot {
  /** The seat the bridge holds — from "held". */
  place?: Place | null;
  /** The child session's bridge came up as a satellite (`--satellite`) of this root seat. */
  satelliteOf?: Place | null;
}

/**
 * A child bridge's seat if it is not a satellite of the root's seat: the child stood on a plain
 * seat. Such a seat is not taken down by the errand's end (#6550, rule 4). null — satellite or none.
 */
export function ownPlace(slot: (SatelliteSlot & { child?: boolean }) | undefined): string | null {
  const p = slot?.child ? slot.place : null;
  if (!p?.name) return null;
  const of = slot?.satelliteOf?.name;
  // By the bridge's rule: a base longer than the name limit is cut from the end (shared/satname.ts).
  return of && isSatelliteOf(of, p.name) ? null : p.name;
}

/** The seat from the "held" word's data; a bridge older than #6002 does not name it — null. */
export function heldPlace(data: { place?: Partial<Place> } | undefined): Place | null {
  const p = data?.place;
  if (typeof p?.name !== "string" || !p.name) return null;
  return { realm: String(p.realm), karta: String(p.karta), name: p.name };
}

/**
 * A satellite's stand arguments: the root's seat, the role named by the agent, otherwise the
 * root's. A busy line alone (#6509) gets no root role, or a satellite in its own role would go
 * the full taking path. Returns whether this is a busy line alone: its success is not holding.
 */
export function asSatellite(
  args: Record<string, unknown>,
  of: Place | null | undefined,
  leads = false,
): boolean {
  const busy = busyOnly(args);
  if (!of) return busy;
  args.satellite_of ??= of.name;
  if (!(leads && busy) && (args.karta == null || args.karta === "")) args.karta = of.karta;
  return busy;
}
