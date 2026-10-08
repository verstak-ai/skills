// Frame stamp before the frame leaves the bridge (graph @nks/nks-dev, node #4234).
// No read-ahead of frame bodies: the socket delivers them whole or not at all
// (graph @nks/nks-dev, node #5207); a real break arrives as invalid JSON and never reaches
// body parsing. The frame's body_chars is the serialized size, not a checksum.
import { classifyOrigin, type Frame } from "../shared/channel.ts";
import { state } from "./transport.ts";

/** The bridge stamps the speaker: only it knows its standing's role. */
export function stampOrigin(frame: Frame | null): Frame | null {
  if (!frame || frame.type !== "message") return frame;
  return { ...frame, origin: classifyOrigin(frame, state.standing?.karta) };
}
