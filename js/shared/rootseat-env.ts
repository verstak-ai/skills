// The root seating's switch and term, one for every harness plugin that seats a root session by
// its project cover before the first model request (opencode/rootseat.ts, dsh/rootseat.ts).
import { envName } from "../delivery/index.ts";

/** How long the first request waits for the seating; the variable is for probes. */
export const rootSeatMs = (): number => Number(process.env[envName("ROOT_SEAT_MS")] || 15_000);
/** Agent-launched headless runs opt out explicitly; a root without parentID is not proof of a human. */
export const rootSeatEnabled = (): boolean => process.env[envName("ROOT_SEAT")] !== "0";
