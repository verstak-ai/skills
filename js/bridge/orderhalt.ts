// The harness's part of a stop order (graph @nks/nks-dev, nodes #7510, #7519): stopped means
// the agent is stopped, not that the word went out. A client that declared the halts
// capability in initialize (the OpenCode plugin: its interrupt of the session's turn is
// asynchronous and may be refused) answers method("halted") {order, ok, code?} once its stop
// is executed; the order's outcome waits for that answer. A client without it (the watchdog of
// Claude Code and Codex, pi) has no answer to give: there the stop is executed when the bridge
// gave the stop word to every door and to the harness and let the seat go (stophold.ts).
import { envName, HALTS_CAPABILITY, method } from "../delivery/index.ts";
import { state } from "./transport.ts";
import { type JsonRpcMessage } from "./types.ts";

/** How long an order waits for the harness's answer; past it the outcome is unknown. */
export const HALT_WAIT_MS = Number(process.env[envName("ORDER_HALT_MS")]) || 20_000;
/** The harness did not answer within the wait. */
export const SILENT = "harness_silent";
const CODE = /^[a-z][a-z0-9_]{0,63}$/;

/** Orders waiting for their harness's answer: null — executed, a code — refused with it. */
const waiting = new Map<string, (code: string | null) => void>();

type Obj = Record<string, unknown>;
const obj = (v: unknown): Obj =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Obj) : {};

/** The session's harness confirms its stop (declared in initialize). */
export const confirmsHalts = (): boolean =>
  HALTS_CAPABILITY in obj(obj(obj(state.initParams).capabilities).experimental);

/**
 * The harness's answer for this order, or SILENT after `ms`. Hung in the same tick the stop is
 * given: the answer comes back over the harness's pipe, never earlier.
 */
export function awaitHalt(order: string, ms = HALT_WAIT_MS): Promise<string | null> {
  return new Promise((resolve) => {
    const t = setTimeout(() => done(SILENT), ms);
    t.unref?.();
    const done = (code: string | null): void => {
      clearTimeout(t);
      if (waiting.get(order) === done) waiting.delete(order);
      resolve(code);
    };
    waiting.set(order, done);
  });
}

/** `method("halted") {order, ok, code?}` — the harness's stop of an order, executed or refused. */
export function localHalted(msg: JsonRpcMessage): Promise<JsonRpcMessage> | null {
  if (msg?.method !== method("halted")) return null;
  const p = obj(msg.params);
  const order = typeof p.order === "string" ? p.order : "";
  const code = typeof p.code === "string" && CODE.test(p.code) ? p.code : "harness_refused";
  const done = waiting.get(order);
  done?.(p.ok === true ? null : code);
  return Promise.resolve({ jsonrpc: "2.0", id: msg.id, result: { taken: !!done } });
}
