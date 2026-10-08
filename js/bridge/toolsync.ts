// A harness reads the tool list once, and a server rollout cuts the bridge's session
// silently (graph @nks/nks-dev, node #5405): on a re-opened session the bridge compares
// the served list's print with a fresh one and sends tools/list_changed if they differ.
import { createHash } from "node:crypto";

import { scoped } from "../shared/scope.ts";
import { log } from "./streams.ts";
import { type JsonRpcMessage } from "./types.ts";

const T = scoped(() => ({ served: null as string | null })); // each harness session has its own list

/** A print of names and schemas: the bridge rewrites descriptions itself, so they are left out. */
export function toolsPrint(result: unknown): string | null {
  const tools = (result as { tools?: { name?: string; inputSchema?: unknown }[] } | null)?.tools;
  if (!Array.isArray(tools)) return null;
  const shape = tools
    .map((t) => [t.name ?? "", JSON.stringify(t.inputSchema ?? null)])
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  return createHash("sha256").update(JSON.stringify(shape)).digest("hex");
}

/** A list was served to the harness (live or cached): remember what it now knows. */
export function noteServedTools(result: unknown): void {
  const print = toolsPrint(result);
  if (print) T.served = print;
}

/** The server session re-opened: `ask` the list over it and compare; `emit` tells the harness. */
export async function recheckTools(
  ask: () => Promise<JsonRpcMessage | null>,
  emit: (m: JsonRpcMessage) => void,
): Promise<void> {
  if (!T.served) return; // the harness has not asked for the list yet
  const fresh = toolsPrint((await ask().catch(() => null))?.result);
  if (!fresh || fresh === T.served) return;
  T.served = fresh;
  log("tool list changed under the re-opened session — telling the harness (tools/list_changed)");
  emit({ jsonrpc: "2.0", method: "notifications/tools/list_changed" });
}
