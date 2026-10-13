// The bridge's lines on the call surface (graph @nks/nks-dev, node #4238): proxying tools/list,
// it inserts the stand tool and prepends its own moves to the channel tool; every other
// description passes as the server sent it — the writing moment is the server's line (#7557);
// a shipped former bridge's moment line on a cached write tool is taken off.
import { MOMENT, tool, TOOL_PREFIX } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import { escapeRe } from "../shared/regex.ts";
import { STAND_TOOL_NAME, standTool } from "./standtool.ts";
import { type JsonRpcMessage } from "./types.ts";

/** The bridge's own move on the channel tool: busyness (#6509). */
export const statusLine = (): string => words(MOMENT).status();

export const leaveLine = (): string => words(MOMENT).leave();

// The tools former bridges annotated. Their whole shipped lines, every language: until #282
// appended after a blank line, from #282 prepended before one. Only a whole line with its
// blank line goes; anything else, and a description that would be left empty, stays as is.
const WRITE_TOOL = new RegExp(`^${escapeRe(TOOL_PREFIX)}(add_[a-z_]+|batch)$`);
const FORMER_MOMENTS = Object.values(MOMENT).flatMap((w) => w.formerMoments());

function withoutFormerMoment(d: string): string {
  for (let changed = true; changed;) {
    changed = false;
    for (const line of FORMER_MOMENTS) {
      if (d.length <= line.length + 2) continue;
      if (d.startsWith(`${line}\n\n`)) d = d.slice(line.length + 2);
      else if (d.endsWith(`\n\n${line}`)) d = d.slice(0, d.length - line.length - 2);
      else continue;
      changed = true;
    }
  }
  return d;
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
    if (t && typeof t.description === "string" && WRITE_TOOL.test(String(t.name)))
      t.description = withoutFormerMoment(t.description);
    if (!t || t.name !== tool("channel") || typeof t.description !== "string") continue;
    if (!t.description.includes(leaveLine())) t.description = `${leaveLine()}\n\n${t.description}`;
    if (!t.description.includes(statusLine())) t.description = `${statusLine()}\n${t.description}`;
  }
}
