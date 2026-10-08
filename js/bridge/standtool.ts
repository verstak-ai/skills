// The bridge's stand tool as the harness sees it in tools/list (moment.ts inserts it
// into the server's list); stand.ts executes it.
import { STAND_TOOL, tool } from "../delivery/index.ts";
import { words } from "../shared/lang.ts";

export const STAND_TOOL_NAME = tool("stand");

const str = (description: string) => ({ type: "string", description });

export const standTool = () => {
  const w = words(STAND_TOOL);
  return {
    name: STAND_TOOL_NAME,
    description: w.description(),
    inputSchema: {
      type: "object",
      properties: {
        realm: str(w.realm()),
        karta: str(w.karta()),
        name: str(w.name()),
        room: str(w.room()),
        model: str(w.model()),
        mute_siblings: { type: "boolean", description: w.muteSiblings() },
        take: { type: "boolean", description: w.take() },
        room_karta: str(w.roomKarta()),
        repeat_knock: { type: "boolean", description: w.repeatKnock() },
        satellite_of: str(w.satelliteOf()),
        status: str(w.status()),
        cwd: str(w.cwd()),
      },
      required: ["realm"], // karta only takes a seat; busyness on a held seat goes without it (graph @nks/nks-dev, node #6509)
    },
  };
};
