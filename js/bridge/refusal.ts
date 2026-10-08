// An api refusal as data (graph @nks/nks-dev, node #6637): `_meta[serverProtocol.refusal]`
// = {rule, status, data} on channel and admin refusals; without it the consumer reads prose.
import { serverProtocol } from "../delivery/index.ts";
import { is, isObj } from "./fields.ts";
import { type JsonRpcMessage } from "./types.ts";

/** An api refusal as data: the ProblemDetail rule, its status and its data without secrets. */
export interface Refusal {
  rule?: string;
  status?: number;
  data?: Record<string, unknown>;
}

/** The refusal's `_meta[serverProtocol.refusal]` when well-formed, otherwise null. */
export function refusalOf(reply: JsonRpcMessage | null): Refusal | null {
  const r: unknown = reply?.result?._meta?.[serverProtocol.refusal];
  if (!isObj(r) || !is.str(r.rule) || !is.num(r.status)) return null;
  return {
    ...(typeof r.rule === "string" ? { rule: r.rule } : {}),
    ...(typeof r.status === "number" ? { status: r.status } : {}),
    ...(isObj(r.data) ? { data: r.data } : {}),
  };
}

/**
 * register refused by a seat-opening race: 409 without a rule ("opened concurrently;
 * register again"). The rule comes from ProblemDetail errors[0], not the root (the MCP
 * server reads no root rule), so a 409 with a root-only rule also lands here and gets one retry,
 * whose refusal comes back as is.
 */
export const openedConcurrently = (reply: JsonRpcMessage | null): boolean => {
  const r = reply?.result?.isError ? refusalOf(reply) : null;
  return !!r && !r.rule && r.status === 409;
};
