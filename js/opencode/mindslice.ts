// The human's rules (shared/mindslice.ts, graph @nks/nks-dev, #9817) read by the session's own
// bridge as a service move — not the agent's work: after a compaction and at a root's start.
import type { Bridge } from "../shared/bridge-client.ts";
import { mindSlice, type MindSliceOptions } from "../shared/mindslice.ts";
import { textOf } from "./bridge-io.ts";

/** The platform's answer — no longer than this. */
const SLICE_MS = 10_000;

/** Compaction opts into strict failures; root starts keep the default soft diagnostic (#9817). */
export function sliceBy(
  bridge: Pick<Bridge, "request">,
  options: MindSliceOptions = {},
): Promise<string> {
  return mindSlice(async (name, args) => {
    const got = (await bridge.request(
      "tools/call",
      { name, arguments: args },
      { timeoutMs: SLICE_MS, service: true },
    )) as { isError?: boolean } | null;
    return { isError: !!got?.isError, text: textOf(got) };
  }, options);
}
