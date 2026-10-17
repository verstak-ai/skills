// Loss marker records (marker.ts): the plugin instance's location and a record of a seat its
// bridge held (graph @nks/nks-dev: #5140, #6626, #6625).

/** The plugin instance's location (ctx.location): directory and workspace. */
export interface Home {
  directory: string;
  workspace?: string | null;
}

export interface LostEntry {
  session: string;
  dir: string | null;
  key: string | null;
  child?: boolean;
  /** A record of the session's move to another folder (moves.ts), not of an instance stop. */
  moved?: boolean;
  of?: { realm: string; karta: string; name: string } | null;
  noted?: boolean;
  /** The child's seat name and last text — the outcome at the end after a reload. */
  name?: string;
  last?: string;
  /** When the session stood on the seat (its hold record's stoodAt): the era two markers are judged by (case №954). */
  stoodAt?: number;
}

/**
 * A marker record: a child carries the root's seat, the told turn, its seat name and last text.
 * A former record's errand case (room) is not read: the platform says which cases are left.
 */
export const entryOf = (e: LostEntry): LostEntry => ({
  session: e.session,
  dir: e.dir ?? null,
  key: e.key ?? null,
  child: !!e.child,
  ...(typeof e.stoodAt === "number" ? { stoodAt: e.stoodAt } : {}),
  ...(e.moved ? { moved: true } : {}),
  ...(e.child
    ? {
        of: e.of ?? null,
        ...(e.noted ? { noted: true } : {}),
        ...(e.name ? { name: e.name } : {}),
        ...(e.last ? { last: e.last } : {}),
      }
    : {}),
});
