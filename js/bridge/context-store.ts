// Recovery metadata by server and seat (graph @nks/nks-dev, node #10121).
import { randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, unlinkSync } from "node:fs";
import { dirname } from "node:path";

import { seenFilePathOf } from "../shared/standings.ts";
import { CFG } from "./config.ts";
import { writeOwned } from "./doorfiles.ts";

export interface ContextMark {
  version: 1;
  seat: string;
  generation: string;
  pending: boolean;
}
const pathOf = (seat: string): string =>
  `${seenFilePathOf(CFG.authDir, seat, CFG.serverUrl)}.context-gate.json`;

/** Absence is distinct from unreadable or malformed metadata. */
function readMark(path: string, seat: string): ContextMark | null {
  let text: string;
  try {
    text = readFileSync(path, "utf8");
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw e;
  }
  const r = JSON.parse(text) as ContextMark;
  if (
    !r ||
    r.version !== 1 ||
    r.seat !== seat ||
    typeof r.generation !== "string" ||
    !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(r.generation) ||
    typeof r.pending !== "boolean"
  )
    throw new Error("invalid context recovery metadata");
  return r;
}

const proofPath = (mark: ContextMark): string =>
  `${pathOf(mark.seat)}.${mark.generation}.confirmed`;
export function readContextMark(seat: string): ContextMark | null {
  const mark = readMark(pathOf(seat), seat);
  if (!mark?.pending) return mark;
  const proof = readMark(proofPath(mark), seat);
  if (!proof) return mark;
  if (proof.generation !== mark.generation || proof.pending)
    throw new Error("invalid context recovery confirmation");
  return { ...mark, pending: false };
}

/** Same atomic, private-file mechanism as the seat's hold record; errors are not swallowed. */
export function writeContextMark(mark: ContextMark): void {
  const path = pathOf(mark.seat);
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  // A stale proof is generation-specific, so it can never clear a newer mark.
  writeOwned(path, JSON.stringify(mark) + "\n");
}
export const newContextMark = (seat: string): ContextMark => ({
  version: 1,
  seat,
  generation: randomUUID(),
  pending: true,
});
export function clearContextMark(mark: ContextMark): void {
  const now = readContextMark(mark.seat);
  if (!now || now.generation !== mark.generation || !now.pending)
    throw new Error("context recovery generation changed");
  // Do not overwrite the current marker: another process may mark a new collapse
  // between the read above and this write. Only this generation gets a proof.
  const path = proofPath(mark);
  try {
    writeOwned(path, JSON.stringify({ ...mark, pending: false }) + "\n");
  } finally {
    try {
      unlinkSync(`${path}.${process.pid}.tmp`);
    } catch {
      /* renamed or not created */
    }
  }
}
