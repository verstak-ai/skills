// Case record numbering (graph @nks/nks-dev, node #6576): numbering "case" — the record
// number is per case; absent — the old count. Memories keyed by record numbers carry
// the numbering in the key, so a switch forgets them at once everywhere.
import { type Frame } from "./channel.ts";

/** Numbering of the frame: "case" — number within the case, "" — the old count. */
export const numberingOf = (frame: Frame): string =>
  (frame as Record<string, unknown>).numbering === "case" ? "case" : "";

/** Memory key by record number, in the frame's count; the old count keeps the key as it was. */
export const numberedKey = (frame: Frame, key: string): string =>
  key && numberingOf(frame) ? `case:${key}` : key;
