// The words of the harness's line limit: a server answer longer than the line the
// harness's stdio client reads is not written by the bridge — it answers with this refusal,
// naming the outcome: a result carried out, a refusal possibly applied in part, an error not.
import type { Lang } from "../lang.ts";

/** What the cut answer was: a result, a refusal result (isError) or a JSON-RPC error. */
export type LineCut =
  { kind: "result" } | { kind: "refusal" } | { kind: "error"; code: number | string };

export interface LineLimitWords {
  /** size and limit — megabytes as strings, as the core prints them. */
  tooLong: (size: string, limit: string, cut: LineCut) => string;
}

const verdict = (cut: LineCut): string => {
  if (cut.kind === "result")
    return "The call reached the server and was carried out — a write, if it was one, is applied; re-read the target before retrying";
  if (cut.kind === "refusal")
    return "The server answered with a refusal too long to show: part of the call may have been applied (a batch can refuse after some of its writes) — re-read the target before retrying";
  return `The server answered with a JSON-RPC error (code ${cut.code}) too long to show: nothing was applied by this call`;
};

export const LINE_LIMIT: Readonly<Record<Lang, LineLimitWords>> = {
  en: {
    tooLong: (size, limit, cut) =>
      `the server's answer is ${size} MB, over the harness's line limit (${limit} MB); the bridge did not pass it on, so as not to break the MCP transport. Nothing broke: the next calls go as before. ${verdict(cut)}. Narrow the call: one graph instead of realm="*", fold=true, limit`,
  },
};
