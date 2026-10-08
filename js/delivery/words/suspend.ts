// A satellite's pause for a plugin reload (SUSPEND).
import type { Lang } from "../lang.ts";

export interface SuspendWords {
  noSeat: () => string;
  reason: () => string;
}

export const SUSPEND: Readonly<Record<Lang, SuspendWords>> = {
  en: {
    noSeat: () => "no satellite seat — nothing to pause",
    reason: () => "satellite pause",
  },
};
