// Whether a lead subagent's leave was its last case (graph @nks/nks-dev, nodes #7234, #5838):
// the platform's word, not the plugin's count. One graph has several spellings (rN, slug,
// @owner/slug) and only the bridge knows which are one (bridge/realms.ts); the platform knows
// the cases. So the child's own bridge asks the case tool (action="mine", relation="participant")
// — the cases this session sits in, of every graph (observed: asked by another graph's address,
// mine lists them all). The sign is the prose (delivery MINE_ROW, MINE_NONE): rows are cases it
// sits in, the "no cases" line is none; an answer neither — unread, a throw, never "none".
import { MINE_NONE, MINE_ROW, tool } from "../delivery/index.ts";
import type { Bridge } from "../shared/bridge-client.ts";
import { textOf } from "./bridge-io.ts";

/** The platform's answer — no longer than this. */
const MINE_MS = 10_000;

export async function casesLeft(
  bridge: Pick<Bridge, "request"> | undefined,
  realm: string,
): Promise<number> {
  if (!bridge) throw new Error("no bridge");
  const args = { action: "mine", relation: "participant", ...(realm ? { realm } : {}) };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- an MCP answer without a schema
  const got: any = await bridge.request(
    "tools/call",
    { name: tool("case"), arguments: args },
    { timeoutMs: MINE_MS, service: true },
  );
  const text = textOf(got);
  if (got?.isError) throw new Error(text.slice(0, 200) || "refused");
  const rows = text.split("\n").filter((l) => MINE_ROW.test(l)).length;
  if (rows) return rows;
  if (MINE_NONE.test(text)) return 0;
  throw new Error(`unread answer: ${text.slice(0, 120)}`);
}
