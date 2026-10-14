// Frames of a lead subagent's own bridge (channel.ts; graph @nks/nks-dev, node #7505): an
// ended or ending lead gets nothing into its session, and its launcher's addressed word
// enters its running turn whatever the stack.
import { addressedToMine } from "../shared/addressed.ts";
import { type Frame } from "../shared/channel.ts";
import { roomKind } from "../shared/room-kinds.ts";

/** Lead subagents as the tools half knows them (leads.ts). */
export interface ChildLeads {
  /** Ended or ending: nothing goes into its session any more. */
  ended(session: string): boolean;
  /** Its launcher's seat name; not a live lead — null. */
  launcherOf(session: string): string | null;
}

export const NO_LEADS: ChildLeads = { ended: () => false, launcherOf: () => null };

/** A lead's parent session; root — the parent has no parent of its own. */
export interface Up {
  id: string;
  root: boolean;
}

/**
 * Its launcher's seat is its immediate parent's (graph @nks/nks-dev, node #7505): a child parent's
 * own seat; the root's — the seat its satellite stands by, every satellite of a chain stands by
 * the root's. A child parent not served here — unknown, null.
 */
export function launcherSeat(
  up: Up | null,
  slots: ReadonlyMap<string, { child?: boolean; place?: { name: string } | null }>,
  satelliteOf: string | null | undefined,
): string | null {
  if (!up) return null;
  const parent = slots.get(up.id);
  if (parent?.child) return parent.place?.name ?? null;
  return up.root ? (satelliteOf ?? null) : null;
}

/** A record of the launcher's seat addressed to its live lead, not a word in flight. */
export function fromLauncher(frame: Frame, launcher: string | null): boolean {
  if (!launcher || !addressedToMine(frame) || roomKind(frame)?.phase) return false;
  const f = frame as { provenance?: { from_standing?: unknown }; line?: { author?: unknown } };
  const by = String(
    f.provenance?.from_standing ?? (f.line?.author as { standing?: unknown })?.standing ?? "",
  );
  return by === launcher || by.endsWith(`:${launcher}`);
}
