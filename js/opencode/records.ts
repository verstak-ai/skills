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
  room?: string | null;
  noted?: boolean;
  /** The child's seat name and last text — the outcome at the end after a reload. */
  name?: string;
  last?: string;
}

/** A marker record: a child carries the root's seat, the errand case, the told turn, its seat name and last text. */
export const entryOf = (e: LostEntry): LostEntry => ({
  session: e.session,
  dir: e.dir ?? null,
  key: e.key ?? null,
  child: !!e.child,
  ...(e.moved ? { moved: true } : {}),
  ...(e.child
    ? {
        of: e.of ?? null,
        room: e.room ?? null,
        ...(e.noted ? { noted: true } : {}),
        ...(e.name ? { name: e.name } : {}),
        ...(e.last ? { last: e.last } : {}),
      }
    : {}),
});
