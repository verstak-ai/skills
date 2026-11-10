// The holon and the agent role of `prepare` read from the graph (graph @nks/nks-dev, node #9325,
// item 2): the holon whose repository attribute names origin, and its steward. The way is the
// bridge's own to its server — the personal token or the grant on disk, refreshed without a
// browser (stopapi.ts) — and two search calls over MCP. No key, no network, no single answer —
// nothing is derived and the model's way stays, as before.
import { CFG, readArgs, setConfig } from "../bridge/config.ts";
import { tool } from "../delivery/index.ts";
import { mcpSession } from "../shared/mcpsession.ts";
import { keyFor } from "./stopapi.ts";

/** The one node of the type a search names; none or several — null. */
const single = (text: string, type: string): string | null => {
  const ids = [
    ...new Set([...text.matchAll(new RegExp(`\\(#(\\d+), ${type}\\b`, "g"))].map((m) => m[1])),
  ];
  return ids.length === 1 ? (ids[0] as string) : null;
};

export interface Derived {
  holon?: string;
  agent_role?: string;
}

/** What the graph says of the repository; the holon given — only its steward is asked. */
export async function fromGraph(
  graph: string,
  repository: string,
  holon?: string,
): Promise<Derived> {
  try {
    setConfig(readArgs([]));
    const key = await keyFor(CFG.serverUrl);
    if (!("token" in key)) return {};
    const s = mcpSession(CFG.serverUrl, key.token, "prepare");
    try {
      await s.open();
      const search = (args: Record<string, string>) =>
        s.call(tool("search"), { realm: graph, q: "", ...args });
      const found =
        holon ??
        single(
          await search({ node_type: "holon", attrs_filter: `repository:${repository}` }),
          "holon",
        );
      if (!found) return {};
      const role = single(await search({ node_type: "karta", steward_of: found }), "karta");
      return { ...(holon ? {} : { holon: found }), ...(role ? { agent_role: role } : {}) };
    } finally {
      await s.close();
    }
  } catch {
    return {};
  }
}
