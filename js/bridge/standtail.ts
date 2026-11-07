// The stand answer's closing lines: the delivery's lag notice, then — on a seat taken by a call
// whose answer a model reads — the human's rules from mind (shared/mindslice.ts, graph
// @nks/nks-dev, #9817). The rules close the answer: the launch line takes them from there
// (shared/launch.ts); a harness's provisional seating gives them by its own read.
import { mindSlice } from "../shared/mindslice.ts";
import { callTool } from "./call.ts";
import { CFG } from "./config.ts";
import { readLatest, staleNotice } from "./update.ts";

export async function standTail(stood: boolean): Promise<string[]> {
  const stale = staleNotice(readLatest(CFG.authDir), CFG.authDir);
  return [...(stale ? [stale] : []), ...(stood ? [await mindSlice(callTool)] : [])];
}
