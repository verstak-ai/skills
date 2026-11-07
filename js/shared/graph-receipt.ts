// Consumer-side handoff receipt (graph @nks/nks-dev, nodes #7334, #9904).
import { lstatSync, realpathSync } from "node:fs";
import { basename, dirname, isAbsolute, resolve } from "node:path";

import { type Frame } from "./channel.ts";
import { isGraphInbox } from "./graph-inbox.ts";
import { deliveryKeys, noteSeenStrict, seenIds } from "./seen.ts";
import { standingsDirOf } from "./standings.ts";

const receipts = new WeakMap<Frame, { path: string; root: string }>();

/** Only local ChannelEvent metadata is bound, never fields on a server frame. */
export function carryGraphReceipt(
  frame: Frame | null | undefined,
  seen: unknown,
  root: string,
): void {
  if (frame && isGraphInbox(frame) && typeof seen === "string")
    receipts.set(frame, { path: seen, root });
}

/** Called after service text was added to the actual host context; errors are not receipts. */
export function receiptGraph(frames: readonly Frame[]): void {
  const paths = new Map<string, Set<string>>();
  for (const f of frames) {
    const receipt = receipts.get(f);
    if (!receipt) continue; // legacy bridge: no shared receipt can be invented
    const { path, root } = receipt;
    if (
      !isAbsolute(path) ||
      dirname(resolve(path)) !== resolve(standingsDirOf(root)) ||
      !/^[a-f0-9]{16}(?:\.[a-f0-9]{8})?\.seen$/.test(basename(path)) ||
      realpathSync(dirname(path)) !== resolve(realpathSync(root), "standings")
    )
      throw new Error("graph receipt outside its bridge standings directory");
    try {
      if (lstatSync(path).isSymbolicLink()) throw new Error("graph receipt path is a link");
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
    }
    const keys = paths.get(path) ?? new Set<string>();
    for (const k of deliveryKeys(f)) keys.add(k);
    paths.set(path, keys);
  }
  for (const [path, keys] of paths) {
    const seen = seenIds(path);
    for (const k of keys) noteSeenStrict(path, k, seen);
  }
}
