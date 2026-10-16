// The id of a client's service call (the plugin's launch line, its root seating): the bridge
// does not count it as agent work (#6510), and only such a call may name a seat provisional
// (bridge/provisional.ts). The harness picks the ids of the agent's calls; the plugin numbers
// them, so the agent cannot send this prefix.
import { ID_PREFIX } from "../delivery/index.ts";

export const SERVICE_ID = `${ID_PREFIX}service-`;
