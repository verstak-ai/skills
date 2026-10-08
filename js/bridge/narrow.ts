// What the harness sees of the tool list: the list weighs on every agent request,
// so the bridge narrows only the harness's copy — the shared reply cache keeps the
// full list. Two narrowings: the tool set, only by `--tools a,b,c`; the channel
// tool's schema for every bridge, without the seat moves the bridge makes itself.
// The surface export client gets the raw list.
import { ACTION_LIST_RE, ID_PREFIX, NARROW, tool } from "../delivery/index.ts";
import { SURFACE_CLIENT } from "../shared/clients.ts";
import { words } from "../shared/lang.ts";
import { CFG } from "./config.ts";
import { harnessAsksFields } from "./fields.ts";
import { STAND_TOOL_NAME } from "./standtool.ts";
import { state } from "./transport.ts";
import { type JsonRpcMessage } from "./types.ts";

/** Channel moves the bridge makes itself; removed from the action list. */
const PLACE_MOVES = new Set(["mint", "connect", "sessions"]);
/** Channel schema fields only those moves take (per the server's field descriptions, 0.97.1). */
const PLACE_FIELDS = ["ttl_seconds", "mute_siblings"];

function clientName(): string {
  const info = (state.initParams as { clientInfo?: { name?: unknown } } | null)?.clientInfo;
  return typeof info?.name === "string" ? info.name : "";
}

/** Tool names the harness sees; null — all. The stand tool is always in the set. */
export function toolSet(): Set<string> | null {
  return CFG.tools ? new Set([...CFG.tools, STAND_TOOL_NAME]) : null;
}

/**
 * The bridge's own realm list after a lost seat (lostplaces.ts) passes the session
 * input; matched by the whole call, not the id prefix, so a harness call outside
 * --tools is not let through.
 */
const ownRealmList = (msg: JsonRpcMessage): boolean =>
  String(msg.id ?? "").startsWith(`${ID_PREFIX}thin-realms-`) &&
  msg.params?.name === tool("realm") &&
  String(msg.params?.arguments?.action ?? "") === "list";

/** Refusal aloud for a call outside the set: the harness did not see the tool, yet the name came. */
export function outsideSetRefusal(msg: JsonRpcMessage): JsonRpcMessage | null {
  if (msg?.method !== "tools/call" || msg.id === undefined || msg.id === null) return null;
  if (ownRealmList(msg)) return null;
  const set = toolSet();
  const name = String(msg.params?.name ?? "");
  if (!set || set.has(name)) return null;
  const list = [...set].sort().join(", ");
  const text = words(NARROW).outsideSet(name, list);
  return {
    jsonrpc: "2.0",
    id: msg.id,
    result: { isError: true, content: [{ type: "text", text }] },
  };
}

/** outputSchema reaches only a harness that asked for answer fields (fields.ts, graph @nks/nks-dev, node #6731). */
type Tool = {
  name?: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
};

function withoutPlaceMoves(text: string): string {
  return text.replace(
    ACTION_LIST_RE,
    (_, head: string, list: string) =>
      head +
      list
        .split("|")
        .map((s) => s.trim())
        .filter((s) => !PLACE_MOVES.has(s))
        .join(" | "),
  );
}

function withoutSchema(t: Tool): Tool {
  const { outputSchema: _, ...rest } = t;
  return rest;
}

function channelForHarness(t: Tool): Tool {
  const schema = t.inputSchema;
  const props = schema?.properties as Record<string, Record<string, unknown>> | undefined;
  if (!schema || !props) return t;
  const kept: Record<string, Record<string, unknown>> = {};
  for (const [k, v] of Object.entries(props)) if (!PLACE_FIELDS.includes(k)) kept[k] = v;
  const action = kept.action;
  if (action) {
    const a = { ...action };
    if (typeof a.description === "string") a.description = withoutPlaceMoves(a.description);
    if (Array.isArray(a.enum)) a.enum = a.enum.filter((x) => !PLACE_MOVES.has(String(x)));
    kept.action = a;
  }
  const next: Record<string, unknown> = { ...schema, properties: kept };
  if (Array.isArray(schema.required))
    next.required = schema.required.filter((r) => !PLACE_FIELDS.includes(String(r)));
  return { ...t, inputSchema: next };
}

/** The harness's copy of tools/list; the original reply goes to the shared cache untouched. */
export function narrowToolList(reply: JsonRpcMessage): JsonRpcMessage {
  const tools = reply?.result?.tools;
  if (!Array.isArray(tools) || clientName() === SURFACE_CLIENT) return reply;
  const set = toolSet();
  const fields = harnessAsksFields();
  const shown = (tools as Tool[])
    .filter((t) => !set || set.has(String(t?.name)))
    .map((t) => (t?.name === tool("channel") ? channelForHarness(t) : t))
    .map((t) => (fields || !t || !("outputSchema" in t) ? t : withoutSchema(t)));
  return { ...reply, result: { ...reply.result, tools: shown } };
}
