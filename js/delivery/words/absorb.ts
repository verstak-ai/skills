// Absorbed channel answers (ABSORB): socket and status addresses cut out, the refusal to
// drop the channel's main seat while seats of other graphs stand on it.
import type { Lang } from "../lang.ts";

export interface AbsorbWords {
  socketHidden: () => string;
  statusHidden: () => string;
  mainSeatHeld: (name: string | null | undefined, held: string) => string;
}

export const ABSORB: Readonly<Record<Lang, AbsorbWords>> = {
  en: {
    socketHidden: () => "(the bridge holds the socket address — it is not shown to the agent)",
    statusHidden: () => "(the bridge holds the status address)",
    mainSeatHeld: (name, held) =>
      `[verstak-bridge] ${name ?? "this seat"} is the main seat of the bridge's channel, and seats of other graphs stand on the channel: ${held}. The bridge released nothing; to remove the main one, first remove them (revoke in their graph).`,
  },
};
