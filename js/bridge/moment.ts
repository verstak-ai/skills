// The bridge's lines on the call surface (graph @nks/nks-dev, node #4238): proxying tools/list,
// it inserts the stand tool and prepends its own moves to the channel tool; every other
// description passes as the server sent it — the writing moment is the server's line (#7557);
// a former bridge's moment line on a cached list is taken off.
import { MOMENT, tool } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import { STAND_TOOL_NAME, standTool } from "./standtool.ts";
import { type JsonRpcMessage } from "./types.ts";

/** The bridge's own move on the channel tool: busyness (#6509). */
export const statusLine = (): string => words(MOMENT).status();

export const leaveLine = (): string => words(MOMENT).leave();

// Bridges before #7557 put their moment line first, then a blank line, then the server's text.
const FORMER_MOMENT = Object.values(MOMENT).map((w) => w.formerMoment());

function withoutFormerMoment(d: string): string {
  if (!FORMER_MOMENT.some((head) => d.startsWith(head))) return d;
  const cut = d.indexOf("\n\n");
  return cut < 0 ? "" : d.slice(cut + 2);
}

/** tools/list reply: the stand tool in, the channel tool's lines on. Idempotent. */
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
    if (t && typeof t.description === "string") t.description = withoutFormerMoment(t.description);
    if (!t || t.name !== tool("channel") || typeof t.description !== "string") continue;
    if (!t.description.includes(leaveLine())) t.description = `${leaveLine()}\n\n${t.description}`;
    if (!t.description.includes(statusLine())) t.description = `${statusLine()}\n${t.description}`;
  }
}
