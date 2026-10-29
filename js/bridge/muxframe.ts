// Which subscription a dispatcher frame is about (graph @nks/nks-dev, nodes #8620, #8616): an
// answer to a subscribe names its ref, every other frame its channel_id. A frame that is not
// JSON, has no channel or names a channel no session holds goes to the journal and no further.
import { type Frame } from "../shared/channel.ts";
import { type Sub } from "./muxsub.ts";
import { log } from "./streams.ts";

export interface FrameRoutes {
  byRef: Map<string, Sub>;
  byChannel: Map<string, Sub>;
  hello(s: Sub, f: Frame): void;
  refused(s: Sub, code: string): void;
  closed(s: Sub, code: number, reason: string): void;
  frame(s: Sub, f: Frame, channel: string): void;
}

export function routeFrame(raw: string, r: FrameRoutes): void {
  let f: Frame | null = null;
  try {
    f = JSON.parse(raw) as Frame;
  } catch {
    /* not JSON — below */
  }
  if (!f || typeof f !== "object") return log("dispatcher: a frame that is not JSON — dropped");
  const ref = typeof f.ref === "string" ? f.ref : "";
  if (ref && (f.type === "hello" || f.type === "error")) {
    const asked = r.byRef.get(ref);
    r.byRef.delete(ref);
    if (!asked) return log(`dispatcher: ${f.type} for an unknown ref ${ref}`);
    return f.type === "hello" ? r.hello(asked, f) : r.refused(asked, String(f.code ?? ""));
  }
  const channel = typeof f.channel_id === "string" ? f.channel_id : "";
  if (!channel) return log(`dispatcher: a ${String(f.type)} frame without a channel — dropped`);
  if (f.type === "error") return log(`dispatcher: ${channel} refused a frame: ${String(f.code)}`);
  const s = r.byChannel.get(channel);
  if (f.type === "channel_closed")
    return s ? r.closed(s, Number(f.code), String(f.reason ?? "")) : undefined;
  if (!s || s.closed) return log(`dispatcher: a frame of ${channel} held by no session`);
  r.frame(s, f, channel);
}
