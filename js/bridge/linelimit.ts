// The harness's line (graph @nks/nks-dev, node #11416): a stdio MCP client reads JSON-RPC
// line by line with a fixed buffer, often 1–4 MB, and a longer line kills its whole MCP
// transport — every later call fails until a reconnect. So a line over the limit is never
// written: a response becomes a short refusal to the same id, which states the outcome the
// cut reply carried — a result is carried out, an isError result may be partly applied,
// and a JSON-RPC error applied nothing —
// anything else is dropped with a log line. BRIDGE_MAX_LINE_BYTES sets the limit; 0 — no limit.
import { BRIDGE_NAME, envName, LINE_LIMIT, type LineCut } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import { BUILD } from "./build.ts";
import { type JsonRpcMessage } from "./types.ts";

const MIB = 1024 * 1024;
const LIMIT_ENV = envName("BRIDGE_MAX_LINE_BYTES");

export function lineLimit(): number {
  const raw = process.env[LIMIT_ENV]?.trim();
  const v = Number(raw);
  return raw && Number.isInteger(v) && v >= 0 ? v : MIB;
}

const mb = (bytes: number): string => (bytes / MIB).toFixed(1);

/** What the cut reply said, so the refusal describes what is known of the outcome. */
function cutOf(msg: JsonRpcMessage): LineCut {
  if (msg.error !== undefined && msg.error !== null) {
    // The code is the one part of the cut answer that reaches the short refusal: it is named
    // as a number or a short string, anything else as «?».
    const code: unknown = msg.error.code;
    const named = typeof code === "number" || (typeof code === "string" && code.length <= 32);
    return { kind: "error", code: named ? code : "?" };
  }
  return (msg.result as { isError?: unknown } | null)?.isError === true
    ? { kind: "refusal" }
    : { kind: "result" };
}

/** The line to write for `msg`, newline included; null — nothing goes to the harness. */
export function harnessLine(msg: JsonRpcMessage, log: (s: string) => void): string | null {
  const line = JSON.stringify(msg);
  const limit = lineLimit();
  const size = Buffer.byteLength(line, "utf8");
  if (!limit || size <= limit) return line + "\n";
  const isResponse = msg.method === undefined && msg.id !== undefined && msg.id !== null;
  if (!isResponse) {
    log(
      `a ${msg.method ?? "message"} of ${size} bytes is over the harness's line limit of ${limit} — dropped`,
    );
    return null;
  }
  log(
    `the answer to ${JSON.stringify(msg.id)} is ${size} bytes, over the harness's line limit of ${limit} — refused in its place`,
  );
  const refusal: JsonRpcMessage = {
    jsonrpc: "2.0",
    id: msg.id,
    error: {
      code: -32001,
      message: `${BRIDGE_NAME} ${BUILD}: ${words(LINE_LIMIT).tooLong(mb(size), mb(limit), cutOf(msg))}.`,
    },
  };
  return JSON.stringify(refusal) + "\n";
}
