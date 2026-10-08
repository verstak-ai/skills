// Reading role hooks for the stand tool (hook.ts arms them): the role hook list — as
// webhooks[] fields (hookfields.ts), else the server's prose — and whether the admin
// tool schema declares the channel parameter.
import { ID_PREFIX, tool } from "../delivery/index.ts";
import { FORM } from "./board.ts";
import { callTool as call } from "./call.ts";
import { hooksField, reachesYou } from "./hookfields.ts";
import { post, state } from "./transport.ts";
import { type JsonRpcMessage } from "./types.ts";

/**
 * Admin tool parameters by the server schema, read anew on every stand so a running
 * bridge picks up channel once the server declares it. null — the schema did not read
 * (tools/list refused, was empty, or the tool is on another page).
 */
export async function adminParamNames(): Promise<Set<string> | null> {
  const id = `${ID_PREFIX}bridge-admin-schema-${++state.reinitCounter}`;
  let got: JsonRpcMessage | null = null;
  try {
    await post({ jsonrpc: "2.0", id, method: "tools/list", params: {} }, (m) => {
      if (m.id === id) got = m;
    });
  } catch {
    return null;
  }
  const result = (got as JsonRpcMessage | null)?.result;
  const tools = result?.tools;
  if (!Array.isArray(tools)) return null;
  const admin = (
    tools as { name?: string; inputSchema?: { properties?: Record<string, unknown> } }[]
  ).find((t) => t?.name === tool("admin"));
  if (!admin) return null; // not on this page (the list is paged or cut) — schema unread
  return new Set(Object.keys(admin.inputSchema?.properties ?? {}));
}

/** The hook list as prose: recognized, and whether a hook wakes the seat with this name. */
function fromProse(
  text: string,
  isError: boolean,
  name: string,
): { recognized: boolean; wakesMe: boolean } {
  // An empty list is printed without a header (graph @nks/nks-dev, node #5380). A known
  // header with an unknown hook state word means a half-guessed language; "does not wake"
  // would arm a second hook, so such a list is not recognized at all.
  const blocks = text.split(/\n(?=\s*#\d+\s*→)/).slice(1);
  const recognized =
    !isError &&
    ((FORM.hooksHeader.test(text) && blocks.every((b) => FORM.hookState.test(b))) ||
      FORM.hooksEmpty.test(text));
  const nameRe = new RegExp(`:${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![A-Za-z0-9._-])`);
  return {
    recognized,
    wakesMe: recognized && blocks.some((b) => FORM.hookActive.test(b) && nameRe.test(b)),
  };
}

/** Role hooks: list recognized, an active hook wakes this session's seat, the answer text. */
export async function readRoleHooks(
  realm: string,
  karta: string,
  name: string,
): Promise<{ recognized: boolean; wakesMe: boolean; text: string }> {
  const hooks = await call(tool("admin"), { action: "list_webhooks", realm, node_id: karta });
  const fields = hooks.isError ? null : hooksField(hooks.structured);
  const read = fields
    ? { recognized: true, wakesMe: fields.some((h) => h.active && reachesYou(h)) }
    : fromProse(hooks.text, hooks.isError, name);
  return { ...read, text: hooks.text };
}
