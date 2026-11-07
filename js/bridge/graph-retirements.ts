// Receipt-driven retirement, independent of the ring (graph @nks/nks-dev, node #9904).
import { type Frame } from "../shared/channel.ts";
import { graphInboxKey } from "../shared/graph-inbox.ts";
import { carryGraphMarks, eventKeyOf, noteSeenStrict, seenIds } from "../shared/seen.ts";
import { readRetirements, type Retirement, writeRetirements } from "./graph-retirement-store.ts";

export class GraphRetirements {
  readonly path: string;
  private readonly seenPath: string;
  constructor(seenPath: string) {
    this.seenPath = seenPath;
    this.path = `${seenPath}.graph-retirements.json`;
  }

  /** Read current client receipts, not the Door's possibly stale in-memory mark cache. */
  reconcile(): Retirement[] {
    const entries = readRetirements(this.path);
    const seen = seenIds(this.seenPath);
    const given = entries.filter((e) => seen.has(e.eventKey));
    if (!given.length) return entries;
    // Fail before marking anything if the atomic sidecar path is unavailable.
    writeRetirements(this.path, entries);
    for (const e of given)
      for (const key of e.retiredKeys) noteSeenStrict(this.seenPath, key, seen);
    const left = entries.filter((e) => !given.includes(e));
    writeRetirements(this.path, left); // remove only after successful .seen writes
    return left;
  }

  /** Persist before offering a graph frame. False means an older/already given event. */
  accept(frame: Frame | null): boolean {
    const entries = this.reconcile();
    const identity = graphInboxKey(frame);
    if (!identity || !frame) return true;
    const eventKey = eventKeyOf(frame);
    if (!eventKey) throw new Error("graph retirement needs an event key");
    const seen = seenIds(this.seenPath);
    if (seen.has(eventKey)) return false;
    const body = frame.body as Record<string, unknown>;
    const latestVersion =
      typeof body.vimarsha_version === "number" && Number.isFinite(body.vimarsha_version)
        ? body.vimarsha_version
        : null;
    const previous = entries.find((e) => e.identity === identity);
    const older =
      !!previous &&
      (previous.retiredKeys.includes(eventKey) ||
        (latestVersion !== null &&
          previous.latestVersion !== null &&
          latestVersion < previous.latestVersion));
    const entry: Retirement = older
      ? { ...previous, retiredKeys: [...new Set([...previous.retiredKeys, eventKey])] }
      : {
          identity,
          latestVersion,
          eventKey,
          retiredKeys: [
            ...new Set([
              ...(previous?.retiredKeys ?? []),
              ...(previous && previous.eventKey !== eventKey ? [previous.eventKey] : []),
            ]),
          ],
        };
    writeRetirements(this.path, [...entries.filter((e) => e.identity !== identity), entry]);
    if (!older) carryGraphMarks(frame, entry.retiredKeys);
    return !older;
  }

  /** An explicit stop cancels pending obligations; it never manufactures a receipt. */
  clear(): void {
    this.reconcile();
    writeRetirements(this.path, []);
  }
}
