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

const SEAT_GONE_RULES = new Set([
  "standing_already_ended",
  "standing_not_found",
  "standing_not_held",
]);

/**
 * The seat a call named is not there — already off: api 0.124.0 says it by rule (410
 * standing_already_ended, 404 standing_not_found; graph @nks/nks-dev, node #7599), an earlier api
 * by 410 or 404 without a rule; register's standing_not_held too. The one reading of a revoke's
 * refusal — the bridge's at its run's end (caseexit.ts) and the plugin's launcher revoke.
 */
export const seatAlreadyOff = (r: Refusal | null | undefined): boolean =>
  !!r &&
  ((!!r.rule && SEAT_GONE_RULES.has(r.rule)) || r.status === 410 || (r.status === 404 && !r.rule));

/**
 * The channel's seats in the asked graph by a 409 channel_already_stands_in_realm
 * (data.your_standings, api 0.124.0; graph @nks/nks-dev, node #7556): their names, else none.
 */
export const standingsInRealm = (r: Refusal | null | undefined): string[] => {
  if (r?.rule !== "channel_already_stands_in_realm") return [];
  const list = r.data?.your_standings;
  return Array.isArray(list)
    ? list.flatMap((s: unknown) =>
        isObj(s) && typeof s.name === "string" && s.name ? [s.name] : [],
      )
    : [];
};

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
