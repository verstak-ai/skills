// The skill's moment on the call surface (graph @nks/nks-dev, node #4238): proxying tools/list,
// the bridge prepends a line to write tools; it names no graph nodes, the reader may lack the graph.
import { MOMENT, tool, TOOL_PREFIX } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import { escapeRe } from "../shared/regex.ts";
import { STAND_TOOL_NAME, standTool } from "./standtool.ts";
import { type JsonRpcMessage } from "./types.ts";

const WRITE_TOOL = new RegExp(`^${escapeRe(TOOL_PREFIX)}(add_[a-z_]+|batch)$`);

// The same line stands in the door skill's moment map: keep both in step.
export const momentLine = (): string => words(MOMENT).moment();

/** The bridge's own move on the channel tool: busyness (#6509). */
export const statusLine = (): string => words(MOMENT).status();

export const leaveLine = (): string => words(MOMENT).leave();

/** tools/list reply: every write tool's description gets the moment line. Idempotent. */
export function annotateToolList(reply: JsonRpcMessage): void {
  const tools = reply?.result?.tools;
  if (!Array.isArray(tools)) return;
  // The stand tool exists only through the bridge, so its presence marks the transport.
  // Always THIS build's definition: a list from the shared cache may have been written by another bridge.
  const at = tools.findIndex((t) => t?.name === STAND_TOOL_NAME);
  if (at >= 0) tools[at] = standTool();
  else tools.push(standTool());
  // Prepended: Claude Code cuts a tool description at 2048 chars, and the server's are longer.
  for (const t of tools) {
    if (t && t.name === tool("channel") && typeof t.description === "string") {
      if (!t.description.includes(leaveLine()))
        t.description = `${leaveLine()}\n\n${t.description}`;
      if (!t.description.includes(statusLine()))
        t.description = `${statusLine()}\n${t.description}`;
      continue;
    }
    if (!t || typeof t.name !== "string" || !WRITE_TOOL.test(t.name)) continue;
    const d = typeof t.description === "string" ? t.description : "";
    if (d.includes(momentLine())) continue;
    t.description = d ? `${momentLine()}\n\n${d}` : momentLine();
  }
}
