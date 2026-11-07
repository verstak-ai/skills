// Soft graph inbox identity (graph @nks/nks-dev, nodes #7334, #7333).
// Only the structured platform envelope grants this path; prose never does.
import type { Frame } from "./channel.ts";

export function graphInboxKey(frame: Frame | null | undefined): string | null {
  if (frame?.type !== "message" || frame.provenance?.via !== "graph") return null;
  const b = frame.body;
  if (!b || typeof b !== "object" || Array.isArray(b)) return null;
  const body = b as Record<string, unknown>;
  if (
    typeof body.realm_slug !== "string" ||
    !body.realm_slug ||
    typeof body.vimarsha_seq !== "number" ||
    !Number.isInteger(body.vimarsha_seq) ||
    body.vimarsha_seq <= 0 ||
    !["posed_to", "updated", "vimarsha.updated"].includes(String(body.event_kind))
  )
    return null;
  return JSON.stringify([body.realm_slug, body.vimarsha_seq]);
}

export const isGraphInbox = (frame: Frame | null | undefined): boolean =>
  graphInboxKey(frame) !== null;

const versionOf = (frame: Frame): unknown =>
  (frame.body as Record<string, unknown>).vimarsha_version;

/** Pending groups scoped by graph and question; a replay cannot replace a higher version. */
export function graphFolds(frames: readonly Frame[]) {
  const groups = new Map<string, Frame[]>();
  for (const frame of frames) {
    const key = graphInboxKey(frame);
    if (key === null) continue;
    const group = groups.get(key) ?? [];
    group.push(frame);
    groups.set(key, group);
  }
  return [...groups.values()].map((group) => {
    const latest = group.reduce((a, b) => {
      const av = versionOf(a);
      const bv = versionOf(b);
      return typeof av === "number" && typeof bv === "number" && av > bv ? a : b;
    });
    return { latest, superseded: group.filter((f) => f !== latest) };
  });
}

/** Superseded, not yet handed out: no delivery marks are written by folding. */
export const foldedGraph = (frames: readonly Frame[]): Set<Frame> =>
  new Set(graphFolds(frames).flatMap((g) => g.superseded));
