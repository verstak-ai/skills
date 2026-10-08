// The bridge status tool's text — what the plugin knows of its bridge: builds, sign-in,
// the tool list and how many bridges live. Pure string assembly, apart from the plugin.
import { OPENCODE, tool } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";
import { elsewhere } from "./login.ts";

/** The plugin's service tool: the bridge's state while the server's tools are not there yet. */
export const STATUS_TOOL = tool("bridge");

/** The service tool's definition for ctx.tool.transform: the text is taken at call time. */
export const statusTool = (text: () => string) => ({
  name: STATUS_TOOL,
  description: words(OPENCODE).statusDescription(),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the SDK's input schema has no type
  input: { type: "object", properties: {}, additionalProperties: false } as any,
  async execute() {
    return { content: text() };
  },
});

export function statusLines(
  path: string,
  builds: string,
  login: { loginPending: boolean; loginUrl: string | null; loginDevice: string | null },
  state: { serverSeen: boolean; listed: unknown[]; source: string },
  sessions: number,
  spare: number,
): string {
  const W = words(OPENCODE);
  return [
    W.statusBridge(path),
    builds,
    login.loginPending
      ? W.statusLoginPending(
          login.loginUrl ? W.openInBrowser(login.loginUrl) : W.finishInBrowser(),
          elsewhere(login.loginDevice),
        )
      : state.serverSeen
        ? W.statusLoginDone()
        : W.statusLoginWaiting(),
    W.statusTools(state.listed.length, state.source),
    W.statusBridges(sessions + spare, sessions),
  ].join("\n");
}
