// The seat's local door (DOOR): the standing socket not raised (directory not private) or
// failed to rise (Node error).
import type { Lang } from "../lang.ts";

export interface DoorWords {
  privateDir: (bad: string) => string;
  listenFailed: (message: string) => string;
}

export const DOOR: Readonly<Record<Lang, DoorWords>> = {
  en: {
    privateDir: (bad) => `DOER: the local standing socket is not up — ${bad}`,
    listenFailed: (message) =>
      `DOER: the local standing socket did not come up (${message}) — the watchdog has nothing to attach to`,
  },
};
