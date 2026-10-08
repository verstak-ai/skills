import { homedir } from "node:os";
import { join } from "node:path";

import { HOME_BRIDGE_FILE, HOME_DIR } from "../delivery/index.ts";

/** Home copy of the bridge — a contract with harness configs; independent of the delivered file name. */
export const homeBridgePath = (): string => join(homedir(), HOME_DIR, HOME_BRIDGE_FILE);
